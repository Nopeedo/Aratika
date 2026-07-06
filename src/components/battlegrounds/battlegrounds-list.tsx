'use client'

/**
 * BattlegroundsList — every electorate, filterable by margin tier. Defaults to
 * "all" so safe seats are just as browsable as the closest races, not hidden
 * behind a marginal-only filter — every electorate already has a full battle
 * page, this just makes them all discoverable from the hub.
 */

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import type { BattlegroundEntry, MarginTier } from '@/lib/battlegrounds'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {shown.map((b) => (
          <Link key={b.slug} href={`/battlegrounds/${b.slug}`} style={{ textDecoration: 'none' }}>
            <div className="policy-card" style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 18px', height: '100%', boxShadow: '0 2px 4px rgba(12,14,18,.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{b.info.name}</span>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: '#fff', background: b.tier.color, borderRadius: 999, padding: '3px 9px', fontFamily: MANROPE }}>{b.tier.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: SECONDARY, fontFamily: MANROPE }}>
                {b.info.party && <span style={{ width: 10, height: 10, borderRadius: '50%', background: PARTY_COLORS[b.info.party].bg }} />}
                <span>{b.info.mpName}{b.info.party ? ` · ${PARTY_NAMES[b.info.party].short}` : ''}</span>
                {b.info.type === 'maori' && <span style={{ fontSize: 10, fontWeight: 800, color: '#7c3aed', background: '#f3e8ff', borderRadius: 999, padding: '1px 7px' }}>Māori</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE }}>
                  {b.info.majority != null ? <>2023 majority <b style={{ color: INK }}>{b.info.majority.toLocaleString('en-NZ')}</b></> : 'Result pending'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 800, color: '#1F8A4C', fontFamily: MANROPE }}>Battle <ArrowRight style={{ width: 13, height: 13 }} /></span>
              </div>
            </div>
          </Link>
        ))}
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
