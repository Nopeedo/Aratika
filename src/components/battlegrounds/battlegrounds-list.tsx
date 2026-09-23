'use client'

/**
 * BattlegroundsList — every electorate, ranked by 2023 margin, filtered by one
 * row of §2.2 pills and folded to twelve tiles (§3.6).
 *
 * Three things changed here, in the order they mattered:
 *
 * 1. §3.6. All 72 cards rendered on arrival, 3,536px of them, 67% of the page.
 *    Twelve show now (six rows at 375px, three at 1080), the last row fades
 *    under a mask measured from the bottom of the padded box, and "Show N more"
 *    sits on the fade. The number is computed, because the tier filter changes
 *    it.
 *
 * 2. §2.3 + §1.6. The card carried the SITTING PARTY as its fill and border and
 *    the TIER on a badge inside it: two colour systems on one 158px card. The
 *    page is ranked, sorted, filtered and mapped by margin, so the tier is what
 *    the card is about and it takes the tier's light tint and hue. The party
 *    keeps the §2.3 tag slot, top-right.
 *
 * 3. §2.14. The card was the same object at 375px and at 1920 in everything but
 *    its width: a 300px track on a 1232px column gave three 401px cards holding
 *    a 16px name, which is a phone card stretched rather than a bigger one.
 *    230px above the breakpoint gives four 244px cards at 1080, the same track
 *    /parties and /mps landed on, and every size inside steps up with it.
 *    Measured: 165x106 at 375px, 244x128 at 1080. Every reserved height is
 *    restated at the larger size, because two lines of 15px is 36px where two
 *    lines of 12.5px was 32 (§2.14).
 *
 * auto-FIT, not auto-fill (§5.18): filtered to Ultra-marginal the old grid held
 * eleven tiles in tracks sized for a full row, so a wide screen showed a row
 * jammed left with empty tracks beside it.
 *
 * Defaults to "all" so safe seats are just as browsable as the closest races.
 */

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import { MP_PROFILES } from '@/constants/mps-data'
import { toSlug } from '@/lib/utils/format'
import type { BattlegroundEntry, MarginTier } from '@/lib/battlegrounds'
import { UNKNOWN_TIER } from '@/lib/battlegrounds'
import { BORDER, INK, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

/** How many tiles show before the rest are folded away (§3.6). */
const VISIBLE = 12

/** Feathers the last visible row out under the "Show N more" control.
 *  Stops copied verbatim from bills/defining-bills.tsx: they are measured from
 *  the bottom of the PADDED box, not from the last row, and a shorter fade
 *  spends itself on the 34px of padding the control sits in and reads as no
 *  fade at all (§3.6). */
const FOLD_MASK = 'linear-gradient(to bottom, #000 0%, #000 calc(100% - 86px), rgba(0,0,0,.12) calc(100% - 26px), transparent calc(100% - 10px))'

/** Fade a hex to rgba, so an unselected pill still carries its tier's hue on
 *  the border at ~34% rather than the neutral hairline §2.2 rules out. */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

export function BattlegroundsList({ all, tiers }: { all: BattlegroundEntry[]; tiers: MarginTier[] }) {
  const [filter, setFilter] = useState<string>('all')
  const [showAll, setShowAll] = useState(false)

  const shown = filter === 'all' ? all : all.filter((b) => b.tier.key === filter)
  const hidden = Math.max(0, shown.length - VISIBLE)
  const collapsed = !showAll && hidden > 0
  const cards = collapsed ? shown.slice(0, VISIBLE) : shown

  /* "All electorates (72)" sat above four pills adding to 70. Port Waikato and
     Tāmaki Makaurau have no 2023 winning margin on record, so classifyMargin
     puts them in UNKNOWN_TIER, which is not in MARGIN_TIERS and therefore had
     no pill. They have one now, and the arithmetic on the row is true. */
  const pendingCount = all.filter((b) => b.tier.key === UNKNOWN_TIER.key).length
  const pills: { tier: MarginTier | null; count: number }[] = [
    { tier: null, count: all.length },
    ...tiers.map((t) => ({ tier: t, count: all.filter((b) => b.tier.key === t.key).length })),
    ...(pendingCount > 0 ? [{ tier: UNKNOWN_TIER, count: pendingCount }] : []),
  ]

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: LIST_CSS }} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {pills.map(({ tier, count }) => {
          if (count === 0) return null
          const key = tier?.key ?? 'all'
          return (
            <FilterPill
              key={key}
              label={tier?.label ?? 'All electorates'}
              count={count}
              tier={tier}
              on={filter === key}
              /* Tapping the lit one clears back to All, per §2.2. */
              onClick={() => { setFilter(filter === key ? 'all' : key); setShowAll(false) }}
            />
          )
        })}
      </div>

      <div style={{ position: 'relative' }}>
        <div
          className="bg-grid"
          style={{
            padding: collapsed ? '0 0 34px' : '0 0 2px',
            ...(collapsed ? { WebkitMaskImage: FOLD_MASK, maskImage: FOLD_MASK } : null),
          }}
        >
          {cards.map((b) => <SeatCard key={b.slug} entry={b} />)}
        </div>

        {/* On the fade while collapsed, where the fade is already saying "this
            continues", so the affordance and the explanation are one thing.
            The number is named, because "60 more" is a decision and "more" is
            not (§3.6). */}
        {collapsed && (
          <button
            onClick={() => setShowAll(true)}
            aria-expanded={false}
            style={{
              position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)',
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 999,
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: MANROPE, fontSize: 12, fontWeight: 800, color: '#9a2620',
            }}
          >
            Show {hidden} more
            <ChevronDown style={{ width: 15, height: 15 }} strokeWidth={3} />
          </button>
        )}
      </div>

      {hidden > 0 && !collapsed && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <button
            onClick={() => setShowAll(false)}
            aria-expanded
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '8px 12px', margin: '-4px 0',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: MANROPE, fontSize: 12, fontWeight: 800, color: '#9a2620',
            }}
          >
            Show fewer
            <ChevronDown style={{ width: 15, height: 15, transform: 'rotate(180deg)' }} strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * One seat, as a §2.3 tile.
 *
 * It LINKS rather than opens, which is §2.12's divergence for the same reason:
 * a seat has a whole page of its own, so a panel opening under the tile would
 * be a worse answer than the page. No chevron follows from that, and with no
 * chevron in the bottom-right the top row can reach the corner in normal flow
 * rather than being absolutely positioned. §2.3 pins the party tag because in
 * ITS tiles the row also has to clear the chevron's padding; here it does not,
 * and a flow row cannot overlap a long tier label ("Ultra-marginal" and
 * "Te Pāti Māori" together are 137px of a 141px card at 375px).
 */
