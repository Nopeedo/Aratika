/**
 * PartiesContesting — every registered party contesting the party vote, shown as
 * a tile that FILLS to that party's current poll-of-polls share, like a glass
 * filling. The 5% threshold is drawn across every tile at the same height, so
 * you can see at a glance who clears it, who's close to it, and who doesn't.
 *
 * Replaces a flat row of party pills. Same fairness rule as before: grouped by
 * whether they hold seats now, explicitly NOT ranked by support, and every
 * registered party appears — see /party-inclusion.
 *
 * The honesty problem this has to solve: only seven of the thirteen contesting
 * parties are polled individually. The rest are bundled into pollsters' "Others"
 * and only occasionally itemised in a footnote. Filling those tiles to their
 * footnote number would be doubly misleading — 0.3% renders as ~1px (visually
 * identical to zero, the exact impression the fairness rule exists to avoid),
 * and it implies the figure was measured to the same standard as a headline
 * party-vote number when it's an irregular sub-sample inside the margin of
 * error. So those tiles carry no fill and instead state the last published
 * reading with its pollster and date, or say plainly that there isn't one.
 */

import Link from 'next/link'
import { PARTY_COLORS, PARTY_NAMES, CURRENT_SEATS, PARLIAMENTARY_PARTIES, NON_PARLIAMENTARY_CONTESTING } from '@/constants/parties'
import { MINOR_PARTY_READINGS } from '@/constants/polls-history'
import type { PartySlug } from '@/types'
import { MANROPE } from '@/constants/theme'

// Group headings only — tile text now uses each party's own contrast colour.
const WARM = '#5b3d2a', LINE = '#e9e4db'

const TILE_H = 172
/** Top band kept clear for the party name, its full name (which wraps to two
 *  lines on the longer ones) and the seats chip. The gauge is confined below it:
 *  measured against the whole tile, National and Labour at ~30% filled to within
 *  24px of the top and their surface line cut straight across the party name. */
const HEADER_H = 74
const GAUGE_H = TILE_H - HEADER_H
/** Fill scale: this share fills the gauge. Set above the leading party so the
 *  biggest tile reads as nearly-full rather than clipped, while keeping every
 *  tile on ONE scale — the exact number is always printed alongside. */
const FULL_AT = 35
const THRESHOLD = 5

const fillPx = (pct: number) => Math.max(2, Math.round((Math.min(pct, FULL_AT) / FULL_AT) * GAUGE_H))
const threshPx = Math.round((THRESHOLD / FULL_AT) * GAUGE_H)

