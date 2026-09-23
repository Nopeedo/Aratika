'use client'

/**
 * BillsTracker54 — the filterable bills tracker, built on the full 54th-Parliament
 * dataset (src/constants/bills-54.ts, from the official bills API).
 *
 * Lets a visitor narrow down by policy area, bill type, stage, party or keyword.
 * The "how to read this" primer that used to sit here is in the (i) beside the
 * page title: it's orientation, so it belongs above the fold rather than below
 * the carousel.
 */

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { track } from '@vercel/analytics'
import { Search, Landmark, Users, BadgeCheck, Megaphone, X, ArrowRight, Check, ChevronDown, ExternalLink, PenLine, SlidersHorizontal } from 'lucide-react'
import { BILLS_54, BILL_CATEGORIES, BILLS_54_META, type Bill54 } from '@/constants/bills-54'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import { normMemberName } from '@/lib/bills/normalize-member'
import { billsForTopic } from '@/lib/bills/by-topic'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import { TopicChip } from '@/components/homepage/topic-chip'
import type { PartySlug, PolicyTopic } from '@/types'
import { BORDER, INK, JADE, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

const normTitle = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const normName = normMemberName

const TYPE_STYLE: Record<string, { fg: string; bg: string }> = {
  Government: { fg: '#3730a3', bg: '#eef2ff' },
  "Member's": { fg: '#166638', bg: '#e6f4ec' },
  Local: { fg: '#92400e', bg: '#fff7e6' },
  Private: { fg: '#6b7078', bg: '#f1f1ef' },
}

/* TYPE_MEANS lived here — a sentence explaining what a government / member's
   / local / private bill is. Dropped with the line that used it: it was the
   same words on every card of that type and never about the bill in front of
   the reader. The bills page's own intro is where the mechanism belongs. */

const CATEGORY_TOPIC: Record<string, string> = {
  'Crime & justice': 'crime-justice',
  'Economy & tax': 'economy',
  'Education': 'education',
  'Environment & climate': 'environment',
  'Health': 'health',
  'Housing & tenancy': 'housing',
  'Treaty & Māori': 'treaty-maori-affairs',
  'Local government & democracy': 'democracy-government',
}

/* statusStyle() lived here: it coloured the stage pill ("Select committee",
   "Third Reading") on each card. The journey strip states the stage now, in
   milestones rather than in Parliament's own vocabulary, so the pill and its
   palette are gone. */

/**
 * The three outcomes a reader actually sorts bills into, and the colours the
 * "most debated" tiles above already use for them. The tracker's own status
 * is the parliamentary STAGE ("Second Reading", "Committee of whole House"),
 * which is six different words for the same one fact: it hasn't finished yet.
 */
const KIND = {
  law: { label: 'Now law', fg: '#166638', bg: '#e0f3e7', bar: '#2f8f5b' },
  defeated: { label: 'Not passed', fg: '#a3251f', bg: '#f8e4e2', bar: '#c23b3b' },
  progress: { label: 'In progress', fg: '#92400e', bg: '#f8ecd4', bar: '#c07a12' },
} as const

function statusKind(s: string): keyof typeof KIND {
  if (s === 'Royal Assent') return 'law'
  if (/defeat|not passed|negativ|withdraw|lapse/i.test(s)) return 'defeated'
  return 'progress'
}

const PAGE_SIZE = 24
// Newest first. The deep-link below has to find a bill's PAGE, which only
// means anything in the order the list is actually shown in — so the list and
// the deep-link share this one comparator rather than each having its own.
const byDateDesc = (a: Bill54, b: Bill54) => (b.date || '').localeCompare(a.date || '')
const DEFAULT_ORDER = [...BILLS_54].sort(byDateDesc)

export function BillsTracker54({ readerSlugs = {}, readerSummaries = {}, memberParty = {}, initialParty, initialBill, initialTopic }: { readerSlugs?: Record<string, string>; readerSummaries?: Record<string, string>; memberParty?: Record<string, string>; initialParty?: string; initialBill?: string; initialTopic?: string }) {
  const [q, setQ] = useState('')
  // One breakdown open at a time, held here rather than per card: two panels
  // open in one grid pushed the row they share apart.
  const [openBill, setOpenBill] = useState<string | null>(null)
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
  // The four selects start hidden. Most readers scroll or search; the ones who
  // want to narrow by party or stage go looking for a control, and four
  // dropdowns sitting open cost a third of a phone screen before a single bill.
  const [filtersOpen, setFiltersOpen] = useState(false)
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
  /** How many of the SELECTS are narrowing the list. The search box is left
   *  out: it is visible in its own right, so counting it on the filters
   *  button would report something the button does not control. */
  const narrowed = [cat !== 'All', type !== 'All', status !== 'All', party !== 'All', subsOnly].filter(Boolean).length
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
      <div className="bills-stats bills-tight" style={{ marginBottom: 12 }}>
        <Stat icon={Landmark} value={stats.total} label="Bills this term" />
        <Stat icon={BadgeCheck} value={stats.passed} label="Passed into law" />
        <Stat icon={Megaphone} value={stats.committee} label="At select committee" />
        {openCount > 0 && <Stat icon={PenLine} value={openCount} label="Open for submissions" />}
        <Stat icon={Users} value={stats.members} label="Member’s bills" />
      </div>

      {/* Search, then the filters behind a button. Search stays out: it is the
          one control a reader reaches for without being prompted, and it is a
          single field. */}
      <div className="bills-filters" style={{ marginBottom: 10 }}>
        <div className="bills-search" style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: TERTIARY }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bills or MPs…"
            style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 14, fontFamily: MANROPE, color: INK, outline: 'none', background: '#fff' }} />
        </div>
        {/* Carries the number of filters currently applied, so a reader who
            has narrowed the list and scrolled away can see that from the
            closed button rather than opening it to find out. */}
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          className="bills-filter-toggle"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
            border: `1px solid ${narrowed > 0 ? JADE : BORDER}`,
            background: narrowed > 0 ? '#ecfdf5' : '#fff',
            color: narrowed > 0 ? JADE : INK,
            fontFamily: MANROPE, fontSize: 13.5, fontWeight: 700,
          }}
        >
          <SlidersHorizontal style={{ width: 15, height: 15 }} />
          Filters
          {narrowed > 0 && <span style={{ fontWeight: 800 }}>{narrowed}</span>}
          <ChevronDown style={{ width: 14, height: 14, transform: filtersOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }} />
        </button>
      </div>

      {filtersOpen && (
      <div className="bills-filters" style={{ marginBottom: 10 }}>
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
      )}

      <div style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, marginBottom: 10 }}>
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
          {/* The same grid the "most debated" tiles use — small columns, tight
              gap — now that a collapsed card is a title and a label rather
              than a block of detail. */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: 8, alignItems: 'start' }}>
            {pageItems.map((b) => (
              <Fragment key={b.slug + b.number}>
                <BillCard
                  b={b}
                  open={openBill === b.slug}
                  onToggle={() => setOpenBill(openBill === b.slug ? null : b.slug)}
                  focused={b.slug === initialBill}
                  party={partyOf(b.member)}
                />
                {/* The breakdown opens directly under the tile that was tapped
                    and spans every column, so on a wide screen it is not a
                    sliver in one of them — the same arrangement the "most
                    debated" grid above uses. */}
                {openBill === b.slug && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <BillBreakdown
                      b={b}
                      readerSlug={readerSlugs[normTitle(b.title)]}
                      summary={readerSummaries[normTitle(b.title)]}
                      submissionsOpen={isOpen(b)}
                      party={partyOf(b.member)}
                      onClose={() => setOpenBill(null)}
                    />
                  </div>
                )}
              </Fragment>
            ))}
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
/**
 * One bill in the results grid: the outcome as a label, the title, a chevron.
 *
 * A card used to carry everything at once — three tags, the member, the
 * committee, sometimes a submissions panel and two links. Twenty-four of those
 * is a wall, and the thing a reader scans for is the title. The detail lives
 * in the breakdown that opens under the row (BillBreakdown).
 */
