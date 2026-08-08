'use client'

import * as React from 'react'
import Link from 'next/link'
import { Mail, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthShell, Field, SubmitButton, ErrorBox } from '@/components/auth/auth-ui'

const INK = '#0c0e12', SECONDARY = '#6b7078', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = React.useState('')
  const [error, setError]     = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [sent, setSent]       = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/reset-password')}`,
    })
    setLoading(false)
    // Supabase doesn't reveal whether the email is registered (anti-enumeration) —
    // show the same "check your email" state regardless, matching signup's pattern.
    if (error) { setError(error.message); return }
    setSent(true)
  }

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle="If that address has an account, a reset link is on its way.">
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#e8f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <MailCheck style={{ width: 26, height: 26, color: JADE }} />
          </div>
          <p style={{ fontSize: 14, color: INK, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>
            Click the link in the email to choose a new password.
          </p>
          <Link href="/login" style={{ display: 'inline-block', marginTop: 20, fontSize: 13.5, fontWeight: 700, color: JADE, textDecoration: 'none', fontFamily: MANROPE }}>
            Go to log in →
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we'll send you a reset link.">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <ErrorBox message={error} />}
        <Field icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} autoComplete="email" />
        <SubmitButton loading={loading}>Send reset link</SubmitButton>
      </form>
      <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, textAlign: 'center', marginTop: 20 }}>
        Remembered it? <Link href="/login" style={{ color: JADE, fontWeight: 700, textDecoration: 'none' }}>Log in</Link>
      </p>
    </AuthShell>
  )
}
