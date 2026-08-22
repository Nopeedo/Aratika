'use client'

/**
 * DashboardElection — the 2026 election, inside the user's command centre.
 * A live countdown, the parties you follow with their 2023 baseline seats
 * (the seats they're defending/chasing — surfaced first, per your follows),
 * your tracked electorate(s), and a link to the full Election Centre. Honest:
 * live results land on the night, from the Electoral Commission — nothing here
 * is invented.
 */

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowRight, MapPin, Vote, Info, CalendarClock } from 'lucide-react'
import { ELECTION_DATE } from '@/components/homepage/election-countdown'
import CALENDAR from '@/constants/electoral-calendar.json'
import { INK, MANROPE } from '@/constants/theme'

/** Warm cream, and the same cream at an alpha. The panel used pure white and a
 *  neon jade over cool near-black — three colours from outside the palette, on
 *  a page where everything else is espresso on woven paper. */
const CREAM = '#f5e9dd'
const soft = (a: number) => `rgba(245,233,221,${a})`

export interface ElectionPartyLine { slug: string; short: string; color: string; seats2023: number }
export interface ElectionElectorate { label: string; href: string }

/** "25 October". Every milestone falls in the election year, so the year would
 *  be noise on all ten of them. */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
function readable(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]}`
}

export function DashboardElection({ parties, electorates }: { parties: ElectionPartyLine[]; electorates: ElectionElectorate[] }) {
  const [days, setDays] = useState<number | null>(null)
  // The next dated milestone from the Electoral Commission's own timetable.
  //
  // detect-electoral-dates.mjs pushes these as they approach, and the dashboard
  // never showed them: it builds tiles from notifications that name a tracked
  // item, and an enrolment deadline belongs to no bookmark, so every one of
  // them was push-only and invisible here. Reading the calendar directly is
  // better than inventing an entity to hang them on — the date is a fact about
  // the election, true whether or not a notification fired, and it does not
  // bring back the inbox to say so.
  const [next, setNext] = useState<{ label: string; date: string; days: number } | null>(null)
  useEffect(() => {
    setDays(Math.ceil((ELECTION_DATE.getTime() - Date.now()) / 86_400_000))
    // Resolved after mount, never in render: server and browser can straddle
    // midnight, and a date computed during render is a hydration mismatch.
    const todayNZ = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })
    const upcoming = (CALENDAR.milestones as { date: string; label: string }[])
      .filter((m) => m.date >= todayNZ)
      .sort((a, b) => a.date.localeCompare(b.date))[0]
    if (upcoming) {
      setNext({
        label: upcoming.label,
        date: readable(upcoming.date),
        days: Math.round((Date.parse(`${upcoming.date}T00:00:00Z`) - Date.parse(`${todayNZ}T00:00:00Z`)) / 86_400_000),
      })
    }
  }, [])

  return (
    <div style={{ background: INK, borderRadius: 18, padding: 'clamp(20px, 4vw, 28px)', color: CREAM }}>
      {/* Header + countdown */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: soft(.10), color: CREAM, border: `1px solid ${soft(.22)}`, borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 800, fontFamily: MANROPE, marginBottom: 10 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: CREAM }} /> Live election tracking
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: CREAM, fontFamily: MANROPE, margin: 0, letterSpacing: '-.01em' }}>2026 General Election</h2>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: CREAM, fontFamily: MANROPE, lineHeight: 1 }}>
            {days === null ? '—' : days > 0 ? days : '0'}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(245,233,221,.6)', fontFamily: MANROPE, textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 3 }}>
            {days !== null && days <= 0 ? 'Election day' : 'days to go'}
          </div>
        </div>
      </div>

      {/* Next milestone from the Electoral Commission timetable. Placed above
          everything else in the panel because it is the only thing here with a
          deadline attached: missing it costs someone their vote. */}
      {next && (
        <Link href="/elections/2026" style={{
          display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
          background: soft(.08), border: `1px solid ${soft(.18)}`, borderRadius: 12,
          padding: '11px 13px', marginBottom: 16,
        }}>
          <CalendarClock style={{ width: 16, height: 16, color: CREAM, flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, color: CREAM, fontFamily: MANROPE, lineHeight: 1.3 }}>{next.label}</span>
            <span style={{ display: 'block', fontSize: 11.5, color: 'rgba(245,233,221,.62)', fontFamily: MANROPE, marginTop: 2 }}>
              {next.date} · {next.days === 0 ? 'today' : next.days === 1 ? 'tomorrow' : `in ${next.days} days`}
            </span>
          </span>
          <ArrowRight style={{ width: 14, height: 14, color: soft(.7), flexShrink: 0 }} />
        </Link>
      )}

      {/* Your parties — seats they hold going in */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(245,233,221,.6)', fontFamily: MANROPE, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Your parties, seats going in (2023)</div>
        {parties.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {parties.map((p) => (
              <div key={p.slug} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Party dots keep their real colour, but NZ First's is pure
                    black — invisible on espresso. A faint cream ring keeps every
                    dot legible without altering any party's colour. */}
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0, boxShadow: `0 0 0 1.5px ${soft(.28)}` }} />
                <Link href={`/parties/${p.slug}`} style={{ flex: 1, fontSize: 14, fontWeight: 700, color: CREAM, fontFamily: MANROPE, textDecoration: 'none' }}>{p.short}</Link>
                <span style={{ fontSize: 14, fontWeight: 800, color: CREAM, fontFamily: MANROPE }}>{p.seats2023}</span>
                <span style={{ fontSize: 11.5, color: 'rgba(245,233,221,.5)', fontFamily: MANROPE, width: 42, textAlign: 'right' }}>seats</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'rgba(245,233,221,.7)', fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
            Follow a party and its seats to defend will show here. <Link href="/parties" style={{ color: CREAM, fontWeight: 700 }}>Browse parties →</Link>
          </p>
        )}
      </div>

      {/* Your electorate */}
      <div style={{ marginBottom: 18, paddingTop: 16, borderTop: '1px solid rgba(245,233,221,.1)' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(245,233,221,.6)', fontFamily: MANROPE, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Your electorate</div>
        {electorates.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {electorates.map((el) => (
              <Link key={el.href} href={el.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: CREAM, background: 'rgba(245,233,221,.08)', border: '1px solid rgba(245,233,221,.16)', borderRadius: 999, padding: '6px 12px', textDecoration: 'none', fontFamily: MANROPE }}>
                <MapPin style={{ width: 13, height: 13, color: soft(.7) }} /> {el.label}
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'rgba(245,233,221,.7)', fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
            Track your electorate to follow your local race. <Link href="/map" style={{ color: CREAM, fontWeight: 700 }}>Find your electorate →</Link>
          </p>
        )}
      </div>

      {/* CTA + honest note */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <Link href="/elections/2026" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, color: INK, background: CREAM, borderRadius: 10, padding: '10px 16px', textDecoration: 'none', fontFamily: MANROPE }}>
          <Vote style={{ width: 15, height: 15 }} /> Open the Election Centre <ArrowRight style={{ width: 14, height: 14 }} />
        </Link>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14, fontSize: 11.5, color: 'rgba(245,233,221,.55)', fontFamily: MANROPE, lineHeight: 1.5 }}>
        <Info style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
        <span>Live results land here on election night, from the Electoral Commission: party vote, seats and your electorate.</span>
      </div>
    </div>
  )
}
