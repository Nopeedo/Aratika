'use client'

/**
 * ClosestRaces — the five tightest 2023 electorate results, as §2.3 tiles that
 * open into a §2.4 panel.
 *
 * WHAT THIS REPLACED. The Election Centre rendered
 * components/homepage/battlegrounds-teaser.tsx, which laid the same five seats
 * out as BattlegroundCards: full-width paper cards with a party band, an MP
 * photo row, a tier chip and a 20px majority figure, one per row at 375px.
 * 207px each, 1,083px for the block, and the card carries no more information
 * than a tile plus its panel does. Two columns of §2.3 tiles at ~83px is 265px
 * for the same five seats, with every fact still on the page (§1.5) and none of
 * it on screen before the reader has picked a seat (§1.1).
 *
 * It is a SEPARATE component rather than a prop on the teaser because
 * battleground-card.tsx is also rendered by /parties/[slug], so the card itself
 * could not be restyled without changing a page that is not this one's to
 * change.
 *
 * NO JOURNEY STRIP in the panel. §2.4's fixed order runs badge, title, summary,
 * label, journey, meta, source; an electorate result has no stages, so rows 4
 * and 5 have nothing to draw. This is the §2.12 divergence, recorded rather
 * than pretended away: the rows that exist keep §2.4's order and treatment
 * exactly, including the full-breakdown link INLINE at the end of the summary
 * sentence rather than as a signpost of its own.
 *
 * Every figure here is the verified 2023 winning margin from
 * constants/electorates-data.ts. Nothing is projected and nothing is predicted:
 * a close 2023 result is a reason to watch a seat, not a claim about 2026 (§1.8).
 */

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronDown, X } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { PARTY_COLORS, PARTY_NAMES } from '@/constants/parties'
import type { PartySlug } from '@/types'
import { BORDER, INK, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

/** One seat, flattened to serialisable values so the page can stay a server
 *  component and do the MP-photo lookup once, at build time. */
export interface ClosestRace {
  slug: string
  name: string
  /** 1 = closest in the country. */
  rank: number
  tierLabel: string
  tierColor: string
  party: PartySlug | null
  mpName: string | null
  mpPhoto?: string
  majority: number
  maori: boolean
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/** The tier hue, darkened enough to read as 9.5px type on its own .12 tint.
 *  Amber (#f59e0b) is the one that fails at rest; the two reds pass and are
 *  left almost alone. Same shape as seat-chamber.tsx's rimColor(), and for the
 *  same reason: a colour chosen to be seen as a fill is not a colour to set
 *  type in. */
function tierInk(hex: string): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  const f = lum > 0.55 ? 0.6 : 0.88
  const d = (v: number) => Math.round(v * f).toString(16).padStart(2, '0')
  return `#${d(r)}${d(g)}${d(b)}`
}

export function ClosestRaces({ races, year }: { races: ClosestRace[]; year: number }) {
  // Nothing open on arrival (§1.1).
  const [active, setActive] = useState<string | null>(null)

  if (races.length === 0) return null

  return (
    <div>
      {/* §2.3's grid, verbatim: two columns at 375px, tiles wrap rather than
          scroll sideways, and the panel spans every column so the row breaks at
          the tapped tile instead of at the foot of the grid.

          auto-FIT, not auto-fill: five tiles in a six-track row left one
          dead track hanging off the end at desktop widths. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 8 }}>
        {races.map((r) => {
          const on = r.slug === active
          const ink = tierInk(r.tierColor)
          const pc = r.party ? PARTY_COLORS[r.party] : null
          return (
            <Fragment key={r.slug}>
              <button
                onClick={() => setActive(on ? null : r.slug)}
                aria-expanded={on}
                style={{
                  textAlign: 'left', cursor: 'pointer', position: 'relative',
                  background: hexToRgba(r.tierColor, 0.12), borderRadius: 11,
                  padding: '7px 26px 20px 10px',
                  borderStyle: 'solid',
                  borderWidth: on ? 3 : 2,
                  borderColor: on ? ink : r.tierColor,
                  transition: 'border-color .2s ease, border-width .2s ease',
                  fontFamily: MANROPE,
                }}
              >
                {/* Status top-left, party tag pinned top-right, title, chevron
                    bottom-right. The tag and the chevron are absolute for the
                    §2.3 reason: in the flex row the tag sat 35px in, because
                    that row also has to clear the chevron's padding. */}
                <span style={{ display: 'block', fontSize: 9.5, fontWeight: 800, color: ink, fontFamily: MANROPE, marginBottom: 2 }}>
                  {r.tierLabel}
                </span>
                {pc && r.party && (
                  <span style={{
                    position: 'absolute', top: 7, right: 8,
                    display: 'inline-flex', alignItems: 'center', flexShrink: 0,
                    fontSize: 9, fontWeight: 800, color: pc.text, background: pc.bg,
                    borderRadius: 999, padding: '2px 6px', fontFamily: MANROPE, whiteSpace: 'nowrap',
                  }}>{PARTY_NAMES[r.party].short}</span>
                )}
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.25 }}>{r.name}</span>
                <ChevronDown
                  style={{
                    position: 'absolute', right: 8, bottom: 7, width: 15, height: 15, color: ink,
                    transform: on ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease',
                  }}
                  strokeWidth={3}
                />
              </button>

              {on && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <RacePanel race={r} year={year} onClose={() => setActive(null)} />
                </div>
              )}
            </Fragment>
          )
        })}
      </div>

      {/* Said once, under the grid, rather than as a source row in each of five
          panels: they all come from one file and one check (§1.3). */}
      <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '10px 0 0', lineHeight: 1.5 }}>
        {year} winning margins, checked against elections.nz.
      </p>
    </div>
  )
}

