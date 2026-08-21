'use client'

/**
 * BillBreakdown — the shared visual for a bill's neutral summary + clickable
 * policy-topic breakdown. Used by both the public reader (/legislation/[slug])
 * and the editor preview (/editor), so editors review exactly what readers see.
 */

import { useState } from 'react'
import {
  Sparkles, Quote,
  Home, Heart, TrendingUp, Leaf, GraduationCap, Scale, Globe, Landmark, Wind, Users,
} from 'lucide-react'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import { TOPIC_ICONS } from '@/constants/policy-topic-icons'
import { TopicStances, type TopicStance } from './topic-stances'
import type { PolicyTopic } from '@/types'
import { BORDER, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY } from '@/constants/theme'

export interface PolicyLink {
  topic: string
  explanation: string
  explanationBasic?: string
  excerpts: string[]
}


export function BillBreakdown({ summary, summaryBasic = null, policyLinks, docType = 'bill', linkTopics = true, stances = {} }: {
  summary: string | null
  summaryBasic?: string | null
  policyLinks: PolicyLink[]
  docType?: string
  linkTopics?: boolean   // false in the editor preview (no navigation)
  stances?: Record<string, TopicStance[]>   // party positions, keyed by topic
}) {
  const topics = policyLinks.filter((p) => POLICY_TOPICS[p.topic as PolicyTopic])
  const [active, setActive] = useState<string | null>(topics[0]?.topic ?? null)
  const activeLink = topics.find((t) => t.topic === active) ?? null

  const hasBasic = !!summaryBasic || topics.some((t) => t.explanationBasic)
  const [level, setLevel] = useState<'basic' | 'detailed'>('basic')
  const shownSummary = level === 'basic' ? (summaryBasic || summary) : (summary || summaryBasic)

  return (
    <div>
      {/* Arapono summary */}
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18, padding: '22px 24px', marginBottom: 22, boxShadow: '0 2px 4px rgba(12,14,18,.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>
            <Sparkles style={{ width: 16, height: 16, color: JADE }} /> In short: Arapono’s summary
          </span>
          {hasBasic && <LevelToggle level={level} setLevel={setLevel} />}
        </div>
        <p style={{ fontSize: 16, color: '#23262c', fontFamily: MANROPE, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{shownSummary || <span style={{ color: TERTIARY, fontStyle: 'italic' }}>No summary yet.</span>}</p>
      </div>

      {/* Policy breakdown */}
      {topics.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>What this affects</h2>
          <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 14px' }}>Tap a topic to see how this {docType} touches it, and the parts of the text that show it.</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {topics.map((t) => {
              const meta = POLICY_TOPICS[t.topic as PolicyTopic]
              const Icon = TOPIC_ICONS[meta.icon] || Scale
              const on = active === t.topic
              return (
                <button key={t.topic} type="button" onClick={() => setActive(t.topic)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontFamily: MANROPE,
                  fontSize: 13.5, fontWeight: 700, padding: '8px 14px', borderRadius: 999,
                  border: `1.5px solid ${on ? JADE : BORDER}`, background: on ? JADE : '#fff', color: on ? '#fff' : INK, transition: 'all .15s',
                }}>
                  <Icon style={{ width: 15, height: 15, color: on ? '#fff' : JADE }} /> {meta.label}
                </button>
              )
            })}
          </div>

          {activeLink && (
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '20px 22px' }}>
              <p style={{ fontSize: 15.5, color: INK, fontFamily: MANROPE, lineHeight: 1.65, margin: '0 0 16px', fontWeight: 500 }}>{level === 'basic' ? (activeLink.explanationBasic || activeLink.explanation) : (activeLink.explanation || activeLink.explanationBasic)}</p>
              {activeLink.excerpts.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 10 }}>From the {docType}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {activeLink.excerpts.map((ex, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 14px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 11 }}>
                        <Quote style={{ width: 15, height: 15, color: JADE, flexShrink: 0, marginTop: 2 }} />
                        <p style={{ fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>{ex}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {linkTopics && (
                <TopicStances
                  topic={activeLink.topic}
                  topicLabel={POLICY_TOPICS[activeLink.topic as PolicyTopic].label}
                  stances={stances[activeLink.topic] ?? []}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LevelToggle({ level, setLevel }: { level: 'basic' | 'detailed'; setLevel: (l: 'basic' | 'detailed') => void }) {
  return (
    <div style={{ display: 'inline-flex', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 999, padding: 2 }}>
      {(['basic', 'detailed'] as const).map((l) => (
        <button key={l} type="button" onClick={() => setLevel(l)} title={l === 'basic' ? 'Plain language, no jargon' : 'Fuller detail'} style={{
          cursor: 'pointer', fontFamily: MANROPE, fontSize: 12, fontWeight: 800, padding: '5px 13px', borderRadius: 999, border: 'none',
          background: level === l ? JADE : 'transparent', color: level === l ? '#fff' : SECONDARY, textTransform: 'capitalize', transition: 'all .15s',
        }}>{l}</button>
      ))}
    </div>
  )
}
