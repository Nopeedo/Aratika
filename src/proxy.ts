import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { isPathBlocked } from '@/constants/features'

// Next.js 16 "proxy" convention (formerly middleware). Refreshes the Supabase
// auth session cookie, and gates features not yet in the current launch phase.
export async function proxy(request: NextRequest) {
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
