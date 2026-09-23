'use client'

/**
 * CommandHero — the header for the 2026 Election Centre.
 *
 * Redesigned to sit in the same world as the homepage rather than beside it:
 * the woven back2.jpg texture over warm cream, espresso headline, and a
 * countdown built from the same flip-tile visual as the homepage's day counter
 * (white→cream card, hairline fold, side notches). It previously used a black
 * cinematic band with gradient-filled digits, which read as a different product
 * the moment you arrived from the landing page.
 *
 * Keeps what worked: the days counter and the jump-nav so the long page below
 * stays navigable. The stat row (majority seats / parties contesting / poll
 * leader) was removed once the party tiles carried all three lower down — it
 * was the same numbers twice, one screen apart.
 *
 * DAYS ONLY. It ran days : hrs : mins : secs, which is four tiles and three
 * colons: 299px of a 339px row at 375px, pinned there by the tiles' own
 * `clamp(56px, 12vw, 92px)` floor, so it could not shrink any further and
 * overflowed below about 360px (§3.2 — a clamp floor makes a layout
 * unresponsive). A live seconds digit to an election over a year out is also
 * decoration that re-renders every 1000ms, and the homepage's own counter
 * (days-flip-countdown.tsx) has always been days only. One tile, no overflow,
 * same object on both pages.
 *
 * The enrolment/advance-voting subline under the tiles is gone with it (§1.3).
 * It stated the enrolment close date, the advance-voting window and the source,
 * and the KeyDates strip ~250px below states all three from the SAME
 * electoral-calendar.json. upcoming-view.tsx records two cards already deleted
 * for exactly this; the hero was doing it a third time. The standalone
 * "Saturday 7 November 2026" line went for the same reason: the date was on
 * this screen three times over, as that line, as the thing the countdown counts
 * to, and as the strip's "Election day" tile. The strip keeps it.
 */

import { useEffect, useState } from 'react'
import { ELECTION_SECTIONS, HERO_JUMP_ID } from '@/constants/election-sections'
import { MilestoneCard } from './next-deadline-card'
import { MANROPE } from '@/constants/theme'

// Shared with the homepage flip counter (days-flip-countdown.tsx) so the two
// counters read as the same object.
const ESPRESSO = '#2A1206', WARM = '#5b3d2a'
const CARD_TOP = '#ffffff', CARD_BOT = '#f4f1ec', CARD_LINE = '#e6e2da'

// Election day: Saturday 7 November 2026, local NZ (NZDT, UTC+13 in November).
const TARGET = new Date('2026-11-07T00:00:00+13:00').getTime()

