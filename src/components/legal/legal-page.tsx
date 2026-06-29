/**
 * LegalPage — shared chrome for Privacy / Terms / Contact pages.
 * Renders a header, a clear "draft pending legal review" notice, and styles the
 * semantic prose passed as children.
 */

import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { SectionDivider } from '@/components/ui/section-divider'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function LegalPage({
  title, subtitle, updated, children,
}: {
  title: string
  subtitle: string
  updated: string
  children: ReactNode
}) {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '44px 36px 34px' }}>
          <div style={{ marginBottom: 10 }}><SectionDivider type="official" label="Legal" /></div>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 8px', lineHeight: 1.1 }}>{title}</h1>
          <p style={{ fontSize: 16, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.6 }}>{subtitle}</p>
          <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, margin: '12px 0 0' }}>Last updated: {updated}</p>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '26px 36px 64px' }}>
        <div style={{ display: 'flex', gap: 10, padding: '13px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, marginBottom: 28 }}>
          <AlertTriangle style={{ width: 16, height: 16, color: '#b45309', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12.5, color: '#92400e', fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
            <b>Working draft.</b> This is a plain-language starting point, not legal advice. Have it reviewed by a New Zealand lawyer before relying on it or launching publicly.
          </p>
        </div>

        <div className="legal-prose">{children}</div>
      </div>

      <style>{`
        .legal-prose h2 { font-family: ${MANROPE}; font-size: 18px; font-weight: 800; color: ${INK}; margin: 28px 0 8px; }
        .legal-prose p  { font-family: ${MANROPE}; font-size: 14.5px; line-height: 1.7; color: #33373f; margin: 0 0 12px; }
        .legal-prose ul { margin: 0 0 12px; padding-left: 20px; }
        .legal-prose li { font-family: ${MANROPE}; font-size: 14.5px; line-height: 1.65; color: #33373f; margin: 0 0 6px; }
        .legal-prose a  { color: #1F8A4C; font-weight: 700; text-decoration: none; }
        .legal-prose strong { color: ${INK}; font-weight: 700; }
        .legal-prose h2:first-child { margin-top: 0; }
      `}</style>
    </div>
  )
}
