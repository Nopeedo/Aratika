'use client'

/**
 * SeatChamber — one hemicycle, three ways to read it.
 *
 * The Election Centre used to draw the 120-odd seats twice, in two sections
 * some 1600px apart: a static chart of the Parliament elected in 2023, and the
 * coalition builder working off poll-projected seats. Two charts of the same
 * shape, answering three questions a reader has in sequence — what is there
 * now, what would the polls make it, and what could govern — and answering them
 * by scrolling rather than by comparing.
 *
 * A toggle is the right shape for that. The chart stays put and the numbers
 * change under it, which is exactly the comparison; the reader does it by
 * tapping rather than by remembering what was two screens up.
 *
 *   as elected    the 2023 result, 122 seats including the overhang
 *   if polls held a Sainte-Laguë estimate from the poll-of-polls, 120 seats
 *   build         the same estimate, but you pick who governs
 *
 * The first tab is labelled "as elected", not "now". At least one MP has
 * changed party since 2023, so a chart captioned "the current Parliament" would
 * be making a claim this data can't support. It shows what the election
 * returned, and says so.
 *
 * Nothing is predicted here. The projection is an estimate from published poll
 * averages, and which parties would actually work together is their decision —
 * both are stated on the two tabs that use it.
 */

import * as React from 'react'
import { Landmark, Check, Info, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { hemicycle } from '@/lib/mmp'
import { PARTY_COLORS, PARTY_NAMES } from '@/constants/parties'
import { SPECTRUM_ORDER, type PartyResult } from '@/constants/elections-data'
import type { PartySlug } from '@/types'
import { BORDER, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY } from '@/constants/theme'

const EMPTY = '#e4e3de'
const RIGHT_BLOC: PartySlug[] = ['national', 'act', 'nzfirst']
const LEFT_BLOC: PartySlug[] = ['labour', 'green', 'tpm']

export interface SeatEntry { slug: PartySlug; seats: number; pct?: number }

type Mode = 'elected' | 'polls' | 'build'

const TABS: { key: Mode; label: string }[] = [
  { key: 'elected', label: 'As elected' },
  { key: 'polls', label: 'If polls held' },
  { key: 'build', label: 'Build a bloc' },
]

/**
 * Seat index -> party, left→right along the political spectrum, so the chart
 * keeps the same seating plan whichever set of numbers is feeding it.
 *
 * SPECTRUM_ORDER lists the six parties in the current Parliament, and a party
 * missing from it used to be dropped silently: the loop only ever emitted seats
 * for slugs it already knew. TOP polls above the 5% threshold on live data, so
 * the projection gives it around eight seats — which rendered as eight EMPTY
 * grey dots, and in build mode would have added eight to the total while
 * lighting nothing. Nothing errored; the chart was just quietly short.
 *
 * Unplaced parties render between the two blocs. That is a rendering fallback
 * for "we have not assigned this party a spectrum position", not a claim that
 * it is centrist — a hemicycle has to seat every member somewhere, and the
 * boundary is the slot that asserts least. Giving TOP a deliberate position is
 * a call for an editor, not for this function.
 */
const BLOC_BOUNDARY = 3 // SPECTRUM_ORDER is left→right: green, labour, tpm | nzfirst, national, act

function seatOrder(byParty: Record<string, number>): PartySlug[] {
  const held = (p: PartySlug) => (byParty[p] || 0) > 0
  const unplaced = (Object.keys(byParty) as PartySlug[])
    .filter((p) => held(p) && !SPECTRUM_ORDER.includes(p))
  const order: PartySlug[] = [
    ...SPECTRUM_ORDER.slice(0, BLOC_BOUNDARY),
    ...unplaced,
    ...SPECTRUM_ORDER.slice(BLOC_BOUNDARY),
  ]
  const arr: PartySlug[] = []
  for (const p of order) for (let i = 0; i < (byParty[p] || 0); i++) arr.push(p)
  return arr
}

export function SeatChamber({
  elected, electedTotal, electedYear, electedSlug, projection, projectionTotal, asAt,
}: {
  elected: PartyResult[]
  electedTotal: number
  electedYear: number
  electedSlug: string
  projection: SeatEntry[]
  projectionTotal: number
  asAt: string
}) {
  const [mode, setMode] = React.useState<Mode>('elected')
  const [picked, setPicked] = React.useState<Set<PartySlug>>(new Set())

  const electedByParty = React.useMemo(
    () => Object.fromEntries(elected.map((r) => [r.party, r.seats])) as Record<string, number>, [elected])
  const projected = React.useMemo(() => projection.filter((s) => s.seats > 0), [projection])
  const projectedByParty = React.useMemo(
    () => Object.fromEntries(projected.map((s) => [s.slug, s.seats])) as Record<string, number>, [projected])

  const isElected = mode === 'elected'
  const total = isElected ? electedTotal : projectionTotal
  const majority = Math.floor(total / 2) + 1
  const byParty = isElected ? electedByParty : projectedByParty

  const geo = React.useMemo(() => hemicycle(total), [total])
  const seatParties = React.useMemo(() => seatOrder(byParty), [byParty])

  // Rows, biggest first. Same shape in all three modes so the list doesn't
  // reflow when the tab changes — only the numbers and the checkbox do.
  const rows = React.useMemo(() => {
    if (isElected) {
      return [...elected].sort((a, b) => b.seats - a.seats)
        .map((r) => ({ slug: r.party, seats: r.seats, pct: r.votePct }))
    }
    return [...projected].sort((a, b) => b.seats - a.seats)
      .map((s) => ({ slug: s.slug, seats: s.seats, pct: s.pct }))
  }, [isElected, elected, projected])

  const chosenSeats = mode === 'build'
    ? rows.reduce((n, r) => n + (picked.has(r.slug) ? r.seats : 0), 0)
    : 0
  const hasMajority = chosenSeats >= majority
  const need = Math.max(0, majority - chosenSeats)

  function toggle(slug: PartySlug) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug); else next.add(slug)
      return next
    })
  }

  // The big number under the chart: seats chosen while building, the chamber
  // size otherwise.
  const bigNumber = mode === 'build' ? chosenSeats : total
  const caption = mode === 'build' ? `of ${total} · ${majority} to govern` : `seats · ${majority} for a majority`

  const title = mode === 'elected' ? `The Parliament you’re voting to change`
    : mode === 'polls' ? 'If the polls held today'
    : 'Build a majority'
  const sub = mode === 'elected'
    ? `As elected at the ${electedYear} General Election. It doesn’t reflect any changes in party membership since.`
    : mode === 'polls'
    ? `A seat estimate from the poll averages as at ${asAt}. Polls are not a result.`
    : `Under MMP the biggest party doesn’t automatically govern. A bloc needs ${majority} of ${total}. Tap parties to build one.`

  return (
    <div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, marginBottom: 9 }}>
        <Landmark style={{ width: 14, height: 14 }} /> The seats
      </div>

      {/* Three equal columns rather than a wrapping pill row: at 343px a row of
          pills either wraps unevenly or scrolls sideways, and a toggle you have
          to scroll to see the third option of is a toggle with two options. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 4, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 4, marginBottom: 14 }}>
        {TABS.map((t) => {
          const on = mode === t.key
          return (
            <button
              key={t.key}
              onClick={() => setMode(t.key)}
              aria-pressed={on}
              style={{
                padding: '9px 6px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontFamily: MANROPE, fontSize: 13, fontWeight: 800, lineHeight: 1.2,
                background: on ? '#fff' : 'transparent', color: on ? INK : TERTIARY,
                boxShadow: on ? '0 1px 3px rgba(12,14,18,.10)' : 'none',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <h2 style={{ fontSize: 'clamp(20px, 4.4vw, 26px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: '0 0 5px' }}>{title}</h2>
      <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 8px', maxWidth: 580, lineHeight: 1.55 }}>{sub}</p>
      {mode === 'elected' && (
        <Link href={`/elections/${electedSlug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
          Full {electedYear} results <ArrowRight style={{ width: 14, height: 14 }} />
        </Link>
      )}

      <div style={{ marginTop: 14, border: `1px solid ${BORDER}`, borderRadius: 18, background: '#fff', boxShadow: '0 1px 2px rgba(42,18,6,.04)', padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 18, alignItems: 'center' }}>

          {/* Chart */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg viewBox={`0 0 ${geo.width} ${geo.height}`} style={{ width: '100%', maxWidth: 460 }} role="img"
              aria-label={mode === 'build' ? `${chosenSeats} of ${total} seats selected` : `Seat distribution, ${total} seats`}>
              {geo.seats.map((s, i) => {
                const party = seatParties[i]
                const lit = mode !== 'build' || (party && picked.has(party))
                // Round the coordinates: Math.cos/sin can differ in the last
                // floating-point digit between the server render and the
                // browser's, which trips hydration on the raw values.
                return (
                  <circle
                    key={i}
                    cx={Math.round(s.x * 100) / 100}
                    cy={Math.round(s.y * 100) / 100}
                    r={geo.dotR}
                    fill={party && lit ? PARTY_COLORS[party].bg : EMPTY}
                    style={{ transition: 'fill .25s ease' }}
                  />
                )
              })}
              <text x={geo.width / 2} y={geo.height - 30} textAnchor="middle" style={{ fontFamily: MANROPE, fontWeight: 800, fontSize: 31, fill: mode === 'build' && hasMajority ? JADE : INK }}>{bigNumber}</text>
              <text x={geo.width / 2} y={geo.height - 13} textAnchor="middle" style={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 12, fill: TERTIARY }}>{caption}</text>
            </svg>
          </div>

          {/* Numbers */}
          <div>
            {mode === 'build' && (
              <div style={{ marginBottom: 13 }}>
                <div style={{ position: 'relative', height: 12, background: SURFACE, borderRadius: 6, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(100, (chosenSeats / total) * 100)}%`, background: hasMajority ? JADE : '#c07a12', borderRadius: 6, transition: 'width .3s ease' }} />
                  <div title={`${majority} seats`} style={{ position: 'absolute', left: `${(majority / total) * 100}%`, top: -3, bottom: -3, width: 2, background: 'rgba(12,14,18,.45)' }} />
                </div>
                <div style={{ marginTop: 8, fontSize: 13.5, fontFamily: MANROPE, color: hasMajority ? JADE : INK, fontWeight: 800 }}>
                  {chosenSeats === 0 ? 'Pick parties to form a government' : hasMajority ? `This bloc could govern (${chosenSeats} seats)` : `${need} more ${need === 1 ? 'seat' : 'seats'} needed`}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 11 }}>
                  <button onClick={() => setPicked(new Set(LEFT_BLOC.filter((p) => (projectedByParty[p] || 0) > 0)))} style={blocBtn}>Centre-left</button>
                  <button onClick={() => setPicked(new Set(RIGHT_BLOC.filter((p) => (projectedByParty[p] || 0) > 0)))} style={blocBtn}>Centre-right</button>
                  {picked.size > 0 && <button onClick={() => setPicked(new Set())} style={blocBtn}>Clear</button>}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: mode === 'build' ? 7 : 5 }}>
              {rows.map((r) => {
                const on = picked.has(r.slug)
                const dot = <span style={{ width: 10, height: 10, borderRadius: '50%', background: PARTY_COLORS[r.slug].bg, flexShrink: 0 }} />
                const name = <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: mode === 'build' ? 700 : 400, color: INK }}>{PARTY_NAMES[r.slug].short}</span>
                const pct = r.pct != null && (
                  <span style={{ fontSize: 12, color: TERTIARY, fontVariantNumeric: 'tabular-nums' }}>{r.pct.toFixed(1)}%</span>
                )
                const seats = <span style={{ fontSize: 13.5, fontWeight: 800, color: INK, fontVariantNumeric: 'tabular-nums', minWidth: 22, textAlign: 'right' }}>{r.seats}</span>

                if (mode !== 'build') {
                  return (
                    <div key={r.slug} style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: MANROPE }}>
                      {dot}{name}{pct}{seats}
                    </div>
                  )
                }
                return (
                  <button
                    key={r.slug}
                    onClick={() => toggle(r.slug)}
                    aria-pressed={on}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9, padding: '8px 11px', borderRadius: 10, cursor: 'pointer', width: '100%',
                      fontFamily: MANROPE, textAlign: 'left', background: on ? PARTY_COLORS[r.slug].light : '#fff',
                      border: `1px solid ${on ? PARTY_COLORS[r.slug].bg : BORDER}`,
                    }}
                  >
                    <span style={{ width: 17, height: 17, borderRadius: 5, background: on ? PARTY_COLORS[r.slug].bg : '#fff', border: `1px solid ${on ? PARTY_COLORS[r.slug].bg : '#cbd0d6'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {on && <Check style={{ width: 11, height: 11, color: '#fff' }} />}
                    </span>
                    {name}{seats}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Only the two tabs built on poll estimates carry the caveat. Showing it
          against the 2023 result would attach a warning to a published figure. */}
      {mode !== 'elected' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, padding: '10px 12px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10 }}>
          <Info style={{ width: 15, height: 15, color: SECONDARY, flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11.5, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
            An estimate, not a prediction. Seats are a Sainte-Laguë calculation from current poll averages; the real result depends on the
            vote, electorate wins and each poll’s margin of error.{mode === 'build' && ' Which parties would actually work together is their decision, not ours.'}{' '}
            Only parties polling at or above the <b>5%</b> threshold (or holding an electorate seat) can be projected seats. Other registered
            parties are contesting but don’t yet register enough in polling to model, which isn’t a judgement on their standing.
          </p>
        </div>
      )}
    </div>
  )
}

const blocBtn: React.CSSProperties = {
  padding: '7px 12px', borderRadius: 999, border: `1px solid ${BORDER}`, background: '#fff',
  color: SECONDARY, fontFamily: MANROPE, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
}
