'use client'

/**
 * BillsTracker54 — the filterable bills tracker, built on the full 54th-Parliament
 * dataset (src/constants/bills-54.ts, from the official bills API).
 *
 * Designed so a first-time visitor can (1) understand what they're looking at —
 * a plain "how to read this" strip + stage legend — and (2) quickly narrow down
 * by policy area, bill type, stage, or keyword.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Landmark, Users, BadgeCheck, Megaphone, X, ArrowRight, ExternalLink, PenLine } from 'lucide-react'
import { BILLS_54, BILL_CATEGORIES, BILLS_54_META, type Bill54 } from '@/constants/bills-54'
import { PARTY_NAMES } from '@/constants/parties'
import { normMemberName } from '@/lib/bills/normalize-member'
import type { PartySlug } from '@/types'

const normTitle = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const normName = normMemberName

const INK = '#17231b', SECONDARY = '#667066', TERTIARY = '#9aa0aa', BORDER = '#e4ebe2', SURFACE = '#eef3ec', JADE = '#1F8A4C'
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
  const [subsOnly, setSubsOnly] = useState(false)
  const partyOf = (m?: string | null) => (m ? memberParty[normName(m)] : undefined)

  // Today's date is resolved AFTER mount, never during render: the server and the
  // browser can straddle midnight (and sit in different timezones), and a date
  // computed in render is a classic hydration mismatch. Until it resolves we
  // simply don't claim submissions are open.
  const [today, setToday] = useState<string | null>(null)
  useEffect(() => {
    setToday(new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })) // en-CA gives YYYY-MM-DD
  }, [])

  /** A bill is open for submissions only while the committee has called for them
   *  AND the closing date hasn't passed. Inviting someone to submit to a closed
   *  committee would waste their time and cost us their trust. */
  const isOpen = (b: Bill54) => Boolean(today && b.submissionsCalled && b.submissionsClose && b.submissionsClose >= today)
  const openCount = useMemo(() => (today ? BILLS_54.filter(isOpen).length : 0), [today])

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
      (!subsOnly || isOpen(b)) &&
      (!ql || b.title.toLowerCase().includes(ql) || (b.member || '').toLowerCase().includes(ql)),
    ).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [q, cat, type, status, party, memberParty, subsOnly, today])

  const active = cat !== 'All' || type !== 'All' || status !== 'All' || party !== 'All' || q !== '' || subsOnly
  const reset = () => { setQ(''); setCat('All'); setType('All'); setStatus('All'); setParty('All'); setSubsOnly(false) }

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

      {/* Open submissions — the one point in a bill's life where the public can
          actually act. Silently advancing a bill to "select committee" without
          telling anyone they can have their say wastes the moment, so surface it
          up front with the deadline. Only shown while something is genuinely open. */}
      {openCount > 0 && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#eef4ff', border: '1px solid #bfd4fe', borderRadius: 14, padding: '14px 16px', marginBottom: 18 }}>
          <PenLine style={{ width: 18, height: 18, color: '#1e40af', flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1e3a8a', fontFamily: MANROPE, marginBottom: 3 }}>
              {openCount} {openCount === 1 ? 'bill is' : 'bills are'} open for public submissions right now
            </div>
            <p style={{ fontSize: 13, color: '#1e40af', fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
              When a bill reaches a select committee, anyone can tell MPs what they think of it — you don’t need to be an expert.{' '}
              <button onClick={() => setSubsOnly(true)} style={{ background: 'none', border: 'none', padding: 0, color: '#1e3a8a', fontWeight: 800, fontFamily: MANROPE, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
                Show me those bills
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Stat chips (click to filter by stage) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
        <StatChip icon={Landmark} value={stats.total} label="Bills this term" active={status === 'All' && type === 'All' && !subsOnly} onClick={reset} />
        <StatChip icon={BadgeCheck} value={stats.passed} label="Passed into law" active={status === 'Royal Assent'} onClick={() => setStatus('Royal Assent')} />
        <StatChip icon={Megaphone} value={stats.committee} label="At select committee" active={status === 'Select Committee'} onClick={() => setStatus('Select Committee')} />
        {openCount > 0 && <StatChip icon={PenLine} value={openCount} label="Open for submissions" active={subsOnly} onClick={() => setSubsOnly((v) => !v)} />}
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
          {filtered.map((b) => <BillCard key={b.slug + b.number} b={b} readerSlug={readerSlugs[normTitle(b.title)]} submissionsOpen={isOpen(b)} />)}
        </div>
      )}
    </div>
  )
}

/** Card is a <div>, not one big <Link>: it now carries several distinct
 *  destinations (our breakdown, the official page, the submission call), and
 *  anchors can't legally nest inside one another. */
function BillCard({ b, readerSlug, submissionsOpen }: { b: Bill54; readerSlug?: string; submissionsOpen?: boolean }) {
  const ts = TYPE_STYLE[b.type] ?? TYPE_STYLE.Private
  const ss = statusStyle(b.status)
  const cardStyle: React.CSSProperties = {
    border: `1px solid ${submissionsOpen ? '#bfd4fe' : BORDER}`, borderRadius: 14, padding: '15px 16px',
    background: '#fff', display: 'flex', flexDirection: 'column', height: '100%',
  }
  return (
    <div className="party-card" style={cardStyle}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 9 }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: ts.fg, background: ts.bg, borderRadius: 999, padding: '2px 9px', fontFamily: MANROPE }}>{b.type}</span>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: ss.fg, background: ss.bg, borderRadius: 999, padding: '2px 9px', fontFamily: MANROPE }}>{ss.label}</span>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: SECONDARY, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '2px 9px', fontFamily: MANROPE }}>{b.category}</span>
      </div>

      {readerSlug ? (
        <Link href={`/legislation/${readerSlug}`} style={{ fontSize: 14.5, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.35, marginBottom: 8, textDecoration: 'none' }}>{b.title}</Link>
      ) : (
        <div style={{ fontSize: 14.5, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.35, marginBottom: 8 }}>{b.title}</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {b.member && <div style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE }}>In charge: <b style={{ color: '#3f444c' }}>{b.member}</b></div>}
        {b.committee && <div style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE }}>{b.committee} committee</div>}
      </div>

      {/* Have your say — only while submissions are genuinely open. */}
      {submissionsOpen && (
        <div style={{ marginTop: 10, background: '#eef4ff', border: '1px solid #bfd4fe', borderRadius: 10, padding: '9px 11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#1e3a8a', fontFamily: MANROPE }}>
            <PenLine style={{ width: 13, height: 13 }} /> You can have your say on this bill
          </div>
          <div style={{ fontSize: 11.5, color: '#1e40af', fontFamily: MANROPE, marginTop: 3 }}>
            Submissions close {fmtDate(b.submissionsClose)}
          </div>
          <a href={b.officialUrl} target="_blank" rel="noopener noreferrer"
             style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 12, fontWeight: 800, color: '#1e3a8a', fontFamily: MANROPE, textDecoration: 'none' }}>
            How to make a submission <ExternalLink style={{ width: 11, height: 11 }} />
          </a>
        </div>
      )}

      <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        {readerSlug && (
          <Link href={`/legislation/${readerSlug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
            Read the breakdown <ArrowRight style={{ width: 13, height: 13 }} />
          </Link>
        )}
        {/* Every bill links to its exact page on Parliament's site, so any claim
            here can be checked at source rather than taken on trust. */}
        <a href={b.officialUrl} target="_blank" rel="noopener noreferrer"
           style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, textDecoration: 'none' }}>
          Official page <ExternalLink style={{ width: 11, height: 11 }} />
        </a>
      </div>
    </div>
  )
}

/** "13 August 2026" — plain and unambiguous; ISO dates read as jargon. */
function fmtDate(iso?: string | null) {
  if (!iso) return 'soon'
  const d = new Date(`${iso}T00:00:00Z`)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
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
