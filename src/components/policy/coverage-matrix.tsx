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

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, ChevronLeft, ChevronRight, ExternalLink, Minus, X } from 'lucide-react'
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
const PARTY_COL = 58

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

  /** The cell a reader has tapped: its position if there is one, plus the
   *  party and topic so an EMPTY cell can be previewed too (a dash is an
   *  answer — "not captured yet" — and people tap it expecting to be told). */
  const [preview, setPreview] = useState<{ slug: PartySlug; topic: { slug: string; label: string }; pos?: PartyPosition } | null>(null)

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
      <style dangerouslySetInnerHTML={{ __html: MATRIX_CSS + PREVIEW_CSS }} />
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
      <div ref={boxRef} className="scroll-x coverage-scroll" style={{ overflowX: 'auto', border: `1px solid ${BORDER}`, borderRadius: 14, background: '#fff' }}>
        {/* No minWidth once paged: the point of a page is that it fits. */}
        <table className="coverage-matrix" style={{ borderCollapse: 'collapse', width: '100%', minWidth: pages > 1 ? undefined : 640, fontFamily: MANROPE, tableLayout: pages > 1 ? 'fixed' : undefined }}>
          <thead>
            <tr>
              {/* maxWidth/width are set explicitly here, NOT left to thBase: with
                  table-layout:fixed the first row decides every column width,
                  and thBase's maxWidth:0 (which lets the topic headings clip)
                  collapsed the party column to 18px and slid the names under
                  the ticks. PARTY_COL in the measuring effect is this number. */}
                      <th style={{ ...thBase, maxWidth: PARTY_COL, width: PARTY_COL, textAlign: 'left', position: 'sticky', left: 0, background: SURFACE, zIndex: 1, borderRight: PARTY_EDGE }}>
                {/* Empty by design: the column holds party names, which say so
                    themselves, and "Party" was the only heading in the row that
                    wasn't a topic. Named for screen readers, which do still
                    want to hear what the row header column is. */}
                <span className="sr-only">Party</span>
              </th>
              <TopicHeadCells topics={shown} />
            </tr>
          </thead>
          <tbody>
            {PARTY_DIRECTORY_ORDER.map((slug) => (
              <Row key={slug} slug={slug} topics={shown} lookup={lookup} onPreview={setPreview} />
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
                  <th colSpan={shown.length + 1} scope="colgroup" className="coverage-band-cell" style={{ ...tdBase, textAlign: 'left', background: SURFACE, fontWeight: 800, color: SECONDARY, letterSpacing: .2 }}>
                    {/* Label left, arrows hard right on the same line. The
                        arrows were inside the label span, which wraps at 168px
                        on a phone, so they dropped underneath it. */}
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span className="coverage-band">Parties not in Parliament</span>
                      {/* The pager again, on the band: this is where the second
                          list starts, and the copy at the top of the table is
                          off-screen by the time a phone reader gets here. */}
                      {pages > 1 && (
                        <span className="coverage-band-pager">
                          <PageButton onClick={() => setPage(cur - 1)} disabled={cur === 0} label="Previous topics" size={24}><ChevronLeft style={{ width: 14, height: 14 }} /></PageButton>
                          <PageButton onClick={() => setPage(cur + 1)} disabled={cur >= pages - 1} label="More topics" size={24}><ChevronRight style={{ width: 14, height: 14 }} /></PageButton>
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
                  <td style={{ ...tdBase, width: PARTY_COL, maxWidth: PARTY_COL, position: 'sticky', left: 0, background: SURFACE, zIndex: 1, borderRight: PARTY_EDGE }} />
                  <TopicHeadCells topics={shown} repeat />
                </tr>
                {minors.map((slug) => (
                  <Row key={slug} slug={slug} topics={shown} lookup={lookup} onPreview={setPreview} />
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

      {preview && (
        <PreviewSheet
          slug={preview.slug}
          topic={preview.topic}
          pos={preview.pos}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  )
}

type OpenPreview = (p: { slug: PartySlug; topic: { slug: string; label: string }; pos?: PartyPosition }) => void

function Row({ slug, topics, lookup, onPreview }: { slug: PartySlug; topics: { slug: string; label: string }[]; lookup: Map<string, PartyPosition>; onPreview: OpenPreview }) {
  const party = PARTY_PROFILES[slug]
  return (
    <tr>
      {/* A hard width, overriding tdBase's nowrap handling: the long names
          ("Outdoors & Freedom", "Te Pāti Māori") no longer wrap to two lines
          wrap to a second line inside the column rather than running under
          the ticks, with a rule down the column's right edge separating the
          two. The full name is also the cell's title. */}
      <td style={{ ...tdBase, whiteSpace: 'normal', width: PARTY_COL, maxWidth: PARTY_COL, textAlign: 'left', position: 'sticky', left: 0, background: '#fff', zIndex: 1, borderRight: PARTY_EDGE }} title={PARTY_NAMES[slug].short}>
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
        /* Every cell opens a PREVIEW of that party on that topic rather than
           navigating straight to the full breakdown — including an empty one,
           because "not captured yet" is an answer a reader is entitled to see
           when they tap. It stays an <a> to the breakdown so the keyboard,
           the status bar and cmd/ctrl-click all behave like the link it is;
           only a plain click is intercepted. */
        const open = (e: React.MouseEvent) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
          e.preventDefault()
          onPreview({ slug, topic: t, pos })
        }
        return (
          <td key={t.slug} style={{ ...tdBase, textAlign: 'center' }}>
            <Link
              href={`/policies/${t.slug}/${slug}`}
              onClick={open}
              title={pos ? (pos.noPosition ? 'No stated position (verified)' : pos.stance || 'View position') : `No ${t.label.toLowerCase()} position captured yet`}
              aria-label={`${PARTY_NAMES[slug].short} on ${t.label}`}
              className="coverage-hit"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: TERTIARY, textDecoration: 'none' }}
            >
              {pos ? (
                pos.noPosition ? (
                  <span style={{ fontWeight: 800, fontSize: 15 }}>∅</span>
                ) : (
                  /* A bare tick in the party's colour, not a filled tile: the
                     tile was 22px of chrome around a 13px glyph in every cell,
                     and with eighteen rows of them the grid read as blocks
                     rather than as marks. */
                  <Check className="coverage-tick" style={{ color: readableOnWhite(party.color) }} strokeWidth={3.25} />
                )
              ) : (
                <Minus style={{ width: 13, height: 13, color: '#cdd2d8' }} />
              )}
            </Link>
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

/**
 * PreviewSheet — what one party says on one topic, without leaving the grid.
 *
 * Tapping a cell used to jump to the full breakdown page, which is a lot of
 * navigation to answer "what's behind this tick?" — and on a phone it cost the
 * reader their place in a table they had just paged to. This shows the stance
 * and the party's own proposals in place, and keeps the breakdown one tap away
 * for whoever wants all of it.
 *
 * A bottom sheet on a phone (thumb-reachable, the shape people expect there)
 * and a centred card on a desktop; one component, positioned by CSS.
 */
function PreviewSheet({ slug, topic, pos, onClose }: {
  slug: PartySlug
  topic: { slug: string; label: string }
  pos?: PartyPosition
  onClose: () => void
}) {
  const party = PARTY_PROFILES[slug]
  const tone = readableOnWhite(party.color)
  const topicHue = topicColors(POLICY_TOPICS[topic.slug as keyof typeof POLICY_TOPICS]?.textColor ?? '').border

  // Escape closes, and the page behind does not scroll while it is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  const body = pos?.summaryBasic || pos?.summary
  const proposals = pos?.keyProposals?.slice(0, 4) ?? []

  return (
    <div
      className="coverage-preview-scrim"
      role="dialog"
      aria-modal="true"
      aria-label={`${PARTY_NAMES[slug].short} on ${topic.label}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="coverage-preview">
        {/* The party's colour down the top edge, the issue's beside the label:
            the two things the cell was the intersection of. */}
        <div style={{ height: 4, background: party.color, borderRadius: '16px 16px 0 0' }} />
        <div style={{ padding: '14px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: tone, fontFamily: MANROPE, lineHeight: 1.2 }}>{PARTY_NAMES[slug].short}</div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: topicHue, fontFamily: MANROPE, marginTop: 3 }}>{topic.label}</div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', padding: 6, margin: -6, cursor: 'pointer', color: SECONDARY, display: 'inline-flex', flexShrink: 0 }}>
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            {!pos ? (
              <p style={{ fontSize: 14, color: INK, fontFamily: MANROPE, lineHeight: 1.55, margin: 0 }}>
                No {topic.label.toLowerCase()} position captured yet. That is a gap in our coverage, not a statement that {PARTY_NAMES[slug].short} has no view on it.
              </p>
            ) : pos.noPosition ? (
              <p style={{ fontSize: 14, color: INK, fontFamily: MANROPE, lineHeight: 1.55, margin: 0 }}>
                We checked {PARTY_NAMES[slug].short}&rsquo;s own policy material and found no stated position on {topic.label.toLowerCase()}. The source is linked below so you can see the same page we did.
              </p>
            ) : (
              <>
                {(pos.stance || body) && (
                  <p style={{ fontSize: 14.5, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.45, margin: 0 }}>{pos.stance || body}</p>
                )}
                {proposals.length > 0 && (
                  <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {proposals.map((d) => (
                      <li key={d} style={{ fontSize: 13.5, color: INK, fontFamily: MANROPE, lineHeight: 1.45, paddingLeft: 13, borderLeft: `2px solid ${party.color}55` }}>{d}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginTop: 16, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
            <Link href={`/policies/${topic.slug}/${slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, color: topicHue, textDecoration: 'none', fontFamily: MANROPE }}>
              Full breakdown <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
            {pos?.sourceUrl && (
              <a href={pos.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: SECONDARY, textDecoration: 'none', fontFamily: MANROPE }}>
                {pos.sourceLabel || 'Source'} <ExternalLink style={{ width: 12, height: 12 }} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/** A pager arrow. Quiet at rest, invisible-but-present when it can't go
 *  further, so the row doesn't reflow as you step through the pages. */
function PageButton({ onClick, disabled, label, size = 30, children }: {
  onClick: () => void
  disabled: boolean
  label: string
  /** The band's copy sits at 24 so that row is no taller than a data row. */
  size?: number
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      /* The VISIBLE button is the inner span; this element is only the hit
         area. globals.css gives every button a 44px minimum on a phone (a
         deliberate tap-target rule), which would otherwise have made the
         band's row 57px tall for a 24px control. Padding out to 44 and
         pulling the margin back leaves the layout footprint at `size` while
         the finger still gets the full 44. */
      style={{
        padding: (44 - size) / 2, margin: -(44 - size) / 2,
        background: 'none', border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <span style={{
        width: size, height: size, borderRadius: size > 26 ? 9 : 7,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: '#fff', border: `1px solid ${BORDER}`,
        color: disabled ? '#cdd2d8' : INK, opacity: disabled ? .55 : 1,
      }}>{children}</span>
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
/* The party column's right-hand rule: an actual line between the names and the
   ticks, by request. It replaces the soft shadow that used to mark that edge —
   the shadow was there to show the column was pinned over scrolling content,
   and with the topics paged rather than scrolled there is nothing sliding
   under it to show. */
const PARTY_EDGE = `1px solid ${BORDER}`

/* Preview sheet: bottom sheet on a phone, centred card on a desktop. */
const PREVIEW_CSS = `
.coverage-preview-scrim {
  position: fixed; inset: 0; z-index: 60;
  background: rgba(20, 16, 12, .38);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.coverage-preview {
  background: #fff; border-radius: 16px; width: 100%; max-width: 420px;
  max-height: 80vh; overflow-y: auto;
  box-shadow: 0 8px 20px rgba(42,18,6,.12), 0 32px 60px -20px rgba(42,18,6,.35);
  animation: coverage-preview-in .18s ease-out;
}
@keyframes coverage-preview-in { from { opacity: 0; transform: translateY(6px) scale(.985); } to { opacity: 1; transform: none; } }
@media (max-width: 600px) {
  .coverage-preview-scrim { align-items: flex-end; padding: 0; }
  .coverage-preview {
    max-width: none; border-radius: 18px 18px 0 0; max-height: 86vh;
    padding-bottom: env(safe-area-inset-bottom);
    animation-name: coverage-sheet-in;
  }
}
@keyframes coverage-sheet-in { from { transform: translateY(14px); opacity: 0; } to { transform: none; opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .coverage-preview { animation: none; } }
`

/* On a phone the party column was taking well over half the visible width and
   only one topic column showed, while the cells it left were mostly empty space
   around a 22px tick. Narrower gutters and a smaller party label put noticeably
   more of the grid in view before you have to swipe. Desktop keeps the roomier
   original spacing — the whole table fits there without scrolling. */
const MATRIX_CSS = `
.coverage-matrix th,
.coverage-matrix td { padding: 10px 12px; }
.coverage-party-name { font-size: 13px; }
.coverage-tick { width: 17px; height: 17px; display: block; }
/* Padding out, margin back in: the tap area grows past the glyph without the
   row growing with it, so a 31px row still offers a finger-sized target. */
.coverage-hit { padding: 8px; margin: -8px; }
.coverage-band { white-space: nowrap; display: inline-block; position: sticky; left: 12px; }
.coverage-band-cell { font-size: 11.5px; }
.coverage-band-pager { display: none; }
@media (max-width: 760px) {
  /* 3px of vertical padding: the row is as tall as the tick inside it and
     nothing more, which is the point of an at-a-glance grid. The header keeps
     a little more room because it carries an icon over a word. */
  .coverage-matrix td { padding: 3px 4px; }
  .coverage-matrix th { padding: 6px 4px; }
  /* Almost no right gutter on the party column: the names are left-aligned
     and the ticks are centred in their own columns, so the space between them
     was doing nothing but pushing a topic column off the page. */
  .coverage-matrix th:first-child,
  .coverage-matrix td:first-child { padding-left: 6px; padding-right: 3px; }
    /* Wraps to a second line instead of fading off: a clipped name is a guess,
     and the column has a rule down its right edge now, so a two-line name
     reads as one cell rather than as text drifting into the ticks. */
  /* 10.5px in a 58px column, gutters 6/3: measured so every word in every
     party's short name still fits its line (the widest, "Outdoors" and
     "Palestine", are 49px against 49px of content). Only "Conservative"
     (70px) cannot, and overflow-wrap breaks a word ONLY when it has no other
     option, so that one name is the single place a split happens rather than
     the rule. Pushing the rule further left than this starts breaking
     ordinary names. */
  /* The tick is the tallest thing in a row, so it sets the row height. */
  .coverage-tick { width: 15px; height: 15px; }
  .coverage-party-name {
    font-size: 10.5px; display: block; line-height: 1.2;
    white-space: normal; overflow-wrap: break-word; hyphens: auto;
  }
  /* Fits on one line now that the label is four words; the cap is kept as a
     backstop so it can never jut across the tick columns. */
  .coverage-band { white-space: normal; max-width: 200px; left: 6px; }
  /* The band is a divider, not a section header: same height as the rows it
     divides, so the eye reads straight past it into the second list. */
  /* padding-right holds the pager's INVISIBLE 44px hit box inside the
     container. Without it the box overhangs the right edge by ~7px, which is
     enough to make the container scrollable — a scrollbar and a swipe for a
     margin nobody can see. */
  /* "tr th." rather than "th.": the band cell is ALSO a :first-child, and
     that rule has the same specificity, so it was winning on source order and
     holding the padding at 3px. */
  .coverage-matrix tr th.coverage-band-cell { font-size: 10.5px; padding-top: 3px; padding-bottom: 3px; padding-right: 14px; }
  /* Shown only where the table is paged, i.e. where the arrows exist at all. */
  /* Above the container's right-edge fade (.scroll-x::after in globals.css),
     which otherwise washes the "more topics" arrow out to nearly nothing. The
     fade is a plain absolute overlay, so a positioned z-index clears it. */
  /* No scrollbar under the table: the topics are PAGED, so on a phone the
     grid always fits and the bar was a control for a gesture that does
     nothing. overflow-x stays auto as a safety net for a viewport too narrow
     for even one column, so the content is never unreachable, just unadorned. */
  .coverage-scroll { scrollbar-width: none; -ms-overflow-style: none; }
  .coverage-scroll::-webkit-scrollbar { display: none; }
  .coverage-band-pager { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; position: relative; z-index: 2; }
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
