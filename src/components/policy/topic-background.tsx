'use client'

/**
 * TopicBackground — the homepage weave, tinted with the current TOPIC's colour.
 *
 * Same idea as HomeBackground: the weave (back2.jpg over PAPER) with a colour
 * wash masked to feather in and out down the page, so the page shifts with
 * whatever is selected. There the colour is the party's; here it is the
 * topic's border hue (TOPIC_BORDER_HEX), the same one the pills and the title
 * pill wear, so header, chips and ground all agree.
 *
 * The wash holds from the top through the comparison list and fades out over
 * the last ~100px below it (measured from #topic-content), so the bills and
 * the closing notes sit on plain weave. background-color transitions, so
 * switching topic cross-fades the ground instead of snapping it.
 */

import { useEffect, useState, type ReactNode } from 'react'
import { PAPER } from '@/constants/theme'

const ALPHA = 0.16
const FADE_BELOW = 120
const CONTENT_ID = 'topic-content'

export function TopicBackground({ color, children }: { color: string; children: ReactNode }) {
  const [contentBottom, setContentBottom] = useState<number | null>(null)

  useEffect(() => {
    const measure = () => {
      const el = document.getElementById(CONTENT_ID)
      if (el) setContentBottom(Math.round(el.getBoundingClientRect().bottom + window.scrollY))
    }
    measure()
    window.addEventListener('resize', measure)
    // Rows expand and collapse; re-measure when the content's size changes.
    const el = document.getElementById(CONTENT_ID)
    const ro = el && 'ResizeObserver' in window ? new ResizeObserver(measure) : null
    if (el && ro) ro.observe(el)
    const t = setTimeout(measure, 500)
    return () => {
      window.removeEventListener('resize', measure)
      ro?.disconnect()
      clearTimeout(t)
    }
  }, [color])

  const mask = contentBottom != null
    ? `linear-gradient(to bottom, rgba(0,0,0,${ALPHA}) 0px, rgba(0,0,0,${ALPHA}) ${contentBottom}px, rgba(0,0,0,0) ${contentBottom + FADE_BELOW}px, rgba(0,0,0,0) 100%)`
    : `linear-gradient(to bottom, rgba(0,0,0,${ALPHA}) 0px, rgba(0,0,0,${ALPHA}) 100%)`

  return (
    <div style={{ backgroundColor: PAPER, backgroundImage: 'url(/back2.jpg)', backgroundRepeat: 'repeat-y', backgroundSize: '100% auto', backgroundPosition: 'top center', minHeight: '100vh', position: 'relative', isolation: 'isolate' }}>
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none',
          backgroundColor: color,
          WebkitMaskImage: mask, maskImage: mask,
          transition: 'background-color 400ms ease',
        }}
      />
      {children}
    </div>
  )
}
