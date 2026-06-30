'use client'

/**
 * CompareTool — the interactive party comparison. Switch topic, toggle
 * Plain/Detailed, and show/hide parties; positions show as a mobile-first
 * scannable stacked list (see PartyPositions). The topic switcher is sticky so
 * you can change issue while reading. Reads only approved, editor-checked
 * positions. Neutral directory order; every row cites its source.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PARTY_DIRECTORY_ORDER, PARTY_PROFILES } from '@/constants/parties-data'
import { PartyPositions } from '@/components/policy/party-positions'
import type { PartySlug } from '@/types'
import type { PartyPosition } from '@/lib/positions/live'

const INK = '#0c0e12', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

interface TopicOpt { slug: string; label: string; hasData: boolean }

export function CompareTool({ positions, topics }: { positions: PartyPosition[]; topics: TopicOpt[] }) {
  const firstWithData = topics.find((t) => t.hasData)?.slug ?? topics[0]?.slug ?? 'economy'
  const [topic, setTopic] = useState(firstWithData)
  const [detailed, setDetailed] = useState(false)
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const byParty = useMemo(() => {
    const m = new Map<string, PartyPosition>()
    for (const p of positions) {
      if (p.topic !== topic) continue
      const ex = m.get(p.party)
      if (!ex || (ex.period !== '2026' && p.period === '2026')) m.set(p.party, p) // prefer current, fall back to 2023
    }
    return m
  }, [positions, topic])

  const toggleParty = (slug: string) =>
    setHidden((prev) => { const n = new Set(prev); n.has(slug) ? n.delete(slug) : n.add(slug); return n })

  const visibleParties = PARTY_DIRECTORY_ORDER.filter((s) => !hidden.has(s))
  const topicLabel = topics.find((t) => t.slug === topic)?.label ?? topic

  return (
    <div>
      {/* Topic switcher — sticky so you can change issue while scrolling. Horizontal-scrolls on mobile. */}
      <div style={{ position: 'sticky', top: 60, zIndex: 5, background: '#fff', margin: '0 0 16px', paddingTop: 10 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, WebkitOverflowScrolling: 'touch' }}>
          {topics.map((t) => {
            const active = t.slug === topic
            return (
              <button
                key={t.slug}
                onClick={() => t.hasData && setTopic(t.slug)}
                disabled={!t.hasData}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0,
                  fontSize: 13, fontWeight: 700, fontFamily: MANROPE, cursor: t.hasData ? 'pointer' : 'default',
                  border: `1px solid ${active ? INK : BORDER}`,
                  background: active ? INK : '#fff', color: active ? '#fff' : (t.hasData ? INK : TERTIARY),
                  opacity: t.hasData ? 1 : 0.55,
                }}
              >
                {t.label}{!t.hasData && <span style={{ fontSize: 10.5, fontWeight: 700, color: TERTIARY }}>soon</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Controls: party filter + plain/detailed */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {PARTY_DIRECTORY_ORDER.map((slug) => {
            const party = PARTY_PROFILES[slug as PartySlug]
            const on = !hidden.has(slug)
            return (
              <button key={slug} onClick={() => toggleParty(slug)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 999,
                fontSize: 12, fontWeight: 700, fontFamily: MANROPE, cursor: 'pointer',
                border: `1px solid ${on ? party.color : BORDER}`, background: on ? '#fff' : SURFACE, color: on ? INK : TERTIARY,
              }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: on ? party.color : '#cbd0d6', display: 'inline-block' }} />
                {party.name}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'inline-flex', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 3 }}>
          {[{ k: false, label: 'Plain' }, { k: true, label: 'Detailed' }].map((o) => (
            <button key={o.label} onClick={() => setDetailed(o.k)} style={{
              padding: '6px 13px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, fontFamily: MANROPE,
              background: detailed === o.k ? '#fff' : 'transparent', color: detailed === o.k ? INK : TERTIARY,
              boxShadow: detailed === o.k ? '0 1px 3px rgba(12,14,18,.08)' : 'none',
            }}>{o.label}</button>
          ))}
        </div>
      </div>

      {visibleParties.length > 0 ? (
        <PartyPositions parties={visibleParties} getPos={(s) => byParty.get(s)} detailed={detailed} topic={topic} topicLabel={topicLabel} />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: TERTIARY, fontFamily: MANROPE, fontSize: 14 }}>
          All parties hidden — turn some back on above.
        </div>
      )}

      <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '16px 0 0', lineHeight: 1.5 }}>
        Positions are summarised neutrally from each party’s official policy and checked by an editor before publishing — never paraphrased without the source linked. Aratika is non-partisan.{' '}
        <Link href={`/policies/${topic}`} style={{ color: JADE, fontWeight: 700 }}>Open the {topicLabel} topic page →</Link>
      </p>
    </div>
  )
}
