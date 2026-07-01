'use client'

/**
 * PartyTiles — a row of party-coloured SQUARE tiles (one per parliamentary party,
 * untitled, colour only). Tapping a tile expands a factual snapshot panel BENEATH
 * the row (the tiles never move): seats, party leader, and every VERIFIED policy
 * stance for that party (sourced, neutral — from the approved positions pipeline).
 * Same layout for every party; only the colour theme changes. One panel open at a
 * time. Facts only — no vote share, no characterising language. Data is assembled
 * server-side (see party-tiles-section.tsx) so heavy datasets stay off the client.
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Armchair } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { usePartyCycle } from '@/components/homepage/party-cycle'
import type { PartySlug } from '@/types'

export interface TilePosition { topic: string; label: string; stance: string; sourceUrl: string | null; href: string; fromProfile?: boolean }
export interface TileParty {
  slug: PartySlug
  name: string
  color: string
  light: string
  textColor: string
  leader: string
  leaderTitle: string
  leaderPhoto?: string
  leaderHref: string | null
  role: string
  seats: number
  electorateSeats: number
  listSeats: number
  founded: number
  website: string
  profileHref: string
  positions: TilePosition[]
  topicsTotal: number
}

const INK = '#2A1206', SUB = '#6b5f54', MUTE = '#a99d8f', LINE = '#ece8e1'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

/** Darken party colours that are too light (e.g. ACT's yellow) so the seat
 *  number/icon stays legible on the pale panel. Dark colours pass through. */
function seatColor(hex: string): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  if (lum < 0.6) return hex
  const f = 0.58
  const d = (v: number) => Math.round(v * f).toString(16).padStart(2, '0')
  return `#${d(r)}${d(g)}${d(b)}`
}

