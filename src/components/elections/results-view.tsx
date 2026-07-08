/**
 * ResultsView — official results for a completed election: party-vote bars, the
 * seat hemicycle, a full seat table, minor parties, and notes. Server component.
 */

import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Landmark, MapPin, Info, Trophy } from 'lucide-react'
import type { ElectionData } from '@/constants/elections-data'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import { SeatHemicycle } from './seat-hemicycle'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const fmt = (n: number) => n.toLocaleString('en-NZ')

export function ResultsView({ e }: { e: ElectionData }) {
  const results = e.results ?? []
  const maxPct = Math.max(...results.map((r) => r.votePct), 1)
  const winner = results[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>

      {/* Government formed */}
      {e.governmentFormed && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '16px 18px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 14 }}>
          <Trophy style={{ width: 20, height: 20, color: JADE, flexShrink: 0 }} />
          <div style={{ fontFamily: MANROPE }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#065f46' }}>Government formed</div>
            <div style={{ fontSize: 13.5, color: '#047857' }}>{e.governmentFormed}</div>
          </div>
        </div>
      )}

      {/* Party vote + hemicycle */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 22, alignItems: 'start' }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>Party vote</h2>
          <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 14px' }}>The party vote decides each party’s share of seats.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {results.map((r) => (
              <div key={r.party}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: INK, fontFamily: MANROPE }}>{PARTY_NAMES[r.party].short}</span>
                  <span style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE }}>{r.votePct.toFixed(2)}% · <b style={{ color: INK }}>{r.seats}</b> seats</span>
                </div>
                <div style={{ height: 12, borderRadius: 6, background: '#f1efea', overflow: 'hidden' }}>
                  <div style={{ width: `${(r.votePct / maxPct) * 100}%`, height: '100%', background: PARTY_COLORS[r.party].bg, borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <SeatHemicycle results={results} total={e.totalSeats ?? results.reduce((s, r) => s + r.seats, 0)} />
        </div>
      </div>

      {/* Seat table */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 12px' }}>Full results</h2>
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 420, borderCollapse: 'collapse', fontFamily: MANROPE }}>
            <thead>
              <tr style={{ background: SURFACE }}>
                {['Party', 'Party votes', '%', 'Elec.', 'List', 'Total'].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', fontSize: 11, fontWeight: 800, color: SECONDARY, textTransform: 'uppercase', letterSpacing: '.05em', padding: '10px 14px', borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.party}>
                  <td style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}` }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: PARTY_COLORS[r.party].bg }} />
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>{PARTY_NAMES[r.party].full}</span>
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontSize: 13, color: '#33373f', padding: '10px 14px', borderBottom: `1px solid ${BORDER}` }}>{fmt(r.partyVotes)}</td>
                  <td style={{ textAlign: 'right', fontSize: 13, color: '#33373f', padding: '10px 14px', borderBottom: `1px solid ${BORDER}` }}>{r.votePct.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontSize: 13, color: SECONDARY, padding: '10px 14px', borderBottom: `1px solid ${BORDER}` }}>{r.electorateSeats || '–'}</td>
                  <td style={{ textAlign: 'right', fontSize: 13, color: SECONDARY, padding: '10px 14px', borderBottom: `1px solid ${BORDER}` }}>{r.listSeats || '–'}</td>
                  <td style={{ textAlign: 'right', fontSize: 13.5, fontWeight: 800, color: INK, padding: '10px 14px', borderBottom: `1px solid ${BORDER}` }}>{r.seats}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {e.others && e.others.length > 0 && (
          <p style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE, marginTop: 10 }}>
            Largest parties that won no seats: {e.others.map((o) => `${o.name} (${o.votePct.toFixed(2)}%)`).join(' · ')}.
          </p>
        )}
      </div>

      {/* Notes */}
      {e.notes && e.notes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {e.notes.map((n, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12 }}>
              <Info style={{ width: 15, height: 15, color: '#1e40af', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12.5, color: '#1e3a8a', fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>{n}</p>
            </div>
          ))}
        </div>
      )}

      {/* Explore */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link href="/map" style={pill(true)}><MapPin style={ic} /> Electorate results on the map</Link>
        <Link href="/mps" style={pill(false)}><Landmark style={ic} /> The MPs elected</Link>
        <Link href="/parties" style={pill(false)}>Parties <ArrowRight style={ic} /></Link>
      </div>

      {/* Source */}
      <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 14 }}>
        <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, textDecoration: 'none' }}>
          Source: Electoral Commission — official {e.year} General Election results <ArrowUpRight style={{ width: 11, height: 11, display: 'inline', verticalAlign: '-1px' }} />
        </a>
      </div>
    </div>
  )
}

const ic: React.CSSProperties = { width: 15, height: 15 }
function pill(primary: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, fontFamily: MANROPE,
    padding: '9px 15px', borderRadius: 11, textDecoration: 'none',
    background: primary ? JADE : '#fff', color: primary ? '#fff' : INK, border: primary ? 'none' : `1px solid ${BORDER}`,
  }
}
