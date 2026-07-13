/**
 * /polls — Arapono community polls (non-scientific). The voting feature needs
 * vote storage, so this is an honest "coming soon" with the disclaimer up front.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { BarChart3, Info, ArrowRight } from 'lucide-react'
import { SectionDivider } from '@/components/ui/section-divider'
import { POLL_DISCLAIMER } from '@/constants/site'

export const metadata: Metadata = {
  title: 'Public Polls',
  description: 'Arapono community polls — share your view on the issues. Non-scientific; for engagement, not measurement.',
}

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export default function PollsPage() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 36px 40px' }}>
          <div style={{ marginBottom: 10 }}><SectionDivider type="official" label="Public Polls" /></div>
          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 10px' }}>Have your say</h1>
          <p style={{ fontSize: 17, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, maxWidth: 620, lineHeight: 1.6, margin: 0 }}>
            Quick community polls on the issues in front of Parliament — a way to see how Arapono readers are feeling.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '34px 36px 64px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Coming soon */}
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 18, padding: '30px 26px', textAlign: 'center', background: '#fff' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <BarChart3 style={{ width: 26, height: 26, color: JADE }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 8px' }}>Polls are coming soon</h2>
          <p style={{ fontSize: 14.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.65, margin: '0 auto', maxWidth: 480 }}>
            We’re building quick, one-tap polls so you can weigh in on current issues and instantly see how other readers
            voted. Sign in to be ready to take part.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' }}>
            <Link href="/learn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 11, background: JADE, color: '#fff', fontSize: 13.5, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none' }}>
              Explore Learn <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
            <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 11, background: '#fff', border: `1px solid ${BORDER}`, color: INK, fontSize: 13.5, fontWeight: 700, fontFamily: MANROPE, textDecoration: 'none' }}>
              Create an account
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
          <Info style={{ width: 16, height: 16, color: SECONDARY, flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.6 }}>{POLL_DISCLAIMER}</p>
        </div>
      </div>
    </div>
  )
}