/** §2.4, in its fixed order. See the note at the top on the two rows an
 *  electorate result has nothing to put in. */
function RacePanel({ race: r, year, onClose }: { race: ClosestRace; year: number; onClose: () => void }) {
  const ink = tierInk(r.tierColor)
  const partyName = r.party ? PARTY_NAMES[r.party].short : null

  return (
    <div style={{
      background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16,
      padding: 'clamp(14px, 2.5vw, 20px)', marginTop: 2,
      boxShadow: '0 1px 2px rgba(0,0,0,.03), 0 20px 40px -34px rgba(0,0,0,.4)',
    }}>
      {/* 1 — badge left, close right */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '.05em', color: ink,
          background: hexToRgba(r.tierColor, 0.14), borderRadius: 999, padding: '4px 11px', fontFamily: MANROPE,
        }}>{r.tierLabel}</span>
        <button type="button" onClick={onClose} aria-label={`Close ${r.name}`} style={{ background: 'none', border: 'none', padding: 6, margin: -6, cursor: 'pointer', color: SECONDARY, display: 'inline-flex', flexShrink: 0 }}>
          <X style={{ width: 17, height: 17 }} />
        </button>
      </div>

      {/* 2 — title */}
      <h3 style={{ fontSize: 'clamp(17px, 2.6vw, 21px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '11px 0 8px', lineHeight: 1.2 }}>
        {r.name}
      </h3>

      {/* 3 — summary, with the way to the rest of it at the END of the sentence.
          As a standalone signpost it was the loudest thing in the panel for a
          link most readers will not take (§2.4). */}
      <p style={{ fontSize: 13.5, color: '#3f372f', fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 12px' }}>
        {r.mpName && partyName
          ? <>{r.mpName} held {r.name} for {partyName} in {year} by <b style={{ color: INK }}>{r.majority.toLocaleString()} votes</b>, {rankPhrase(r.rank)} in the country.</>
          /* §1.5: a seat whose sitting MP is not yet verified says so rather
             than dropping the sentence and leaving a panel with a hole in it. */
          : <>{r.name} was won in {year} by <b style={{ color: INK }}>{r.majority.toLocaleString()} votes</b>, {rankPhrase(r.rank)} in the country. The sitting MP is not verified in our records yet.</>}{' '}
        <Link
          href={`/battlegrounds/${r.slug}`}
          style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3, fontSize: 12.5, fontWeight: 800, color: ink, fontFamily: MANROPE, textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          Read the full contest <ArrowRight style={{ width: 12, height: 12, alignSelf: 'center' }} strokeWidth={3} />
        </Link>
      </p>

      {/* 6 — meta. The sitting MP is this list's equivalent of "In charge",
          and it is the one piece of extra DATA the old card carried that a tile
          cannot: a name and a face for the person holding the seat. */}
      {r.mpName && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', background: hexToRgba(r.party ? PARTY_COLORS[r.party].bg : r.tierColor, 0.07), borderRadius: 11 }}>
          <Avatar name={r.mpName} party={r.party ?? undefined} src={r.mpPhoto} size="md" face />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: INK, fontFamily: MANROPE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.mpName}</div>
            <div style={{ fontSize: 11.5, color: SECONDARY, fontFamily: MANROPE, marginTop: 1 }}>
              Sitting MP{partyName ? `, ${partyName}` : ''}{r.maori ? ' · Māori electorate' : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** "the 1st closest result" reads wrong, so rank 1 says "the closest result"
 *  outright and the rest take an ordinal. */
function rankPhrase(n: number): string {
  if (n === 1) return ' the closest result'
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  const suffix = s[(v - 20) % 10] ?? s[v] ?? s[0]
  return ` the ${n}${suffix} closest result`
}
