/**
 * BattlegroundsTeaser — homepage highlight for the Battlegrounds feature, placed
 * directly under the Election Centre anchor (it's the most interactive, most
 * "watch this space" piece of the election story, so it earns its own spotlight
 * rather than living only in a nav link). Shows the closest real 2023 contests
 * (from lib/battlegrounds, sourced) as a ranked "closest races" list, each
 * linking to its battle page, plus one CTA into the full Battlegrounds map.
 * Server component; plain styling for now.
 */

import Link from 'next/link'
import { Swords, ArrowRight } from 'lucide-react'
import { getBattlegrounds } from '@/lib/battlegrounds'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import type { PartySlug } from '@/types'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', SURFACE = '#f8fafc'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function BattlegroundsTeaser() {
  const closest = getBattlegrounds()
    .filter((b) => b.tier.key !== 'unknown' && typeof b.info.majority === 'number')
    .slice(0, 5)

  return (
    <section style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px clamp(18px, 5vw, 36px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#dc2626', fontFamily: MANROPE, marginBottom: 8 }}>
              <Swords style={{ width: 15, height: 15 }} /> Battlegrounds
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 4.5vw, 30px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: '0 0 8px', lineHeight: 1.15 }}>
              The seats to watch in 2026
            </h2>
            <p style={{ fontSize: 14.5, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55, maxWidth: 560 }}>
              Where 2023 was closest is where 2026 will likely be fought hardest. Explore the interactive map, coloured by
              how tight each race was.
            </p>
          </div>
          <Link href="/battlegrounds" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Explore the map <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>

        {/* Ranked closest-races list — the "attract with real data" hook */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {closest.map((b, i) => (
            <Link key={b.slug} href={`/battlegrounds/${b.slug}`} style={{ textDecoration: 'none' }}>
              <div className="party-card" style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: `1px solid ${BORDER}`, borderLeft: `4px solid ${b.tier.color}`, borderRadius: 12, padding: '13px 16px' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: TERTIARY, fontFamily: MANROPE, width: 18, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{b.info.name}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.03em', textTransform: 'uppercase', color: b.tier.color, background: `${b.tier.color}17`, borderRadius: 999, padding: '2px 9px', fontFamily: MANROPE }}>{b.tier.label}</span>
                  </span>
                  <span style={{ display: 'block', fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, marginTop: 3 }}>
                    Held by {b.info.party ? PARTY_NAMES[b.info.party as PartySlug].short : 'an unverified party'} — won by {b.info.majority?.toLocaleString()} votes in 2023
                  </span>
                </span>
                {b.info.party && <span style={{ width: 10, height: 10, borderRadius: 3, background: PARTY_COLORS[b.info.party as PartySlug].bg, flexShrink: 0 }} />}
                <ArrowRight style={{ width: 15, height: 15, color: TERTIARY, flexShrink: 0 }} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