function SeatCard({ entry: b }: { entry: BattlegroundEntry }) {
  /**
   * The party tag is the SITTING member's party, not the one that won the seat
   * in 2023 — the same distinction the battle page draws. Two MPs have changed
   * affiliation this term, and a card that pairs their name with their old
   * party's colour states something false about a named person. The card's
   * number is still the 2023 majority, which is what it says it is.
   */
  const mp = b.info.mpSlug ? MP_PROFILES[b.info.mpSlug] : (b.info.mpName ? MP_PROFILES[toSlug(b.info.mpName)] : undefined)
  const sitting = mp?.party ?? b.info.party ?? null
  const party = sitting ? PARTY_COLORS[sitting] : null

  return (
    <Link
      href={`/battlegrounds/${b.slug}`}
      /* NOT .policy-card / .party-card: both of those rewrite border-color to
         JADE on hover with !important, so hovering an ultra-marginal seat
         turned its red outline green — a second colour system arriving on a
         mouse move (§1.6). The lift ships here instead (§3.2). */
      className="bg-card"
      style={{ background: b.tier.light, border: `2px solid ${b.tier.color}` }}
    >
      <span className="bg-top">
        <span className="bg-tier" style={{ color: b.tier.fg, fontFamily: MANROPE }}>{b.tier.label}</span>
        {sitting && party && (
          <span className="bg-tag" style={{ background: party.bg, color: party.text, fontFamily: MANROPE }}>
            {PARTY_NAMES[sitting].short}
          </span>
        )}
      </span>

      <span className="bg-name" style={{ color: INK, fontFamily: MANROPE }}>{b.info.name}</span>

      <span className="bg-mprow">
        <span className="bg-mp" style={{ color: SECONDARY, fontFamily: MANROPE }}>{b.info.mpName}</span>
        {/* The roll, on the MP's line rather than the tier's: the tag slot is
            taken, and at 375px a third chip on the majority line overflowed
            the card by 6px. */}
        {b.info.type === 'maori' && (
          <span className="bg-roll" style={{ color: '#7c3aed', background: '#f3e8ff', fontFamily: MANROPE }}>Māori</span>
        )}
      </span>

      <span className="bg-foot">
        <span className="bg-flab" style={{ color: TERTIARY, fontFamily: MANROPE }}>
          {b.info.majority != null ? '2023 majority' : 'Margin'}
        </span>
        <span className="bg-fig" style={{ color: b.info.majority != null ? INK : TERTIARY, fontFamily: MANROPE }}>
          {b.info.majority != null ? b.info.majority.toLocaleString('en-NZ') : 'not on record'}
        </span>
      </span>
    </Link>
  )
}

/** §2.2 pill in a §3.1 hit area: the button is the 44px target, the span is the
 *  28px control. The old chips were bare <button>s styled to 29px and caught by
 *  globals.css's `button { min-height: 44px }` on phones — the exact symptom
 *  §3.1 names. Five of them at 44px were 146px of row.
 *
 *  Selected tier pills fill with the TIER's own light tint and take a
 *  full-strength border of the same hue, rather than §2.14's neutral INK: here
 *  the tier colour IS the page's colour system (the map, the legend and every
 *  card are drawn in it), so a neutral lit pill would be the second system
 *  §1.6 rules out. "All electorates" stays neutral, because it is not a tier. */
