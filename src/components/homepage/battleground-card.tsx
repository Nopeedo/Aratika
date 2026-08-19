/**
 * BattlegroundCard — a closest-2023-race card for the homepage Battlegrounds
 * teaser. Fills with the sitting MP's PARTY COLOUR (dark parties → white text,
 * light parties like ACT → dark text, matching the party-profile convention),
 * with the sitting MP's photo where we have a free-licensed one (falls back to
 * coloured initials), and the verified 2023 majority in bold. No invented
 * percentages or vote splits — only the sourced majority and margin tier.
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import { MP_PROFILES } from '@/constants/mps-data'
import type { BattlegroundEntry } from '@/lib/battlegrounds'
import type { PartySlug } from '@/types'
import { MANROPE, INK, SECONDARY, BORDER } from '@/constants/theme'

export function isLightHex(hex: string): boolean {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6
}

function mpSlugForName(name?: string): string | null {
  if (!name) return null
  const entry = Object.values(MP_PROFILES).find((mp) => mp.name === name)
  return entry ? entry.slug : null
}

/** Party colour faded to a tint, for the chip and the MP row on a paper card. */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

export function BattlegroundCard({ b, rank }: { b: BattlegroundEntry; rank: number }) {
  const party = b.info.party as PartySlug | null
  const color = party ? PARTY_COLORS[party].bg : '#6B7280'
  // Paper card with the sitting MP's party as a top band, not a full-bleed slab.
  // Three of these sit side by side and the closest races are mostly Labour
  // seats, so as solid fills the row read as a wall of red — the party of the
  // incumbent drowning out the thing the card is actually about, which is how
  // close the contest was.
  const txt = INK
  const sub = SECONDARY
  const chipBg = hexToRgba(color, 0.12)
  const rowBg = hexToRgba(color, 0.07)

  const slug = b.info.mpSlug || mpSlugForName(b.info.mpName)
  const photo = slug ? MP_PROFILES[slug]?.photo : undefined

  return (
    <Link href={`/battlegrounds/${b.slug}`} style={{ textDecoration: 'none' }}>
      <div style={{ borderRadius: 16, overflow: 'hidden', background: '#fff', border: `1px solid ${BORDER}`, color: txt, height: '100%', boxShadow: '0 2px 6px rgba(42,18,6,.06)' }}>
        {/* Party of the sitting MP, as a band across the top. */}
        <div aria-hidden style={{ height: 5, background: color }} />
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: sub, fontFamily: MANROPE }}>#{rank} closest race</div>
              <div style={{ fontSize: 17, fontWeight: 700, fontFamily: MANROPE, lineHeight: 1.2 }}>{b.info.name}</div>
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: txt, background: chipBg, borderRadius: 999, padding: '4px 10px', fontFamily: MANROPE, whiteSpace: 'nowrap' }}>
              {b.tier.label}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', background: rowBg, borderRadius: 11 }}>
            <Avatar name={b.info.mpName ?? '?'} party={party ?? undefined} src={photo} size="lg" face />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, fontFamily: MANROPE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.info.mpName ?? 'Unverified'}</div>
              <div style={{ fontSize: 12, color: sub, fontFamily: MANROPE, marginTop: 1 }}>{party ? PARTY_NAMES[party].short : 'Unverified'} · Sitting MP</div>
            </div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: sub, textTransform: 'uppercase', letterSpacing: '.03em', fontFamily: MANROPE, marginBottom: 3 }}>Won by, 2023</div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 20, fontWeight: 800, fontFamily: MANROPE }}>{b.info.majority?.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 700 }}>votes</span></span>
              <ArrowRight style={{ width: 16, height: 16, color: sub, flexShrink: 0 }} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
