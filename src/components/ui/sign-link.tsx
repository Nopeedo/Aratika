/**
 * SignShape — a link shaped like a signpost: a rectangle whose right end tapers
 * to a point, filled with a colour the caller chooses.
 *
 * Lives here rather than with the homepage version because the topic pages want
 * the same shape in the ISSUE's colour, and the homepage one reads the party
 * cycle from React context — calling that outside the provider throws. The
 * shape is the shared thing; where the colour comes from is not.
 *
 * The point is a clip-path, not a border trick, so the fill and the drop-shadow
 * both follow the actual shape. Shadow is a filter rather than box-shadow for
 * the same reason: box-shadow draws the rectangle's shadow and then clip-path
 * cuts it, leaving a shadow with no triangle.
 */

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MANROPE } from '@/constants/theme'

/** Depth of the pointed end. Right padding is this plus the normal inset, so
 *  the arrow sits inside the rectangle and the point extends past it. */
export const SIGN_POINT = 22

export function SignShape({ href, color, fg, icon, children }: {
  href: string
  /** The fill. */
  color: string
  /** Text/icon colour: ink on a light fill, white on a dark one. */
  fg: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: `9px ${SIGN_POINT + 12}px 9px 14px`,
        background: color, color: fg,
        borderRadius: '12px 0 0 12px',
        clipPath: `polygon(0 0, calc(100% - ${SIGN_POINT}px) 0, 100% 50%, calc(100% - ${SIGN_POINT}px) 100%, 0 100%)`,
        filter: 'drop-shadow(0 2px 5px rgba(12,14,18,.18))',
        fontSize: 14, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none',
        whiteSpace: 'nowrap',
        transition: 'background-color .25s ease-in-out, color .25s ease-in-out',
      }}
    >
      {icon}
      {children}
      {/* The arrow carries the emphasis: bigger and heavier than the label,
          and it points the same way the sign does. */}
      <ArrowRight style={{ width: 20, height: 20, flexShrink: 0, marginLeft: 2 }} strokeWidth={3} />
    </Link>
  )
}
