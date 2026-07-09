'use client'

/**
 * BillsTracker54 — the filterable bills tracker, built on the full 54th-Parliament
 * dataset (src/constants/bills-54.ts, from the official bills API).
 *
 * Designed so a first-time visitor can (1) understand what they're looking at —
 * a plain "how to read this" strip + stage legend — and (2) quickly narrow down
 * by policy area, bill type, stage, or keyword.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Landmark, Users, BadgeCheck, Megaphone, X, ArrowRight } from 'lucide-react'
import { BILLS_54, BILL_CATEGORIES, BILLS_54_META, type Bill54 } from '@/constants/bills-54'
import { PARTY_NAMES } from '@/constants/parties'
import { normMemberName } from '@/lib/bills/normalize-member'
import type { PartySlug } from '@/types'

const normTitle = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const normName = normMemberName

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const TYPE_STYLE: Record<string, { fg: string; bg: string }> = {
  Government: { fg: '#3730a3', bg: '#eef2ff' },
  "Member's": { fg: '#166638', bg: '#e6f4ec' },
  Local: { fg: '#92400e', bg: '#fff7e6' },
  Private: { fg: '#6b7078', bg: '#f1f1ef' },
}

function statusStyle(s: string): { fg: string; bg: string; label: string } {
  if (s === 'Royal Assent') return { fg: '#065f46', bg: '#d1fae5', label: 'Passed into law' }
  if (s === 'Select Committee') return { fg: '#1e40af', bg: '#eef4ff', label: 'Select committee' }
  return { fg: '#92400e', bg: '#fff7e6', label: s }
}

export function BillsTracker54({ readerSlugs = {}, memberParty = {}, initialParty }: { readerSlugs?: Record<string, string>; memberParty?: Record<string, string>; initialParty?: string }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')
  const [type, setType] = useState('All')
  const [status, setStatus] = useState('All')
  const [party, setParty] = useState<string>(initialParty || 'All')
  const partyOf = (m?: string | null) => (m ? memberParty[normName(m)] : undefined)

  const stats = useMemo(() => ({
    total: BILLS_54.length,
    passed: BILLS_54.filter((b) => b.status === 'Royal Assent').length,
    committee: BILLS_54.filter((b) => b.status === 'Select Committee').length,
    government: BILLS_54.filter((b) => b.type === 'Government').length,
    members: BILLS_54.filter((b) => b.type === "Member's").length,
  }), [])

  const statuses = useMemo(() => {
    const order = ['Select Committee', 'First Reading', 'Second Reading', 'Committee of whole House', 'Third Reading', 'Royal Assent']
    const present = [...new Set(BILLS_54.map((b) => b.status))]
    return present.sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99))
  }, [])

  const parties = useMemo(() => {
    const set = new Set<string>()
    for (const b of BILLS_54) { const p = b.member ? memberParty[normName(b.member)] : undefined; if (p) set.add(p) }
    return [...set]
  }, [memberParty])

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return BILLS_54.filter((b) =>
      (cat === 'All' || b.category === cat) &&
      (type === 'All' || b.type === type) &&
      (status === 'All' || b.status === status) &&
      (party === 'All' || (b.member ? memberParty[normName(b.member)] === party : false)) &&
      (!ql || b.title.toLowerCase().includes(ql) || (b.member || '').toLowerCase().includes(ql)),
    ).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [q, cat, type, status, party, memberParty])

  const active = cat !== 'All' || type !== 'All' || status !== 'All' || party !== 'All' || q !== ''
  const reset = () => { setQ(''); setCat('All'); setType('All'); setStatus('All'); setParty('All') }

  return (
    <div>
      {/* How to read this */}
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px', marginBottom: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 8 }}>How to read this</div>
        <p style={{ fontSize: 13, color: '#3f444c', fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 10px' }}>
          A <b>bill</b> is a proposed law. <b style={{ color: '#3730a3' }}>Government bills</b> are led by a Minister; <b style={{ color: '#166638' }}>Member’s bills</b> are put forward by backbench MPs via a ballot. Each bill moves through stages — introduction → <b>select committee</b> (where the public can make submissions) → three readings → <b>Royal Assent</b>, when it becomes law.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { label: 'Passed into law', fg: '#065f46', bg: '#d1fae5' },
            { label: 'Select committee (submissions)', fg: '#1e40af', bg: '#eef4ff' },
            { label: 'In progress', fg: '#92400e', bg: '#fff7e6' },
          ].map((l) => (
            <span key={l.label} style={{ fontSize: 11, fontWeight: 700, color: l.fg, background: l.bg, borderRadius: 999, padding: '3px 10px', fontFamily: MANROPE }}>{l.label}</span>
          ))}
        </div>
      </div>

      {/* Stat chips (click to filter by stage) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
        <StatChip icon={Landmark} value={stats.total} label="Bills this term" active={status === 'All' && type === 'All'} onClick={reset} />
        <StatChip icon={BadgeCheck} value={stats.passed} label="Passed into law" active={status === 'Royal Assent'} onClick={() => setStatus('Royal Assent')} />
        <StatChip icon={Megaphone} value={stats.committee} label="At select committee" active={status === 'Select Committee'} onClick={() => setStatus('Select Committee')} />
        <StatChip icon={Users} value={stats.members} label="Member’s bills" active={type === "Member's"} onClick={() => setType((t) => (t === "Member's" ? 'All' : "Member's"))} />
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: TERTIARY }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bills or MPs…"
            style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 14, fontFamily: MANROPE, color: INK, outline: 'none', background: '#fff' }} />
        </div>
        <Select value={cat} onChange={setCat} options={['All', ...BILL_CATEGORIES]} allLabel="All policy areas" />
        <Select value={type} onChange={setType} options={['All', 'Government', "Member's", 'Local', 'Private']} allLabel="All types" />
        <Select value={status} onChange={setStatus} options={['All', ...statuses]} allLabel="All stages" fmt={(s) => (s === 'Royal Assent' ? 'Passed into law' : s)} />
        {parties.length > 0 && <Select value={party} onChange={setParty} options={['All', ...parties]} allLabel="All parties" fmt={(s) => PARTY_NAMES[s as PartySlug]?.short ?? s} />}
        {active && (
          <button onClick={reset} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: SECONDARY, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '9px 12px', fontFamily: MANROPE, cursor: 'pointer' }}>
            <X style={{ width: 13, height: 13 }} /> Clear
          </button>
        )}
      </div>

      <div style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, marginBottom: 14 }}>
        Showing <b style={{ color: INK }}>{filtered.length}</b> of {stats.total} bills{cat !== 'All' ? ` in ${cat}` : ''}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: SECONDARY, fontFamily: MANROPE, fontSize: 14 }}>
          No bills match those filters. <button onClick={reset} style={{ color: JADE, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: MANROPE, fontSize: 14 }}>Clear filters</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 12 }}>
          {filtered.map((b) => <BillCard key={b.slug + b.number} b={b} readerSlug={readerSlugs[normTitle(b.title)]} />)}
        </div>
      )}
    </div>
  )
}

function BillCard({ b, readerSlug }: { b: Bill54; readerSlug?: string }) {
  const ts = TYPE_STYLE[b.type] ?? TYPE_STYLE.Private
  const ss = statusStyle(b.status)
  const inner = (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 9 }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: ts.fg, background: ts.bg, borderRadius: 999, padding: '2px 9px', fontFamily: MANROPE }}>{b.type}</span>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: ss.fg, background: ss.bg, borderRadius: 999, padding: '2px 9px', fontFamily: MANROPE }}>{ss.label}</span>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: SECONDARY, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '2px 9px', fontFamily: MANROPE }}>{b.category}</span>
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.35, marginBottom: 8 }}>{b.title}</div>
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {b.member && <div style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE }}>In charge: <b style={{ color: '#3f444c' }}>{b.member}</b></div>}
        {b.committee && <div style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE }}>{b.committee} committee</div>}
      </div>
      {readerSlug && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10, fontSize: 12, fontWeight: 800, color: JADE, fontFamily: MANROPE }}>
          Read the breakdown <ArrowRight style={{ width: 13, height: 13 }} />
        </span>
      )}
    </>
  )
  const cardStyle: React.CSSProperties = { border: `1.5px solid ${INK}`, borderRadius: 14, padding: '15px 16px', background: '#fff', display: 'flex', flexDirection: 'column', height: '100%', textDecoration: 'none' }
  return readerSlug
    ? <Link href={`/legislation/${readerSlug}`} className="party-card" style={cardStyle}>{inner}</Link>
    : <div style={cardStyle}>{inner}</div>
}

function StatChip({ icon: Icon, value, label, active, onClick }: { icon: React.ElementType; value: number; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', borderRadius: 12, border: `1px solid ${active ? JADE : BORDER}`, background: active ? '#ecfdf5' : '#fff', cursor: 'pointer', fontFamily: MANROPE }}>
      <Icon style={{ width: 17, height: 17, color: JADE }} />
      <span style={{ fontSize: 18, fontWeight: 800, color: INK }}>{value}</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: SECONDARY }}>{label}</span>
    </button>
  )
}

function Select({ value, onChange, options, allLabel, fmt }: { value: string; onChange: (v: string) => void; options: string[]; allLabel: string; fmt?: (s: string) => string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 13.5, fontFamily: MANROPE, color: INK, background: '#fff', cursor: 'pointer', maxWidth: 200 }}>
      {options.map((o) => <option key={o} value={o}>{o === 'All' ? allLabel : fmt ? fmt(o) : o}</option>)}
    </select>
  )
}
