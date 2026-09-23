'use client'

/**
 * BillJourney — a bill's stages, drawn as beads on a rail that fills.
 *
 * Shared by both bill lists on /bills. It was written for the eight debated
 * bills and the tracker had a different strip of its own; two animations for
 * the same fact, on one page, opened the same way. This is the one that
 * stayed.
 *
 * The fill and the beads run off one eased 0-1 progress, so the rail reaches a
 * bead exactly as that bead lights. `stop` is for a stage a bill did not get
 * past — defeated, withdrawn — and is the one node that lights red.
 */

import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { INK, MANROPE } from '@/constants/theme'

const CARD = '#ffffff', MUTED = '#667066', LINE = '#e4ebe2'
const ACCENT = '#1F8A4C'

export interface JourneyNode { label: string; state: 'done' | 'stop' | 'current' }

export function Journey({ nodes }: { nodes: JourneyNode[] }) {
  const p = useProgress(1500)
  const n = nodes.length
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 4, ['--bill-journey-p' as string]: String(p) } as React.CSSProperties}>
      <span className="bill-journey-rail" style={{ position: 'absolute', left: 11, right: 11, top: 11, height: 2, background: LINE }} />
      <span className="bill-journey-fill" style={{ position: 'absolute', left: 11, top: 11, height: 2, background: ACCENT, width: `calc((100% - 22px) * ${p})`, transition: 'width .2s linear' }} />
      {nodes.map((node, i) => {
        const lit = p >= (n > 1 ? i / (n - 1) : 1) - 0.001
        const isStop = node.state === 'stop'
        const beadBg = lit ? (isStop ? '#c23b3b' : ACCENT) : CARD
        const beadBorder = lit ? (isStop ? '#c23b3b' : ACCENT) : LINE
        return (
          <div key={i} className="bill-journey-node" style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, flex: 1, textAlign: 'center' }}>
            <span className="bill-journey-bead" style={{ width: 24, height: 24, borderRadius: '50%', background: beadBg, border: `2px solid ${beadBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: lit ? 'scale(1)' : 'scale(.7)', opacity: lit ? 1 : 0.55, transition: 'all .3s ease' }}>
              {lit && (isStop ? <X style={{ width: 12, height: 12, color: '#fff' }} /> : <Check style={{ width: 12, height: 12, color: '#fff' }} />)}
            </span>
            <span className="bill-journey-label" style={{ fontSize: 10.5, fontWeight: lit ? 700 : 600, color: lit ? INK : MUTED, fontFamily: MANROPE, lineHeight: 1.3, maxWidth: '9ch', transition: 'color .3s ease' }}>{node.label}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Eased 0→1 progress over `dur` ms. Time-based (not step count), so it always
 *  reaches 1 even when the tab is backgrounded and timers are throttled. */
function useProgress(dur: number) {
  const [p, setP] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => {
      const raw = Math.min((Date.now() - start) / dur, 1)
      setP(1 - Math.pow(1 - raw, 3))
      if (raw >= 1) clearInterval(id)
    }, 40)
    return () => clearInterval(id)
  }, [dur])
  return p
}