/** Fade a party's contrast colour. Needed because that colour is per-party
 *  (near-black on ACT's yellow, white on National's blue), so secondary text and
 *  hairlines can't be a fixed rgba(255,255,255,…) or they vanish on light tiles. */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function PartiesContesting({ pop }: { pop: { slug: PartySlug; pct: number }[] }) {
  const pctBySlug = new Map(pop.map((p) => [p.slug, p.pct]))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {[
        { label: 'In Parliament', parties: PARLIAMENTARY_PARTIES },
        { label: 'Also registered to contest', parties: NON_PARLIAMENTARY_CONTESTING },
      ].map((grp) => (
        <div key={grp.label}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: WARM, fontFamily: MANROPE }}>{grp.label}</span>
            <span style={{ flex: 1, height: 1, background: LINE }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 210px), 1fr))', gap: 12 }}>
            {grp.parties.map((slug) => (
              <Tile key={slug} slug={slug} pct={pctBySlug.get(slug) ?? null} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Tile({ slug, pct }: { slug: PartySlug; pct: number | null }) {
  const colour = PARTY_COLORS[slug].bg
  const names = PARTY_NAMES[slug]
  const seats = CURRENT_SEATS[slug]
  const reading = MINOR_PARTY_READINGS[slug]
  const polled = pct !== null
  const h = polled ? fillPx(pct) : 0
  const belowThreshold = polled && pct < THRESHOLD

  // Text sits ON the party colour now, so it can't be a fixed white: ACT's
  // yellow and TOP's cyan are light enough that white is unreadable. Each party
  // already carries its own contrast colour in PARTY_COLORS.text.
  const onColour = PARTY_COLORS[slug].text
  const soft = (a: number) => hexToRgba(onColour, a)

  return (
    <Link href={`/parties/${slug}`} className="party-card" style={{
      position: 'relative', display: 'block', height: TILE_H, borderRadius: 15, overflow: 'hidden',
      // Solid party colour, like the battleground cards — the tile reads as the
      // party at a glance rather than as a mostly-white card with a coloured edge.
      textDecoration: 'none', background: colour, border: `2px solid ${colour}`,
      boxShadow: '0 2px 6px rgba(42,18,6,.12)',
    }}>
      {/* The poll level survives the solid fill as a darker band from the bottom,
          so the "filling up" read still works without a second hue. */}
      {polled && (
        <>
          <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: h, background: soft(0.20) }} />
          <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: h, height: 2, background: soft(0.45) }} />
        </>
      )}

      {/* Unpolled: a faint hatch in the party's own contrast colour, so the tile
          still reads as "no measurement" rather than as an empty glass. */}
      {!polled && (
        <span aria-hidden style={{
          position: 'absolute', inset: 0,
          backgroundImage: `repeating-linear-gradient(135deg, ${soft(0.10)} 0 6px, transparent 6px 12px)`,
        }} />
      )}

      {/* 5% threshold — same height on every tile, drawn in the tile's own
          contrast colour so it stays visible on light and dark parties alike. */}
      {polled && (
        <>
          <span aria-hidden style={{
            position: 'absolute', left: 0, right: 0, bottom: threshPx,
            borderTop: `1.5px dashed ${soft(0.5)}`,
          }} />
          <span aria-hidden style={{
            position: 'absolute', right: 7, bottom: threshPx + 3, fontSize: 9, fontWeight: 800,
            letterSpacing: '.03em', fontFamily: MANROPE, color: soft(0.7),
          }}>5%</span>
        </>
      )}

      <span style={{ position: 'relative', zIndex: 1, height: '100%', padding: '13px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Seats chip laid out beside the names rather than positioned over
            them — same fix as the /parties tile. The old absolute chip plus a
            paddingRight on the short name left the full name, which has no such
            padding, running under the chip on the longer party names. */}
        <span style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ display: 'block', minWidth: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: onColour, fontFamily: MANROPE, lineHeight: 1.15, display: 'block' }}>{names.short}</span>
            <span style={{ display: 'block', fontSize: 10.5, color: soft(0.72), fontFamily: MANROPE, marginTop: 2, lineHeight: 1.3 }}>{names.full}</span>
          </span>
          {seats > 0 && (
            <span style={{
              flexShrink: 0, whiteSpace: 'nowrap', fontSize: 10, fontWeight: 800, color: onColour,
              background: soft(0.14), border: `1px solid ${soft(0.28)}`, borderRadius: 99, padding: '2px 7px', fontFamily: MANROPE,
            }}>{seats} {seats === 1 ? 'seat' : 'seats'}</span>
          )}
        </span>

        {polled ? (
          <span style={{ display: 'block' }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: onColour, fontFamily: MANROPE, letterSpacing: '-.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {pct.toFixed(1)}<span style={{ fontSize: 15 }}>%</span>
            </span>
            <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: soft(belowThreshold ? 0.95 : 0.75), fontFamily: MANROPE, marginTop: 3 }}>
              {belowThreshold
                ? (seats > 0 ? 'below 5% — in via electorates' : 'below the 5% threshold')
                : 'poll of polls'}
            </span>
          </span>
        ) : reading ? (
          <span style={{ display: 'block', fontSize: 11, color: soft(0.78), fontFamily: MANROPE, lineHeight: 1.45 }}>
            Last measured <b style={{ color: onColour, fontSize: 13 }}>{reading.pct}%</b><br />
            {reading.pollster}, {fmtDate(reading.date)}
          </span>
        ) : (
          <span style={{ display: 'block', fontSize: 11, color: soft(0.78), fontFamily: MANROPE, lineHeight: 1.45 }}>
            Not broken out in published polls — counted in pollsters&rsquo; &ldquo;Others&rdquo;
          </span>
        )}
      </span>
    </Link>
  )
}
