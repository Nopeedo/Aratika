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
import {
  ChevronDown, ChevronLeft, ChevronRight, ArrowRight, X, ExternalLink, Quote,
  Home, Heart, Leaf, GraduationCap, Scale, Globe, Landmark, Wind, TrendingUp, Users,
} from 'lucide-react'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import { PARTY_PROFILES } from '@/constants/parties-data'
import { getProposalGrouping, type GroupedProposal } from '@/constants/policy-proposal-groups'
import { TopicChip } from '@/components/homepage/topic-chip'
import { isLightHex } from '@/components/homepage/battleground-card'
import { usePartyCycle } from '@/components/homepage/party-cycle'
import type { PartySlug } from '@/types'
import type { PartyPosition } from '@/lib/positions/live'
import { BORDER, INK, JADE, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

const TOPIC_ICONS: Record<string, React.ElementType> = { Home, Heart, TrendingUp, Leaf, GraduationCap, Scale, Globe, Landmark, Wind, Users }

// Mobile open sequence. The chip that flies up into the head row and the panel
// that opens below it must SETTLE ON THE SAME FRAME, so the chip's flight time
// is the panel's delay plus its duration. Derived, not hand-tuned twice — the
// two drift apart the moment anyone edits one of them in isolation.
const PANEL_DELAY = 240, PANEL_DUR = 500
const CHIP_FLIGHT = PANEL_DELAY + PANEL_DUR

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
  const { panelSlug, accentColor, fading, fadeMs, select } = usePartyCycle()
  const shown = panelSlug && PARTY_PROFILES[panelSlug as PartySlug] ? (panelSlug as PartySlug) : null
  const panelRef = useRef<HTMLDivElement>(null)

  // Where on screen the tapped chip was, so the copy in the head row can start
  // there and travel — rather than one chip vanishing and another appearing.
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null)
  // A topic whose chip is currently flying back down to its slot in the grid.
  // The head row stays mounted (and out of flow) for the length of that flight.
  const [returning, setReturning] = useState<string | null>(null)
  const [pinTop, setPinTop] = useState(0)
  const headChipRef = useRef<HTMLDivElement>(null)
  const headRowRef = useRef<HTMLDivElement>(null)
  const gridChipRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const openTopic = (key: string, el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    setOrigin({ x: r.left, y: r.top })
    setReturning(null)
    setSel(key)
    // Freeze on whichever party is on screen right now. Without this, a
    // reader who never explicitly picked a party (still on the auto-cycling
    // clock) could have the content roll to a different party mid-read —
    // opening an issue is exactly the moment they've committed to reading,
    // so the party showing at that instant is the one that should stay put.
    // No-op if a party's already locked in.
    if (panelSlug) select(panelSlug)
  }

  const closeTopic = () => {
    const row = headRowRef.current
    if (!sel || !row) { setSel(null); return }
    // Take the head row out of flow, pinned where it already is, so the grid
    // can reclaim its space without the row jumping — and so the grid chips
    // measure at their true final positions while the flight is in progress.
    setPinTop(row.offsetTop)
    setReturning(sel)
    setSel(null)
  }

  // FLIP out: the head chip has already been laid out in its final slot, so
  // invert it back onto the tapped chip's position and play it forward to
  // identity. Runs in useLayoutEffect so the inverted transform is painted on
  // the first frame — in a plain useEffect it would flash at the destination.
  useLayoutEffect(() => {
    const el = headChipRef.current
    if (!el || !origin || !sel) return
    const r = el.getBoundingClientRect()
    const dx = origin.x - r.left, dy = origin.y - r.top
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return
    el.style.transition = 'none'
    el.style.transform = `translate(${dx}px, ${dy}px)`
    void el.offsetWidth // flush the inverted position before playing forward
    // Starts on tap (immediate feedback) and runs the panel's full delay +
    // duration, so chip and container come to rest together.
    el.style.transition = `transform ${CHIP_FLIGHT}ms cubic-bezier(.34, 1.32, .64, 1)`
    el.style.transform = 'translate(0, 0)'
  }, [sel, origin])

  // FLIP back: same trick in reverse. The grid chips report their true resting
  // rects even while the grid is still clipped open — the row is out of flow by
  // now, and the chips are laid out at full size inside an overflow:hidden box,
  // so their offsets are already final. That's what makes this measurable up
  // front instead of having to wait for the expand to finish.
  useLayoutEffect(() => {
    if (!returning) return
    const el = headChipRef.current
    const target = gridChipRefs.current[returning]
    if (!el || !target) { setReturning(null); return }
    const from = el.getBoundingClientRect(), to = target.getBoundingClientRect()
    el.style.transition = 'none'
    el.style.transform = 'translate(0, 0)'
    void el.offsetWidth
    el.style.transition = `transform ${CHIP_FLIGHT}ms cubic-bezier(.34, 1.32, .64, 1)`
    el.style.transform = `translate(${to.left - from.left}px, ${to.top - from.top}px)`
    const id = setTimeout(() => {
      // Reveal the real chip in the same frame the flyer is unmounted. Done on
      // the node rather than by state alone because the re-render re-applies
      // the grid's staggered fade-in transition — the chip would ease from 0
      // over ~half a second and leave a visible hole where it just landed.
      // Writing opacity:1 first means that render is a no-op for opacity.
      const btn = gridChipRefs.current[returning]?.querySelector('button')
      if (btn instanceof HTMLElement) {
        btn.style.transition = 'none'
        btn.style.opacity = '1'
        // Flush it. Without a forced recalc the browser folds this write and
        // React's re-render into a single style resolution, sees opacity go
        // 0 → 1 with the staggered transition already reattached, and fades
        // it in anyway — which is the hole this is meant to close.
        void btn.offsetWidth
      }
      setReturning(null)
    }, CHIP_FLIGHT)
    return () => clearTimeout(id)
  }, [returning])

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
        /* relative so the head row can be pinned out of flow while its chip
           flies back down into the grid on close. */
        .pe-mobile { display: block; position: relative; }
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
          animation: pe-bubble-in ${PANEL_DUR}ms cubic-bezier(.34, 1.5, .64, 1) ${PANEL_DELAY}ms both;
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
        {(sel || returning) && (
          <div
            className="pe-open-head"
            ref={headRowRef}
            style={returning ? { position: 'absolute', top: pinTop, left: 0, right: 0 } : undefined}
          >
            <button
              className="pe-back-chip"
              onClick={closeTopic}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '9px 13px', borderRadius: 12, border: `2px solid ${INK}`,
                background: '#fff', cursor: 'pointer', fontFamily: MANROPE,
                fontSize: 14, fontWeight: 800, color: INK, whiteSpace: 'nowrap',
                opacity: returning ? 0 : 1, transition: 'opacity .18s ease',
                // Kill the entrance animation on the way out: a finished
                // animation with fill-mode:both keeps asserting opacity:1 and
                // outranks inline styles, so the fade would never happen.
                animation: returning ? 'none' : undefined,
              }}
            >
              <ChevronLeft style={{ width: 15, height: 15 }} /> Other issues
            </button>
            {/* Not a second chip that fades in — this one starts life at the
                exact screen position of the chip you tapped and glides up into
                place, then flies back down into that same slot on close (see
                the two FLIPs in useLayoutEffect). */}
            <div ref={headChipRef} style={{ display: 'inline-flex' }}>
              <TopicChip topicKey={(sel ?? returning) as string} active onClick={closeTopic} />
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
                // Instant, no transition, in both directions: on the way out the
                // flying copy already covers this chip pixel-for-pixel, and on
                // the way back the flight lands on it before it's revealed. Any
                // animation here would just read as a duplicate.
                const swapped = (out && sel === key) || returning === key
                const delay = out ? (topicKeys.length - 1 - i) * 14 : 100 + i * 15
                return (
                  <div
                    key={key}
                    // Measured as the flight target on close. The wrapper hugs
                    // the chip and carries no transform of its own, so its rect
                    // is the chip's true resting position even while the chip
                    // inside is scaled down mid-animation.
                    ref={(el) => { gridChipRefs.current[key] = el }}
                    style={{ display: 'inline-flex' }}
                  >
                    <TopicChip
                      topicKey={key}
                      active={false}
                      onClick={(e) => openTopic(key, e.currentTarget)}
                      style={{
                        transform: out ? 'scale(.34) translate(-14px, -14px)' : 'scale(1) translate(0, 0)',
                        opacity: out || returning === key ? 0 : 1,
                        pointerEvents: out ? 'none' : 'auto',
                        transition: swapped
                          ? 'none'
                          : out
                            ? `transform .24s cubic-bezier(.45, 0, .75, .5) ${delay}ms, opacity .2s linear ${delay}ms`
                            : `transform .44s cubic-bezier(.34, 1.56, .64, 1) ${delay}ms, opacity .26s ease ${delay}ms`,
                      }}
                    />
                  </div>
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
                  if (!on) {
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
                    // Same freeze as the mobile path — opening an issue locks
                    // whichever party is on screen right now, so it can't roll
                    // to a different party mid-read.
                    if (panelSlug) select(panelSlug)
                  }
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
                <FocusedCard slug={shown} pos={getPos(shown)} topicLabel={selTopic.label} />
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

// Words that tend to introduce the supporting half of a proposal — the
// method/purpose/target clause — rather than the core action itself.
// Deliberately narrow: "of"/"in"/"and"/"the" etc. are left out because they
// show up mid-action too often ("investment in major infrastructure" should
// stay whole) and would chop leads down to almost nothing.
const LEAD_SPLIT_WORDS = new Set(['to', 'with', 'through', 'where', 'for', 'so', 'by', 'without', 'under', 'within', 'from', 'using', 'while'])

/** Bold the action, leave the rest at normal weight — no words added,
 *  removed, or reordered, purely a type-weight split so the eye catches the
 *  verb+object first. Bold is capped at the first sentence, full stop: a
 *  clause boundary (;:.!?) ends it even if no split word ever appears, so a
 *  compound proposal like "Equal rights for all; remove race-based policies
 *  and co-governance" can't render fully bold end to end. Whichever comes
 *  first — a split word, or the end of the first clause — wins. Split words
 *  only count from the 3rd word on (a lead is never one or two words); a
 *  clause boundary counts as soon as it appears, since a genuine sentence
 *  end is a stronger signal than the minimum-lead-length guard. */
function splitLead(text: string): [string, string] {
  const words = text.split(' ')
  for (let i = 1; i < words.length; i++) {
    const bare = words[i].toLowerCase().replace(/[^a-z']/g, '')
    if (i >= 2 && LEAD_SPLIT_WORDS.has(bare)) {
      return [words.slice(0, i).join(' '), words.slice(i).join(' ')]
    }
    if (/[;:.!?]$/.test(words[i - 1])) {
      return [words.slice(0, i).join(' '), words.slice(i).join(' ')]
    }
  }
  return [text, '']
}

/** Bold only what actually fits on the FIRST RENDERED LINE, never more — a
 *  word/grammar heuristic (like splitLead above) can't guarantee that: "Define
 *  Treaty of Waitangi principles in law based on the 1840 text, including
 *  equal rights" is a grammatically fine lead but spans three lines. There's
 *  no way to know where a line actually breaks without asking the browser —
 *  it depends on the panel's real width, the font, and every word's own
 *  length — so this measures it with the Range API instead of guessing.
 *
 *  A hidden clone of the text (absolutely positioned, so it doesn't affect
 *  layout) sits behind the visible bold/regular split. After every layout —
 *  first paint and on resize — it walks word boundaries, extending a Range
 *  over the clone and checking getClientRects().length: more than one rect
 *  means that word pushed the range onto a second line. The last word that
 *  still reported a single rect is where bold stops. Runs in
 *  useLayoutEffect so the measurement lands before the browser paints —
 *  a plain useEffect would flash the fallback (fully bold) for one frame. */
function FirstLineBold({ text, style }: { text: string; style: React.CSSProperties }) {
  const measureRef = useRef<HTMLSpanElement>(null)
  const [boldEnd, setBoldEnd] = useState(text.length)

  useLayoutEffect(() => {
    const node = measureRef.current?.firstChild
    if (!node || node.nodeType !== Node.TEXT_NODE) return

    const measure = () => {
      const range = document.createRange()
      let lastFits = 0
      let cursor = 0
      const words = text.split(' ')
      for (let i = 0; i < words.length; i++) {
        cursor += words[i].length
        range.setStart(node, 0)
        range.setEnd(node, Math.min(cursor, text.length))
        if (range.getClientRects().length > 1) break
        lastFits = cursor
        cursor += 1 // the space before the next word
      }
      // Always bold at least the first word, even on a panel too narrow for
      // it to fully fit — an empty bold lead would look like the rule broke.
      setBoldEnd(lastFits || words[0]?.length || text.length)
    }

    measure()
    const panel = measureRef.current?.closest('.pe-panel')
    if (!panel) return
    const ro = new ResizeObserver(measure)
    ro.observe(panel)
    return () => ro.disconnect()
  }, [text])

  const lead = text.slice(0, boldEnd)
  const rest = text.slice(boldEnd).trim()

  return (
    // display:block (not the default inline) so the absolutely-positioned
    // measuring clone below inherits the real line width from its parent —
    // an inline position:relative box has no reliable width for inset:0 to
    // stretch against, which was silently shrinking the clone to ~one word
    // and made every bullet measure as wrapping almost immediately.
    <span style={{ position: 'relative', display: 'block' }}>
      <span ref={measureRef} aria-hidden style={{ ...style, position: 'absolute', inset: 0, visibility: 'hidden', pointerEvents: 'none' }}>{text}</span>
      <span style={{ fontWeight: 700 }}>{lead}</span>
      {rest && <>{' '}<span style={{ fontWeight: 400 }}>{rest}</span></>}
    </span>
  )
}

/** The "{Party} on {Topic}" title above the stance headline needs to read big
 *  ("Free up land and fund infrastructure" scale) for a short pairing like
 *  "ACT on Health", but "Te Pāti Māori on Treaty & Māori Affairs" at that
 *  same size wraps and crowds the panel's rounded corners on a 375px phone.
 *  No single fixed size works for both, so this scales down by character
 *  count instead — a deterministic approximation (avg uppercase-bold glyph
 *  width ≈ 0.66× font-size) rather than a runtime canvas measurement, so
 *  it's server-render-safe and needs no post-hydration size-flash. Tuned so
 *  the shortest pairings sit at the "much bigger" size that was asked for,
 *  and the longest still lands on one line on the narrowest phone panel. */
function fitTitleSize(text: string): number {
  const MAX = 26, MIN = 13, SAFE_WIDTH = 300, GLYPH_RATIO = 0.66
  return Math.max(MIN, Math.min(MAX, SAFE_WIDTH / (text.length * GLYPH_RATIO)))
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

/** A tappable title that expands downward to reveal its content — the "what
 *  they'll do" / "how this affects you" breakdown inside an open issue panel.
 *  Uses the same grid-template-rows collapse trick as the mobile topic grid
 *  above, for a smooth height animation without measuring pixel heights.
 *  Filled with the current party's own colour rather than a fixed jade, so it
 *  reads as part of that party's panel rather than a generic site colour. The
 *  fill and text stay IDENTICAL open vs closed — no pressed-state darkening —
 *  the chevron flip is the only thing that signals state.
 *  ACT's yellow (and any other light party colour) is too washed out for
 *  white text, so the text/icon flip to dark ink on light fills — same
 *  isLightHex threshold already used for this exact problem on battleground
 *  cards and the party tiles, kept here rather than reintroducing it. */
/** The detail behind a merged proposal.
 *
 *  Deliberately quieter than ExpandableSection below: a plain text toggle with
 *  no fill, sized under the proposal it belongs to rather than across the whole
 *  panel. That section is a destination — this is a footnote on one line, and a
 *  second full-width coloured bar competing with "Full Breakdown" would read as
 *  the more important of the two.
 *
 *  Connected to its proposal by the rule down the left of the opened detail, so
 *  it's clear the points belong to the line above and not to the panel. */
function SeeMore({ details, accent }: { details: string[]; accent: string }) {
  const [open, setOpen] = useState(false)
  const tone = readableOnWhite(accent)
  return (
    <div style={{ marginTop: 7 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
          padding: 0, cursor: 'pointer', fontFamily: MANROPE, fontSize: 14.5, fontWeight: 700, color: tone,
        }}
      >
        {open ? 'Show less' : 'See more'}
        <ChevronDown style={{ width: 14, height: 14, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s ease' }} />
      </button>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows .3s ease' }}>
        <div style={{ overflow: 'hidden' }}>
          <ul style={{
            listStyle: 'none', margin: '10px 0 0', padding: '2px 0 2px 13px',
            borderLeft: `2px solid ${accent}33`,
            display: 'flex', flexDirection: 'column', gap: 9,
          }}>
            {details.map((d) => (
              <li key={d} style={{ fontSize: 16, fontWeight: 400, color: '#3f372f', lineHeight: 1.45, fontFamily: MANROPE }}>{d}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function ExpandableSection({ icon: Icon, title, accent, defaultOpen, children }: {
  icon: React.ElementType
  title: string
  accent: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(!!defaultOpen)
  const fg = isLightHex(accent) ? INK : '#fff'
  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
          background: accent, color: fg, borderRadius: 999, border: 'none',
          padding: '12px 18px', cursor: 'pointer', fontFamily: MANROPE, textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Icon style={{ width: 17, height: 17, color: fg, flexShrink: 0 }} />
          <span style={{ fontSize: 16, fontWeight: 800, color: fg, fontFamily: MANROPE }}>{title}</span>
        </span>
        <ChevronDown style={{ width: 16, height: 16, color: fg, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s ease' }} />
      </button>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows .3s ease' }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ paddingTop: 14, paddingLeft: 4, paddingRight: 4 }}>{children}</div>
        </div>
      </div>
    </div>
  )
}

/** The chosen party's stance on the open topic. Sits directly in the panel —
 *  no nested card of its own, since the panel already carries the party's
 *  colour on its border and names the party in its heading. */
function FocusedCard({ slug, pos, topicLabel }: {
  slug: PartySlug
  pos: PartyPosition | undefined
  topicLabel: string
}) {
  const party = PARTY_PROFILES[slug]
  const c = party.color
  const body = pos?.summaryBasic || pos?.summary
  // The same editor-written keyProposals the full breakdown page lists under
  // "What they say they'll do" — short, already one action per line. Preferred
  // over slicing the summary prose into sentences, which produced longer, more
  // meandering bullets. Falls back to that split only where a position has no
  // keyProposals captured yet, so the panel is never left empty.
  const bullets = pos?.keyProposals.length ? pos.keyProposals : (pos?.stance ? toBullets(body) : [])
  // Where several proposals are really one policy, a curated grouping says how
  // they read as one — see constants/policy-proposal-groups.ts. Absent one, the
  // panel shows the raw keyProposals exactly as before.
  const grouping = pos ? getProposalGrouping(pos.topic, slug) : null
  const items: GroupedProposal[] = grouping?.proposals ?? bullets
  // Verbatim only — excerpts/quote are the two fields the ingestion script
  // mechanically verifies as exact substrings of the party's own published
  // text (see scripts/draft-positions.mjs). keyProposals/stance/summary are
  // still a faithful AI paraphrase of that same text, fine for reporting a
  // claim in plain language — but quotes are the one thing on this panel with
  // zero synthesis in the loop. Merge quote in only if it isn't already one
  // of the excerpts, so nothing repeats.
  const quotes = pos ? [...pos.excerpts, ...(pos.quote && !pos.excerpts.includes(pos.quote) ? [pos.quote] : [])] : []

  if (!pos) {
    return (
      <p style={{ fontSize: 16, color: TERTIARY, lineHeight: 1.55, margin: 0, fontFamily: MANROPE }}>
        No {topicLabel.toLowerCase()} position captured yet for {party.name} — being sourced from official policy, then editor-checked.
      </p>
    )
  }

  return (
    <div>
      <div style={{ fontSize: fitTitleSize(`${party.name} on ${topicLabel}`), fontWeight: 800, letterSpacing: '.01em', textTransform: 'uppercase', color: readableOnWhite(c), marginBottom: 10, fontFamily: MANROPE, lineHeight: 1.15, whiteSpace: 'nowrap' }}>{party.name} on {topicLabel}</div>
      {/* The stance headline is gone from the top of the panel. It restated the
          proposals directly beneath it — Labour's housing stance read "Capital
          gains tax on investment property; solar help for renters and
          homeowners" above bullets saying exactly those two things — so it cost
          a reader a paragraph before any actual content.

          It stays as the fallback when a position has no proposals to list, so
          a thin topic still says something rather than rendering a heading over
          nothing. Coverage is partial by design (see the "x of y topics
          captured" note), so that case is live, not theoretical. */}
      {items.length === 0 && (() => {
        // Lead/rest split, so a compound stance like "Equal rights for all;
        // remove race-based policies and co-governance" doesn't render bold
        // end to end.
        const [headLead, headRest] = splitLead(pos.stance || body || '')
        return (
          <p style={{ fontSize: 20, color: INK, lineHeight: 1.35, margin: 0, fontFamily: MANROPE }}>
            <span style={{ fontWeight: 700 }}>{headLead}</span>
            {headRest && <>{' '}<span style={{ fontWeight: 400 }}>{headRest}</span></>}
          </p>
        )
      })()}

      {/* The proposals are now the first thing under the panel title — no
          heading above or below them, no dot markers, no smaller or greyer
          body copy. Each reads at full weight, stacked as its own short line.
          The 4px top margin replaces the 16px that used to clear the stance
          headline; the two never render together.

          Text is exactly what keyProposals contains, unedited — shortening it
          would mean the site rewording the party's own claim, which we ruled
          out. Merging several into one is done in policy-proposal-groups.ts,
          where it's stated explicitly rather than derived. */}
      {items.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '4px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.map((it, i) => {
            const liStyle: React.CSSProperties = { fontSize: 20, color: INK, lineHeight: 1.35, fontFamily: MANROPE }
            const text = typeof it === 'string' ? it : it.headline
            return (
              <li key={i} style={liStyle}>
                <FirstLineBold text={text} style={liStyle} />
                {typeof it !== 'string' && <SeeMore details={it.details} accent={c} />}
              </li>
            )
          })}
        </ul>
      )}

      {/* "In their own words" stays a real tap-to-expand section — dropped:
          a "who this affects" section, because that field is the model
          CONSTRUCTING an impact read rather than transcribing one — the party
          never said it, so it doesn't belong on a panel that's meant to be
          their claim and nothing else. */}

      {quotes.length > 0 && (
        <ExpandableSection icon={Quote} title="Full Breakdown" accent={c} defaultOpen>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {quotes.map((q, i) => (
              <blockquote key={i} style={{ margin: 0, paddingLeft: 11, borderLeft: `3px solid ${c}`, fontSize: 15, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, fontStyle: 'italic' }}>“{q}”</blockquote>
            ))}
          </div>
        </ExpandableSection>
      )}

      {/* Source link sits last — it's the footnote for everything above it. */}
      {pos.sourceUrl && (
        <a href={pos.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 700, color: JADE, textDecoration: 'none', fontFamily: MANROPE, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
          {pos.sourceLabel} <ExternalLink style={{ width: 12, height: 12 }} />
        </a>
      )}
    </div>
  )
}
