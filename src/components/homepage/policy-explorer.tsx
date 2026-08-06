'use client'

/**
 * PolicyExplorer — the homepage policy grid, but INLINE. Tapping a topic card
 * doesn't leave the page: it opens a panel below the grid with the stance of
 * whichever party is on screen right now (auto-cycling until the reader taps a
 * tile), plus a link to the full topic page for the deep dive. One topic open at
 * a time. Comparing ALL parties lives in its own section further down the page
 * (see all-parties-compare.tsx), not behind a toggle in here.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown, ChevronLeft, ChevronRight, ArrowRight, X, ExternalLink,
  Home, Heart, Leaf, GraduationCap, Scale, Globe, Landmark, Wind, TrendingUp, Users,
} from 'lucide-react'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import { PARTY_PROFILES } from '@/constants/parties-data'
import { TopicChip } from '@/components/homepage/topic-chip'
import { usePartyCycle } from '@/components/homepage/party-cycle'
import type { PartySlug } from '@/types'
import type { PartyPosition } from '@/lib/positions/live'

const TOPIC_ICONS: Record<string, React.ElementType> = { Home, Heart, TrendingUp, Leaf, GraduationCap, Scale, Globe, Landmark, Wind, Users }
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
  // panelSlug is whichever party is on screen right now: the auto-cycling one
  // until the user taps a tile, their pick afterwards. Using it (rather than
  // selectedSlug) means opening an issue always lands on content — it rolls
  // along with the tiles instead of asking the reader to pick a party first.
  const { panelSlug, accentColor, fading, fadeMs } = usePartyCycle()
  const shown = panelSlug && PARTY_PROFILES[panelSlug as PartySlug] ? (panelSlug as PartySlug) : null
  const panelRef = useRef<HTMLDivElement>(null)

  // Where on screen the tapped chip was, so the copy in the head row can start
  // there and travel — rather than one chip vanishing and another appearing.
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null)
  const headChipRef = useRef<HTMLDivElement>(null)

  const openTopic = (key: string, el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    setOrigin({ x: r.left, y: r.top })
    setSel(key)
  }

  // FLIP: the head chip has already been laid out in its final slot, so invert
  // it back onto the tapped chip's position and play it forward to identity.
  // Runs in useLayoutEffect so the inverted transform is painted on the first
  // frame — in a plain useEffect the chip would flash at its destination first.
  useLayoutEffect(() => {
    const el = headChipRef.current
    if (!el || !origin) return
    const r = el.getBoundingClientRect()
    const dx = origin.x - r.left, dy = origin.y - r.top
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return
    el.style.transition = 'none'
    el.style.transform = `translate(${dx}px, ${dy}px)`
    void el.offsetWidth // flush the inverted position before playing forward
    el.style.transition = 'transform .46s cubic-bezier(.34, 1.32, .64, 1)'
    el.style.transform = 'translate(0, 0)'
  }, [sel, origin])

  useEffect(() => {
    // Desktop only. There the rail stays put and the panel opens underneath it,
    // so it can land off-screen. On mobile NOTHING may move the page: tapping
    // an issue has to leave the viewport exactly where it was, same rule as the
    // party tiles (tapping one swaps text, never scroll position).
    if (!sel || !panelRef.current) return
    if (window.matchMedia('(max-width: 767px)').matches) return
    panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [sel])

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
      {/* Two different topic pickers, swapped by breakpoint (mobile-only redesign —
          desktop keeps the original card rail untouched):
          - Mobile: small bordered rectangles, title + an "imprinted" icon only,
            wrapping naturally. Tapping one collapses the whole grid away (each
            chip shrinks toward its top-left, bottom-right chips leaving first)
            and the comparison container bubbles open in its place, headed by a
            back chip on the left and the chosen issue on the right.
          - Desktop: unchanged horizontal rail with ‹ › arrow buttons. */}
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
        .pe-topic-rail-wrap { display: none; }
        .pe-mobile { display: block; }
        /* Mobile panel borrows the party identity card's look: thick border in
           the live party colour (fed in as --pe-accent). Bubbles open from its
           top-left corner, so it grows into the space the chips just vacated. */
        .pe-panel {
          margin-top: 10px;
          border: 4px solid var(--pe-accent, #e9e7e2); border-radius: 16px;
          transform-origin: 0 0;
          /* Opens DURING the grid collapse on purpose. Because the chips above
             are still closing, the panel's whole layout box is sliding upward
             while it scales in, and that rising motion is what makes it read
             as popping up from the bottom. Delaying it past the collapse kills
             that and it grows downward instead — which we tried and reverted. */
          animation: pe-bubble-in .5s cubic-bezier(.34, 1.5, .64, 1) 240ms both;
        }
        .pe-panel-close { display: none; }
        .pe-open-head {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; flex-wrap: wrap;
        }
        /* Only the back button fades in — the issue chip beside it travels up
           from wherever it was tapped, so it must NOT be animated here. */
        .pe-back-chip {
          transform-origin: 0 0;
          animation: pe-bubble-in .4s cubic-bezier(.34, 1.56, .64, 1) 60ms both;
        }
        @keyframes pe-bubble-in {
          0%   { opacity: 0; transform: scale(.72) translate(-10px, -10px); }
          55%  { opacity: 1; }
          100% { opacity: 1; transform: scale(1) translate(0, 0); }
        }
        @media (min-width: 768px) {
          .pe-rail-hint { display: none; }
          .pe-rail-arrow { display: flex; }
          .pe-topic-rail-wrap { display: block; }
          .pe-mobile { display: none; }
          .pe-panel-close { display: flex; }
          .pe-panel {
            margin-top: 18px; border: 1px solid ${BORDER}; border-radius: 18px;
            animation: none;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .pe-panel, .pe-back-chip { animation: none; }
          /* !important because the collapse/expand timings are inline styles
             (they flip direction per state), which a plain rule can't beat. */
          .pe-mobile, .pe-mobile * { transition: none !important; }
        }
      `}</style>

      {/* ── Mobile picker ─────────────────────────────────────────────────── */}
      <div className="pe-mobile">
        {/* Open state FIRST in the DOM, deliberately. Sitting above the grid
            means its layout position is already final the moment it mounts —
            nothing below it can push it around — which is what makes the FLIP
            below land on the right target. */}
        {sel && (
          <div className="pe-open-head">
            <button
              className="pe-back-chip"
              onClick={() => setSel(null)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '9px 13px', borderRadius: 12, border: `2px solid ${INK}`,
                background: '#fff', cursor: 'pointer', fontFamily: MANROPE,
                fontSize: 14, fontWeight: 800, color: INK, whiteSpace: 'nowrap',
              }}
            >
              <ChevronLeft style={{ width: 15, height: 15 }} /> Other issues
            </button>
            {/* Not a second chip that fades in — this one starts life at the
                exact screen position of the chip you tapped and glides up into
                place (see the FLIP in useLayoutEffect). */}
            <div ref={headChipRef} style={{ display: 'inline-flex' }}>
              <TopicChip topicKey={sel} active onClick={() => setSel(null)} />
            </div>
          </div>
        )}

        {/* The full grid. Collapses to zero height (grid-template-rows 1fr → 0fr)
            while every chip scales down toward its own top-left, staggered in
            reverse so the bottom-right of the block empties first. */}
        <div style={{
          display: 'grid',
          gridTemplateRows: sel ? '0fr' : '1fr',
          transition: sel
            ? 'grid-template-rows .40s cubic-bezier(.4, 0, .2, 1) 120ms'
            : 'grid-template-rows .44s cubic-bezier(.34, 1.4, .64, 1)',
        }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {topicKeys.map((key, i) => {
                const out = sel !== null
                // The tapped chip vanishes instantly: the flying copy in the
                // head row is already covering it pixel-for-pixel, so animating
                // this one too would just look like a duplicate.
                const tapped = out && sel === key
                const delay = out ? (topicKeys.length - 1 - i) * 14 : 100 + i * 15
                return (
                  <TopicChip
                    key={key}
                    topicKey={key}
                    active={false}
                    onClick={(e) => openTopic(key, e.currentTarget)}
                    style={{
                      transform: out ? 'scale(.34) translate(-14px, -14px)' : 'scale(1) translate(0, 0)',
                      opacity: out ? 0 : 1,
                      pointerEvents: out ? 'none' : 'auto',
                      transition: tapped
                        ? 'none'
                        : out
                          ? `transform .24s cubic-bezier(.45, 0, .75, .5) ${delay}ms, opacity .2s linear ${delay}ms`
                          : `transform .44s cubic-bezier(.34, 1.56, .64, 1) ${delay}ms, opacity .26s ease ${delay}ms`,
                    }}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop — original horizontal rail, unchanged. */}
      <div className="pe-topic-rail-wrap">
        <div className="pe-rail-hint" style={{ alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: TERTIARY, fontFamily: MANROPE, margin: '-2px 0 10px' }}>
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
                  <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 4 }}>{t.label}</div>
                  <div style={{ fontSize: 14, color: SECONDARY, lineHeight: 1.5 }}>{t.description}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: on ? INK : JADE, display: 'flex', alignItems: 'center', gap: 3 }}>
                    {on ? 'Hide' : 'Compare'} <ChevronDown style={{ width: 12, height: 12, transform: on ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                  </span>
                </div>
              </button>
            )
          })}
          </div>
        </div>
      </div>

      {sel && selTopic && (
        <div
          ref={panelRef}
          className="pe-panel"
          style={{
            // Consumed by .pe-panel's mobile border rule — keeps the container
            // in step with the party colour cycling at the top of the page.
            ['--pe-accent' as string]: accentColor,
            background: '#fff', padding: '18px clamp(14px, 4vw, 22px)', scrollMarginTop: 80,
          } as React.CSSProperties}
        >
          {/* No title/subtitle here — the chip above the container already names
              the issue, and the "ON {TOPIC}" eyebrow names it again inside.
              Hidden on mobile: the "Other issues" back chip is the close
              affordance there, so two would just be clutter. */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setSel(null)} aria-label="Close" className="pe-panel-close" style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 6, cursor: 'pointer', color: SECONDARY, flexShrink: 0, marginBottom: 10 }}>
              <X style={{ width: 15, height: 15 }} />
            </button>
          </div>

          {topicsWithData.has(sel) ? (
            shown && (
              // Crossfades on the cycle's own clock, so while the tiles are
              // still rolling the stance swaps mid-fade rather than hard-cutting.
              <div style={{ opacity: fading ? 0 : 1, transition: `opacity ${fadeMs}ms ease-in-out` }}>
                <FocusedCard slug={shown} pos={getPos(shown)} topic={sel} topicLabel={selTopic.label} />
              </div>
            )
          ) : (
            <p style={{ fontSize: 15, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.55, margin: 0 }}>
              Party positions on {selTopic.label.toLowerCase()} are being sourced from official policy and editor-checked — they’ll appear here soon.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/** Break a plain-language summary into one bullet per sentence.
 *  Splits only where a sentence really ends — punctuation preceded by a
 *  lowercase letter/digit and followed by a capital — so initialisms like
 *  "N.Z." stay in one piece instead of becoming their own bullets. */
function toBullets(text: string | null | undefined): string[] {
  if (!text) return []
  return text
    .split(/(?<=[a-z0-9)”"'][.!?])\s+(?=[A-Z“"'])/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Party colours are chosen to work as big fills, not as small text. ACT's
 *  yellow on a white panel is effectively invisible at 12px, so anything too
 *  light gets scaled down to a readable version of the same hue rather than
 *  swapped for a different colour. Dark party colours pass through untouched. */
function readableOnWhite(hex: string): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  if (lum <= 0.5) return hex
  const k = 0.42 / lum
  const hx = (v: number) => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0')
  return `#${hx(r)}${hx(g)}${hx(b)}`
}

/** The chosen party's stance on the open topic. Sits directly in the panel —
 *  no nested card of its own, since the panel already carries the party's
 *  colour on its border and names the party in its heading. */
function FocusedCard({ slug, pos, topic, topicLabel }: {
  slug: PartySlug
  pos: PartyPosition | undefined
  topic: string
  topicLabel: string
}) {
  const party = PARTY_PROFILES[slug]
  const c = party.color
  const body = pos?.summaryBasic || pos?.summary
  const bullets = pos?.stance ? toBullets(body) : []

  if (!pos) {
    return (
      <p style={{ fontSize: 16, color: TERTIARY, lineHeight: 1.55, margin: 0, fontFamily: MANROPE }}>
        No {topicLabel.toLowerCase()} position captured yet for {party.name} — being sourced from official policy, then editor-checked.
      </p>
    )
  }

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: readableOnWhite(c), marginBottom: 7, fontFamily: MANROPE }}>{party.name}: {topicLabel}</div>
      <p style={{ fontSize: 20, fontWeight: 700, color: INK, lineHeight: 1.35, margin: '0 0 12px', fontFamily: MANROPE }}>{pos.stance || body}</p>

      {/* One bullet per sentence — easier to scan than a wall of prose, which
          is the whole point for a reader who doesn't follow politics closely. */}
      {bullets.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '0 0 14px', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {bullets.map((b, i) => (
            <li key={i} style={{ display: 'flex', gap: 11, fontSize: 17, color: '#33373f', lineHeight: 1.55, fontFamily: MANROPE }}>
              <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: c, flexShrink: 0, marginTop: 9 }} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      {pos.quote && (
        <p style={{ fontSize: 15, color: SECONDARY, lineHeight: 1.5, margin: '0 0 12px', paddingLeft: 11, borderLeft: `3px solid ${c}`, fontStyle: 'italic', fontFamily: MANROPE }}>“{pos.quote}”</p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
        <Link href={`/policies/${topic}/${slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 15, fontWeight: 800, color: INK, textDecoration: 'none', fontFamily: MANROPE }}>
          Full breakdown <ArrowRight style={{ width: 15, height: 15 }} />
        </Link>
      </div>

      {/* Source link sits last — it's the footnote for everything above it. */}
      {pos.sourceUrl && (
        <a href={pos.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 700, color: JADE, textDecoration: 'none', fontFamily: MANROPE, marginTop: 12 }}>
          {pos.sourceLabel} <ExternalLink style={{ width: 12, height: 12 }} />
        </a>
      )}
    </div>
  )
}
