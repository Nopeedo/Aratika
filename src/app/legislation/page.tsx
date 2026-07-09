/**
 * /legislation — list of approved, enriched bills/acts (immersive-reader index).
 * Reads live from content_items (approved only). Empty until the first item is
 * approved in /editor.
 */

import type { Metadata } from 'next'
import { SectionDivider } from '@/components/ui/section-divider'
import { getApprovedBills } from '@/lib/bills/live'
import { LegislationBrowser } from '@/components/bills/legislation-browser'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Legislation, made readable',
  description: 'Plain-language, non-partisan breakdowns of New Zealand bills and acts — what they do and which policy areas they affect.',
}

const INK = '#17231b', SECONDARY = '#667066'
const BORDER = '#e4ebe2'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export default async function LegislationIndexPage() {
  const bills = await getApprovedBills()

  return (
    <div style={{ background: '#f5f8f4', minHeight: '100vh' }}>
      <div className="bg-dot-grid" style={{ background: '#f5f8f4', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '48px 36px 40px' }}>
          <div style={{ marginBottom: 10 }}><SectionDivider type="official" label="Legislation" /></div>
          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 10px' }}>Legislation, made readable</h1>
          <p style={{ fontSize: 17, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, maxWidth: 640, lineHeight: 1.6, margin: 0 }}>
            Plain-language, non-partisan breakdowns of the bills and acts before Parliament — what each one does, and the
            policy areas it touches. Drafted from the official text and editor-reviewed.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '28px 36px 64px' }}>
        <LegislationBrowser bills={bills} />
      </div>
    </div>
  )
}
