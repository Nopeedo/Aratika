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
  ChevronDown, ChevronLeft, ChevronRight, ArrowRight, X, ExternalLink, Target,
  Home, Heart, Leaf, GraduationCap, Scale, Globe, Landmark, Wind, TrendingUp, Users,
} from 'lucide-react'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import { PARTY_COLORS } from '@/constants/parties'
import { PARTY_DIRECTORY_ORDER, PARTY_PROFILES } from '@/constants/parties-data'
import { PartyPositions } from '@/components/policy/party-positions'
import { usePartyCycle } from '@/components/homepage/party-cycle'
import type { PartySlug } from '@/types'
import type { PartyPosition } from '@/lib/positions/live'

const TOPIC_ICONS: Record<string, React.ElementType> = { Home, Heart, TrendingUp, Leaf, GraduationCap, Scale, Globe, Landmark, Wind, Users }
const PARTY_DOT_ORDER = ['green', 'labour', 'tpm', 'nzfirst', 'national', 'act'] as const
const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

// Desktop-only rail nav buttons (‹ ›). `display` is set by the .pe-rail-arrow class (hidden on mobile).
const ARROW_BASE: React.CSSProperties = {
  position: 'absolute', top: 'calc(50% - 3px)', transform: 'translateY(-50%)',
  width: 40, height: 40, borderRadius: '50%', background: '#fff', border: `1px solid ${BORDER}`,
  boxShadow: '0 4px 14px rgba(12,14,18,.14)', alignItems: 'center', justifyContent: 'center',
  color: INK, cursor: 'pointer', zIndex: 3, transition: 'opacity .2s ease',
}

