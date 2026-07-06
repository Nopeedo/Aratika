/**
 * PremiumCta — the free-vs-premium pricing block. Gated (Phase 2); rendered at
 * the very foot of the page behind isEnabled('premium'). Extracted verbatim from
 * the homepage during the beginner→expert reorder.
 */

import Link from 'next/link'
import { Crown } from 'lucide-react'

const JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function PremiumCta() {
  return (
    <section style={{ background: '#0c0e12' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '72px clamp(18px, 5vw, 36px)' }}>

        <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,197,24,0.15)', color: '#F5C518', borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 700, fontFamily: MANROPE, marginBottom: 16 }}>
            <Crown style={{ width: 13, height: 13 }} />
            Premium
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.01em', color: '#ffffff', fontFamily: MANROPE, marginBottom: 12 }}>Go deeper with Premium</h2>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#6b7078', fontFamily: MANROPE, lineHeight: 1.6 }}>
            Everything in free, plus detailed voting records, live dashboard tracking, and alerts — so you never miss what your MP does next.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 16, maxWidth: 640, margin: '0 auto' }}>

          {/* Free */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '24px 22px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7078', fontFamily: MANROPE, marginBottom: 6 }}>Free</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif', marginBottom: 20 }}>$0</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['All MP profiles', 'Party overviews', 'Policy comparisons', 'Interactive map', 'Bills tracker', 'News feed', 'Public polls'].map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: '#9aa0aa', fontFamily: MANROPE }}>
                  <span style={{ color: JADE, fontWeight: 700 }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/register" style={{ display: 'block', textAlign: 'center', padding: '11px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', color: '#ffffff', fontSize: 14, fontWeight: 700, fontFamily: MANROPE, textDecoration: 'none' }}>
              Sign up free
            </Link>
          </div>

          {/* Premium */}
          <div style={{ background: 'linear-gradient(145deg, rgba(245,197,24,0.12), rgba(245,197,24,0.04))', border: '1px solid rgba(245,197,24,0.25)', borderRadius: 20, padding: '24px 22px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#F5C518', color: '#1c1605', fontSize: 11, fontWeight: 800, fontFamily: MANROPE, borderRadius: 999, padding: '4px 12px', whiteSpace: 'nowrap' }}>
              14-day free trial
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#F5C518', fontFamily: MANROPE, marginBottom: 6 }}>Premium</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' }}>$20</span>
              <span style={{ fontSize: 13, color: '#6b7078', fontFamily: MANROPE }}>/month</span>
            </div>
            <div style={{ fontSize: 11, color: '#6b7078', fontFamily: MANROPE, marginBottom: 20 }}>or $200/year — save $40</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Everything in Free', 'Detailed voting records', 'Bookmark MPs & bills', 'Live personal dashboard', 'Alerts & notifications', 'Advanced comparisons', 'Data export (PDF/CSV)'].map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: '#9aa0aa', fontFamily: MANROPE }}>
                  <span style={{ color: '#F5C518', fontWeight: 700 }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/register?plan=premium" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 0', borderRadius: 10, background: '#F5C518', color: '#1c1605', fontSize: 14, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none' }}>
              <Crown style={{ width: 15, height: 15 }} />
              Start free trial
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}
