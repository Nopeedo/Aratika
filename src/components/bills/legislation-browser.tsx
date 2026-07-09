'use client'

/**
 * LegislationBrowser — filterable index of the plain-language bill breakdowns on
 * /legislation. Search by title, filter by policy topic and parliamentary stage,
 * and sort by newest/oldest. Jade theme; each card links to /legislation/[slug].
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { FileText, ArrowRight, Search, Sparkles } from 'lucide-react'
import type { LiveBill } from '@/lib/bills/live'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import type { PolicyTopic } from '@/types'

const CARD = '#ffffff', SOFT = '#eef3ec', INK = '#17231b', MUTED = '#667066', LINE = '#e4ebe2'
const ACCENT = '#1F8A4C', ACCENT_DK = '#14663a'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const STAGE_LABEL: Record<string, string> = {
  'introduced': 'Introduced',
  'first-reading': 'First reading',
  'select-committee': 'Select committee',
  'second-reading': 'Second reading',
  'committee-of-whole-house': 'Committee of the whole House',
  'third-reading': 'Third reading',
  'royal-assent': 'Now law',
}
const STAGE_ORDER = Object.keys(STAGE_LABEL)

export function LegislationBrowser({ bills }: { bills: LiveBill[] }) {
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('all')
  const [stage, setStage] = useState('all')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')

  const topicCounts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const b of bills) for (const p of b.policyLinks) c[p.topic] = (c[p.topic] || 0) + 1
    return c
  }, [bills])
  const topicKeys = Object.keys(topicCounts).sort((a, b) => topicCounts[b] - topicCounts[a])
  const stageKeys = STAGE_ORDER.filter((s) => bills.some((b) => b.stage === s))

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = bills.filter((b) =>
      (!q || b.title.toLowerCase().includes(q) || (b.summary ?? '').toLowerCase().includes(q)) &&
      (topic === 'all' || b.policyLinks.some((p) => p.topic === topic)) &&
      (stage === 'all' || b.stage === stage),
    )
    return list.sort((a, b) => {
      const da = a.published ?? '', db = b.published ?? ''
      return sort === 'newest' ? db.localeCompare(da) : da.localeCompare(db)
    })
  }, [bills, query, topic, stage, sort])

  if (bills.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Sparkles style={{ width: 28, height: 28, color: ACCENT }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 10px' }}>Breakdowns are on the way</h2>
        <p style={{ fontSize: 15, color: MUTED, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>
          We pull bills daily from the official register and draft a plain-language breakdown of each. They appear here once an Aratika editor has reviewed them for accuracy and neutrality. Check back shortly.
        </p>
      </div>
    )
  }

  const selInput: React.CSSProperties = { height: 40, border: `1px solid ${LINE}`, background: CARD, color: INK, borderRadius: 10, fontSize: 13.5, fontFamily: MANROPE, padding: '0 12px', cursor: 'pointer' }

  return (
    <div>
      {/* filter bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: MUTED }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search bills…" aria-label="Search bills"
            style={{ width: '100%', height: 40, border: `1px solid ${LINE}`, background: CARD, color: INK, borderRadius: 10, fontSize: 13.5, fontFamily: MANROPE, padding: '0 12px 0 34px', outline: 'none' }} />
        </div>
        <select value={stage} onChange={(e) => setStage(e.target.value)} aria-label="Stage" style={selInput}>
          <option value="all">All stages</option>
          {stageKeys.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')} aria-label="Sort" style={selInput}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {/* topic chips */}
      {topicKeys.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
          <Chip label="All topics" active={topic === 'all'} onClick={() => setTopic('all')} />
          {topicKeys.map((t) => (
            <Chip key={t} label={`${POLICY_TOPICS[t as PolicyTopic]?.label ?? t} (${topicCounts[t]})`} active={topic === t} onClick={() => setTopic(topic === t ? 'all' : t)} />
          ))}
        </div>
      )}

      <div style={{ fontSize: 13, color: MUTED, fontFamily: MANROPE, marginBottom: 14 }}>
        Showing <b style={{ color: INK }}>{filtered.length}</b> of {bills.length} breakdowns
      </div>

      {filtered.length === 0 ? (
        <p style={{ fontSize: 14, color: MUTED, fontFamily: MANROPE, padding: '10px 2px' }}>No breakdowns match those filters. <button onClick={() => { setQuery(''); setTopic('all'); setStage('all') }} style={{ color: ACCENT_DK, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: MANROPE, fontSize: 14 }}>Clear filters</button></p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map((b) => (
            <Link key={b.id} href={`/legislation/${b.slug}`} className="party-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: CARD, border: `1px solid ${LINE}`, borderRadius: 18, padding: '20px 22px', textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: ACCENT_DK, background: SOFT, border: `1px solid ${LINE}`, borderRadius: 999, padding: '2px 9px', fontFamily: MANROPE, textTransform: 'capitalize' }}><FileText style={{ width: 11, height: 11 }} /> {b.docType}</span>
                {b.stage && STAGE_LABEL[b.stage] && <span style={{ fontSize: 10.5, fontWeight: 800, color: b.stage === 'royal-assent' ? ACCENT_DK : '#92400e', background: b.stage === 'royal-assent' ? '#e0f3e7' : '#f8ecd4', borderRadius: 999, padding: '2px 9px', fontFamily: MANROPE }}>{STAGE_LABEL[b.stage]}</span>}
              </div>
              <div style={{ fontSize: 16.5, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.3, marginBottom: 8 }}>{b.title}</div>
              <p style={{ fontSize: 13.5, color: MUTED, fontFamily: MANROPE, lineHeight: 1.55, margin: '0 0 14px', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.summary}</p>
              {b.policyLinks.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                  {b.policyLinks.slice(0, 4).map((p) => {
                    const meta = POLICY_TOPICS[p.topic as PolicyTopic]
                    return meta ? <span key={p.topic} style={{ fontSize: 11, fontWeight: 700, color: MUTED, background: SOFT, border: `1px solid ${LINE}`, borderRadius: 999, padding: '3px 9px', fontFamily: MANROPE }}>{meta.label}</span> : null
                  })}
                </div>
              )}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: ACCENT_DK, fontFamily: MANROPE }}>Read the breakdown <ArrowRight style={{ width: 14, height: 14 }} /></span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ fontSize: 12.5, fontWeight: 700, fontFamily: MANROPE, padding: '6px 12px', borderRadius: 999, cursor: 'pointer', color: active ? '#fff' : INK, background: active ? INK : CARD, border: `1px solid ${active ? INK : LINE}` }}>
      {label}
    </button>
  )
}
