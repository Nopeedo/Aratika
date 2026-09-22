'use client'

/**
 * CoverageMatrix — at-a-glance grid of which party holds a published position on
 * which topic. Three honest states per cell:
 *   ✓  published position (links to the breakdown)
 *   ∅  verified "no stated position" (sourced — links to verify)
 *   ·  not captured yet (a gap to fill — never read as "no position")
 *
 * PAGED, not scrolled, where the whole grid doesn't fit. A phone showed about
 * two of eleven topic columns and the rest lived behind a horizontal swipe,
 * which people don't find and can't see the shape of. Instead the topics are
 * dealt out into pages of however many actually fit the measured width, with
 * arrows at the top of the table to step between them. Same axes, same cells,
 * nothing hidden behind a gesture. Desktop measures wide enough for all
 * eleven, so the arrows never appear there.
 */

import { useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronLeft, ChevronRight, Minus } from 'lucide-react'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import { topicColors } from '@/constants/topic-colors'
import { TOPIC_ICONS } from '@/constants/policy-topic-icons'
import { PARTY_DIRECTORY_ORDER, PROFILED_MINOR_PARTIES, PARTY_PROFILES } from '@/constants/parties-data'
import { PARTY_NAMES } from '@/constants/parties'
import type { PartySlug } from '@/types'
import type { PartyPosition } from '@/lib/positions/live'
import { BORDER, INK, MANROPE, SECONDARY, SURFACE, TERTIARY } from '@/constants/theme'

/** The party colour, darkened only as far as it must be to read as text on
 *  white. Same function as the issue panels use: luminance over 0.5 is scaled
 *  down, hue untouched, so ACT stays recognisably ACT instead of going grey. */
function readableOnWhite(hex: string): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  if (lum <= 0.5) return hex
  const k = 0.42 / lum
  const hx = (v: number) => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0')
  return `#${hx(r)}${hx(g)}${hx(b)}`
}

/** Width of the sticky party column, shared by the header cell, the CSS and
 *  the fit calculation, so the three cannot drift apart. */
const PARTY_COL = 62

