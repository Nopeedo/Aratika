'use client'

/**
 * PremiumGate — shows premium content to subscribers; everyone else gets a faded
 * preview + an upgrade prompt. (Billing/Stripe is a later task; for now this
 * gates on the existing isPremium flag.)
 */

import Link from 'next/link'
import { Lock, Sparkles, LogIn } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { PREMIUM_ENABLED } from '@/constants/features'

const INK = '#0c0e12', SECONDARY = '#6b7078', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function PremiumGate({
  children, preview, featureName = 'This feature', perks = [],
}: {
  children: React.ReactNode
  preview?: React.ReactNode
  featureName?: string
  perks?: string[]
}) {
  const { user, loading, isPremium } = useUser()

  // Paid tier off → no gate, content is free for everyone.
  if (!PREMIUM_ENABLED || isPremium) return <>{children}</>

  if (loading) {
    return <div style={{ height: 200, borderRadius: 16, background: '#f4f2ee', border: `1px solid ${BORDER}` }} />
  }

  return (
    <div style={{ position: 'relative' }}>
      {preview && (
        <div style={{ position: 'relative', maxHeight: 320, overflow: 'hidden', borderRadius: 16, opacity: 0.55, pointerEvents: 'none', userSelect: 'none' }} aria-hidden>
          {preview}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(255,255,255,0) 30%, #fff 100%)' }} />
        </div>
      )}

      <div style={{
        marginTop: preview ? -40 : 0, position: 'relative', zIndex: 1,
        background: '#fff', border: `1.5px solid ${BORDER}`, borderRadius: 18,
        padding: '26px 24px', textAlign: 'center', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto',
        boxShadow: '0 8px 28px rgba(12,14,18,.08)',
      }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <Lock style={{ width: 22, height: 22, color: JADE }} />
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, marginBottom: 6 }}>
          <Sparkles style={{ width: 13, height: 13 }} /> Arapono Premium
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 8px' }}>{featureName} is a Premium feature</h3>
        <p style={{ fontSize: 14, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 16px' }}>
          Upgrade to draft and export letters and submissions. You write every word — Arapono gives you the
          right structure and official-channel links.
        </p>

        {perks.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 auto 18px', maxWidth: 360, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {perks.map((p) => (
              <li key={p} style={{ display: 'flex', gap: 8, fontSize: 13.5, color: '#33373f', fontFamily: MANROPE }}>
                <span style={{ color: JADE, fontWeight: 800 }}>✓</span> {p}
              </li>
            ))}
          </ul>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/subscription" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: INK, color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: MANROPE, padding: '11px 20px', borderRadius: 11, textDecoration: 'none' }}>
            <Sparkles style={{ width: 15, height: 15 }} /> {user ? 'Upgrade to Premium' : 'See Premium plans'}
          </Link>
          {!user && (
            <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: INK, fontWeight: 700, fontSize: 14, fontFamily: MANROPE, padding: '11px 18px', borderRadius: 11, border: `1px solid ${BORDER}`, textDecoration: 'none' }}>
              <LogIn style={{ width: 15, height: 15 }} /> Log in
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
