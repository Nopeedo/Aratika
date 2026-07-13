/**
 * PollTracker — a SOURCED snapshot of where the parties are polling ahead of the
 * 2026 election. Shows a poll-of-polls average, an MMP seat projection (Sainte-
 * Laguë), the individual recent polls for transparency, preferred-PM figures, and
 * 2023 participation context. Every number is published + attributed; the average
 * and projection are transparent computations, clearly labelled — not a forecast.
 * Server component; plain styling (aesthetics pass later).
 */

import { Info, TrendingUp, Landmark, UserRound, Users2, ArrowUpRight, Radio } from 'lucide-react'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import type { PartySlug } from '@/types'
import {
  pollOfPolls, seatProjection, RECENT_POLLS, POLL_PARTIES, PREFERRED_PM,
  TURNOUT_2023, ENROLMENT_2023, ENROLMENT_LIVE_URL, PARTICIPATION_SOURCE,
  POLLS_AS_AT, POLLS_SOURCE, PROJECTION_SEATS, MAJORITY_SEATS,
} from '@/constants/polls-data'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '20px 22px' }}>{children}</div>
}
function Heading({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <Icon style={{ width: 17, height: 17, color: JADE }} />
        <h3 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>{title}</h3>
      </div>
      {sub && <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, margin: '4px 0 0 26px' }}>{sub}</p>}
    </div>
  )
}

