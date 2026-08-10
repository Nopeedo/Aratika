'use client'

/**
 * TopicStances — "where parties stand on <topic>", expanded in place on a bill
 * page instead of sending the reader to /policies/[topic].
 *
 * Leaving the bill to find out who supports it, then having to navigate back to
 * the bill, breaks the one thought the reader is actually having. Each party is
 * a row that opens to its stance; the full topic page is still one tap away for
 * anyone who wants the sourced detail.
 */

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronDown } from 'lucide-react'

export interface TopicStance {
  party: string
  partyName: string
  colour: string
  textColour: string
  stance: string
  summary: string | null
  noPosition: boolean
}

const INK = '#17231b', SECONDARY = '#667066', TERTIARY = '#9aa0aa', BORDER = '#e4ebe2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function TopicStances({ topic, topicLabel, stances }: { topic: string; topicLabel: string; stances: TopicStance[] }) {
  const [open, setOpen] = useState(false)
  const [party, setParty] = useState<string | null>(null)

  // Nothing captured for this topic yet — keep the link out rather than open an
  // empty drawer.
  if (stances.length === 0) {
    return (
      <Link href={`/policies/${topic}`} style={linkStyle}>
        Where parties stand on {topicLabel} <ArrowRight style={{ width: 14, height: 14 }} />
      </Link>
    )
  }

  return (
    <div style={{ marginTop: 16 }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} style={{ ...linkStyle, background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginTop: 0 }}>
        Where parties stand on {topicLabel}
        <ChevronDown style={{ width: 15, height: 15, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .18s ease' }} />
      </button>

      {open && (
        <div style={{ marginTop: 12, border: `1px solid ${BORDER}`, borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
          {stances.map((s, i) => {
            const on = party === s.party
            return (
              <div key={s.party} style={{ borderTop: i === 0 ? 'none' : `1px solid ${BORDER}` }}>
                <button type="button" onClick={() => setParty(on ? null : s.party)} aria-expanded={on} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                  background: on ? '#f8fafc' : 'none', border: 'none', padding: '11px 14px', cursor: 'pointer', fontFamily: MANROPE,
                }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: s.colour, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: INK, flexShrink: 0 }}>{s.partyName}</span>
                  <span style={{ fontSize: 12.5, color: s.noPosition ? TERTIARY : SECONDARY, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: s.noPosition ? 'italic' : 'normal' }}>
                    {s.noPosition ? 'No stated position' : s.stance}
                  </span>
                  {/* A verified "no stated position" still carries an explanation
                      of how that was checked — so the chevron follows the summary,
                      not the stance. */}
                  {s.summary && (
                    <ChevronDown style={{ width: 14, height: 14, color: TERTIARY, flexShrink: 0, transform: on ? 'rotate(180deg)' : 'none', transition: 'transform .18s ease' }} />
                  )}
                </button>
                {on && s.summary && (
                  <div style={{ padding: '0 14px 13px 33px' }}>
                    <p style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 8px' }}>{s.summary}</p>
                    <Link href={`/policies/${topic}/${s.party}`} style={{ fontSize: 12, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
                      Full position and sources →
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
          <div style={{ borderTop: `1px solid ${BORDER}`, padding: '10px 14px', background: '#f8fafc' }}>
            <Link href={`/policies/${topic}`} style={{ fontSize: 12.5, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
              Compare all parties on {topicLabel} →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

const linkStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 16,
  fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none',
}