export function CommandHero({ today }: { today: string }) {
  // Computed on the client after mount to avoid hydration drift. Still an
  // interval rather than a one-shot: it has to roll over at NZ midnight for a
  // reader who leaves the page open, which is the only thing that can change.
  const [days, setDays] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setDays(Math.floor(Math.max(0, TARGET - Date.now()) / 86400000))
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [])

  return (
    // Deliberately transparent: the woven texture is painted once by the page
    // wrapper (UpcomingView) and shows through here. Giving this section its own
    // repeat-y copy would restart the tiling and leave a visible seam under the
    // hero — the same seam bug already fixed once on the homepage.
    <section style={{ position: 'relative' }}>
      <div style={{ position: 'relative', maxWidth: 1080, margin: '0 auto', padding: 'clamp(18px, 3vh, 26px) clamp(18px, 5vw, 40px) clamp(24px, 4vh, 36px)' }}>
        {/* The "ELECTION CENTRE" eyebrow and the "All elections" back link
            that sat above it are both gone now. The eyebrow named the page
            a reader already knows they're on — nothing above it says
            anything else — and once the back link went (this page has
            nowhere to back out to) it was standing there alone with nothing
            to sit against. */}

        {/* Headline — sized and placed like the policy comparison page's own
            h1 ("Party Policy Comparison"): left-aligned, clamp(28px, 7vw,
            36px), 18px under it. Was centred at up to 46px, its own one-off
            treatment; this page's title now reads at the same weight as
            every other page's, rather than announcing itself louder than
            the section headings below it (§4's peer-heading rule, extended
            to page titles rather than just section ones). */}
        <h1 style={{ fontSize: 'clamp(28px, 7vw, 36px)', fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.15, fontFamily: MANROPE, color: ESPRESSO, margin: '0 0 18px' }}>
          2026 general election
        </h1>

        {/* Three cards below the title, before the countdown, in DATE order:
            4 Oct (Writ Day), 25 Oct (the actual enrolment deadline), 26 Oct
            (advance voting opens).

            ALL THREE FIXED, not one dynamic "whichever's next" plus two
            fixed. That was the shape until the 25 Oct card was added: the
            dynamic card would have shown Writ Day until 4 Oct, then swapped
            to show 25 Oct — the exact date the new fixed card underneath
            was also showing, so from 5 Oct onward the same milestone would
            have appeared twice in a row. Three named cards can't collide
            with each other the way one dynamic and one fixed eventually
            would. See next-deadline-card.tsx for why the reasoning and the
            full timetable stay in KeyDates further down rather than being
            duplicated here.

            TWO PER ROW, by request — a grid rather than the single column
            above. DateCard's own internal layout still wraps at any width
            (day figure, then title, then the right-aligned button, each
            dropping to its own line if the one before it didn't leave room),
            which is what keeps a ~160px-wide column at 375px legible rather
            than clipping. */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 'clamp(20px, 3.4vh, 28px)' }}>
          <MilestoneCard milestoneId="writ-day-2026" today={today} />
          <MilestoneCard milestoneId="enrolment-closes-2026" today={today} />
          <MilestoneCard milestoneId="advance-voting-2026" today={today} />
        </div>

        {/* One tile. The label does the job the deleted date line was doing
            badly: it says what the number counts to without restating
            7 November, which the strip immediately below owns. */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(20px, 3.4vh, 30px)' }}>
          <div style={{ textAlign: 'center' }}>
            <Tile text={days === null ? '––' : String(days)} />
            <div style={{ fontSize: 'clamp(10px,1.3vw,12px)', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: WARM, fontFamily: MANROPE, marginTop: 9 }}>
              days until election day
            </div>
          </div>
        </div>

        {/* Jump nav — a light text-link row now, not six equal §2.2 pills.
            Six identically-weighted pills put "Key dates" — the one section
            with a deadline — beside "Leaders & the press" as if a reader
            should weigh them the same. Key Dates is also the very next thing
            on the page, so a pill pointing at it here was pointing one
            scroll away: dropped from this row, the section itself is the
            answer. The other five stay, small and quiet, so the hero's own
            weight goes to the headline and the count above rather than to
            a second navigation system competing with it.

            §3.1: still <a>, so globals.css's 44px <button> minimum is
            cancelled the same way — the link is the hit area, the text is
            the control. */}
        <div id={HERO_JUMP_ID} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '4px 14px' }}>
          {ELECTION_SECTIONS.filter((j) => j.id !== 'key-dates').map((j, i, arr) => (
            <span key={j.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px 14px' }}>
              <a href={`#${j.id}`} style={{
                display: 'inline-flex', padding: '10px 0', margin: '-10px 0', textDecoration: 'none',
                fontSize: 12.5, fontWeight: 700, color: WARM, fontFamily: MANROPE, whiteSpace: 'nowrap',
              }}>{j.label}</a>
              {i < arr.length - 1 && <span aria-hidden style={{ color: 'rgba(42,18,6,.25)', fontSize: 12 }}>·</span>}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/** The days figure, drawn as the homepage's flip card at rest. */
function Tile({ text }: { text: string }) {
  return (
    <div style={{
      position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 'clamp(56px, 12vw, 92px)', height: 'clamp(64px, 13vw, 96px)',
      borderRadius: 10, border: `1px solid ${CARD_LINE}`,
      background: `linear-gradient(180deg, ${CARD_TOP} 0 50%, ${CARD_BOT} 50% 100%)`,
      boxShadow: '0 3px 8px rgba(42,18,6,.10)',
      fontFamily: MANROPE, fontWeight: 800, color: ESPRESSO,
      fontSize: 'clamp(30px, 6.6vw, 56px)', letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums',
      padding: '0 clamp(8px,1.6vw,14px)',
    }}>
      {text}
      {/* fold line + side notches, matching the homepage tile */}
      <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'rgba(42,18,6,.18)', transform: 'translateY(-0.5px)' }} />
      <span aria-hidden style={{ position: 'absolute', left: -2, top: '50%', width: 4, height: 10, marginTop: -5, borderRadius: 2, background: '#cfc8bd' }} />
      <span aria-hidden style={{ position: 'absolute', right: -2, top: '50%', width: 4, height: 10, marginTop: -5, borderRadius: 2, background: '#cfc8bd' }} />
    </div>
  )
}

