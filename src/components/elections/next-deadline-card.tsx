/**
 * MilestoneCard — a single, NAMED electoral date, as its own card.
 *
 * Split out of key-dates.tsx by request, to move to the very top of the
 * Election Centre — under the headline, before the countdown — once it
 * became clear this was the card people actually wanted to see first.
 * KeyDates (further down) keeps the reasoning, the source, and the full
 * four-date timetable behind "Show all key dates"; this file keeps only the
 * fact itself: a date, what it means, and how many days there are to it.
 *
 * The constants live here and KeyDates imports them, rather than each file
 * keeping its own copy, so "Last day to enrol without a special vote" cannot
 * say one thing on a card and something else in the full grid four screens
 * later (§1.3, one thing in one place).
 *
 * THREE CARDS, ONE COMPONENT, ALL FIXED. There used to be a dynamic
 * NextDeadlineCard — "whichever milestone hasn't passed yet" — with one
 * fixed card under it. That worked with two cards, but broke as soon as a
 * third was added: the dynamic card would show Writ Day until 4 Oct, then
 * automatically swap to show 25 Oct, which is the exact date the new fixed
 * card underneath it was ALSO showing — so from 5 Oct onward the same
 * milestone would have appeared twice in the same stack. Three named cards
 * (see command-hero.tsx) can't collide with each other the way one dynamic
 * and one fixed eventually would have. Removed with it: nextMilestone() and
 * NextDeadlineCard, which nothing else in the codebase used once this
 * changed.
 */

import { ArrowUpRight } from 'lucide-react'
import { ELECTORAL_CALENDAR, daysUntil, type ElectoralMilestone } from '@/constants/electoral-calendar'
import { INK, SECONDARY, TERTIARY, BORDER, MANROPE, JADE } from '@/constants/theme'

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** The CRITICAL red for the (i) and the critical tile — the bubble and the
 *  card take the colour of the thing they are about, and this strip is about
 *  a deadline (§1.6). */
export const CRITICAL_RED = '#b42318'

export function fmt(iso: string): { day: string; month: string } {
  const d = new Date(`${iso}T00:00:00Z`)
  return { day: String(d.getUTCDate()), month: MONTHS[d.getUTCMonth()] }
}

/**
 * The milestones a voter has to act on, in order. Administrative dates
 * (dissolution, nominations, return of the writ) are real but are not something
 * anyone has to do anything about, so they stay out of the strip.
 */
export const SHOWN = ['writ-day-2026', 'enrolment-closes-2026', 'advance-voting-2026', 'election-day-2026']

/** The one that must not be missed — styled apart from the rest. */
export const CRITICAL = 'enrolment-closes-2026'

/** Short enough to sit on one line in a two-column phone cell. The long form of
 *  the writ-day label, "Enrol by today to avoid a special vote", is the (i)'s
 *  job in KeyDates: it is good plain copy and it is an explanation, not a date. */
export const LABELS: Record<string, string> = {
  // Was "Enrol by here, no special vote" — "by here" read as a typo rather
  // than "by this date", and the sentence never said what happens if you
  // miss it. Rewritten to say the deadline AND its consequence in one
  // clause, and to stay distinct from enrolment-closes-2026's "Last day to
  // enrol" below it rather than colliding with it.
  'writ-day-2026': 'Last day to enrol without a special vote',
  'enrolment-closes-2026': 'Last day to enrol',
  'advance-voting-2026': 'Advance voting opens',
  'election-day-2026': 'Election day',
}

/** The button each card ends on. Enrolment milestones point at enrolling;
 *  the two voting milestones point at finding a place to vote instead —
 *  "Enrol or check your details" on the advance-voting card answered a
 *  question the card wasn't asking. Same destination, vote.nz, which
 *  covers both. */
