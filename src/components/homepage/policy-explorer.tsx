'use client'

/**
 * PolicyExplorer — the homepage policy grid, but INLINE. Tapping a topic card
 * doesn't leave the page: it opens a panel below the grid with the simplified
 * party positions for that topic (the scannable PartyPositions list — stance up
 * front, tap a party for the breakdown), plus a link to the full topic page for
 * the deep dive. One topic open at a time; the panel scrolls into view.
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown, ArrowRight, X,
  Home, Heart, Leaf, GraduationCap, Scale, Globe, Landmark, Wind, TrendingUp, Users,
} from 'lucide-react'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import { PARTY_COLORS } from '@/constants/parties'
import { PARTY_DIRECTORY_ORDER } from '@/constants/parties-data'
import { PartyPositions } from '@/components/policy/party-positions'
import type { PartyPosition } from '@/lib/positions/live'

const TOPIC_ICONS: Record<string, React.ElementType> = { Home, Heart, TrendingUp, Leaf, GraduationCap, Scale, Globe, Landmark, Wind, Users }
const PARTY_DOT_ORDER = ['green', 'labour', 'tpm', 'nzfirst', 'national', 'act'] as const
const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function PolicyExplorer({ topicKeys, positions }: { topicKeys: string[]; positions: PartyPosition[] }) {
  const [sel, setSel] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (sel && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [sel])

  const topicsWithData = new Set(positions.map((p) => p.topic))
  const selTopic = sel ? POLICY_TOPICS[sel as keyof typeof POLICY_TOPICS] : null
  const getPos = (slug: string) => {
    let best: PartyPosition | undefined
    for (const p of positions) {
      if (p.party !== slug || p.topic !== sel) continue
      if (!best || (best.period !== '2026' && p.period === '2026')) best = p
    }
    return best
  }

  return (
    <div>
      {/* Mobile: horizontal swipe rail (focus one issue at a time). Desktop (≥768px): the all-visible grid. */}
      <style>{`
        .pe-topic-rail {
          display: flex; gap: 14px; overflow-x: auto;
          scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
          padding-bottom: 6px; scrollbar-width: none; -ms-overflow-style: none;
          scroll-padding-left: 2px;
        }
        .pe-topic-rail::-webkit-scrollbar { display: none; }
        .pe-topic-card { flex: 0 0 auto; width: 200px; scroll-snap-align: start; }
        .pe-rail-hint { display: flex; }
        @media (min-width: 768px) {
          .pe-topic-rail {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(min(100%, 180px), 1fr));
            overflow: visible;
          }
          .pe-topic-card { width: auto; }
          .pe-rail-hint { display: none; }
        }
      `}</style>
      <div className="pe-rail-hint" style={{ alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: TERTIARY, fontFamily: MANROPE, margin: '-2px 0 10px' }}>
        Swipe issues, tap one to compare <ArrowRight style={{ width: 13, height: 13 }} />
      </div>
      <div className="pe-topic-rail">
        {topicKeys.map((key) => {
          const t = POLICY_TOPICS[key as keyof typeof POLICY_TOPICS]
          const Icon = TOPIC_ICONS[t.icon]
          const on = sel === key
          return (
            <button
              key={key}
              className="pe-topic-card"
              onClick={(e) => {
                setSel(on ? null : key)
                if (!on) e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
              }}
              aria-expanded={on}
              style={{
                textAlign: 'left', cursor: 'pointer', background: '#fff', fontFamily: MANROPE,
                border: `1px solid ${on ? INK : BORDER}`, borderRadius: 20, padding: '22px 20px 18px',
                boxShadow: on ? '0 6px 18px rgba(12,14,18,.10)' : '0 2px 4px rgba(12,14,18,.03)',
                display: 'flex', flexDirection: 'column', gap: 10, height: '100%',
                transition: 'box-shadow .15s, border-color .15s',
              }}
            >
              <div className={t.color} style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {Icon && <Icon className={`size-5 ${t.textColor}`} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: INK, marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 12, color: SECONDARY, lineHeight: 1.5 }}>{t.description}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {PARTY_DOT_ORDER.map((s) => (
                    <span key={s} style={{ width: 10, height: 10, borderRadius: '50%', background: PARTY_COLORS[s].bg, border: '1.5px solid rgba(255,255,255,.6)', display: 'inline-block', flexShrink: 0 }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: on ? INK : JADE, display: 'flex', alignItems: 'center', gap: 3 }}>
                  {on ? 'Hide' : 'Compare'} <ChevronDown style={{ width: 12, height: 12, transform: on ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {sel && selTopic && (
        <div ref={panelRef} style={{ marginTop: 18, border: `1px solid ${BORDER}`, borderRadius: 18, background: '#fff', padding: '18px clamp(14px, 4vw, 22px)', scrollMarginTop: 80 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: 'clamp(16px, 4.5vw, 18px)', fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 3px', lineHeight: 1.25 }}>Where the parties stand on {selTopic.label}</h3>
              <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>Tap a party for the breakdown. Sourced from official policy.</p>
            </div>
            <button onClick={() => setSel(null)} aria-label="Close" style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 6, cursor: 'pointer', color: SECONDARY, display: 'flex', flexShrink: 0 }}>
              <X style={{ width: 15, height: 15 }} />
            </button>
          </div>

          {topicsWithData.has(sel) ? (
            <PartyPositions parties={PARTY_DIRECTORY_ORDER} getPos={getPos} detailed={false} topic={sel} topicLabel={selTopic.label} />
          ) : (
            <p style={{ fontSize: 13, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.55, margin: 0 }}>
              Party positions on {selTopic.label.toLowerCase()} are being sourced from official policy and editor-checked — they’ll appear here soon.
            </p>
          )}

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
            <Link href={`/policies/${sel}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
              Full {selTopic.label} comparison <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
