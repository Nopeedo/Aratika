'use client'

/**
 * BillsTracker54 — the filterable bills tracker, built on the full 54th-Parliament
 * dataset (src/constants/bills-54.ts, from the official bills API).
 *
 * Lets a visitor narrow down by policy area, bill type, stage, party or keyword.
 * The "how to read this" primer that used to sit here now opens the page (see
 * HowToReadBills) — it's orientation, so it belongs above the fold, not below
 * the carousel.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { track } from '@vercel/analytics'
import { Search, Landmark, Users, BadgeCheck, Megaphone, X, ArrowRight, ExternalLink, PenLine } from 'lucide-react'
import { BILLS_54, BILL_CATEGORIES, BILLS_54_META, type Bill54 } from '@/constants/bills-54'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import { normMemberName } from '@/lib/bills/normalize-member'
import { billsForTopic } from '@/lib/bills/by-topic'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import type { PartySlug, PolicyTopic } from '@/types'
import { BORDER, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY } from '@/constants/theme'

const normTitle = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const normName = normMemberName

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

const PAGE_SIZE = 24
// Newest first. The deep-link below has to find a bill's PAGE, which only
// means anything in the order the list is actually shown in — so the list and
// the deep-link share this one comparator rather than each having its own.
const byDateDesc = (a: Bill54, b: Bill54) => (b.date || '').localeCompare(a.date || '')
const DEFAULT_ORDER = [...BILLS_54].sort(byDateDesc)

export function BillsTracker54({ readerSlugs = {}, memberParty = {}, initialParty, initialBill, initialTopic }: { readerSlugs?: Record<string, string>; memberParty?: Record<string, string>; initialParty?: string; initialBill?: string; initialTopic?: string }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')
  /**
   * Arriving from a policy topic (/bills?topic=immigration). NOT the category
   * dropdown: a topic is not one category — see lib/bills/by-topic.ts, where
   * Immigration is title-matched rather than taking all of "Work & social".
   * Filtering by the same rules the topic page used is what makes the button
   * that sends people here honest about what they will find.
   */
  const [topic, setTopic] = useState<string | undefined>(initialTopic)
  const topicSlugs = useMemo(() => {
    if (!topic) return null
    const { passed, active } = billsForTopic(topic as PolicyTopic)
    return new Set([...passed, ...active].map((b) => b.slug + b.number))
  }, [topic])
  const [type, setType] = useState('All')
  const [status, setStatus] = useState('All')
  const [party, setParty] = useState<string>(initialParty || 'All')
  const [subsOnly, setSubsOnly] = useState(false)
  // 270 bills rendered at once meant a reader had to scroll past all of them to
  // reach anything below, and every filter change re-rendered the lot.
  const [page, setPage] = useState(1)
  const resultsRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const partyOf = (m?: string | null) => (m ? memberParty[normName(m)] : undefined)
  const partyColour = initialParty ? PARTY_COLORS[initialParty as PartySlug]?.bg ?? JADE : JADE

  // Deep-linked from a party profile: bring the filtered list into view instead
  // of leaving it two screens below the header and carousel. Runs once — later
  // filter changes shouldn't yank the page around.
  useEffect(() => {
    if (initialParty) topRef.current?.scrollIntoView({ block: 'start' })
  }, [initialParty])

  // Deep-linked to ONE bill (?bill=<slug>) — from the homepage "what's moved"
  // list, or a notification. A plain #anchor cannot do this: the list is
  // paginated at PAGE_SIZE, so the target is usually not in the DOM. Find its
  // page in the displayed order, go there, then scroll the card into view once
  // it has rendered. Runs once; the card carries a highlight so the reader
  // can tell which of the 24 on the page is the one they came for.
  const jumped = useRef(false)
  useEffect(() => {
    if (!initialBill || jumped.current) return
    // In the order the list is displayed, not the raw dataset order: the two
    // differ by a couple of hundred places for most bills, and computing the
    // page from the wrong one sends the reader to a page the bill is not on.
    const idx = DEFAULT_ORDER.findIndex((b) => b.slug === initialBill)
    if (idx < 0) { jumped.current = true; return }
    const target = Math.floor(idx / PAGE_SIZE) + 1
    if (page !== target) { setPage(target); return }   // re-runs once that page has rendered
    const el = document.getElementById(`bill-${initialBill}`)
    if (el) { el.scrollIntoView({ block: 'center' }); jumped.current = true }
  }, [initialBill, page])

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
      (!topicSlugs || topicSlugs.has(b.slug + b.number)) &&
      (cat === 'All' || b.category === cat) &&
      (type === 'All' || b.type === type) &&
      (status === 'All' || b.status === status) &&
      (party === 'All' || (b.member ? memberParty[normName(b.member)] === party : false)) &&
      (!subsOnly || isOpen(b)) &&
      (!ql || b.title.toLowerCase().includes(ql) || (b.member || '').toLowerCase().includes(ql)),
    ).sort(byDateDesc)
  }, [q, cat, type, status, party, memberParty, subsOnly, today, topicSlugs])

  const active = cat !== 'All' || type !== 'All' || status !== 'All' || party !== 'All' || q !== '' || subsOnly
  const reset = () => { setQ(''); setCat('All'); setType('All'); setStatus('All'); setParty('All'); setSubsOnly(false); setTopic(undefined) }

  // Narrowing the filters must not leave you stranded on a page that no longer
  // exists (e.g. on page 9 of 12, then filtering down to 30 results). Reset
  // during render — React's documented way to adjust state when inputs change —
  // rather than in an effect, which would paint the stale page first.
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const filterKey = `${q}|${cat}|${type}|${status}|${party}|${subsOnly}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) { setPrevFilterKey(filterKey); setPage(1) }
  const current = Math.min(page, pageCount)
  const from = (current - 1) * PAGE_SIZE
  const pageItems = filtered.slice(from, from + PAGE_SIZE)

  function goTo(n: number) {
    setPage(Math.min(Math.max(1, n), pageCount))
    // Jump back to the top of the results, otherwise page 2 opens mid-list.
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      {/* Arriving from a party profile ("See all NZ First bills") lands you at the
          top of a 3,400px page with the filter silently applied — it reads as the
          plain tracker. Say what's filtered, and scroll here on mount. */}
      <div ref={topRef} style={{ scrollMarginTop: 72 }} />
      {initialParty && party === initialParty && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', background: '#fff', border: `2px solid ${partyColour}`, borderRadius: 14, padding: '12px 16px', marginBottom: 18 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: partyColour, flexShrink: 0 }} />
            Showing {PARTY_NAMES[initialParty as PartySlug]?.short ?? initialParty}’s bills{filtered.length} of {stats.total}
          </span>
          <button onClick={reset} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: SECONDARY, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 12px', fontFamily: MANROPE, cursor: 'pointer' }}>
            <X style={{ width: 13, height: 13 }} /> Show all bills
          </button>
        </div>
      )}

      {/* Arrived from a policy topic. Says so plainly and offers the way out,
          because the topic filter is not one of the dropdowns below: a reader
          who could not see why the list was short would have no control to
          explain it. */}
      {topic && POLICY_TOPICS[topic as keyof typeof POLICY_TOPICS] && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', background: '#fff', border: `2px solid ${JADE}`, borderRadius: 14, padding: '12px 16px', marginBottom: 18 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: JADE, flexShrink: 0 }} />
            Showing {POLICY_TOPICS[topic as keyof typeof POLICY_TOPICS].label.toLowerCase()} bills: {filtered.length} of {stats.total}
          </span>
          <button onClick={reset} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: SECONDARY, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 12px', fontFamily: MANROPE, cursor: 'pointer' }}>
            <X style={{ width: 13, height: 13 }} /> Show all bills
          </button>
        </div>
      )}

      {/* Layout for the two rows below lives in TRACKER_CSS, shipped with this
          component. Both need media queries — content-width chips and selects
          each took a row of their own on a phone, in five different widths —
          and an inline style would beat any of them. */}
      <style dangerouslySetInnerHTML={{ __html: TRACKER_CSS }} />

      {/* Standing figures for the term, NOT filters. They were buttons that
          each set the filter bar below them, which made a reader wonder which
          of the two rows was in charge and left a chip lit next to a select
          saying something else. The selects do the filtering; this row says
          what is in the House. "Open for submissions" kept its filter, which
          only lived here — it is an option in the stage select now. */}
      <div className="bills-stats" style={{ marginBottom: 18 }}>
        <Stat icon={Landmark} value={stats.total} label="Bills this term" />
        <Stat icon={BadgeCheck} value={stats.passed} label="Passed into law" />
        <Stat icon={Megaphone} value={stats.committee} label="At select committee" />
        {openCount > 0 && <Stat icon={PenLine} value={openCount} label="Open for submissions" />}
        <Stat icon={Users} value={stats.members} label="Member’s bills" />
      </div>

      {/* Filter bar */}
      <div className="bills-filters" style={{ marginBottom: 16 }}>
        <div className="bills-search" style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: TERTIARY }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bills or MPs…"
            style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 14, fontFamily: MANROPE, color: INK, outline: 'none', background: '#fff' }} />
        </div>
        <Select value={cat} onChange={setCat} options={['All', ...BILL_CATEGORIES]} allLabel="All policy areas" />
        <Select value={type} onChange={setType} options={['All', 'Government', "Member's", 'Local', 'Private']} allLabel="All types" />
        {/* OPEN_SUBS is not a stage the bill data carries — it is the
            submissions-open window, which used to be a chip above. Folding it
            in here keeps that filter reachable now the figures are inert. */}
        <Select
          value={subsOnly ? OPEN_SUBS : status}
          onChange={(v) => { setSubsOnly(v === OPEN_SUBS); setStatus(v === OPEN_SUBS ? 'All' : v) }}
          options={['All', ...(openCount > 0 ? [OPEN_SUBS] : []), ...statuses]}
          allLabel="All stages"
          fmt={(s) => (s === 'Royal Assent' ? 'Passed into law' : s)}
        />
        {parties.length > 0 && <Select value={party} onChange={setParty} options={['All', ...parties]} allLabel="All parties" fmt={(s) => PARTY_NAMES[s as PartySlug]?.short ?? s} />}
        {active && (
          <button onClick={reset} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: SECONDARY, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '9px 12px', fontFamily: MANROPE, cursor: 'pointer' }}>
            <X style={{ width: 13, height: 13 }} /> Clear
          </button>
        )}
      </div>

      <div style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, marginBottom: 14 }}>
        {filtered.length > 0
          ? <>Showing <b style={{ color: INK }}>{from + 1}–{Math.min(from + PAGE_SIZE, filtered.length)}</b> of {filtered.length}{filtered.length !== stats.total ? ` matching` : ''} bill{filtered.length === 1 ? '' : 's'}{cat !== 'All' ? ` in ${cat}` : ''}</>
          : <>No bills match those filters</>}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: SECONDARY, fontFamily: MANROPE, fontSize: 14 }}>
          No bills match those filters. <button onClick={reset} style={{ color: JADE, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: MANROPE, fontSize: 14 }}>Clear filters</button>
        </div>
      ) : (
        <>
          <div ref={resultsRef} style={{ scrollMarginTop: 80 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(330px, 100%), 1fr))', gap: 12 }}>
            {pageItems.map((b) => <BillCard key={b.slug + b.number} b={b} readerSlug={readerSlugs[normTitle(b.title)]} submissionsOpen={isOpen(b)} party={partyOf(b.member)} focused={b.slug === initialBill} />)}
          </div>
          {pageCount > 1 && <Pager current={current} pageCount={pageCount} goTo={goTo} />}
        </>
      )}
    </div>
  )
}

/** Card is a <div>, not one big <Link>: it now carries several distinct
 *  destinations (our breakdown, the official page, the submission call), and
 *  anchors can't legally nest inside one another. */
function BillCard({ b, readerSlug, submissionsOpen, party, focused }: { b: Bill54; readerSlug?: string; submissionsOpen?: boolean; party?: string; focused?: boolean }) {
  const ts = TYPE_STYLE[b.type] ?? TYPE_STYLE.Private
  const ss = statusStyle(b.status)
  // Washed in the party colour of the member in charge, matching the party
  // tiles, the MP directory and the battleground cards. Bills with no named
  // member (or an unmapped one) keep the plain card.
  const col = party && PARTY_COLORS[party as PartySlug] ? PARTY_COLORS[party as PartySlug] : null
  const cardStyle: React.CSSProperties = {
    // The open-for-submissions signal used to be this border. It now lives only
    // in the blue "You can have your say" panel inside the card, which states
    // the closing date — a stronger signal than a border tint anyway.
    border: `2px solid ${col ? col.bg : submissionsOpen ? '#bfd4fe' : BORDER}`,
    borderRadius: 14, padding: '15px 16px',
    background: col ? col.light : '#fff', display: 'flex', flexDirection: 'column', height: '100%',
    // The deep-linked card: a jade ring, so it stands out from the other 23 on
    // the page. Colour only — the border is already spoken for by the party.
    ...(focused ? { boxShadow: `0 0 0 3px ${JADE}`, scrollMarginTop: 96 } : {}),
  }
  return (
    <div id={`bill-${b.slug}`} className="party-card" style={cardStyle}>
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
        {b.member && (
          <div style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span>In charge: <b style={{ color: '#3f444c' }}>{b.member}</b></span>
            {/* Which party the member in charge sits for — the same mapping the
                party filter uses, so a reader can see whose bill it is without
                having to recognise every MP by name. */}
            {party && PARTY_NAMES[party as PartySlug] && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800,
                color: '#3f444c', background: '#fff', border: `1px solid ${BORDER}`,
                borderRadius: 999, padding: '1px 8px', fontFamily: MANROPE, whiteSpace: 'nowrap',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: PARTY_COLORS[party as PartySlug].bg, flexShrink: 0 }} />
                {PARTY_NAMES[party as PartySlug].short}
              </span>
            )}
          </div>
        )}
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
          {/* The strongest outcome we can evidence: not that someone read about a
              bill, but that they went on to have their say. Bill slug only. */}
          <a href={b.officialUrl} target="_blank" rel="noopener noreferrer"
             onClick={() => track('submission_click', { bill: b.slug })}
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

/* Desktop keeps the original content-width chip row and inline filter bar. Under
   760px both become two even columns: the chips were five different widths
   stacking one per row (285px of screen for five numbers), and the four
   dropdowns did the same underneath, so the controls pushed the actual bills
   most of a screen further down. */
const TRACKER_CSS = `
.bills-stats { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 16px; }
.bills-filters { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.bills-search { flex: 1 1 240px; min-width: 200px; }
.bills-select { max-width: 200px; }
@media (max-width: 760px) {
  /* Still one wrapping line on a phone: they are five short facts now, not
     five tappable cards, so they no longer need a column each. */
  .bills-stats { gap: 5px 14px; }
  .bills-filters { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .bills-search { grid-column: 1 / -1; min-width: 0; }
  .bills-select { max-width: none; width: 100%; min-width: 0; }
  .bills-filters > button { grid-column: 1 / -1; justify-content: center; }
}
`

/** One standing figure. A span, not a button: nothing here is clickable. */
function Stat({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5, fontFamily: MANROPE, whiteSpace: 'nowrap' }}>
      <Icon style={{ width: 13, height: 13, color: JADE, alignSelf: 'center', flexShrink: 0 }} />
      <span style={{ fontSize: 14, fontWeight: 800, color: INK }}>{value}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: SECONDARY }}>{label}</span>
    </span>
  )
}

/** Pseudo-stage for the submissions-open filter — see the stage select. */
const OPEN_SUBS = 'Open for submissions'

function Select({ value, onChange, options, allLabel, fmt }: { value: string; onChange: (v: string) => void; options: string[]; allLabel: string; fmt?: (s: string) => string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="bills-select"
      style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 13.5, fontFamily: MANROPE, color: INK, background: '#fff', cursor: 'pointer' }}>
      {options.map((o) => <option key={o} value={o}>{o === 'All' ? allLabel : fmt ? fmt(o) : o}</option>)}
    </select>
  )
}

/** Page controls for the bills grid. Shows first/last and a window around the
 *  current page rather than all 12 numbers, so it stays usable on a phone. */
function Pager({ current, pageCount, goTo }: { current: number; pageCount: number; goTo: (n: number) => void }) {
  const nums: (number | '…')[] = []
  const push = (n: number | '…') => { if (nums[nums.length - 1] !== n) nums.push(n) }
  for (let n = 1; n <= pageCount; n++) {
    if (n === 1 || n === pageCount || Math.abs(n - current) <= 1) push(n)
    else push('…')
  }

  const btn = (activeState: boolean): React.CSSProperties => ({
    minWidth: 36, height: 36, padding: '0 10px', borderRadius: 10, cursor: 'pointer', fontFamily: MANROPE,
    fontSize: 13, fontWeight: 800,
    color: activeState ? '#fff' : INK,
    background: activeState ? INK : '#fff',
    border: `1px solid ${activeState ? INK : BORDER}`,
  })

  return (
    <nav aria-label="Bill pages" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginTop: 20 }}>
      <button onClick={() => goTo(current - 1)} disabled={current === 1} aria-label="Previous page"
        style={{ ...btn(false), opacity: current === 1 ? 0.4 : 1, cursor: current === 1 ? 'default' : 'pointer' }}>
        Prev
      </button>
      {nums.map((n, i) =>
        n === '…'
          ? <span key={`gap-${i}`} style={{ padding: '0 4px', color: SECONDARY, fontFamily: MANROPE, fontSize: 13 }}>…</span>
          : <button key={n} onClick={() => goTo(n)} aria-current={n === current ? 'page' : undefined} style={btn(n === current)}>{n}</button>,
      )}
      <button onClick={() => goTo(current + 1)} disabled={current === pageCount} aria-label="Next page"
        style={{ ...btn(false), opacity: current === pageCount ? 0.4 : 1, cursor: current === pageCount ? 'default' : 'pointer' }}>
        Next
      </button>
    </nav>
  )
}
