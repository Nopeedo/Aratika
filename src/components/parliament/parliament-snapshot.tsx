/**
 * ParliamentSnapshot — "Chamber" direction
 *
 * Implements the high-fidelity parliament dashboard design from the
 * Direction B handoff. Key elements:
 *   - Hemicycle SVG: 123 seats in a 6-row arc, coloured by party
 *   - Ranked party list with mini bars
 *   - Three stat tiles: Prime Minister · Governing Coalition · Current Session
 *
 * Typography: Manrope (UI) + Space Grotesk (display numerals)
 * Data source: NZ Parliament API (placeholder data until API integration)
 */

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

// Prime Minister portrait — CC0 (Office of the Governor-General of NZ)
const PM_PHOTO = '/mps/christopher-luxon.jpg'

// ─── Data ─────────────────────────────────────────────────────────────────────
// Placeholder — will be replaced by live NZ Parliament API data in Week 2

type PartyKey = 'national' | 'labour' | 'act' | 'green' | 'nzfirst' | 'tpm'

const PARTIES: Record<PartyKey, { name: string; seats: number; color: string; ink: string }> = {
  national: { name: 'National',       seats: 49, color: '#0A5BA8', ink: '#ffffff' },
  labour:   { name: 'Labour',         seats: 34, color: '#D5202B', ink: '#ffffff' },
  act:      { name: 'ACT',            seats: 11, color: '#F5C518', ink: '#1c1605' },
  green:    { name: 'Green',          seats: 15, color: '#1F8A4C', ink: '#ffffff' },
  nzfirst:  { name: 'NZ First',       seats:  8, color: '#181a1f', ink: '#ffffff' },
  tpm:      { name: 'Te Pāti Māori',  seats:  6, color: '#B11226', ink: '#ffffff' },
}

const TOTAL            = 123
const COALITION        = ['national', 'act', 'nzfirst'] as const
const COALITION_SEATS  = 68
const MAJORITY         = 62
const LARGEST_PARTY    = 49   // National — used as 100% bar reference

// Political-spectrum order (left → right) for the hemicycle seat assignment
const SPECTRUM: PartyKey[] = ['green', 'labour', 'tpm', 'nzfirst', 'national', 'act']

// Ranked by seat count for the list panel
const LIST_ORDER: PartyKey[] = ['national', 'labour', 'green', 'act', 'nzfirst', 'tpm']

const META = {
  pmName:      'Christopher Luxon',
  pmSlug:      'christopher-luxon',
  pmParty:     'national' as PartyKey,
  parliament:  '54th Parliament',
  nextSitting: 'Tuesday 10 June 2026',
  nextElection: '2026',
}

// ─── Hemicycle algorithm ──────────────────────────────────────────────────────
// Port of prHemicycle() from pr-shared.jsx (design handoff)

interface SeatDot {
  x: number
  y: number
  color: string
}

interface HemicycleLayout {
  seats:   SeatDot[]
  width:   number
  height:  number
  dotR:    number
  centerX: number
  baseY:   number
}

