'use client'

/**
 * MpPhotoTile — a square-ish photo tile of an MP (freely-licensed Wikimedia
 * portrait), with a name caption, photo attribution, and a link through to the
 * full profile. Falls back to party-coloured initials when there's no free photo.
 * Shared by the electorate map (homepage/inline) and the battlegrounds map so both
 * show the incumbent the same way.
 */

import Link from 'next/link'
import Image from 'next/image'
import { PARTY_COLORS } from '@/constants/parties'
import type { PartySlug } from '@/types'

export interface MpLite {
  slug: string
  photo?: string
  photoCredit?: string
  photoLicense?: string
}

const BORDER = '#e9e7e2'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function MpPhotoTile({ name, party, mp, caption, fill }: {
  name: string
  party?: PartySlug
  mp: MpLite | null
  /** Small line under the name, e.g. "2023 MP" or "Your electorate MP". */
  caption?: string
  /** Stretch to fill remaining height in a flex column (stacked side panel). */
  fill?: boolean
}) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
  const pc = party ? PARTY_COLORS[party] : null

  const inner = (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 190, background: pc ? pc.light : '#eef1f4' }}>
      {mp?.photo ? (
        <Image src={mp.photo} alt={name} fill unoptimized style={{ objectFit: 'cover', objectPosition: '50% 22%' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: pc ? pc.bg : '#e2e8f0', color: pc ? pc.text : '#475569', fontSize: 46, fontWeight: 800, fontFamily: MANROPE }}>{initials}</div>
      )}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '22px 13px 11px', background: 'linear-gradient(transparent, rgba(0,0,0,.78))', color: '#fff', fontFamily: MANROPE }}>
        <div style={{ fontSize: 14.5, fontWeight: 800, lineHeight: 1.2 }}>{name}</div>
        <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 2 }}>{caption ?? 'MP'}{mp ? ' · view profile →' : ''}</div>
        {mp?.photoCredit && (
          <div style={{ fontSize: 9.5, opacity: 0.62, marginTop: 4 }}>Photo: {mp.photoCredit}{mp.photoLicense ? ` (${mp.photoLicense})` : ''}</div>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', ...(fill ? { flex: '1 1 auto', minHeight: 0 } : {}) }}>
      {mp ? <Link href={`/mps/${mp.slug}`} aria-label={`${name} profile`} style={{ display: 'block', height: '100%' }}>{inner}</Link> : inner}
    </div>
  )
}
