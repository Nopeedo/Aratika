/**
 * /battlegrounds — the seats to watch. A marginality-coloured electorate map
 * plus a ranked list of the closest 2023 contests, each linking to its battle page.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Swords, Info } from 'lucide-react'
import { getBattlegrounds, MARGIN_TIERS } from '@/lib/battlegrounds'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import { SectionDivider } from '@/components/ui/section-divider'
import { BattlegroundsMap } from '@/components/battlegrounds/battlegrounds-map'

export const metadata: Metadata = {
  title: 'Battlegrounds — Seats to Watch',
  description:
    'New Zealand’s most marginal electorates — the closest 2023 contests and the seats most likely to change hands in 2026.',
}

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export default function BattlegroundsHub() {
  const all = getBattlegrounds()
  const watch = all.filter((b) => b.tier.key === 'ultra' || b.tier.key === 'marginal')
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
                Where will 2026 be won and lost? These are the closest contests from 2023 — the electorates most likely to
                change hands. Hotter colours mean tighter races.
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

        {/* Seats to watch list */}
        <h2 style={{ fontSize: 20, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>The closest contests</h2>
        <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 16px' }}>Ultra-marginal and marginal seats, by 2023 winning margin.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {watch.map((b, i) => (
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
                  <span style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE }}>2023 majority <b style={{ color: INK }}>{b.info.majority?.toLocaleString('en-NZ')}</b></span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 800, color: JADE, fontFamily: MANROPE }}>Battle <ArrowRight style={{ width: 13, height: 13 }} /></span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 22, padding: '13px 15px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
          <Info style={{ width: 16, height: 16, color: SECONDARY, flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
            Marginality is based on the official 2023 winning margins (Electoral Commission). Tap any seat on the map for its battle page.
            2026 candidates appear on each battle page as parties confirm them during the campaign.
          </p>
        </div>
      </div>
    </div>
  )
}
