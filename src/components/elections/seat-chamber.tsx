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
import { Landmark, Check, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { hemicycle } from '@/lib/mmp'
import { InfoButton, InfoHeading, InfoText } from '@/components/ui/info-button'
import { PEER_HEADING } from './zone-head'
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
/** The #seats ink from constants/election-sections.ts, for the (i) beside the
 *  heading: a block takes the colour of whatever it is about (§1.6). */
const SEATS_ACCENT = '#1d4ed8'
const RIGHT_BLOC: PartySlug[] = ['national', 'act', 'nzfirst']
const LEFT_BLOC: PartySlug[] = ['labour', 'green', 'tpm']

export interface SeatEntry { slug: PartySlug; seats: number; pct?: number }

type Mode = 'elected' | 'polls' | 'build'

// "As elected" removed by request: the actual 2023 result read as a
// prediction sitting beside "If polls held" and "Who could govern", which
// are genuinely projections. It isn't one — it's the certified result — so
// it's demoted to the "Full {year} results" link below rather than a tab
// that implies it's the same kind of thing as the two that are. Mode
// 'elected' stays in the type: the homepage variant (`home`) still opens on
// it and never shows tabs at all, so it needed no tab to remove.
const TABS: { key: Mode; label: string }[] = [
  { key: 'polls', label: 'If polls held' },
  // §1.7: "bloc" is Parliament's word, and this tab said "Build a bloc"
  // while the heading it produced said "Build a majority" — two names for one
  // thing, neither of them a question a reader has. Both are the question now.
  { key: 'build', label: 'Who could govern' },
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
  elected, electedTotal, electedYear, electedSlug, projection, projectionTotal, asAt, home = false, heading, frameColor, frameLight, highlight, onPickParty, pickScrollsToIdPrefix,
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
  /**
   * The same thing for a caller that cannot pass a function.
   *
   * §1.4 says the same interaction produces the same shape, and the seats were
   * a control on the homepage and inert on the Election Centre — the dots
   * looked identical and one of them did nothing. The Election Centre is a
   * server component, so a handler cannot cross that boundary; a prefix can.
   * Given one, tapping a seat navigates to `{prefix}{slug}`, which on that page
   * is the party's own row in the list below.
   *
   * It sets the HASH rather than calling scrollIntoView, for two reasons: the
   * row's `scroll-margin-top` is honoured by fragment navigation and not by a
   * bare scroll, and `:target` lights the row for a moment so the reader can
   * see which of seventeen they were sent to.
   */
  pickScrollsToIdPrefix?: string
}) {
  // Election Centre opens on 'polls' now — its own tab for the real 2023
  // result is gone (see TABS above). The homepage variant is untouched: it
  // never shows tabs, so it still opens on and stays on 'elected'.
  const [mode, setMode] = React.useState<Mode>(home ? 'elected' : 'polls')
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
  const caption = mode === 'build' ? `of ${total}, ${majority} to govern` : `seats, ${majority} for a majority`

  /* The elected tab's heading is "Parliament now" on the Election Centre, which
     is the jump chip that points at it, verbatim (§4). It used to read "The
     Parliament you're voting to change" while the chip said "The seats", one
     chip away from another that said "Your seat" — two labels a reader could
     not tell apart, neither naming where it went. The homepage is untouched:
     it passes `heading` (ParliamentHeading), so `title` never renders there. */
  const title = mode === 'elected' ? 'Parliament now'
    : mode === 'polls' ? 'If the polls held today'
    : 'Who could govern'
  /* One sub-line, the same on both variants now. The Election Centre used to
     carry an extra sentence here about party membership changing since 2023;
     that is an explanation of how to read the chart rather than a fact about
     it, so it is in the (i) beside the heading (§1.2). The homepage's string
     is unchanged, which is the point: the two variants no longer differ. */
  const sub = mode === 'elected'
    ? `As elected at the ${electedYear} General Election.`
    : mode === 'polls'
    ? `A seat estimate from the poll of polls as at ${asAt}. Polls are not a result.`
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
  /* One handler, whichever way the caller asked for it. Everything below reads
     `pick`, so the dots cannot end up tappable in one mode and inert in the
     other. */
  const pick = React.useMemo(() => {
    if (onPickParty) return onPickParty
    if (!pickScrollsToIdPrefix) return undefined
    return (slug: string) => {
      // The row may be folded away (the list shows six until asked for more),
      // and a tap that silently does nothing is the thing §1.5 rules out — so
      // fall back to the section itself, which is where the row lives.
      const id = document.getElementById(`${pickScrollsToIdPrefix}${slug}`) ? `${pickScrollsToIdPrefix}${slug}` : 'parties'
      window.location.hash = id
    }
  }, [onPickParty, pickScrollsToIdPrefix])

  const pickNearestSeat = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg || !pick) return
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
    if (hit && hit.d <= geo.dotR * 4) pick(hit.party)
  }

  return (
    <div>
      {!home && (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, marginBottom: 9 }}>
        <Landmark style={{ width: 14, height: 14 }} /> The seats
      </div>
      )}

      {/* §2.2 pills, the same control as the bills status row and the party
          directory's groups, in one neutral treatment (lit = #efece5 on INK).

          It was a three-column segmented toggle in its own bordered tray: a
          fourth pill system on a page that had four already, and 68px of a
          phone screen once globals.css inflated the buttons to 44px. A §2.2 row
          at the phone size is about 40px. No count on these: a count belongs on
          a pill that filters a list, and these three are one chart read three
          ways. Tapping the lit one does NOT clear, because unlike a filter
          there is no "no mode" to clear back to.

          §3.1: the button is the hit area, the span is the pill.

          The whole block is inside {!home && ...}, so the homepage renders none
          of it (§2.7). */}
      {!home && (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {TABS.map((t) => {
          const on = mode === t.key
          return (
            <button
              key={t.key}
              onClick={() => setMode(t.key)}
              aria-pressed={on}
              style={{ display: 'inline-flex', padding: '8px 0', margin: '-8px 0', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span
                className="status-pill"
                style={{
                  display: 'inline-flex', alignItems: 'center', borderRadius: 999,
                  background: on ? '#efece5' : '#fff',
                  border: `2px solid ${on ? INK : BORDER}`,
                  color: INK, fontFamily: MANROPE, fontWeight: 800, whiteSpace: 'nowrap',
                  transition: 'background-color .2s ease, border-color .2s ease',
                }}
              >
                {t.label}
              </span>
            </button>
          )
        })}
      </div>
      )}

      {/* The homepage supplies `heading`, so everything in the else branch, the
          shared peer size and the (i) beside it, is Election Centre only. This h2
          was clamp(20px, 4.4vw, 26px) beside a zone header at
          clamp(21px, 3.6vw, 27px) and a 15px KeyDates title, so four peer
          sections on one page ran at four different sizes (§4). */}
      {heading ?? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 5px' }}>
          <h2 style={{ fontSize: PEER_HEADING, fontWeight: 800, letterSpacing: '-.025em', color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.15 }}>{title}</h2>
          <InfoButton accent={SEATS_ACCENT} label="How to read this chamber" size={24}>
            <InfoHeading accent={SEATS_ACCENT}>What the {electedYear} chart shows</InfoHeading>
            <InfoText>
              The House as the {electedYear} General Election returned it. It doesn&rsquo;t reflect any changes in party
              membership since, and at least one MP has changed party, so this is what the election produced rather than
              who sits where today.
            </InfoText>
            <InfoHeading accent={SEATS_ACCENT}>Why {electedTotal} seats and not {projectionTotal}</InfoHeading>
            <InfoText>
              Parliament is {projectionTotal} seats under normal conditions. {electedYear} returned {electedTotal},
              because a party won more electorates than its party vote entitled it to. The extra seats are called an
              overhang and they last the term.
            </InfoText>
            <InfoHeading accent={SEATS_ACCENT}>The seat estimate</InfoHeading>
            <InfoText>
              An estimate, not a prediction. Seats are a Sainte-Lagu&euml; calculation, the formula the Electoral
              Commission uses to turn party-vote shares into seats, run over the current poll averages. The real result
              depends on the vote, on electorate wins, and on each poll&rsquo;s margin of error. Which parties would
              actually work together is their decision, not ours.
            </InfoText>
            <InfoText>
              Only parties polling at or above the 5% threshold, or holding an electorate seat, can be given projected
              seats. Other registered parties are contesting but don&rsquo;t yet register enough in polling to model,
              which isn&rsquo;t a judgement on their standing.
            </InfoText>
          </InfoButton>
        </div>
      )}
      <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 8px', maxWidth: 580, lineHeight: 1.55 }}>{sub}</p>
      {/* The homepage puts this link below the numbers instead, as a signpost
          (see ParliamentNow) — the same shape the policy section closes with.
          Used to gate on mode === 'elected', which was fine while that mode
          was a tab a reader could land on; now it never is on this page (see
          TABS above), so gating on it would have hidden this link
          permanently. Just !home now — the real result is reachable from
          every tab, not only one that no longer exists. */}
      {!home && (
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

          {/* Chart. The column direction is for the number that now sits under
              it in the DOM (see below) and is gated on !home for that reason:
              the homepage has no second child here, and leaving its wrapper
              exactly as it was means no homepage pixel can move (§2.7). */}
          <div style={home
            ? { display: 'flex', justifyContent: 'center' }
            : { display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg
              ref={svgRef}
              onClick={pick ? pickNearestSeat : undefined}
              viewBox={home ? dome.viewBox : `0 0 ${geo.width} ${geo.height}`}
              style={{ width: '100%', maxWidth: 460, cursor: pick ? 'pointer' : undefined }}
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
                const named = pick && party ? true : undefined
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
                    {named && party && <title>{PARTY_NAMES[party as PartySlug]?.short ?? party}</title>}
                  </circle>
                )
              })}
            </svg>

            {/*
              THE NUMBER IS DOM TEXT, NOT SVG TEXT.

              It used to be two <text> nodes inside the chart, at fontSize 31 and
              12 in SVG user units. The viewBox is 0 0 548 288 and on the
              Election Centre the chart column is minmax(min(260px, 100%), 1fr)
              inside a 303px card with 16px of padding, so the SVG renders about
              271px wide: a scale of 0.4945. The 31 came out at 15.3px and the 12
              at 5.9px. "seats, {majority} for a majority" was unreadable on
              every phone made.

              This is §3.2 in its SVG form: an inline value that no media query
              can reach, because it is not a CSS pixel at all. The homepage
              variant already puts its number in the DOM for the same reason,
              which is why only the !home branch was wrong.

              Sitting under the chart rather than in the arc's opening also
              stops it colliding with the innermost seat row, which is what
              pinned it to those two y offsets in the first place.
            */}
            {!home && (
              <div style={{ textAlign: 'center', marginTop: -6 }}>
                <div style={{ fontFamily: MANROPE, fontWeight: 800, fontSize: 31, lineHeight: 1.05, letterSpacing: '-.02em', color: mode === 'build' && hasMajority ? JADE : INK }}>{bigNumber}</div>
                <div style={{ fontFamily: MANROPE, fontWeight: 600, fontSize: 12, color: TERTIARY, marginTop: 2 }}>{caption}</div>
              </div>
            )}
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

      {/* The 90px "an estimate, not a prediction" card that sat here is in the
          (i) beside the heading. Every word of it survives: the Sainte-Laguë
          method, now glossed rather than left as a term (§1.7), the margin of
          error, whose decision a coalition is, and the threshold rule. It is an
          explanation of how to read a chart, which is §1.2's definition of a
          bubble, and the sub-line under the polls tab still says outright that
          polls are not a result, where a reader cannot miss it.

          The home variant never rendered this branch, so no homepage pixel
          moves (§2.7). */}
    </div>
  )
}

const blocBtn: React.CSSProperties = {
  padding: '7px 12px', borderRadius: 999, border: `1px solid ${BORDER}`, background: '#fff',
  color: SECONDARY, fontFamily: MANROPE, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
}
