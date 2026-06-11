/**
 * MPCard — FUT-style party-coloured profile card (trial format).
 *
 * Portrait card: party-colour header with the MP's photo + name, then a 6-field
 * info grid (the trading-card "stat grid", repurposed for MP facts). No ratings.
 * Presentational only — safe to remove to revert the profile to its old header.
 */

import Image from 'next/image'
import type { MPProfile } from '@/constants/mps-data'
import type { PartyProfile } from '@/constants/parties-data'
import { formatNumber } from '@/lib/utils/format'

const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const DISPLAY = 'var(--font-space-grotesk), system-ui, sans-serif'

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

// Darken a hex colour by a factor (0–1) for the card gradient.
function darken(hex: string, f = 0.78) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  const r = Math.round(((n >> 16) & 255) * f)
  const g = Math.round(((n >> 8) & 255) * f)
  const b = Math.round((n & 255) * f)
  return `rgb(${r}, ${g}, ${b})`
}

export function MPCard({ mp, party }: { mp: MPProfile; party: PartyProfile }) {
  const ink = party.textColor               // text colour that contrasts the party colour
  const subInk = ink === '#ffffff' ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.6)'
  const roleAbbr = mp.role === 'electorate' ? 'MP' : 'LIST'
  const roleLong = mp.title ? mp.title : (mp.role === 'electorate' ? 'Electorate MP' : 'List MP')

  // 6 info fields (the repurposed "stat grid")
  const fields: { label: string; value: string }[] = [
    { label: 'Party',      value: party.name },
    { label: 'Role',       value: mp.role === 'electorate' ? 'Electorate' : 'List' },
    { label: 'Electorate', value: mp.role === 'electorate' ? (mp.electorate ?? '—') : 'List MP' },
    { label: 'Status',     value: mp.status === 'active' ? 'Active' : 'Former' },
    { label: 'Entered',    value: mp.enteredParliament ? String(mp.enteredParliament) : '—' },
    { label: 'Majority',   value: typeof mp.electorateMajority === 'number' ? formatNumber(mp.electorateMajority) : '—' },
  ]

  return (
    <div style={{
      width: 320, maxWidth: '100%',
      borderRadius: 22, overflow: 'hidden',
      border: `1px solid rgba(0,0,0,0.08)`,
      boxShadow: '0 2px 4px rgba(12,14,18,.04), 0 30px 60px -30px rgba(12,14,18,.45)',
      background: '#fff',
    }}>
      {/* ── Coloured header ── */}
      <div style={{
        background: `linear-gradient(160deg, ${party.color} 0%, ${darken(party.color)} 100%)`,
        padding: '18px 20px 22px',
        position: 'relative',
      }}>
        {/* Top row: role chip + party crest */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: ink, fontFamily: DISPLAY, letterSpacing: '-.02em' }}>
              {roleAbbr}
            </div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: subInk, fontFamily: MANROPE, marginTop: 3 }}>
              {mp.role === 'electorate' ? 'Electorate' : 'Party list'}
            </div>
          </div>
          {/* Party crest = initial in a ring */}
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            border: `2px solid ${ink}`, color: ink,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, fontFamily: MANROPE,
            background: 'rgba(255,255,255,0.12)',
          }}>
            {party.name.slice(0, 2).toUpperCase()}
          </div>
        </div>

        {/* Photo */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 14px' }}>
          <div style={{
            width: 150, height: 150, borderRadius: 18, overflow: 'hidden',
            background: 'rgba(255,255,255,0.15)',
            border: `2px solid ${ink === '#ffffff' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.15)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {mp.photo ? (
              <Image src={mp.photo} alt={mp.name} width={150} height={150}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
            ) : (
              <span style={{ fontSize: 48, fontWeight: 800, color: ink, fontFamily: MANROPE }}>{initials(mp.name)}</span>
            )}
          </div>
        </div>

        {/* Name */}
        <div style={{
          fontSize: 22, fontWeight: 800, letterSpacing: '-.01em', color: ink,
          fontFamily: MANROPE, textAlign: 'center', lineHeight: 1.1, textTransform: 'uppercase',
        }}>
          {mp.name}
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: subInk, fontFamily: MANROPE, textAlign: 'center', marginTop: 4 }}>
          {roleLong}
        </div>
      </div>

      {/* ── Info grid (repurposed stat grid) ── */}
      <div style={{ padding: '16px 18px 18px', background: '#fff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 18px' }}>
          {fields.map((f) => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{
                fontSize: 16, fontWeight: 700, color: '#0c0e12', fontFamily: DISPLAY,
                minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                flex: '0 1 auto',
              }} title={f.value}>
                {f.value}
              </span>
              <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9aa0aa', fontFamily: MANROPE }}>
                {f.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
