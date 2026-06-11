'use client'

/**
 * MPsDirectory — searchable, filterable list of all current MPs.
 * Filters by party and electorate/list; searches by name or electorate.
 */

import * as React from 'react'
import Link from 'next/link'
import { Search, MapPin, Landmark, ArrowRight } from 'lucide-react'
import { MP_PROFILES } from '@/constants/mps-data'
import { PARTY_PROFILES, PARTY_DIRECTORY_ORDER } from '@/constants/parties-data'
import { Avatar } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/ui/badge'
import { PartySlug } from '@/types'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const ALL_MPS = Object.values(MP_PROFILES).sort((a, b) => {
  const sa = a.name.split(' ').slice(-1)[0]
  const sb = b.name.split(' ').slice(-1)[0]
  return sa.localeCompare(sb)
})

const PARTY_CHIPS: (PartySlug | 'all')[] = ['all', ...PARTY_DIRECTORY_ORDER, 'independent']

export function MPsDirectory() {
  const [query, setQuery]   = React.useState('')
  const [party, setParty]   = React.useState<PartySlug | 'all'>('all')
  const [role, setRole]     = React.useState<'all' | 'electorate' | 'list'>('all')

  const filtered = ALL_MPS.filter((mp) => {
    if (party !== 'all' && mp.party !== party) return false
    if (role !== 'all' && mp.role !== role) return false
    if (query.trim()) {
      const q = query.toLowerCase()
      if (!mp.name.toLowerCase().includes(q) && !(mp.electorate ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>

        {/* Search + role */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 240, maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
              <Search style={{ width: 16, height: 16, color: TERTIARY, margin: '0 10px', flexShrink: 0 }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or electorate…"
                style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 10px 10px 0', fontSize: 14, fontFamily: 'var(--font-geist-sans), sans-serif', color: INK }}
              />
            </div>
          </div>

          {/* Role toggle */}
          <div style={{ display: 'inline-flex', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 3 }}>
            {([['all', 'All'], ['electorate', 'Electorate'], ['list', 'List']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setRole(val)} style={{
                padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, fontFamily: MANROPE,
                background: role === val ? '#fff' : 'transparent',
                color: role === val ? INK : TERTIARY,
                boxShadow: role === val ? '0 1px 3px rgba(12,14,18,.08)' : 'none',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Party chips */}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {PARTY_CHIPS.map((p) => {
            const active = party === p
            const isAll = p === 'all'
            const prof = isAll ? null : PARTY_PROFILES[p]
            return (
              <button key={p} onClick={() => setParty(p)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 13px', borderRadius: 999, cursor: 'pointer',
                fontSize: 12.5, fontWeight: 700, fontFamily: MANROPE,
                border: `1px solid ${active ? (prof?.color ?? INK) : BORDER}`,
                background: active ? (prof?.color ?? INK) : '#fff',
                color: active ? (prof?.textColor ?? '#fff') : SECONDARY,
              }}>
                {!isAll && (
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: active ? (prof?.textColor ?? '#fff') : prof!.color, flexShrink: 0 }} />
                )}
                {isAll ? 'All parties' : prof!.name}
              </button>
            )
          })}
        </div>

        {/* Count */}
        <div style={{ fontSize: 13, color: TERTIARY, fontFamily: MANROPE }}>
          Showing <b style={{ color: INK }}>{filtered.length}</b> of {ALL_MPS.length} current MPs
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: TERTIARY, fontFamily: MANROPE }}>
          No MPs match your filters.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map((mp) => {
            const prof = PARTY_PROFILES[mp.party]
            return (
              <Link key={mp.slug} href={`/mps/${mp.slug}`} style={{ textDecoration: 'none' }}>
                <div className="mp-card" style={{
                  background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16,
                  overflow: 'hidden', boxShadow: '0 2px 4px rgba(12,14,18,.03)',
                  height: '100%', display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ height: 4, background: prof.color }} />
                  <div style={{ padding: '15px 17px', display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <Avatar name={mp.name} party={mp.party} src={mp.photo} size="md" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.15 }}>
                          {mp.name}
                        </div>
                        {mp.title && (
                          <div style={{ fontSize: 11, fontWeight: 700, color: JADE, fontFamily: MANROPE, marginTop: 1 }}>
                            {mp.title}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, background: prof.color, color: prof.textColor, borderRadius: 999, padding: '3px 9px', fontFamily: MANROPE }}>
                        {prof.name}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: SECONDARY, fontFamily: MANROPE }}>
                        {mp.role === 'electorate'
                          ? <><MapPin style={{ width: 12, height: 12, color: TERTIARY }} /> {mp.electorate}</>
                          : <><Landmark style={{ width: 12, height: 12, color: TERTIARY }} /> List MP</>}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
