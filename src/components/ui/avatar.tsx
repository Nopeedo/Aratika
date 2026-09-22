import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'
import { PARTY_COLORS } from '@/constants/parties'
import { PartySlug } from '@/types'

export interface AvatarProps {
  src?: string
  name: string
  party?: PartySlug
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  /** Crop+zoom toward the face (top of the portrait) so the circle frames the
   *  face cleanly. Off by default so other avatars render the full image. */
  face?: boolean
}

/** The default `face` crop — focal point in the top third, 1.4× zoom — suits
 *  the waist-up portraits most MP photos are: it lifts the face out of the
 *  suit and shoulders. It's wrong for a photo that's ALREADY a tight headshot:
 *  zooming 1.4× on the top 14% of one of those lands on the forehead and
 *  pushes the face down out of the circle. Those get their own focal point
 *  here, keyed by src. `y` is where the face centre sits in the source image;
 *  little or no zoom because there's nothing to crop away. */
const DEFAULT_FACE_CROP = { y: '14%', scale: 1.4 }
const FACE_CROP: Record<string, { y: string; scale: number }> = {
  // Tight headshot, eyes ~40% down, chin ~78%. Face centre ≈ 45%.
  '/mps/winston-peters.jpg': { y: '45%', scale: 1.08 },
}

const sizes = {
  xs: { container: 'size-6  text-xs',   px: 24 },
  sm: { container: 'size-8  text-sm',   px: 32 },
  md: { container: 'size-10 text-sm',   px: 40 },
  lg: { container: 'size-14 text-base', px: 56 },
  xl: { container: 'size-20 text-lg',   px: 80 },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Avatar({ src, name, party, size = 'md', className, face = false }: AvatarProps) {
  const { container, px } = sizes[size]
  const partyColor = party ? PARTY_COLORS[party] : null
  const crop = face ? (src && FACE_CROP[src]) || DEFAULT_FACE_CROP : null

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden shrink-0 select-none',
        container,
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={px}
          height={px}
          className="object-cover w-full h-full"
          // Bias the crop toward the face and zoom so it fills the circle instead
          // of the suit/shoulders. Focal point + zoom come from FACE_CROP above:
          // the default for waist-up portraits, a per-photo override for tight
          // headshots where the default would push the face out of frame.
          style={crop ? { objectPosition: `50% ${crop.y}`, transform: `scale(${crop.scale})`, transformOrigin: `50% ${crop.y}` } : undefined}
        />
      ) : (
        <div
          className="flex items-center justify-center w-full h-full font-semibold"
          style={
            partyColor
              ? { backgroundColor: partyColor.bg, color: partyColor.text }
              : { backgroundColor: '#E2E8F0', color: '#475569' }
          }
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  )
}
