'use client'

import * as React from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, User as UserIcon, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthShell, Field, PasswordField, SubmitButton, ErrorBox, OrDivider, PasswordStrength, passwordIssue } from '@/components/auth/auth-ui'
import { GoogleSignIn } from '@/components/auth/google-signin'
import { INK, JADE, MANROPE, SECONDARY } from '@/constants/theme'

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  )
}

function RegisterInner() {
  const router = useRouter()
  const params = useSearchParams()
  const isPremium = params.get('plan') === 'premium'

  const [name, setName]         = React.useState('')
  const [email, setEmail]       = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm]   = React.useState('')
  const [error, setError]       = React.useState('')
  const [loading, setLoading]   = React.useState(false)
  const [sent, setSent]         = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const pwIssue = passwordIssue(password)
    if (pwIssue) { setError(pwIssue); return }
    if (password !== confirm) { setError('Those passwords don’t match.'); return }
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { name },
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    // If email confirmation is on, there's no active session yet → ask them to check email.
    if (data.session) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle="One more step to activate your account.">
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#e8f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <MailCheck style={{ width: 26, height: 26, color: JADE }} />
          </div>
          <p style={{ fontSize: 14, color: INK, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>
            We&apos;ve sent a confirmation link to <b>{email}</b>. Click it to verify your
            account, then log in.
          </p>
          <Link href="/login" style={{ display: 'inline-block', marginTop: 20, fontSize: 13.5, fontWeight: 700, color: JADE, textDecoration: 'none', fontFamily: MANROPE }}>
            Go to log in →
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={isPremium ? 'Start your free trial' : 'Create your free account'}
      subtitle={isPremium ? '14 days of Premium, free. Cancel anytime.' : 'Track MPs, bills and policies that matter to you.'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <ErrorBox message={error} />}
        <GoogleSignIn next={isPremium ? '/subscription' : '/dashboard'} onError={setError} />
        <OrDivider />
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
        <Field icon={UserIcon} type="text" placeholder="Your name" value={name} onChange={setName} autoComplete="name" />
        <Field icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} autoComplete="email" />
        <PasswordField placeholder="Password (min. 8 characters)" value={password} onChange={setPassword} autoComplete="new-password" />
        <PasswordStrength value={password} />
        <PasswordField placeholder="Confirm password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        {confirm.length > 0 && confirm !== password && (
          <p style={{ fontSize: 12.5, color: '#dc2626', fontFamily: MANROPE, margin: '-4px 0 0' }}>Passwords don’t match yet.</p>
        )}
        <SubmitButton loading={loading}>{isPremium ? 'Start free trial' : 'Create account'}</SubmitButton>
      </form>
      <p style={{ fontSize: 11.5, color: '#9aa0aa', fontFamily: MANROPE, textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
        By signing up you agree to our{' '}
        <Link href="/terms" style={{ color: SECONDARY, fontWeight: 600 }}>Terms</Link> and{' '}
        <Link href="/privacy" style={{ color: SECONDARY, fontWeight: 600 }}>Privacy Policy</Link>.
      </p>
      <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, textAlign: 'center', marginTop: 14 }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: JADE, fontWeight: 700, textDecoration: 'none' }}>Log in</Link>
      </p>
    </AuthShell>
  )
}
