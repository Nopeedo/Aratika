import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { isPathBlocked } from '@/constants/features'

// Next.js 16 "proxy" convention (formerly middleware). Refreshes the Supabase
// auth session cookie, and gates features not yet in the current launch phase.
export async function proxy(request: NextRequest) {
  // Rescue auth links that landed on the wrong path. When a redirect target
  // isn't allowlisted verbatim in Supabase's URL config, Supabase falls back to
  // the project's Site URL — so a password-reset link arrives at `/?code=...`
  // instead of `/auth/callback?code=...`, and the user just lands in the app,
  // still logged out and with no way to set a password. Forward the params to
  // the real callback so the flow works regardless of that dashboard setting.
  const { pathname, searchParams } = request.nextUrl
  if (!pathname.startsWith('/auth/') &&
      (searchParams.has('code') || (searchParams.has('token_hash') && searchParams.has('type')))) {
    const url = request.nextUrl.clone() // keeps the query string intact
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url)
  }

  // /compare is retired. Its two jobs now live elsewhere: the coverage matrix
  // became a per-party "N of 11 topics" line on each party page, and the
  // side-by-side comparison is /policies/[topic], which shows every party on one
  // issue. Redirect rather than gate — the phase gate sends a route to
  // /coming-soon, and this page is not coming, it has moved.
  //
  // Redirecting rather than deleting because /compare is linked from about
  // twenty places in the app plus anyone's bookmarks, and "compare the parties"
  // is a reasonable thing to have saved.
  if (pathname === '/compare' || pathname.startsWith('/compare/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/policies'
    url.search = ''
    return NextResponse.redirect(url)
  }

  /**
   * Signed-in visitors get /hub instead of the landing page.
   *
   * This was a getSession() call inside app/page.tsx. Reading cookies in a
   * server component opts the route out of static rendering, so EVERY visitor
   * to the homepage — including the campaign traffic that lands there first —
   * paid a per-request render (1.3-2.5s to first byte, never cached) so that
   * the minority with an account could be redirected. Here it costs a cookie
   * lookup on a request this proxy was already handling, and the landing page
   * itself is prerendered and served from the CDN.
   *
   * Cookie presence, not a verified session: a routing decision, not an auth
   * boundary, exactly as the getSession() it replaces was (getSession reads
   * the local cookie with no network round trip and can't be trusted either).
   * The worst a stale or forged cookie earns is a redirect to a page that then
   * renders empty; every real auth check still calls getUser(). Supabase names
   * these cookies sb-<project-ref>-auth-token, sometimes chunked with a .0/.1
   * suffix, so match the shape rather than an exact name.
   *
   * ?full=1 — the hub's "view the full homepage" link — still shows the
   * landing page, as it always did.
   */
  if (pathname === '/' && !searchParams.has('full')) {
    const signedIn = request.cookies.getAll()
      .some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token') && !!c.value)
    if (signedIn) {
      const url = request.nextUrl.clone()
      url.pathname = '/hub'
      return NextResponse.redirect(url)
    }
  }

  if (isPathBlocked(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/coming-soon'
    url.search = ''
    return NextResponse.redirect(url)
  }
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|geojson)$).*)',
  ],
}
