/**
 * /take-action — the letter & submission studio hub (Premium).
 * Four guided tools: write to an MP, make a submission, write to a Minister,
 * request information under the OIA. You write the words; we give the structure.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight, PenLine, Mail, FileText, Briefcase, FileSearch, Sparkles, ShieldCheck,
} from 'lucide-react'
import { LETTER_TEMPLATES, LETTER_TEMPLATE_ORDER } from '@/constants/letter-templates'
import { SectionDivider } from '@/components/ui/section-divider'

export const metadata: Metadata = {
  title: 'Take Action — Write to an MP or make a submission',
  description:
    'Draft letters to MPs and Ministers, make select committee submissions, and file Official Information ' +
    'Act requests — with guided templates and official-channel links. An Arapono Premium feature.',
}

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const ICONS: Record<string, React.ElementType> = { Mail, FileText, Briefcase, FileSearch }

const STEPS = [
  { n: '1', t: 'Pick a template', d: 'Choose who you’re writing to and why.' },
  { n: '2', t: 'Write it your way', d: 'A correct structure with prompts — you write every word.' },
  { n: '3', t: 'Send it officially', d: 'Copy, download or email it, and lodge via official channels.' },
]

export default function TakeActionHub() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Hero */}
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '46px 36px 40px' }}>
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <SectionDivider type="official" label="Take Action" />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, color: JADE, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 999, padding: '3px 9px', fontFamily: MANROPE }}>
              <Sparkles style={{ width: 12, height: 12 }} /> Premium
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ width: 54, height: 54, borderRadius: 15, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PenLine style={{ width: 27, height: 27, color: JADE }} />
            </div>
            <div>
              <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 8px', lineHeight: 1.05 }}>
                Make your voice heard
              </h1>
              <p style={{ fontSize: 17, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, maxWidth: 640, lineHeight: 1.6, margin: 0 }}>
                Draft a letter to your MP or a Minister, make a submission on a bill, or request official
                information — properly structured and addressed. <b style={{ color: INK }}>You write every word</b>;
                Arapono gives you the format and the official channels to send it through.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '34px 36px 64px' }}>
        {/* Templates */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 16 }}>
          {LETTER_TEMPLATE_ORDER.map((id) => {
            const t = LETTER_TEMPLATES[id]
            const Icon = ICONS[t.icon] || Mail
            return (
              <Link key={id} href={`/take-action/${id}`} style={{ textDecoration: 'none' }}>
                <div className="policy-card" style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 20, padding: '22px 22px 18px', height: '100%', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 2px 4px rgba(12,14,18,.03)' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: 22, height: 22, color: JADE }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{t.label}</div>
                    <div style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.5, marginTop: 3 }}>{t.blurb}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE, paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
                    Open template <ArrowRight style={{ width: 14, height: 14 }} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* How it works */}
        <div style={{ marginTop: 34 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 14px' }}>How it works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {STEPS.map((s) => (
              <div key={s.n} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: JADE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, fontFamily: MANROPE, marginBottom: 8 }}>{s.n}</div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{s.t}</div>
                <div style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, marginTop: 2, lineHeight: 1.5 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust note */}
        <div style={{ marginTop: 24, display: 'flex', gap: 10, alignItems: 'flex-start', padding: '14px 16px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12 }}>
          <ShieldCheck style={{ width: 17, height: 17, color: JADE, flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55, margin: 0 }}>
            Arapono never sends anything on your behalf and never stores your letter — drafting happens entirely in your browser.
            We help with structure and official-channel links; the words and the decision to send are always yours. Non-partisan, always.
          </p>
        </div>
      </div>
    </div>
  )
}
