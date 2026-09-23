'use client'

/**
 * BudgetSectors / BudgetOutlook — the two lists on /budget, as one interaction.
 *
 * WHAT THIS REPLACED. Eleven sector cards, all expanded on arrival, printing
 * all 51 Treasury funding lines whether or not the reader had asked for one of
 * them: 4,613px of the page's 7,907px, and a direct §1.1 breach. Plus two
 * always-open outlook cards in a fourth box treatment. /budget carried six
 * different box radii doing the job of "a card" (§1.4: extra data is allowed,
 * extra design is not).
 *
 * WHAT IT IS NOW. §2.2 pills over a §2.3 tile grid; a tile opens a §2.4 panel
 * directly beneath it, spanning every column. The outlook uses the identical
 * tile and the identical panel, so the page has ONE list interaction (§1.4) and
 * a reader who opens one has learned how to open the other.
 *
 * This is the third copy of the tile-and-panel composition in the tree
 * (defining-bills.tsx and the bills tracker each hold their own), deliberately,
 * because there is no shared component to swap to. It copies
 * defining-bills.tsx's COMPOSITION and not just its frame, which is the §2.4
 * mistake that had to be paid for twice on /bills: the first pass matched the
 * container, the radius and the row order, and still showed different THINGS in
 * those rows.
 *
 * THE DESKTOP RULE (§2.14, §2.15, §5.19). The tile is the same card at two
 * scales, never a re-layout: 165x121 at 375px (two columns of a 337px content
 * width), 245x142 at 1920 (four columns of 1008). Before this it would have
 * been the SAME tile at both, six 161px tracks wide on a desktop, which is the
 * failure §2.14 and §2.15 are both written against.
 *
 * Every reserved height is restated at the larger size, because two lines of
 * 15px is 36px where two lines of 12.5px was 32, and a 24px figure on a
 * baseline is taller than a 20px one. Grid items stretch to their row, so a
 * missed reserve shows BETWEEN rows, which is why one of them can look fine at
 * two columns and wrong at four.
 */

