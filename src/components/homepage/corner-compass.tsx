'use client'

/**
 * CornerCompass — a fixed engagement anchor pinned to the bottom-right corner of
 * the homepage. Only the top-left QUARTER of the compass is visible (its centre
 * sits in the screen corner), so it's present and felt without crowding content.
 *
 * The illusion: the NEEDLE is fixed, always pointing up-left into the content.
 * What actually moves is the ticked outer dial — when the user picks a party tile,
 * the dial spins (ruler ticks streaking past sell the motion) and tunes so that
 * party's slot lands under the fixed needle, easing to a stop with a slight spring
 * wobble like a real compass finding north. The face recolours to the party's
 * colour during the spin. Idle (nothing picked) it rests neutral and quiet.
 *
 * Driven by the shared PartyCycle's `selectedSlug` — i.e. only an explicit user
 * tap, never the idle auto-cycle, so it isn't constantly spinning. Tapping it
 * takes the user to the compass walkthrough (/start). Homepage-only (it needs the
 * PartyCycle context). Honours prefers-reduced-motion.
 */

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { usePartyCycle } from '@/components/homepage/party-cycle'
import { PARTY_COLORS } from '@/constants/parties'

// Same order/spacing as the tiles' auto-cycle — six slots, 60° apart.
const ORDER = ['national', 'labour', 'green', 'act', 'nzfirst', 'tpm'] as const
const NEUTRAL = '#26140a' // resting face — warm espresso, on-brand with the burnt-clay hero

function isLight(hex: string): boolean {
  const m = hex.replace('#', '')
  if (m.length < 6) return false
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6
}

export function CornerCompass() {
  const reduce = useReducedMotion()
  const { selectedSlug } = usePartyCycle()
  const [S, setS] = useState(128)
  const [rotation, setRotation] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const set = () => setS(window.innerWidth < 640 ? 92 : 128)
    set()
    window.addEventListener('resize', set)
    return () => window.removeEventListener('resize', set)
  }, [])

  // On an explicit party pick, spin forward (always ≥ ~a full turn) and land that
  // party's slot under the fixed needle. Rotation only ever increases → always CW.
  useEffect(() => {
    if (!selectedSlug) return
    const i = ORDER.indexOf(selectedSlug as (typeof ORDER)[number])
    if (i < 0) return
    setRotation((prev) => {
      let t = i * 60
      while (t < prev + 300) t += 360
      return t
    })
  }, [selectedSlug])

  const face = selectedSlug ? (PARTY_COLORS[selectedSlug as keyof typeof PARTY_COLORS]?.bg ?? NEUTRAL) : NEUTRAL
  const light = isLight(face)
  const ink = light ? '#1a1208' : '#ffffff'
  const tick = light ? 'rgba(20,12,4,.4)' : 'rgba(255,255,255,.48)'
  const tickMajor = light ? 'rgba(20,12,4,.72)' : 'rgba(255,255,255,.84)'

  const R = S            // radius = quarter size → the disc sits flush to the screen corner
  const C = S            // centre at the container's bottom-right = the screen corner
  const pt = (A: number, r: number) => [C + r * Math.cos((A * Math.PI) / 180), C + r * Math.sin((A * Math.PI) / 180)] as const

  // Ruler ticks around the rim, major every 30°.
  const ticks: React.ReactNode[] = []
  for (let A = 0; A < 360; A += 6) {
    const major = A % 30 === 0
    const [x1, y1] = pt(A, R - 2)
    const [x2, y2] = pt(A, R - (major ? 13 : 7))
    ticks.push(<line key={A} x1={x1} y1={y1} x2={x2} y2={y2} stroke={major ? tickMajor : tick} strokeWidth={major ? 1.6 : 1} strokeLinecap="round" />)
  }
  // Party slot marks: placed so party i lands under the needle (A=225) once the dial
  // has rotated by i*60. Drawn on the rotating dial.
  const slots = ORDER.map((slug, i) => {
    const [x, y] = pt(225 - i * 60, R - 9.5)
    return <circle key={slug} cx={x} cy={y} r={2.4} fill={tickMajor} />
  })

  if (!mounted) return null

  // Fixed edge pointer — a caret-style arrowhead sitting ON the rim at the up-left
  // (225°), pointing outward into the content, echoing the tiles' speech-bubble
  // caret (party-colour beak with a light-ink border). It stays put while the dial
  // rotates the selected party's slot to settle right beneath it.
  const tanx = Math.cos((315 * Math.PI) / 180), tany = Math.sin((315 * Math.PI) / 180)
  const tri = (apexR: number, baseR: number, halfW: number) => {
    const [tx, ty] = pt(225, apexR)
    const [bx, by] = pt(225, baseR)
    return `${tx},${ty} ${bx + halfW * tanx},${by + halfW * tany} ${bx - halfW * tanx},${by - halfW * tany}`
  }
  const pointerOuter = tri(R + S * 0.105, R - S * 0.028, S * 0.098)
  const pointerInner = tri(R + S * 0.078, R + S * 0.006, S * 0.062)

  return (
    <motion.a
      href="/start"
      aria-label="Take the compass — find where you stand"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      whileHover={{ scale: 1.045 }}
      style={{
        position: 'fixed', right: 0, bottom: 0, width: S, height: S, zIndex: 35,
        overflow: 'hidden', display: 'block', cursor: 'pointer',
        transformOrigin: '100% 100%', WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Layer 0 — static face disc (recolours; casts a fixed soft shadow up-left) */}
      <svg width={S} height={S} style={{ position: 'absolute', inset: 0, display: 'block', filter: 'drop-shadow(-3px -3px 8px rgba(0,0,0,.22))' }} aria-hidden>
        <circle cx={C} cy={C} r={R} fill={face} style={{ transition: 'fill .8s ease' }} />
      </svg>

      {/* Layer A — rotating ticked dial (transparent bg so the face shows through) */}
      <motion.div
        style={{ position: 'absolute', inset: 0, transformOrigin: '100% 100%' }}
        animate={{ rotate: rotation }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 55, damping: 11, mass: 1.15 }}
        aria-hidden
      >
        <svg width={S} height={S} style={{ display: 'block' }}>
          {ticks}
          {slots}
        </svg>
      </motion.div>

      {/* Layer B — fixed edge pointer on the rim, pointing up-left into the content */}
      <svg width={S} height={S} style={{ position: 'absolute', inset: 0, display: 'block', pointerEvents: 'none', overflow: 'visible' }} aria-hidden>
        <polygon points={pointerOuter} fill={ink} style={{ transition: 'fill .8s ease' }} />
        <polygon points={pointerInner} fill={face} style={{ transition: 'fill .8s ease' }} />
      </svg>
    </motion.a>
  )
}
