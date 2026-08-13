/**
 * PartyTile — the /parties directory tile.
 *
 * Matches the homepage party card: a pale wash of the party's colour behind a
 * distinct border in that same colour, with the text in ink rather than the
 * party's contrast colour. The two pages then read as one system, and the copy
 * stays legible without depending on a per-party contrast colour — which was
 * the fragile part of the old solid-fill treatment, since it had to flip
 * between near-black on ACT's yellow and white on National's blue.
 *
 * Deliberately WITHOUT the Election Centre's filling gauge. There the level
 * carries the poll share, which is the whole point of that grid; here the seat
 * count is already stated in words, so a gauge added a second encoding of the
 * same number — and it forced a hatch on the parties holding no seats, which
 * just looked like a texture bug. One number, no second reading.
 */

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { PARTY_COLORS, PARTY_NAMES, CURRENT_SEATS, TOTAL_SEATS } from '@/constants/parties'
import { PARTY_PROFILES } from '@/constants/parties-data'
import { MP_PROFILES } from '@/constants/mps-data'
import { Avatar } from '@/components/ui/avatar'
import type { PartySlug } from '@/types'
import { INK, MANROPE, SECONDARY } from '@/constants/theme'

const WARM = '#5b3d2a', LINE = '#e9e4db'

const TILE_H = 176

/** A leader who holds a seat has an MP photo; one who doesn't may still have a
 *  photo on the party record. Returns undefined when there's neither, which
 *  Avatar renders as initials. */
function photoFor(name: string, fallback?: string): string | undefined {
  const mp = Object.values(MP_PROFILES).find((m) => m.name === name)
  return mp?.photo ?? fallback
}

function LeaderFace({ slug, name, src }: { slug: PartySlug; name: string; src?: string }) {
  return <Avatar name={name} party={src ? slug : undefined} src={src} size="sm" face={!!src} />
}

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
  const light = PARTY_COLORS[slug].light
  const names = PARTY_NAMES[slug]
  const profile = PARTY_PROFILES[slug]
  const seats = CURRENT_SEATS[slug] ?? 0
  const share = ((seats / TOTAL_SEATS) * 100).toFixed(1)
  const leaderSrc = profile?.leader ? photoFor(profile.leader, profile.leaderPhoto) : undefined
  const coLeaderSrc = profile?.coLeader ? photoFor(profile.coLeader) : undefined

  return (
    <Link href={`/parties/${slug}`} className="party-card" style={{
      position: 'relative', display: 'block', height: TILE_H, borderRadius: 15, overflow: 'hidden',
      textDecoration: 'none', background: light, border: `3px solid ${colour}`,
      boxShadow: '0 2px 6px rgba(42,18,6,.08)',
    }}>
      <span style={{ position: 'relative', zIndex: 1, height: '100%', padding: '13px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <span style={{ display: 'block' }}>
          {/* The share chip is laid out beside the names, not positioned over
              them. It used to be absolute with a hand-tuned paddingRight on the
              short name to clear it — which left the FULL name, with no such
              padding, running under the chip. A flex row can't collide at any
              width and needs no magic number. */}
          <span style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ display: 'block', minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.15 }}>{names.short}</span>
              <span style={{ display: 'block', fontSize: 10.5, color: SECONDARY, fontFamily: MANROPE, marginTop: 2, lineHeight: 1.3 }}>{names.full}</span>
            </span>
            {seats > 0 && (
              // Ink on white rather than the party colour: several palettes
              // (ACT's yellow, TOP's cyan) are too light to use as text on a
              // pale ground, so the colour stays in the border where it can't
              // fail contrast.
              <span style={{
                flexShrink: 0, whiteSpace: 'nowrap', fontSize: 10, fontWeight: 800, color: SECONDARY,
                background: '#fff', border: `1px solid ${hexToRgba(colour, 0.32)}`, borderRadius: 99, padding: '2px 7px', fontFamily: MANROPE,
              }}>{share}% of the House</span>
            )}
          </span>
          {/* Faces, not just names — the leader is how most people recognise a
              party. MP photo where they hold a seat, the party's own leaderPhoto
              otherwise; Avatar falls back to initials when neither exists. */}
          {profile?.leader && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9 }}>
              {/* Overlap the discs only when both are real photos. Faces sit in
                  the middle of the frame so a 10px bite is invisible; initials
                  run edge to edge, and the co-leader's disc was eating the
                  first one's second letter. The ring matches the tile ground so
                  it reads as a gap between the discs, not an outline. */}
              <span style={{ display: 'flex', flexShrink: 0 }}>
                <LeaderFace slug={slug} name={profile.leader} src={leaderSrc} />
                {profile.coLeader && (
                  <span style={{ marginLeft: leaderSrc && coLeaderSrc ? -10 : 3, borderRadius: '50%', boxShadow: `0 0 0 2px ${light}` }}>
                    <LeaderFace slug={slug} name={profile.coLeader} src={coLeaderSrc} />
                  </span>
                )}
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.25, minWidth: 0 }}>
                {profile.coLeader ? `${profile.leader} & ${profile.coLeader}` : profile.leader}
              </span>
            </span>
          )}
        </span>

        <span style={{ display: 'block' }}>
          {seats > 0 ? (
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 34, fontWeight: 800, color: INK, fontFamily: MANROPE, letterSpacing: '-.02em', lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>
                {seats}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE }}>
                {seats === 1 ? 'seat' : 'seats'}
              </span>
            </span>
          ) : (
            <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.4 }}>
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
      // 3px to match the profiled tiles it shares a grid with — these parties
      // have no colour of their own, so the border stays neutral.
      height: TILE_H, borderRadius: 15, background: '#fff', border: `3px solid ${LINE}`,
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
