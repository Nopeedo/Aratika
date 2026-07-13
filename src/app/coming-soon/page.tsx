/**
 * /coming-soon — shown when a feature that isn't in the current launch phase is
 * requested. Phase 1 is focused on the 2026 election; richer tools follow.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { Sparkles, ArrowRight, Vote, Map, Scale } from 'lucide-react'

export const metadata: Metadata = { title: 'Coming soon', robots: { index: false, follow: false } }

const INK = '#0c0e12', SECONDARY = '#6b7078', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export default function ComingSoonPage() {
  return (
    <div style={{ background: '#fff', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 560, padding: '48px 36px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <Sparkles style={{ width: 28, height: 28, color: JADE }} />
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 12px' }}>Coming soon</h1>
        <p style={{ fontSize: 16, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 26px' }}>
          Right now Arapono is focused on one thing: helping you understand and be ready for the <b style={{ color: INK }}>2026 election</b>.
          This feature is part of a later phase — we’ll switch it on soon. In the meantime, here’s where to start:
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/elections" style={btn(true)}><Vote style={ic} /> Elections 2026</Link>
          <Link href="/map" style={btn(false)}><Map style={ic} /> Find your electorate</Link>
          <Link href="/policies" style={btn(false)}><Scale style={ic} /> Where parties stand</Link>
          <Link href="/start" style={btn(false)}>Find what matters to you <ArrowRight style={ic} /></Link>
        </div>
      </div>
    </div>
  )
}

const ic: React.CSSProperties = { width: 16, height: 16 }
const btn = (primary: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 800, fontFamily: MANROPE,
  padding: '11px 18px', borderRadius: 11, textDecoration: 'none',
  background: primary ? JADE : '#fff', color: primary ? '#fff' : INK, border: primary ? 'none' : `1px solid ${BORDER}`,
})
