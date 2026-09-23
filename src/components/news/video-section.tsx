'use client'

/**
 * VideoSection — "Leaders & the press". A swipeable rail of official YouTube
 * videos (press standups, leader updates, debates) filterable by party. Clicking
 * opens a privacy-enhanced (youtube-nocookie) pop-up player — we embed, we don't
 * rehost. See src/lib/news/videos.ts.
 *
 * Redesigned 24 September 2026 against docs/DESIGN-SPEC.md. PUBLIC PROPS ARE
 * UNCHANGED (`videos`, `hideHeading`, `heading`, `blurb`), because the Election
 * Centre renders this with hideHeading and the dashboard renders it with the
 * defaults. What changed inside it:
 *
 *  - FChip was a byte-for-byte copy of NewsFeed's Chip: same 6px/12px padding,
 *    same 12.5px/700 type, same black INK fill when active. Both are now the
 *    shared .status-pill (§2.2) in the §3.1 hit-area wrapper, and a party pill
 *    takes the party's OWN colour, because filling it solid black was a second
 *    colour system on a rail whose whole subject is party colour (§1.6).
 *  - The pills and the arrows were bare <button>s, so
 *    `button { min-height: 44px }` inflated each of them to 44px on a phone for
 *    a control styled 28 and 32 (§3.1).
 *  - The arrows nudged a fixed 300px. They step a measured page now (§3.5).
 *  - The card width was inline (`flex: 0 0 286px`), so no media query could
 *    reach it and it took 85% of a 375px phone for one card (§3.2). It is a
 *    class now, and it GROWS with the rail instead of staying a phone card in a
 *    desktop column: clamp(240px, (100% - 28px) / 3, 380px) is three whole
 *    cards in a 1008px content column and one and a half on a phone (§2.14).
 */

