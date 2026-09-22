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

import type { ReactNode } from 'react'
import { Scale } from 'lucide-react'
import { usePartyCycle } from '@/components/homepage/party-cycle'
import { isLightHex } from '@/components/homepage/battleground-card'
import { SignShape } from '@/components/ui/sign-link'
import { INK } from '@/constants/theme'

/**
 * The signpost itself, reusable: any homepage link that should read as a way
 * OUT of the section it closes. Filled with the current party's colour, so
 * two of them on one page always agree.
 */
/**
 * The signpost in the CURRENT PARTY's colour, for any homepage link that should
 * read as a way OUT of the section it closes, so two of them on one page always
 * agree. The shape itself is ui/sign-link.tsx, which the topic pages use with
 * the issue's colour instead.
 */
export function SignLink({ href, icon, children }: { href: string; icon?: ReactNode; children: ReactNode }) {
  const { accentColor } = usePartyCycle()
  return (
    <SignShape href={href} color={accentColor} fg={isLightHex(accentColor) ? INK : '#fff'} icon={icon}>
      {children}
    </SignShape>
  )
}

export function CompareSignLink() {
  return (
    <SignLink href="/policies" icon={<Scale style={{ width: 14, height: 14, flexShrink: 0 }} />}>
      {/* Short on purpose: the reader has just skimmed one party's positions,
          and this is the door to the full, every-party comparison. */}
      Compare policies in depth
    </SignLink>
  )
}
