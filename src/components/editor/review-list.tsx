'use client'

/**
 * ReviewList — the editorial queue. Each pending item shows a LIVE PREVIEW of how
 * it will appear on the public site (the same BillBreakdown the reader uses), an
 * editable summary that updates the preview as you type, and Approve / Reject.
 * Only approved items ever reach the public site.
 */

import { useState } from 'react'
import { Check, FileText, ExternalLink, Loader2, Eye } from 'lucide-react'
import { BillBreakdown, type PolicyLink } from '@/components/bills/bill-breakdown'
import { StageTracker } from '@/components/bills/stage-tracker'
import { HaveYourSay } from '@/components/bills/have-your-say'
import { billSlugFromLink } from '@/lib/bills/slug'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export interface PendingItem {
  id: string
  type: string
  title: string
  data: Record<string, unknown>
  summary: string | null
  change_kind: string
  source_url: string | null
  fetched_at: string | null
}

export function ReviewList({ initial }: { initial: PendingItem[] }) {
  const [items, setItems] = useState(initial)
  const [done, setDone] = useState<{ approved: number; rejected: number }>({ approved: 0, rejected: 0 })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkErr, setBulkErr] = useState<string | null>(null)

  const remove = (id: string, action: 'approve' | 'reject') => {
    setItems((xs) => xs.filter((x) => x.id !== id))
    setSelected((s) => { const n = new Set(s); n.delete(id); return n })
    setDone((d) => ({ ...d, [action === 'approve' ? 'approved' : 'rejected']: d[action === 'approve' ? 'approved' : 'rejected'] + 1 }))
  }

  const toggleSel = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const allSelected = items.length > 0 && selected.size === items.length
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)))

  async function bulk(action: 'approve' | 'reject') {
    if (selected.size === 0) return
    const verb = action === 'approve' ? 'Approve & publish' : 'Reject'
    if (!window.confirm(`${verb} ${selected.size} item${selected.size === 1 ? '' : 's'}?${action === 'approve' ? ' They’ll go live on the public site immediately.' : ''}`)) return
    setBulkBusy(true); setBulkErr(null)
    const ids = [...selected]
    try {
      const res = await fetch('/api/editor/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, action }) })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Failed') }
      const idset = new Set(ids)
      setItems((xs) => xs.filter((x) => !idset.has(x.id)))
      setDone((d) => ({ ...d, [action === 'approve' ? 'approved' : 'rejected']: d[action === 'approve' ? 'approved' : 'rejected'] + ids.length }))
      setSelected(new Set())
    } catch (e) { setBulkErr(e instanceof Error ? e.message : 'Failed') }
    setBulkBusy(false)
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: SECONDARY, fontFamily: MANROPE }}>
        <Check style={{ width: 32, height: 32, color: JADE, margin: '0 auto 12px' }} />
        <div style={{ fontSize: 17, fontWeight: 800, color: INK }}>Queue clear</div>
        <p style={{ fontSize: 14, marginTop: 6 }}>Nothing waiting for review. {done.approved + done.rejected > 0 && `(${done.approved} approved, ${done.rejected} rejected this session.)`}</p>
      </div>
    )
  }

  const bBtn = (disabled: boolean, primary: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 800, fontFamily: MANROPE,
    cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
    border: primary ? 'none' : `1px solid ${BORDER}`, background: primary ? JADE : '#fff', color: primary ? '#fff' : '#b42318',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Bulk-action toolbar */}
      <div style={{ position: 'sticky', top: 8, zIndex: 5, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '10px 14px', boxShadow: '0 2px 8px rgba(12,14,18,.05)' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: INK, fontFamily: MANROPE, cursor: 'pointer' }}>
          <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: JADE }} />
          Select all ({items.length})
        </label>
        <span style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE }}><b style={{ color: INK }}>{selected.size}</b> selected</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => bulk('approve')} disabled={selected.size === 0 || bulkBusy} style={bBtn(selected.size === 0 || bulkBusy, true)}>
            {bulkBusy ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Check style={{ width: 14, height: 14 }} />} Approve selected
          </button>
          <button onClick={() => bulk('reject')} disabled={selected.size === 0 || bulkBusy} style={bBtn(selected.size === 0 || bulkBusy, false)}>Reject selected</button>
        </div>
        {bulkErr && <div style={{ width: '100%', fontSize: 12.5, color: '#b42318', fontFamily: MANROPE }}>{bulkErr}</div>}
        <div style={{ width: '100%', fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.4 }}>
          Bulk-approve publishes the AI-drafted breakdowns as-is. Spot-check a sample first — anything you bulk-publish skips the per-item read.
        </div>
      </div>

      <div style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE }}>
        <b style={{ color: INK }}>{items.length}</b> item{items.length === 1 ? '' : 's'} awaiting review.
        {done.approved + done.rejected > 0 && <> · {done.approved} approved, {done.rejected} rejected this session.</>}
      </div>
      {items.map((item) => <ReviewCard key={item.id} item={item} onDone={remove} selected={selected.has(item.id)} onToggleSelect={toggleSel} />)}
    </div>
  )
}

