/**
 * /auth/callback — turns an emailed link (or OAuth redirect) into a session,
 * then sends the user into the app.
 *
 * Handles BOTH link formats Supabase can send:
 *   • PKCE     → ?code=...            → exchangeCodeForSession
 *   • OTP/hash → ?token_hash=&type=   → verifyOtp
 * Older projects and some email templates use the second form, so supporting
 * only `code` silently breaks password-reset links.
 */

import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  // A recovery link must always land on the "choose a new password" form. Don't
  // trust `next` alone: if the redirect target isn't allowlisted verbatim in
  // Supabase's URL config, the query string can be dropped and the user would
  // silently end up on the dashboard instead of being able to set a password.
  const isRecovery = type === 'recovery'
  const next = isRecovery ? '/reset-password' : (searchParams.get('next') ?? '/dashboard')

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
    console.error('[auth/callback] exchangeCodeForSession failed:', error.message)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type: type as EmailOtpType, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(`${origin}${next}`)
    console.error('[auth/callback] verifyOtp failed:', error.message)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  const err = searchParams.get('error_description') || searchParams.get('error')
  console.error('[auth/callback] no code/token_hash on callback.', err ? `Provider said: ${err}` : 'request:', request.url)
  return NextResponse.redirect(`${origin}/login?error=Could not sign you in. Please try again.`)
}
