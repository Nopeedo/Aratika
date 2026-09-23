'use client'

/**
 * NewsFeed — the live "Latest" political-news feed. Every card links OUT to the
 * original article (we aggregate from credible outlets' RSS; we never republish
 * their content).
 *
 * Redesigned against docs/DESIGN-SPEC.md, 24 September 2026. /news was 28,507px,
 * 35 screens, with 2,355px of rails and pill rows before the first story. What
 * came off, and why:
 *
 *  - THE STORY RAIL ("In the headlines"), 264x330 cards holding the newest 14
 *    stories, which were also the first 14 rows of the list directly under it:
 *    every story on it was stated twice on one page (§1.3). §2.10 had already
 *    retired this exact shape on the homepage, where a rail of fixed-width
 *    cards showed 1.25 of a card in 337px of phone and hid the rest behind a
 *    swipe nobody found. Cutting it took an arrow pair and a second card design
 *    with it (§1.4).
 *  - THE SECOND VIDEO RAIL ("Interviews"): identical shape, identical card,
 *    identical party pills, identical arrows, rendered twice with a different
 *    heading. The distinction it drew, official channel against news outlet, is
 *    one fact about each video and every card already names its source. The two
 *    lists are merged here rather than dropped, so no video is lost (§5.17).
 *  - THREE party filters against three different scopes, in two hand-rolled
 *    pill systems. One filter now, over everything (§1.3).
 *  - "Showing N of M stories": the total belongs on the All pill, which had no
 *    count while every party pill had one.
 *  - The filters themselves, 484px of always-open pill rows before the first
 *    result, behind one §2.11 button that carries the count when narrowed.
 *  - The unfolded list, ~120 rows with no cut: §3.6, eight then "Show N more".
 *
 * THE DESKTOP RULE (§2.14, §2.15, §5.19). A story row is 337x172 at 375px and
 * 498x187 at 1920: the card GROWS with the column instead of the page's margins
 * doing the work, and it grows on BOTH axes because the thumbnail, the type and
 * the padding all step up with the track. Every reserved height is restated at
 * the larger size, because two lines of 17px is 46px where two lines of 15px
 * was 41, and grid items stretch to their row, so a missed reserve shows
 * BETWEEN rows.
 */

import { useMemo, useState } from 'react'
import { ChevronDown, ExternalLink, Landmark, Newspaper, SlidersHorizontal } from 'lucide-react'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import type { PartySlug, PolicyTopic } from '@/types'
import type { NewsItem } from '@/lib/news/live'
import type { VideoItem } from '@/lib/news/videos'
import { VideoSection } from '@/components/news/video-section'
import { AboutVideo } from '@/components/news/about-news'
import { BORDER, INK, JADE, JADE_DARK, MANROPE, SECONDARY, SURFACE, TERTIARY } from '@/constants/theme'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Deterministic date label (UTC) — safe for SSR/hydration (no Date.now()).
function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

