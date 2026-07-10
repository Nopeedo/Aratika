'use client'

/**
 * CoalitionExplorer — the interactive "who could govern" tool. Given a seat
 * estimate (from the poll-of-polls averages), the reader taps parties to build a
 * coalition and watches the total climb toward the 61-seat majority line. Two
 * quick-pick blocs seed the realistic centre-left / centre-right combinations.
 *
 * Teaches the single most important idea in MMP: the party vote decides seats,
 * and government goes to whoever can assemble a majority — not the largest party.
 * Pure interaction on numbers passed from the server; nothing invented here.
 */

import * as React from 'react'
import { Landmark, Check, Info } from 'lucide-react'
import { hemicycle } from '@/lib/mmp'
import { PARTY_COLORS, PARTY_NAMES } from '@/constants/parties'
import { SPECTRUM_ORDER } from '@/constants/elections-data'
import type { PartySlug } from '@/types'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const EMPTY = '#e4e3de'

export interface SeatEntry { slug: PartySlug; seats: number }

const RIGHT_BLOC: PartySlug[] = ['national', 'act', 'nzfirst']
const LEFT_BLOC: PartySlug[] = ['labour', 'green', 'tpm']

export function CoalitionExplorer({ seats, total, asAt }: { seats: SeatEntry[]; total: number; asAt: string }) {
  const majority = Math.floor(total / 2) + 1
  const present = React.useMemo(() => seats.filter((s) => s.seats > 0), [seats])
  const seatOf = React.useMemo(() => Object.fromEntries(present.map((s) => [s.slug, s.seats])) as Record<string, number>, [present])

  // seat index -> party, left→right by spectrum (matches the hemicycle geometry)
  const seatParties = React.useMemo(() => {
    const arr: PartySlug[] = []
    for (const p of SPECTRUM_ORDER) for (let i = 0; i < (seatOf[p] || 0); i++) arr.push(p)
    return arr
  }, [seatOf])

  const geo = React.useMemo(() => hemicycle(total), [total])
  const [picked, setPicked] = React.useState<Set<PartySlug>>(new Set())

  const chosen = present.filter((s) => picked.has(s.slug))
  const chosenSeats = chosen.reduce((n, s) => n + s.seats, 0)
  const need = Math.max(0, majority - chosenSeats)
  const hasMajority = chosenSeats >= majority

  function toggle(slug: PartySlug) {
    setPicked((prev) => {
      const next = new Set(prev)
      next.has(slug) ? next.delete(slug) : next.add(slug)
      return next
    })
  }
  function setBloc(bloc: PartySlug[]) {
    setPicked(new Set(bloc.filter((p) => (seatOf[p] || 0) > 0)))
  }

  return (
    <div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, marginBottom: 8 }}>
        <Landmark style={{ width: 14, height: 14 }} /> Who could govern
      </div>
      <h2 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>Build a majority</h2>
      <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 16px', maxWidth: 580, lineHeight: 1.55 }}>
        Under MMP the biggest party doesn’t automatically govern — a bloc needs <b style={{ color: INK }}>{majority} of {total}</b> seats.
        Tap parties to add them to a government and see if they get there. Seats estimated from poll averages as at {asAt}.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, alignItems: 'center' }}>
        {/* Hemicycle */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg viewBox={`0 0 ${geo.width} ${geo.height}`} style={{ width: '100%', maxWidth: 460 }} role="img" aria-label={`${chosenSeats} of ${total} seats selected`}>
            {geo.seats.map((s, i) => {
              const party = seatParties[i]
              const on = party && picked.has(party)
              // Round coords: Math.cos/sin differ in the last FP digit between the
              // server (Node) and client (browser), which trips hydration on raw values.
              return <circle key={i} cx={Math.round(s.x * 100) / 100} cy={Math.round(s.y * 100) / 100} r={geo.dotR} fill={on ? PARTY_COLORS[party].bg : EMPTY} style={{ transition: 'fill .25s ease' }} />
            })}
            <text x={geo.width / 2} y={geo.height - 30} textAnchor="middle" style={{ fontFamily: MANROPE, fontWeight: 800, fontSize: 32, fill: hasMajority ? JADE : INK }}>{chosenSeats}</text>
            <text x={geo.width / 2} y={geo.height - 13} textAnchor="middle" style={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 12, fill: TERTIARY }}>of {total} · {majority} to govern</text>
          </svg>
        </div>

        {/* Controls */}
        <div>
          {/* Progress to majority */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ position: 'relative', height: 12, background: SURFACE, borderRadius: 6, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(100, (chosenSeats / total) * 100)}%`, background: hasMajority ? JADE : '#c07a12', borderRadius: 6, transition: 'width .3s ease' }} />
              <div title={`${majority} seats`} style={{ position: 'absolute', left: `${(majority / total) * 100}%`, top: -3, bottom: -3, width: 2, background: 'rgba(12,14,18,.45)' }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 13.5, fontFamily: MANROPE, color: hasMajority ? JADE : INK, fontWeight: 800 }}>
              {chosenSeats === 0 ? 'Pick parties to form a government' : hasMajority ? `Majority — this bloc could govern (${chosenSeats} seats)` : `${need} more ${need === 1 ? 'seat' : 'seats'} needed for a majority`}
            </div>
          </div>

          {/* Quick blocs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button onClick={() => setBloc(LEFT_BLOC)} style={blocBtn}>Centre-left bloc</button>
            <button onClick={() => setBloc(RIGHT_BLOC)} style={blocBtn}>Centre-right bloc</button>
            {picked.size > 0 && <button onClick={() => setPicked(new Set())} style={blocBtn}>Clear</button>}
          </div>

          {/* Party toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[...present].sort((a, b) => b.seats - a.seats).map((s) => {
              const on = picked.has(s.slug)
              return (
                <button
                  key={s.slug}
                  onClick={() => toggle(s.slug)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, cursor: 'pointer', width: '100%',
                    fontFamily: MANROPE, textAlign: 'left', background: on ? PARTY_COLORS[s.slug].light : '#fff',
                    border: `1px solid ${on ? PARTY_COLORS[s.slug].bg : BORDER}`,
                  }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: 5, background: on ? PARTY_COLORS[s.slug].bg : '#fff', border: `1px solid ${on ? PARTY_COLORS[s.slug].bg : '#cbd0d6'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {on && <Check style={{ width: 12, height: 12, color: '#fff' }} />}
                  </span>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: INK }}>{PARTY_NAMES[s.slug].short}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: INK }}>{s.seats}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, padding: '10px 12px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10 }}>
        <Info style={{ width: 15, height: 15, color: SECONDARY, flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 11.5, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
          A teaching tool, not a prediction. Seats are a Sainte-Laguë estimate from current poll averages; the real result depends on
          the vote, electorate wins and each poll’s margin of error. Which parties would actually work together is their decision, not ours.
        </p>
      </div>
    </div>
  )
}

const blocBtn: React.CSSProperties = { padding: '8px 13px', borderRadius: 999, border: `1px solid ${BORDER}`, background: '#fff', color: SECONDARY, fontFamily: MANROPE, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }
