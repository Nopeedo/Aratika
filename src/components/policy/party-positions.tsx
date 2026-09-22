'use client'

/**
 * PartyPositions — the shared, mobile-first "scannable stacked" comparison list.
 * Each party is a full-width row with its STANCE shown up front, so scrolling
 * gives a fast read of every party's position on a topic; tap a row to expand
 * the detail (summary, quote, source, full breakdown). Used by the per-topic
 * page and the compare tool. Neutral directory order; honest empty state; every row sourced.
 */

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, ArrowRight, ChevronDown } from 'lucide-react'
import { PARTY_PROFILES } from '@/constants/parties-data'
import type { PartySlug } from '@/types'
import type { PartyPosition } from '@/lib/positions/live'
import { BORDER, INK, JADE, MANROPE, SECONDARY, TERTIARY, tint } from '@/constants/theme'
import { isLightHex } from '@/components/homepage/battleground-card'

/** The party colour as text. Most read fine as-is; the light ones (ACT's
 *  yellow, Freedoms NZ's cyan) vanish on a pale tint, so they are darkened
 *  in place — same hue, less light — rather than swapped for ink. */
function nameColor(hex: string): string {
  if (!isLightHex(hex)) return hex
  const h = hex.replace('#', '')
  const n = parseInt(h, 16)
  const d = (c: number) => Math.round(c * 0.62).toString(16).padStart(2, '0')
  return `#${d((n >> 16) & 255)}${d((n >> 8) & 255)}${d(n & 255)}`
}

export function PartyPositions({ parties, getPos, detailed, topic, topicLabel }: {
  parties: string[]
  getPos: (slug: string) => PartyPosition | undefined
  /**
   * Page-level plain/detailed switch (the compare tool still has one). When
   * it is omitted each card carries its OWN Plain / Detailed toggle inside the
   * expanded row — the topic page dropped its global control by request, so
   * a reader flips the depth of the one party they're reading, not all seven.
   */
  detailed?: boolean
  topic: string
  topicLabel: string
}) {
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [detailedRows, setDetailedRows] = useState<Set<string>>(new Set())
  const perCard = detailed === undefined
  const withData = parties.filter((s) => getPos(s))
  const toggle = (s: string) => setOpen((p) => { const n = new Set(p); n.has(s) ? n.delete(s) : n.add(s); return n })

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {parties.map((slug) => {
          const party = PARTY_PROFILES[slug as PartySlug]
          const pos = getPos(slug)
          const isOpen = open.has(slug)
          const rowDetailed = perCard ? detailedRows.has(slug) : !!detailed
          const body = rowDetailed ? (pos?.summary || pos?.summaryBasic) : (pos?.summaryBasic || pos?.summary)
          // Only offer the switch when there are two different texts to switch between.
          const canToggle = perCard && !!pos?.summary && !!pos?.summaryBasic && pos.summary !== pos.summaryBasic
          // Each card wears its party: a faint wash of the colour behind it,
          // a thin rule of it all the way round, and the name set in it.
          return (
            <div key={slug} style={{ border: `1px solid ${tint(party.color, 0.55)}`, borderRadius: 12, overflow: 'hidden', background: `linear-gradient(${tint(party.color, 0.07)}, ${tint(party.color, 0.07)}), #fff` }}>
              <button
                onClick={() => pos && toggle(slug)}
                aria-expanded={pos ? isOpen : undefined}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 11, width: '100%', textAlign: 'left', padding: '13px 14px', background: 'none', border: 'none', cursor: pos ? 'pointer' : 'default', fontFamily: MANROPE }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  {/* No "CURRENT POLICY" tag beside the name: every row on
                      this list is current policy (2023 fallbacks were removed
                      in PolicyComparison), so the label said nothing. */}
                  <span style={{ display: 'block', fontSize: 17, fontWeight: 800, color: nameColor(party.color) }}>{party.name}</span>
                  {pos ? (
                    <span style={{ display: 'block', fontSize: 16, fontWeight: 700, color: INK, lineHeight: 1.4, marginTop: 3 }}>{pos.stance || body}</span>
                  ) : (
                    <span style={{ display: 'block', fontSize: 14, color: TERTIARY, lineHeight: 1.5, marginTop: 3 }}>
                      No {topicLabel.toLowerCase()} position captured yet. Being sourced from {party.name}’s official policy, then editor-checked.
                    </span>
                  )}
                </span>
                {pos && <ChevronDown style={{ width: 18, height: 18, color: TERTIARY, flexShrink: 0, marginTop: 3, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />}
              </button>

              {pos && isOpen && (
                <div style={{ padding: '0 14px 14px' }}>
                  {canToggle && (
                    <div style={{ display: 'inline-flex', background: '#f6f4ef', border: `1px solid ${BORDER}`, borderRadius: 9, padding: 2, marginBottom: 10 }}>
                      {[{ k: false, label: 'Plain' }, { k: true, label: 'Detailed' }].map((o) => (
                        <button key={o.label} onClick={() => setDetailedRows((p) => { const n = new Set(p); o.k ? n.add(slug) : n.delete(slug); return n })} style={{
                          padding: '4px 11px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: MANROPE,
                          background: rowDetailed === o.k ? '#fff' : 'transparent', color: rowDetailed === o.k ? INK : TERTIARY,
                          boxShadow: rowDetailed === o.k ? '0 1px 3px rgba(12,14,18,.08)' : 'none',
                        }}>{o.label}</button>
                      ))}
                    </div>
                  )}
                  {body && pos.stance && (
                    <p style={{ fontSize: 15, color: '#33373f', lineHeight: 1.6, margin: '0 0 10px', fontFamily: MANROPE }}>{body}</p>
                  )}
                  {pos.quote && (
                    <p style={{ fontSize: 14, color: SECONDARY, lineHeight: 1.5, margin: '0 0 10px', paddingLeft: 10, borderLeft: `3px solid ${party.color}`, fontStyle: 'italic', fontFamily: MANROPE }}>“{pos.quote}”</p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
                    <Link href={`/policies/${topic}/${slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 800, color: INK, textDecoration: 'none', fontFamily: MANROPE }}>
                      Full breakdown <ArrowRight style={{ width: 14, height: 14 }} />
                    </Link>
                    {pos.sourceUrl && (
                      <a href={pos.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: JADE, textDecoration: 'none', fontFamily: MANROPE }}>
                        {pos.sourceLabel} <ExternalLink style={{ width: 11, height: 11 }} />
                      </a>
                    )}
                    {pos.asOf && <span style={{ fontSize: 13, color: TERTIARY, fontFamily: MANROPE }}>· as at {pos.asOf}</span>}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