/** With the year, for the one line that dates the whole feed (§4). */
function fmtDateFull(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** §3.6. Eight rows, then name the number left: "37 more" is a decision a
 *  reader can make, "more" is not. */
const VISIBLE = 8

/* §3.6's measured stops. The list carries 34px of bottom padding while
   collapsed, which is the room the control sits in, so the stops are measured
   from the bottom of the PADDED box: the first attempt was a 46px fade that
   spent 34 of its 46px on empty space and looked like no fade at all. */
const FOLD_MASK =
  'linear-gradient(to bottom, #000 0%, #000 calc(100% - 86px), rgba(0,0,0,.12) calc(100% - 26px), transparent calc(100% - 10px))'

export function NewsFeed({ items, videos = [], interviews = [] }: { items: NewsItem[]; videos?: VideoItem[]; interviews?: VideoItem[] }) {
  const [party, setParty] = useState<string>('all')
  const [topic, setTopic] = useState<string>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const partyCounts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const it of items) for (const p of it.parties) c[p] = (c[p] || 0) + 1
    return c
  }, [items])
  const topicCounts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const it of items) for (const t of it.topics) c[t] = (c[t] || 0) + 1
    return c
  }, [items])

  /* One rail, not two. getInterviewVideos() draws from the same table as
     getVideos(), so the two lists overlapped: merged by id, newest first, and
     nothing is dropped (§5.17). */
  const allVideos = useMemo(() => {
    const byId = new Map<string, VideoItem>()
    for (const v of [...videos, ...interviews]) byId.set(v.id, v)
    return [...byId.values()].sort((a, b) => (b.pubDate ?? '').localeCompare(a.pubDate ?? ''))
  }, [videos, interviews])

  const filtered = useMemo(() => items.filter((it) =>
    (party === 'all' || it.parties.includes(party)) &&
    (topic === 'all' || it.topics.includes(topic)),
  ), [items, party, topic])

  const partyKeys = Object.keys(partyCounts).sort((a, b) => partyCounts[b] - partyCounts[a])
  const topicKeys = Object.keys(topicCounts).sort((a, b) => topicCounts[b] - topicCounts[a])

  /** What the closed button carries. Without it a reader who narrows, then
   *  scrolls into the list, cannot tell a short list from an empty subject
   *  except by scrolling back and opening the panel (§2.11). */
  const narrowed = (party === 'all' ? 0 : 1) + (topic === 'all' ? 0 : 1)

  const hidden = Math.max(0, filtered.length - VISIBLE)
  const collapsed = !showAll && hidden > 0
  const shown = collapsed ? filtered.slice(0, VISIBLE) : filtered

  function pickParty(p: string) { setParty(party === p ? 'all' : p); setShowAll(false) }
  function pickTopic(t: string) { setTopic(topic === t ? 'all' : t); setShowAll(false) }

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: FEED_CSS }} />

      {/* ── The stories ──────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <h2 style={h2}>Latest stories</h2>

        {/* §2.11: one button where two always-open pill rows were. Search does
            not live here because this feed has none; everything else does. */}
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
            fontFamily: MANROPE, fontSize: 13.5, fontWeight: 700,
            background: narrowed ? '#ecfdf5' : '#fff',
            border: `1px solid ${narrowed ? JADE : BORDER}`,
            color: narrowed ? JADE_DARK : INK,
          }}
        >
          <SlidersHorizontal style={{ width: 15, height: 15 }} />
          Filter
          {narrowed > 0 && (
            <span style={{ fontWeight: 800, color: JADE_DARK }}>{narrowed}</span>
          )}
          <ChevronDown style={{ width: 14, height: 14, transform: filtersOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }} />
        </button>
      </div>

      {filtersOpen && (
        <div style={{ border: `1px solid ${BORDER}`, background: SURFACE, borderRadius: 12, padding: '12px 13px', marginBottom: 16 }}>
          <div style={rowLabel}>Party</div>
          <div className="nf-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {/* All leads the row carrying the total, which is where the
                "Showing N of M stories" line went. */}
            <FilterPill label="All" count={items.length} on={party === 'all'} hue={INK} fill="#efece5" onClick={() => pickParty('all')} />
            {partyKeys.map((p) => (
              <FilterPill
                key={p}
                label={PARTY_NAMES[p as PartySlug]?.short ?? p}
                count={partyCounts[p]}
                on={party === p}
                /* Party colour on a party pill, per ballot-bills.tsx. Filling
                   it solid black when selected was a second colour system on a
                   page whose whole subject is party colour (§1.6). */
                hue={PARTY_COLORS[p as PartySlug]?.bg ?? INK}
                fill={PARTY_COLORS[p as PartySlug]?.bg ?? '#efece5'}
                onClick={() => pickParty(p)}
              />
            ))}
          </div>

          {topicKeys.length > 0 && (
            <>
              <div style={rowLabel}>Issue</div>
              <div className="nf-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <FilterPill label="All" count={items.length} on={topic === 'all'} hue={INK} fill="#efece5" onClick={() => pickTopic('all')} />
                {topicKeys.map((t) => (
                  <FilterPill
                    key={t}
                    label={POLICY_TOPICS[t as PolicyTopic]?.label ?? t}
                    count={topicCounts[t]}
                    on={topic === t}
                    hue={INK}
                    fill="#efece5"
                    onClick={() => pickTopic(t)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* §1.5: a silent gap reads as broken. The page's only empty state
          covered items.length === 0 and never filtered.length === 0, so a pill
          that matched nothing rendered an empty div under a counter. */}
      {filtered.length === 0 ? (
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '22px 18px', fontFamily: MANROPE }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: INK, marginBottom: 6 }}>
            No stories match that yet
          </div>
          <p style={{ fontSize: 13, color: SECONDARY, lineHeight: 1.6, margin: 0 }}>
            Coverage follows what newsrooms write about, not our choice, so a
            smaller party or a quieter issue can have nothing in this window.
          </p>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div
            className="nf-grid"
            style={{
              display: 'grid',
              padding: collapsed ? '0 0 34px' : '0 0 2px',
              ...(collapsed ? { WebkitMaskImage: FOLD_MASK, maskImage: FOLD_MASK } : null),
            }}
          >
            {shown.map((it) => <Row key={it.id} it={it} />)}
          </div>

          {/* While collapsed the control sits ON the fade, where the fade is
              already saying "this continues" (§3.6). */}
          {hidden > 0 && collapsed && (
            <button
              onClick={() => setShowAll(true)}
              aria-expanded={false}
              style={{
                position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)',
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 999,
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: MANROPE, fontSize: 12, fontWeight: 800, color: JADE_DARK,
              }}
            >
              Show {hidden} more
              <ChevronDown style={{ width: 15, height: 15 }} strokeWidth={3} />
            </button>
          )}
        </div>
      )}

      {hidden > 0 && !collapsed && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <button
            onClick={() => setShowAll(false)}
            aria-expanded
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '8px 12px', margin: '-4px 0',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: MANROPE, fontSize: 12, fontWeight: 800, color: JADE_DARK,
            }}
          >
            Show fewer
            <ChevronDown style={{ width: 15, height: 15, transform: 'rotate(180deg)' }} strokeWidth={3} />
          </button>
        </div>
      )}

      {/* §4, "say the date on anything that ages" — and a live feed ages
          fastest of all. The page carried no timestamp at all. */}
      {items[0]?.pubDate && (
        <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '16px 0 0' }}>
          Newest story {fmtDateFull(items[0].pubDate)}. The feed updates through the day.
        </p>
      )}

      {/* ── Video ────────────────────────────────────────────── */}
      {/* The nav has offered /news#video since the rail was built and no
          element on this page carried that id, so the link landed at the top.
          scrollMarginTop clears the 4rem sticky navbar (§5.2). */}
      {/* The heading lives here rather than inside VideoSection so it can be
          withheld with the rail: VideoSection returns null on an empty list, and
          a heading with nothing under it is the silent gap §1.5 is about. */}
      {allVideos.length > 0 && (
        <section id="video" style={{ scrollMarginTop: '5rem', marginTop: 34 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            {/* §1.7, name what it is: "Leaders & the press" named a tone and
                "Interviews" named half the rail. */}
            <h2 style={h2}>Video from the campaign</h2>
            <AboutVideo />
          </div>
          {/* hideHeading, because the heading and the (i) are above. The blurb
              that used to sit under the rail's own heading is in that (i). */}
          <VideoSection videos={allVideos} hideHeading />
        </section>
      )}
    </div>
  )
}