function buildHemicycle(): HemicycleLayout {
  const rows    = 6
  const innerR  = 132
  const rowGap  = 30
  const dotR    = 8.4
  const padding = 14

  // Row radii: 132, 162, 192, 222, 252, 282
  const radii = Array.from({ length: rows }, (_, i) => innerR + i * rowGap)
  const sumR  = radii.reduce((a, b) => a + b, 0)

  // Distribute 123 seats across rows proportional to radius
  let counts = radii.map((r) => Math.max(1, Math.round((TOTAL * r) / sumR)))
  let diff    = TOTAL - counts.reduce((a, b) => a + b, 0)
  let idx     = rows - 1
  while (diff !== 0) {
    counts[idx] += diff > 0 ? 1 : -1
    diff         += diff > 0 ? -1 : 1
    idx           = (idx - 1 + rows) % rows
  }

  // Generate all seat positions (angle in radians, π = left, 0 = right)
  const raw: { radius: number; angle: number; row: number }[] = []
  for (let r = 0; r < rows; r++) {
    const n      = counts[r]
    const radius = radii[r]
    for (let k = 0; k < n; k++) {
      const t     = n === 1 ? 0.5 : k / (n - 1)
      const angle = Math.PI - t * Math.PI
      raw.push({ radius, angle, row: r })
    }
  }

  // Sort left→right (descending angle), tie-break inner→outer row
  raw.sort((a, b) => (b.angle - a.angle) || (a.row - b.row))

  // Assign parties by spectrum order
  const seq: PartyKey[] = []
  SPECTRUM.forEach((p) => {
    for (let i = 0; i < PARTIES[p].seats; i++) seq.push(p)
  })

  const outerR  = radii[rows - 1]   // 282
  const svgW    = (outerR + padding) * 2  // 592
  const svgH    = outerR + padding * 2    // 310

  const seats: SeatDot[] = raw.map((s, i) => ({
    x:     outerR + padding + s.radius * Math.cos(s.angle),
    y:     outerR + padding - s.radius * Math.sin(s.angle),
    color: PARTIES[seq[i] ?? 'national'].color,
  }))

  return {
    seats,
    width:   svgW,
    height:  svgH,
    dotR,
    centerX: svgW / 2,
    baseY:   svgH,
  }
}

// Pre-compute at module level (pure, deterministic — fine for SSR)
const arc = buildHemicycle()

// ─── Sub-components ───────────────────────────────────────────────────────────

function Arrow() {
  return (
    <svg
      width="14" height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

// Status row — "Live Parliament Data" pill + meta text
function StatusRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
      {/* Live pill */}
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: '#0c0e12', color: '#fff',
        borderRadius: 999, padding: '7px 14px 7px 12px',
        fontSize: 12, fontWeight: 700, letterSpacing: '.01em',
        fontFamily: 'var(--font-manrope), system-ui, sans-serif',
      }}>
        <span className="live-dot" style={{
          width: 7, height: 7, borderRadius: '50%', background: '#36e08a',
          display: 'inline-block', flexShrink: 0,
        }} />
        Live Parliament Data
      </span>

      {/* Meta */}
      <span style={{
        fontSize: 13, color: '#6b7078', fontWeight: 500,
        fontFamily: 'var(--font-manrope), system-ui, sans-serif',
      }}>
        <b style={{ color: '#0c0e12', fontWeight: 700 }}>{META.parliament}</b>
        {' '}· Next sitting: {META.nextSitting}
      </span>
    </div>
  )
}

