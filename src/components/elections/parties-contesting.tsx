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

const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const ESPRESSO = '#2A1206', WARM = '#5b3d2a', SUB = '#6b6157', LINE = '#e9e4db'

const TILE_H = 172
/** Fill scale: this share fills a whole tile. Set above the leading party so the
 *  biggest tile reads as nearly-full rather than clipped, while keeping every
 *  tile on ONE scale — the exact number is always printed alongside. */
const FULL_AT = 35
const THRESHOLD = 5

const fillPx = (pct: number) => Math.max(2, Math.round((Math.min(pct, FULL_AT) / FULL_AT) * TILE_H))
const threshPx = Math.round((THRESHOLD / FULL_AT) * TILE_H)

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

  return (
    <Link href={`/parties/${slug}`} className="party-card" style={{
      position: 'relative', display: 'block', height: TILE_H, borderRadius: 15, overflow: 'hidden',
      textDecoration: 'none', background: '#fff', border: `1.5px solid rgba(42,18,6,.14)`,
      boxShadow: '0 1px 2px rgba(42,18,6,.05)',
      // Unpolled parties get a light hatch so they read as "no measurement",
      // never as an empty (i.e. zero) glass.
      ...(polled ? {} : { backgroundImage: 'repeating-linear-gradient(135deg, rgba(42,18,6,.035) 0 6px, transparent 6px 12px)' }),
    }}>
      {polled && (
        <>
          <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: h, background: colour, opacity: 0.3 }} />
          <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: h, height: 2, background: colour, opacity: 0.55 }} />
        </>
      )}

      {/* 5% threshold — drawn at the same height on every tile. Lightened where
          the fill sits above it, so it stays visible over a dark party colour. */}
      {polled && (
        <>
          <span aria-hidden style={{
            position: 'absolute', left: 0, right: 0, bottom: threshPx,
            borderTop: `1.5px dashed ${h > threshPx ? 'rgba(255,255,255,.75)' : 'rgba(42,18,6,.34)'}`,
          }} />
          <span aria-hidden style={{
            position: 'absolute', right: 7, bottom: threshPx + 3, fontSize: 9, fontWeight: 800,
            letterSpacing: '.03em', fontFamily: MANROPE,
            color: h > threshPx ? 'rgba(255,255,255,.9)' : 'rgba(42,18,6,.5)',
          }}>5%</span>
        </>
      )}

      {seats > 0 && (
        <span style={{
          position: 'absolute', top: 12, right: 13, zIndex: 2, fontSize: 10, fontWeight: 800, color: SUB,
          background: 'rgba(255,255,255,.85)', border: `1px solid ${LINE}`, borderRadius: 99, padding: '2px 7px', fontFamily: MANROPE,
        }}>{seats} {seats === 1 ? 'seat' : 'seats'}</span>
      )}

      <span style={{ position: 'relative', zIndex: 1, height: '100%', padding: '13px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <span style={{ display: 'block', paddingRight: seats > 0 ? 58 : 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {!polled && <span aria-hidden style={{ width: 9, height: 9, borderRadius: '50%', background: colour, flexShrink: 0 }} />}
            <span style={{ fontSize: 15, fontWeight: 800, color: ESPRESSO, fontFamily: MANROPE, lineHeight: 1.15 }}>{names.short}</span>
          </span>
          <span style={{ display: 'block', fontSize: 10.5, color: SUB, fontFamily: MANROPE, marginTop: 2, lineHeight: 1.3 }}>{names.full}</span>
        </span>

        {polled ? (
          <span style={{ display: 'block' }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: ESPRESSO, fontFamily: MANROPE, letterSpacing: '-.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {pct.toFixed(1)}<span style={{ fontSize: 15 }}>%</span>
            </span>
            <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: belowThreshold ? '#b45309' : SUB, fontFamily: MANROPE, marginTop: 3 }}>
              {belowThreshold
                ? (seats > 0 ? 'below 5% — in via electorates' : 'below the 5% threshold')
                : 'poll of polls'}
            </span>
          </span>
        ) : reading ? (
          <span style={{ display: 'block', fontSize: 11, color: SUB, fontFamily: MANROPE, lineHeight: 1.45 }}>
            Last measured <b style={{ color: ESPRESSO, fontSize: 13 }}>{reading.pct}%</b><br />
            {reading.pollster}, {fmtDate(reading.date)}
          </span>
        ) : (
          <span style={{ display: 'block', fontSize: 11, color: SUB, fontFamily: MANROPE, lineHeight: 1.45 }}>
            Not broken out in published polls — counted in pollsters&rsquo; &ldquo;Others&rdquo;
          </span>
        )}
      </span>
    </Link>
  )
}
