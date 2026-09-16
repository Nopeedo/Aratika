/**
 * LegalPage — shared chrome for Privacy / Terms / Contact pages.
 * Renders a header and styles the semantic prose passed as children.
 *
 * It used to carry a "working draft, have a lawyer review it" banner. Removed
 * 16 Sep 2026 on the editor's call: the privacy policy was rewritten from an
 * audit of what the code actually does, and a public page that announces
 * itself as unreviewed undercuts the thing it is there to reassure people of.
 */

import type { ReactNode } from 'react'
import { SectionDivider } from '@/components/ui/section-divider'
import { BORDER, INK, MANROPE, SECONDARY, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

export function LegalPage({
  title, subtitle, updated, children,
}: {
  title: string
  subtitle: string
  updated: string
  children: ReactNode
}) {
  return (
    <div style={WOVEN_PAGE}>
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '44px clamp(18px, 5vw, 36px) 34px' }}>
          <div style={{ marginBottom: 10 }}><SectionDivider type="official" label="Legal" /></div>
          <h1 style={{ fontSize: 'clamp(24px, 7vw, 36px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 8px', lineHeight: 1.1 }}>{title}</h1>
          <p style={{ fontSize: 16, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.6 }}>{subtitle}</p>
          <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, margin: '12px 0 0' }}>Last updated: {updated}</p>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '26px clamp(18px, 5vw, 36px) 64px' }}>
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
