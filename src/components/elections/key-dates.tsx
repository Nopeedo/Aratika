/**
 * KeyDates — the electoral timetable, directly under the hero.
 *
 * This is the most consequential content on the site and it was a 12px line
 * under the countdown. Everything else here helps someone decide how to vote;
 * this is what decides whether they get to vote at all — and 2026 changed the
 * rules. Enrolment now closes 13 days before election day, so the habit people
 * formed in 2020 and 2023 (enrol late, or on the day) will not work.
 *
 * Dates come from src/constants/electoral-calendar.json, transcribed from the
 * Electoral Commission's published timetable. The same file drives the
 * notification reminders, so a date can never say one thing on the page and
 * another in a push.
 *
 * Deliberately not a countdown: a countdown to the next milestone hides the
 * others, and the sequence is the point — enrolment closes BEFORE advance
 * voting opens, which is the bit that surprises people.
 */

import { ArrowUpRight } from 'lucide-react'
import { ELECTORAL_CALENDAR, ELECTORAL_SOURCE, type ElectoralMilestone } from '@/constants/electoral-calendar'
import { INK, SECONDARY, TERTIARY, BORDER, MANROPE, JADE } from '@/constants/theme'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmt(iso: string): { day: string; month: string } {
  const d = new Date(`${iso}T00:00:00Z`)
  return { day: String(d.getUTCDate()), month: MONTHS[d.getUTCMonth()] }
}

/**
 * The milestones a voter has to act on, in order. Administrative dates
 * (dissolution, nominations, return of the writ) are real but are not something
 * anyone has to do anything about, so they stay out of the strip.
 */
const SHOWN = ['writ-day-2026', 'enrolment-closes-2026', 'advance-voting-2026', 'election-day-2026']

/** The one that must not be missed — styled apart from the rest. */
const CRITICAL = 'enrolment-closes-2026'

export function KeyDates({ today }: { today: string }) {
  const items = SHOWN
    .map((id) => ELECTORAL_CALENDAR.find((m) => m.id === id))
    .filter((m): m is ElectoralMilestone => Boolean(m))

  return (
    <section id="key-dates" style={{ scrollMarginTop: 80 }}>
      <div style={{
        border: `1px solid ${BORDER}`, borderRadius: 16, background: '#fff', overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(42,18,6,.05)',
      }}>
        <div style={{ padding: '15px 18px 4px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 3px' }}>
            Dates that decide whether you can vote
          </h2>
          <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>
            New for 2026: enrolment closes <b style={{ color: INK }}>before</b> advance voting opens. Unlike 2023
            you cannot enrol on election day.
          </p>
        </div>

        <div className="keydates-row" style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, gap: 1, background: BORDER, marginTop: 14 }}>
          {items.map((m) => {
            const { day, month } = fmt(m.date)
            const critical = m.id === CRITICAL
            const past = m.date < today
            return (
              <div key={m.id} style={{
                background: critical ? '#fff8f5' : '#fff', padding: '13px 14px 15px',
                borderTop: `3px solid ${critical ? '#b42318' : 'transparent'}`,
                opacity: past ? 0.5 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: critical ? '#b42318' : INK, fontFamily: MANROPE, lineHeight: 1, letterSpacing: '-.02em' }}>{day}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: critical ? '#b42318' : SECONDARY, fontFamily: MANROPE }}>{month}</span>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: INK, fontFamily: MANROPE, marginTop: 6, lineHeight: 1.3 }}>
                  {m.id === 'writ-day-2026' ? 'Enrol by today to avoid a special vote'
                    : m.id === 'enrolment-closes-2026' ? 'Last day to enrol'
                      : m.id === 'advance-voting-2026' ? 'Advance voting opens'
                        : 'Election day'}
                </div>
                {m.timeNote && (
                  <div style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE, marginTop: 3 }}>{m.timeNote}</div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 18px', borderTop: `1px solid ${BORDER}` }}>
          <a href="https://vote.nz" target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 800,
            color: '#fff', background: JADE, borderRadius: 999, padding: '7px 14px',
            fontFamily: MANROPE, textDecoration: 'none',
          }}>
            Check you&rsquo;re enrolled <ArrowUpRight style={{ width: 13, height: 13 }} />
          </a>
          <span style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.45 }}>
            Timetable from the {ELECTORAL_SOURCE.name}
          </span>
        </div>
      </div>
    </section>
  )
}
