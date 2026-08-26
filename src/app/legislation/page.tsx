/**
 * /legislation — list of approved, enriched bills/acts (immersive-reader index).
 * Reads live from content_items (approved only). Empty until the first item is
 * approved in /editor.
 */

import type { Metadata } from 'next'
import { SectionDivider } from '@/components/ui/section-divider'
import { getApprovedBills } from '@/lib/bills/live'
import { LegislationBrowser } from '@/components/bills/legislation-browser'
import { BORDER, INK, MANROPE, SECONDARY, WOVEN_PAGE } from '@/constants/theme'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Legislation, made readable',
  description: 'Plain-language, non-partisan breakdowns of New Zealand bills and acts: what they do, and which policy areas they affect.',
}

export default async function LegislationIndexPage() {
  const bills = await getApprovedBills()

  return (
    <div style={WOVEN_PAGE}>
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '48px clamp(18px, 5vw, 36px) 40px' }}>
          <div style={{ marginBottom: 10 }}><SectionDivider type="official" label="Legislation" /></div>
          <h1 style={{ fontSize: 'clamp(26px, 7vw, 40px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 10px' }}>Legislation, made readable</h1>
          <p style={{ fontSize: 17, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, maxWidth: 640, lineHeight: 1.6, margin: 0 }}>
            Plain-language, non-partisan breakdowns of the bills and acts before Parliament — what each one does, and the
            policy areas it touches. Drafted from the official text and editor-reviewed.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '28px clamp(18px, 5vw, 36px) 64px' }}>
        <LegislationBrowser bills={bills} />
      </div>
    </div>
  )
}
