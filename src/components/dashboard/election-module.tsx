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
import { ArrowRight, MapPin, Vote, Info } from 'lucide-react'
import { ELECTION_DATE } from '@/components/homepage/election-countdown'
import { INK, MANROPE } from '@/constants/theme'

/** Warm cream, and the same cream at an alpha. The panel used pure white and a
 *  neon jade over cool near-black — three colours from outside the palette, on
 *  a page where everything else is espresso on woven paper. */
const CREAM = '#f5e9dd'
const soft = (a: number) => `rgba(245,233,221,${a})`

export interface ElectionPartyLine { slug: string; short: string; color: string; seats2023: number }
export interface ElectionElectorate { label: string; href: string }

export function DashboardElection({ parties, electorates }: { parties: ElectionPartyLine[]; electorates: ElectionElectorate[] }) {
  const [days, setDays] = useState<number | null>(null)
  useEffect(() => {
    setDays(Math.ceil((ELECTION_DATE.getTime() - Date.now()) / 86_400_000))
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
            {days !== null && days <= 0 ? 'Election day' : 'days to go (approx)'}
          </div>
        </div>
      </div>

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
