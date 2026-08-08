'use client'

/**
 * /reset-password — lands here from the emailed reset link, after /auth/callback
 * has already exchanged the recovery code for a session (see forgot-password/page.tsx
 * and auth/callback/route.ts). Requires that session to set a new password.
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AuthShell, PasswordField, SubmitButton, ErrorBox, PasswordStrength, passwordIssue } from '@/components/auth/auth-ui'

const SECONDARY = '#6b7078', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [checking, setChecking] = React.useState(true)
  const [hasSession, setHasSession] = React.useState(false)
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm]   = React.useState('')
  const [error, setError]       = React.useState('')
  const [loading, setLoading]   = React.useState(false)
  const [done, setDone]         = React.useState(false)

  React.useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(!!data.user)
      setChecking(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const pwIssue = passwordIssue(password)
    if (pwIssue) { setError(pwIssue); return }
    if (password !== confirm) { setError('Those passwords don’t match.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
  }

  if (checking) return <AuthShell title="Reset your password" subtitle=" "><span /></AuthShell>

  if (!hasSession) {
    return (
      <AuthShell title="Link expired" subtitle="This reset link is no longer valid.">
        <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, textAlign: 'center', lineHeight: 1.6 }}>
          Reset links only work once and expire after a while. Request a fresh one below.
        </p>
        <Link href="/forgot-password" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 13.5, fontWeight: 700, color: JADE, textDecoration: 'none', fontFamily: MANROPE }}>
          Send a new reset link →
        </Link>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="You're all set.">
        <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, textAlign: 'center', lineHeight: 1.6, marginBottom: 16 }}>
          Your new password is saved. Head into your dashboard, or log in again next time with it.
        </p>
        <button
          onClick={() => { router.push('/dashboard'); router.refresh() }}
          style={{ display: 'block', width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: JADE, color: '#fff', fontSize: 14.5, fontWeight: 700, fontFamily: MANROPE, cursor: 'pointer' }}
        >
          Go to dashboard
        </button>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Make it at least 8 characters, with letters and numbers.">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <ErrorBox message={error} />}
        <PasswordField placeholder="New password" value={password} onChange={setPassword} autoComplete="new-password" />
        <PasswordStrength value={password} />
        <PasswordField placeholder="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        {confirm.length > 0 && confirm !== password && (
          <p style={{ fontSize: 12.5, color: '#dc2626', fontFamily: MANROPE, margin: '-4px 0 0' }}>Passwords don’t match yet.</p>
        )}
        <SubmitButton loading={loading}>Set new password</SubmitButton>
      </form>
    </AuthShell>
  )
}
