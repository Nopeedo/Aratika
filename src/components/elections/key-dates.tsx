'use client'

/**
 * KeyDates — the reasoning and the full electoral timetable.
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
 *
 * THE SINGLE-CARD SUMMARY MOVED OUT OF THIS SECTION, to the very top of the
 * page — see next-deadline-card.tsx. It used to render here, directly under
 * this section's own heading, and that was right for one redesign pass: it
 * fixed a 4-column grid opening fully expanded on arrival (§1.1). But asked
 * which single thing on the whole page mattered most, the answer was that
 * card, not this section's position on the page — so it moved to sit above
 * even the headline, and this section kept the parts that belong lower down:
 * the reasoning behind the rule change (the (i)), and the full sequence for
 * anyone who wants to see every date at once. Nothing here duplicates the
 * card above; this section IS what "Show all key dates" opens into.
 *
 * IT TAKES THE SHARED ZoneHead, at the shared peer heading size. The title
 * was 15px: the block that decides whether a reader gets to vote had the
 * smallest heading on the site, which reads as a caption on the sections
 * around it (§4).
 *
 * The paragraph that used to sit under that heading is behind the (i). It
 * explained what the strip shows: the card at the top of the page already
 * says "Last day to enrol" in red, with a big day figure and days-remaining,
 * against a date. §1.2's test is whether a reader who has been here before
 * would skip it, and they would.
 *
 * Its phone layout ships here too. `.keydates-row` lived 600 lines away in
 * globals.css, where a rule for one component on one page had to fight inline
 * styles with !important. Same !important, same rule, shipped with the thing it
 * sizes (§3.2), under a new class name so the two cannot both match and leave
 * source order to decide the tie (§5.5). The globals.css rule is dead now and
 * is flagged for deletion by whoever owns that file.
 */

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ELECTORAL_CALENDAR, ELECTORAL_SOURCE, type ElectoralMilestone } from '@/constants/electoral-calendar'
import { InfoHeading, InfoText } from '@/components/ui/info-button'
import { ZoneHead } from './zone-head'
import { CRITICAL, CRITICAL_RED, LABELS, SHOWN, fmt } from './next-deadline-card'
import { INK, SECONDARY, TERTIARY, BORDER, MANROPE } from '@/constants/theme'

export function KeyDates({ today }: { today: string }) {
  const [showAll, setShowAll] = useState(false)
  const items = SHOWN
    .map((id) => ELECTORAL_CALENDAR.find((m) => m.id === id))
    .filter((m): m is ElectoralMilestone => Boolean(m))

  return (
    <section id="key-dates" style={{ scrollMarginTop: 80 }}>
      <style dangerouslySetInnerHTML={{ __html: KEYDATES_CSS }} />

      <ZoneHead eyebrow="Key dates" title="Dates that decide whether you can vote" accent={CRITICAL_RED}
        infoLabel="What changed about enrolling in 2026">
        <InfoHeading accent={CRITICAL_RED}>You have to be enrolled</InfoHeading>
        <InfoText>
          You must be enrolled to vote, and 2026 changed when. Enrolment closes before advance voting opens, unlike
          2023: you cannot enrol once advance voting starts, or on election day.
        </InfoText>
        <InfoHeading accent={CRITICAL_RED}>What Writ Day means for you</InfoHeading>
        <InfoText>
          Enrol by Writ Day and voting is straightforward. Enrol after it and you cast a special vote, which still
          counts but takes longer to process.
        </InfoText>
        <InfoHeading accent={CRITICAL_RED}>Where these dates come from</InfoHeading>
        <InfoText>
          The {ELECTORAL_SOURCE.name}. The same file drives our reminders, so a date cannot say one thing here and
          another in a notification.
        </InfoText>
      </ZoneHead>

      <button
        type="button"
        onClick={() => setShowAll((v) => !v)}
        aria-expanded={showAll}
        style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '8px 2px', background: 'none', border: 'none',
          fontSize: 12.5, fontWeight: 800, color: SECONDARY, fontFamily: MANROPE, cursor: 'pointer',
        }}
      >
        {showAll ? 'Hide the full timetable' : 'Show all key dates'}
        <ChevronDown style={{ width: 14, height: 14, transform: showAll ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease' }} strokeWidth={2.5} />
      </button>

      {showAll && (
        <div style={{
          marginTop: 8, border: `1px solid ${BORDER}`, borderRadius: 16, background: '#fff', overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(42,18,6,.05)',
        }}>
          <div className="kd-row" style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, gap: 1, background: BORDER }}>
            {items.map((m) => {
              const { day, month } = fmt(m.date)
              const critical = m.id === CRITICAL
              const past = m.date < today
              return (
                <div key={m.id} style={{
                  background: critical ? '#fff8f5' : '#fff', padding: '12px 13px 14px',
                  borderTop: `3px solid ${critical ? CRITICAL_RED : 'transparent'}`,
                  opacity: past ? 0.5 : 1,
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                    <span style={{ fontSize: 23, fontWeight: 800, color: critical ? CRITICAL_RED : INK, fontFamily: MANROPE, lineHeight: 1, letterSpacing: '-.02em' }}>{day}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: critical ? CRITICAL_RED : SECONDARY, fontFamily: MANROPE }}>{month}</span>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: INK, fontFamily: MANROPE, marginTop: 5, lineHeight: 1.3 }}>
                    {LABELS[m.id] ?? m.label}
                  </div>
                  {/* The window, not just its opening. `endDate` was printed
                      only by the hero subline, and when that subline was cut as
                      a duplicate the CLOSING of advance voting stopped being
                      stated anywhere on the site: this tile says "Advance
                      voting opens" and nothing said when it shuts. A cut
                      removes a DUPLICATE; this fact had no second copy (§1.5).
                      The date is derived rather than listed in the
                      Commission's timetable, and the derivation is recorded in
                      `endDateNote` beside it. */}
                  {m.endDate && (() => { const e = fmt(m.endDate); return (
                    <div style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE, marginTop: 3 }}>
                      until {e.day} {e.month}
                    </div>
                  ) })()}
                  {m.timeNote && (
                    <div style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE, marginTop: 3 }}>{m.timeNote}</div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ padding: '10px 18px 12px', borderTop: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.45 }}>
              Timetable from the {ELECTORAL_SOURCE.name}
            </span>
          </div>
        </div>
      )}
    </section>
  )
}

/* !important because the column count is set inline from items.length, and an
   inline style outranks a stylesheet rule (§3.2). Four cells at 375px gives
   each one 84px, which breaks "Advance voting opens" over three lines and puts
   the whole strip at 96px of label for 23px of date. */
const KEYDATES_CSS = `
@media (max-width: 700px) {
  .kd-row { grid-template-columns: 1fr 1fr !important; }
}
`