function BillCard({ b, open, onToggle, focused, party }: { b: Bill54; open: boolean; onToggle: () => void; focused?: boolean; party?: string }) {
  const kind = KIND[statusKind(b.status)]
  return (
    <div id={`bill-${b.slug}`} className="party-card" style={{
      border: `${open ? 3 : 2}px solid ${open ? kind.fg : kind.bar}`, borderRadius: 11,
      background: kind.bg, display: 'flex', flexDirection: 'column', height: '100%',
      transition: 'border-color .2s ease, border-width .2s ease',
      ...(focused ? { boxShadow: `0 0 0 3px ${JADE}`, scrollMarginTop: 96 } : {}),
    }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          position: 'relative',
          display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%', textAlign: 'left',
          background: 'none', border: 'none', padding: '7px 26px 20px 10px', cursor: 'pointer', font: 'inherit',
        }}
      >
        <span style={{ flex: 1, minWidth: 0 }}>
          {/* Status left, party right, on the row above the title — the same
              header the debated-bills tiles carry, so the two lists read as
              one thing. The party is whoever is in charge of the bill, from
              the member-party map the filters already use. */}
          <span style={{ display: 'block', fontSize: 9.5, fontWeight: 800, color: kind.fg, fontFamily: MANROPE, marginBottom: 2 }}>{kind.label}</span>
          {party && (
            /* Absolute, hard against the tile's own right edge. In the flex
               row it was 35px in, because the row also has to clear the
               chevron's padding — so the tag sat short of the corner it is
               meant to occupy. */
              <span style={{
                position: 'absolute', top: 7, right: 8,
                display: 'inline-flex', alignItems: 'center', flexShrink: 0,
                fontSize: 9, fontWeight: 800, color: PARTY_COLORS[party as PartySlug]?.text ?? INK,
                background: PARTY_COLORS[party as PartySlug]?.bg ?? 'transparent',
                borderRadius: 999, padding: '2px 6px', fontFamily: MANROPE, whiteSpace: 'nowrap',
              }}>{PARTY_NAMES[party as PartySlug]?.short ?? party}</span>
          )}
          <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.25 }}>{b.title}</span>
        </span>
        {/* Bottom-right, not beside the title: the tag owns the top-right
            corner now, and a chevron centred against a two-line title floated
            in the middle of the tile. Absolute so it cannot push the title
            narrower as the corner it sits in changes height. */}
        <ChevronDown
          style={{
            position: 'absolute', right: 8, bottom: 7,
            width: 15, height: 15, flexShrink: 0, color: kind.fg,
            transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease',
          }}
          strokeWidth={3}
        />
      </button>
    </div>
  )
}