export function CoverageMatrix({ positions, topics }: { positions: PartyPosition[]; topics: { slug: string; label: string }[] }) {
  const lookup = new Map<string, PartyPosition>()
  // Current policy only — same rule as PolicyComparison and the party page. A
  // 2023 manifesto row used to fill an empty cell here, which made the matrix
  // claim coverage the site could not honestly show as current.
  for (const p of positions) {
    if (p.period !== '2026') continue
    lookup.set(`${p.party}::${p.topic}`, p)
  }

  // Only show a minor party once it actually has something captured — an all-dots
  // row adds a name and no information.
  const minors = PROFILED_MINOR_PARTIES.filter((slug) =>
    topics.some((t) => lookup.has(`${slug}::${t.slug}`)),
  )

  /**
   * How many topic columns fit, measured rather than guessed at a breakpoint:
   * the answer differs between a 320px phone and a 430px one, and a media
   * query would have to pick one number for both. PARTY_COL and MIN_COL are
   * the real minimums the cells render at (see MATRIX_CSS).
   *
   * Starts at "all of them" so the server render and the first paint are the
   * complete table; the effect narrows it on a phone before anything is
   * interactive. The container keeps overflow-x as a safety net for that frame
   * and for a viewport too narrow for even one column.
   */
  const [perPage, setPerPage] = useState(topics.length)
  const [page, setPage] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return
    const measure = () => {
      const MIN_COL = 42
      const room = el.clientWidth - PARTY_COL
      const fits = Math.max(1, Math.floor(room / MIN_COL))
      // Balance the pages instead of filling each to the brim: eleven topics
      // five-at-a-time is 5/5/1, and a last page holding one column reads as
      // a mistake. Same page COUNT, columns spread evenly across it (4/4/3).
      const pageCount = Math.ceil(topics.length / fits)
      setPerPage(Math.min(topics.length, Math.ceil(topics.length / pageCount)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [topics.length])

  const pages = Math.ceil(topics.length / perPage)
  const cur = Math.min(page, pages - 1)
  const shown = pages > 1 ? topics.slice(cur * perPage, cur * perPage + perPage) : topics
  const from = cur * perPage + 1
  const to = Math.min(topics.length, cur * perPage + perPage)

  return (
    <div>
      {/* Shipped with the component rather than from globals.css on purpose.
          These rules and the class names that use them have to arrive together:
          the padding they set is NOT duplicated inline (an inline style would
          beat the media query below), so if the stylesheet were ever a build
          behind the markup, every cell in this table would render with no
          padding at all. That is exactly what happened when this lived in
          globals.css — the deployed HTML had the new class names while the
          deployed CSS bundle did not have the rules. In here they cannot
          desync, because they are the same payload. */}
      <style dangerouslySetInnerHTML={{ __html: MATRIX_CSS }} />
      {/* The pager. Only rendered when the topics don't all fit, so it is
          absent on a desktop and on the widest phones. It says which topics
          you are looking at, because "3 of 11" with no names would make the
          reader count columns to work out where they are. */}
      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, margin: '0 0 8px' }}>
          <span style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE }}>
            Topics {from}–{to} of {topics.length}
          </span>
          <span style={{ display: 'inline-flex', gap: 6 }}>
            <PageButton
              onClick={() => setPage(cur - 1)}
              disabled={cur === 0}
              label="Previous topics"
            ><ChevronLeft style={{ width: 16, height: 16 }} /></PageButton>
            <PageButton
              onClick={() => setPage(cur + 1)}
              disabled={cur >= pages - 1}
              label="More topics"
            ><ChevronRight style={{ width: 16, height: 16 }} /></PageButton>
          </span>
        </div>
      )}
      {/* Opaque white ground. The table's cells are transparent over the page's
          warm texture while the sticky party column is solid white — at rest
          that boundary lines up with a column edge and reads as design, but
          scrolled it lands mid-column and reads as a bright stripe someone
          forgot to clean up. One opaque ground removes the boundary instead of
          trying to keep two backgrounds in step. */}
      <div ref={boxRef} className="scroll-x" style={{ overflowX: 'auto', border: `1px solid ${BORDER}`, borderRadius: 14, background: '#fff' }}>
        {/* No minWidth once paged: the point of a page is that it fits. */}
        <table className="coverage-matrix" style={{ borderCollapse: 'collapse', width: '100%', minWidth: pages > 1 ? undefined : 640, fontFamily: MANROPE, tableLayout: pages > 1 ? 'fixed' : undefined }}>
          <thead>
            <tr>
              {/* maxWidth/width are set explicitly here, NOT left to thBase: with
                  table-layout:fixed the first row decides every column width,
                  and thBase's maxWidth:0 (which lets the topic headings clip)
                  collapsed the party column to 18px and slid the names under
                  the ticks. PARTY_COL in the measuring effect is this number. */}
              <th style={{ ...thBase, maxWidth: PARTY_COL, width: PARTY_COL, textAlign: 'left', position: 'sticky', left: 0, background: SURFACE, zIndex: 1, boxShadow: '2px 0 4px rgba(12,14,18,.06)' }}>Party</th>
              <TopicHeadCells topics={shown} />
            </tr>
          </thead>
          <tbody>
            {PARTY_DIRECTORY_ORDER.map((slug) => (
              <Row key={slug} slug={slug} topics={shown} lookup={lookup} />
            ))}
            {/* The parties outside Parliament sit in their own labelled band. They
                hold real published positions too — hiding them read as "no data",
                but merging them into the list above would imply equal standing. */}
            {minors.length > 0 && (
              <>
                <tr>
                  {/* sticky on the TH was a no-op: the cell spans the whole
                      table, so its left edge is always at 0 and the text inside
                      slid away with the horizontal scroll. The SPAN is the
                      sticky thing now — an inline-block sticks to the
                      scrollport's edge inside the full-width cell, so the label
                      holds still while the columns move under it, exactly like
                      the party names below it. */}
                  <th colSpan={shown.length + 1} scope="colgroup" style={{ ...tdBase, textAlign: 'left', background: SURFACE, fontSize: 11.5, fontWeight: 800, color: SECONDARY, letterSpacing: .2 }}>
                    {/* Label left, arrows hard right on the same line. The
                        arrows were inside the label span, which wraps at 168px
                        on a phone, so they dropped underneath it. */}
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span className="coverage-band">Also contesting, without seats in Parliament</span>
                      {/* The pager again, on the band: this is where the second
                          list starts, and the copy at the top of the table is
                          off-screen by the time a phone reader gets here. */}
                      {pages > 1 && (
                        <span className="coverage-band-pager">
                          <PageButton onClick={() => setPage(cur - 1)} disabled={cur === 0} label="Previous topics"><ChevronLeft style={{ width: 15, height: 15 }} /></PageButton>
                          <PageButton onClick={() => setPage(cur + 1)} disabled={cur >= pages - 1} label="More topics"><ChevronRight style={{ width: 15, height: 15 }} /></PageButton>
                        </span>
                      )}
                    </span>
                  </th>
                </tr>
                {/* The headings repeated over the second list. Without them the
                    minor-party rows sit under bare columns once the real header
                    has scrolled away. aria-hidden + presentation: it is the
                    same header again, and a screen reader should not be told
                    the table has a second set of column names. */}
                <tr aria-hidden>
                  <td style={{ ...tdBase, width: PARTY_COL, maxWidth: PARTY_COL, position: 'sticky', left: 0, background: SURFACE, zIndex: 1, boxShadow: '2px 0 4px rgba(12,14,18,.06)' }} />
                  <TopicHeadCells topics={shown} repeat />
                </tr>
                {minors.map((slug) => (
                  <Row key={slug} slug={slug} topics={shown} lookup={lookup} />
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
        <Legend swatch={<Check style={{ width: 15, height: 15, color: '#1F8A4C' }} strokeWidth={3.25} />} label="Published position" />
        <Legend swatch={<span style={{ fontWeight: 800, color: TERTIARY, fontSize: 15 }}>∅</span>} label="No stated position (verified)" />
        <Legend swatch={<Minus style={{ width: 13, height: 13, color: '#cdd2d8' }} />} label="Not captured yet" />
      </div>
    </div>
  )
}

function Row({ slug, topics, lookup }: { slug: PartySlug; topics: { slug: string; label: string }[]; lookup: Map<string, PartyPosition> }) {
  const party = PARTY_PROFILES[slug]
  return (
    <tr>
      {/* A hard width, overriding tdBase's nowrap handling: the long names
          ("Outdoors & Freedom", "Te Pāti Māori") no longer wrap to two lines
          but run to the column edge and FADE OUT there, by request — a
          narrower column buys another topic and a shorter row, and a party
          is recognisable from its first word and its colour. The full name is
          the cell's title. */}
      <td style={{ ...tdBase, width: PARTY_COL, maxWidth: PARTY_COL, textAlign: 'left', position: 'sticky', left: 0, background: '#fff', zIndex: 1, boxShadow: '2px 0 4px rgba(12,14,18,.06)' }} title={PARTY_NAMES[slug].short}>
        {/* Short name, not the full registered one: this column is sized by its
            longest label, and "Animal Justice Party Aotearoa New Zealand" was
            pushing it past half the screen on a phone while the topic cells sat
            half empty. The full name is on the party's own page. */}
        {/* The name IS the colour swatch. A separate dot cost 16px of a 96px
            column on every row and said the same thing the name can say
            itself. Darkened where the raw party colour would be unreadable on
            white (ACT's yellow), which is a contrast fix, not a recolour:
            the hue is kept. */}
        <span className="coverage-party-name" style={{ fontWeight: 800, color: readableOnWhite(party.color) }}>{PARTY_NAMES[slug].short}</span>
      </td>
      {topics.map((t) => {
        const pos = lookup.get(`${slug}::${t.slug}`)
        return (
          <td key={t.slug} style={{ ...tdBase, textAlign: 'center' }}>
            {pos ? (
              pos.noPosition ? (
                <Link href={`/policies/${t.slug}/${slug}`} title="No stated position (verified)" style={{ color: TERTIARY, textDecoration: 'none', fontWeight: 800, fontSize: 15 }}>∅</Link>
              ) : (
                /* A bare tick in the party's colour, not a filled tile: the
                   tile was 22px of chrome around a 13px glyph in every cell,
                   and with eighteen rows of them the grid read as blocks
                   rather than as marks. */
                <Link href={`/policies/${t.slug}/${slug}`} title={pos.stance || 'View position'} style={{ display: 'inline-flex' }}>
                  <Check style={{ width: 17, height: 17, color: readableOnWhite(party.color) }} strokeWidth={3.25} />
                </Link>
              )
            ) : (
              <Minus style={{ width: 13, height: 13, color: '#cdd2d8' }} />
            )}
          </td>
        )
      })}
    </tr>
  )
}

/** The topic heading cells. Rendered in the thead and AGAIN above the
 *  parties-outside-Parliament band: that band starts a second list of rows,
 *  and on a phone the real header has long scrolled off by the time you reach
 *  it, leaving eighteen rows of ticks under no headings at all. */
function TopicHeadCells({ topics, repeat = false }: { topics: { slug: string; label: string }[]; repeat?: boolean }) {
  const Cell = repeat ? 'td' : 'th'
  return (
    <>
      {topics.map((t) => {
        const meta = POLICY_TOPICS[t.slug as keyof typeof POLICY_TOPICS]
        const Icon = TOPIC_ICONS[meta?.icon]
        // The ICON carries the issue's colour, the same hue its pill border and
        // its panel carry; the name under it stays plain text. Colouring the
        // word too made a row of six headings read as six links competing with
        // the ticks below them.
        const hue = topicColors(meta?.textColor ?? '').border
        return (
          <Cell key={t.slug} style={{ ...thBase, background: repeat ? SURFACE : undefined, textAlign: 'center' }}>
            {/* Icon above the name, and the name clipped to the column.
                Full labels cannot be made narrow: "Democracy" alone is 73px,
                so spelling every heading out in full allows two columns on a
                phone and no amount of paging fixes that. The icon is the same
                one the topic's chip carries everywhere else on the site, so it
                identifies the column on its own; the clipped word
                disambiguates, and the full label is the link's title and
                accessible name. */}
            <Link
              href={`/policies/${t.slug}`}
              title={t.label}
              aria-label={t.label}
              className="coverage-topic"
              style={{ color: SECONDARY, textDecoration: 'none' }}
            >
              {Icon && <Icon className="coverage-topic-icon" style={{ color: hue }} aria-hidden />}
              <span className="coverage-topic-label">{t.label}</span>
            </Link>
          </Cell>
        )
      })}
    </>
  )
}

/** A pager arrow. Quiet at rest, invisible-but-present when it can't go
 *  further, so the row doesn't reflow as you step through the pages. */
function PageButton({ onClick, disabled, label, children }: {
  onClick: () => void
  disabled: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        width: 30, height: 30, borderRadius: 9, cursor: disabled ? 'default' : 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: '#fff', border: `1px solid ${BORDER}`,
        color: disabled ? '#cdd2d8' : INK, opacity: disabled ? .55 : 1,
      }}
    >
      {children}
    </button>
  )
}

function Legend({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, color: SECONDARY, fontFamily: MANROPE }}>
      {swatch} {label}
    </span>
  )
}

