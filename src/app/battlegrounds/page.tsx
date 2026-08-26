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
import { BORDER, INK, JADE, MANROPE, SECONDARY, SURFACE, WOVEN_PAGE } from '@/constants/theme'

export const metadata: Metadata = {
  title: 'Battlegrounds: Seats to Watch',
  description:
    'New Zealand’s most marginal electorates: the closest 2023 contests, and the seats most likely to change hands in 2026.',
}

export default function BattlegroundsHub() {
  const all = getBattlegrounds()
  const counts = MARGIN_TIERS.map((t) => ({ t, n: all.filter((b) => b.tier.key === t.key).length }))

  return (
    <div style={WOVEN_PAGE}>
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '46px clamp(18px, 5vw, 36px) 38px' }}>
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <SectionDivider type="official" label="Election Battlegrounds" />
            <Link href="/elections/2026" style={{ fontSize: 12, fontWeight: 700, color: JADE, textDecoration: 'none', fontFamily: MANROPE }}>2026 election →</Link>
          </div>
          {/* The icon, heading and intro all scale with the viewport. At a fixed
              54px / 38px / 17px this hero filled a phone screen on its own —
              heading over two lines above a nine-line paragraph — and pushed the
              roll switcher and the map below the fold. */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(11px, 3vw, 16px)' }}>
            <div style={{ width: 'clamp(40px, 11vw, 54px)', height: 'clamp(40px, 11vw, 54px)', borderRadius: 15, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Swords style={{ width: 'clamp(20px, 5.5vw, 27px)', height: 'clamp(20px, 5.5vw, 27px)', color: '#dc2626' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 'clamp(26px, 7vw, 38px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 8px', lineHeight: 1.05 }}>Seats to watch</h1>
              {/* Trimmed from 40 words to 27 — same three points (every seat has
                  a page, the close ones are the ones to watch, colour = margin),
                  without the aside that was costing four lines on a phone. */}
              <p style={{ fontSize: 'clamp(14.5px, 3.9vw, 17px)', fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, maxWidth: 640, lineHeight: 1.55, margin: 0 }}>
                Every electorate has its own battle page, with the defender, the record and the contest. The closest 2023 races are the
                likeliest to change hands in 2026; hotter colours mean tighter races.
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
        <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 16px' }}>Closest races first. Filter to a tier, or browse them all.</p>
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
