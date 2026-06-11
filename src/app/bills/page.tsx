/**
 * /bills — Bills tracker
 * Bills currently before the House. Snapshot from the official register,
 * pending the live RSS feed integration.
 */

import type { Metadata } from 'next'
import { Info, ExternalLink } from 'lucide-react'
import { BillsTracker } from '@/components/bills/bills-tracker'
import { SectionDivider } from '@/components/ui/section-divider'
import { BILLS, BILLS_TOTAL_CURRENT, BILLS_SNAPSHOT_DATE, BILLS_SOURCE_URL } from '@/constants/bills-data'
import { formatDate } from '@/lib/utils/format'

export const metadata: Metadata = {
  title: 'Bills Tracker',
  description:
    'Track bills currently before the New Zealand House of Representatives — ' +
    'their type, stage, and progress through Parliament.',
}

const INK = '#0c0e12', SECONDARY = '#6b7078', BORDER = '#e9e7e2'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const JADE = '#1F8A4C'

export default function BillsPage() {
  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>

      {/* Header */}
      <div className="bg-dot-grid" style={{ background: '#ffffff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '48px 36px 40px' }}>
          <div style={{ marginBottom: 8 }}>
            <SectionDivider type="official" label="Official Parliament Data" />
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, marginBottom: 10 }}>
            Bills Tracker
          </h1>
          <p style={{ fontSize: 17, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, maxWidth: 620, lineHeight: 1.6, margin: 0 }}>
            Bills currently before the <b style={{ color: INK }}>House of Representatives</b> — what they
            propose, their type, and how far they&apos;ve progressed.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 36px 64px' }}>

        {/* Snapshot notice */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12,
          padding: '13px 16px', marginBottom: 26,
        }}>
          <Info style={{ width: 16, height: 16, color: '#1e40af', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12.5, color: '#1e3a8a', fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>
            <b>Snapshot of {BILLS.length} of {BILLS_TOTAL_CURRENT} current bills</b>, taken from the
            official register on {formatDate(BILLS_SNAPSHOT_DATE)}. The complete, always-current list
            will sync automatically from Parliament&apos;s bills feed in the live integration.{' '}
            <a href={BILLS_SOURCE_URL} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 700 }}>
              View the full register <ExternalLink style={{ width: 11, height: 11, display: 'inline' }} />
            </a>
          </p>
        </div>

        <BillsTracker />
      </div>
    </div>
  )
}