/**
 * The breakdown, in the same shape the "most debated" panel uses: the outcome
 * badge, the title, the journey through Parliament, then the specifics.
 *
 * The journey is derived from the bill's STAGE rather than from a hand-written
 * timeline — the tracker holds 285 bills and none of them has one. The stages
 * Parliament reports are themselves the milestones, so a bill at "Committee of
 * whole House" has necessarily been through its first reading and select
 * committee, and the strip can say so honestly without inventing dates.
 */
const JOURNEY = ['Introduced', 'First reading', 'Select committee', 'Second reading', 'Third reading'] as const
/** How far a bill's reported stage places it along JOURNEY. */
function reachedIndex(status: string): number {
  const s = status.toLowerCase()
  if (s.includes('royal assent')) return JOURNEY.length
  if (s.includes('third')) return 4
  if (s.includes('committee of whole')) return 4
  if (s.includes('second')) return 3
  if (s.includes('select committee')) return 2
  if (s.includes('first')) return 1
  return 0
}

function BillBreakdown({ b, readerSlug, summary, submissionsOpen, party, onClose }: {
  b: Bill54
  readerSlug?: string
  /** Our own plain-language summary, where the bill has a published
   *  breakdown. Most bills have none — see bills/page.tsx. */
  summary?: string
  submissionsOpen?: boolean
  party?: string
  onClose: () => void
}) {
  const ts = TYPE_STYLE[b.type] ?? TYPE_STYLE.Private
  const kind = KIND[statusKind(b.status)]
  const topicKey = CATEGORY_TOPIC[b.category]
  const reached = reachedIndex(b.status)
  const nodes = [...JOURNEY.map((label, i) => ({ label, done: i < reached })), { label: kind.label, done: reached >= JOURNEY.length }]

  return (
    <div style={{
      background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16,
      padding: 'clamp(14px, 2.5vw, 20px)', marginTop: 2,
      boxShadow: '0 1px 2px rgba(0,0,0,.03), 0 20px 40px -34px rgba(0,0,0,.4)',
    }}>
      {/* Badge left, close right — the tile that opened this is above, but a
          reader who has scrolled the panel should not have to go back up. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: kind.fg, background: kind.bg, borderRadius: 999, padding: '4px 11px', fontFamily: MANROPE }}>
          {kind.label}
        </span>
        <button type="button" onClick={onClose} aria-label="Close this bill" style={{ background: 'none', border: 'none', padding: 6, margin: -6, cursor: 'pointer', color: SECONDARY, display: 'inline-flex', flexShrink: 0 }}>
          <X style={{ width: 17, height: 17 }} />
        </button>
      </div>

      <h3 style={{ fontSize: 'clamp(17px, 2.6vw, 21px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '11px 0 8px', lineHeight: 1.2 }}>{b.title}</h3>

      {/* What the bill DOES, where we have written it up. The sentence that
          stood here explained what a "government bill" is, which is the same
          words on 196 of these cards and never about the bill in front of the
          reader. Bills without a published breakdown say nothing rather than
          something generic. */}
      {summary && (
        // TWO SENTENCES, not the whole summary: these run to a dozen lines on
        // a phone, which is a page of reading before the reader has decided
        // they care. The rest is on the breakdown the button below opens.
        <p style={{ fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 12px' }}>{gist(summary)}</p>
      )}
      {/* The policy area as the SAME chip the policy pages use, so a reader
          who has met it there recognises it here. */}
      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, margin: '0 0 9px' }}>
        Its journey through Parliament
      </p>
      <BillJourney nodes={nodes} accent={kind.fg} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 16 }}>
        {b.member && (
          <div style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span>In charge: <b style={{ color: '#3f444c' }}>{b.member}</b></span>
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
        {b.committee && <div style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE }}>{b.committee} committee</div>}

        {/* The policy area, under the people rather than under the title: it
            is the least specific thing here, and the chip is the same one the
            policy comparison page uses (className carries its compact size). */}
        <div className="topic-switcher" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE }}>Area:</span>
          {topicKey
            ? <TopicChip topicKey={topicKey} active={false} href={`/policies/${topicKey}`} />
            : <span style={{ fontSize: 11.5, fontWeight: 800, color: INK, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 999, padding: '4px 9px', fontFamily: MANROPE }}>{b.category}</span>}
        </div>
      </div>

      {/* Have your say — only while submissions are genuinely open. */}
      {submissionsOpen && (
        <div style={{ marginTop: 12, background: '#eef4ff', border: '1px solid #bfd4fe', borderRadius: 10, padding: '9px 11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#1e3a8a', fontFamily: MANROPE }}>
            <PenLine style={{ width: 13, height: 13 }} /> You can have your say on this bill
          </div>
          <div style={{ fontSize: 11.5, color: '#1e40af', fontFamily: MANROPE, marginTop: 3 }}>
            Submissions close {fmtDate(b.submissionsClose)}
          </div>
          {/* The strongest outcome we can evidence: not that someone read about
              a bill, but that they went on to have their say. */}
          <a href={b.officialUrl} target="_blank" rel="noopener noreferrer"
             onClick={() => track('submission_click', { bill: b.slug })}
             style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 12, fontWeight: 800, color: '#1e3a8a', fontFamily: MANROPE, textDecoration: 'none' }}>
            How to make a submission <ExternalLink style={{ width: 11, height: 11 }} />
          </a>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 14 }}>
        {readerSlug && (
          <Link
            href={`/legislation/${readerSlug}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 14px', borderRadius: 10,
              background: kind.fg, color: '#fff',
              fontSize: 13, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none',
            }}
          >
            Read the full breakdown <ArrowRight style={{ width: 14, height: 14 }} strokeWidth={3} />
          </Link>
        )}
        {/* Every bill links to its exact page on Parliament's site, so any claim
            here can be checked at source rather than taken on trust. */}
        <a href={b.officialUrl} target="_blank" rel="noopener noreferrer"
           style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, textDecoration: 'none' }}>
          Official page <ExternalLink style={{ width: 11, height: 11 }} />
        </a>
      </div>
    </div>
  )
}

/**
 * The first two sentences of a summary, as the gist.
 *
 * Cuts on sentence boundaries rather than a character count, so it never ends
 * mid-clause, and only adds an ellipsis when something was actually left out.
 * Abbreviations ending in a full stop would fool a naive split, so the common
 * ones are stepped over first.
 */
function gist(text: string, sentences = 2): string {
  const MARK = '\u0001'
  const parts = text
    .replace(/\b(Hon|Dr|Mr|Mrs|Ms|No|Inc|Ltd)\./g, `$1${MARK}`)
    .split(/(?<=[.!?])\s+/)
  const taken = parts.slice(0, sentences).join(' ').split(MARK).join('.').trim()
  return parts.length > sentences ? `${taken.replace(/[.!?]+$/, '')}…` : taken
}

/**
 * The progress strip: a rail that STAYS PUT, and the stages travelling across
 * it until they settle on where the bill has got to.
 *
 * The rail and its filled portion are drawn on the outer box, so they never
 * move; the steps live on a track inside it that slides right to left. That
 * is the whole point of the animation — a line that scrolled with the steps
 * read as the page moving, where a line that holds still reads as the bill
 * travelling along it.
 *
 * A fixed window rather than the full width: six stages across a desktop fit
 * with room to spare, so there was nothing to travel and the animation only
 * existed on a phone.
 */
const STEP_W = 84
const WINDOW_STEPS = 3.5

function BillJourney({ nodes, accent }: { nodes: { label: string; done: boolean }[]; accent: string }) {
  const lastDone = nodes.reduce((n, x, i) => (x.done ? i : n), -1)
  // Where the track ends up: the current stage sitting just left of centre,
  // clamped so it never runs past either end of the strip.
  const restAt = Math.min(
    Math.max(0, (lastDone - 1) * STEP_W),
    Math.max(0, nodes.length * STEP_W - WINDOW_STEPS * STEP_W),
  )
  const [shift, setShift] = useState(0)

  useEffect(() => {
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (still) { setShift(restAt); return }
    setShift(0)
    const t = setTimeout(() => setShift(restAt), 380)
    return () => clearTimeout(t)
  }, [restAt])

  // How much of the rail is filled: the stages behind the current one, as a
  // share of the window the reader can see.
  const filled = Math.min(1, Math.max(0, ((lastDone * STEP_W) - shift + STEP_W / 2) / (WINDOW_STEPS * STEP_W)))

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: WINDOW_STEPS * STEP_W, overflow: 'hidden' }}>
      {/* The rail. Fixed to the box, not to the steps. */}
      <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: 10, height: 2, background: BORDER }} />
      <span aria-hidden style={{ position: 'absolute', left: 0, top: 10, height: 2, background: accent, width: `${filled * 100}%`, transition: 'width .55s cubic-bezier(.3,.8,.3,1)' }} />

      <div style={{
        display: 'flex', width: nodes.length * STEP_W,
        transform: `translateX(${-shift}px)`,
        transition: 'transform .55s cubic-bezier(.3,.8,.3,1)',
      }}>
        {nodes.map((node) => (
          <span key={node.label} style={{ position: 'relative', width: STEP_W, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: node.done ? accent : '#fff', border: `2px solid ${node.done ? accent : BORDER}`,
            }}>
              {node.done && <Check style={{ width: 11, height: 11, color: '#fff' }} strokeWidth={3} />}
            </span>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: node.done ? INK : TERTIARY, fontFamily: MANROPE, textAlign: 'center', lineHeight: 1.2 }}>
              {node.label}
            </span>
          </span>
        ))}
      </div>

      {/* Feathers the steps out at the right edge, so they read as continuing
          past the window rather than being cut off. */}
      <span aria-hidden style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 26, pointerEvents: 'none', background: 'linear-gradient(to left, #fff, #fff0)' }} />
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
  .bills-filters { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .bills-search { grid-column: 1 / -1; min-width: 0; }
  .bills-select { max-width: none; width: 100%; min-width: 0; }
  /* Shorter controls on a phone. The filter bar was five full-height rows
     before the first result — most of a screen spent on things the reader has
     not asked for yet. Trimmed to roughly two thirds of that, which still
     clears the 40px a thumb needs. */
  .bills-filters input,
  .bills-filters .bills-select { padding-top: 7px !important; padding-bottom: 7px !important; font-size: 13px !important; }
  /* Clear shares the last row with nothing else, so it can be a chip rather
     than a full-width bar. */
  .bills-filters > button { grid-column: 1 / -1; justify-content: center; padding: 6px 12px !important; }
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
