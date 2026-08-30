'use client'

import * as React from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import { Info } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthShell, Field, PasswordField, SubmitButton, ErrorBox, OrDivider } from '@/components/auth/auth-ui'
import { GoogleSignIn } from '@/components/auth/google-signin'
import { JADE, MANROPE, SECONDARY } from '@/constants/theme'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}

function LoginInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail]       = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError]       = React.useState(params.get('error') ?? '')
  const [loading, setLoading]   = React.useState(false)

  /**
   * Where to go after signing in. Pages that gate on a session redirect here
   * with ?next= — and this page used to ignore it and push /dashboard
   * regardless, so signing in from /settings dropped you on the wrong page.
   * Only same-site paths are honoured: a bare leading slash, not //host.
   */
  const rawNext = params.get('next') ?? ''
  const nextPath = /^\/(?!\/)/.test(rawNext) ? rawNext : '/dashboard'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // Supabase's raw messages are API English. The two a real person hits
      // are translated into what to actually do; anything else passes through.
      setError(
        /not confirmed/i.test(error.message)
          ? 'Your email isn’t confirmed yet. Tap the link in the email we sent you, then log in here.'
          : /invalid login credentials/i.test(error.message)
            ? 'That email and password don’t match an account. If you’re new here, create a free account below.'
            : error.message,
      )
      setLoading(false)
      return
    }
    router.push(nextPath)
    router.refresh()
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your Arapono account.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* The nudge. Someone sent here from a gated page tapped a real button
            and got a login form — without this line, that reads as the button
            being broken. Name what they were trying to reach and both ways
            forward, since a brand-new visitor needs Register, not "welcome
            back". */}
        {params.get('from') === 'dashboard' && !error && (
          <div style={{ display: 'flex', gap: 9, padding: '11px 13px', background: '#ecfdf5', border: `1px solid ${JADE}2e`, borderRadius: 11 }}>
            <Info style={{ width: 15, height: 15, color: JADE, flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, color: '#1c1917', fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
              Your dashboard is where everything you track lives — it needs an account so it can follow you between visits.
              Log in, or <Link href="/register" style={{ color: JADE, fontWeight: 800, textDecoration: 'none' }}>create a free one</Link> in under a minute.
            </p>
          </div>
        )}
        {error && <ErrorBox message={error} />}
        <GoogleSignIn next={nextPath} onError={setError} />
        <OrDivider />
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
        <Field icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} autoComplete="email" />
        <PasswordField placeholder="Password" value={password} onChange={setPassword} autoComplete="current-password" />
        <div style={{ textAlign: 'right', marginTop: -4 }}>
          <Link href="/forgot-password" style={{ fontSize: 12.5, color: JADE, fontWeight: 600, textDecoration: 'none', fontFamily: MANROPE }}>
            Forgot password?
          </Link>
        </div>
        <SubmitButton loading={loading}>Log in</SubmitButton>
      </form>
      <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, textAlign: 'center', marginTop: 20 }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" style={{ color: JADE, fontWeight: 700, textDecoration: 'none' }}>Sign up free</Link>
      </p>
    </AuthShell>
  )
}
