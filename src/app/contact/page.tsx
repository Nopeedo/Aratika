/**
 * /contact — general contact + "submit a correction".
 * Uses mailto links (no server-side email yet). The corrections channel is part
 * of our accuracy/credibility commitment.
 */

import type { Metadata } from 'next'
import { Mail, Flag, ShieldCheck, ArrowUpRight } from 'lucide-react'
import { SectionDivider } from '@/components/ui/section-divider'
import { SITE } from '@/constants/site'

export const metadata: Metadata = {
  title: 'Contact & Corrections',
  description: 'Get in touch with Arapono, or report a correction. Accuracy matters to us.',
}

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const EMAIL = SITE.email // hello@arapono.nz

export default function ContactPage() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '44px 36px 34px' }}>
          <div style={{ marginBottom: 10 }}><SectionDivider type="official" label="Contact" /></div>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 8px', lineHeight: 1.1 }}>Contact &amp; corrections</h1>
          <p style={{ fontSize: 16, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.6, maxWidth: 620 }}>
            We’d love to hear from you — and if we’ve got something wrong, we want to fix it fast.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '30px 36px 64px', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Two action cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '22px 24px' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: SURFACE, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Mail style={{ width: 21, height: 21, color: JADE }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE }}>General enquiries</div>
            <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: '4px 0 14px' }}>Questions, feedback, partnerships, or media — drop us a line.</p>
            <a href={`mailto:${EMAIL}?subject=Arapono%20enquiry`} style={btn(true)}>Email us <ArrowUpRight style={ic} /></a>
          </div>

          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '22px 24px' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Flag style={{ width: 21, height: 21, color: '#dc2626' }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Submit a correction</div>
            <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: '4px 0 14px' }}>Spotted an error? Tell us the page and the correct information, with a source if you can.</p>
            <a href={`mailto:${EMAIL}?subject=Correction%20%E2%80%94%20(page%3F)&body=Page%3A%20%0ACorrection%3A%20%0ASource%3A%20`} style={btn(false)}>Report a correction <ArrowUpRight style={ic} /></a>
          </div>
        </div>

        {/* How corrections work */}
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <ShieldCheck style={{ width: 18, height: 18, color: JADE }} />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>How we handle corrections</h2>
          </div>
          <p style={{ fontSize: 14, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.7, margin: '0 0 10px' }}>
            Accuracy and non-partisanship are the whole point of Arapono. When you report an error, we check it against the
            official source — the New Zealand Parliament, the Electoral Commission, Stats NZ, or legislation.govt.nz — and
            correct it promptly if it’s wrong. We’re grateful for the help: it keeps the platform trustworthy.
          </p>
          <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>
            Please include the <strong>page or person</strong>, what’s <strong>incorrect</strong>, and ideally a <strong>link to the correct official source</strong>.
          </p>
        </div>

        {/* Official matters note */}
        <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>
          Arapono is an independent platform and can’t help with official or urgent matters. To enrol, vote, or contact an
          agency directly, use the official services at{' '}
          <a href="https://www.vote.nz" target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 700, textDecoration: 'none' }}>vote.nz</a>{' '}or{' '}
          <a href="https://www.parliament.nz" target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 700, textDecoration: 'none' }}>parliament.nz</a>.
        </p>
      </div>
    </div>
  )
}

const ic: React.CSSProperties = { width: 13, height: 13 }
function btn(primary: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, fontFamily: MANROPE,
    padding: '10px 16px', borderRadius: 11, textDecoration: 'none',
    background: primary ? JADE : '#fff', color: primary ? '#fff' : INK, border: primary ? 'none' : `1px solid ${BORDER}`,
  }
}
