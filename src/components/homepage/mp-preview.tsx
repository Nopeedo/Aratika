'use client'

/**
 * MPPreview — a quick look at an MP over the page, instead of leaving it.
 *
 * Tapping a name in the caucus box used to navigate straight to that MP's
 * profile, which is a page change to answer "who is that?" — and then a trip
 * back to the party you were reading about. This answers it in place: photo,
 * what they do, where they were elected, and the first part of their bio,
 * with the way through to the full profile at the foot for anyone who wants
 * more.
 *
 * Shows only what the record actually holds. Most MPs are a name, a party, a
 * role and an electorate; the executive profiles carry a title, a first-elected
 * year and a bio. Nothing is invented to fill the panel out.
 */

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, ExternalLink, X } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { MP_PROFILES } from '@/constants/mps-data'
import { ELECTORATES, normalizeElectorateKey } from '@/constants/electorates-data'
import { PARTY_COLORS, PARTY_NAMES } from '@/constants/parties'
import type { PartySlug } from '@/types'
import { BORDER, INK, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

export function MPPreview({ slug, onClose }: { slug: string; onClose: () => void }) {
  const mp = MP_PROFILES[slug]

  // Escape closes, and the page behind must not scroll under the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  if (!mp) return null
  const colors = PARTY_COLORS[mp.party as PartySlug]
  const partyName = PARTY_NAMES[mp.party as PartySlug]?.short ?? mp.party
  const accent = colors?.bg ?? INK
  const seat = mp.electorate ? ELECTORATES[normalizeElectorateKey(mp.electorate)] : undefined

  // Trimmed to a couple of sentences: this is a preview, and the full thing is
  // one tap away at the foot.
  const bio = mp.bio && mp.bio.length > 320 ? `${mp.bio.slice(0, 317).trimEnd()}…` : mp.bio

  const fact = (label: string, value: string) => (
    <div style={{ display: 'flex', gap: 10, padding: '7px 0', borderTop: `1px solid ${BORDER}` }}>
      <span style={{ width: 96, flexShrink: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>{label}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.35 }}>{value}</span>
    </div>
  )

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={mp.name}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 80,
        background: 'rgba(12,14,18,.6)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(12px, 4vw, 32px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(420px, 100%)', maxHeight: '86vh', overflowY: 'auto',
          background: '#fff', borderRadius: 16, border: `2px solid ${accent}`,
          boxShadow: '0 24px 60px -12px rgba(12,14,18,.5)',
        }}
      >
        {/* Header, on a wash of the party's colour. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px 12px', background: colors?.light ?? '#fff' }}>
          <Avatar src={mp.photo} name={mp.name} party={mp.party as PartySlug} size="lg" face />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.2 }}>{mp.name}</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, marginTop: 2 }}>
              {partyName} · {mp.role === 'electorate' ? `MP for ${mp.electorate}` : 'List MP'}
            </div>
            {mp.title && (
              <div style={{ display: 'inline-block', marginTop: 5, padding: '2px 8px', borderRadius: 999, background: accent, color: '#fff', fontSize: 11.5, fontWeight: 800, fontFamily: MANROPE }}>
                {mp.title}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              flexShrink: 0, alignSelf: 'flex-start', boxSizing: 'border-box',
              width: 28, height: 28, minWidth: 28, minHeight: 28, padding: 0, borderRadius: '50%',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', color: SECONDARY, cursor: 'pointer',
            }}
          >
            <X style={{ width: 17, height: 17 }} />
          </button>
        </div>

        <div style={{ padding: '4px 14px 14px' }}>
          {bio && (
            <p style={{ fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: '8px 0 10px' }}>{bio}</p>
          )}

          {mp.role === 'electorate' && mp.electorate && fact('Electorate', mp.electorate)}
          {seat?.majority != null && fact('2023 majority', `${seat.majority.toLocaleString()} votes`)}
          {mp.enteredParliament != null && fact('In Parliament since', String(mp.enteredParliament))}
          {mp.priorCareer && fact('Before politics', mp.priorCareer)}

          {/* The way through to everything else. */}
          <Link
            href={`/mps/${mp.slug}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              marginTop: 14, padding: '10px 14px', borderRadius: 10,
              background: accent, color: colors?.text ?? '#fff',
              fontSize: 14, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none',
            }}
          >
            {mp.name.split(' ')[0]}&rsquo;s full profile
            <ArrowRight style={{ width: 15, height: 15 }} strokeWidth={3} />
          </Link>

          <a
            href={mp.parliamentUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, fontSize: 12.5, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, textDecoration: 'none' }}
          >
            Their page on parliament.nz <ExternalLink style={{ width: 11, height: 11 }} />
          </a>
        </div>
      </div>
    </div>
  )
}