function FilterPill({ label, count, on, tier, onClick }: {
  label: string
  count: number
  on: boolean
  tier: MarginTier | null
  onClick: () => void
}) {
  const bg = on ? (tier ? tier.light : '#efece5') : '#fff'
  const bd = on ? (tier ? tier.color : INK) : (tier ? hexToRgba(tier.color, 0.34) : BORDER)
  const fg = on && tier ? tier.fg : INK

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
          background: bg, border: `2px solid ${bd}`,
          color: fg, fontFamily: MANROPE, fontWeight: 800, whiteSpace: 'nowrap',
          transition: 'background-color .2s ease, border-color .2s ease',
        }}
      >
        {label}
        <span style={{ fontWeight: 700, opacity: .75 }}>{count}</span>
      </span>
    </button>
  )
}

/* Every size lives here rather than inline, for §2.15's reason: globals.css's
   mobile readability floor rewrites an inline `font-size:11px` to 12.5px on a
   phone, so a height reserved against an inline 11px label is wrong on the
   device it was computed for. Set in a class, the reserve and the type it
   reserves for stay in one place.

   The heights are FIXED, not minimums, and that is the whole point of them
   (§2.14): an electorate name that wraps to two lines where its neighbour
   takes one leaves the card beside it short, and because grid items stretch to
   their row the stagger shows BETWEEN rows. "Christchurch Central" is two
   lines at 12.5px in a 141px card and one at 15px in a 214px one; the reserve
   is two lines at both sizes so a name is never clipped at either.

   Measured: 165x106 at 375px (two columns), 244x128 at 1080 (four). */
const LIST_CSS = `
.bg-grid  { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr)); gap: 8px; align-items: stretch; }
.bg-card  { position: relative; display: flex; flex-direction: column; border-radius: 11px; padding: 6px 10px 8px; text-decoration: none;
            transition: box-shadow .15s, transform .15s; }
.bg-card:hover { box-shadow: 0 6px 20px rgba(42,18,6,.13); transform: translateY(-2px); }
@media (prefers-reduced-motion: reduce) { .bg-card:hover { transform: none; } }
.bg-top   { display: flex; align-items: center; justify-content: space-between; gap: 6px; height: 16px; }
.bg-tier  { font-size: 9.5px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bg-tag   { font-size: 9px; font-weight: 800; border-radius: 999px; padding: 2px 6px; white-space: nowrap; flex-shrink: 0; }
.bg-name  { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
            height: 32px; margin-top: 2px; font-size: 12.5px; font-weight: 800; line-height: 1.25; }
.bg-mprow { display: flex; align-items: center; gap: 5px; height: 15px; margin-top: 3px; }
.bg-mp    { flex: 1; min-width: 0; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bg-roll  { flex-shrink: 0; font-size: 9px; font-weight: 800; border-radius: 999px; padding: 1px 6px; }
.bg-foot  { display: flex; align-items: baseline; gap: 4px; height: 16px; margin-top: auto; padding-top: 4px; white-space: nowrap; }
.bg-flab  { font-size: 9.5px; font-weight: 700; }
.bg-fig   { font-size: 12.5px; font-weight: 800; letter-spacing: -.01em; font-variant-numeric: tabular-nums; }

@media (min-width: 768px) {
  /* The SAME card, bigger, not a re-layout (§2.14). 230px is four tracks on a
     1008px column, the track /parties and /mps both landed on, and everything
     inside steps up with it: 9.5px tier label to 11, 12.5px name to 15, 11px
     MP line to 13, 12.5px figure to 15, padding 6/10/8 to 9/13/11, radius 11
     to 13. Name over MP over margin at both sizes.

     Each reserve is restated, not scaled by the browser: 16 to 19 on the tag
     row (a 10.5px tag in 2px of padding is 19px where a 9px one was 16), 32 to
     36 on the two-line name, 15 to 18 on the MP line, 16 to 19 on the figure. */
  .bg-grid  { grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 10px; }
  .bg-card  { border-radius: 13px; padding: 9px 13px 11px; }
  .bg-top   { height: 19px; }
  .bg-tier  { font-size: 11px; }
  .bg-tag   { font-size: 10.5px; padding: 2px 8px; }
  .bg-name  { height: 36px; margin-top: 3px; font-size: 15px; line-height: 1.2; }
  .bg-mprow { height: 18px; margin-top: 4px; }
  .bg-mp    { font-size: 13px; }
  .bg-roll  { font-size: 10.5px; padding: 1px 7px; }
  .bg-foot  { height: 19px; padding-top: 5px; }
  .bg-flab  { font-size: 11px; }
  .bg-fig   { font-size: 15px; }
}
`
