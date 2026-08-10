/**
 * PartyTile — the /parties directory tile: flat, solid party colour with text in
 * that party's own contrast colour.
 *
 * Deliberately WITHOUT the Election Centre's filling gauge. There the level
 * carries the poll share, which is the whole point of that grid; here the seat
 * count is already stated in words, so a gauge added a second encoding of the
 * same number — and it forced a hatch on the parties holding no seats, which
 * just looked like a texture bug. Flat colour, one number, no second reading.
 */

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { PARTY_COLORS, PARTY_NAMES, CURRENT_SEATS, TOTAL_SEATS } from '@/constants/parties'
import { PARTY_PROFILES } from '@/constants/parties-data'
import { MP_PROFILES } from '@/constants/mps-data'
import { Avatar } from '@/components/ui/avatar'
import type { PartySlug } from '@/types'

const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const WARM = '#5b3d2a', LINE = '#e9e4db'

const TILE_H = 176

/** Fade a party's contrast colour — that colour is per-party (near-black on
 *  ACT's yellow, white on National's blue), so secondary text can't be a fixed
 *  rgba(255,255,255,…) or it disappears on the light tiles. */
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
  const onColour = PARTY_COLORS[slug].text
  const soft = (a: number) => hexToRgba(onColour, a)
  const names = PARTY_NAMES[slug]
  const profile = PARTY_PROFILES[slug]
  const seats = CURRENT_SEATS[slug] ?? 0
  const share = ((seats / TOTAL_SEATS) * 100).toFixed(1)
  const leaderSrc = profile?.leader ? photoFor(profile.leader, profile.leaderPhoto) : undefined
  const coLeaderSrc = profile?.coLeader ? photoFor(profile.coLeader) : undefined

  return (
    <Link href={`/parties/${slug}`} className="party-card" style={{
      position: 'relative', display: 'block', height: TILE_H, borderRadius: 15, overflow: 'hidden',
      textDecoration: 'none', background: colour, border: `2px solid ${colour}`,
      boxShadow: '0 2px 6px rgba(42,18,6,.12)',
    }}>
      {seats > 0 && (
        <span style={{
          position: 'absolute', top: 12, right: 13, zIndex: 2, fontSize: 10, fontWeight: 800, color: onColour,
          background: soft(0.14), border: `1px solid ${soft(0.28)}`, borderRadius: 99, padding: '2px 7px', fontFamily: MANROPE,
        }}>{share}% of the House</span>
      )}

      <span style={{ position: 'relative', zIndex: 1, height: '100%', padding: '13px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <span style={{ display: 'block' }}>
          <span style={{ display: 'block', fontSize: 16, fontWeight: 800, color: onColour, fontFamily: MANROPE, lineHeight: 1.15, paddingRight: seats > 0 ? 96 : 0 }}>{names.short}</span>
          <span style={{ display: 'block', fontSize: 10.5, color: soft(0.72), fontFamily: MANROPE, marginTop: 2, lineHeight: 1.3 }}>{names.full}</span>
          {/* Faces, not just names — the leader is how most people recognise a
              party. MP photo where they hold a seat, the party's own leaderPhoto
              otherwise; Avatar falls back to initials when neither exists. */}
          {profile?.leader && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9 }}>
              {/* No `party` prop when there's no photo: Avatar's initials
                  fallback fills the circle with the party colour, which on a
                  tile of that same colour left the letters floating with no
                  disc at all. Unset, it falls back to a neutral grey that
                  reads on every tile. */}
              {/* Overlap the discs only when both are real photos. Faces sit in
                  the middle of the frame so a 10px bite is invisible; initials
                  run edge to edge, and the co-leader's disc was eating the
                  first one's second letter. */}
              <span style={{ display: 'flex', flexShrink: 0 }}>
                <LeaderFace slug={slug} name={profile.leader} src={leaderSrc} />
                {profile.coLeader && (
                  <span style={{ marginLeft: leaderSrc && coLeaderSrc ? -10 : 3, borderRadius: '50%', boxShadow: `0 0 0 2px ${colour}` }}>
                    <LeaderFace slug={slug} name={profile.coLeader} src={coLeaderSrc} />
                  </span>
                )}
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: soft(0.92), fontFamily: MANROPE, lineHeight: 1.25, minWidth: 0 }}>
                {profile.coLeader ? `${profile.leader} & ${profile.coLeader}` : profile.leader}
              </span>
            </span>
          )}
        </span>

        <span style={{ display: 'block' }}>
          {seats > 0 ? (
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
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
