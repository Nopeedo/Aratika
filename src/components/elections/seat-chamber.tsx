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

/** A seat dot's rim: the same hue, darkened, so a pale fill (ACT's yellow)
 *  still reads as a disc on a light ground. Near-black fills (NZ First) are
 *  left alone — a darker ring on them would be invisible anyway, and a
 *  lighter one would look like a halo. */
function rimColor(hex: string): string | undefined {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  if (lum < 0.18) return undefined
  const f = lum > 0.6 ? 0.55 : 0.7
  const d = (v: number) => Math.round(v * f).toString(16).padStart(2, '0')
  return `#${d(r)}${d(g)}${d(b)}`
}

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
  elected, electedTotal, electedYear, electedSlug, projection, projectionTotal, asAt, home = false, heading, frameColor, frameLight, highlight, onPickParty,
}: {
  elected: PartyResult[]
  electedTotal: number
  electedYear: number
  electedSlug: string
  projection: SeatEntry[]
  projectionTotal: number
  asAt: string
  /**
   * Homepage variant: the elected chamber only — no "The seats" eyebrow and
   * no tabs (polls and build-a-majority stay on the Election Centre), and
   * the heading at the homepage section size so it sits level with "The
   * election at a glance". Same chart, same card, same numbers.
   */
  home?: boolean
  /** Replaces the h2 in the home variant (the homepage supplies a heading
   *  that follows the party tiles). The sub-line and results link stay. */
  heading?: React.ReactNode
  /** Home variant: colour the two containers in the selected party's colours,
   *  the way the party panel above them is coloured. */
  frameColor?: string
  frameLight?: string
  /** Light up only this party's seats; the rest fade back. Follows the
   *  homepage tiles, so the arch answers "which of these are theirs?". */
  highlight?: string
  /**
   * Makes the seats themselves a control: tapping any dot selects the party
   * that holds it. Given only by the homepage, where a party selection
   * already exists for the arch to follow — on the Election Centre the
   * chamber is a chart and nothing listens to a pick.
   */
  onPickParty?: (slug: string) => void
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

  // The dome frame, derived from the seats themselves rather than guessed
  // with border-radius: the outermost dot sits at (cx ± outerR, cy), so a
  // semicircle of outerR + dotR + GAP keeps an EXACT, constant margin all the
  // way round the arc. Drawn in the SVG so it scales with the chart.
  const dome = React.useMemo(() => {
    const GAP = 16, CORNER = 10, STROKE = 4
    const cx = geo.width / 2
    const cy = Math.max(...geo.seats.map((s) => s.y))
    const dist = geo.seats.map((s) => Math.hypot(s.x - cx, s.y - cy))
    // A BAND, not a dome: the outer edge clears the outermost row by GAP and
    // the inner edge clears the innermost row by the same, so the frame
    // follows the seating on both sides with an exact, constant margin.
    const R = Math.max(...dist) + geo.dotR + GAP
    const Ri = Math.max(CORNER * 2, Math.min(...dist) - geo.dotR - GAP)
    const bottom = cy + geo.dotR + GAP
    const d = [
      `M ${cx - R} ${bottom - CORNER}`,
      `L ${cx - R} ${cy}`,
      `A ${R} ${R} 0 0 1 ${cx + R} ${cy}`,
      `L ${cx + R} ${bottom - CORNER}`,
      `A ${CORNER} ${CORNER} 0 0 1 ${cx + R - CORNER} ${bottom}`,
      `L ${cx + Ri + CORNER} ${bottom}`,
      `A ${CORNER} ${CORNER} 0 0 1 ${cx + Ri} ${bottom - CORNER}`,
      `L ${cx + Ri} ${cy}`,
      `A ${Ri} ${Ri} 0 0 0 ${cx - Ri} ${cy}`,
      `L ${cx - Ri} ${bottom - CORNER}`,
      `A ${CORNER} ${CORNER} 0 0 1 ${cx - Ri - CORNER} ${bottom}`,
      `L ${cx - R + CORNER} ${bottom}`,
      `A ${CORNER} ${CORNER} 0 0 1 ${cx - R} ${bottom - CORNER}`,
      'Z',
    ].join(' ')
    const pad = STROKE / 2 + 1
    return {
      d, stroke: STROKE,
      viewBox: `${cx - R - pad} ${cy - R - pad} ${(R + pad) * 2} ${bottom - cy + R + pad * 2}`,
    }
  }, [geo])
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
    // On the homepage the line is trimmed to the fact itself; the Election
    // Centre keeps the membership-changes caveat, where the detail belongs.
    ? home
      ? `As elected at the ${electedYear} General Election.`
      : `As elected at the ${electedYear} General Election. It doesn’t reflect any changes in party membership since.`
    : mode === 'polls'
    ? `A seat estimate from the poll averages as at ${asAt}. Polls are not a result.`
    : `Under MMP the biggest party doesn’t automatically govern. A bloc needs ${majority} of ${total}. Tap parties to build one.`

  /**
   * A tap anywhere in the chamber selects the party holding the seat NEAREST
   * to it — the dots are ~6px across at this size, which is a third of a
   * finger, so hit-testing the dot alone meant most taps landed on nothing.
   *
   * Nearest-seat rather than a bigger invisible circle per dot: overlapping
   * hit areas would resolve by paint order, so whichever dot happened to be
   * drawn last would win a tap that was plainly closer to its neighbour.
   * Distance is honest about which seat you meant.
   *
   * Capped at four dot-radii so a tap in the empty middle of the arch, or
   * outside it, does nothing rather than selecting whatever is least far.
   */
  const svgRef = React.useRef<SVGSVGElement>(null)
  const pickNearestSeat = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg || !onPickParty) return
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const { x, y } = pt.matrixTransform(ctm.inverse())
    let best: { party: string; d: number } | null = null
    geo.seats.forEach((seat, i) => {
      const party = seatParties[i]
      if (!party) return
      const d = Math.hypot(seat.x - x, seat.y - y)
      if (!best || d < best.d) best = { party, d }
    })
    const hit = best as { party: string; d: number } | null
    if (hit && hit.d <= geo.dotR * 4) onPickParty(hit.party)
  }

  return (
    <div>
      {!home && (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, marginBottom: 9 }}>
        <Landmark style={{ width: 14, height: 14 }} /> The seats
      </div>
      )}

      {/* Three equal columns rather than a wrapping pill row: at 343px a row of
          pills either wraps unevenly or scrolls sideways, and a toggle you have
          to scroll to see the third option of is a toggle with two options. */}
      {!home && (
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
      )}

      {heading ?? (
        <h2 style={{ fontSize: home ? 'clamp(28px,5.5vw,32px)' : 'clamp(20px, 4.4vw, 26px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: '0 0 5px' }}>{title}</h2>
      )}
      <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 8px', maxWidth: 580, lineHeight: 1.55 }}>{sub}</p>
      {/* The homepage puts this link below the numbers instead, as a signpost
          (see ParliamentNow) — the same shape the policy section closes with. */}
      {mode === 'elected' && !home && (
        <Link href={`/elections/${electedSlug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
          Full {electedYear} results <ArrowRight style={{ width: 14, height: 14 }} />
        </Link>
      )}

      {/* Home variant splits the card in two: the chamber sits in a container
          shaped like the chamber itself (a dome — big elliptical top corners,
          small square-ish bottom ones), and the numbers in an ordinary card
          below it, on the page ground. Only the chamber gets a frame: the
          party panel's thick colour border on its light fill. Elsewhere it
          stays one plain card with the chart and numbers side by side. */}
      <div style={home
        // A bit of air above the arch: it sat tight under the sub-line, and
        // the dome's own top edge is the highest thing in the block.
        ? { marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }
        : { marginTop: 14, border: `1px solid ${BORDER}`, borderRadius: 18, background: '#fff', boxShadow: '0 1px 2px rgba(42,18,6,.04)', padding: 16 }}>
        <div style={home
          ? { display: 'contents' }
          : { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 18, alignItems: 'center' }}>

          {/* Chart */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg
              ref={svgRef}
              onClick={onPickParty ? pickNearestSeat : undefined}
              viewBox={home ? dome.viewBox : `0 0 ${geo.width} ${geo.height}`}
              style={{ width: '100%', maxWidth: 460, cursor: onPickParty ? 'pointer' : undefined }}
              role="img"
              aria-label={mode === 'build' ? `${chosenSeats} of ${total} seats selected` : `Seat distribution, ${total} seats`}>
              {/* The frame, drawn first so the seats sit on it. */}
              {home && (
                <path
                  d={dome.d}
                  fill={frameLight ?? '#fff'}
                  stroke={frameColor ?? BORDER}
                  strokeWidth={dome.stroke}
                  strokeLinejoin="round"
                  style={{ transition: 'fill .25s ease-in-out, stroke .25s ease-in-out' }}
                />
              )}
              {geo.seats.map((s, i) => {
                const party = seatParties[i]
                const lit = mode !== 'build' || (party && picked.has(party))
                // Round the coordinates: Math.cos/sin can differ in the last
                // floating-point digit between the server render and the
                // browser's, which trips hydration on the raw values.
                // Seats that aren't the highlighted party's fade back rather
                // than vanish: the shape of the whole House is the point, and
                // an arch with holes in it isn't a chamber.
                const dim = !!highlight && party !== highlight
                const fill = party && lit ? PARTY_COLORS[party].bg : EMPTY
                const rim = party && lit ? rimColor(PARTY_COLORS[party].bg) : undefined
                // The dot itself carries no handler: the SVG picks the NEAREST
                // seat to wherever you tapped (see pickNearestSeat), so the
                // space between dots belongs to its closest seat rather than
                // to nothing. At this size a dot is about 6px across, which is
                // a third of a finger.
                const pick = onPickParty && party ? true : undefined
                return (
                  <circle
                    key={i}
                    cx={Math.round(s.x * 100) / 100}
                    cy={Math.round(s.y * 100) / 100}
                    // Shrink by half the rim so the dot's OUTER edge stays put
                    // — otherwise every seat grows by a pixel and the rows
                    // start touching.
                    r={geo.dotR - (rim ? 0.5 : 0)}
                    fill={fill}
                    stroke={rim}
                    strokeWidth={rim ? 1 : undefined}
                    opacity={dim ? 0.38 : 1}
                    style={{ transition: 'fill .25s ease, opacity .3s ease-in-out' }}
                  >
                    {/* The party's name on hover/long-press. The dots are not
                        keyboard targets: the tiles above are the same choice
                        as real buttons, so this adds a way in rather than
                        being the only one. */}
                    {pick && party && <title>{PARTY_NAMES[party as PartySlug]?.short ?? party}</title>}
                  </circle>
                )
              })}
              {/* The chamber total sits in the middle of the arc — but not on
                  the homepage, where the number under the dome is the selected
                  party's seat count and two figures there read as one. */}
              {!home && <text x={geo.width / 2} y={geo.height - 30} textAnchor="middle" style={{ fontFamily: MANROPE, fontWeight: 800, fontSize: 31, fill: mode === 'build' && hasMajority ? JADE : INK }}>{bigNumber}</text>}
              {!home && <text x={geo.width / 2} y={geo.height - 13} textAnchor="middle" style={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 12, fill: TERTIARY }}>{caption}</text>}
            </svg>
          </div>

          {/* Numbers. Not on the homepage: the party's own seat count sits
              under the dome there (ParliamentNow), and a full table of all six
              repeated the chart beside it. */}
          {!home && (
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
          )}
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
