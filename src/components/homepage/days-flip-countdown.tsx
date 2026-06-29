'use client'

/**
 * DaysFlipCountdown — true split-flap ("flip clock") display of DAYS until the
 * 2026 General Election. Three zero-padded digit cards (e.g. 103 → 1 0 3).
 *
 * On load every ticker rolls (each digit counts DOWN through its own sequence so
 * all three move plenty), and they LAND left → right — hundreds first, units
 * last — so just before it settles you read 1 0 4 → 1 0 3. The roll is a constant
 * speed, then EASES into a slow final landing fold. Honours prefers-reduced-
 * motion. Day-count is computed on the client (useEffect) to avoid a hydration
 * mismatch and shares ELECTION_DATE with ElectionCountdown so the two stay synced.
 */

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { ELECTION_DATE } from '@/components/homepage/election-countdown'

const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const INK = '#2A1206'
const CARD_TOP = '#ffffff'
const CARD_BOT = '#f4f1ec'
const BORDER = '#e6e2da'

const W = 46, H = 58, HALF = H / 2
const ROLL = 70                   // ms per fold — CONSTANT speed for the roll
const TAIL = [140, 340, 1750]     // EASE into the slow final landing fold
const HEAD = 6                    // constant-speed folds before the easing tail (more roll on every ticker)
const STEPS = HEAD + TAIL.length  // folds per digit
const STAGGER = 150               // per-digit offset → land left → right (units lands last)
const durationFor = (k: number) => (k <= HEAD ? ROLL : TAIL[k - HEAD - 1])

function daysToElection() {
  return Math.max(0, Math.ceil((ELECTION_DATE.getTime() - Date.now()) / 86_400_000))
}

const numStyle: React.CSSProperties = {
  height: H, lineHeight: `${H}px`, fontSize: 34, fontWeight: 800, color: INK,
  fontFamily: MANROPE, fontVariantNumeric: 'tabular-nums', textAlign: 'center', width: W,
}

function Half({ d, side }: { d: string; side: 'top' | 'bottom' }) {
  const wrap: React.CSSProperties = side === 'top'
    ? { position: 'absolute', left: 0, right: 0, top: 0, height: HALF, overflow: 'hidden', borderRadius: '9px 9px 0 0', background: CARD_TOP, borderBottom: '1px solid rgba(42,18,6,.10)' }
    : { position: 'absolute', left: 0, right: 0, bottom: 0, height: HALF, overflow: 'hidden', borderRadius: '0 0 9px 9px', background: CARD_BOT }
  const inner: React.CSSProperties = side === 'top' ? { position: 'absolute', top: 0, left: 0 } : { position: 'absolute', bottom: 0, left: 0 }
  return <div style={wrap}><div style={{ ...numStyle, ...inner }}>{d}</div></div>
}

function SplitFlapDigit({ target, startDelay, animate }: { target: string; startDelay: number; animate: boolean }) {
  const [cur, setCur] = useState(target)
  const [prev, setPrev] = useState(target)
  const [dur, setDur] = useState(ROLL)
  const [flip, setFlip] = useState(0)
  const curRef = useRef(target)

  useEffect(() => {
    if (!animate) { setCur(target); setPrev(target); curRef.current = target; setFlip(0); return }
    const t = parseInt(target, 10)
    if (Number.isNaN(t)) { setCur(target); setPrev(target); return }
    const start = (t + STEPS) % 10            // start higher, count DOWN to target
    setCur(String(start)); setPrev(String(start)); curRef.current = String(start); setFlip(0)

    const timers: ReturnType<typeof setTimeout>[] = []
    let acc = startDelay
    for (let k = 1; k <= STEPS; k++) {
      const nextVal = String(((start - k) % 10 + 10) % 10)
      const d = durationFor(k)
      timers.push(setTimeout(() => {
        setPrev(curRef.current)
        setCur(nextVal)
        curRef.current = nextVal
        setDur(d)
        setFlip((f) => f + 1)
        timers.push(setTimeout(() => setPrev(nextVal), d))
      }, acc))
      acc += d
    }
    return () => timers.forEach(clearTimeout)
  }, [target, startDelay, animate])

  const flipping = flip > 0

  return (
    <div style={{ position: 'relative', width: W, height: H, borderRadius: 9, border: `1px solid ${BORDER}`, boxShadow: '0 3px 8px rgba(42,18,6,.10)', perspective: 340 }}>
      <Half d={cur} side="top" />
      <Half d={prev} side="bottom" />

      {flipping && (
        <div key={`t${flip}`} style={{ position: 'absolute', inset: 0, zIndex: 3, transformOrigin: '50% 100%', backfaceVisibility: 'hidden', willChange: 'transform', animation: `aratika-flap-down ${dur / 2}ms cubic-bezier(0.45, 0, 0.85, 0.5) forwards` }}>
          <Half d={prev} side="top" />
        </div>
      )}
      {flipping && (
        <div key={`b${flip}`} style={{ position: 'absolute', inset: 0, zIndex: 3, transformOrigin: '50% 0%', backfaceVisibility: 'hidden', willChange: 'transform', transform: 'rotateX(90deg)', animation: `aratika-flap-up ${dur / 2}ms cubic-bezier(0.18, 0.7, 0.24, 1) ${dur / 2}ms forwards` }}>
          <Half d={cur} side="bottom" />
        </div>
      )}

      <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'rgba(42,18,6,.20)', transform: 'translateY(-0.5px)', zIndex: 4 }} />
      <div aria-hidden style={{ position: 'absolute', left: -2, top: '50%', width: 4, height: 10, marginTop: -5, borderRadius: 2, background: '#cfc8bd', zIndex: 4 }} />
      <div aria-hidden style={{ position: 'absolute', right: -2, top: '50%', width: 4, height: 10, marginTop: -5, borderRadius: 2, background: '#cfc8bd', zIndex: 4 }} />
    </div>
  )
}

export function DaysFlipCountdown() {
  const reduce = useReducedMotion()
  const [days, setDays] = useState<number | null>(null)

  useEffect(() => {
    setDays(daysToElection())
    const id = setInterval(() => setDays(daysToElection()), 60 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const digits = days === null ? ['–', '–', '–'] : String(days).padStart(3, '0').split('')
  const animate = days !== null && !reduce

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10 }} aria-label={days === null ? 'Days until the 2026 election' : `${days} days until the 2026 election`}>
      <style>{`
        @keyframes aratika-flap-down { from { transform: rotateX(0deg); } to { transform: rotateX(-90deg); } }
        @keyframes aratika-flap-up { from { transform: rotateX(90deg); } to { transform: rotateX(0deg); } }
      `}</style>
      <div style={{ display: 'flex', gap: 7 }}>
        {digits.map((d, i) => <SplitFlapDigit key={i} target={d} startDelay={i * STAGGER} animate={animate} />)}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: '#9a8a7a', fontFamily: MANROPE }}>
        Days until 2026 elections
      </div>
    </div>
  )
}
