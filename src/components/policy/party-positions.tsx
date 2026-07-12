'use client'

/**
 * PartyPositions — the shared, mobile-first "scannable stacked" comparison list.
 * Each party is a full-width row with its STANCE shown up front, so scrolling
 * gives a fast read of every party's position on a topic; tap a row to expand
 * the detail (summary, quote, source, full breakdown). One "expand all" control
 * lets desktop users open everything at once. Used by the per-topic page and the
 * compare tool. Neutral directory order; honest empty state; every row sourced.
 */

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, ArrowRight, ChevronDown } from 'lucide-react'
import { PARTY_PROFILES } from '@/constants/parties-data'
import type { PartySlug } from '@/types'
import type { PartyPosition } from '@/lib/positions/live'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function PartyPositions({ parties, getPos, detailed, topic, topicLabel }: {
  parties: string[]
  getPos: (slug: string) => PartyPosition | undefined
  detailed: boolean
  topic: string
  topicLabel: string
}) {
  const [open, setOpen] = useState<Set<string>>(new Set())
  const withData = parties.filter((s) => getPos(s))
  const allOpen = withData.length > 0 && withData.every((s) => open.has(s))
  const toggle = (s: string) => setOpen((p) => { const n = new Set(p); n.has(s) ? n.delete(s) : n.add(s); return n })

  return (
    <div>
      {withData.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
          <button
            onClick={() => setOpen(allOpen ? new Set() : new Set(withData))}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE }}
          >
            {allOpen ? 'Collapse all' : 'Expand all'}
            <ChevronDown style={{ width: 14, height: 14, transform: allOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {parties.map((slug) => {
          const party = PARTY_PROFILES[slug as PartySlug]
          const pos = getPos(slug)
          const isOpen = open.has(slug)
          const body = detailed ? (pos?.summary || pos?.summaryBasic) : (pos?.summaryBasic || pos?.summary)
          return (
            <div key={slug} style={{ border: `1px solid ${BORDER}`, borderLeft: `4px solid ${party.color}`, borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
              <button
                onClick={() => pos && toggle(slug)}
                aria-expanded={pos ? isOpen : undefined}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 11, width: '100%', textAlign: 'left', padding: '13px 14px', background: 'none', border: 'none', cursor: pos ? 'pointer' : 'default', fontFamily: MANROPE }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 17, fontWeight: 800, color: INK }}>{party.name}</span>
                    {pos && <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: TERTIARY }}>{pos.periodLabel}</span>}
                  </span>
                  {pos ? (
                    <span style={{ display: 'block', fontSize: 16, fontWeight: 700, color: INK, lineHeight: 1.4, marginTop: 3 }}>{pos.stance || body}</span>
                  ) : (
                    <span style={{ display: 'block', fontSize: 14, color: TERTIARY, lineHeight: 1.5, marginTop: 3 }}>
                      No {topicLabel.toLowerCase()} position captured yet — being sourced from {party.name}’s official policy, then editor-checked.
                    </span>
                  )}
                </span>
                {pos && <ChevronDown style={{ width: 18, height: 18, color: TERTIARY, flexShrink: 0, marginTop: 3, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />}
              </button>

              {pos && isOpen && (
                <div style={{ padding: '0 14px 14px' }}>
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
