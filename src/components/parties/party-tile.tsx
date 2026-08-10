/**
 * PartyTile — the /parties directory tile, in the same format as the Election
 * Centre's contesting tiles: solid party colour, text in that party's own
 * contrast colour, and a level that fills from the bottom.
 *
 * The gauge here measures SEATS, not poll share — this page is about the 54th
 * Parliament as it stands, and mixing in a polling number would be a different
 * claim on a page whose header sources everything to the 2023 official results.
 *
 * Parties with no seats carry no fill. An empty gauge would read as "measured at
 * zero support"; the hatch reads as "not in this Parliament", which is what's
 * actually true — several of them poll above nothing and are contesting 2026.
 */

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { PARTY_COLORS, PARTY_NAMES, CURRENT_SEATS, TOTAL_SEATS } from '@/constants/parties'
import { PARTY_PROFILES } from '@/constants/parties-data'
import type { PartySlug } from '@/types'

const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const WARM = '#5b3d2a', LINE = '#e9e4db'

const TILE_H = 196
/** Top band reserved for the party name, its full name (two lines on the longer
 *  ones) and the seats chip, so the rising fill can never cut through them. */
const HEADER_H = 88
const GAUGE_H = TILE_H - HEADER_H
/** Seats that fill the gauge. Set just above the largest party so its tile reads
 *  as nearly-full rather than clipped, with every tile on one scale. */
const FULL_AT = 50

const fillPx = (seats: number) => Math.max(2, Math.round((Math.min(seats, FULL_AT) / FULL_AT) * GAUGE_H))

/** Fade a party's contrast colour — that colour is per-party (near-black on
 *  ACT's yellow, white on National's blue), so secondary text can't be a fixed
 *  rgba(255,255,255,…) or it disappears on the light tiles. */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/** Flex-wrap rather than a grid: the groups here are small (three governing,
 *  three in opposition), and an auto-fill grid left a dead track hanging off the
 *  end of every row of three. Flex lets the row close up while maxWidth keeps a
 *  three-tile row from stretching into letterboxes. */
