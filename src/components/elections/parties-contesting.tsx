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
import { MANROPE, INK, SECONDARY, TERTIARY, BORDER } from '@/constants/theme'

const WARM = '#5b3d2a', LINE = '#e9e4db'

/**
 * Two tiles to a row, and a tile short enough that seventeen of them are not
 * four screens of scrolling.
 *
 * The grid ASKED for two columns already and never got them: at
 * minmax(min(100%, 210px), 1fr) a second column needs 210 + 210 + the 12px gap
 * = 432px, so auto-fill dropped to one column and each tile stretched to the
 * full width — 17 tiles x 172px, in a layout that reads as deliberate.
 *
 * The track is sized against the NARROWEST common phone, not a convenient one.
 * A first attempt at 158px was checked at 375 (iPhone) and shipped: at 360,
 * which is what most Android phones report and by far the most common width in
 * the world, the grid is 324px and two 158s plus the gap need 328. Four pixels,
 * and every one of those phones got a single column. Measuring one width and
 * generalising is how this bug keeps coming back. 146 + 146 + the 10px gap =
 * 302 against 324, so there is 22px of room rather than a rounding error.
 *
 * The tile lost 24px of height, and the header gave up 8 of them so the gauge
 * only gives up 16. The gauge is the point of this component — every party on
 * one scale with the 5% line at a common height — so shrinking it is the last
 * resort, not the first.
 */
/**
 * Tile geometry lives in CSS variables so the phone and the desktop can be
 * sized independently, and the gauge is a PERCENTAGE of whatever height is left
 * below the header rather than a pixel count.
 *
 * The px version could only ever describe one tile size: fillPx() closed over a
 * single GAUGE_H, so making the desktop tile taller silently mis-drew every
 * level on it. Expressed as a share of the gauge zone, one formula is correct
 * at both breakpoints and there is nothing to keep in step.
 *
 * The scale is unchanged: FULL_AT fills the zone, the 5% line sits at the same
 * fraction of it on every tile, and the exact number is always printed.
 */
const FULL_AT = 35
const THRESHOLD = 5

/** Share of the gauge zone a party's poll number fills, 0-100. */
const fillPct = (pct: number) => Math.max(1.5, (Math.min(pct, FULL_AT) / FULL_AT) * 100)
/** Where the 5% line sits in that zone — identical on every tile. */
const THRESH_PCT = (THRESHOLD / FULL_AT) * 100

