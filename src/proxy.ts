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