export function PartyTileGrid({ slugs }: { slugs: PartySlug[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {slugs.map((slug) => (
        <div key={slug} style={{ flex: '1 1 236px', maxWidth: 340, minWidth: 0 }}>
          <PartyTile slug={slug} />
        </div>
      ))}
    </div>
  )
}

export function PartyTile({ slug }: { slug: PartySlug }) {
  const colour = PARTY_COLORS[slug].bg
  const onColour = PARTY_COLORS[slug].text
  const soft = (a: number) => hexToRgba(onColour, a)
  const names = PARTY_NAMES[slug]
  const profile = PARTY_PROFILES[slug]
  const seats = CURRENT_SEATS[slug] ?? 0
  const h = seats > 0 ? fillPx(seats) : 0
  const share = ((seats / TOTAL_SEATS) * 100).toFixed(1)

  return (
    <Link href={`/parties/${slug}`} className="party-card" style={{
      position: 'relative', display: 'block', height: TILE_H, borderRadius: 15, overflow: 'hidden',
      textDecoration: 'none', background: colour, border: `2px solid ${colour}`,
      boxShadow: '0 2px 6px rgba(42,18,6,.12)',
    }}>
      {/* The seat level survives the solid fill as a darker band from the bottom,
          so the "filling up" read works without a second hue. */}
      {seats > 0 && (
        <>
          <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: h, background: soft(0.20) }} />
          <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: h, height: 2, background: soft(0.45) }} />
        </>
      )}
      {seats === 0 && (
        <span aria-hidden style={{
          position: 'absolute', inset: 0,
          backgroundImage: `repeating-linear-gradient(135deg, ${soft(0.10)} 0 6px, transparent 6px 12px)`,
        }} />
      )}

      {seats > 0 && (
        <span style={{
          position: 'absolute', top: 12, right: 13, zIndex: 2, fontSize: 10, fontWeight: 800, color: onColour,
          background: soft(0.14), border: `1px solid ${soft(0.28)}`, borderRadius: 99, padding: '2px 7px', fontFamily: MANROPE,
        }}>{share}% of the House</span>
      )}

      {/* Identity all sits in the protected header band. The leader line in
          particular has to live up here: at 11 seats the fill surface lands
          ~24px off the floor, which cut straight through it at the bottom. Only
          the seat number sits below, where a line crossing behind 34px bold type
          reads as layering rather than damage. */}
      <span style={{ position: 'relative', zIndex: 1, height: '100%', padding: '13px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <span style={{ display: 'block' }}>
          <span style={{ display: 'block', fontSize: 16, fontWeight: 800, color: onColour, fontFamily: MANROPE, lineHeight: 1.15, paddingRight: seats > 0 ? 96 : 0 }}>{names.short}</span>
          <span style={{ display: 'block', fontSize: 10.5, color: soft(0.72), fontFamily: MANROPE, marginTop: 2, lineHeight: 1.3 }}>{names.full}</span>
          {profile?.leader && (
            <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: soft(0.9), fontFamily: MANROPE, marginTop: 8, lineHeight: 1.3 }}>
              {profile.coLeader ? `${profile.leader} & ${profile.coLeader}` : profile.leader}
            </span>
          )}
        </span>

        <span style={{ display: 'block' }}>
          {seats > 0 ? (
            // Solid party colour behind the readout so the level line breaks
            // around it instead of slicing through the word: at 8–15 seats the
            // surface lands exactly in this band.
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, background: colour, borderRadius: 9, padding: '2px 9px 3px', marginLeft: -9 }}>
              <span style={{ fontSize: 34, fontWeight: 800, color: onColour, fontFamily: MANROPE, letterSpacing: '-.02em', lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>
                {seats}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: soft(0.8), fontFamily: MANROPE }}>
                {seats === 1 ? 'seat' : 'seats'}
              </span>
            </span>
          ) : (
            <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: soft(0.85), fontFamily: MANROPE, lineHeight: 1.4 }}>
              Contesting 2026 — no seats in this Parliament
            </span>
          )}
        </span>
      </span>
    </Link>
  )
}

/** Group heading — the same rule/label pair the Election Centre uses above its
 *  tile grids, so the two pages read as one system. */
export function TileGroupHeading({ label, count }: { label: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: WARM, fontFamily: MANROPE }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#9a9186', fontFamily: MANROPE }}>{count}</span>
      <span style={{ flex: 1, height: 1, background: LINE }} />
    </div>
  )
}

/** Unprofiled registered parties have no colour, leader or seat data — a tile
 *  would be an empty shell. They keep a compact row instead, in the same grid. */
export function PlainPartyTile({ name, focus, site }: { name: string; focus: string[]; site: string }) {
  return (
    <div style={{
      height: TILE_H, borderRadius: 15, background: '#fff', border: `2px solid ${LINE}`,
      padding: '13px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      boxShadow: '0 2px 6px rgba(42,18,6,.06)',
    }}>
      <span style={{ display: 'block' }}>
        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 800, color: '#2A1206', fontFamily: MANROPE, lineHeight: 1.25 }}>{name}</span>
        <span style={{ display: 'block', fontSize: 10.5, color: '#9a9186', fontFamily: MANROPE, marginTop: 3 }}>Registered party · no current seats</span>
      </span>
      <span style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {focus.map((f) => (
          <span key={f} style={{ fontSize: 10, fontWeight: 600, background: '#f4f2ec', color: '#6b6157', borderRadius: 999, padding: '2px 8px', fontFamily: MANROPE }}>{f}</span>
        ))}
      </span>
      <a href={site} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#1F8A4C', fontFamily: MANROPE, textDecoration: 'none' }}>
        Official website <ArrowUpRight style={{ width: 12, height: 12 }} />
      </a>
    </div>
  )
}
