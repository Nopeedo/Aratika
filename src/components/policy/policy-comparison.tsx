'use client'

/**
 * PolicyComparison — side-by-side party positions on one topic. A single
 * Plain/Detailed toggle drives every card. Reads approved, editor-checked
 * positions; parties without a captured position show an honest empty state.
 * Equal cards, neutral directory order, every card cites its source.
 */

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, ArrowRight } from 'lucide-react'
import { PARTY_DIRECTORY_ORDER, PARTY_PROFILES } from '@/constants/parties-data'
import type { PartyPosition } from '@/lib/positions/live'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function PolicyComparison({ positions, topicLabel, topic }: { positions: PartyPosition[]; topicLabel: string; topic: string }) {
  const [detailed, setDetailed] = useState(false)
  const current = (slug: string) => {
    const ps = positions.filter((p) => p.party === slug)
    return ps.find((p) => p.period === '2026') ?? ps[0] // prefer current, fall back to 2023 manifesto
  }

  return (
    <div>
      {/* Header row + toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>Where each party stands on {topicLabel}</h2>
          <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>Current stated policy, from each party’s own site. 2023 manifesto positions are being sourced.</p>
        </div>
        <div style={{ display: 'inline-flex', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 3 }}>
          {[{ k: false, label: 'Plain' }, { k: true, label: 'Detailed' }].map((o) => (
            <button key={o.label} onClick={() => setDetailed(o.k)} style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, fontFamily: MANROPE,
              background: detailed === o.k ? '#fff' : 'transparent', color: detailed === o.k ? INK : TERTIARY,
              boxShadow: detailed === o.k ? '0 1px 3px rgba(12,14,18,.08)' : 'none',
            }}>{o.label}</button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14, marginTop: 16 }}>
        {PARTY_DIRECTORY_ORDER.map((slug) => {
          const party = PARTY_PROFILES[slug]
          const pos = current(slug)
          const body = detailed ? (pos?.summary || pos?.summaryBasic) : (pos?.summaryBasic || pos?.summary)
          return (
            <div key={slug} style={{ border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 5, background: party.color }} />
              <div style={{ padding: '15px 17px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: party.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{party.name}</span>
                </div>

                {pos ? (
                  <>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 6 }}>{pos.periodLabel}</div>
                    {pos.stance && <div style={{ fontSize: 13.5, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.35, marginBottom: 8 }}>{pos.stance}</div>}
                    <p style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 10px' }}>{body}</p>
                    {pos.quote && (
                      <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.5, margin: '0 0 10px', paddingLeft: 10, borderLeft: `3px solid ${party.color}`, fontStyle: 'italic' }}>“{pos.quote}”</p>
                    )}
                    <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
                      <Link href={`/policies/${topic}/${slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 800, color: INK, fontFamily: MANROPE, textDecoration: 'none' }}>
                        Full breakdown <ArrowRight style={{ width: 14, height: 14 }} />
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                        {pos.sourceUrl && (
                          <a href={pos.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
                            {pos.sourceLabel} <ExternalLink style={{ width: 11, height: 11 }} />
                          </a>
                        )}
                        {pos.asOf && <span style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE }}>· as at {pos.asOf}</span>}
                      </div>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.55, margin: 0 }}>
                    Position not captured yet — being sourced from {party.name}’s official policy, then editor-checked before it appears here.
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '14px 0 0', lineHeight: 1.5 }}>
        Each position is summarised neutrally from the party’s own official policy and checked by an editor before publishing — never paraphrased without the source linked. Aratika is non-partisan.
      </p>
    </div>
  )
}