import { useRef, useState, useEffect } from 'react'
import { Play, X, ChevronLeft, ChevronRight, Vote } from 'lucide-react'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import type { PartySlug } from '@/types'
import type { VideoItem } from '@/lib/news/videos'
import { BORDER, INK, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Deterministic date label (UTC) — SSR/hydration-safe (no Date.now()); matches NewsFeed.
function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

export function VideoSection({ videos, hideHeading = false, heading, blurb }: {
  videos: VideoItem[]
  /** Suppress the built-in "Leaders & the press" title + blurb. Set this when the
   *  rail sits inside a zone that already has its own header — otherwise the
   *  section shows two competing headings, which is what the Election Centre did. */
  hideHeading?: boolean
  /** Override the title/blurb so the same rail can serve the Interviews section.
   *  Parameterised rather than forked: the card, the party filter, the pop-up
   *  player and the keyboard handling are identical, and two copies would drift. */
  heading?: string
  blurb?: string
}) {
  const [party, setParty] = useState('all')
  const [open, setOpen] = useState<VideoItem | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (videos.length === 0) return null
  const counts: Record<string, number> = {}
  for (const v of videos) for (const p of v.parties) counts[p] = (counts[p] || 0) + 1
  const partyKeys = Object.keys(counts).sort((a, b) => counts[b] - counts[a])
  const shown = videos.filter((v) => party === 'all' || v.parties.includes(party))
  /* §3.5: step a MEASURED page rather than a fixed 300px nudge, which was one
     and a bit cards at every width and landed mid-card on a desktop. */
  const scroll = (dir: number) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * Math.max(200, el.clientWidth - 24), behavior: 'smooth' })
  }

  return (
    <section style={{ marginBottom: 30 }}>
      {/* Shipped with the component and mounted on every render, not inside a
          branch: §3.2's exact failure was a phone block mounted in one branch,
          so the tallest card on the page never received any of it. */}
      <style dangerouslySetInnerHTML={{ __html: VID_CSS }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: hideHeading ? 'flex-end' : 'space-between', gap: 12, marginBottom: 4 }}>
        {/* 24px, the size /bills, /budget and the stories heading above use for a
            peer section. At 19px under a 30px h1 it read as a caption (§4). */}
        {!hideHeading && <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.025em', color: INK, fontFamily: MANROPE, margin: 0 }}>{heading ?? 'Leaders & the press'}</h2>}
        <div style={{ display: 'flex', gap: 8 }}>
          <Arrow label="Scroll left" onClick={() => scroll(-1)}><ChevronLeft style={{ width: 18, height: 18 }} /></Arrow>
          <Arrow label="Scroll right" onClick={() => scroll(1)}><ChevronRight style={{ width: 18, height: 18 }} /></Arrow>
        </div>
      </div>
      {!hideHeading && <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 12px' }}>{blurb ?? 'Press standups, leader updates and debates, straight from official channels.'}</p>}

      {/* Party filter. §2.2 pills in the §3.1 wrapper, and the count moved
          OUT of the label and into the pill, where the rest of the site puts
          it: "National (7)" inside a pill is a count wearing brackets. */}
      <div className="vid-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        <FChip label="All" count={videos.length} active={party === 'all'} hue={INK} fill="#efece5" onClick={() => setParty('all')} />
        {partyKeys.map((p) => (
          <FChip
            key={p}
            label={PARTY_NAMES[p as PartySlug]?.short ?? p}
            count={counts[p]}
            active={party === p}
            hue={PARTY_COLORS[p as PartySlug]?.bg ?? INK}
            fill={PARTY_COLORS[p as PartySlug]?.bg ?? '#efece5'}
            onClick={() => setParty(party === p ? 'all' : p)}
          />
        ))}
      </div>

      <div ref={ref} className="vid-rail" style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 8 }}>
        {shown.map((v) => (
          <button key={v.id} onClick={() => setOpen(v)} className="story-card vid-card" style={{ scrollSnapAlign: 'start', textAlign: 'left', background: '#fff', border: `1px solid ${BORDER}`, overflow: 'hidden', cursor: 'pointer', padding: 0, fontFamily: MANROPE }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play style={{ width: 22, height: 22, color: '#fff', marginLeft: 3 }} fill="#fff" />
                </span>
              </span>
              {v.electionRelevant && (
                <span style={{ position: 'absolute', top: 8, right: 8, display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 800, color: '#3a2c00', background: '#F6CE45', borderRadius: 999, padding: '2px 7px' }}>
                  <Vote style={{ width: 10, height: 10 }} /> ELECTION
                </span>
              )}
            </div>
            <div className="vid-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                {/* The outlet is load-bearing on an interview card, not decoration:
                    the viewer is watching a politician answer questions, and who
                    chose the questions is part of what they are judging. Naming
                    it is the whole disclosure — an earlier "IND" badge tried to
                    say more than that and could not survive a tier holding both
                    Q+A and a two-person podcast. */}
                <span className="vid-src" style={{ fontWeight: 800, color: SECONDARY, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.source}</span>
                {v.pubDate && <span className="vid-date" style={{ fontWeight: 600, color: TERTIARY }}>{fmtDate(v.pubDate)}</span>}
              </div>
              {/* A FIXED two lines. The rail is a flex row, so a card whose
                  title runs to one line used to sit shorter than the card
                  beside it and the row's baseline ragged (§2.14). */}
              <div className="vid-title" style={{ fontWeight: 700, color: INK, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.title}</div>
              {v.parties.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                  {v.parties.map((p) => (
                    <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, color: SECONDARY, background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: 999, padding: '2px 7px' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: PARTY_COLORS[p as PartySlug]?.bg ?? TERTIARY }} />
                      {PARTY_NAMES[p as PartySlug]?.short ?? p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* pop-up player */}
      {open && (
        <div onClick={() => setOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(900px, 96vw)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
              <div style={{ color: '#fff', fontFamily: MANROPE, fontSize: 14.5, fontWeight: 700, lineHeight: 1.3 }}>{open.title} <span style={{ color: 'rgba(255,255,255,.6)', fontWeight: 500 }}>· {open.source}</span></div>
              <button onClick={() => setOpen(null)} aria-label="Close" style={{ flexShrink: 0, width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.15)', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><X style={{ width: 18, height: 18 }} /></button>
            </div>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000', borderRadius: 12, overflow: 'hidden' }}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${open.videoId}?autoplay=1&rel=0`}
                title={open.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              />
            </div>
            <a href={`https://www.youtube.com/watch?v=${open.videoId}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 10, fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.75)', fontFamily: MANROPE, textDecoration: 'none' }}>Watch on YouTube ↗</a>
          </div>
        </div>
      )}
    </section>
  )
}

/** §3.1: the button is the 44px hit area, the span is the 32px control. The
 *  pad is vertical ONLY, taken straight back off as margin — padding all four
 *  sides makes the invisible box overhang its row horizontally, which is how a
 *  hit area makes a container scrollable (§5.13). */
function Arrow({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{ display: 'inline-flex', padding: '6px 0', margin: '-6px 0', background: 'none', border: 'none', cursor: 'pointer', minHeight: 0 }}
    >
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32, borderRadius: 999,
        border: `1px solid ${BORDER}`, background: '#fff', color: INK,
      }}>{children}</span>
    </button>
  )
}

/** §2.2 pill in the §3.1 wrapper. A party pill takes the party's own colour
 *  (ballot-bills.tsx:163): 2px party border always, party fill when lit, the
 *  count inside at .75 opacity. */
function FChip({ label, count, active, hue, fill, onClick }: {
  label: string
  count: number
  active: boolean
  hue: string
  fill: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{ display: 'inline-flex', padding: '8px 0', margin: '-8px 0', background: 'none', border: 'none', cursor: 'pointer' }}
    >
      <span
        className="status-pill"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999,
          background: active ? fill : '#fff',
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

/* THE DESKTOP RULE, on a rail (§2.14, §5.19). The card was `flex: 0 0 286px`
   inline, which is 85% of a 375px phone for ONE card, and still 286px in a
   1008px desktop column: a phone card in a row of three with the page's
   margins doing the rest. A flex-basis of clamp(240px, (100% - 28px) / 3,
   380px) is measured against the rail itself, so the card GROWS with its
   container to three whole cards at 1008px and falls back to a readable 240px
   in a narrow one, with no breakpoint needed for the width at all.

   The type and padding step up at 768 the way the tile grids do, and the title
   reserve is restated there, because two lines of 15px is 41px where two lines
   of 13.5px was 37.

   Sizes are in a class rather than inline for §2.15's second reason too:
   globals.css rewrites an inline font-size:11px to 12.5px on a phone, so a
   height computed from an inline label is wrong on the device it was computed
   for. */
const VID_CSS = `
.vid-card {
  /* Longhands, not the flex shorthand: a clamp()/calc() flex-basis inside the
     shorthand is the kind of value an older parser drops on the floor, taking
     flex-grow and flex-shrink with it. */
  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: clamp(240px, calc((100% - 28px) / 3), 380px);
  border-radius: 14px;
}
.vid-body { padding: 11px 13px; }
.vid-src, .vid-date { font-size: 11px; }
.vid-title {
  height: 37px; font-size: 13.5px; line-height: 1.35;
}
@media (min-width: 768px) {
  .vid-card { border-radius: 16px; }
  .vid-body { padding: 13px 15px; }
  .vid-src, .vid-date { font-size: 12px; }
  .vid-title { height: 41px; font-size: 15px; }
}
@media (max-width: 767px) {
  /* §2.2's lesson: take the space between the pills before the size of them.
     Scoped to this row, never to the shared .status-pill rule. */
  .vid-pills { gap: 5px !important; }
  .vid-pills .status-pill { padding: 5px 8px !important; font-size: 12px !important; white-space: nowrap; }
  .vid-pills .status-pill span { font-size: 10.5px !important; }
}
`
