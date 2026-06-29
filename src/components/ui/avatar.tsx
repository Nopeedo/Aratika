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
          // Faces sit in the top third of these portraits — bias the crop up and
          // zoom in so the face fills the circle instead of the suit/shoulders.
          style={face ? { objectPosition: '50% 14%', transform: 'scale(1.4)', transformOrigin: '50% 14%' } : undefined}
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
