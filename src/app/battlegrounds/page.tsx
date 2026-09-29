/**
 * /battlegrounds — "Live results 2026".
 *
 * WHAT CHANGED. This route was "Seats to watch" (a margin-coloured map and
 * every seat ranked by its 2023 margin). By request it is the election-night
 * results page now, named "Live results 2026", with the old content hidden —
 * it lives on, demoted, in components/battlegrounds/seats-to-watch.tsx, and
 * the map itself still runs on the Election Centre. The seat pages under
 * /battlegrounds/[electorate] are untouched: the Election Centre's map links
 * to them.
 *
 * TWO STATES, ONE SWITCH. LIVE_RESULTS_ENABLED in constants/features.ts is
 * flipped by hand — never by the clock — so nothing goes live by itself.
 *   - Off: the title, when the page opens, and what it will show. The results
 *     area is not rendered at all.
 *   - On: the same header, then the results area.
 *
 * NOT POLLS. Polls are what people say they'll do; this page shows counted
 * votes. Every date and time here is read from electoral-calendar.json (the
 * Electoral Commission's timetable), not typed (§1.8, §4).
 *
 * The results area has no data feed yet. When the switch is on it says so
 * plainly rather than showing anything that looks like a result (§1.5, §1.8).
 * The Commission's results site sits behind a bot check, so the feed needs an
 * arrangement with them, not a scraper.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'
import { milestone, longDate } from '@/constants/electoral-calendar'
import { LIVE_RESULTS_ENABLED } from '@/constants/features'
import { BORDER, INK, JADE, MANROPE, SECONDARY, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

export const revalidate = 60

const YEAR = '2026'

export const metadata: Metadata = {
  title: 'Live results 2026',
  description: 'Preliminary results for the 2026 General Election, electorate by electorate, from 7pm on election day.',
}

/** "Saturday 7 November 2026" from an ISO date, in the site's own wording. */
function fullDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getUTCDay()]
  return `${weekday} ${longDate(iso)} ${d.getUTCFullYear()}`
}

export default function LiveResultsPage() {
  const electionDay = milestone('election-day-2026')
  const official = milestone('official-results-2026')
  const opens = electionDay ? fullDate(electionDay.date) : null

  /* What the page is for. Inside the "Not open yet" card by request, so the
     page reads as one block under its title; above the results once the
     switch is on. */
  const about = (
    <>
      <p style={{ fontSize: 14, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 8px' }}>
        When voting closes on election night, this page shows the <b style={{ color: INK }}>preliminary results</b> as
        the Electoral Commission releases them: who is leading in each of the 72 electorates, and how the party vote
        is falling nationally. These are counted votes, updated through the night.
      </p>
      {official && (
        <p style={{ fontSize: 13, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.55, margin: 0 }}>
          Preliminary results can change. The official results, including special votes, are declared on{' '}
          {longDate(official.date)}.
        </p>
      )}
    </>
  )

  return (
    <div style={WOVEN_PAGE}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(18px, 3vh, 26px) clamp(18px, 5vw, 36px) 64px' }}>
        {/* Title at the same size and position as the policy page's h1 and
            the Election Centre's — every page title on the site reads at one
            weight (§4). */}
        <h1 style={{ fontSize: 'clamp(28px, 7vw, 36px)', fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.15, fontFamily: MANROPE, color: INK, margin: '0 0 16px' }}>
          Live results 2026
        </h1>

        {!LIVE_RESULTS_ENABLED ? (
          <div style={{
            border: `1px solid ${BORDER}`, borderRadius: 16, background: '#fff', padding: '18px 20px',
            boxShadow: '0 2px 8px rgba(42,18,6,.05)', maxWidth: 640,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE }}>
              <Clock style={{ width: 14, height: 14 }} /> Not open yet
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '8px 0 4px', lineHeight: 1.25 }}>
              {/* Plain words first, by request ("Opens at 7pm, Saturday 7
                  November 2026" read like a timestamp); the date follows. */}
              This page will be available on election day
            </div>
            <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55, margin: 0 }}>
              {opens && <><b style={{ color: INK }}>{opens}.</b>{' '}</>}
              {electionDay?.detail ?? 'Results are released from 7pm on election day.'}
            </p>
            <div style={{ borderTop: `1px solid ${BORDER}`, margin: '14px 0', paddingTop: 14 }}>{about}</div>
            <Link href={`/elections/${YEAR}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
              Until then, the 2026 Election Centre <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
        ) : (
          /* The results area. No feed is connected yet, so it says that
             rather than showing anything that could be read as a result. */
          <>
          <div style={{ maxWidth: 640, marginBottom: 18 }}>{about}</div>
          <section aria-label="Preliminary results" style={{
            border: `1px solid ${BORDER}`, borderRadius: 16, background: '#fff', padding: '18px 20px', maxWidth: 640,
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 4 }}>
              Waiting for the first results
            </div>
            <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55, margin: 0 }}>
              Results will appear here as the Electoral Commission releases them.
            </p>
          </section>
          </>
        )}
      </div>
    </div>
  )
}
