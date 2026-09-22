'use client'

/**
 * CompareSignLink — the way out of the policy section, shaped like a signpost:
 * a rectangle whose right end tapers to a point. Sits centred under the issue
 * panel and reads as "this way to the full comparison".
 *
 * Filled with the current party's colour so it belongs to the panel above it
 * rather than being a generic site-green button — same reason the pills in
 * the panel took the party colour. Text flips to ink on light fills (ACT's
 * yellow) via the same isLightHex threshold used everywhere else.
 *
 * The point is a clip-path, not a border trick, so the fill, the hover state
 * and the drop-shadow all follow the actual shape. Shadow is a filter rather
 * than box-shadow for the same reason — box-shadow draws the rectangle's
 * shadow and then clip-path cuts it, leaving a shadow with no triangle.
 */

import Link from 'next/link'
import { Scale, ArrowRight } from 'lucide-react'
import { usePartyCycle } from '@/components/homepage/party-cycle'
import { isLightHex } from '@/components/homepage/battleground-card'
import { INK, MANROPE } from '@/constants/theme'

// Depth of the pointed end. Right padding is this plus the normal inset, so
// the arrow sits inside the rectangle and the point extends past it.
const POINT = 22

export function CompareSignLink() {
  const { accentColor } = usePartyCycle()
  const fg = isLightHex(accentColor) ? INK : '#fff'

  return (
    <Link
      href="/policies"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: `9px ${POINT + 12}px 9px 14px`,
        background: accentColor, color: fg,
        borderRadius: '12px 0 0 12px',
        clipPath: `polygon(0 0, calc(100% - ${POINT}px) 0, 100% 50%, calc(100% - ${POINT}px) 100%, 0 100%)`,
        filter: 'drop-shadow(0 2px 5px rgba(12,14,18,.18))',
        fontSize: 14, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none',
        whiteSpace: 'nowrap',
        transition: 'background-color .25s ease-in-out, color .25s ease-in-out',
      }}
    >
      <Scale style={{ width: 14, height: 14, flexShrink: 0 }} />
      {/* Short on purpose: the reader has just skimmed one party's positions,
          and this is the door to the full, every-party comparison. */}
      Compare policies in depth
      {/* The arrow carries the emphasis: bigger and heavier than the label,
          and it points the same way the sign does. */}
      <ArrowRight style={{ width: 20, height: 20, flexShrink: 0, marginLeft: 2 }} strokeWidth={3} />
    </Link>
  )
}