/**
 * One story. §2.12 ROWS rather than §2.3 tiles, the same deliberate divergence
 * the ballot list records: a news item has a headline, an outlet, a date and a
 * link out, and nothing to expand into, so a tile that opened would open onto
 * one fact.
 *
 * The snippet stayed, against the audit that proposed cutting it. Its cost was
 * measured at 49px x ~120 rows; with the §3.6 fold there are eight rows, so it
 * is 392px, and it is the only thing on the row that is not stated somewhere
 * else on it (§5.17: a cut removes a duplicate, and this is not one). It is
 * clamped and its height is RESERVED, so a row with no snippet does not leave
 * the card beside it short.
 */
function Row({ it }: { it: NewsItem }) {
  const gov = it.kind === 'government'
  return (
    <a
      href={it.link}
      target="_blank"
      rel="noopener noreferrer"
      className="party-card nf-row"
      style={{ display: 'flex', textDecoration: 'none', border: `1px solid ${BORDER}`, background: '#fff' }}
    >
      <Thumb src={it.image} gov={gov} outlet={it.outlet} portrait={it.portrait} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="nf-meta" style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: gov ? '#92400e' : '#1e40af', background: gov ? '#fff7e6' : '#eef4ff', borderRadius: 999, padding: '3px 9px', fontFamily: MANROPE, whiteSpace: 'nowrap' }}>
            {gov ? <Landmark style={{ width: 11, height: 11 }} /> : <Newspaper style={{ width: 11, height: 11 }} />}{it.outlet}
          </span>
          {it.pubDate && <span style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, whiteSpace: 'nowrap' }}>{fmtDate(it.pubDate)}</span>}
          {it.cc && <span style={{ fontSize: 10, fontWeight: 700, color: '#065f46', background: '#ecfdf5', borderRadius: 5, padding: '1px 6px', fontFamily: MANROPE }} title="Creative Commons: openly licensed">CC</span>}
        </div>

        <div className="nf-title" style={{ fontWeight: 800, color: INK, fontFamily: MANROPE }}>{it.title}</div>

        <p className="nf-snip" style={{ color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>{it.snippet}</p>

        <div className="nf-tags" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
          {it.parties.slice(0, 3).map((p) => (
            <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: SECONDARY, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '2px 8px', fontFamily: MANROPE, whiteSpace: 'nowrap' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: PARTY_COLORS[p as PartySlug]?.bg ?? TERTIARY }} />
              {PARTY_NAMES[p as PartySlug]?.short ?? p}
            </span>
          ))}
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 800, color: JADE, fontFamily: MANROPE, whiteSpace: 'nowrap' }}>
            Read at {it.outlet} <ExternalLink style={{ width: 12, height: 12 }} />
          </span>
        </div>
      </div>
    </a>
  )
}

