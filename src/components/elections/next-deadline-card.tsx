/**
 * NextDeadlineCard — the single next electoral deadline, as its own card.
 *
 * Split out of key-dates.tsx by request, to move to the very top of the
 * Election Centre — above the headline, the first thing on the page — once
 * it became clear this was the card people actually wanted to see first.
 * KeyDates (further down) keeps the reasoning, the source, and the full
 * four-date timetable behind "Show all key dates"; this file keeps only the
 * one fact everyone needs before anything else: the next date, and how many
 * days there are to it.
 *
 * The constants live here and KeyDates imports them, rather than each file
 * keeping its own copy, so "Enrol by here, no special vote" cannot say one
 * thing on the card at the top of the page and something else in the full
 * grid four screens later (§1.3, one thing in one place).
 */

import { ArrowUpRight } from 'lucide-react'
import { ELECTORAL_CALENDAR, daysUntil, type ElectoralMilestone } from '@/constants/electoral-calendar'
import { INK, SECONDARY, BORDER, MANROPE, JADE } from '@/constants/theme'

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
  'writ-day-2026': 'Enrol by here, no special vote',
  'enrolment-closes-2026': 'Last day to enrol',
  'advance-voting-2026': 'Advance voting opens',
  'election-day-2026': 'Election day',
}

export function nextMilestone(today: string): ElectoralMilestone | undefined {
  const items = SHOWN
    .map((id) => ELECTORAL_CALENDAR.find((m) => m.id === id))
    .filter((m): m is ElectoralMilestone => Boolean(m))
  // The next one the reader has not already missed. Falls back to the last
  // item (election day) once every milestone is past, so the card never goes
  // blank on election night itself.
  return items.find((m) => m.date >= today) ?? items[items.length - 1]
}

export function NextDeadlineCard({ today }: { today: string }) {
  const next = nextMilestone(today)
  if (!next) return null

  const critical = next.id === CRITICAL
  const tone = critical ? CRITICAL_RED : INK
  const { day, month } = fmt(next.date)
  const days = daysUntil(today, next.date)

  return (
    <div style={{
      border: `1px solid ${critical ? '#f3c6bd' : BORDER}`, borderRadius: 16,
      background: critical ? '#fff5f2' : '#fff',
      borderTop: `3px solid ${tone}`,
      padding: '18px 20px', boxShadow: '0 2px 8px rgba(42,18,6,.05)',
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 44, fontWeight: 800, color: tone, fontFamily: MANROPE, lineHeight: 1, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>{day}</span>
        <span style={{ fontSize: 17, fontWeight: 800, color: tone, fontFamily: MANROPE }}>{month}</span>
      </div>
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.25 }}>
          {LABELS[next.id] ?? next.label}
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: critical ? CRITICAL_RED : SECONDARY, fontFamily: MANROPE, marginTop: 3 }}>
          {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days away`}
        </div>
      </div>
      {/* §3.1. The link is the hit area, the span is the button. */}
      <a href="https://vote.nz" target="_blank" rel="noopener noreferrer"
         style={{ display: 'inline-flex', padding: '8px 0', margin: '-8px 0', textDecoration: 'none', flexShrink: 0 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 800,
          color: '#fff', background: JADE, borderRadius: 999, padding: '9px 16px', fontFamily: MANROPE, whiteSpace: 'nowrap',
        }}>
          Enrol or check your details <ArrowUpRight style={{ width: 13, height: 13 }} />
        </span>
      </a>
    </div>
  )
}
