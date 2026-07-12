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

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function ElectorateTiles({ name }: { name: string }) {
  const info = getElectorate(name)
  if (!info) {
    return <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE }}>Details for this electorate are being verified.</p>
  }
  const slug = info.mpSlug ?? (info.mpName ? toSlug(info.mpName) : undefined)
  const mp = slug ? MP_PROFILES[slug] ?? null : null
  const party = info.party ?? undefined

  return (
    <div className="el-tiles" style={{ fontFamily: MANROPE }}>
      <style>{`
        .el-tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: stretch; }
        @media (max-width: 480px) { .el-tiles { grid-template-columns: 1fr; } }
      `}</style>
      {/* Tile 1 — the numbers */}
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: TERTIARY }}>
          {info.type === 'maori' ? 'Māori electorate' : 'General electorate'}{info.region ? ` · ${info.region}` : ''}
        </span>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 19, fontWeight: 800, color: INK, margin: '4px 0 12px' }}>
          <MapPin style={{ width: 16, height: 16, color: JADE }} />{name}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Row label="Electorate MP" value={info.mpName ?? '—'} />
          <Row label="Party" value={party ? PARTY_NAMES[party].short : '—'} color={party ? PARTY_COLORS[party].bg : undefined} />
          {info.majority != null && <Row label="2023 majority" value={formatNumber(info.majority)} />}
        </div>
        {slug && mp && (
          <Link href={`/mps/${slug}`} style={{ marginTop: 'auto', paddingTop: 12, textDecoration: 'none' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: INK, color: '#fff', borderRadius: 11, padding: '11px 16px', fontSize: 14, fontWeight: 800 }}>
              View full profile <ArrowRight style={{ width: 15, height: 15 }} />
            </span>
          </Link>
        )}
      </div>

      {/* Tile 2 — the incumbent */}
      <MpPhotoTile name={info.mpName ?? 'To be confirmed'} party={party} mp={mp} caption="Your electorate MP" />

      {/* MMP note spans both tiles */}
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, padding: '10px 12px', background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: 10 }}>
        <p style={{ fontSize: 11.5, color: SECONDARY, margin: 0, lineHeight: 1.55 }}>
          Under MMP your <b style={{ color: INK }}>party vote</b> also elects list MPs — you’re represented by more than just your electorate MP.
        </p>
      </div>
    </div>
  )
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${BORDER}`, paddingBottom: 8 }}>
      <span style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE }}>{label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: INK, fontFamily: MANROPE }}>
        {color && <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />}{value}
      </span>
    </div>
  )
}
