/**
 * /subscription — Aratika Premium pricing page.
 * The Upgrade button starts a Stripe Checkout session via /api/stripe/checkout.
 * NOTE: the price shown here is a placeholder — set the real amount on your
 * Stripe Price, and update the display below to match.
 */

import type { Metadata } from 'next'
import { Check, Sparkles, Heart } from 'lucide-react'
import { SectionDivider } from '@/components/ui/section-divider'
import { UpgradeButton } from '@/components/billing/billing-buttons'

export const metadata: Metadata = {
  title: 'Aratika Premium',
  description: 'Support an independent, non-partisan platform and unlock the Take Action studio, tracking and alerts.',
}

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

// Display only — the actual charge comes from your Stripe Price. Keep in sync.
const PRICE_DISPLAY = 'NZ$20'
const PRICE_PERIOD = '/ month'

const FREE = [
  'Full MP, party, bill & electorate information',
  'Interactive electorate map',
  'All Learn modules + saved progress',
  'Policy Hub & public polls',
]
const PREMIUM = [
  'Everything in Free',
  'Take Action studio — draft & export letters and submissions',
  'Bookmark & track MPs, bills and policies',
  'Activity alerts when things you follow change',
  'Support an independent, non-partisan platform',
]

export default function SubscriptionPage() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div className="bg-dot-grid" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '48px 36px 40px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <SectionDivider type="official" label="Aratika Premium" />
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 10px' }}>
            Do more with Aratika
          </h1>
          <p style={{ fontSize: 17, color: SECONDARY, fontFamily: MANROPE, maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
            The information is always free. Premium adds the tools to act on it — and helps keep Aratika
            independent and non-partisan.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '36px 36px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
          {/* Free */}
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 20, padding: '26px 24px' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: SECONDARY, fontFamily: MANROPE, letterSpacing: '.04em', textTransform: 'uppercase' }}>Free</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '8px 0 2px' }}>NZ$0</div>
            <div style={{ fontSize: 13, color: TERTIARY, fontFamily: MANROPE, marginBottom: 18 }}>Always free, for everyone</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FREE.map((f) => (
                <li key={f} style={{ display: 'flex', gap: 9, fontSize: 14, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.45 }}>
                  <Check style={{ width: 16, height: 16, color: TERTIARY, flexShrink: 0, marginTop: 1 }} /> {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Premium */}
          <div style={{ background: '#fff', border: `2px solid ${JADE}`, borderRadius: 20, padding: '26px 24px', position: 'relative', boxShadow: '0 8px 28px rgba(31,138,76,.10)' }}>
            <span style={{ position: 'absolute', top: -12, right: 20, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, color: '#1c1605', background: '#F5C518', borderRadius: 999, padding: '4px 11px', fontFamily: MANROPE }}>
              <Sparkles style={{ width: 12, height: 12 }} /> Most popular
            </span>
            <div style={{ fontSize: 14, fontWeight: 800, color: JADE, fontFamily: MANROPE, letterSpacing: '.04em', textTransform: 'uppercase' }}>Premium</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '8px 0 2px' }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{PRICE_DISPLAY}</span>
              <span style={{ fontSize: 14, color: TERTIARY, fontFamily: MANROPE }}>{PRICE_PERIOD}</span>
            </div>
            <div style={{ fontSize: 13, color: TERTIARY, fontFamily: MANROPE, marginBottom: 18 }}>Cancel anytime</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PREMIUM.map((f) => (
                <li key={f} style={{ display: 'flex', gap: 9, fontSize: 14, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.45 }}>
                  <Check style={{ width: 16, height: 16, color: JADE, flexShrink: 0, marginTop: 1 }} /> {f}
                </li>
              ))}
            </ul>
            <UpgradeButton style={{ width: '100%', justifyContent: 'center' }} />
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', color: SECONDARY, fontFamily: MANROPE, fontSize: 12.5 }}>
          <Heart style={{ width: 14, height: 14, color: JADE }} /> Secure payments by Stripe · Your card details never touch Aratika’s servers.
        </div>
      </div>
    </div>
  )
}
