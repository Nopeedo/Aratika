'use client'

/**
 * CompareTool — the interactive party comparison. Switch topic, toggle
 * Plain/Detailed, and show/hide parties; positions sit side by side. Reads only
 * approved, editor-checked positions. Neutral directory order; every card cites
 * its source and links to the full on-site breakdown.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, ArrowRight, Scale } from 'lucide-react'
import { PARTY_DIRECTORY_ORDER, PARTY_PROFILES } from '@/constants/parties-data'
import type { PartySlug } from '@/types'
import type { PartyPosition } from '@/lib/positions/live'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
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
      {/* Topic switcher */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        {topics.map((t) => {
          const active = t.slug === topic
          return (
            <button
              key={t.slug}
              onClick={() => t.hasData && setTopic(t.slug)}
              disabled={!t.hasData}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999,
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

      {/* Controls: party filter + plain/detailed */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
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

      {/* Comparison grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {visibleParties.map((slug) => {
          const party = PARTY_PROFILES[slug as PartySlug]
          const pos = byParty.get(slug)
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
                    <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
                      <Link href={`/policies/${topic}/${slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 800, color: INK, fontFamily: MANROPE, textDecoration: 'none' }}>
                        Full breakdown <ArrowRight style={{ width: 14, height: 14 }} />
                      </Link>
                      {pos.sourceUrl && (
                        <div style={{ marginTop: 7 }}>
                          <a href={pos.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
                            {pos.sourceLabel} <ExternalLink style={{ width: 11, height: 11 }} />
                          </a>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.55, margin: 0 }}>
                    No {topicLabel.toLowerCase()} position captured for {party.name} yet — being sourced and editor-checked.
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {visibleParties.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: TERTIARY, fontFamily: MANROPE, fontSize: 14 }}>
          <Scale style={{ width: 26, height: 26, margin: '0 auto 10px', color: '#cbd0d6' }} />
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
