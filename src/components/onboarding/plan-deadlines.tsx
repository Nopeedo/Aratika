'use client'

/**
 * PlanDeadlines — the dates on the plan page.
 *
 * /plan is advertised on the homepage rail as "What to do before election day".
 * It contained no election day: no enrolment deadline, no advance voting, no
 * polling date. It was a tour of Politika's features wearing a voter's
 * checklist's name, and the one item on it with a cost attached — enrolment,
 * which closes 13 days earlier than it did in 2023 — was the one thing missing.
 *
 * The timetable already existed in constants/electoral-calendar.ts, read off the
 * Commission's own media kit, with a comment warning that getting it wrong
 * disenfranchises people. Nothing imported it. This does.
 *
 * Only ACTIONABLE milestones appear. The calendar also carries administrative
 * ones (writ day, dissolution, nominations closing) which are real but are not
 * something a voter can do anything about, and a checklist of things you cannot
 * act on is just noise above the things you can.
 */

import { useEffect, useState } from 'react'
import { AlertCircle, CalendarDays, ExternalLink } from 'lucide-react'
import { upcomingMilestones, longDate, daysUntil, type ElectoralMilestone } from '@/constants/electoral-calendar'
import { BORDER, INK, JADE, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

/** Where a milestone can actually be acted on. Only some can. */
const ACTION: Record<string, { label: string; href: string; external?: boolean }> = {
  'enrolment-closes-2026': { label: 'Enrol or update at vote.nz', href: 'https://vote.nz/enrolling/enrol-or-update/enrol-or-update-online', external: true },
  'advance-voting-2026': { label: 'Find your electorate', href: '/map' },
  'election-day-2026': { label: 'Find your electorate', href: '/map' },
  'overseas-voting-2026': { label: 'Voting from overseas', href: 'https://vote.nz/2026-general-election/voting-in-the-election/vote-from-overseas', external: true },
}

export function PlanDeadlines() {
  // Resolved in an effect, never during render. A date computed while rendering
  // differs between the server pass and the client pass and trips hydration —
  // this codebase has been caught by exactly that before.
  const [today, setToday] = useState<string | null>(null)
  useEffect(() => {
    setToday(new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' }))
  }, [])

  if (!today) return null
  // No slice. The calendar is chronological, so taking the first N quietly drops
  // election day itself — the date this page is named after — behind overseas
  // voting. There are only ever a handful of actionable dates left and the list
  // shrinks on its own as they pass.
  const due = upcomingMilestones(today).filter((m) => m.actionable)
  // Past election day there is nothing left to count down to, and a stale
  // "0 days" card is worse than no card.
  if (due.length === 0) return null

  return (
    <div style={{ marginBottom: 22 }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 7 }}>
        <CalendarDays style={{ width: 16, height: 16, color: JADE }} /> Before election day
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {due.map((m) => (
          <Row key={m.id} m={m} days={daysUntil(today, m.date)} />
        ))}
      </div>
      <p style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE, margin: '10px 0 0', lineHeight: 1.5 }}>
        Dates from the Electoral Commission&rsquo;s 2026 timetable.
      </p>
    </div>
  )
}

function Row({ m, days }: { m: ElectoralMilestone; days: number }) {
  // Enrolment is the only one where being late means you do not get to vote at
  // all, so it is the only one allowed to shout.
  const critical = m.id === 'enrolment-closes-2026'
  const action = ACTION[m.id]
  const when = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`

  return (
    <div
      style={{
        background: critical ? '#fff7ed' : '#fff',
        border: `1px solid ${critical ? '#fdba74' : BORDER}`,
        borderRadius: 14, padding: '14px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14.5, fontWeight: 800, color: INK, fontFamily: MANROPE, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {critical && <AlertCircle style={{ width: 15, height: 15, color: '#c2410c', flexShrink: 0 }} />}
          {m.label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 800, color: critical ? '#c2410c' : JADE, fontFamily: MANROPE, whiteSpace: 'nowrap' }}>
          {longDate(m.date)} &middot; {when}
        </span>
      </div>

      <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.5, margin: '6px 0 0' }}>
        {m.detail}
      </p>

      {action && (
        <a
          href={action.href}
          {...(action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
            fontSize: 13, fontWeight: 800, color: critical ? '#c2410c' : JADE,
            fontFamily: MANROPE, textDecoration: 'none',
          }}
        >
          {action.label}
          {action.external && <ExternalLink style={{ width: 12, height: 12 }} />}
        </a>
      )}
    </div>
  )
}