export function PolicyExplorer({ topicKeys, positions }: { topicKeys: string[]; positions: PartyPosition[] }) {
  const [sel, setSel] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false) // by default show only the focused party; opt in to the full comparison
  const { selectedSlug: focused, select } = usePartyCycle() // the party chosen in the command bar / hero tiles
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (sel && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [sel])

  // Collapse back to focused-only whenever the topic or the chosen party changes.
  useEffect(() => { setShowAll(false) }, [sel, focused])

  // Desktop has no swipe — arrow buttons cycle the topic rail. Track which way it can scroll.
  const railRef = useRef<HTMLDivElement>(null)
  const [arrows, setArrows] = useState({ left: false, right: false })
  const updateArrows = () => {
    const el = railRef.current
    if (!el) return
    setArrows({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 })
  }
  useEffect(() => {
    updateArrows()
    window.addEventListener('resize', updateArrows)
    return () => window.removeEventListener('resize', updateArrows)
  }, [])
  const scrollRail = (dir: number) => {
    railRef.current?.scrollBy({ left: dir * Math.max(240, railRef.current.clientWidth * 0.7), behavior: 'smooth' })
  }

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
      {/* When a party is chosen (command bar / hero tiles) but no issue is open yet — nudge them to pick one. */}
      {focused && !sel && PARTY_PROFILES[focused as PartySlug] && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14, padding: '10px 14px', border: `1px solid ${BORDER}`, borderLeft: `4px solid ${PARTY_COLORS[focused as PartySlug].bg}`, borderRadius: 12, background: '#fff' }}>
          <Target style={{ width: 15, height: 15, color: PARTY_COLORS[focused as PartySlug].bg, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Focused on {PARTY_PROFILES[focused as PartySlug].name}</span>
          <span style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, flex: 1, minWidth: 130 }}>Tap an issue below to see where they stand.</span>
          <button onClick={() => select(null)} style={{ fontSize: 12, fontWeight: 700, color: SECONDARY, background: 'none', border: `1px solid ${BORDER}`, borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontFamily: MANROPE, whiteSpace: 'nowrap' }}>Clear focus</button>
        </div>
      )}

      {/* One focused issue at a time: a horizontal rail on every screen. Mobile swipes it;
          desktop (no swipe) cycles it with the ‹ › arrow buttons. */}
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
        .pe-rail-arrow { display: none; }
        @media (min-width: 768px) {
          .pe-rail-hint { display: none; }
          .pe-rail-arrow { display: flex; }
        }
      `}</style>
      <div className="pe-rail-hint" style={{ alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: TERTIARY, fontFamily: MANROPE, margin: '-2px 0 10px' }}>
        Swipe issues, tap one to compare <ArrowRight style={{ width: 13, height: 13 }} />
      </div>
      <div style={{ position: 'relative' }}>
        <button
          className="pe-rail-arrow"
          aria-label="Previous topics"
          onClick={() => scrollRail(-1)}
          style={{ ...ARROW_BASE, left: -6, opacity: arrows.left ? 1 : 0, pointerEvents: arrows.left ? 'auto' : 'none' }}
        >
          <ChevronLeft style={{ width: 20, height: 20 }} />
        </button>
        <button
          className="pe-rail-arrow"
          aria-label="More topics"
          onClick={() => scrollRail(1)}
          style={{ ...ARROW_BASE, right: -6, opacity: arrows.right ? 1 : 0, pointerEvents: arrows.right ? 'auto' : 'none' }}
        >
          <ChevronRight style={{ width: 20, height: 20 }} />
        </button>
        <div className="pe-topic-rail" ref={railRef} onScroll={updateArrows}>
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
      </div>

      {sel && selTopic && (
        <div ref={panelRef} style={{ marginTop: 18, border: `1px solid ${BORDER}`, borderRadius: 18, background: '#fff', padding: '18px clamp(14px, 4vw, 22px)', scrollMarginTop: 80 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: 'clamp(16px, 4.5vw, 18px)', fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 3px', lineHeight: 1.25 }}>
                {focused && PARTY_PROFILES[focused as PartySlug] && !showAll
                  ? `Where ${PARTY_PROFILES[focused as PartySlug].name} stands on ${selTopic.label}`
                  : `Where the parties stand on ${selTopic.label}`}
              </h3>
              <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>Each party’s most recent published policy — not a past-election position.</p>
            </div>
            <button onClick={() => setSel(null)} aria-label="Close" style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 6, cursor: 'pointer', color: SECONDARY, display: 'flex', flexShrink: 0 }}>
              <X style={{ width: 15, height: 15 }} />
            </button>
          </div>

          {topicsWithData.has(sel) ? (
            focused && PARTY_PROFILES[focused as PartySlug] ? (
              <>
                <FocusedCard slug={focused as PartySlug} pos={getPos(focused)} topic={sel} topicLabel={selTopic.label} showAll={showAll} onToggleAll={() => setShowAll((v) => !v)} />
                {showAll && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 11px' }}>
                      <span style={{ flex: 1, height: 1, background: BORDER }} />
                      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: TERTIARY, whiteSpace: 'nowrap', fontFamily: MANROPE }}>The other parties</span>
                      <span style={{ flex: 1, height: 1, background: BORDER }} />
                    </div>
                    <PartyPositions parties={PARTY_DIRECTORY_ORDER.filter((s) => s !== focused)} getPos={getPos} detailed={false} topic={sel} topicLabel={selTopic.label} />
                  </>
                )}
              </>
            ) : showAll ? (
              <PartyPositions parties={PARTY_DIRECTORY_ORDER} getPos={getPos} detailed={false} topic={sel} topicLabel={selTopic.label} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 11, padding: '18px 16px', border: `1px dashed ${BORDER}`, borderRadius: 14, background: '#fbfaf8' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Target style={{ width: 16, height: 16, color: JADE, flexShrink: 0 }} />
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Pick a party from the tiles above</span>
                </span>
                <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>Tap a party tile to see just their stance on {selTopic.label.toLowerCase()} here — or see everyone at once.</p>
                <button onClick={() => setShowAll(true)} style={{ fontSize: 12.5, fontWeight: 800, color: INK, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 9, padding: '8px 13px', cursor: 'pointer', fontFamily: MANROPE }}>Show all parties</button>
              </div>
            )
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

/** Light party colours (e.g. ACT yellow) need dark text/tick on the coloured header. */
function isLightHex(hex: string): boolean {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6
}

/** The chosen party, pulled to the top of the panel and shown in full for the open topic.
 *  Its header button toggles the rest of the parties in/out (default: focused party only). */
function FocusedCard({ slug, pos, topic, topicLabel, showAll, onToggleAll }: {
  slug: PartySlug
  pos: PartyPosition | undefined
  topic: string
  topicLabel: string
  showAll: boolean
  onToggleAll: () => void
}) {
  const party = PARTY_PROFILES[slug]
  const c = party.color
  const light = isLightHex(c)
  const txt = light ? '#2A1206' : '#fff'
  const overlay = light ? 'rgba(0,0,0,.13)' : 'rgba(255,255,255,.22)'
  const body = pos?.summaryBasic || pos?.summary

  return (
    <div style={{ border: `1.5px solid ${c}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ background: c, padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: txt, fontFamily: MANROPE }}>{party.name}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: txt, background: overlay, padding: '3px 8px', borderRadius: 20 }}>
            <Target style={{ width: 11, height: 11 }} /> Focused
          </span>
        </span>
        <button onClick={onToggleAll} aria-expanded={showAll} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, color: txt, background: overlay, border: 'none', borderRadius: 7, padding: '5px 9px', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: MANROPE }}>
          {showAll ? 'Hide other parties' : 'Show all parties'}
          <ChevronDown style={{ width: 13, height: 13, transform: showAll ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
        </button>
      </div>
      <div style={{ padding: '13px 14px', background: '#fff' }}>
        {pos ? (
          <>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: TERTIARY, marginBottom: 6, fontFamily: MANROPE }}>On {topicLabel}</div>
            <p style={{ fontSize: 14.5, fontWeight: 700, color: INK, lineHeight: 1.45, margin: '0 0 8px', fontFamily: MANROPE }}>{pos.stance || body}</p>
            {body && pos.stance && (
              <p style={{ fontSize: 13, color: '#33373f', lineHeight: 1.6, margin: '0 0 10px', fontFamily: MANROPE }}>{body}</p>
            )}
            {pos.quote && (
              <p style={{ fontSize: 12.5, color: SECONDARY, lineHeight: 1.5, margin: '0 0 10px', paddingLeft: 10, borderLeft: `3px solid ${c}`, fontStyle: 'italic', fontFamily: MANROPE }}>“{pos.quote}”</p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
              <Link href={`/policies/${topic}/${slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 800, color: INK, textDecoration: 'none', fontFamily: MANROPE }}>
                Full breakdown <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
              {pos.sourceUrl && (
                <a href={pos.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: JADE, textDecoration: 'none', fontFamily: MANROPE }}>
                  {pos.sourceLabel} <ExternalLink style={{ width: 11, height: 11 }} />
                </a>
              )}
            </div>
          </>
        ) : (
          <p style={{ fontSize: 13, color: TERTIARY, lineHeight: 1.55, margin: 0, fontFamily: MANROPE }}>
            No {topicLabel.toLowerCase()} position captured yet for {party.name} — being sourced from official policy, then editor-checked.
          </p>
        )}
      </div>
    </div>
  )
}
