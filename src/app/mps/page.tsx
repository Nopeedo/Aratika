/**
 * /mps — Members of Parliament directory
 *
 * Lists all current MPs (verified from parliament.nz) with party/role filters
 * and name search. Individual profiles at /mps/[slug].
 */

import type { Metadata } from 'next'
import { MPsDirectory } from '@/components/mps/mps-directory'
import { SectionDivider } from '@/components/ui/section-divider'

export const metadata: Metadata = {
  title: 'Members of Parliament',
  description:
    'Browse all current Members of Parliament in New Zealand\'s 54th Parliament — ' +
    'searchable and filterable by party and electorate.',
}

const INK = '#0c0e12', SECONDARY = '#6b7078', BORDER = '#e9e7e2'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export default function MPsDirectoryPage() {
  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>

      {/* Header */}
      <div className="bg-dot-grid" style={{ background: '#ffffff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 36px 40px' }}>
          <div style={{ marginBottom: 8 }}>
            <SectionDivider type="official" label="Official Parliament Data" />
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, marginBottom: 10 }}>
            Members of Parliament
          </h1>
          <p style={{ fontSize: 17, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, maxWidth: 600, lineHeight: 1.6, margin: 0 }}>
            Every current MP in the <b style={{ color: INK }}>54th Parliament</b>. Search by name or
            electorate, and filter by party. Current roster sourced from parliament.nz.
          </p>
        </div>
      </div>

      {/* Directory */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 36px 64px' }}>
        <MPsDirectory />
      </div>
    </div>
  )
}
