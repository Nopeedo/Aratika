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

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
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
  const reduce = useReducedMotion()
  // Active party + fade come from the shared PartyCycle clock (synced with the hero accent).
  const { panelSlug, fading, fadeMs, select } = usePartyCycle()
  const cur = parties.find((p) => p.slug === panelSlug) || null

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
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
                cursor: 'pointer', background: p.color,
                boxShadow: on ? '0 16px 28px rgba(0,0,0,.34)' : '0 2px 6px rgba(0,0,0,.10)',
                transform: on ? 'translateY(-8px)' : 'none', transition: 'transform .5s cubic-bezier(.22,1,.36,1), box-shadow .5s ease',
              }}
            />
          )
        })}
      </div>

      {cur && (() => {
        // Centre of the active tile (6 tiles, 10px gaps) → the caret glides here.
        const i = parties.findIndex((p) => p.slug === cur.slug)
        const n = parties.length
        const tileW = `((100% - ${(n - 1) * 10}px) / ${n})`
        const caretLeft = `calc(${i} * (${tileW} + 10px) + ${tileW} / 2)`
        const glide = 'left .85s cubic-bezier(.4,0,.2,1), border-bottom-color .85s ease-in-out'
        return (
          <div style={{
            position: 'relative', marginTop: 18, border: `4px solid ${cur.color}`, borderRadius: 16, background: cur.light,
            minHeight: 440, padding: '20px 22px',
            transition: 'border-color .85s ease-in-out, background-color .85s ease-in-out',
          }}>
            {/* speech-bubble caret — outer (border colour), tip reaches up to the active tile */}
            <span aria-hidden style={{
              position: 'absolute', top: -26, left: caretLeft, marginLeft: -13, width: 0, height: 0,
              borderLeft: '13px solid transparent', borderRight: '13px solid transparent',
              borderBottom: `24px solid ${cur.color}`, transition: glide,
            }} />
            {/* inner fill */}
            <span aria-hidden style={{
              position: 'absolute', top: -17, left: caretLeft, marginLeft: -9, width: 0, height: 0,
              borderLeft: '9px solid transparent', borderRight: '9px solid transparent',
              borderBottom: `18px solid ${cur.light}`, transition: glide,
            }} />
            <div style={{ opacity: fading ? 0 : 1, transition: `opacity ${fadeMs}ms ease-in-out` }}>
              <Panel p={cur} />
            </div>
          </div>
        )
      })()}
    </motion.div>
  )
}

function Panel({ p }: { p: TileParty }) {
  return (
    <div>
      {/* identity (left) + seats (pulled to the right, party-coloured) */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
          <span style={{ fontSize: 'clamp(24px, 6.5vw, 38px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, lineHeight: 1.05 }}>{p.name}</span>
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