import { Fragment, useMemo, useState } from 'react'
import { ChevronDown, ExternalLink, X } from 'lucide-react'
import {
  BUDGET_SECTORS, BUDGET_OUTLOOK, KIND_LABEL, KIND_COLOR, OUTLOOK_SOURCE,
  matchesKind, type BudgetItem,
} from '@/constants/budget-2026'
import { BORDER, INK, JADE, JADE_DARK, JADE_SUBTLE, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

/** Matches the homepage party-panel swap, so the two feel like one interaction. */
const FADE_MS = 200

/** Pill order: everything, then the two kinds of spending, then what was saved.
 *  `mixed` is deliberately not a pill: a line that is both ongoing and one-off
 *  belongs under BOTH of those, which is what matchesKind() does, and a fifth
 *  pill for it would put four of the 51 lines in a category of their own and
 *  push the row onto a second line at 375px. */
const KINDS = ['operating', 'capital', 'saving'] as const
type FilterKind = (typeof KINDS)[number]

/* ───────────────────────────── Sector list ───────────────────────────── */

export function BudgetSectors() {
  const [open, setOpen] = useState<string | null>(null)
  const [kind, setKind] = useState<FilterKind | null>(null)
  const [fading, setFading] = useState(false)

  /** Counts for the pills. A `mixed` line is both ongoing and one-off, so it
   *  counts in both: that is what the Budget says it is, not a rounding. */
  const counts = useMemo(() => {
    const all = BUDGET_SECTORS.flatMap((s) => s.items)
    return {
      all: all.length,
      operating: all.filter((i) => matchesKind(i, 'operating')).length,
      capital: all.filter((i) => matchesKind(i, 'capital')).length,
      saving: all.filter((i) => matchesKind(i, 'saving')).length,
    }
  }, [])

  /* Sectors with nothing left under the active pill drop out of the grid
     entirely rather than sitting there empty (§1.5: a tile that opens onto
     nothing reads as broken). The grid is auto-FIT, so the survivors fill the
     row instead of leaving held-open tracks (§5.18). */
  const shown = BUDGET_SECTORS
    .map((s) => ({ sector: s, items: s.items.filter((i) => matchesKind(i, kind)) }))
    .filter((s) => s.items.length > 0)

  function select(key: string) {
    if (key === open) { setOpen(null); return }
    if (!open) { setOpen(key); return }
    setFading(true)
    setTimeout(() => { setOpen(key); setFading(false) }, FADE_MS)
  }

  function filter(next: FilterKind | null) {
    setKind(next)
    // Don't leave a panel open for a sector the pill has just emptied.
    if (open && next) {
      const s = BUDGET_SECTORS.find((x) => x.key === open)
      if (s && !s.items.some((i) => matchesKind(i, next))) setOpen(null)
    }
  }

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: BS_CSS }} />

      {/* §2.2 pills. They replaced a 77px legend paragraph that explained three
          chips: the distinction is taught by operating the control instead.
          "All" leads the row carrying the total and is lit by default; tapping
          the lit one clears back to All. */}
      <div className="bs-kind-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        <Pill label="All" count={counts.all} on={kind === null} fg={INK} hue={INK} bg="#efece5" onClick={() => filter(null)} />
        {KINDS.map((k) => (
          <Pill
            key={k}
            label={KIND_LABEL[k]}
            count={counts[k]}
            on={kind === k}
            fg={KIND_COLOR[k].fg}
            hue={KIND_COLOR[k].fg}
            bg={KIND_COLOR[k].bg}
            onClick={() => filter(kind === k ? null : k)}
          />
        ))}
      </div>

      <div className="bs-grid" style={{ display: 'grid' }}>
        {shown.map(({ sector: s, items }) => {
          const on = s.key === open
          /* Under an active pill the tile re-counts rather than keeping a
             headline figure that describes lines the reader has filtered out. */
          const figure = kind ? String(items.length) : s.figure
          const note = kind ? `${KIND_LABEL[kind].toLowerCase()} items` : s.figureNote
          return (
            <Fragment key={s.key}>
              <Tile title={s.label} figure={figure} note={note} on={on} onClick={() => select(s.key)} />
              {on && (
                <div style={{ gridColumn: '1 / -1', opacity: fading ? 0 : 1, transition: `opacity ${FADE_MS}ms ease-in-out` }}>
                  <Panel
                    badge={kind ? `${items.length} of ${s.items.length} items` : `${s.items.length} items`}
                    title={s.label}
                    summary={s.blurb}
                    listLabel="What the money goes on"
                    source={s.source}
                    onClose={() => setOpen(null)}
                  >
                    {/* Treasury publishes no single headline amount for some
                        areas, so the tile shows a count. Say so rather than
                        letting a "4" read as four billion (§1.5). */}
                    {!kind && s.figureIsCount && (
                      <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '0 0 10px', lineHeight: 1.5 }}>
                        Treasury publishes no single headline figure for this area, so the tile counts its funding lines.
                      </p>
                    )}
                    <ItemList items={items} />
                  </Panel>
                </div>
              )}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

/* ───────────────────────────── The outlook ───────────────────────────── */

/**
 * The same tile and the same panel as the sector grid above, by design (§1.4).
 * These two used to be a separate always-open card shape with a third pill
 * treatment inside them; the indicators are NOT a status, so they are plain
 * labels in the panel and never a second pill row.
 *
 * The figure slot is empty here: a forecast has no headline number on
 * Treasury's own summary, and inventing one is the thing this page must not do
 * (§1.8). The note slot carries the reserve instead, so both tiles are the
 * same height as each other.
 */
export function BudgetOutlook() {
  const [open, setOpen] = useState<string | null>(null)
  const entries = [BUDGET_OUTLOOK.economic, BUDGET_OUTLOOK.fiscal]

  return (
    <div>
      {/* Mounted here too, not only in BudgetSectors: §3.2's exact failure was
          a phone block mounted inside one branch, so the tallest card on the
          page never received any of it. */}
      <style dangerouslySetInnerHTML={{ __html: BS_CSS }} />

      <div className="bs-grid" style={{ display: 'grid' }}>
        {entries.map((o) => {
          const on = o.title === open
          return (
            <Fragment key={o.title}>
              <Tile
                title={o.title}
                figure=""
                note="Treasury forecast"
                on={on}
                onClick={() => setOpen(on ? null : o.title)}
              />
              {on && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <Panel
                    badge="Treasury forecast"
                    title={o.title}
                    summary={o.summary}
                    listLabel="What Treasury tracks"
                    source={OUTLOOK_SOURCE}
                    onClose={() => setOpen(null)}
                  >
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {o.indicators.map((ind) => (
                        <li key={ind} className="bs-item-text" style={{ fontSize: 12.5, fontWeight: 600, color: '#3f444c', fontFamily: MANROPE, lineHeight: 1.5 }}>
                          {ind}
                        </li>
                      ))}
                    </ul>
                  </Panel>
                </div>
              )}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────── Pieces ──────────────────────────────── */

/**
 * §2.3 tile. One neutral jade treatment rather than a colour per sector: the
 * kind colours mean "ongoing / one-off / saving" on the pills and on the dots
 * in the panel, and colouring a tile by the modal kind of its lines would say
 * something about its DOLLARS that counting its lines does not support (§1.6,
 * one meaning at a time).
 *
 * Title and note are FIXED heights at both scales. Sector names run from
 * "Health" to "Cost of living (fuel response)", so a card that grows by a line
 * leaves the one beside it short and the grid staggers down the page (§2.14).
 */
function Tile({ title, figure, note, on, onClick }: {
  title: string
  figure: string
  note: string
  on: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-expanded={on}
      className="bs-tile"
      style={{
        position: 'relative', textAlign: 'left', cursor: 'pointer',
        background: JADE_SUBTLE,
        borderStyle: 'solid',
        borderWidth: on ? 3 : 2,
        borderColor: on ? JADE_DARK : JADE,
        transition: 'border-color .2s ease, border-width .2s ease',
        fontFamily: MANROPE,
      }}
    >
      <span className="bs-title" style={{
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        fontWeight: 800, color: INK, fontFamily: MANROPE,
      }}>{title}</span>

      <span className="bs-fig" style={{ display: 'block' }}>
        {figure && (
          <span className="bs-figure" style={{
            display: 'block', fontWeight: 800, color: INK, fontFamily: MANROPE,
            letterSpacing: '-.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          }}>{figure}</span>
        )}
        {/* Two lines, FIXED. One line with an ellipsis lost the second half of
            "for the expressway, plus $1.2b rail", which is a figure, and a
            figure is not a thing to truncate (§5.17). */}
        <span className="bs-note" style={{
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          fontWeight: 700, color: SECONDARY, fontFamily: MANROPE,
        }}>{note}</span>
      </span>

      {/* Bottom-right, so a tile reads as something that opens before it has
          been tapped, and so the top-right corner stays free (§2.3). */}
      <ChevronDown
        className="bs-chev"
        style={{
          position: 'absolute', color: JADE_DARK,
          transform: on ? 'rotate(180deg)' : 'none',
          transition: 'transform .2s ease',
        }}
        strokeWidth={3}
      />
    </button>
  )
}

/** §2.4 panel, in defining-bills.tsx's order: badge and close, title, summary,
 *  the uppercase label, the list, then the source LAST. */
function Panel({ badge, title, summary, listLabel, source, onClose, children }: {
  badge: string
  title: string
  summary: string
  listLabel: string
  source: { label: string; url: string }
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="bs-panel" style={{
      background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16,
      padding: 'clamp(14px, 2.5vw, 20px)', marginTop: 2,
      boxShadow: '0 1px 2px rgba(0,0,0,.03), 0 20px 40px -34px rgba(0,0,0,.4)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '.05em', color: JADE_DARK,
          background: JADE_SUBTLE, borderRadius: 999, padding: '4px 11px', fontFamily: MANROPE,
        }}>{badge}</span>
        <button type="button" onClick={onClose} aria-label={`Close ${title}`} style={{ background: 'none', border: 'none', padding: 6, margin: -6, cursor: 'pointer', color: SECONDARY, display: 'inline-flex', flexShrink: 0 }}>
          <X style={{ width: 17, height: 17 }} />
        </button>
      </div>

      <h3 className="bs-panel-title" style={{ fontSize: 'clamp(17px, 2.6vw, 21px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '11px 0 8px', lineHeight: 1.2 }}>{title}</h3>

      <p className="bs-panel-sum" style={{ fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 14px' }}>{summary}</p>

      <p className="bs-panel-label" style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, margin: '0 0 10px' }}>{listLabel}</p>

      {children}

      {/* The source, last, where the bills panel puts its official-page link.
          Before this pass every figure on /budget was covered by ONE link in
          the page footer, which evidences the page and not the line (§1.8). */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 16 }}>
        <a href={source.url} target="_blank" rel="noopener noreferrer"
           style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, textDecoration: 'none' }}>
          {source.label} <ExternalLink style={{ width: 11, height: 11 }} />
        </a>
      </div>
    </div>
  )
}

/** The funding lines. The kind is a 6px dot in the pill's own colour, not the
 *  word it used to be: a 10px word beside 12.5px text is a second headline on
 *  every row, and globals.css promotes an inline 10px to 12px on a phone, which
 *  put the tag within half a pixel of the text it annotates. */
function ItemList({ items }: { items: BudgetItem[] }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
      {items.map((it, i) => (
        <li key={i} style={{ display: 'flex', gap: 9, alignItems: 'baseline' }}>
          {it.kind && (
            <span
              className="bs-dot"
              title={KIND_LABEL[it.kind]}
              style={{ flexShrink: 0, borderRadius: '50%', background: KIND_COLOR[it.kind].fg, alignSelf: 'center' }}
            />
          )}
          {it.amount && (
            <span className="bs-item-amt" style={{ fontSize: 12.5, fontWeight: 800, color: INK, fontFamily: MANROPE, whiteSpace: 'nowrap', flexShrink: 0 }}>{it.amount}</span>
          )}
          <span className="bs-item-text" style={{ fontSize: 12.5, lineHeight: 1.5, color: '#3f444c', fontFamily: MANROPE }}>{it.text}</span>
        </li>
      ))}
    </ul>
  )
}

/** §3.1: the button is the 44px hit area, the span is the 28px control. */
function Pill({ label, count, on, fg, hue, bg, onClick }: {
  label: string
  count: number
  on: boolean
  fg: string
  hue: string
  bg: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      style={{ display: 'inline-flex', padding: '8px 0', margin: '-8px 0', background: 'none', border: 'none', cursor: 'pointer' }}
    >
      <span
        className="status-pill"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999,
          background: on ? bg : '#fff',
          border: `2px solid ${on ? hue : hexToRgba(hue, 0.34)}`,
          color: fg, fontFamily: MANROPE, fontWeight: 800,
          transition: 'background-color .2s ease, border-color .2s ease',
        }}
      >
        {label}
        <span style={{ fontWeight: 700, opacity: .75 }}>{count}</span>
      </span>
    </button>
  )
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/* /budget shipped NO component CSS at all: the whole page was inline styles, so
   nothing on it could be made responsive and no height could be reserved
   (§3.2 in its pure form). This block is the page's first, and it is mounted by
   BOTH exports rather than by whichever one renders first.

   Sizes live here rather than inline for §2.15's reason as well: globals.css
   rewrites an inline font-size:11px to 12.5px on a phone, so a height computed
   from an inline 11px label is wrong on the device it was computed for. Set in
   a class, the authored value is the rendered value.

   !important throughout the desktop block: every value it overrides is an
   inline style on the same element, and an inline style outranks a stylesheet
   rule (§3.2). */
const BS_CSS = `
.bs-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr));
  gap: 8px;
  align-items: stretch;
}
.bs-tile { border-radius: 11px; padding: 7px 26px 20px 10px; }
/* 2 lines of 12.5px at 1.25 is 31.25, reserved at 32. FIXED, because
   "Cost of living (fuel response)" wraps where "Health" does not. */
.bs-title { height: 32px; font-size: 12.5px; line-height: 1.25; }
.bs-fig { margin-top: 6px; }
.bs-figure { font-size: 20px; }
/* 2 lines of 11px at 1.35 is 29.7, reserved at 30. */
.bs-note { font-size: 11px; line-height: 1.35; height: 30px; margin-top: 2px; }
.bs-chev { right: 8px; bottom: 7px; width: 15px; height: 15px; }
.bs-dot { width: 6px; height: 6px; }

@media (min-width: 768px) {
  /* THE SAME TILE, BIGGER (§2.14). At minmax(150px) a 1008px column gives six
     161px tracks, so a wide screen got MORE tiles rather than bigger ones and
     the phone tile sat in a row of six with the page margins doing the rest.
     230px gives four 244px tiles at 1008, and everything inside steps up with
     the track: padding 7/26/20/10 to 10/30/24/13, title 12.5 to 15, figure 20
     to 24, note 11 to 12, radius 11 to 13.

     It is a SCALE, not a re-layout: title over figure over note at both sizes.
     A tile that becomes a row at the breakpoint is two designs and the reader
     crossing 768px meets both.

     Every reserve is restated, because 2 lines of 15px is 36px where 2 lines of
     12.5px was 32, and a 24px figure on a baseline is taller than a 20px one.
     Grid items stretch to their row, so a missed reserve shows BETWEEN rows. */
  .bs-grid { grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 10px; }
  .bs-tile { border-radius: 13px !important; padding: 10px 30px 24px 13px !important; }
  .bs-title { height: 36px !important; font-size: 15px !important; line-height: 1.2 !important; }
  .bs-fig { margin-top: 8px !important; }
  .bs-figure { font-size: 24px !important; }
  /* 2 lines of 12px at 1.35 is 32.4, reserved at 33 (§2.14: restate it). */
  .bs-note { font-size: 12px !important; height: 33px !important; margin-top: 3px !important; }
  .bs-chev { right: 10px !important; bottom: 9px !important; width: 17px !important; height: 17px !important; }

  /* The panel steps up with the tiles it opens from: 51 funding lines set at a
     phone's 12.5px in a 1008px column is a phone card with the margins doing
     the rest, which is the same failure one level down. */
  .bs-panel { padding: 22px 24px !important; }
  .bs-panel-sum { font-size: 15px !important; }
  .bs-item-amt, .bs-item-text { font-size: 14px !important; }
  .bs-dot { width: 7px !important; height: 7px !important; }
}

@media (max-width: 767px) {
  /* §2.2's lesson, applied to this row: four pills (All, Ongoing, One-off,
     Saving) have to hold ONE line at 375px. Take the horizontal padding before
     you take the size of them, and keep the type at 12.5px with nowrap. Scoped
     to this row, never to the shared .status-pill rule. */
  .bs-kind-row { gap: 4px !important; }
  .bs-kind-row .status-pill {
    padding: 6px 7px !important;
    gap: 4px !important;
    font-size: 12.5px !important;
    white-space: nowrap;
  }
  .bs-kind-row .status-pill span { font-size: 11px !important; }
}
`