// Hemicycle SVG + overlay (total seats, Govt/Maj pills)
function HemicycleSVG() {
  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${arc.width} ${arc.height}`}
        width="100%"
        style={{ display: 'block' }}
        aria-label="Parliament hemicycle — 123 seats coloured by party"
        role="img"
      >
        {arc.seats.map((seat, i) => (
          <circle key={i} cx={seat.x} cy={seat.y} r={arc.dotR} fill={seat.color} />
        ))}
      </svg>

      {/* Centred overlay at the base of the arc */}
      <div style={{
        position: 'absolute',
        left: '50%',
        bottom: 4,
        transform: 'translateX(-50%)',
        textAlign: 'center',
        pointerEvents: 'none',
      }}>
        {/* 123 */}
        <div style={{
          fontSize: 50, fontWeight: 700, lineHeight: 0.9,
          letterSpacing: '-.02em', color: '#0c0e12',
          fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {TOTAL}
        </div>

        {/* SEATS label */}
        <div style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '.18em',
          textTransform: 'uppercase', color: '#9aa0aa', marginTop: 4,
          fontFamily: 'var(--font-manrope), system-ui, sans-serif',
        }}>
          Seats
        </div>

        {/* Govt + Majority pills */}
        <div style={{ display: 'flex', gap: 7, justifyContent: 'center', marginTop: 12 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 11.5, fontWeight: 700,
            border: '1px solid #e9e7e2', borderRadius: 999,
            padding: '4px 10px', color: '#3a3f49',
            fontFamily: 'var(--font-manrope), system-ui, sans-serif',
            background: '#fff',
          }}>
            <i style={{ width: 7, height: 7, borderRadius: '50%', background: '#0c0e12', display: 'inline-block' }} />
            Govt {COALITION_SEATS}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 11.5, fontWeight: 700,
            border: '1px solid #e9e7e2', borderRadius: 999,
            padding: '4px 10px', color: '#3a3f49',
            fontFamily: 'var(--font-manrope), system-ui, sans-serif',
            background: '#fff',
          }}>
            <i style={{ width: 7, height: 7, borderRadius: '50%', background: '#c8ccd2', display: 'inline-block' }} />
            Maj {MAJORITY}
          </span>
        </div>
      </div>
    </div>
  )
}

// Ranked party list with mini bars
function PartyList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      {LIST_ORDER.map((key) => {
        const p = PARTIES[key]
        return (
          <div key={key} style={{
            display: 'grid',
            gridTemplateColumns: '14px 1fr auto',
            alignItems: 'center',
            gap: 12,
          }}>
            {/* Colour swatch */}
            <span style={{
              width: 12, height: 12,
              borderRadius: 4,
              background: p.color,
              display: 'inline-block',
              flexShrink: 0,
            }} />

            {/* Name + mini bar */}
            <div>
              <div style={{
                fontSize: 14, fontWeight: 700, color: '#1a1d24',
                fontFamily: 'var(--font-manrope), system-ui, sans-serif',
              }}>
                {p.name}
              </div>
              <div style={{
                height: 7, borderRadius: 999,
                background: '#f1efeb',
                overflow: 'hidden',
                marginTop: 5,
              }}>
                <div style={{
                  width: `${(p.seats / LARGEST_PARTY) * 100}%`,
                  height: '100%',
                  background: p.color,
                  borderRadius: 999,
                }} />
              </div>
            </div>

            {/* Seat count */}
            <div style={{
              fontSize: 22, fontWeight: 700,
              letterSpacing: '-.02em',
              textAlign: 'right',
              minWidth: 40,
              color: '#0c0e12',
              fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {p.seats}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Hero card — hemicycle + ranked list
function HeroCard() {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e9e7e2',
      borderRadius: 24,
      padding: '26px 30px 30px',
      boxShadow: '0 2px 4px rgba(12,14,18,.03), 0 24px 48px -28px rgba(12,14,18,.22)',
      marginBottom: 16,
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
      }}>
        <div style={{
          fontSize: 17, fontWeight: 800,
          letterSpacing: '-.01em',
          whiteSpace: 'nowrap',
          color: '#0c0e12',
          fontFamily: 'var(--font-manrope), system-ui, sans-serif',
        }}>
          Seat Distribution — {META.parliament}
        </div>
        <Link
          href="/parliament"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            color: '#0c0e12', fontWeight: 800, fontSize: 13,
            textDecoration: 'none', whiteSpace: 'nowrap',
            fontFamily: 'var(--font-manrope), system-ui, sans-serif',
          }}
        >
          View detail <Arrow />
        </Link>
      </div>

      {/* Two-column grid: SVG left, list right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.05fr .95fr',
        gap: 30,
        alignItems: 'center',
      }}>
        <HemicycleSVG />
        <PartyList />
      </div>
    </div>
  )
}

// Tile label
function TileLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10.5, fontWeight: 800,
      letterSpacing: '.14em', textTransform: 'uppercase',
      color: '#9aa0aa', marginBottom: 14,
      fontFamily: 'var(--font-manrope), system-ui, sans-serif',
    }}>
      {children}
    </div>
  )
}

// PM tile
function PMTile() {
  const pm = PARTIES[META.pmParty]
  return (
    <div style={tileStyle}>
      <TileLabel>Prime Minister</TileLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        {/* Avatar — PM portrait */}
        <Link
          href={`/mps/${META.pmSlug}`}
          style={{
            width: 48, height: 48,
            borderRadius: 14,
            overflow: 'hidden',
            flexShrink: 0,
            display: 'block',
            position: 'relative',
            background: pm.color,
          }}
        >
          <Image
            src={PM_PHOTO}
            alt={META.pmName}
            width={48}
            height={48}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
          />
        </Link>
        <div>
          <Link href={`/mps/${META.pmSlug}`} style={{
            fontSize: 18, fontWeight: 800,
            letterSpacing: '-.01em', lineHeight: 1.1,
            color: '#0c0e12', textDecoration: 'none', display: 'block',
            fontFamily: 'var(--font-manrope), system-ui, sans-serif',
          }}>
            {META.pmName}
          </Link>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            borderRadius: 999,
            padding: '3px 10px',
            fontSize: 11.5, fontWeight: 700,
            marginTop: 7,
            background: pm.color,
            color: pm.ink,
            fontFamily: 'var(--font-manrope), system-ui, sans-serif',
          }}>
            {pm.name}
          </span>
        </div>
      </div>
    </div>
  )
}

// Coalition tile
function CoalitionTile() {
  return (
    <div style={tileStyle}>
      <TileLabel>Governing Coalition</TileLabel>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'baseline' }}>
        {COALITION.map((key, i) => {
          const p = PARTIES[key]
          return (
            <span key={key} style={{
              fontSize: 13, fontWeight: 700, color: '#1a1d24',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-manrope), system-ui, sans-serif',
            }}>
              <i style={{
                width: 8, height: 8,
                borderRadius: '50%',
                background: p.color,
                display: 'inline-block',
                fontStyle: 'normal',
              }} />
              {p.name}&nbsp;
              <b style={{
                fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
                fontWeight: 800, fontVariantNumeric: 'tabular-nums',
              }}>
                {p.seats}
              </b>
              {i < COALITION.length - 1 && (
                <span style={{ color: '#cfd3d8' }}>·</span>
              )}
            </span>
          )
        })}
      </div>
      {/* Combined total */}
      <div style={{
        fontSize: 27, fontWeight: 700,
        letterSpacing: '-.02em', marginTop: 14,
        color: '#0c0e12',
        fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {COALITION_SEATS}{' '}
        <small style={{ fontSize: 14, color: '#9aa0aa', fontWeight: 600, fontFamily: 'var(--font-manrope), system-ui, sans-serif' }}>
          / {TOTAL} seats
        </small>
      </div>
    </div>
  )
}

// Current Session tile
function SessionTile() {
  return (
    <div style={tileStyle}>
      <TileLabel>Current Session</TileLabel>
      <div style={{
        fontSize: 27, fontWeight: 700,
        letterSpacing: '-.02em', color: '#0c0e12',
        fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {META.parliament}
      </div>
      <div style={{
        fontSize: 13, color: '#6b7078', fontWeight: 600,
        marginTop: 12,
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'var(--font-manrope), system-ui, sans-serif',
      }}>
        <span>Next election</span>
        <b style={{
          color: '#0c0e12', fontWeight: 800,
          fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
        }}>
          {META.nextElection}
        </b>
      </div>
      <div style={{ marginTop: 14 }}>
        <Link
          href="/parliament"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            color: '#0c0e12', fontWeight: 800, fontSize: 13,
            textDecoration: 'none',
            fontFamily: 'var(--font-manrope), system-ui, sans-serif',
          }}
        >
          Full overview <Arrow />
        </Link>
      </div>
    </div>
  )
}

// Shared tile style
const tileStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e9e7e2',
  borderRadius: 20,
  padding: '20px 22px',
  boxShadow: '0 2px 4px rgba(12,14,18,.03)',
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function ParliamentSnapshot() {
  return (
    <section
      className="bg-dot-grid"
      style={{ padding: '34px 0 40px', background: '#ffffff' }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 36px' }}>
        <StatusRow />
        <HeroCard />

        {/* Three tiles */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 16,
        }}>
          <PMTile />
          <CoalitionTile />
          <SessionTile />
        </div>
      </div>
    </section>
  )
}
