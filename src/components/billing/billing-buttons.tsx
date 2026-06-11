'use client'

/**
 * Client buttons that drive Stripe via the API routes.
 * UpgradeButton → /api/stripe/checkout, ManageBillingButton → /api/stripe/portal.
 */

import { useState } from 'react'
import { Sparkles, CreditCard, Loader2 } from 'lucide-react'

const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

async function go(endpoint: string, onError: (msg: string) => void) {
  const res = await fetch(endpoint, { method: 'POST' })
  if (res.status === 401) { window.location.href = '/login?next=/subscription'; return }
  const json = await res.json().catch(() => ({}))
  if (json.url) window.location.href = json.url
  else onError(json.error || 'Something went wrong. Please try again.')
}

export function UpgradeButton({ label = 'Upgrade to Premium', style }: { label?: string; style?: React.CSSProperties }) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  return (
    <div>
      <button
        onClick={async () => { setLoading(true); setErr(''); await go('/api/stripe/checkout', (m) => { setErr(m); setLoading(false) }) }}
        disabled={loading}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14.5, fontWeight: 800, fontFamily: MANROPE,
          padding: '12px 22px', borderRadius: 12, border: 'none', cursor: loading ? 'default' : 'pointer',
          background: '#F5C518', color: '#1c1605', opacity: loading ? 0.7 : 1, ...style,
        }}
      >
        {loading ? <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> : <Sparkles style={{ width: 16, height: 16 }} />}
        {loading ? 'Redirecting…' : label}
      </button>
      {err && <div style={{ fontSize: 12, color: '#b91c1c', fontFamily: MANROPE, marginTop: 8 }}>{err}</div>}
    </div>
  )
}

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  return (
    <div>
      <button
        onClick={async () => { setLoading(true); setErr(''); await go('/api/stripe/portal', (m) => { setErr(m); setLoading(false) }) }}
        disabled={loading}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, fontFamily: MANROPE,
          padding: '10px 16px', borderRadius: 11, border: '1px solid #e9e7e2', background: '#fff', color: '#0c0e12', cursor: 'pointer',
        }}
      >
        {loading ? <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" /> : <CreditCard style={{ width: 15, height: 15 }} />}
        Manage billing
      </button>
      {err && <div style={{ fontSize: 12, color: '#b91c1c', fontFamily: MANROPE, marginTop: 8 }}>{err}</div>}
    </div>
  )
}