function ReviewCard({ item, onDone, selected, onToggleSelect }: { item: PendingItem; onDone: (id: string, action: 'approve' | 'reject') => void; selected: boolean; onToggleSelect: (id: string) => void }) {
  const [summary, setSummary] = useState(item.summary ?? '')
  const [summaryBasic, setSummaryBasic] = useState(typeof item.data?.summaryBasic === 'string' ? item.data.summaryBasic : '')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const link = typeof item.data?.link === 'string' ? item.data.link : null
  const docType = link?.includes('/act/') ? 'act' : 'bill'
  const policyLinks = (Array.isArray(item.data?.policy_links) ? item.data.policy_links : []) as PolicyLink[]
  const stage = typeof item.data?.stage === 'string' ? item.data.stage : null
  const selectCommittee = typeof item.data?.selectCommittee === 'string' ? item.data.selectCommittee : null
  const isLegislation = item.type === 'legislation'
  const previewUrl = `aratika.nz/legislation/${billSlugFromLink(link) ?? '…'}`

  async function act(action: 'approve' | 'reject') {
    setBusy(action); setErr(null)
    try {
      const res = await fetch('/api/editor/review', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, action, summary, summaryBasic, notes }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Failed') }
      onDone(item.id, action)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed'); setBusy(null)
    }
  }

  const otherFields = Object.entries(item.data).filter(([k, v]) => v != null && v !== '' && !['policy_links', 'enriched', 'enriched_at'].includes(k))

  return (
    <div style={{ background: '#fff', border: `1px solid ${selected ? JADE : BORDER}`, borderRadius: 18, padding: '18px 20px' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input type="checkbox" checked={selected} onChange={() => onToggleSelect(item.id)} title="Select for bulk action" style={{ width: 16, height: 16, cursor: 'pointer', accentColor: JADE }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: JADE, background: '#ecfdf5', border: '1px solid #cfe9d8', borderRadius: 999, padding: '3px 10px', fontFamily: MANROPE, textTransform: 'capitalize' }}><FileText style={{ width: 12, height: 12 }} /> {isLegislation ? docType : item.type}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: item.change_kind === 'new' ? '#1e40af' : '#92400e', background: item.change_kind === 'new' ? '#eff6ff' : '#fff7ed', border: `1px solid ${item.change_kind === 'new' ? '#bfdbfe' : '#fed7aa'}`, borderRadius: 999, padding: '3px 10px', fontFamily: MANROPE }}>{item.change_kind === 'new' ? 'New' : 'Updated'}</span>
        {(item.source_url || link) && <a href={(item.source_url || link)!} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>Official source <ExternalLink style={{ width: 12, height: 12 }} /></a>}
      </div>

      {isLegislation ? (
        <>
          {/* LIVE PREVIEW — how it appears on the site */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <Eye style={{ width: 14, height: 14, color: JADE }} />
            <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>Preview — how readers will see it</span>
          </div>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', marginBottom: 18 }}>
            {/* faux browser bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f1efeb', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ display: 'flex', gap: 5 }}>
                {['#f0625a', '#f5bd4f', '#61c454'].map((c) => <span key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, display: 'inline-block' }} />)}
              </span>
              <span style={{ fontSize: 11.5, color: SECONDARY, fontFamily: MANROPE, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '2px 10px' }}>{previewUrl}</span>
            </div>
            {/* reader content */}
            <div style={{ padding: '22px 24px', background: '#fff' }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.2, color: INK, fontFamily: MANROPE, margin: '0 0 18px' }}>{item.title}</h2>
              <BillBreakdown summary={summary} summaryBasic={summaryBasic} policyLinks={policyLinks} docType={docType} linkTopics={false} />
              <StageTracker stage={stage} selectCommittee={selectCommittee} />
              <HaveYourSay stage={stage} selectCommittee={selectCommittee} slug={billSlugFromLink(link) ?? undefined} preview />
            </div>
          </div>
        </>
      ) : (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 12px' }}>{item.title}</h2>
          {otherFields.length > 0 && (
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 11, padding: '12px 14px', marginBottom: 16, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 14px' }}>
              {otherFields.map(([k, v]) => (
                <div key={k} style={{ display: 'contents' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: TERTIARY, fontFamily: MANROPE, textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                  <span style={{ fontSize: 12.5, color: INK, fontFamily: MANROPE, wordBreak: 'break-word' }}>{String(v)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* EDITOR CONTROLS */}
      <div style={{ background: '#fbfaf8', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 16px' }}>
        <label style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>Basic summary — plain, no jargon (what readers see by default)</label>
        <textarea value={summaryBasic} onChange={(e) => setSummaryBasic(e.target.value)} rows={3} placeholder="Plain-language summary anyone can understand, no jargon…" style={{ width: '100%', marginTop: 6, resize: 'vertical', fontFamily: MANROPE, fontSize: 13.5, color: INK, border: `1px solid ${BORDER}`, borderRadius: 11, padding: '10px 12px', outline: 'none', lineHeight: 1.5, background: '#fff' }} />
        <label style={{ display: 'block', marginTop: 12, fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>Detailed summary — fuller, still plain</label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} placeholder="Fuller neutral, factual summary…" style={{ width: '100%', marginTop: 6, resize: 'vertical', fontFamily: MANROPE, fontSize: 13.5, color: INK, border: `1px solid ${BORDER}`, borderRadius: 11, padding: '10px 12px', outline: 'none', lineHeight: 1.5, background: '#fff' }} />
        <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '8px 0 0' }}>Toggle <b>Basic / Detailed</b> in the preview above to check both. Editing here updates the preview live.</p>

        {policyLinks.length > 0 && (
          <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '8px 0 0', lineHeight: 1.5 }}>
            The policy breakdown ({policyLinks.map((p) => p.topic).join(', ')}) is AI-drafted from the bill. Check it reads accurately in the preview above; if it&apos;s off, Reject and it can be re-generated.
          </p>
        )}

        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Editor notes (optional, internal)" style={{ width: '100%', marginTop: 10, fontFamily: MANROPE, fontSize: 12.5, color: INK, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 11px', outline: 'none', background: '#fff' }} />

        {err && <div style={{ fontSize: 12.5, color: '#b42318', fontFamily: MANROPE, marginTop: 8 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
          <button onClick={() => act('approve')} disabled={!!busy} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 11, border: 'none', background: JADE, color: '#fff', fontSize: 13.5, fontWeight: 800, fontFamily: MANROPE, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}>
            {busy === 'approve' ? <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" /> : <Check style={{ width: 15, height: 15 }} />} Approve & publish
          </button>
          <button onClick={() => act('reject')} disabled={!!busy} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 11, border: `1px solid ${BORDER}`, background: '#fff', color: '#b42318', fontSize: 13.5, fontWeight: 700, fontFamily: MANROPE, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}>
            {busy === 'reject' ? <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" /> : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}
