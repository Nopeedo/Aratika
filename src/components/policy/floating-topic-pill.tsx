'use client'

/**
 * FloatingTopicPill — the topic you're reading, pinned bottom-right once the
 * big title pill in the header has scrolled off, with a switcher inside it.
 *
 * On a long topic page the reader is seven cards down before they think
 * "what about housing?", and the chips are back at the top. This keeps the
 * current topic in view and makes the others one tap away: tap the pill and
 * the other ten stack up the right side of the screen, dimmed, as compact
 * copies of the header chips; tap one and it drops down into the pill's
 * place (a FLIP move) as the page navigates — scroll kept, so the reader
 * stays roughly where they were and the pill they land on is the one they
 * chose.
 *
 * Visibility is driven by an IntersectionObserver on the header pill, not a
 * scroll-Y threshold, so it's correct at every viewport height and whatever
 * sits above the pill. The stack closes on navigation, on tap-outside, and
 * on Escape.
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronUp } from 'lucide-react'
import { POLICY_TOPIC_ORDER, POLICY_TOPICS } from '@/constants/policy-topics'
import { TOPIC_ICONS } from '@/constants/policy-topic-icons'
import { TOPIC_BORDER_HEX } from '@/constants/topic-colors'
import { TopicChip } from '@/components/homepage/topic-chip'
import type { PolicyTopic } from '@/types'
import { INK, MANROPE } from '@/constants/theme'

/** Selector for the header pill this floats in for. */
const HEADER_PILL = '.topic-head h2'
/** Where the pill stops: the coverage band. Its own topic headings are right
 *  there, so a floating one is both redundant and in the way of the table. */
const STOP_AT = '#coverage-start'

