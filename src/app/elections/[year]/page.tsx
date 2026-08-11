/**
 * /elections/[year] — a single election. Renders results (completed) or the
 * prepped upcoming page (2026), chosen by the election's status.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getElection, ELECTION_SLUGS } from '@/constants/elections-data'
import { SectionDivider } from '@/components/ui/section-divider'
import { ResultsView } from '@/components/elections/results-view'
import { UpcomingView } from '@/components/elections/upcoming-view'
import { BORDER, INK, JADE, MANROPE, SECONDARY } from '@/constants/theme'

export function generateStaticParams() {
  return ELECTION_SLUGS.map((year) => ({ year }))
}

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }): Promise<Metadata> {
  const { year } = await params
  const e = getElection(year)
  if (!e) return { title: 'Election not found' }
  return { title: `${e.year} General Election`, description: e.headline }
}

export default async function ElectionYearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params
  const e = getElection(year)
  if (!e) notFound()

  const upcoming = e.status === 'upcoming'

  // The upcoming (2026) Election Centre owns its own full-bleed cinematic hero,
  // so it renders standalone — no generic document header wrapped around it.
  if (upcoming) return <UpcomingView e={e} />

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 36px 34px' }}>
          <Link href="/elections" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: SECONDARY, textDecoration: 'none', fontFamily: MANROPE, marginBottom: 18 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> All elections
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <SectionDivider type="official" label="General Election" />
            <span style={{
              fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: MANROPE,
              padding: '3px 10px', borderRadius: 999,
              color: '#065f46', background: '#ecfdf5', border: '1px solid #a7f3d0',
            }}>Final result</span>
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 6px', lineHeight: 1.05 }}>
            {e.year} General Election
          </h1>
          <p style={{ fontSize: 16, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>
            {e.date}{e.dateApprox ? ' (approximate)' : ''} · {e.headline}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '30px 36px 64px' }}>
        <ResultsView e={e} />
      </div>
    </div>
  )
}
