'use client'

/**
 * PartyTiles — a row of party-coloured SQUARE tiles (one per parliamentary party,
 * untitled, colour only). Tapping a tile expands a factual snapshot panel BENEATH
 * the row (the tiles never move): seats, party leader, and every VERIFIED policy
 * stance for that party (sourced, neutral — from the approved positions pipeline).
 * Same layout for every party; only the colour theme changes. One panel open at a
 * time. Facts only — no vote share, no characterising language. Data is assembled
 * server-side (see party-tiles-section.tsx) so heavy datasets stay off the client.
 */

import * as React from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Landmark, Newspaper, PlayCircle, ScrollText } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { usePartyCycle } from '@/components/homepage/party-cycle'
import { BASELINE_ELECTION } from '@/constants/elections-data'
import { PARTY_NAMES } from '@/constants/parties'
import { BillsInfoButton } from '@/components/homepage/bills-info-button'
import { SignLink } from '@/components/homepage/compare-sign-link'
import { VideoLightbox, type PlayingVideo } from '@/components/homepage/video-lightbox'
import type { PartySlug } from '@/types'
import { INK, MANROPE } from '@/constants/theme'

export interface TilePosition { topic: string; label: string; stance: string; sourceUrl: string | null; href: string; fromProfile?: boolean }
export interface TileParty {
  slug: PartySlug
  name: string
  color: string
  light: string
  textColor: string
  leader: string
  leaderTitle: string
  leaderPhoto?: string
  leaderHref: string | null
  /** Green and Te Pāti Māori have co-leaders. Neither is "the" leader, so both
   *  are shown side by side rather than one being promoted over the other. */
  coLeader?: string
  coLeaderPhoto?: string
  coLeaderHref?: string | null
  role: string
  governing: boolean
  /** Bills before the House this term, counted from the same dataset /bills
   *  filters — see lib/bills/member-party.ts. `ballot` is separate: members'
   *  bills this party's MPs have lodged and that are waiting on the draw, so
   *  they are NOT before the House and are not in `total`. */
  bills: { total: number; government: number; members: number; other: number; passed: number; ballot: number }
  /** Recent coverage naming this party, from the same ingest as /news. Fetched
   *  server-side for all six — see party-tiles-section.tsx. */
  news: { id: string; title: string; outlet: string; kind: string; link: string; pubDate: string | null }[]
  videos: { id: string; title: string; videoId: string; source: string; thumbnail: string; pubDate: string | null }[]
  seats: number
  electorateSeats: number
  listSeats: number
  founded: number
  website: string
  profileHref: string
  positions: TilePosition[]
  topicsTotal: number
}

const SUB = '#6b5f54', MUTE = '#a99d8f', LINE = '#ece8e1'

/** hex → rgba string, for the party-coloured tile-row backing. */
function rgba(hex: string, a: number): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

/** Darken party colours that are too light (e.g. ACT's yellow) so the seat
 *  number/icon stays legible on the pale panel. Dark colours pass through. */
function seatColor(hex: string): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  if (lum < 0.6) return hex
  const f = 0.58
  const d = (v: number) => Math.round(v * f).toString(16).padStart(2, '0')
  return `#${d(r)}${d(g)}${d(b)}`
}