export function FloatingTopicPill({ topic }: { topic: string }) {
  const t = POLICY_TOPICS[topic as PolicyTopic]
  const [shown, setShown] = useState(false)
  /** True once the coverage band has been reached: the pill stops there. */
  const [reached, setReached] = useState(false)
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Prefetch every other topic once, so a switch from the menu is a swap
  // rather than a fetch. The header chips prefetch themselves as they scroll
  // into view; these are buttons, so they don't. Eleven small RSC payloads.
  useEffect(() => {
    POLICY_TOPIC_ORDER.forEach((k) => { if (k !== topic) router.prefetch(`/policies/${k}`) })
  }, [router, topic])

  // Show when the header pill is out of view.
  useEffect(() => {
    const target = document.querySelector(HEADER_PILL)
    if (!target) return
    const io = new IntersectionObserver(([e]) => {
      setShown(!e.isIntersecting)
      if (e.isIntersecting) setOpen(false)
    }, { threshold: 0 })
    io.observe(target)
    return () => io.disconnect()
  }, [topic])

  /**
   * ...and hide again from the coverage band down. This one is a scroll check,
   * NOT an observer, and the reason is worth recording: an IntersectionObserver
   * reports CHANGES in intersection, and "above the viewport" and "below the
   * viewport" are the same non-intersecting state. Jump between them — which is
   * what tapping a topic and landing at a new scroll position does — and no
   * callback fires at all, so the flag sticks at whatever it was. The pill then
   * stayed hidden for the whole page. Reading the rect on scroll always gives
   * the right answer.
   *
   * rAF-throttled, so it measures once a frame at most, and passive so it never
   * holds up the scroll itself.
   */
  useEffect(() => {
    const stop = document.querySelector(STOP_AT)
    if (!stop) return
    let queued = false
    const measure = () => {
      queued = false
      const top = stop.getBoundingClientRect().top
      const at = top <= window.innerHeight
      setReached(at)
      if (at) setOpen(false)
    }
    const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(measure) } }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll) }
  }, [topic])

  // Close on route change (the topic prop changes — adjust during render
  // rather than in an effect), outside tap, and Escape.
  const [seenTopic, setSeenTopic] = useState(topic)
  if (seenTopic !== topic) { setSeenTopic(topic); setOpen(false) }
  const pillRef = useRef<HTMLButtonElement>(null)
  const [picked, setPicked] = useState<string | null>(null)

  // Tap a chip: fly it down onto the current pill, then navigate. The flight
  // is a transform on the tapped chip only; the rest fade. Navigation waits
  // for the flight so the pill that appears IS the chip that just landed.
  const DROP_MS = 320
  const pick = (key: string, el: HTMLElement) => {
    if (picked) return
    const to = pillRef.current?.getBoundingClientRect()
    const from = el.getBoundingClientRect()
    if (to) {
      const dx = (to.left + to.width / 2) - (from.left + from.width / 2)
      const dy = (to.top + to.height / 2) - (from.top + from.height / 2)
      el.style.transition = `transform ${DROP_MS}ms cubic-bezier(.4, 0, .2, 1), opacity ${DROP_MS}ms ease`
      el.style.transform = `translate(${dx}px, ${dy}px) scale(${to.height / from.height})`
      el.style.opacity = '1'
      el.style.zIndex = '1'
    }
    setPicked(key)
    setTimeout(() => {
      router.push(`/policies/${key}`, { scroll: false })
      setOpen(false)
      setPicked(null)
    }, DROP_MS)
  }
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!t) return null
  const Icon = TOPIC_ICONS[t.icon]
  const hue = t.textColor.match(/text-(\w+)-\d+/)?.[1] ?? 'slate'
  const border = TOPIC_BORDER_HEX[hue] ?? TOPIC_BORDER_HEX.slate
  const others = POLICY_TOPIC_ORDER.filter((k) => k !== topic)
  // Out of view above, and not yet at the coverage band.
  const visible = shown && !reached

  return (
    <div
      ref={rootRef}
      aria-hidden={!visible}
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40,
        pointerEvents: 'none', isolation: 'isolate',
        padding: '0 14px calc(14px + env(safe-area-inset-bottom, 0px))',
        opacity: visible ? 1 : 0,
        // No transform while shown: a transformed ancestor becomes the
        // containing block for position:fixed, which would pin the scrim to
        // this strip instead of the viewport.
        transform: visible ? undefined : 'translateY(12px)',
        transition: 'opacity .2s ease, transform .2s ease',
      }}
    >
      {/* Scrim: only the right side, feathering off to nothing toward the
          left, so the stack reads over the cards without curtaining the
          whole page. Blur is masked with the same feather. Catches the
          tap-outside. */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'auto',
            background: 'linear-gradient(to right, rgba(250,249,246,0) 15%, rgba(250,249,246,.92) 60%)',
            backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
            maskImage: 'linear-gradient(to right, transparent 15%, #000 60%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 15%, #000 60%)',
          }}
        />
      )}

      {/* The other topics, stacked up the RIGHT side above the pill: compact
          copies of the header chips at 60% until touched (.topic-menu in
          globals.css). Rendered only while open so they aren't in the tab
          order the rest of the time. */}
      {open && (
        <div
          className="topic-menu"
          role="menu"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
            marginBottom: 10, pointerEvents: 'auto',
          }}
        >
          {others.map((k) => (
            <TopicChip
              key={k}
              topicKey={k}
              active={false}
              onClick={(e) => pick(k, e.currentTarget)}
              style={picked && picked !== k ? { opacity: 0, transition: 'opacity .2s ease' } : undefined}
            />
          ))}
        </div>
      )}

      {/* The current topic, bottom-right, tappable to open the stack. */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          ref={pillRef}
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={`Current topic: ${t.label}. Choose another topic`}
          tabIndex={visible ? 0 : -1}
          className={t.color}
          style={{
            // Gone the instant a chip is picked, so the chip drops into an
            // empty spot rather than onto the old pill.
            visibility: picked ? 'hidden' : undefined,
            // Same size as the header title pill (page.tsx), so it reads as
            // that pill having moved, not a smaller cousin of it.
            display: 'inline-flex', alignItems: 'center', gap: 12,
            padding: '10px 18px 10px 18px', borderRadius: 999,
            border: `3px solid ${border.active}`,
            boxShadow: '0 4px 14px rgba(12,14,18,.18)',
            fontSize: t.label.length > 16 ? 'clamp(17px, 4.9vw, 30px)' : 'clamp(24px, 6.5vw, 32px)',
            fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.15,
            color: INK, fontFamily: MANROPE, cursor: 'pointer', whiteSpace: 'nowrap',
            // Not clickable while it is invisible: at the coverage band it sits
            // over the table, and an invisible target there would eat taps
            // meant for the cells underneath.
            pointerEvents: visible ? 'auto' : 'none',
          }}
        >
          {Icon && <Icon className={`size-7 ${t.textColor}`} style={{ flexShrink: 0 }} />}
          {t.label}
          <ChevronUp style={{
            width: 22, height: 22, flexShrink: 0, opacity: .7,
            transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease',
          }} />
        </button>
      </div>
    </div>
  )
}
