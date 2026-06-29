/**
 * Session refresh for Next.js middleware — keeps the Supabase auth cookie fresh
 * on every request so Server Components see an up-to-date session.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: refreshes the auth token. Do not run code between client creation
  // and getUser() — it can cause hard-to-debug session issues.
  try {
    await supabase.auth.getUser()
  } catch {
    // A malformed/stale auth cookie can make the SSR client throw while parsing
    // it. Never let that 500 the whole site — clear the bad Supabase cookies so
    // the browser recovers to a logged-out state, and continue.
    request.cookies.getAll().forEach(({ name }) => {
      if (name.startsWith('sb-')) supabaseResponse.cookies.set(name, '', { maxAge: 0 })
    })
  }

  return supabaseResponse
}
