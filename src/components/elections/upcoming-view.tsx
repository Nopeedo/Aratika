/**
 * UpcomingView — the prepped 2026 election page. Countdown, key dates (TBC),
 * how to take part, the 2023 baseline ("the Parliament you're voting to change"),
 * parties likely contesting, and a results scaffold for election night.
 */

import Link from 'next/link'
import { ArrowRight, ArrowUpRight, UserPlus, Vote, Clock, Info, CalendarX, Swords } from 'lucide-react'
import type { ElectionData } from '@/constants/elections-data'
import { BASELINE_ELECTION } from '@/constants/elections-data'
import { PARTY_NAMES, PARTY_COLORS, PARTY_ORDER } from '@/constants/parties'
import { CountdownBig } from './countdown-big'
import { SeatHemicycle } from './seat-hemicycle'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const STEPS = [
  { icon: UserPlus, title: 'Enrol or check your details', body: 'You must be enrolled to vote. Enrol or update your address anytime at vote.nz.', href: 'https://vote.nz', cta: 'Enrol at vote.nz' },
  { icon: Vote, title: 'Understand your two votes', body: 'Under MMP you cast a party vote and an electorate vote. Learn exactly what each one does.', href: '/learn/mmp', cta: 'Learn about MMP' },
  { icon: Clock, title: 'Vote early or on the day', body: 'Advance voting usually opens about two weeks before election day. Dates confirmed closer to the time.', href: null, cta: null },
]

export function UpcomingView({ e }: { e: ElectionData }) {
  const base = BASELINE_ELECTION

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
      <CountdownBig />

      {/* Key dates — TBC */}
      <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12 }}>
        <CalendarX style={{ width: 17, height: 17, color: '#b45309', flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: '#92400e', fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
          <b>Key dates are not yet set.</b> The election date, the writ, enrolment deadlines and advance-voting period are
          confirmed by the Electoral Commission closer to the election. We’ll publish them here as soon as they’re official.
        </p>
      </div>

      {/* How to take part */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 14px' }}>How to have your say</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {STEPS.map((s) => (
            <div key={s.title} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon style={{ width: 20, height: 20, color: JADE }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{s.title}</div>
              <div style={{ flex: 1, fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55 }}>{s.body}</div>
              {s.href && s.cta && (
                s.href.startsWith('http') ? (
                  <a href={s.href} target="_blank" rel="noopener noreferrer" style={cta}>{s.cta} <ArrowUpRight style={ic} /></a>
                ) : (
                  <Link href={s.href} style={cta}>{s.cta} <ArrowRight style={ic} /></Link>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      {/* The Parliament you're voting to change (2023 baseline) */}
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 18, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE }}>The Parliament you’re voting to change</div>
          <div style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE }}>The current make-up, from the {base.year} General Election — your baseline for comparison.</div>
        </div>
        <div style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <SeatHemicycle results={base.results!} total={base.totalSeats!} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {base.results!.map((r) => (
              <div key={r.party} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: MANROPE }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: PARTY_COLORS[r.party].bg }} />
                <span style={{ fontSize: 13, color: INK, flex: 1 }}>{PARTY_NAMES[r.party].short}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: INK }}>{r.seats}</span>
              </div>
            ))}
            <Link href={`/elections/${base.slug}`} style={{ ...cta, marginTop: 6 }}>Full {base.year} results <ArrowRight style={ic} /></Link>
          </div>
        </div>
      </div>

      {/* Battlegrounds CTA */}
      <Link href="/battlegrounds" style={{ textDecoration: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', background: 'linear-gradient(135deg,#fef2f2,#fff7ed)', border: '1px solid #fecaca', borderRadius: 16, padding: '18px 22px' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#fff', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Swords style={{ width: 22, height: 22, color: '#dc2626' }} />
          </div>
          <div style={{ flex: 1, minWidth: 220, fontFamily: MANROPE }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: INK }}>Battlegrounds — the seats to watch</div>
            <div style={{ fontSize: 13, color: SECONDARY, marginTop: 2 }}>See which electorates are most likely to change hands, and follow each contest seat by seat.</div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, color: '#b91c1c', fontFamily: MANROPE }}>Explore <ArrowRight style={{ width: 15, height: 15 }} /></span>
        </div>
      </Link>

      {/* Parties likely contesting */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>Parties contesting</h2>
        <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 12px' }}>
          The parties currently in Parliament. Others may register to contest — the final list is confirmed when nominations close.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PARTY_ORDER.map((p) => (
            <Link key={p} href={`/parties/${p}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 999, border: `1px solid ${BORDER}`, background: '#fff', textDecoration: 'none', fontFamily: MANROPE }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: PARTY_COLORS[p].bg }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>{PARTY_NAMES[p].short}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Election-night scaffold */}
      <div style={{ display: 'flex', gap: 10, padding: '16px 18px', background: SURFACE, border: `1px dashed ${TERTIARY}`, borderRadius: 14 }}>
        <Info style={{ width: 17, height: 17, color: SECONDARY, flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
          <b style={{ color: INK }}>On election night,</b> live results — party vote, seats, the new hemicycle, and a side-by-side
          comparison against {base.year} — will appear here as they’re published by the Electoral Commission.
        </p>
      </div>

      {/* Source */}
      <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 14 }}>
        <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, textDecoration: 'none' }}>
          Enrolment & voting information: Electoral Commission (vote.nz) <ArrowUpRight style={{ width: 11, height: 11, display: 'inline', verticalAlign: '-1px' }} />
        </a>
      </div>
    </div>
  )
}

const ic: React.CSSProperties = { width: 14, height: 14 }
const cta: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: JADE,
  fontFamily: MANROPE, textDecoration: 'none',
}