/** Fade a party's own colour to a tint. The gauge is drawn in the party's colour
 *  at low alpha over paper, so one helper covers every party without needing a
 *  per-party contrast colour for text any more. */
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
      {/*
        Two sizes, one layout. The phone numbers below 700px are the ones that
        made seventeen tiles readable on a 360px screen; above it everything
        returns to the dimensions it had before that work, because a 146px track
        on a 1280px screen produced five thin columns where there had been four
        comfortable ones, and the tiles read as squashed rather than dense.

        What does NOT change at the breakpoint is the arrangement: the stats sit
        in the header band at both sizes. That was not a mobile compromise — it
        fixed the fill's surface line being drawn through the caption for any
        party around 5-14%, which was as wrong on a desktop as on a phone.
      */}
      <style>{`
        .pc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 146px), 1fr)); gap: 10px; }
        .pc-tile { --pc-header: 76px; height: 164px; border-radius: 13px; }
        .pc-name { font-size: 14.5px; }
        .pc-full { font-size: 10.5px; }
        .pc-pct  { font-size: 24px; }
        .pc-sym  { font-size: 13px; }
        .pc-cap  { font-size: 9.5px; }
        .pc-chip { font-size: 10px; padding: 2px 7px; }
        /* Hidden only where the short name IS the name people know, and only on
           a phone: at 146px "New Zealand National Party" clamped to "New
           Zealand…", the same meaningless string on three tiles. There is room
           for it at 210px, so the desktop keeps it. */
        .pc-full-compact { display: none; }

        @media (min-width: 700px) {
          .pc-grid { grid-template-columns: repeat(auto-fill, minmax(min(100%, 210px), 1fr)); gap: 12px; }
          .pc-tile { --pc-header: 92px; height: 186px; border-radius: 15px; }
          .pc-name { font-size: 15px; }
          .pc-full { font-size: 10.5px; }
          .pc-pct  { font-size: 30px; }
          .pc-sym  { font-size: 15px; }
          .pc-cap  { font-size: 10px; }
          .pc-chip { font-size: 10.5px; padding: 3px 9px; }
          .pc-full-compact { display: -webkit-box; }
        }
      `}</style>
      {[
        // The full name is shown where the short one isn't the name people
        // know. "National", "Labour" and "Green" identify themselves; "ALCP",
        // "TOP" and "Vision NZ" don't, and at a 163px track the big parties'
        // full names truncated to "New Zealand…" — the same meaningless string
        // on three different tiles. The extra identification goes to the group
        // with less name recognition, which is the right way round.
        { label: 'In Parliament', parties: PARLIAMENTARY_PARTIES, showFullName: false },
        { label: 'Also registered to contest', parties: NON_PARLIAMENTARY_CONTESTING, showFullName: true },
      ].map((grp) => (
        <div key={grp.label}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: WARM, fontFamily: MANROPE }}>{grp.label}</span>
            <span style={{ flex: 1, height: 1, background: LINE }} />
          </div>
          <div className="pc-grid">
            {grp.parties.map((slug) => (
              <Tile key={slug} slug={slug} pct={pctBySlug.get(slug) ?? null} showFullName={grp.showFullName} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Tile({ slug, pct, showFullName }: { slug: PartySlug; pct: number | null; showFullName: boolean }) {
  const colour = PARTY_COLORS[slug].bg
  const names = PARTY_NAMES[slug]
  const seats = CURRENT_SEATS[slug]
  const reading = MINOR_PARTY_READINGS[slug]
  const polled = pct !== null
  const belowThreshold = polled && pct < THRESHOLD

  // The tile used to be a solid slab of party colour. Thirteen of those stacked
  // read as a patchwork quilt and buried the warm paper ground the rest of the
  // site is built on — and with five parties sharing a near-identical green,
  // large fills stopped identifying anyone. So the card is paper now and the
  // party colour is used only where it carries meaning: the gauge, which is
  // proportional to the actual poll number, and a full-height edge so an
  // unpolled party is still identifiable at a glance.
  const tint = (a: number) => hexToRgba(colour, a)

  return (
    <Link href={`/parties/${slug}`} className="party-card pc-tile" style={{
      position: 'relative', display: 'block', overflow: 'hidden',
      textDecoration: 'none', background: '#fff', border: `1px solid ${BORDER}`,
      boxShadow: '0 2px 6px rgba(42,18,6,.06)',
    }}>
      {/* Identity, independent of the gauge: a party that isn't polled has no
          fill at all, and without this its tile would be anonymous. */}
      <span aria-hidden style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: colour }} />

      {/* The gauge — party colour, but as a tint over paper rather than a slab,
          capped by a solid line at the surface so the level stays crisp. */}
      {polled && (
        // The zone the gauge may use: everything below the header band. Fills
        // are a percentage of THIS, so the same number draws correctly on a
        // 164px tile and a 186px one.
        <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: 'var(--pc-header)', bottom: 0 }}>
          <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${fillPct(pct)}%`, background: tint(0.16) }} />
          <span style={{ position: 'absolute', left: 0, right: 0, bottom: `${fillPct(pct)}%`, height: 3, background: colour, transform: 'translateY(50%)' }} />
        </span>
      )}

      {/* Unpolled: a faint hatch, so the tile reads as "no measurement" rather
          than as an empty glass. */}
      {!polled && (
        <span aria-hidden style={{
          position: 'absolute', inset: 0,
          backgroundImage: `repeating-linear-gradient(135deg, ${tint(0.09)} 0 6px, transparent 6px 12px)`,
        }} />
      )}

      {/* 5% threshold — same height on every tile. Drawn in the site's own ink
          rather than the party's colour: it is a fact about the electoral system,
          identical on all thirteen tiles, and colouring it per party implied it
          was something about that party. */}
      {polled && (
        <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: 'var(--pc-header)', bottom: 0 }}>
          <span style={{
            position: 'absolute', left: 0, right: 0, bottom: `${THRESH_PCT}%`,
            borderTop: `1.5px dashed ${hexToRgba(INK, 0.28)}`,
          }} />
          <span style={{
            position: 'absolute', right: 7, bottom: `calc(${THRESH_PCT}% + 3px)`, fontSize: 9, fontWeight: 800,
            letterSpacing: '.03em', fontFamily: MANROPE, color: TERTIARY,
          }}>5%</span>
        </span>
      )}

      {/* Everything lives in the top band; the lower part of the tile is gauge
          and nothing else. The stats used to sit at the BOTTOM, which is where
          the fill rises from — so for any party whose share put the surface
          line at that height (roughly 5-14% on this scale: Green, NZ First,
          ACT, TOP) a 3px rule was drawn straight through the caption, and then
          through the number when the caption was moved above it. Reordering
          could never fix that. Text and gauge had to stop sharing space. */}
      <span style={{ position: 'relative', zIndex: 1, padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {/* Seats chip laid out beside the names rather than positioned over
            them — same fix as the /parties tile. The old absolute chip plus a
            paddingRight on the short name left the full name, which has no such
            padding, running under the chip on the longer party names. */}
        <span style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ display: 'block', minWidth: 0 }}>
            <span className="pc-name" style={{ fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.15, display: 'block' }}>{names.short}</span>
            {/* Clamped: at a 163px track "Aotearoa Legalise Cannabis Party"
                runs to three lines and pushes the header into the gauge. */}
            {/* Always rendered now; the phone hides it for the parties whose
                short name is the name people know. Rendering it conditionally
                meant the desktop could not have it back without a second prop
                threaded through for a difference that is purely presentational. */}
            <span
              className={`pc-full${showFullName ? '' : ' pc-full-compact'}`}
              style={{ display: showFullName ? '-webkit-box' : undefined, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: TERTIARY, fontFamily: MANROPE, marginTop: 2, lineHeight: 1.3 }}
            >{names.full}</span>
          </span>
          {seats > 0 && (
            <span style={{
              flexShrink: 0, whiteSpace: 'nowrap', fontWeight: 800, color: INK,
              background: tint(0.14), border: `1px solid ${tint(0.3)}`, borderRadius: 99, padding: '2px 7px', fontFamily: MANROPE,
            }} className="pc-chip">{seats} {seats === 1 ? 'seat' : 'seats'}</span>
          )}
        </span>

        {polled ? (
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
            <span className="pc-pct" style={{ fontWeight: 800, color: INK, fontFamily: MANROPE, letterSpacing: '-.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
              {pct.toFixed(1)}<span className="pc-sym">%</span>
            </span>
            <span className="pc-cap" style={{ minWidth: 0, fontWeight: 700, color: belowThreshold ? INK : SECONDARY, fontFamily: MANROPE, lineHeight: 1.25 }}>
              {belowThreshold
                ? (seats > 0 ? 'in via electorates' : 'below 5%')
                : 'poll of polls'}
            </span>
          </span>
        ) : reading ? (
          <span style={{ display: 'block', fontSize: 11, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.45 }}>
            Last measured <b style={{ color: INK, fontSize: 13 }}>{reading.pct}%</b><br />
            {reading.pollster}, {fmtDate(reading.date)}
          </span>
        ) : (
          <span style={{ display: 'block', fontSize: 11, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.45 }}>
            Not broken out in published polls, and counted in pollsters&rsquo; &ldquo;Others&rdquo;
          </span>
        )}
      </span>
    </Link>
  )
}
