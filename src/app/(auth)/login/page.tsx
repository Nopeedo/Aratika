'use client'

import * as React from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthShell, Field, SubmitButton, ErrorBox, GoogleButton, OrDivider } from '@/components/auth/auth-ui'

const SECONDARY = '#6b7078', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your Arapono account.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <ErrorBox message={error} />}
        <GoogleButton next="/dashboard" onError={setError} />
        <OrDivider />
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
        <Field icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} autoComplete="email" />
        <Field icon={Lock} type="password" placeholder="Password" value={password} onChange={setPassword} autoComplete="current-password" />
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
