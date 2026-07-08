'use client'

/**
 * CornerCompass — a fixed engagement anchor in the bottom-right corner. Its centre
 * sits in the screen corner so only the top-left QUARTER shows, and that quarter
 * is a solid single colour — the selected party's. It is not a literal spread pie
 * (six 60° slices would always leak a neighbour's colour into a 90° window);
 * instead the quarter is the frame, and picking a party spins the ruler markers
 * clockwise while the fill cross-fades to that party's colour, settling with a
 * slight spring wobble. A spindle needle runs from the centre out into the
 * quarter; a white edge outline plus a band in the party's colour strengthen the
 * rim; a soft feathered shadow lifts it off the page.
 *
 * Driven by the shared PartyCycle's `selectedSlug` — only an explicit tap, never
 * the idle auto-cycle. Tapping it opens the compass walkthrough (/start).
 * Homepage-only (needs the PartyCycle context). Honours prefers-reduced-motion.
 */

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { usePartyCycle } from '@/components/homepage/party-cycle'
import { PARTY_COLORS } from '@/constants/parties'

const ORDER = ['national', 'labour', 'green', 'act', 'nzfirst', 'tpm'] as const
const NEUTRAL = '#26140a' // resting fill/rim when nothing is picked (warm espresso)

function isLight(hex: string): boolean {
  const m = hex.replace('#', '')
  if (m.length < 6) return false
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6
}

// Darken a hex colour by a factor (for the rim band, so the edge reads as a
// stronger frame around the lighter fill).
function darken(hex: string, f: number): string {
  const m = hex.replace('#', '')
  if (m.length < 6) return hex
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16)
  const d = (v: number) => Math.round(v * f).toString(16).padStart(2, '0')
  return `#${d(r)}${d(g)}${d(b)}`
}

// hex → rgba string (for the party-hue shadow).
function rgba(hex: string, a: number): string {
  const m = hex.replace('#', '')
  if (m.length < 6) return `rgba(0,0,0,${a})`
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

export function CornerCompass() {
  const reduce = useReducedMotion()
  const { selectedSlug } = usePartyCycle()
  const [S, setS] = useState(132)
  const [rotation, setRotation] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const set = () => setS(window.innerWidth < 640 ? 68 : 132)
    set()
    window.addEventListener('resize', set)
    return () => window.removeEventListener('resize', set)
  }, [])

  // On an explicit pick, spin the markers forward (clockwise, ≥ ~a full turn) as
  // the fill cross-fades to the new colour. Rotation only ever increases.
  useEffect(() => {
    if (!selectedSlug) return
    const i = ORDER.indexOf(selectedSlug as (typeof ORDER)[number])
    if (i < 0) return
    setRotation((prev) => {
      let t = i * 60
      while (t < prev + 320) t += 360
      return t
    })
  }, [selectedSlug])

  const raw = selectedSlug ? (PARTY_COLORS[selectedSlug as keyof typeof PARTY_COLORS]?.bg ?? NEUTRAL) : NEUTRAL
  // Keep every party's compass in the same rich, deep tonal range as National blue,
  // so the solid-white needle and indices pop consistently. Only light colours
  // (ACT's bright yellow) get deepened; blue/red/green/black are already deep enough.
  const face = isLight(raw) ? darken(raw, 0.6) : raw
  const light = isLight(face)
  const tick = light ? 'rgba(20,12,4,.55)' : 'rgba(255,255,255,.66)'
  const tickMajor = light ? 'rgba(20,12,4,.85)' : 'rgba(255,255,255,.96)'

  const R = S
  const C = S
  const pt = (A: number, r: number) => [C + r * Math.cos((A * Math.PI) / 180), C + r * Math.sin((A * Math.PI) / 180)] as const

  // Ruler indices around the whole rim (even, every 12°), kept spinning on
  // selection. The grid is offset so one index always sits at 225° (under the
  // needle) at rest, and majors fall on the six party slots (60° apart) — so a
  // settled pick lands the needle exactly on the selected party's index.
  const ticks: React.ReactNode[] = []
  for (let k = 0; k < 30; k++) {
    const A = 9 + k * 12
    const major = ((A - 45) % 60 + 60) % 60 === 0
    const [x1, y1] = pt(A, R - 3)
    const [x2, y2] = pt(A, R - (major ? 14 : 8))
    ticks.push(<line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={major ? tickMajor : tick} strokeWidth={major ? 2 : 1.2} strokeLinecap="round" />)
  }

  if (!mounted) return null

  // Solid-white triangular spindle — a straight-edged two-point diamond (like a
  // real compass needle), sitting low toward the corner. Long point up-left
  // (225°), shorter tail toward the corner, belly at the hub.
  const hub = pt(225, R * 0.33)
  const nw = R * 0.115
  const perpA = [Math.cos((135 * Math.PI) / 180), Math.sin((135 * Math.PI) / 180)]
  const perpB = [Math.cos((315 * Math.PI) / 180), Math.sin((315 * Math.PI) / 180)]
  const nTip = pt(225, R * 0.72)
  const nTail = pt(225, R * 0.04)
  const shA = [hub[0] + nw * perpA[0], hub[1] + nw * perpA[1]]
  const shB = [hub[0] + nw * perpB[0], hub[1] + nw * perpB[1]]
  const needlePts = `${nTip[0]},${nTip[1]} ${shA[0]},${shA[1]} ${nTail[0]},${nTail[1]} ${shB[0]},${shB[1]}`

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
        overflow: 'visible', display: 'block', cursor: 'pointer',
        transformOrigin: '100% 100%', WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Clip container — the quarter frame, with a soft feathered shadow in the party hue. */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', filter: `drop-shadow(0 0 14px ${rgba(face, 0.5)}) drop-shadow(0 0 5px ${rgba(face, 0.34)})`, transition: 'filter .8s ease' }}>
        {/* Solid fill + fixed rim (party-colour band + white outline) — drawn FIRST
            so the ruler indices above sit on top of the rim, not behind it. */}
        <svg width={S} height={S} style={{ position: 'absolute', inset: 0, display: 'block' }} aria-hidden>
          <circle cx={C} cy={C} r={R} fill={face} style={{ transition: 'fill .8s ease' }} />
          <circle cx={C} cy={C} r={R - 4.5} fill="none" stroke={darken(face, 0.62)} strokeWidth={5} style={{ transition: 'stroke .8s ease' }} />
          <circle cx={C} cy={C} r={R - 1.25} fill="none" stroke="#ffffff" strokeWidth={2.5} />
        </svg>

        {/* Rotating indices — on top of the rim so they're always visible; spin on selection. */}
        <motion.div
          style={{ position: 'absolute', inset: 0, transformOrigin: '100% 100%' }}
          animate={{ rotate: rotation }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 55, damping: 11, mass: 1.15 }}
          aria-hidden
        >
          <svg width={S} height={S} style={{ display: 'block' }}>{ticks}</svg>
        </motion.div>

        {/* Fixed solid-white needle + hub, on top. */}
        <svg width={S} height={S} style={{ position: 'absolute', inset: 0, display: 'block', pointerEvents: 'none' }} aria-hidden>
          <polygon points={needlePts} fill="#ffffff" strokeLinejoin="round" />
          <circle cx={hub[0]} cy={hub[1]} r={R * 0.05} fill={darken(face, 0.55)} style={{ transition: 'fill .8s ease' }} />
        </svg>
      </div>
    </motion.a>
  )
}
