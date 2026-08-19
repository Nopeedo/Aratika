'use client'

/**
 * ReviewList — the editorial queue. Each pending item shows a LIVE PREVIEW of how
 * it will appear on the public site (the same BillBreakdown the reader uses), an
 * editable summary that updates the preview as you type, and Approve / Reject.
 * Only approved items ever reach the public site.
 */

import { useState, useEffect } from 'react'
import { Check, FileText, ExternalLink, Loader2, Eye, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import { BillBreakdown, type PolicyLink } from '@/components/bills/bill-breakdown'
import { StageTracker } from '@/components/bills/stage-tracker'
import { HaveYourSay } from '@/components/bills/have-your-say'
import { billSlugFromLink } from '@/lib/bills/slug'
import { BORDER, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY } from '@/constants/theme'

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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Deterministic absolute date (UTC) — safe to render on the server. */
function absDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/**
 * "3 days ago", and how alarmed to be about it.
 *
 * Deliberately NOT computed during render: this codebase has already shipped a
 * hydration mismatch from reading the clock inside a component, and the answer
 * here changes every second by definition. The badge renders the absolute date
 * on first paint and upgrades to the relative age after mount, so the server and
 * client always agree on the first pass.
 */
function useAge(iso: string | null): { label: string; tone: 'fresh' | 'ageing' | 'stale' } | null {
  const [age, setAge] = useState<{ label: string; tone: 'fresh' | 'ageing' | 'stale' } | null>(null)
  useEffect(() => {
    if (!iso) return setAge(null)
    const t = Date.parse(iso)
    if (isNaN(t)) return setAge(null)
    const days = Math.floor((Date.now() - t) / 86_400_000)
    const label =
      days <= 0 ? 'today'
        : days === 1 ? 'yesterday'
          : days < 7 ? `${days} days ago`
            : days < 14 ? 'last week'
              : days < 60 ? `${Math.floor(days / 7)} weeks ago`
                : `${Math.floor(days / 30)} months ago`
    // A reviewer's real question is "is this still worth publishing?". Under a
    // week is current, under a month is usable with context, older than that is
    // usually a no during a campaign.
    setAge({ label, tone: days < 7 ? 'fresh' : days < 30 ? 'ageing' : 'stale' })
  }, [iso])
  return age
}

/** The source's publish date, not our ingest time — see the badge comment. */
function publishedOf(i: PendingItem): string | null {
  const d = i.data || {}
  if (typeof d.pubDate === 'string') return d.pubDate
  if (typeof d.published === 'string') return d.published
  return i.fetched_at
}

/** Outlet (news) or channel (video), for the per-outlet filter. */
function sourceOf(i: PendingItem): string | null {
  const d = i.data || {}
  if (typeof d.source === 'string') return d.source
  if (typeof d.outlet === 'string') return d.outlet
  return null
}

/**
 * Age bucket, computed WITHOUT the clock during render — filter counts are
 * derived on the server pass too, and a bucket that shifts between server and
 * client is the same hydration bug the badge avoids.
 *
 * Resolved against a date fixed at module load rather than per call, so every
 * item in one render is bucketed against the same instant.
 */
const NOW_AT_LOAD = Date.now()
function ageBucket(iso: string | null): 'fresh' | 'ageing' | 'stale' | null {
  if (!iso) return null
  const t = Date.parse(iso)
  if (isNaN(t)) return null
  const days = (NOW_AT_LOAD - t) / 86_400_000
  return days < 7 ? 'fresh' : days < 30 ? 'ageing' : 'stale'
}

const AGE_STYLE = {
  fresh: { bg: '#ecfdf5', bd: '#cfe9d8', fg: '#166638' },
  ageing: { bg: '#fff7ed', bd: '#fed7aa', fg: '#9a3412' },
  stale: { bg: '#fef2f2', bd: '#fecaca', fg: '#991b1b' },
} as const

const SIGNAL_FIELDS = ['parties', 'mps', 'topics', 'electorates', 'candidates', 'bills'] as const

/**
 * How much the taggers actually found: parties, MPs, topics, electorates,
 * candidates, bills. Zero means nothing this site tracks was mentioned.
 *
 * Deliberately NOT an auto-reject. The zero-signal bucket has held an ACT policy
 * announcement, a poll showing National down, and a TOP donor investigation
 * sitting alongside the crosswords and the weather — the taggers miss things,
 * and a queue that silently bins them is worse than one that is merely long.
 * So it gets its own group at the end, to skim rather than read.
 */
function signalOf(i: PendingItem): number {
  let n = 0
  for (const f of SIGNAL_FIELDS) {
    const v = i.data?.[f]
    if (Array.isArray(v)) n += v.length
  }
  return n
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

  // ── Filtering ───────────────────────────────────────────────────────────────
  const [typeFilter, setTypeFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [ageFilter, setAgeFilter] = useState<'all' | 'fresh' | 'ageing' | 'stale'>('all')
  const [sortNewestFirst, setSortNewestFirst] = useState(true)
  const [showLow, setShowLow] = useState(false)

  const typeCounts: Record<string, number> = {}
  for (const i of items) typeCounts[i.type] = (typeCounts[i.type] || 0) + 1
  const typeKeys = Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a])

  const sourceCounts: Record<string, number> = {}
  for (const i of items) { const s = sourceOf(i); if (s) sourceCounts[s] = (sourceCounts[s] || 0) + 1 }
  const sourceKeys = Object.keys(sourceCounts).sort((a, b) => sourceCounts[b] - sourceCounts[a])

  const ageCounts = { fresh: 0, ageing: 0, stale: 0 }
  for (const i of items) { const b = ageBucket(publishedOf(i)); if (b) ageCounts[b]++ }

  const shown = items
    .filter((i) => typeFilter === 'all' || i.type === typeFilter)
    .filter((i) => sourceFilter === 'all' || sourceOf(i) === sourceFilter)
    .filter((i) => ageFilter === 'all' || ageBucket(publishedOf(i)) === ageFilter)
    .sort((a, b) => {
      const x = publishedOf(a) ?? '', y = publishedOf(b) ?? ''
      return sortNewestFirst ? y.localeCompare(x) : x.localeCompare(y)
    })

  // Split, rather than filter: everything is still reachable, but the items with
  // nothing tagged stop being interleaved with the ones worth reading.
  const strong = shown.filter((i) => signalOf(i) > 0)
  const low = shown.filter((i) => signalOf(i) === 0)

  const toggleSel = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  // "Select all" acts on what is VISIBLE, not the whole queue. Selecting 250
  // hidden items from a filtered view of 12 is how a bulk action becomes an
  // accident.
  const allSelected = shown.length > 0 && shown.every((i) => selected.has(i.id))
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(shown.map((i) => i.id)))
  const selectStale = () => setSelected(new Set(items.filter((i) => ageBucket(publishedOf(i)) === 'stale').map((i) => i.id)))

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
          Select all shown ({shown.length})
        </label>
        {ageCounts.stale > 0 && (
          // Over 30 days is 42% of the queue and almost always a reject during a
          // campaign. This selects them so they can go in one action — it never
          // rejects anything on its own, the decision stays yours.
          <button onClick={selectStale} style={{ fontSize: 12.5, fontWeight: 700, fontFamily: MANROPE, padding: '5px 11px', borderRadius: 999, cursor: 'pointer', color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca' }}>
            Select {ageCounts.stale} over 30 days
          </button>
        )}
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

      {/* Filters. With 250 items from 21 outlets, working one outlet at a time
          is far faster than a single undifferentiated scroll — you learn that
          outlet's pattern and judge in seconds. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
        <FilterChip label={`All types (${items.length})`} active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} />
        {typeKeys.map((t) => <FilterChip key={t} label={`${t} (${typeCounts[t]})`} active={typeFilter === t} onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)} />)}
        <span style={{ width: 1, height: 22, background: BORDER, margin: '0 4px' }} />
        <FilterChip label="Any age" active={ageFilter === 'all'} onClick={() => setAgeFilter('all')} />
        <FilterChip label={`Under 7 days (${ageCounts.fresh})`} active={ageFilter === 'fresh'} onClick={() => setAgeFilter('fresh')} />
        <FilterChip label={`7–30 days (${ageCounts.ageing})`} active={ageFilter === 'ageing'} onClick={() => setAgeFilter('ageing')} />
        <FilterChip label={`Over 30 days (${ageCounts.stale})`} active={ageFilter === 'stale'} onClick={() => setAgeFilter('stale')} />
        <span style={{ width: 1, height: 22, background: BORDER, margin: '0 4px' }} />
        <FilterChip label={sortNewestFirst ? 'Newest first' : 'Oldest first'} active={false} onClick={() => setSortNewestFirst((s) => !s)} />
      </div>
      {sourceKeys.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          <FilterChip label="All outlets" active={sourceFilter === 'all'} onClick={() => setSourceFilter('all')} />
          {sourceKeys.map((s) => <FilterChip key={s} label={`${s} (${sourceCounts[s]})`} active={sourceFilter === s} onClick={() => setSourceFilter(sourceFilter === s ? 'all' : s)} />)}
        </div>
      )}

      <div style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE }}>
        Showing <b style={{ color: INK }}>{shown.length}</b> of <b style={{ color: INK }}>{items.length}</b> item{items.length === 1 ? '' : 's'} awaiting review.
        {done.approved + done.rejected > 0 && <> · {done.approved} approved, {done.rejected} rejected this session.</>}
      </div>
      {strong.map((item) => renderRow(item))}

      {low.length > 0 && (
        <div style={{ border: `1px dashed ${BORDER}`, borderRadius: 12, background: '#fbfaf7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '11px 14px' }}>
            <button onClick={() => setShowLow((v) => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: MANROPE, fontSize: 13.5, fontWeight: 800, color: INK }}>
              {showLow ? <ChevronDown style={{ width: 15, height: 15 }} /> : <ChevronRight style={{ width: 15, height: 15 }} />}
              Nothing tagged ({low.length})
            </button>
            <span style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE, flex: '1 1 240px', lineHeight: 1.4 }}>
              No party, MP, topic, electorate or bill matched. Usually crosswords, weather and sport —
              but the taggers do miss things, so skim before clearing.
            </span>
            <button onClick={() => setSelected(new Set(low.map((i) => i.id)))} style={{ fontSize: 12.5, fontWeight: 700, fontFamily: MANROPE, padding: '5px 11px', borderRadius: 999, cursor: 'pointer', color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', whiteSpace: 'nowrap' }}>
              Select all {low.length}
            </button>
          </div>
          {showLow && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 10px 12px' }}>
              {low.map((item) => renderRow(item))}
            </div>
          )}
        </div>
      )}
    </div>
  )

  // Video is the bulk of the queue and needs none of the summary editing the
  // full card is built around — a compact row fits ~15 to a screen.
  function renderRow(item: PendingItem) {
    return item.type === 'video'
      ? <VideoRow key={item.id} item={item} onDone={remove} selected={selected.has(item.id)} onToggleSelect={toggleSel} />
      : <ReviewCard key={item.id} item={item} onDone={remove} selected={selected.has(item.id)} onToggleSelect={toggleSel} />
  }
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 12, fontWeight: 700, fontFamily: MANROPE, padding: '5px 11px', borderRadius: 999, cursor: 'pointer',
      color: active ? '#fff' : INK, background: active ? INK : '#fff', border: `1px solid ${active ? INK : BORDER}`,
      textTransform: 'capitalize',
    }}>{label}</button>
  )
}

/**
 * VideoRow — the compact form, used for video only.
 *
 * The full ReviewCard is built around editing a Basic and Detailed summary.
 * VideoSection displays neither: a video card on the site shows the title, the
 * outlet and the party chips. So for 251 of 252 pending items the editing
 * fields were pure scroll cost, and the real decision — is this current, is it
 * about someone we cover, is it worth publishing — was spread across a screen
 * and a half. Everything needed for that decision is now on one line.
 */
function VideoRow({ item, onDone, selected, onToggleSelect }: { item: PendingItem; onDone: (id: string, action: 'approve' | 'reject') => void; selected: boolean; onToggleSelect: (id: string) => void }) {
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const d = item.data || {}
  const asArr = (k: string) => (Array.isArray(d[k]) ? (d[k] as string[]) : [])
  const published = publishedOf(item)
  const age = useAge(published)
  const tone = AGE_STYLE[age?.tone ?? 'fresh']
  const thumb = typeof d.thumbnail === 'string' ? d.thumbnail : null
  const source = sourceOf(item) ?? 'Source'
  const tags = [...asArr('parties'), ...asArr('mps').map((m) => m.replace(/-/g, ' ')), ...asArr('electorates')]

  async function act(action: 'approve' | 'reject') {
    setBusy(action); setErr(null)
    try {
      const res = await fetch('/api/editor/review', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, action }),
      })
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.message || 'Failed') }
      onDone(item.id, action)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); setBusy(null) }
  }

  const sBtn = (primary: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 9,
    fontSize: 12.5, fontWeight: 800, fontFamily: MANROPE, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1,
    border: primary ? 'none' : `1px solid ${BORDER}`, background: primary ? JADE : '#fff', color: primary ? '#fff' : '#b42318',
  })

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#fff', border: `1px solid ${selected ? JADE : BORDER}`, borderRadius: 12, padding: '10px 12px' }}>
      <input type="checkbox" checked={selected} onChange={() => onToggleSelect(item.id)} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: JADE, flexShrink: 0 }} />
      {thumb && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" loading="lazy" referrerPolicy="no-referrer" style={{ width: 92, height: 52, objectFit: 'cover', borderRadius: 7, background: '#000', flexShrink: 0 }} />
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: SECONDARY, fontFamily: MANROPE }}>{source}</span>
          {published && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 800, fontFamily: MANROPE, borderRadius: 999, padding: '1px 7px', color: tone.fg, background: tone.bg, border: `1px solid ${tone.bd}` }}>
              <Clock style={{ width: 10, height: 10 }} />{age ? age.label : absDate(published)}
            </span>
          )}
          {tags.slice(0, 4).map((t) => (
            <span key={t} style={{ fontSize: 10.5, fontWeight: 700, color: SECONDARY, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '1px 7px', fontFamily: MANROPE, textTransform: 'capitalize' }}>{t}</span>
          ))}
          {tags.length === 0 && <span style={{ fontSize: 10.5, fontWeight: 700, color: TERTIARY, fontFamily: MANROPE }}>no tags</span>}
        </div>
        <a href={item.source_url ?? '#'} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 13.5, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.35, textDecoration: 'none', display: 'block' }}>
          {item.title}
        </a>
        {err && <div style={{ fontSize: 11.5, color: '#b42318', fontFamily: MANROPE, marginTop: 3 }}>{err}</div>}
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={() => act('approve')} disabled={!!busy} style={sBtn(true)}>
          {busy === 'approve' ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> : <Check style={{ width: 12, height: 12 }} />} Approve
        </button>
        <button onClick={() => act('reject')} disabled={!!busy} style={sBtn(false)}>Reject</button>
      </div>
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
  const isNews = item.type === 'news'
  const previewUrl = `arapono.nz/legislation/${billSlugFromLink(link) ?? '…'}`

  // News tags, for the reviewer to see who an item will reach before publishing.
  const asArr = (k: string) => (Array.isArray(item.data?.[k]) ? (item.data[k] as string[]) : [])
  const newsTags = [
    ...asArr('parties').map((p) => ({ t: p, c: '#eef4ff', b: '#bfd4fe', fg: '#1e3a8a' })),
    ...asArr('mps').map((m) => ({ t: m.replace(/-/g, ' '), c: '#f5f3ff', b: '#ddd6fe', fg: '#5b21b6' })),
    ...asArr('topics').map((x) => ({ t: x, c: '#ecfdf5', b: '#cfe9d8', fg: '#166638' })),
    ...asArr('electorates').map((e) => ({ t: e, c: '#fff7ed', b: '#fed7aa', fg: '#9a3412' })),
  ]
  const outlet = typeof item.data?.outlet === 'string' ? item.data.outlet : 'Source'
  const image = typeof item.data?.image === 'string' ? item.data.image : null

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

  // When the SOURCE published it — not when we ingested it. A video we picked up
  // this morning can be a month old, and "is this still worth publishing?" is the
  // first question a reviewer asks. It was previously an ISO string buried
  // mid-way down an unordered field dump.
  const published = typeof item.data?.pubDate === 'string' ? item.data.pubDate
    : typeof item.data?.published === 'string' ? item.data.published
      : item.fetched_at
  const age = useAge(published)
  const ageTone = AGE_STYLE[age?.tone ?? 'fresh']

  const otherFields = Object.entries(item.data).filter(([k, v]) => v != null && v !== '' && !['policy_links', 'enriched', 'enriched_at'].includes(k))

  return (
    <div style={{ background: '#fff', border: `1px solid ${selected ? JADE : BORDER}`, borderRadius: 18, padding: '18px 20px' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input type="checkbox" checked={selected} onChange={() => onToggleSelect(item.id)} title="Select for bulk action" style={{ width: 16, height: 16, cursor: 'pointer', accentColor: JADE }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: JADE, background: '#ecfdf5', border: '1px solid #cfe9d8', borderRadius: 999, padding: '3px 10px', fontFamily: MANROPE, textTransform: 'capitalize' }}><FileText style={{ width: 12, height: 12 }} /> {isLegislation ? docType : item.type}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: item.change_kind === 'new' ? '#1e40af' : '#92400e', background: item.change_kind === 'new' ? '#eff6ff' : '#fff7ed', border: `1px solid ${item.change_kind === 'new' ? '#bfdbfe' : '#fed7aa'}`, borderRadius: 999, padding: '3px 10px', fontFamily: MANROPE }}>{item.change_kind === 'new' ? 'New' : 'Updated'}</span>
        {published && (
          <span
            title={`Published by the source on ${absDate(published)}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, fontFamily: MANROPE, borderRadius: 999, padding: '3px 10px', color: ageTone.fg, background: ageTone.bg, border: `1px solid ${ageTone.bd}` }}
          >
            <Clock style={{ width: 12, height: 12 }} />
            {/* Absolute on first paint, relative once mounted — see useAge. */}
            {age ? `${age.label} · ${absDate(published)}` : absDate(published)}
          </span>
        )}
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
      ) : isNews ? (
        <>
          <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" style={{ width: 92, height: 92, objectFit: 'cover', borderRadius: 12, border: `1px solid ${BORDER}`, flexShrink: 0 }} />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, marginBottom: 4 }}>{outlet}</div>
              <h2 style={{ fontSize: 16.5, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 6px', lineHeight: 1.25 }}>{item.title}</h2>
              {item.summary && <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>{item.summary}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
            {newsTags.length === 0
              ? <span style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE }}>No party / MP / topic tags — won’t reach any tracked dashboard.</span>
              : newsTags.map((tg, i) => (
                  <span key={i} style={{ fontSize: 11, fontWeight: 700, color: tg.fg, background: tg.c, border: `1px solid ${tg.b}`, borderRadius: 999, padding: '2px 9px', fontFamily: MANROPE, textTransform: 'capitalize' }}>{tg.t}</span>
                ))}
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
        {isNews ? (
          <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 4px', lineHeight: 1.5 }}>
            Headline + snippet + link from the outlet’s own feed — nothing is rewritten. <b style={{ color: INK }}>Approve</b> to publish it to the live feed, or <b style={{ color: '#b42318' }}>Reject</b> to keep it off the site.
          </p>
        ) : (
        <>
        <label style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>Basic summary — plain, no jargon (what readers see by default)</label>
        <textarea value={summaryBasic} onChange={(e) => setSummaryBasic(e.target.value)} rows={3} placeholder="Plain-language summary anyone can understand, no jargon…" style={{ width: '100%', marginTop: 6, resize: 'vertical', fontFamily: MANROPE, fontSize: 13.5, color: INK, border: `1px solid ${BORDER}`, borderRadius: 11, padding: '10px 12px', outline: 'none', lineHeight: 1.5, background: '#fff' }} />
        <label style={{ display: 'block', marginTop: 12, fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>Detailed summary — fuller, still plain</label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} placeholder="Fuller neutral, factual summary…" style={{ width: '100%', marginTop: 6, resize: 'vertical', fontFamily: MANROPE, fontSize: 13.5, color: INK, border: `1px solid ${BORDER}`, borderRadius: 11, padding: '10px 12px', outline: 'none', lineHeight: 1.5, background: '#fff' }} />
        <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '8px 0 0' }}>Toggle <b>Basic / Detailed</b> in the preview above to check both. Editing here updates the preview live.</p>
        </>
        )}

        {!isNews && policyLinks.length > 0 && (
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
