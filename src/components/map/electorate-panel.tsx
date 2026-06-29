'use client'

/**
 * ElectoratePanel — the detail panel beside the map.
 *
 * Shows the selected electorate: its current MP (full card when a profile
 * exists, "data pending" otherwise), an MMP/list-MP explainer, and a
 * premium bookmark action.
 */

import Link from 'next/link'
import {
  MapPin, ArrowRight, Info, Vote, FileText, MousePointerClick,
} from 'lucide-react'
import { BookmarkButton } from '@/components/bookmarks/bookmark-button'
import { getElectorate } from '@/constants/electorates-data'
import { MP_PROFILES } from '@/constants/mps-data'
import { PARTY_PROFILES } from '@/constants/parties-data'
import { Avatar } from '@/components/ui/avatar'
import { formatNumber, toSlug } from '@/lib/utils/format'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const DISPLAY = 'var(--font-space-grotesk), system-ui, sans-serif'

export function ElectoratePanel({ electorateName }: { electorateName: string | null }) {

  // ── Empty state ──
  if (!electorateName) {
    return (
      <div style={panelWrap}>
        <div style={{ textAlign: 'center', padding: '48px 24px', color: TERTIARY }}>
          <MousePointerClick style={{ width: 36, height: 36, margin: '0 auto 14px', color: '#cbd0d6' }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: INK, fontFamily: MANROPE, margin: '0 0 6px' }}>
            Find your MP
          </p>
          <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.5, margin: 0 }}>
            Click any electorate on the map — or search your suburb — to see who
            represents that area and what they stand for.
          </p>
        </div>
      </div>
    )
  }

  const info      = getElectorate(electorateName)
  const party     = info?.party ? PARTY_PROFILES[info.party] : null
  const hasHolder = !!(info && info.party && info.mpName)
  // Derive the profile slug from the MP name; link only if that profile exists.
  const profileSlug = info?.mpSlug ?? (info?.mpName ? toSlug(info.mpName) : undefined)
  const mp          = profileSlug ? MP_PROFILES[profileSlug] ?? null : null

  return (
    <div style={panelWrap}>

      {/* Electorate header */}
      <div style={{ padding: '18px 20px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{
            fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
            color: info?.type === 'maori' ? '#B11226' : JADE, fontFamily: MANROPE,
          }}>
            {info?.type === 'maori' ? 'Māori Electorate' : 'General Electorate'}
          </span>
          {info?.region && (
            <>
              <span style={{ color: BORDER }}>·</span>
              <span style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE }}>{info.region}</span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin style={{ width: 18, height: 18, color: INK }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: 0 }}>
            {electorateName}
          </h2>
        </div>
      </div>

      {/* MP block */}
      {hasHolder && party && info ? (
        <div style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 12 }}>
            Electorate MP <span style={{ color: '#bcc1c8' }}>· 2023 result</span>
          </div>

          {/* Identity — wrapped in a profile link only when a profile exists */}
          {(() => {
            const identity = (
              <div style={{ display: 'flex', gap: 13, alignItems: 'center', marginBottom: 14 }}>
                <Avatar name={info.mpName!} party={info.party!} src={mp?.photo} size="lg" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {mp?.title && (
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: JADE, fontFamily: MANROPE, marginBottom: 2 }}>
                      {mp.title}
                    </div>
                  )}
                  <div style={{ fontSize: 17, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.15 }}>
                    {info.mpName}
                  </div>
                  <span style={{
                    display: 'inline-flex', marginTop: 6, fontSize: 11, fontWeight: 700,
                    background: party.color, color: party.textColor,
                    borderRadius: 999, padding: '3px 10px', fontFamily: MANROPE,
                  }}>
                    {party.name}
                  </span>
                </div>
                {mp && <ArrowRight style={{ width: 16, height: 16, color: TERTIARY }} />}
              </div>
            )
            return mp
              ? <Link href={`/mps/${mp.slug}`} style={{ textDecoration: 'none', display: 'block' }}>{identity}</Link>
              : identity
          })()}

          {/* Majority */}
          {typeof info.majority === 'number' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, marginBottom: 12 }}>
              <Vote style={{ width: 15, height: 15, color: TERTIARY }} />
              <span style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE }}>2023 majority</span>
              <span style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 700, color: INK, fontFamily: DISPLAY }}>
                {formatNumber(info.majority)}
              </span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mp ? (
              <Link href={`/mps/${mp.slug}`} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 14px', borderRadius: 10, background: JADE, color: '#fff',
                fontSize: 13.5, fontWeight: 700, fontFamily: MANROPE, textDecoration: 'none',
              }}>
                View full profile <ArrowRight style={{ width: 15, height: 15 }} />
              </Link>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '10px 14px', borderRadius: 10, border: `1px dashed ${BORDER}`,
                background: SURFACE, color: TERTIARY, fontSize: 12.5, fontWeight: 600, fontFamily: MANROPE,
              }}>
                Full profile coming soon
              </div>
            )}
            <BookmarkButton entity={{
              kind: 'electorate', refId: electorateName,
              label: electorateName,
              sublabel: info.mpName ? `${info.mpName} · ${party.name}` : (info.type === 'maori' ? 'Māori electorate' : 'General electorate'),
              href: `/map?search=${encodeURIComponent(electorateName)}`,
              accent: party.color,
            }} />
          </div>
        </div>
      ) : (
        // No verified holder for this electorate yet
        <div style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', gap: 10, padding: '13px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12 }}>
            <Info style={{ width: 16, height: 16, color: '#1e40af', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12.5, color: '#1e3a8a', fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>
              <b>MP data pending.</b> The current MP for this electorate will appear here once
              verified against the Electoral Commission&apos;s official 2023 results.
            </p>
          </div>
        </div>
      )}

      {/* MMP / list MP explainer */}
      <div style={{ padding: '0 20px 20px', marginTop: 'auto' }}>
        <div style={{ display: 'flex', gap: 9, padding: '12px 14px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
          <Info style={{ width: 15, height: 15, color: TERTIARY, flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11.5, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>
            Under MMP, your <b>party vote</b> also elects list MPs who represent the whole country —
            you&apos;re represented by more than just your electorate MP.{' '}
            <Link href="/how-it-works#mmp" style={{ color: JADE, fontWeight: 700 }}>How MMP works →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const panelWrap: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', height: '100%',
  background: '#ffffff',
}