function Thumb({ src, gov, outlet, portrait }: { src: string | null; gov: boolean; outlet: string; portrait?: { src: string; name: string } | null }) {
  const [err, setErr] = useState(false)
  // Width/height live in a class (globals.css .nf-thumb, stepped up for desktop
  // in FEED_CSS below), not here: at 375px this box took 116 of the card's 273
  // usable pixels and left 141 for the headline, which broke it to roughly one
  // word a line. An inline width cannot be overridden by a media query (§3.2).
  const box: React.CSSProperties = { flexShrink: 0, borderRadius: 10, overflow: 'hidden', background: gov ? '#fff7e6' : '#eef4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }
  if (src && !err) {
    return (
      <div className="nf-thumb" style={box}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    )
  }
  // No published picture — fall back to a portrait of an MP the item names, with
  // their name as alt text so it is announced as a person, not a story photo.
  if (portrait) {
    return (
      <div className="nf-thumb" style={box} title={portrait.name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={portrait.src} alt={portrait.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
      </div>
    )
  }
  return (
    <div className="nf-thumb" style={box} aria-hidden title={outlet}>
      {gov ? <Landmark style={{ width: 24, height: 24, color: '#b4810b' }} /> : <Newspaper style={{ width: 24, height: 24, color: '#5b7cc4' }} />}
    </div>
  )
}

/**
 * §2.2 pill in the §3.1 wrapper: the button is the 44px hit area, the span is
 * the 28px control.
 *
 * What it replaced: a bare <button> with 6px 12px padding, which
 * `button { min-height: 44px }` inflated to exactly 44px on a phone. Three rows
 * of party pills were 146px and five rows of issue pills were 248px, for
 * controls styled 28px.
 */
function FilterPill({ label, count, on, hue, fill, onClick }: {
  label: string
  count: number
  on: boolean
  hue: string
  fill: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      style={{ display: 'inline-flex', padding: '8px 0', margin: '-8px 0', background: 'none', border: 'none', cursor: 'pointer' }}
    >
      <span
        className="status-pill"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999,
          background: on ? fill : '#fff',
          border: `2px solid ${hue}`,
          color: INK, fontFamily: MANROPE, fontWeight: 800,
          transition: 'background-color .2s ease, border-color .2s ease',
        }}
      >
        {label}
        <span style={{ fontWeight: 700, opacity: .75 }}>{count}</span>
      </span>
    </button>
  )
}

const h2: React.CSSProperties = {
  fontSize: 24, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0, letterSpacing: '-.025em',
}

const rowLabel: React.CSSProperties = {
  fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
  color: TERTIARY, fontFamily: MANROPE, marginBottom: 7,
}

/* Sizes live here rather than inline for two reasons (§2.15, §3.2): a media
   query cannot reach an inline style, and globals.css rewrites an inline
   font-size:11px to 12.5px on a phone, so a height computed from an inline
   label is wrong on the device it was computed for. Authored in a class, the
   value written is the value rendered.

   THE DESKTOP RULE. One column on a phone, two from 768px, and the ROW grows
   with the column rather than the list multiplying into narrower cards:
   337x170 at 375px, 499x185 at 1920. Two columns rather than three, because at
   three a headline gets ~300px and breaks to four lines; and rather than one,
   because a 60-character headline set across a 1008px column is a phone card
   with the page margins doing the rest.

   auto-fit, never auto-fill (§5.18): filter to a small party and the two or
   three surviving rows fill the row instead of hugging the left edge with an
   empty track beside them. */
const FEED_CSS = `
.nf-grid { grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 10px; align-items: stretch; }
.nf-row { border-radius: 12px; padding: 12px 13px; gap: 12px; }
/* Every one of these is RESERVED, not just styled. A row whose story has no
   snippet, or a one-line headline, would otherwise come out short and stagger
   the grid BETWEEN rows, because grid items stretch to their row (§2.14). */
.nf-meta { height: 22px; margin-bottom: 8px; }
.nf-title {
  height: 41px; font-size: 15px; line-height: 1.35; margin-bottom: 6px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.nf-snip {
  height: 39px; font-size: 13px; line-height: 1.5; margin-bottom: 8px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.nf-tags { height: 22px; }

@media (min-width: 768px) {
  /* THE SAME ROW, BIGGER. Two 499px columns at a 1008px content width, with
     everything inside stepped up with the track: thumb 116x88 to 150x113,
     headline 15 to 17, snippet 13 to 13.5, padding 12/13 to 14/16, radius 12
     to 14. It is a scale, not a re-layout: thumb left, text right, at both
     sizes.

     The reserves are restated because the type moved: two lines of 17px at
     1.35 is 46px where two lines of 15px was 41, and two lines of 13.5px at
     1.5 is 41px where two lines of 13px was 39. */
  .nf-grid { grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 12px; }
  .nf-row { border-radius: 14px !important; padding: 14px 16px !important; gap: 14px !important; }
  .nf-row .nf-thumb { width: 150px !important; height: 113px !important; }
  .nf-meta { height: 24px; margin-bottom: 8px; }
  .nf-title { height: 46px; font-size: 17px; margin-bottom: 6px; }
  .nf-snip { height: 41px; font-size: 13.5px; margin-bottom: 8px; }
  .nf-tags { height: 24px; }
}

@media (max-width: 767px) {
  /* §2.2's lesson: take the space between the pills before you take the size
     of them. Scoped to these rows, never to the shared .status-pill rule. */
  .nf-pills { gap: 5px !important; }
  .nf-pills .status-pill { padding: 5px 8px !important; font-size: 12px !important; white-space: nowrap; }
  .nf-pills .status-pill span { font-size: 10.5px !important; }
}
`
