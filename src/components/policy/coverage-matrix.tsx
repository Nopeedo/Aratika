/**
 * CoverageMatrix — at-a-glance grid of which party holds a published position on
 * which topic. Three honest states per cell:
 *   ✓  published position (links to the breakdown)
 *   ∅  verified "no stated position" (sourced — links to verify)
 *   ·  not captured yet (a gap to fill — never read as "no position")
 * Server component; scrolls horizontally on narrow screens.
 */

import Link from 'next/link'
import { Check, Minus } from 'lucide-react'
import { PARTY_DIRECTORY_ORDER, PROFILED_MINOR_PARTIES, PARTY_PROFILES } from '@/constants/parties-data'
import { PARTY_NAMES } from '@/constants/parties'
import type { PartySlug } from '@/types'
import type { PartyPosition } from '@/lib/positions/live'
import { BORDER, INK, MANROPE, SECONDARY, SURFACE, TERTIARY } from '@/constants/theme'

export function CoverageMatrix({ positions, topics }: { positions: PartyPosition[]; topics: { slug: string; label: string }[] }) {
  const lookup = new Map<string, PartyPosition>()
  for (const p of positions) {
    const key = `${p.party}::${p.topic}`
    const ex = lookup.get(key)
    if (!ex || (ex.period !== '2026' && p.period === '2026')) lookup.set(key, p) // prefer current, fall back to 2023
  }

  // Only show a minor party once it actually has something captured — an all-dots
  // row adds a name and no information.
  const minors = PROFILED_MINOR_PARTIES.filter((slug) =>
    topics.some((t) => lookup.has(`${slug}::${t.slug}`)),
  )

  return (
    <div>
      {/* On a phone only about a third of this grid fits, so say so — otherwise
          people assume what they can see is all there is. Hidden on wider
          screens where the whole table is visible. */}
      <p className="scroll-x-hint" style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE, margin: '0 0 8px' }}>
        Swipe across to see all {topics.length} topics — the party column stays put.
      </p>
      <div className="scroll-x" style={{ overflowX: 'auto', border: `1px solid ${BORDER}`, borderRadius: 14 }}>
        <table className="coverage-matrix" style={{ borderCollapse: 'collapse', width: '100%', minWidth: 640, fontFamily: MANROPE }}>
          <thead>
            <tr>
              <th style={{ ...thBase, textAlign: 'left', position: 'sticky', left: 0, background: SURFACE, zIndex: 1, boxShadow: '2px 0 4px rgba(12,14,18,.06)' }}>Party</th>
              {topics.map((t) => (
                <th key={t.slug} style={{ ...thBase, textAlign: 'center' }}>
                  <Link href={`/policies/${t.slug}`} style={{ color: SECONDARY, textDecoration: 'none' }}>{t.label}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PARTY_DIRECTORY_ORDER.map((slug) => (
              <Row key={slug} slug={slug} topics={topics} lookup={lookup} />
            ))}
            {/* The parties outside Parliament sit in their own labelled band. They
                hold real published positions too — hiding them read as "no data",
                but merging them into the list above would imply equal standing. */}
            {minors.length > 0 && (
              <>
                <tr>
                  <th colSpan={topics.length + 1} scope="colgroup" style={{ ...tdBase, textAlign: 'left', background: SURFACE, fontSize: 11.5, fontWeight: 800, color: SECONDARY, letterSpacing: .2, position: 'sticky', left: 0 }}>
                    {/* The cell spans the full table, so pinned at left:0 on a
                        phone its label ran off the visible edge mid-word. The
                        inner span wraps to the viewport instead. */}
                    <span className="coverage-band">Also contesting — not currently in Parliament</span>
                  </th>
                </tr>
                {minors.map((slug) => (
                  <Row key={slug} slug={slug} topics={topics} lookup={lookup} />
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
        <Legend swatch={<span style={{ width: 16, height: 16, borderRadius: 5, background: '#1F8A4C', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Check style={{ width: 10, height: 10, color: '#fff' }} /></span>} label="Published position" />
        <Legend swatch={<span style={{ fontWeight: 800, color: TERTIARY, fontSize: 15 }}>∅</span>} label="No stated position (verified)" />
        <Legend swatch={<Minus style={{ width: 13, height: 13, color: '#cdd2d8' }} />} label="Not captured yet" />
      </div>
    </div>
  )
}

function Row({ slug, topics, lookup }: { slug: PartySlug; topics: { slug: string; label: string }[]; lookup: Map<string, PartyPosition> }) {
  const party = PARTY_PROFILES[slug]
  return (
    <tr>
      <td style={{ ...tdBase, textAlign: 'left', position: 'sticky', left: 0, background: '#fff', zIndex: 1, boxShadow: '2px 0 4px rgba(12,14,18,.06)' }}>
        {/* Short name, not the full registered one: this column is sized by its
            longest label, and "Animal Justice Party Aotearoa New Zealand" was
            pushing it past half the screen on a phone while the topic cells sat
            half empty. The full name is on the party's own page. */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: party.color, flexShrink: 0 }} />
          <span className="coverage-party-name" style={{ fontWeight: 800, color: INK }}>{PARTY_NAMES[slug].short}</span>
        </span>
      </td>
      {topics.map((t) => {
        const pos = lookup.get(`${slug}::${t.slug}`)
        return (
          <td key={t.slug} style={{ ...tdBase, textAlign: 'center' }}>
            {pos ? (
              pos.noPosition ? (
                <Link href={`/policies/${t.slug}/${slug}`} title="No stated position (verified)" style={{ color: TERTIARY, textDecoration: 'none', fontWeight: 800, fontSize: 15 }}>∅</Link>
              ) : (
                <Link href={`/policies/${t.slug}/${slug}`} title={pos.stance || 'View position'} style={{ display: 'inline-flex' }}>
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: party.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check style={{ width: 13, height: 13, color: party.textColor }} />
                  </span>
                </Link>
              )
            ) : (
              <Minus style={{ width: 13, height: 13, color: '#cdd2d8' }} />
            )}
          </td>
        )
      })}
    </tr>
  )
}

function Legend({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, color: SECONDARY, fontFamily: MANROPE }}>
      {swatch} {label}
    </span>
  )
}

// Padding lives in globals.css (.coverage-matrix), not here: inline styles beat
// any stylesheet rule, so it can't be tightened for phones from this file.
const thBase: React.CSSProperties = { fontSize: 11.5, fontWeight: 800, color: SECONDARY, borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }
const tdBase: React.CSSProperties = { borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }
