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