export function PartyTiles({ parties }: { parties: TileParty[] }) {
  // Active party + fade come from the shared PartyCycle clock (synced with the hero accent).
  const { panelSlug, fading, fadeMs, select } = usePartyCycle()
  const cur = parties.find((p) => p.slug === panelSlug) || null

  // Detect when the tile row is "stuck" under the navbar, to add a header shadow.
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < 64),
      { threshold: 0, rootMargin: '-64px 0px 0px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <>
      {/* Sentinel just above the sticky bar — flags the stuck state for the header shadow. */}
      <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />

      {/* THE reference point: the full-size tile row, sticky under the navbar (top:64), so it
          rides the whole page at its original dimensions. The band itself is TRANSPARENT — the
          tiles float over the homepage content scrolling behind them, lifting off with a shadow
          that deepens once they're pinned over the page. */}
      <div style={{ position: 'sticky', top: 64, zIndex: 40, background: 'transparent', pointerEvents: 'none' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '12px clamp(18px, 5vw, 36px)' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {parties.map((p) => {
              const on = p.slug === panelSlug
              return (
                <button
                  key={p.slug}
                  onClick={() => select(on ? null : p.slug)}
                  aria-label={p.name + ' — show snapshot'}
                  aria-expanded={on}
                  title={p.name}
                  style={{
                    flex: '1 1 0', minWidth: 0, aspectRatio: '1 / 1', borderRadius: 14, border: 'none', padding: 0,
                    cursor: 'pointer', background: p.color, pointerEvents: 'auto',
                    boxShadow: on
                      ? '0 16px 30px rgba(0,0,0,.34)'
                      : stuck ? '0 10px 24px rgba(0,0,0,.24)' : '0 2px 6px rgba(0,0,0,.10)',
                    transform: on ? 'translateY(-6px)' : 'none', transition: 'transform .5s cubic-bezier(.22,1,.36,1), box-shadow .35s ease',
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Snapshot panel — in flow, directly below the tiles; scrolls away as you move down the page. */}
      {cur && (
        <section style={{ background: '#fff' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '4px clamp(18px, 5vw, 36px) 40px' }}>
            <div style={{
              border: `4px solid ${cur.color}`, borderRadius: 16, background: cur.light,
              minHeight: 440, padding: '20px 22px',
              transition: 'border-color .85s ease-in-out, background-color .85s ease-in-out',
            }}>
              <div style={{ opacity: fading ? 0 : 1, transition: `opacity ${fadeMs}ms ease-in-out` }}>
                <Panel p={cur} />
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}

function Panel({ p }: { p: TileParty }) {
  return (
    <div>
      {/* identity (left) + seats (pulled to the right, party-coloured) */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
          <span style={{ fontSize: 'clamp(21px, 5.2vw, 38px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, lineHeight: 1.05 }}>{p.name}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Armchair style={{ width: 21, height: 21, color: seatColor(p.color) }} strokeWidth={2.4} aria-hidden />
            <span style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: seatColor(p.color), fontFamily: MANROPE }}>{p.seats}</span>
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: SUB, marginTop: 4, textTransform: 'uppercase', letterSpacing: '.04em', fontFamily: MANROPE }}>Seats in Parliament</div>
        </div>
      </div>

      {/* leader — moved up now the stat box is gone */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 0 14px', borderTop: `1px solid ${LINE}` }}>
        <Avatar name={p.leader} party={p.slug} src={p.leaderPhoto} size="md" face />
        <span>
          <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE }}>
            {p.leaderHref ? <Link href={p.leaderHref} style={{ color: INK, textDecoration: 'none' }}>{p.leader}</Link> : p.leader}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: SUB, marginTop: 1, fontFamily: MANROPE }}>{p.leaderTitle}</div>
        </span>
      </div>

      {/* where they stand */}
      <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: SUB, margin: '6px 0 9px', fontFamily: MANROPE }}>Where they stand · in their words</p>
      {p.positions.map((pos, i) => (
        <div key={pos.topic} style={{ display: 'flex', gap: 10, padding: '9px 0', borderTop: i === 0 ? 'none' : `1px solid ${LINE}` }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: p.color, marginTop: 5, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 800, width: 98, flexShrink: 0, color: INK, fontFamily: MANROPE }}>{pos.label}</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#3f372f', lineHeight: 1.45, flex: 1, fontFamily: MANROPE }}>
            {pos.stance}{' '}
            {pos.fromProfile
              ? <Link href={pos.href} style={{ fontSize: 11, fontWeight: 700, fontStyle: 'italic', color: MUTE, whiteSpace: 'nowrap', textDecoration: 'none' }}>· stated priority</Link>
              : pos.sourceUrl && <a href={pos.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 700, color: p.color, whiteSpace: 'nowrap', textDecoration: 'none' }}>· source ↗</a>}
          </span>
        </div>
      ))}
      {p.positions.length < p.topicsTotal && (
        <p style={{ fontSize: 11.5, color: MUTE, fontStyle: 'italic', margin: '10px 0 0', fontFamily: MANROPE }}>
          {p.positions.length} of {p.topicsTotal} policy topics captured so far — more being added.
        </p>
      )}

      {/* footer links */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${LINE}` }}>
        <Link href="/compare" style={{ fontSize: 12.5, fontWeight: 800, color: p.color, textDecoration: 'none', fontFamily: MANROPE }}>Compare topics →</Link>
        <Link href={p.profileHref} style={{ fontSize: 12.5, fontWeight: 800, color: p.color, textDecoration: 'none', fontFamily: MANROPE }}>Full profile →</Link>
        <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, fontWeight: 800, color: p.color, textDecoration: 'none', fontFamily: MANROPE }}>Official website ↗</a>
      </div>
      <p style={{ fontSize: 11, color: MUTE, margin: '9px 0 0', fontFamily: MANROPE }}>
        Founded {p.founded}. Seats: NZ Parliament. Stances summarised from each party’s official policy pages.
      </p>
    </div>
  )
}
