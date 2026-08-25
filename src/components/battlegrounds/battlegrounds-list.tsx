'use client'

/**
 * BattlegroundsList — every electorate, filterable by margin tier. Defaults to
 * "all" so safe seats are just as browsable as the closest races, not hidden
 * behind a marginal-only filter — every electorate already has a full battle
 * page, this just makes them all discoverable from the hub.
 */

import { useState } from 'react'
import Link from 'next/link'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import { MP_PROFILES } from '@/constants/mps-data'
import { toSlug } from '@/lib/utils/format'
import type { BattlegroundEntry, MarginTier } from '@/lib/battlegrounds'
import { BORDER, INK, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

export function BattlegroundsList({ all, tiers }: { all: BattlegroundEntry[]; tiers: MarginTier[] }) {
  const [filter, setFilter] = useState<string>('all')
  const shown = filter === 'all' ? all : all.filter((b) => b.tier.key === filter)

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
        <Chip label={`All electorates (${all.length})`} active={filter === 'all'} onClick={() => setFilter('all')} />
        {tiers.map((t) => {
          const n = all.filter((b) => b.tier.key === t.key).length
          if (n === 0) return null
          return <Chip key={t.key} label={`${t.label} (${n})`} dot={t.color} active={filter === t.key} onClick={() => setFilter(t.key)} />
        })}
      </div>

      {/* Two to a row on a phone. The track was minmax(min(300px, 100%), 1fr):
          two 300s plus the 14px gap need 614px and the grid gets 324 on a 360px
          screen, so every one of the 72 cards took a full row at 144px and the
          list ran 10,380px — 79% of a 13,188px page. 150px, checked against the
          324 measured: two plus the 10px gap need 310. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(150px, 100%), 1fr))', gap: 10 }}>
        {shown.map((b) => {
          // Washed in the sitting MP's party colour with a border to match, the
          // same treatment as the party tiles and the MP directory. Seats with
          // no sitting member fall back to the plain card.
          /**
           * The dot is the SITTING member's party, not the one that won the
           * seat in 2023 — the same distinction the battle page draws. Two MPs
           * have changed affiliation this term, and a card that pairs their
           * name with their old party's colour states something false about a
           * named person. The card's number is still the 2023 majority, which
           * is what it says it is.
           */
          const mp = b.info.mpSlug ? MP_PROFILES[b.info.mpSlug] : (b.info.mpName ? MP_PROFILES[toSlug(b.info.mpName)] : undefined)
          const sitting = mp?.party ?? b.info.party ?? null
          const col = sitting ? PARTY_COLORS[sitting] : null
          return (
          <Link key={b.slug} href={`/battlegrounds/${b.slug}`} style={{ textDecoration: 'none' }}>
            <div className="policy-card" style={{ background: col ? col.light : '#fff', border: `2px solid ${col ? col.bg : BORDER}`, borderRadius: 13, padding: '11px 12px', height: '100%', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.2 }}>{b.info.name}</span>

              {/* MP and party on one line. The name truncates rather than wraps:
                  at this width a second line costs every card in the row. */}
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                {/* The party name doesn't fit beside the MP's at 150px, so the
                    dot carries it — which would leave party encoded in colour
                    alone. Named here so it survives a screen reader and a
                    colour-blind reader both. */}
                {sitting && (
                  <span
                    role="img"
                    aria-label={PARTY_NAMES[sitting].short}
                    title={PARTY_NAMES[sitting].short}
                    style={{ width: 8, height: 8, borderRadius: '50%', background: PARTY_COLORS[sitting].bg, flexShrink: 0 }}
                  />
                )}
                <span style={{ fontSize: 11.5, color: SECONDARY, fontFamily: MANROPE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.info.mpName}</span>
              </span>

              {/* Tier and margin share the last line. The tier badge keeps its
                  white ring: it is what the page is sorted by, and without it a
                  red badge on a red card inside a red border disappears. */}
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto', paddingTop: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 9.5, fontWeight: 800, color: '#fff', background: b.tier.color, borderRadius: 999, padding: '2px 7px', fontFamily: MANROPE, whiteSpace: 'nowrap', boxShadow: '0 0 0 2px rgba(255,255,255,.95)' }}>{b.tier.label}</span>
                <span style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE, whiteSpace: 'nowrap' }}>
                  {b.info.majority != null ? <b style={{ color: INK }}>{b.info.majority.toLocaleString('en-NZ')}</b> : 'pending'}
                </span>
                {/* Down here rather than beside the MP's name, where it was
                    taking enough width to truncate "Mariameno Kapa-Kingi" to
                    "Mariamen…". Nothing shares this line but the tier. */}
                {b.info.type === 'maori' && <span style={{ fontSize: 9, fontWeight: 800, color: '#7c3aed', background: '#f3e8ff', borderRadius: 999, padding: '1px 6px', fontFamily: MANROPE }}>Māori</span>}
              </span>
            </div>
          </Link>
          )
        })}
      </div>
    </div>
  )
}

function Chip({ label, active, onClick, dot }: { label: string; active: boolean; onClick: () => void; dot?: string }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, fontFamily: MANROPE, padding: '6px 12px', borderRadius: 999, cursor: 'pointer', color: active ? '#fff' : INK, background: active ? INK : '#fff', border: `1px solid ${active ? INK : BORDER}` }}>
      {dot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, display: 'inline-block' }} />}
      {label}
    </button>
  )
}
