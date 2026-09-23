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
 * past, defeated or withdrawn, and is the one node that lights red.
 *
 * Two modes. Left alone it ANIMATES once, 0 to 1 over 1500ms, which is what
 * both lists on /bills use. Given `progress`, it is CONTROLLED: the caller owns
 * the number, which is what a teaching widget needs when the reader is stepping
 * through the stages themselves rather than watching them play.
 *
 * Its phone sizing ships here, not in a caller. It used to live in
 * defining-bills.tsx's style block, which worked on /bills by accident, because
 * both components are on that page; anywhere else the strip rendered at desktop
 * size. That is the §5.15 mistake, and shipping the CSS with THE component
 * rather than with A component is the fix.
 */

import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { INK, MANROPE } from '@/constants/theme'

const CARD = '#ffffff', MUTED = '#667066', LINE = '#e4ebe2'
const ACCENT = '#1F8A4C'

export interface JourneyNode { label: string; state: 'done' | 'stop' | 'current' }

export function Journey({ nodes, progress }: { nodes: JourneyNode[]; progress?: number }) {
  // The hook still runs when the caller controls the strip: hooks cannot be
  // called conditionally, and an unread animation costs one interval that
  // clears itself after 1500ms.
  const animated = useProgress(1500)
  const p = progress === undefined ? animated : Math.max(0, Math.min(1, progress))
  const n = nodes.length
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 4, ['--bill-journey-p' as string]: String(p) } as React.CSSProperties}>
      <style dangerouslySetInnerHTML={{ __html: JOURNEY_CSS }} />
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

/* Phone sizing. `!important` because the values it overrides are inline styles
   on the same elements, and an inline style outranks a stylesheet rule (§3.2).
   The rail is positioned against the bead's CENTRE, so it moves with it: half
   of 18 is 9, not 11. */
const JOURNEY_CSS = `
@media (max-width: 600px) {
  .bill-journey-node { gap: 6px !important; }
  .bill-journey-bead { width: 18px !important; height: 18px !important; }
  .bill-journey-bead svg { width: 9px !important; height: 9px !important; }
  .bill-journey-label { font-size: 9.5px !important; max-width: 8ch !important; }
  .bill-journey-rail { left: 9px !important; right: 9px !important; top: 8px !important; }
  .bill-journey-fill { left: 9px !important; top: 8px !important; width: calc((100% - 18px) * var(--bill-journey-p, 0)) !important; }
}
`