export function PartyTiles({ parties }: { parties: TileParty[] }) {
  // Active party + fade come from the shared PartyCycle clock (synced with the hero accent).
  const { panelSlug, fading, fadeMs, select } = usePartyCycle()
  const cur = parties.find((p) => p.slug === panelSlug) || null

  // Measure the tile row's own height (it varies with viewport width, since the
  // tiles are square) so the identity card above it can sit flush against it —
  // both are fixed to the bottom of the screen now, always, at every scroll position.
  const tileRowRef = useRef<HTMLDivElement>(null)
  const [tileRowHeight, setTileRowHeight] = useState(0)
  useEffect(() => {
    const el = tileRowRef.current
    if (!el) return
    const measure = () => setTileRowHeight(el.offsetHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Measure every party name (off-screen, same font as the tab) so the title tab
  // can be a single fixed width — sized to the longest name ("Te Pāti Māori") —
  // instead of resizing per party. Shorter names right-align within that width.
  const nameMeasureRefs = useRef<Record<string, HTMLSpanElement | null>>({})
  const [tabWidth, setTabWidth] = useState<number | null>(null)
  useEffect(() => {
    const measure = () => {
      const widths = parties.map((p) => nameMeasureRefs.current[p.slug]?.getBoundingClientRect().width ?? 0)
      const max = Math.max(...widths, 0)
      if (max > 0) setTabWidth(Math.ceil(max) + 36) // + the tab's own 18px/side padding
    }
    measure()
    document.fonts?.ready?.then(measure)
  }, [parties])

  // The title tab is redundant while the big in-page identity card (name + leader)
  // is on screen, so it stays hidden until that card scrolls behind the sticky
  // navbar (64px) at the top — then it fades in as a reminder of which party is
  // selected, and hides again once scrolling back up brings the card back below
  // the navbar. A direct scroll-position check (rAF-throttled) instead of
  // IntersectionObserver — the observer version was prone to getting stuck out
  // of sync with the actual scroll position.
  const identityCardRef = useRef<HTMLDivElement>(null)
  const [cardVisible, setCardVisible] = useState(true)
  useEffect(() => {
    let raf = 0
    const check = () => {
      raf = 0
      const el = identityCardRef.current
      if (!el) return
      setCardVisible(el.getBoundingClientRect().top >= 64)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check)
    }
    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      {/* Hidden measuring rack — one span per party name, same font/weight/size as
          the tab, used only to compute the fixed tab width above. */}
      <div aria-hidden style={{ position: 'absolute', visibility: 'hidden', height: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {parties.map((p) => (
          <span
            key={p.slug}
            ref={(el) => { nameMeasureRefs.current[p.slug] = el }}
            // Must match the tab's own type exactly, or the measured width
            // is wrong and the longest name clips.
            style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.01em', fontFamily: MANROPE, whiteSpace: 'nowrap' }}
          >
            {p.name}
          </span>
        ))}
      </div>

      {/* Title tab — its own small container that sits ABOVE the tile row, indented
          outward like a filing tab attached to the bar below it. Always one flat line
          (nowrap — never stacks/wraps, even for "Te Pāti Māori"). Fixed in place at
          the rightmost tile's slot (Te Pāti Māori's position) always — it does NOT
          glide to track the selected tile, only its label/colour change. Fixed width
          (sized to the longest party name) so it never resizes as parties change;
          shorter names just right-align within that same width. */}
      {cur && (
        <section style={{ background: 'transparent', position: 'fixed', left: 0, right: 0, bottom: tileRowHeight, zIndex: 44, pointerEvents: 'none' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 clamp(18px, 5vw, 36px)', position: 'relative', height: 0 }}>
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: tabWidth ?? undefined, textAlign: 'center', boxSizing: 'border-box',
              whiteSpace: 'nowrap', background: cur.color, borderRadius: '10px 10px 0 0',
              padding: '9px 18px', boxShadow: '0 -4px 10px rgba(0,0,0,.15)',
              opacity: cardVisible ? 0 : 1,
              transition: 'background-color .3s ease-in-out, opacity .3s ease-in-out',
            }}>
              <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.01em', color: '#fff', fontFamily: MANROPE, lineHeight: 1.25 }}>{cur.name}</span>
            </div>
          </div>
        </section>
      )}

      {/* THE reference point: the full-size tile row, fixed to the bottom edge of the
          screen ALWAYS — not just once scrolled — so it's reachable one-handed at any
          scroll position. Back to its original height/padding now that the title tab
          lives in its own container above instead of inside this bar. */}
      <div ref={tileRowRef} style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 45,
        background: '#fff', borderTop: `1px solid ${LINE}`, boxShadow: '0 -6px 16px rgba(12,14,18,.08)',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '12px clamp(18px, 5vw, 36px)' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {parties.map((p) => {
              const on = p.slug === panelSlug
              return (
                <button
                  key={p.slug}
                  onClick={() => select(on ? null : p.slug)}
                  aria-label={p.name + ': show snapshot'}
                  aria-expanded={on}
                  title={p.name}
                  style={{
                    flex: '1 1 0', minWidth: 0, aspectRatio: '1 / 1', borderRadius: 14, padding: 0,
                    cursor: 'pointer', background: p.color, pointerEvents: 'auto',
                    // Selected tile gets a white-then-colour ring so it reads as one
                    // continuous shape with the title tab sitting above it.
                    border: on ? '3px solid #fff' : 'none',
                    boxShadow: on
                      ? `0 0 0 4px ${p.color}, 0 16px 30px rgba(0,0,0,.34)`
                      : '0 10px 24px rgba(0,0,0,.24)',
                    transition: 'box-shadow .35s ease',
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* In-flow identity card — name + leader, in normal document flow, right above
          the seats row. Separate from the fixed dock/tab at the bottom. A thin
          sentinel sits right at its top edge (not the whole box) so the tab fades
          in the instant the NAME crosses behind the navbar, not once the entire
          card has scrolled away. */}
      {cur && (
        <section style={{ background: 'transparent' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '4px clamp(18px, 5vw, 36px) 32px' }}>
            <div ref={identityCardRef} aria-hidden style={{ height: 1 }} />
            <div style={{
              border: `4px solid ${cur.color}`, borderRadius: 16, background: cur.light,
              padding: '20px 22px',
              transition: 'border-color .25s ease-in-out, background-color .25s ease-in-out',
            }}>
              <div style={{ opacity: fading ? 0 : 1, transition: `opacity ${fadeMs}ms ease-in-out` }}>
                <PanelHeader p={cur} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Seats in Parliament and Bills before the House used to render here too.
          Both now live in their own sections below "What does {party} stand
          for?" — see PartySeatsSummary and PartyBillsSummary. */}

    </>
  )
}

/** Seats in Parliament for the selected party, as its own homepage section.
 *  Placed after the "Compare every party" sign under the policy section, ahead
 *  of the bills — same shape as PartyBillsSummary, following the tile selection
 *  through the shared party cycle and crossfading on its clock. */
export function PartySeatsSummary({ parties }: { parties: TileParty[] }) {
  const { panelSlug, fading, fadeMs } = usePartyCycle()
  const p = parties.find((x) => x.slug === panelSlug) || null
  if (!p) return null

  return (
    <section style={{ background: 'transparent' }}>
      {/* 10px, not 32, at the foot: the MP list that follows opens with "Tap
          an MP", which belongs to the seat count above it — a section-sized
          gap between them read as a break between two unrelated things. */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 clamp(18px, 5vw, 36px) 10px' }}>
        <div style={{ opacity: fading ? 0 : 1, transition: `opacity ${fadeMs}ms ease-in-out` }}>
          <SeatsRow p={p} />
        </div>
      </div>
    </section>
  )
}

/** Bills before the House for the selected party, as its own homepage section.
 *  Placed after "What does {party} stand for?" rather than inside the tile
 *  block — same shape as PartyNewsSummary, following the tile selection through
 *  the shared party cycle and crossfading on its clock. */
export function PartyBillsSummary({ parties }: { parties: TileParty[] }) {
  const { panelSlug, fading, fadeMs } = usePartyCycle()
  const p = parties.find((x) => x.slug === panelSlug) || null
  if (!p) return null

  return (
    <section style={{ background: 'transparent' }}>
      {/* Clear air above the heading: this is a new block after the MP list,
          and the space is what says so. Added from this side because the
          margin under that list belongs to another component. */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px clamp(18px, 5vw, 36px) 32px' }}>
        <div style={{ opacity: fading ? 0 : 1, transition: `opacity ${fadeMs}ms ease-in-out` }}>
          <BillsRow p={p} />
        </div>
      </div>
    </section>
  )
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

/**
 * PartyNewsSummary — news and video naming the selected party, as its own
 * homepage section.
 *
 * Reads the same party-cycle selection the tiles set, so it changes with the
 * tile without needing a control of its own. It lives between "This term" and
 * the find-your-MP button rather than inside the tile panel, which is why it
 * carries the party's name in its heading: inside the panel the surrounding
 * card said whose coverage it was, and standing on its own it has to say so.
 *
 * Nothing here is written or curated for the homepage. It is a filtered view of
 * the same ingest that feeds /news and the battleground pages, and every row
 * links out to the outlet that published it.
 *
 * A party's own releases and its own channel output are tagged to it by the
 * ingest, so they appear alongside media coverage. That is why each row names
 * its outlet: a Beehive release and an RNZ piece are both legitimate here, and
 * a reader is entitled to see which is which before they click.
 *
 * The empty state is honest rather than hidden. A quiet week for a minor party
 * is the normal case, and saying so beats the section disappearing, which would
 * imply we looked and found nothing worth showing.
 */
export function PartyNewsSummary({ parties }: { parties: TileParty[] }) {
  const { panelSlug, fading, fadeMs } = usePartyCycle()
  // The clip playing over the page, if any. Held here rather than per-row so
  // only one can be open, and so it survives the row list re-rendering.
  const [playing, setPlaying] = useState<PlayingVideo | null>(null)
  const p = parties.find((x) => x.slug === panelSlug) || null
  if (!p) return null

  const nothing = p.news.length === 0 && p.videos.length === 0
  const items = [
    ...p.videos.map((v) => ({ kind: 'video' as const, v })),
    ...p.news.map((n) => ({ kind: 'news' as const, n })),
  ]

  return (
    <section style={{ background: 'transparent' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 clamp(18px, 5vw, 36px) 40px' }}>
        <div style={{ opacity: fading ? 0 : 1, transition: `opacity ${fadeMs}ms ease-in-out` }}>
          <div style={{ marginBottom: 6, fontSize: 12.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: MUTE, fontFamily: MANROPE }}>
            Latest in media
          </div>
          <div style={{ marginBottom: 14 }}>
            {/* Names the party. In the tile panel the surrounding card said whose
                coverage this was; standing on its own between two other sections
                it has to say so itself. */}
            {/* Two lines reserved. "…on Te Pāti Māori" wraps on a phone where
                "…on ACT" does not, which changed the page height every time the
                cycle turned. */}
            <h2 style={{ fontSize: 'clamp(28px,5.5vw,32px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.2, minHeight: '2.4em' }}>
              What&rsquo;s being reported on <span style={{ color: seatColor(p.color) }}>{p.name}</span>
            </h2>
          </div>

          {nothing ? (
            <p style={{ fontSize: 15, color: SUB, fontFamily: MANROPE, margin: 0, lineHeight: 1.6, maxWidth: 620 }}>
              Nothing naming {p.name} in the outlets we track right now. This fills in on its own as they report.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 7 }}>
              {items.map((it) => it.kind === 'video' ? (
                // A clip plays HERE, over the page, instead of handing the
                // reader to YouTube — a button, not a link, so it can't be
                // caught by the new-tab handler. Clips that refuse to embed
                // fall back to a new tab from inside the panel.
                <button key={it.v.id} type="button" onClick={() => setPlaying({ videoId: it.v.videoId, title: it.v.title, source: it.v.source })} style={{ ...rowStyle, width: '100%', textAlign: 'left', cursor: 'pointer', font: 'inherit' }}>
                  <span style={{ position: 'relative', width: 52, height: 38, borderRadius: 7, flexShrink: 0, overflow: 'hidden', background: '#000', display: 'block' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.v.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <PlayCircle style={{ position: 'absolute', inset: 0, margin: 'auto', width: 18, height: 18, color: '#fff' }} />
                  </span>
                  <Meta source={it.v.source} date={it.v.pubDate} title={it.v.title} />
                </button>
              ) : (
                <a key={it.n.id} href={it.n.link} target="_blank" rel="noopener noreferrer" style={rowStyle}>
                  <span style={{
                    width: 30, height: 30, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: it.n.kind === 'government' ? '#fff7e6' : '#eef4ff',
                  }}>
                    {it.n.kind === 'government'
                      ? <Landmark style={{ width: 15, height: 15, color: '#b4810b' }} />
                      : <Newspaper style={{ width: 15, height: 15, color: '#5b7cc4' }} />}
                  </span>
                  <Meta source={it.n.outlet} date={it.n.pubDate} title={it.n.title} />
                </a>
              ))}
            </div>
          )}

          {/* Leaves this section the way the others leave theirs: a
              party-coloured signpost, under the list rather than beside the
              heading. */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 16 }}>
            <SignLink href="/news" icon={<Newspaper style={{ width: 15, height: 15, flexShrink: 0 }} />}>
              All coverage
            </SignLink>
          </div>
        </div>
      </div>

      {playing && (
        <VideoLightbox video={playing} accent={seatColor(p.color)} onClose={() => setPlaying(null)} />
      )}
    </section>
  )
}

function Meta({ source, date, title }: { source: string; date: string | null; title: string }) {
  return (
    <span style={{ flex: 1, minWidth: 0 }}>
      {/* One line, always. Outlet names run from "Stuff" to
          "NZ Herald — Herald NOW / Ryan Bridge"; the long ones wrapped on a
          phone, making that card taller and the page length change every time
          the tile cycle turned. The date must stay visible, so the outlet is
          what gives way. */}
      <span style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2, minWidth: 0 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: SUB, fontFamily: MANROPE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{source}</span>
        {date && <span style={{ fontSize: 11.5, color: MUTE, fontFamily: MANROPE, whiteSpace: 'nowrap', flexShrink: 0 }}>· {fmtDate(date)}</span>}
      </span>
      {/* Clamped to two lines. A headline that wrapped to three made its card
          taller, the grid row taller, and the whole page below shift as the
          tile cycle turned. Two lines is enough to identify a story, and the
          full headline is on the other side of the link. */}
      <span style={{
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        fontSize: 13.5, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.35, minHeight: '2.7em',
      }}>{title}</span>
    </span>
  )
}

// Compact by design: these are a scan list, not a set of cards to dwell on.
const rowStyle: React.CSSProperties = {
  display: 'flex', gap: 10, alignItems: 'center', textDecoration: 'none',
  border: `1px solid ${LINE}`, borderRadius: 10, padding: '7px 10px', background: '#fff',
}

/**
 * BillsRow — this party's bills before the House, and a link into the tracker
 * filtered to them.
 *
 * ⚠ The reason this is not just a number.
 *
 * Counted raw, the totals are National 203, ACT 39, NZ First 12, Labour 14,
 * Green 4, Te Pāti Māori 0. Put a bare "203" against a bare "0" on a tile and
 * the page has said the Greens and Te Pāti Māori do nothing — which is not what
 * the data means. Only ministers introduce government bills, so an opposition
 * party cannot have any; their route is the members' ballot, which is drawn at
 * random. The 0 is a role, not a record.
 *
 * So government and members' bills are always shown apart, never summed into a
 * headline figure, and the sentence under them says whose programme each is.
 * The same reasoning is written up in lib/parties/legislative-record.ts, which
 * frames the equivalent card on the party pages.
 */
function BillsRow({ p }: { p: TileParty }) {
  const b = p.bills
  const accent = seatColor(p.color)
  const none = b.total === 0

  return (
    <div>

      {/* Same shape for every party, including one with nothing to show.
          A party with no bills used to render a single sentence where the others
          rendered a stat row and a line under it — 87px shorter on a desktop and
          169px on a phone. The tile cycle turns every few seconds, so that
          difference moved the whole page under the reader, and the map further
          down would not sit still while it was being used. Te Pāti Māori now
          reads "0 Members' bills", which is the same fact stated the same way as
          everyone else's.

          The categories add up to the count the tracker shows on arrival. "Now
          law" cuts across all of them and is stated in words below rather than
          sitting among them as if it were a fourth category. */}
      {/* Three fixed columns, padded with blanks, rather than a wrapping flex row.
          A governing party has three categories and an opposition party one or
          two; on a phone that flex row wrapped to a different number of lines
          per party, which was the last 105px of page shift left after the empty
          state was squared away. A grid of three keeps one row for everyone, and
          the blanks are trailing so the real figures stay left-aligned. */}
      {/* No frame and no fill, by request: the figures sit straight on the
          page's ground the way the rest of the homepage does. The heading,
          the numbers and the "x of y are now law" line still group by
          proximity, which is what the box was doing for them. */}
      <div style={{
        padding: '4px 0 0', marginBottom: 12,
        textAlign: 'center',
      }}>
        {/* Heading inside the box now, in full black, with the (i) in the
            top-right corner carrying the process explanation that used to run
            as body copy underneath. */}
        {/* The heading no longer reserves 26px on the left to balance the (i):
            the longest party name needed that width more than the row needed
            to be symmetrical. */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 12 }}>
          {/* Names the party and says what it did, rather than "Bills before
              the House" — which is Parliament's own phrase for "currently in
              the system" and left the reader to work out whose bills these
              were. Everything counted below was introduced by this party's
              ministers or its MPs. "Introduced" rather than "drawn and
              introduced": only MEMBERS' bills come out of the ballot, and for
              a governing party most of this figure is government bills, which
              are never drawn — National's 216 is 198 ministerial. Introduced
              is the one word true of all three kinds. The ballot, and the
              drawing, is the line underneath. What that means for a GOVERNING party — that the
              government's programme is attributed to the minister's party
              rather than owned by it — is in the (i) beside this.

              Same size and spacing as "Seats in Parliament" above it: the two
              are peer blocks in one column, and at 13px against 20px this one
              read as a caption on the seats block rather than its own thing. */}
          <div style={{ flex: 1, minWidth: 0, fontSize: 20, fontWeight: 800, letterSpacing: 0, textTransform: 'uppercase', color: INK, fontFamily: MANROPE, textAlign: 'center', lineHeight: 1.15 }}>
            Bills introduced by {p.name}
          </div>
          <BillsInfoButton accent={accent} governing={!!p.governing} slug={p.slug} />
        </div>
        {/* ONE running total, at the scale of the seat count above it, rather
            than two or three columns of smaller figures. The heading names
            what is being counted, so the number does not need a label of its
            own; the split that was in those columns is the quiet line beneath,
            where it reads as detail about the total rather than as three
            separate scores. */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ScrollText style={{ width: 52, height: 52, color: accent, flexShrink: 0 }} strokeWidth={1.6} />
          <span style={{ fontSize: 72, fontWeight: 800, lineHeight: 1, color: accent, fontFamily: MANROPE, fontVariantNumeric: 'tabular-nums' }}>{b.total}</span>
        </div>
        {/* One line under the total, not three. The ministers/MPs split and
            the ballot and the passed count were each true and each on their
            own row, which is three lines of small print under a figure that
            has already made the point. What a reader wants next is how many
            of them became law and how many are still queued, so that is what
            is left; the breakdown by who introduced them is in the (i). */}
        <div style={{ fontSize: 14, fontWeight: 700, color: SUB, fontFamily: MANROPE, marginTop: 10, lineHeight: 1.4 }}>
          {[
            none ? null : b.passed === 0 ? 'none yet law' : `${b.passed} now law`,
            b.ballot > 0 ? `${b.ballot} waiting to be drawn` : null,
          ].filter(Boolean).join(' · ') || 'None before the House this term.'}
        </div>

        {/* The way out sits INSIDE the box now, and quietly: a small outlined
            chip rather than the filled signpost the policy and seats sections
            close with. Three solid party-coloured signs stacked down one page
            made each of them count for less, and this one is a footnote to
            the figures above it rather than the way out of a section. */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <Link
            href={none ? '/bills' : `/bills?party=${p.slug}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 10px', borderRadius: 999,
              border: `1.5px solid ${seatColor(accent)}`, color: seatColor(accent),
              background: 'transparent',
              fontSize: 11.5, fontWeight: 800, fontFamily: MANROPE,
              textDecoration: 'none', whiteSpace: 'nowrap',
              transition: 'border-color .25s ease-in-out, color .25s ease-in-out',
            }}
          >
            <ScrollText style={{ width: 12, height: 12, flexShrink: 0 }} />
            {none ? 'Browse all bills' : `See ${p.name}\u2019s ${b.total} bills`}
            <ArrowRight style={{ width: 13, height: 13, flexShrink: 0 }} strokeWidth={3} />
          </Link>
        </div>
      </div>
    </div>
  )
}


/** Summary of Party Stance — every VERIFIED policy stance, sourced, in its own
 *  card. Deliberately a SEPARATE component from <PartyTiles> so it can be placed
 *  further down the homepage (after "Where do the parties stand?") instead of
 *  immediately below the tiles — while still reading the same shared party-cycle
 *  selection, so it stays in sync with whichever party is currently picked. */
export function PartyStanceSummary({ parties }: { parties: TileParty[] }) {
  const { panelSlug, fading, fadeMs } = usePartyCycle()
  const cur = parties.find((p) => p.slug === panelSlug) || null
  if (!cur) return null
  return (
    <section id="party-stance" style={{ background: 'transparent' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 clamp(18px, 5vw, 36px) 40px' }}>
        {/* Fixed-size box: every party's stance is stacked in the SAME grid cell,
            so the card is always as tall as the party with the most content.
            Switching parties never changes its height, so the page never jumps.
            Only the active party is visible; the rest stay hidden but still hold
            the height open. */}
        <div style={{ border: `1.5px solid ${LINE}`, borderRadius: 16, background: '#fff', padding: '20px 22px', display: 'grid' }}>
          {parties.map((p) => {
            const active = p.slug === cur.slug
            return (
              <div
                key={p.slug}
                aria-hidden={!active}
                style={{
                  gridColumn: 1,
                  gridRow: 1,
                  // Fill the cell. The container is already as tall as the
                  // tallest party (that is what the stacking is for), but each
                  // panel was hugging its own content and sitting at the top —
                  // so the footer links landed 63px apart between the shortest
                  // party and the tallest, and moved under the cursor as the
                  // cycle turned. Clicking one was a moving target.
                  height: '100%',
                  opacity: active ? (fading ? 0 : 1) : 0,
                  visibility: active ? 'visible' : 'hidden',
                  pointerEvents: active ? 'auto' : 'none',
                  transition: `opacity ${fadeMs}ms ease-in-out`,
                }}
              >
                <PanelStance p={p} />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/** Identity card contents — party name + leader. Used by the in-flow card above
 *  the seats row. Seats lives outside in SeatsRow; policy stance detail lives
 *  in PanelStance (rendered by PartyStanceSummary). */
function PanelHeader({ p }: { p: TileParty }) {
  return (
    <div>
      <span style={{ display: 'block', fontSize: 'clamp(30px,6.4vw,56px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, lineHeight: 1.05 }}>{p.name}</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
        {/* Each photo sits in a solid white ring — a frame, so the disc reads as
            a portrait on the tinted card rather than a cut-out. Drawn as a
            box-shadow spread so it adds no layout width. Overlap the discs
            only when both are real photos — matches the party tile elsewhere.
            Faces sit mid-frame so a 10px bite is invisible, whereas initials
            run edge to edge and would get clipped; the ring on the second disc
            is what makes the overlap read as two people rather than a blob. */}
        <span style={{ display: 'flex', flexShrink: 0 }}>
          <span style={{ display: 'flex', borderRadius: '50%', boxShadow: '0 0 0 3px #fff' }}>
            <Avatar name={p.leader} party={p.slug} src={p.leaderPhoto} size="md" face />
          </span>
          {p.coLeader && (
            <span style={{ display: 'flex', marginLeft: p.leaderPhoto && p.coLeaderPhoto ? -10 : 6, borderRadius: '50%', boxShadow: '0 0 0 3px #fff' }}>
              <Avatar name={p.coLeader} party={p.slug} src={p.coLeaderPhoto} size="md" face />
            </span>
          )}
        </span>
        {/* Name and role as one tight pair, vertically centred against the
            photo. The height reservation lives on this BLOCK, not on the name:
            "Marama Davidson & Chlöe Swarbrick" wraps to two lines on a phone
            where "Christopher Luxon" does not, so the card used to grow by 17px
            whenever the cycle reached a co-led party and push the page down.
            Reserving the taller case keeps the card a fixed height at every
            width — but reserving it on the name alone left a blank line
            between a one-line name and its role. Reserving it here and
            centring the pair inside keeps the height and closes the gap.
            55px = two name lines (15px × 1.25 × 2) + the role line. */}
        <span style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left', minHeight: 55 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.25 }}>
            {p.leaderHref ? <Link href={p.leaderHref} style={{ color: INK, textDecoration: 'none' }}>{p.leader}</Link> : p.leader}
            {p.coLeader && (
              <>
                {' & '}
                {p.coLeaderHref ? <Link href={p.coLeaderHref} style={{ color: INK, textDecoration: 'none' }}>{p.coLeader}</Link> : p.coLeader}
              </>
            )}
          </div>
          {/* Pluralised, so a co-led party never reads as having one leader. */}
          <div style={{ fontSize: 12.5, fontWeight: 600, color: SUB, marginTop: 2, lineHeight: 1.3, fontFamily: MANROPE }}>
            {p.coLeader ? 'Co-leaders' : p.leaderTitle}
          </div>
        </span>
      </div>
    </div>
  )
}

/** Seats in Parliament — its own standalone row, above the "Where they stand" box. */
function SeatsRow({ p }: { p: TileParty }) {
  const res = BASELINE_ELECTION.results?.find((r) => r.party === p.slug)
  const votePct = res?.votePct
  // Who formed the government is recorded as a sentence ("National – ACT –
  // New Zealand First coalition"), so the parties are read back out of it by
  // name rather than kept as a second list that could drift from it.
  const govText = BASELINE_ELECTION.governmentFormed ?? ''
  const govParties = (['national', 'labour', 'green', 'act', 'nzfirst', 'tpm'] as const)
    .filter((slug) => govText.includes(PARTY_NAMES[slug].full) || govText.includes(PARTY_NAMES[slug].short))
  const inGovernment = govParties.includes(p.slug as typeof govParties[number])
  const govPartners = govParties.filter((slug) => slug !== p.slug).map((slug) => PARTY_NAMES[slug].short).join(' and ')
  const labelRef = useRef<HTMLSpanElement>(null)
  const lineRef = useRef<HTMLSpanElement>(null)

  // Width of "Seats in Parliament", so the lines under it can be held
  // NARROWER than the label — they are supporting detail and shouldn't
  // out-measure the thing they support. They wrap inside it instead.
  const [labelW, setLabelW] = useState<number | null>(null)

  /**
   * Measure "Seats in Parliament" so the lines under it can be held to its
   * width. They are supporting detail and shouldn't out-measure the thing
   * they support.
   *
   * This used to SCALE the vote line to that width, which is why switching
   * parties changed its size: the line ends in the party's name, so its
   * natural width swings from "ACT" to "Te Pāti Māori", and every one of
   * them was wider than the label — so the fit only ever shrank, never grew.
   * Green landed at 16.5px and Te Pāti Māori at 13.7px, and a reader tabbing
   * between tiles watched the same sentence resize under them. One readable
   * size that WRAPS inside the label's width says the same thing and holds
   * still.
   */
  useLayoutEffect(() => {
    const label = labelRef.current
    if (!label) return
    const fit = () => {
      const want = label.getBoundingClientRect().width
      if (want) setLabelW(want)
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [p.slug, p.name])

  // A centred column, not a row: the number sits in the chamber arch's
  // opening above it (ParliamentNow tucks it up there), so it has to be the
  // only thing on its line — hence no armchair beside it, and the label and
  // the party vote stacked underneath.
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      {/* The OFFICIAL COUNT, not the party profile's current seat total, so
          the three figures in this block agree: the profile has National on
          49 (the Port Waikato by-election in Nov 2023 added a seat) while the
          chamber above lights 48 and the split below reads 43 + 5. The
          heading says "as elected at the 2023 General Election", so the
          count is the number that belongs here. */}
      <span style={{ fontSize: 72, fontWeight: 800, lineHeight: 1, color: seatColor(p.color), fontFamily: MANROPE }}>{res?.seats ?? p.seats}</span>
      <span ref={labelRef} style={{ fontSize: 20, fontWeight: 800, color: INK, textTransform: 'uppercase', letterSpacing: '.02em', lineHeight: 1.15, marginTop: 6, whiteSpace: 'nowrap', fontFamily: MANROPE }}>Seats in Parliament</span>
      {/* What won those seats, rather than "as of 2023 election" — the date
          is already in the heading above. Phrased as a share of PEOPLE, not
          "of the party vote": that wording assumes the reader knows MMP has
          two votes, and the question it left them with was "11.6% of what?".
          Strictly it is the party vote; "voters chose" is accurate about who
          without making the reader learn the mechanism first. */}
      {votePct != null && (
        <span ref={lineRef} style={{ fontSize: 17, fontWeight: 800, color: seatColor(p.color), marginTop: 5, lineHeight: 1.3, maxWidth: labelW ?? undefined, textAlign: 'center', fontFamily: MANROPE }}>
          {/* The figure carries a white BRUSH underline: a filled stroke that
              swells in the middle and tapers at both ends, the way a loaded
              brush leaves the paper — not a hairline rule. */}
          <span style={{ position: 'relative', display: 'inline-block', whiteSpace: 'nowrap' }}>
            {votePct.toFixed(1)}%
            <svg
              aria-hidden
              viewBox="0 0 100 12"
              preserveAspectRatio="none"
              style={{ position: 'absolute', left: '-5%', width: '110%', bottom: '-0.34em', height: '0.44em', overflow: 'visible' }}
            >
              <path
                d="M1.6 8.4 C 20 5.0, 44 7.0, 64 5.0 C 78 3.6, 89 4.3, 98.6 3.0
                   C 97.4 5.0, 93 6.0, 86 6.6 C 74 7.6, 60 7.4, 44 9.0
                   C 30 10.4, 14 11.2, 2.2 10.2 Z"
                fill="#fff"
              />
            </svg>
          </span>
          {' '}of voters chose {p.name}
        </span>
      )}

      {/* How those seats were won, and where the party ended up. Both come
          from the official 2023 result and neither was anywhere on the site:
          the electorate/list split is the clearest illustration of MMP there
          is (Te Pāti Māori hold 6 seats on 3.1% because all six are
          electorates), and whether a party is IN government is the fact that
          frames everything else the reader is about to read about them. */}
      <div style={{ marginTop: 12, maxWidth: labelW ? labelW * 0.88 : undefined, fontSize: 14.5, fontWeight: 800, lineHeight: 1.35, fontFamily: MANROPE, color: INK }}>
        {/* Names the party and says what it DOES — "governs" rather than the
            static "in government" — so the line reads as a statement about
            them rather than a status label. */}
        {inGovernment
          ? <><span style={{ color: seatColor(p.color) }}>{p.name}</span> governs{govPartners ? <span style={{ fontWeight: 600, color: SUB }}> with {govPartners}</span> : null}</>
          : <><span style={{ color: seatColor(p.color) }}>{p.name}</span> is in opposition</>}
      </div>
      {/* The electorate-vs-list split was here ("2 won a local seat, 9 came
          off the party list"). Removed: it explains the MMP MECHANISM, and
          the reader's question at this point on the front page is who the
          parties are and what they stand for. The numbers are still in
          elections-data (electorateSeats / listSeats) if it earns a place on
          the Election Centre, where the mechanism is the subject. */}
    </div>
  )
}
/** Every VERIFIED policy stance, sourced — plus the footer links. Its own
 *  section below the (sticky) identity card, in normal document flow.
 *  Seats in Parliament lives outside, in its own standalone SeatsRow section. */
function PanelStance({ p }: { p: TileParty }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: p.color, fontFamily: MANROPE, marginBottom: 10 }}>Summary of Party Stance</div>
      <p style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: SUB, margin: '0 0 9px', fontFamily: MANROPE }}>Where they stand · in their words</p>
      {p.positions.map((pos, i) => (
        <div key={pos.topic} style={{ display: 'flex', gap: 10, padding: '9px 0', borderTop: i === 0 ? 'none' : `1px solid ${LINE}` }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: p.color, marginTop: 5, flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 800, width: 98, flexShrink: 0, color: INK, fontFamily: MANROPE }}>{pos.label}</span>
          <span style={{ fontSize: 15, fontWeight: 500, color: '#3f372f', lineHeight: 1.45, flex: 1, fontFamily: MANROPE }}>
            {pos.stance}{' '}
            {pos.fromProfile
              ? <Link href={pos.href} style={{ fontSize: 13, fontWeight: 700, fontStyle: 'italic', color: MUTE, whiteSpace: 'nowrap', textDecoration: 'none' }}>· stated priority</Link>
              : pos.sourceUrl && <a href={pos.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 700, color: p.color, whiteSpace: 'nowrap', textDecoration: 'none' }}>· source ↗</a>}
          </span>
        </div>
      ))}
      {p.positions.length < p.topicsTotal && (
        <p style={{ fontSize: 13, color: MUTE, fontStyle: 'italic', margin: '10px 0 0', fontFamily: MANROPE }}>
          {p.positions.length} of {p.topicsTotal} policy topics captured so far, more being added.
        </p>
      )}

      {/* footer links — pinned to the bottom of the cell (marginTop:auto) so they
          sit in the same place for every party instead of following the length
          of that party's stance list. */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 'auto', paddingTop: 12, borderTop: `1px solid ${LINE}` }}>
        <Link href="/policies" style={{ fontSize: 14, fontWeight: 800, color: p.color, textDecoration: 'none', fontFamily: MANROPE }}>Compare topics →</Link>
        <Link href={p.profileHref} style={{ fontSize: 14, fontWeight: 800, color: p.color, textDecoration: 'none', fontFamily: MANROPE }}>Full profile →</Link>
        <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 800, color: p.color, textDecoration: 'none', fontFamily: MANROPE }}>Official website ↗</a>
      </div>
      <p style={{ fontSize: 13, color: MUTE, margin: '9px 0 0', fontFamily: MANROPE }}>
        Founded {p.founded}. Seats: NZ Parliament. Stances summarised from each party’s official policy pages.
      </p>
    </div>
  )
}
