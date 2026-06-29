/**
 * /glossary — plain-language definitions of New Zealand political terms,
 * cross-linked to the Learn modules where relevant.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SectionDivider } from '@/components/ui/section-divider'
import { GLOSSARY } from '@/constants/glossary'

export const metadata: Metadata = {
  title: 'Glossary of NZ Political Terms',
  description: 'Plain-language definitions of the New Zealand political terms you’ll come across — from MMP to Royal assent.',
}

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export default function GlossaryPage() {
  const sorted = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term))
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 36px 40px' }}>
          <div style={{ marginBottom: 10 }}><SectionDivider type="official" label="Glossary" /></div>
          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 10px' }}>Political glossary</h1>
          <p style={{ fontSize: 17, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, maxWidth: 620, lineHeight: 1.6, margin: 0 }}>
            The jargon, in plain language. Every term you’ll bump into around Parliament and elections — explained simply.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '34px 36px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {sorted.map((t) => (
            <div key={t.term} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 5 }}>{t.term}</div>
              <p style={{ fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>{t.def}</p>
              {t.learn && (
                <Link href={t.learn.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none', marginTop: 10 }}>
                  {t.learn.label} <ArrowRight style={{ width: 13, height: 13 }} />
                </Link>
              )}
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 20 }}>
          Missing a term you’d like defined? <Link href="/contact" style={{ color: JADE, fontWeight: 700, textDecoration: 'none' }}>Let us know</Link>.
        </p>
      </div>
    </div>
  )
}
