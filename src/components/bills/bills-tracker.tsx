'use client'

/**
 * BillsTracker — searchable, filterable list of current bills.
 */

import * as React from 'react'
import Link from 'next/link'
import { Search, ArrowRight, Users, Landmark } from 'lucide-react'
import { BILLS, BillKind } from '@/constants/bills-data'
import { BillStatusBadge } from '@/components/ui/badge'
import { BillStatus } from '@/types'
import { formatDateShort } from '@/lib/utils/format'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const DISPLAY = 'var(--font-space-grotesk), system-ui, sans-serif'

const STAGES: { key: BillStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All stages' },
  { key: 'first-reading', label: 'First Reading' },
  { key: 'select-committee', label: 'Select Committee' },
  { key: 'second-reading', label: 'Second Reading' },
  { key: 'third-reading', label: 'Third Reading' },
]

export function BillsTracker() {
  const [query, setQuery] = React.useState('')
  const [kind, setKind]   = React.useState<BillKind | 'all'>('all')
  const [stage, setStage] = React.useState<BillStatus | 'all'>('all')

  const filtered = BILLS.filter((b) => {
    if (kind !== 'all' && b.kind !== kind) return false
    if (stage !== 'all' && b.stage !== stage) return false
    if (query.trim() && !b.title.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 240, maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
              <Search style={{ width: 16, height: 16, color: TERTIARY, margin: '0 10px', flexShrink: 0 }} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search bills…"
                style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 10px 10px 0', fontSize: 14, fontFamily: 'var(--font-geist-sans), sans-serif', color: INK }} />
            </div>
          </div>
          {/* Kind toggle */}
          <div style={{ display: 'inline-flex', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 3 }}>
            {([['all', 'All'], ['government', 'Government'], ['members', "Member's"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setKind(v)} style={{
                padding: '7px 13px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, fontFamily: MANROPE,
                background: kind === v ? '#fff' : 'transparent', color: kind === v ? INK : TERTIARY,
                boxShadow: kind === v ? '0 1px 3px rgba(12,14,18,.08)' : 'none',
              }}>{l}</button>
            ))}
          </div>
        </div>
        {/* Stage chips */}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {STAGES.map((s) => (
            <button key={s.key} onClick={() => setStage(s.key)} style={{
              padding: '6px 13px', borderRadius: 999, cursor: 'pointer',
              fontSize: 12.5, fontWeight: 700, fontFamily: MANROPE,
              border: `1px solid ${stage === s.key ? INK : BORDER}`,
              background: stage === s.key ? INK : '#fff', color: stage === s.key ? '#fff' : SECONDARY,
            }}>{s.label}</button>
          ))}
        </div>
        <div style={{ fontSize: 13, color: TERTIARY, fontFamily: MANROPE }}>
          Showing <b style={{ color: INK }}>{filtered.length}</b> bills
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((b) => (
          <Link key={b.slug} href={`/bills/${b.slug}`} style={{ textDecoration: 'none' }}>
            <div className="mp-card" style={{
              background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14,
              padding: '16px 18px', boxShadow: '0 2px 4px rgba(12,14,18,.03)',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700,
                    color: b.kind === 'government' ? '#1e40af' : '#7c3aed',
                    background: b.kind === 'government' ? '#eff6ff' : '#f5f3ff',
                    border: `1px solid ${b.kind === 'government' ? '#bfdbfe' : '#ddd6fe'}`,
                    borderRadius: 999, padding: '2px 9px', fontFamily: MANROPE,
                  }}>
                    {b.kind === 'government' ? <Landmark style={{ width: 11, height: 11 }} /> : <Users style={{ width: 11, height: 11 }} />}
                    {b.kind === 'government' ? 'Government Bill' : "Member's Bill"}
                  </span>
                  <span style={{ fontSize: 11.5, color: TERTIARY, fontFamily: DISPLAY }}>No. {b.number}</span>
                </div>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.3 }}>
                  {b.title}
                </div>
                <div style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, marginTop: 4, lineHeight: 1.5 }}>
                  {b.summary}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                <BillStatusBadge status={b.stage} />
                {b.selectCommittee && (
                  <span style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE, textAlign: 'right', maxWidth: 150 }}>
                    {b.selectCommittee} Cmte
                  </span>
                )}
                <span style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE }}>
                  {formatDateShort(b.lastActivity)}
                </span>
                <ArrowRight style={{ width: 15, height: 15, color: JADE }} />
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: TERTIARY, fontFamily: MANROPE }}>
            No bills match your filters.
          </div>
        )}
      </div>
    </div>
  )
}
