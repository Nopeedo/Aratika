/**
 * /battlegrounds — the seats to watch. A marginality-coloured electorate map
 * plus a ranked list of the closest 2023 contests, each linking to its battle page.
 */

import type { Metadata } from 'next'
import { Swords } from 'lucide-react'
import { getBattlegrounds, MARGIN_TIERS } from '@/lib/battlegrounds'
import { SectionDivider } from '@/components/ui/section-divider'
import { BattlegroundsMap } from '@/components/battlegrounds/battlegrounds-map'
import { BattlegroundsList } from '@/components/battlegrounds/battlegrounds-list'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Battlegrounds — Seats to Watch',
  description:
    'New Zealand’s most marginal electorates — the closest 2023 contests and the seats most likely to change hands in 2026.',
}

const INK = '#0c0e12', SECONDARY = '#6b7078'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export default function BattlegroundsHub() {
  const all = getBattlegrounds()
  const counts = MARGIN_TIERS.map((t) => ({ t, n: all.filter((b) => b.tier.key === t.key).length }))

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '46px 36px 38px' }}>
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <SectionDivider type="official" label="Election Battlegrounds" />
            <Link href="/elections/2026" style={{ fontSize: 12, fontWeight: 700, color: JADE, textDecoration: 'none', fontFamily: MANROPE }}>2026 election →</Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ width: 54, height: 54, borderRadius: 15, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Swords style={{ width: 27, height: 27, color: '#dc2626' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 8px', lineHeight: 1.05 }}>Seats to watch</h1>
              <p style={{ fontSize: 17, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, maxWidth: 640, lineHeight: 1.6, margin: 0 }}>
                Every electorate has a battle page — the closest 2023 contests are most likely to change hands in 2026, but
                every seat, safe ones included, has its own defender, record and contest to follow. Hotter colours mean tighter races.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 64px' }}>
        <BattlegroundsMap />

        {/* tier counts */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '22px 0 26px' }}>
          {counts.map(({ t, n }) => (
            <div key={t.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: INK, fontFamily: MANROPE, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '6px 12px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.color }} />{t.label}: {n}
            </div>
          ))}
        </div>

        {/* All electorates, filterable by margin tier */}
        <h2 style={{ fontSize: 20, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>Every seat, ranked by margin</h2>
        <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 16px' }}>Closest races first — filter to a tier, or browse them all.</p>
        <BattlegroundsList all={all} tiers={MARGIN_TIERS} />

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 22, padding: '13px 15px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
          <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
            Marginality is based on the official 2023 winning margins (Electoral Commission). Tap any seat, on the map or in the list, for its battle page.
            2026 candidates appear on each battle page as parties confirm them during the campaign.
          </p>
        </div>
      </div>
    </div>
  )
}
