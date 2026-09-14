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
import { BORDER, INK, JADE, MANROPE, SECONDARY, WOVEN_PAGE } from '@/constants/theme'

// Revalidated, not rendered per request.
//
// This route had no caching config, and one reader on its path (polls/live.ts)
// bound to cookies, which opts a route into dynamic rendering. So /elections/2026
// was rebuilt from scratch on every request: 2.3–2.6s per RSC fetch, measured
// against production. A reader clicking through from the homepage while
// scrolled down sat on the OLD page at the old scroll position for that long,
// then the new page snapped to the top. Every click felt like a jump.
//
// Nothing here is per-user. Polls change a few times a month, videos a few
// times a day; sixty seconds of lag is invisible. The same setting the party
// page already uses, for the same reason.
export const revalidate = 60

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
    <div style={WOVEN_PAGE}>
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px clamp(18px, 5vw, 36px) 34px' }}>
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
          <h1 style={{ fontSize: 'clamp(25px, 7vw, 38px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 6px', lineHeight: 1.05 }}>
            {e.year} General Election
          </h1>
          <p style={{ fontSize: 16, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>
            {e.date}{e.dateApprox ? ' (approximate)' : ''} · {e.headline}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '30px clamp(18px, 5vw, 36px) 64px' }}>
        <ResultsView e={e} />
      </div>
    </div>
  )
}