// Short: at ~135px of usable width inside a two-per-row card, "Enrol or
// check your details" ran the button off the card's own right edge and
// past the page edge. "Enrol or check your details" is still what the (i)
// and KeyDates say in full; this is the version that fits a 160px card.
const CTA: Record<string, string> = {
  'writ-day-2026': 'Enrol now',
  'enrolment-closes-2026': 'Enrol now',
  'advance-voting-2026': 'Find a place',
  'election-day-2026': 'Find a place',
}

/** One named milestone, regardless of today's date. */
export function MilestoneCard({ milestoneId, today }: { milestoneId: string; today: string }) {
  const m = ELECTORAL_CALENDAR.find((x) => x.id === milestoneId)
  if (!m) return null
  return <DateCard milestone={m} today={today} />
}

function DateCard({ milestone: m, today }: { milestone: ElectoralMilestone; today: string }) {
  const critical = m.id === CRITICAL
  const tone = critical ? CRITICAL_RED : INK
  const { day, month } = fmt(m.date)
  const days = daysUntil(today, m.date)

  return (
    // Column, not the previous row. Two per row at 375px gives each card
    // about 160px, and the old row (44px day figure, 20px title, a button,
    // side by side with an 8px gap) does not fit inside that — it does not
    // wrap cleanly either, because the day figure's own minimum width alone
    // is close to half the column. Measured: the row version overflowed the
    // second column off the right edge of a 375px phone. A column stacks
    // instead of trying to fit sideways, and every size below is picked to
    // still read clearly at a ~160px card rather than a ~340px one.
    <div style={{
      border: `1px solid ${critical ? '#f3c6bd' : BORDER}`, borderRadius: 14,
      background: critical ? '#fff5f2' : '#fff',
      borderTop: `3px solid ${tone}`,
      padding: '13px 14px', boxShadow: '0 2px 8px rgba(42,18,6,.05)',
      display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 30, fontWeight: 800, color: tone, fontFamily: MANROPE, lineHeight: 1, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>{day}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: tone, fontFamily: MANROPE }}>{month}</span>
      </div>
      {/* Softer than the rest of the card on purpose — it's the least
          important number here, and at 700-weight SECONDARY it was reading
          as loud as the day figure right above it. TERTIARY, 500-weight;
          stays critical-red on the one card where missing the date matters
          most, just no longer bold. */}
      <div style={{ fontSize: 11, fontWeight: 500, color: critical ? CRITICAL_RED : TERTIARY, fontFamily: MANROPE }}>
        {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : days > 0 ? `${days} days away` : 'Already open'}
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.3, marginTop: 2 }}>
        {LABELS[m.id] ?? m.label}
      </div>
      {/* The window a milestone is open, when it has one — election day's
          "voting places open 9.00am to 7.00pm" is data on the milestone
          (timeNote), not copy specific to this card, so it renders for
          whichever milestone actually carries it rather than being typed
          in here. Same TERTIARY as the days-away line: supporting detail,
          not the headline the title above it already is. */}
      {m.timeNote && (
        <div style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.4 }}>
          {m.timeNote}
        </div>
      )}
      {/* §3.1. The link is the hit area, the span is the button.
          Full width now, not alignSelf: flex-end shrink-to-fit — even the
          shortened CTA text left the button narrower than the card at some
          widths and wider than it at others (below), and a button that is
          sometimes the wrong width either wastes room or clips. Full width
          is right at every column width this card actually renders at. */}
      <a href="https://vote.nz" target="_blank" rel="noopener noreferrer"
         style={{ display: 'block', padding: '4px 0', margin: '2px 0 -4px', textDecoration: 'none' }}>
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, fontWeight: 800,
          color: '#fff', background: JADE, borderRadius: 999, padding: '7px 11px', fontFamily: MANROPE, whiteSpace: 'nowrap',
        }}>
          {CTA[m.id] ?? 'Find out more'} <ArrowUpRight style={{ width: 11, height: 11, flexShrink: 0 }} />
        </span>
      </a>
    </div>
  )
}
