/**
 * SeatHero — the head of a seat page: which seat, how close it was in 2023, and
 * what it would take to flip it.
 *
 * Was `WarRoomHero` in war-room-hero.tsx. Renamed with the rest of the military
 * frame (§1.7): "war room", "combatant", "dossier" and "battleground" are a
 * metaphor laid over an election, and "Seats to watch", "Sitting MP" and
 * "Standing against them" say the same thing to a first-time reader without
 * taking a position on the tone of the contest.
 *
 * Two things came off it, and both were on all 72 seat pages:
 *
 * - THE SWING GAUGE (§1.8). A two-party bar with a marker, drawn from
 *   `SHARE_BY_TIER = { ultra: 50.5, marginal: 58, competitive: 70, safe: 85 }`,
 *   which the file's own comment called "NOT a real vote-share figure". A bar
 *   with two named candidates' faces on it is read as a result. The honest part
 *   was the sentence underneath, which is arithmetic on a sourced majority
 *   (ceil(majority / 2), true whatever the turnout), and that stayed.
 * - THE COUNTDOWN. "N days to election day" counted to a hard-coded
 *   2026-11-07, unsourced, on 72 pages, while the Election Centre runs the same
 *   countdown from the dated timetable (§1.3). Seventy-two places to be wrong
 *   when the date moves.
 *
 * No longer a client component: the countdown was the only thing here that had
 * to run after mount.
 */

import type { ReactNode } from 'react'
import { BackLink } from '@/components/ui/back-link'
import { MANROPE } from '@/constants/theme'

// Warm palette shared with the homepage / Election Centre — this hero used to be
// a black tactical band, which read as a different product once the rest of the
// site moved to the woven treatment.
const ESPRESSO = '#2A1206', WARM = '#5b3d2a', BODY = '#3f372f', SUB = '#6b6157'
const LINE = '#e6e2da'

export function SeatHero({
  electorateName,
  regionLine,
  tierLabel,
  tierColor,
  majority,
  incumbentName,
  challengerLabel,
  action,
}: {
  electorateName: string
  regionLine: string
  tierLabel: string
  tierColor: string
  majority?: number
  incumbentName: string
  challengerLabel: string
  /** Page-level action (the Track control). Sits in the title row rather than
   *  floating on its own above the content, which is where every other page
   *  puts it — see /policies/[topic], /mps/[slug], /parties/[slug]. */
  action?: ReactNode
}) {
  const swing = majority != null ? Math.ceil(majority / 2) : null

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: HERO_CSS }} />
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '20px clamp(18px, 5vw, 36px) 28px' }}>
        {/* Back to the 2026 Election Centre, where the seat map that links
            here lives now. It went to /battlegrounds as "Seats to watch", but
            that page is the 2026 Election map now and does show the seats. */}
        <BackLink fallbackHref="/elections/2026" label="2026 election"
          style={{ fontSize: 13, fontWeight: 600, color: WARM, fontFamily: MANROPE, marginBottom: 18 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: tierColor }} />
              <span className="sh-tier" style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: tierColor, fontFamily: MANROPE }}>{tierLabel} in 2023</span>
            </div>
            <h1 style={{ fontSize: 'clamp(24px, 7vw, 34px)', fontWeight: 800, letterSpacing: '-.02em', color: ESPRESSO, fontFamily: MANROPE, margin: '0 0 4px', lineHeight: 1.05 }}>{electorateName}</h1>
            <p className="sh-region" style={{ fontSize: 14, color: SUB, fontFamily: MANROPE, margin: 0 }}>{regionLine}</p>
          </div>
          {action}
        </div>

        {majority != null && swing != null && (
          <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 2px rgba(42,18,6,.05)' }}>
            <div className="sh-label" style={{ fontSize: 10.5, fontWeight: 800, color: SUB, textTransform: 'uppercase', letterSpacing: '.04em', fontFamily: MANROPE, marginBottom: 8 }}>
              What it takes to flip this seat
            </div>
            <p className="sh-body" style={{ fontSize: 13.5, color: BODY, fontFamily: MANROPE, lineHeight: 1.55, margin: 0 }}>
              {incumbentName} won by <b style={{ color: ESPRESSO }}>{majority.toLocaleString('en-NZ')}</b> votes in 2023. <b style={{ color: ESPRESSO }}>{swing.toLocaleString('en-NZ')}</b> {swing === 1 ? 'voter' : 'voters'} switching to {challengerLabel} would have flipped {electorateName}.
            </p>
            <p style={{ fontSize: 11, color: SUB, fontFamily: MANROPE, margin: '8px 0 0' }}>
              Electoral Commission, 2023 general election official results.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* The desktop step this file never had. Composed at 375px and rendered
   unchanged at 1920: a 10.5px label and a 13.5px paragraph inside a hero that
   had grown to the full column. Scaled, not re-laid-out (§2.14), at the site's
   768px breakpoint. !important because it overrides inline styles (§3.2). */
const HERO_CSS = `
@media (min-width: 768px) {
  .sh-tier { font-size: 12px !important; }
  .sh-region { font-size: 15.5px !important; }
  .sh-label { font-size: 11.5px !important; }
  .sh-body { font-size: 15px !important; }
}
`
