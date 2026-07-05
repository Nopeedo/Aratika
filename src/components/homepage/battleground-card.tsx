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

const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

function isLightHex(hex: string): boolean {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6
}

function mpSlugForName(name?: string): string | null {
  if (!name) return null
  const entry = Object.values(MP_PROFILES).find((mp) => mp.name === name)
  return entry ? entry.slug : null
}

export function BattlegroundCard({ b, rank }: { b: BattlegroundEntry; rank: number }) {
  const party = b.info.party as PartySlug | null
  const color = party ? PARTY_COLORS[party].bg : '#6B7280'
  const light = isLightHex(color)
  const txt = light ? '#1c1605' : '#fff'
  const sub = light ? 'rgba(28,22,5,.7)' : 'rgba(255,255,255,.8)'
  const chipBg = light ? 'rgba(28,22,5,.12)' : 'rgba(255,255,255,.18)'
  const rowBg = light ? 'rgba(28,22,5,.08)' : 'rgba(255,255,255,.12)'

  const slug = b.info.mpSlug || mpSlugForName(b.info.mpName)
  const photo = slug ? MP_PROFILES[slug]?.photo : undefined

  return (
    <Link href={`/battlegrounds/${b.slug}`} style={{ textDecoration: 'none' }}>
      <div style={{ borderRadius: 16, overflow: 'hidden', background: color, color: txt, height: '100%' }}>
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
