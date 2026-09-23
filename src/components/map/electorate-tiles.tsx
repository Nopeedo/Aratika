'use client'

/**
 * ElectorateTiles — the inline (embedded) electorate detail panel: two tiles, the
 * numbers on one and a photo of the sitting MP on the other, matching the
 * battlegrounds map's two-tile layout. Used below the homepage map when a seat is
 * selected. The full /map page keeps the richer ElectoratePanel.
 */

import Link from 'next/link'
import { MapPin, ArrowRight } from 'lucide-react'
import { getElectorate } from '@/constants/electorates-data'
import { MP_PROFILES } from '@/constants/mps-data'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import { formatNumber, toSlug } from '@/lib/utils/format'
import { MpPhotoTile } from './mp-photo-tile'
import { MetaRow } from './map-states'
import { BORDER, INK, JADE, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

export function ElectorateTiles({ name }: { name: string }) {
  const info = getElectorate(name)
  if (!info) {
    return <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE }}>Details for this electorate are being verified.</p>
  }
  const slug = info.mpSlug ?? (info.mpName ? toSlug(info.mpName) : undefined)
  const mp = slug ? MP_PROFILES[slug] ?? null : null
  const party = info.party ?? undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', minHeight: 0, fontFamily: MANROPE }}>
      {/* Tile 1 — the numbers */}
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: TERTIARY }}>
          {info.type === 'maori' ? 'Māori electorate' : 'General electorate'}{info.region ? ` · ${info.region}` : ''}
        </span>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 19, fontWeight: 800, color: INK, margin: '4px 0 12px' }}>
          <MapPin style={{ width: 16, height: 16, color: JADE }} />{name}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Labelled 2023, because `info.party` is the party that WON the
              seat in 2023 and two sitting MPs have left theirs since. The map
              panel makes the same distinction the same way. */}
          <MetaRow label="Won in 2023" value={info.mpName ?? 'Not on record'} />
          <MetaRow label="Party then" value={party ? PARTY_NAMES[party].short : 'Not on record'} color={party ? PARTY_COLORS[party].bg : undefined} />
          {info.majority != null && <MetaRow label="2023 majority" value={formatNumber(info.majority)} />}
        </div>
        {slug && mp && (
          <Link href={`/mps/${slug}`} style={{ marginTop: 12, textDecoration: 'none' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: INK, color: '#fff', borderRadius: 11, padding: '11px 16px', fontSize: 14, fontWeight: 800 }}>
              View full profile <ArrowRight style={{ width: 15, height: 15 }} />
            </span>
          </Link>
        )}
      </div>

      {/* Tile 2 — the incumbent, fills the rest of the column */}
      <MpPhotoTile name={info.mpName ?? 'To be confirmed'} party={party} mp={mp} caption="Your electorate MP" fill />
    </div>
  )
}
