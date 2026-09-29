'use client'

/**
 * CandidatePreview — a quick look at a 2026 candidate over the page, from the
 * seat map's "standing in 2026" list.
 *
 * Two cases, one look. A candidate who is a sitting MP opens the homepage's
 * own MPPreview — the same card a reader gets from the caucus box, with the
 * bio, the majority and the way through to the full profile. Everyone else
 * opens this: the same shell (scrim, 2px party border, header on the party's
 * light fill, fact rows, a party-coloured button at the foot), built from the
 * only things we hold about a challenger.
 *
 * Which is not much, and it says so. Most challengers are a name, a party and
 * a one-line note from the announcement they were recorded from, with the
 * announcement's link. Nothing is written to fill the card out (§1.8): the
 * note is quoted as it came, and the source is linked, not paraphrased.
 */

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, ExternalLink, X } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { MPPreview } from '@/components/homepage/mp-preview'
import { MP_PROFILES } from '@/constants/mps-data'
import { PARTY_COLORS, PARTY_NAMES } from '@/constants/parties'
import type { Candidate2026 } from '@/constants/candidates-2026'
import { BORDER, INK, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

export function CandidatePreview({ candidate: c, seatName, seatSlug, onClose }: {
  candidate: Candidate2026
  seatName: string
  seatSlug: string
  onClose: () => void
}) {
  // A sitting MP gets the homepage's card as it is (§1.4) — it already has
  // everything, and a second design for the same person would drift.
  const isMp = !!(c.mpSlug && MP_PROFILES[c.mpSlug])

  // Escape closes, and the page behind must not scroll under the panel. Same
  // as MPPreview; skipped when MPPreview is doing it.
  useEffect(() => {
    if (isMp) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [isMp, onClose])

  if (isMp) return <MPPreview slug={c.mpSlug!} onClose={onClose} />

  const party = c.party !== 'independent' ? c.party : undefined
  const colors = party ? PARTY_COLORS[party] : undefined
  const partyName = party ? PARTY_NAMES[party]?.short ?? party : 'Independent'
  const accent = colors?.bg ?? INK
  const source = c.citations?.[0]

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
      aria-label={c.name}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px 12px', background: colors?.light ?? '#f5f3ef' }}>
          <Avatar name={c.name} party={party} size="lg" face />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.2 }}>{c.name}</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, marginTop: 2 }}>
              {partyName} · Standing in {seatName}
            </div>
            {c.withdrawn && (
              <div style={{ display: 'inline-block', marginTop: 5, padding: '2px 8px', borderRadius: 999, background: TERTIARY, color: '#fff', fontSize: 11.5, fontWeight: 800, fontFamily: MANROPE }}>
                Withdrawn
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
          {/* The announcement's own line, quoted as it came — not a bio, and
              not ours (see candidates-2026.ts's note on `notes`). §1.5: when
              there isn't one, say so, rather than leave a gap under the name. */}
          <p style={{ fontSize: 13.5, color: c.notes ? '#33373f' : TERTIARY, fontFamily: MANROPE, lineHeight: 1.6, margin: '8px 0 10px' }}>
            {c.notes ?? 'We don’t hold a profile for this candidate yet, only the announcement that they’re standing.'}
          </p>

          {fact('Standing in', seatName)}
          {fact('Party', partyName)}
          {c.withdrawn && fact('Withdrew', c.withdrawn.date)}

          <Link
            href={`/battlegrounds/${seatSlug}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              marginTop: 14, padding: '10px 14px', borderRadius: 10,
              background: accent, color: colors?.text ?? '#fff',
              fontSize: 14, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none',
            }}
          >
            Everyone standing in {seatName}
            <ArrowRight style={{ width: 15, height: 15 }} />
          </Link>

          {source && (
            <a
              href={source}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, fontSize: 12.5, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, textDecoration: 'none' }}
            >
              Where this is from <ExternalLink style={{ width: 11, height: 11 }} />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
