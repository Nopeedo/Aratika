'use client'

/** Shared UI for the auth pages (login / register / reset). */

import * as React from 'react'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-dot-grid" style={{ background: '#fff', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '64px 24px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: '#0F172A', color: '#36e08a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, fontFamily: MANROPE }}>A</div>
          <span style={{ fontSize: 19, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Arapono</span>
        </div>
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 20, padding: '28px 28px 24px', boxShadow: '0 2px 4px rgba(12,14,18,.03), 0 24px 48px -28px rgba(12,14,18,.22)' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px', textAlign: 'center' }}>{title}</h1>
          <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 22px', textAlign: 'center' }}>{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

export function Field({ icon: Icon, type, placeholder, value, onChange, autoComplete }: {
  icon: React.ElementType; type: string; placeholder: string; value: string; onChange: (v: string) => void; autoComplete?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
      <Icon style={{ width: 16, height: 16, color: TERTIARY, margin: '0 11px', flexShrink: 0 }} />
      <input
        type={type} placeholder={placeholder} value={value} required autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        style={{ flex: 1, border: 'none', outline: 'none', padding: '11px 11px 11px 0', fontSize: 14, fontFamily: 'var(--font-geist-sans), sans-serif', color: INK }}
      />
    </div>
  )
}

export function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={loading} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
      marginTop: 4, padding: '12px', borderRadius: 10, border: 'none',
      background: loading ? '#94d3ad' : JADE, color: '#fff',
      fontSize: 14.5, fontWeight: 700, fontFamily: MANROPE, cursor: loading ? 'default' : 'pointer',
    }}>
      {children} {!loading && <ArrowRight style={{ width: 16, height: 16 }} />}
    </button>
  )
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 12px' }}>
      <AlertCircle style={{ width: 15, height: 15, color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 12.5, color: '#b91c1c', fontFamily: MANROPE, lineHeight: 1.4 }}>{message}</span>
    </div>
  )
}

/** "Continue with Google" — social login via Supabase OAuth. Requires the Google
 *  provider to be enabled in the Supabase dashboard; until then it errors cleanly. */
export function GoogleButton({ next = '/dashboard', onError }: { next?: string; onError?: (msg: string) => void }) {
  const [loading, setLoading] = React.useState(false)
  async function handle() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    // On success the browser is redirected to Google, so we only get here on error.
    if (error) { onError?.(error.message); setLoading(false) }
  }
  return (
    <button type="button" onClick={handle} disabled={loading} aria-label="Continue with Google" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      padding: '11px', borderRadius: 10, border: `1px solid ${BORDER}`, background: '#fff',
      fontSize: 14, fontWeight: 600, fontFamily: MANROPE, color: INK, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1,
    }}>
      <GoogleG />
      {loading ? 'Redirecting…' : 'Continue with Google'}
    </button>
  )
}

function GoogleG() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  )
}

export function OrDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
      <span style={{ flex: 1, height: 1, background: BORDER }} />
      <span style={{ fontSize: 11.5, fontWeight: 600, color: TERTIARY, fontFamily: MANROPE }}>or</span>
      <span style={{ flex: 1, height: 1, background: BORDER }} />
    </div>
  )
}

/** Password rules. Kept in sync with the server-side Supabase password policy;
 *  the server is the real enforcement, this is fast client-side feedback. */
export const MIN_PASSWORD_LENGTH = 8

/** Returns an error message if the password fails a basic rule, else null. */
export function passwordIssue(pw: string): string | null {
  if (pw.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return 'Use a mix of letters and numbers.'
  return null
}

function scorePassword(pw: string): number {
  let s = 0
  if (pw.length >= MIN_PASSWORD_LENGTH) s++
  if (pw.length >= 12) s++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^a-zA-Z0-9]/.test(pw)) s++
  return Math.min(s, 4)
}

export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null
  const score = scorePassword(value)          // 0–4
  const meta = [
    { label: 'Too weak', color: '#dc2626' },
    { label: 'Weak', color: '#dc2626' },
    { label: 'Fair', color: '#d97706' },
    { label: 'Good', color: '#2563eb' },
    { label: 'Strong', color: JADE },
  ][score]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: -6 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i < score ? meta.color : BORDER, transition: 'background .2s' }} />
        ))}
      </div>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: meta.color, fontFamily: MANROPE }}>{meta.label}</span>
    </div>
  )
}
