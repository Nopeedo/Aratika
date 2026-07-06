'use client'

/**
 * WarRoomHero — the "war room" portrayal of a battleground: a dark tactical
 * header with a live countdown to election day and a swing gauge showing the
 * real, computed number of votes that would need to switch sides to flip the
 * seat (ceil(majority / 2) — true regardless of the seat's total turnout, so
 * nothing here is estimated or invented).
 *
 * Client component only for the date math (must run after mount so the
 * server-rendered HTML and first client paint agree — see ElectionCountdown).
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import type { PartySlug } from '@/types'

const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const NEXT_ELECTION_DATE = new Date('2026-11-07T09:00:00+13:00')

// Schematic incumbent-side share of the gauge bar, by margin tier — NOT a real
// vote-share figure (we don't have total-turnout data to compute one honestly).
// It exists purely so a "safe" seat visibly reads as lopsided and an
// "ultra-marginal" one reads as a near-even split, matching the tier label
// shown right above it, instead of every seat looking identically 50/50.
const SHARE_BY_TIER: Record<string, number> = { ultra: 50.5, marginal: 58, competitive: 70, safe: 85 }

export function WarRoomHero({
  electorateName,
  regionLine,
  tierKey,
  tierLabel,
  tierColor,
  majority,
  incumbentColor,
  incumbentName,
  incumbentSub,
  incumbentParty,
  incumbentPhoto,
  challengerLabel,
  challengerColor,
  challengerName,
  challengerParty,
  challengerPhoto,
}: {
  electorateName: string
  regionLine: string
  tierKey: string
  tierLabel: string
  tierColor: string
  majority?: number
  incumbentColor: string
  incumbentName: string
  incumbentSub: string
  incumbentParty?: PartySlug
  incumbentPhoto?: string
  challengerLabel: string
  challengerColor: string
  challengerName?: string
  challengerParty?: PartySlug
  challengerPhoto?: string
}) {
  const [days, setDays] = useState<number | null>(null)
  useEffect(() => {
    setDays(Math.ceil((NEXT_ELECTION_DATE.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  }, [])

  const swing = majority != null ? Math.ceil(majority / 2) : null
  const incumbentShare = SHARE_BY_TIER[tierKey] ?? 50.5
  const closeRace = incumbentShare <= 58

  return (
    <div style={{ background: '#0c0e12' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 36px 28px' }}>
        <Link href="/battlegrounds" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.6)', textDecoration: 'none', fontFamily: MANROPE, marginBottom: 18 }}>
          <ArrowLeft style={{ width: 14, height: 14 }} /> All battlegrounds
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: tierColor }} />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: tierColor, fontFamily: MANROPE }}>{tierLabel} battleground</span>
            </div>
            <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-.02em', color: '#fff', fontFamily: MANROPE, margin: '0 0 4px', lineHeight: 1.05 }}>{electorateName}</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.55)', fontFamily: MANROPE, margin: 0 }}>{regionLine}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#36e08a', fontFamily: MANROPE, lineHeight: 1 }}>{days ?? '—'}</div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.5)', fontFamily: MANROPE, marginTop: 2 }}>days to election day</div>
          </div>
        </div>

        {majority != null && swing != null && (
          <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: '.04em', fontFamily: MANROPE, marginBottom: 12 }}>
              What it takes to flip this seat
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flexShrink: 0, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)' }}>
                <Avatar name={incumbentName} party={incumbentParty} src={incumbentPhoto} size="sm" face />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ position: 'relative', height: 8, borderRadius: 4, background: `linear-gradient(90deg, ${incumbentColor}, ${incumbentColor} ${incumbentShare - 1}%, ${challengerColor} ${incumbentShare + 1}%, ${challengerColor})`, marginBottom: 4 }}>
                  <div style={{ position: 'absolute', left: `calc(${incumbentShare}% - 1px)`, top: -3, width: 2, height: 14, background: '#fbbf24' }} />
                </div>
              </div>
              <div style={{ flexShrink: 0, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)' }}>
                <Avatar name={challengerName ?? '?'} party={challengerParty} src={challengerPhoto} size="sm" face />
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,.75)', fontFamily: MANROPE, lineHeight: 1.55, margin: '12px 0 0' }}>
              {incumbentName} won by <b style={{ color: '#fff' }}>{majority.toLocaleString('en-NZ')}</b> votes in 2023 — {closeRace ? 'just ' : ''}<b style={{ color: '#fff' }}>{swing.toLocaleString('en-NZ')}</b> {swing === 1 ? 'voter' : 'voters'} switching to {challengerLabel} would have flipped {electorateName}.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
