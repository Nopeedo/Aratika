'use client'

/**
 * HomeBackground — wraps the homepage in the back2.jpg background graphic
 * (public/back2.jpg, tiled vertically / repeat-y, scaled to full width) and
 * tints it with the current party's accent colour (from PartyCycleProvider), so
 * the page background shifts in lockstep with the hero title and party tiles.
 *
 * The tint feathers in vertically: it holds at ~5% through the top of the hero,
 * then ramps to ~30% by the party tiles, holds, and then fades back to 0 by
 * 100px below the party-stance box (#party-stance) — so the lower page (Find
 * your MP and everything under it) has no party-colour wash. The colour itself
 * (background-color) still transitions smoothly between parties; the feather
 * shape is a separate CSS mask keyed to the live pixel positions of the
 * "#parties" anchor and the "#party-stance" box, re-measured on resize/layout.
 */

import { useEffect, useState, type ReactNode } from 'react'
import { usePartyCycle } from '@/components/homepage/party-cycle'

const TOP_ALPHA = 0.05
const TILE_ALPHA = 0.3
const RAMP_START_FRACTION = 0.35 // hold at TOP_ALPHA until this far down toward the tiles, then ramp
const FALLBACK_TILE_OFFSET = 640 // used only until the anchor is measured on mount

const TINT_STOP_BELOW = 100 // px below the stance box where the tint reaches 0

export function HomeBackground({ children }: { children: ReactNode }) {
  const { accentColor, fadeMs } = usePartyCycle()
  const [tileOffset, setTileOffset] = useState(FALLBACK_TILE_OFFSET)
  const [stanceBottom, setStanceBottom] = useState<number | null>(null)

  useEffect(() => {
    const measure = () => {
      const el = document.getElementById('parties')
      if (el) setTileOffset(Math.round(el.getBoundingClientRect().top + window.scrollY))
      const s = document.getElementById('party-stance')
      if (s) setStanceBottom(Math.round(s.getBoundingClientRect().bottom + window.scrollY))
    }
    measure()
    window.addEventListener('resize', measure)
    // Layout can still settle after fonts/images load in; catch that once.
    const t = setTimeout(measure, 500)
    return () => {
      window.removeEventListener('resize', measure)
      clearTimeout(t)
    }
  }, [])

  const rampStart = Math.round(tileOffset * RAMP_START_FRACTION)
  // Ramp in to TILE_ALPHA by the tiles, hold to the bottom of the stance box,
  // then fade to 0 by TINT_STOP_BELOW px under it (and stay 0). Until the stance
  // box is measured, fall back to holding the tint to the page bottom.
  const stops = stanceBottom != null
    ? `rgba(0,0,0,${TOP_ALPHA}) 0px, rgba(0,0,0,${TOP_ALPHA}) ${rampStart}px, rgba(0,0,0,${TILE_ALPHA}) ${tileOffset}px, rgba(0,0,0,${TILE_ALPHA}) ${stanceBottom}px, rgba(0,0,0,0) ${stanceBottom + TINT_STOP_BELOW}px, rgba(0,0,0,0) 100%`
    : `rgba(0,0,0,${TOP_ALPHA}) 0px, rgba(0,0,0,${TOP_ALPHA}) ${rampStart}px, rgba(0,0,0,${TILE_ALPHA}) ${tileOffset}px, rgba(0,0,0,${TILE_ALPHA}) 100%`
  const maskGradient = `linear-gradient(to bottom, ${stops})`

  return (
    <div style={{ backgroundColor: '#f8fafc', backgroundImage: 'url(/back2.jpg)', backgroundRepeat: 'repeat-y', backgroundSize: '100% auto', backgroundPosition: 'top center', position: 'relative', isolation: 'isolate' }}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
          backgroundColor: accentColor,
          WebkitMaskImage: maskGradient,
          maskImage: maskGradient,
          transition: `background-color ${fadeMs}ms ease`,
        }}
      />
      {children}
    </div>
  )
}