export function PollTracker() {
  const pop = pollOfPolls()
  const seats = seatProjection()
  const totalSeats = seats.reduce((n, s) => n + s.seats, 0)
  const maxPct = Math.max(...pop.map((p) => p.pct), 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Intro */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, marginBottom: 8 }}>
          <Radio style={{ width: 14, height: 14 }} /> Where the parties are polling
        </div>
        <h2 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 8px' }}>2026 poll tracker</h2>
        <p style={{ fontSize: 14, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.6, maxWidth: 620 }}>
          A snapshot of published polls as at <b style={{ color: INK }}>{POLLS_AS_AT}</b>. We show the average across the most recent poll
          from each company — Arapono reports what pollsters publish and <b style={{ color: INK }}>does not predict the result</b>.
        </p>
      </div>

      {/* Poll of polls */}
      <Card>
        <Heading icon={TrendingUp} title="Poll of polls" sub={`Average of ${RECENT_POLLS.length} polls · party vote`} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {pop.map((p) => (
            <div key={p.slug} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 78, fontSize: 12.5, fontWeight: 700, color: INK, fontFamily: MANROPE, flexShrink: 0 }}>{PARTY_NAMES[p.slug].short}</span>
              <div style={{ flex: 1, position: 'relative', height: 20, background: SURFACE, borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(p.pct / maxPct) * 100}%`, background: PARTY_COLORS[p.slug].bg, borderRadius: 5 }} />
                {/* 5% threshold marker */}
                <div title="5% threshold" style={{ position: 'absolute', left: `${(5 / maxPct) * 100}%`, top: -2, bottom: -2, width: 2, background: 'rgba(12,14,18,.28)' }} />
              </div>
              <span style={{ width: 46, textAlign: 'right', fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE, flexShrink: 0 }}>{p.pct}%</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '12px 0 0', lineHeight: 1.5 }}>
          The vertical line marks the <b>5% threshold</b> a party must reach (or win an electorate) to enter Parliament.
        </p>
      </Card>

      {/* Seat projection */}
      <Card>
        <Heading icon={Landmark} title="If these averages held on election day" sub={`Seat estimate · Sainte-Laguë over ${PROJECTION_SEATS} seats`} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {seats.map((s) => (
            <div key={s.slug} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 78, fontSize: 12.5, fontWeight: 700, color: INK, fontFamily: MANROPE, flexShrink: 0 }}>{PARTY_NAMES[s.slug].short}</span>
              <div style={{ flex: 1, height: 20, background: SURFACE, borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(s.seats / Math.max(...seats.map((x) => x.seats))) * 100}%`, background: PARTY_COLORS[s.slug].bg, borderRadius: 5 }} />
              </div>
              <span style={{ width: 46, textAlign: 'right', fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE, flexShrink: 0 }}>{s.seats}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, padding: '10px 12px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10 }}>
          <Info style={{ width: 15, height: 15, color: SECONDARY, flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11.5, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
            An <b style={{ color: INK }}>estimate</b>, not a prediction — {totalSeats} seats shown; <b style={{ color: INK }}>{MAJORITY_SEATS}</b> are needed to govern.
            Actual seats depend on electorate results (Te Pāti Māori’s electorate wins can add overhang seats), turnout, and each poll’s margin of error.
          </p>
        </div>
      </Card>

      {/* Individual polls — transparency */}
      <Card>
        <Heading icon={Users2} title="The polls behind the average" />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 560, fontFamily: MANROPE }}>
            <thead>
              <tr>
                <th style={thLeft}>Poll</th>
                {POLL_PARTIES.map((slug) => (
                  <th key={slug} style={thCell}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: PARTY_COLORS[slug].bg }} />{PARTY_NAMES[slug].short}</span></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_POLLS.map((poll) => (
                <tr key={poll.pollster + poll.date}>
                  <td style={tdLeft}>
                    <a href={poll.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: INK, textDecoration: 'none', fontWeight: 700 }}>{poll.pollster}</a>
                    <div style={{ fontSize: 10.5, color: TERTIARY }}>{poll.fieldwork}</div>
                  </td>
                  {POLL_PARTIES.map((slug) => (
                    <td key={slug} style={tdCell}>{typeof poll.parties[slug] === 'number' ? `${poll.parties[slug]}` : '·'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Preferred PM + participation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
        <Card>
          <Heading icon={UserRound} title="Preferred Prime Minister" sub={`${PREFERRED_PM.pollster} · ${PREFERRED_PM.asOf}`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PREFERRED_PM.candidates.map((c) => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: INK, fontFamily: MANROPE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                <div style={{ width: 120, height: 16, background: SURFACE, borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ height: '100%', width: `${(c.pct / 20) * 100}%`, background: PARTY_COLORS[c.party].bg, borderRadius: 4 }} />
                </div>
                <span style={{ width: 34, textAlign: 'right', fontSize: 12.5, fontWeight: 800, color: INK, fontFamily: MANROPE, flexShrink: 0 }}>{c.pct}%</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE, margin: '10px 0 0' }}>The remainder is undecided, someone else, or none.</p>
        </Card>

        <Card>
          <Heading icon={Users2} title="Turnout & enrolment" sub="2023 General Election (baseline)" />
          <div style={{ display: 'flex', gap: 18, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1 }}>{TURNOUT_2023}%</div>
              <div style={{ fontSize: 11.5, color: SECONDARY, fontFamily: MANROPE, marginTop: 3 }}>Turnout of enrolled voters</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1 }}>{ENROLMENT_2023}%</div>
              <div style={{ fontSize: 11.5, color: SECONDARY, fontFamily: MANROPE, marginTop: 3 }}>Of eligible people enrolled</div>
            </div>
          </div>
          <a href={ENROLMENT_LIVE_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
            Live enrolment stats <ArrowUpRight style={{ width: 13, height: 13 }} />
          </a>
        </Card>
      </div>

      {/* Sources */}
      <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>
        Party-vote and preferred-PM figures compiled from published polls (Roy Morgan, 1News–Verian, The Post–Freshwater, Talbot Mills,
        Taxpayers’ Union–Curia) — <a href={POLLS_SOURCE} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 700 }}>aggregate ↗</a>.
        Turnout and enrolment: <a href={PARTICIPATION_SOURCE} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 700 }}>Electoral Commission ↗</a>.
        Poll-of-polls is a simple average; the seat estimate applies Sainte-Laguë to those averages. A snapshot — refreshed as new polls are published.
      </p>
    </div>
  )
}

const thLeft: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 800, color: SECONDARY, borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }
const thCell: React.CSSProperties = { textAlign: 'center', padding: '8px 8px', fontSize: 11, fontWeight: 800, color: SECONDARY, borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }
const tdLeft: React.CSSProperties = { textAlign: 'left', padding: '9px 10px', fontSize: 12.5, borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }
const tdCell: React.CSSProperties = { textAlign: 'center', padding: '9px 8px', fontSize: 12.5, fontWeight: 700, color: INK, borderBottom: `1px solid ${BORDER}` }