// Padding is set by MATRIX_CSS, not inline: an inline style would beat the
// media query that tightens it for phones.
// No nowrap on the header: a paged column is sized by the page, so
// "Crime & Justice" wraps to two lines instead of forcing the column wide
// enough to hold it on one. The body cells hold a single glyph, so they keep
// nowrap and never wrap anyway.
const thBase: React.CSSProperties = { fontSize: 11.5, maxWidth: 0, fontWeight: 800, color: SECONDARY, borderBottom: `1px solid ${BORDER}`, verticalAlign: 'bottom', lineHeight: 1.25 }
const tdBase: React.CSSProperties = { borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }

/* On a phone the party column was taking well over half the visible width and
   only one topic column showed, while the cells it left were mostly empty space
   around a 22px tick. Narrower gutters and a smaller party label put noticeably
   more of the grid in view before you have to swipe. Desktop keeps the roomier
   original spacing — the whole table fits there without scrolling. */
const MATRIX_CSS = `
.coverage-matrix th,
.coverage-matrix td { padding: 10px 12px; }
.coverage-party-name { font-size: 13px; }
.coverage-band { white-space: nowrap; display: inline-block; position: sticky; left: 12px; }
.coverage-band-pager { display: none; }
@media (max-width: 760px) {
  .coverage-matrix th,
  .coverage-matrix td { padding: 9px 4px; }
  /* Almost no right gutter on the party column: the names are left-aligned
     and the ticks are centred in their own columns, so the space between them
     was doing nothing but pushing a topic column off the page. */
  .coverage-matrix th:first-child,
  .coverage-matrix td:first-child { padding-left: 8px; padding-right: 0; }
    /* One line, clipped with a fade rather than an ellipsis: "…" spends three
     characters saying nothing, and the soft edge reads as "there is more of
     this word" without costing any width. */
  .coverage-party-name {
    font-size: 12px; display: block; line-height: 1.2;
    white-space: nowrap; overflow: hidden;
    -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 12px), transparent 100%);
    mask-image: linear-gradient(to right, #000 calc(100% - 12px), transparent 100%);
  }
  /* 168px, not 62vw: sized so the line breaks after "without", which keeps
     the label's widest line inside the sticky party column instead of jutting
     into the tick columns. */
  .coverage-band { white-space: normal; max-width: 168px; left: 10px; }
  /* Shown only where the table is paged, i.e. where the arrows exist at all. */
  .coverage-band-pager { display: inline-flex; gap: 6px; flex-shrink: 0; }
  /* Icon over a one-line, ellipsised name. The icon carries the meaning, so
     the name may be clipped without the column becoming a guess. */
  .coverage-topic-icon { display: block; margin: 0 auto 3px; width: 15px; height: 15px; }
  .coverage-topic-label { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; letter-spacing: -.01em; }
}
@media (min-width: 761px) {
  /* Desktop has room for the words, and always did. */
  .coverage-topic-icon { display: none; }
}
`
