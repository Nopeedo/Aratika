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
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Armchair, Landmark, Newspaper, PlayCircle } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { usePartyCycle } from '@/components/homepage/party-cycle'
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
   *  filters — see lib/bills/member-party.ts. */
  bills: { total: number; government: number; members: number; other: number; passed: number }
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
      if (max > 0) setTabWidth(Math.ceil(max) + 32) // + the tab's own 16px/side padding
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
            style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-.01em', fontFamily: MANROPE, whiteSpace: 'nowrap' }}
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
              padding: '8px 16px', boxShadow: '0 -4px 10px rgba(0,0,0,.15)',
              opacity: cardVisible ? 0 : 1,
              transition: 'background-color .3s ease-in-out, opacity .3s ease-in-out',
            }}>
              <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-.01em', color: '#fff', fontFamily: MANROPE, lineHeight: 1.25 }}>{cur.name}</span>
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

      {/* Seats in Parliament — its own standalone row, between the identity card and
          the "Where they stand" box, instead of stacked inside that box. */}
      {cur && (
        <section style={{ background: 'transparent' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 clamp(18px, 5vw, 36px) 32px' }}>
            <div style={{ opacity: fading ? 0 : 1, transition: `opacity ${fadeMs}ms ease-in-out` }}>
              <SeatsRow p={cur} />
            </div>
          </div>
        </section>
      )}

      {/* What they have put before the House, and the way into the tracker
          filtered to them. */}
      {cur && (
        <section style={{ background: 'transparent' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 clamp(18px, 5vw, 36px) 32px' }}>
            <div style={{ opacity: fading ? 0 : 1, transition: `opacity ${fadeMs}ms ease-in-out` }}>
              <BillsRow p={cur} />
            </div>
          </div>
        </section>
      )}

    </>
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
  const p = parties.find((x) => x.slug === panelSlug) || null
  if (!p) return null

  const nothing = p.news.length === 0 && p.videos.length === 0
  const items = [
    ...p.videos.map((v) => ({ kind: 'video' as const, v })),
    ...p.news.map((n) => ({ kind: 'news' as const, n })),
  ]

  return (
    <section style={{ background: 'transparent' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 clamp(18px, 5vw, 36px) 56px' }}>
        <div style={{ opacity: fading ? 0 : 1, transition: `opacity ${fadeMs}ms ease-in-out` }}>
          <div style={{ marginBottom: 6, fontSize: 12.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: MUTE, fontFamily: MANROPE }}>
            In the news
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
            {/* Names the party. In the tile panel the surrounding card said whose
                coverage this was; standing on its own between two other sections
                it has to say so itself. */}
            <h2 style={{ fontSize: 'clamp(24px,3.6vw,31px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: 0 }}>
              What&rsquo;s being reported on <span style={{ color: seatColor(p.color) }}>{p.name}</span>
            </h2>
            <Link href="/news" style={{ fontSize: 14, fontWeight: 800, color: seatColor(p.color), textDecoration: 'none', fontFamily: MANROPE }}>
              All coverage &rarr;
            </Link>
          </div>

          {nothing ? (
            <p style={{ fontSize: 15, color: SUB, fontFamily: MANROPE, margin: 0, lineHeight: 1.6, maxWidth: 620 }}>
              Nothing naming {p.name} in the outlets we track right now. This fills in on its own as they report.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 12 }}>
              {items.map((it) => it.kind === 'video' ? (
                <a key={it.v.id} href={`https://www.youtube.com/watch?v=${it.v.videoId}`} target="_blank" rel="noopener noreferrer" style={rowStyle}>
                  <span style={{ position: 'relative', width: 58, height: 42, borderRadius: 8, flexShrink: 0, overflow: 'hidden', background: '#000', display: 'block' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.v.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <PlayCircle style={{ position: 'absolute', inset: 0, margin: 'auto', width: 18, height: 18, color: '#fff' }} />
                  </span>
                  <Meta source={it.v.source} date={it.v.pubDate} title={it.v.title} />
                </a>
              ) : (
                <a key={it.n.id} href={it.n.link} target="_blank" rel="noopener noreferrer" style={rowStyle}>
                  <span style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
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
        </div>
      </div>
    </section>
  )
}

function Meta({ source, date, title }: { source: string; date: string | null; title: string }) {
  return (
    <span style={{ flex: 1, minWidth: 0 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: SUB, fontFamily: MANROPE }}>{source}</span>
        {date && <span style={{ fontSize: 11.5, color: MUTE, fontFamily: MANROPE }}>· {fmtDate(date)}</span>}
      </span>
      <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.4 }}>{title}</span>
    </span>
  )
}

const rowStyle: React.CSSProperties = {
  display: 'flex', gap: 12, alignItems: 'center', textDecoration: 'none',
  border: `1px solid ${LINE}`, borderRadius: 12, padding: '10px 12px', background: '#fff',
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
      <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: SUB, fontFamily: MANROPE, marginBottom: 10 }}>
        Bills before the House
      </div>

      {none ? (
        <p style={{ fontSize: 15, fontWeight: 600, color: INK, fontFamily: MANROPE, margin: '0 0 8px', lineHeight: 1.5 }}>
          No bills of {p.name}&rsquo;s before the House this term.
        </p>
      ) : (
        <>
          {/* These three are categories of the same total, so they add up to the
              count the tracker shows on arrival. "Now law" cuts across all three
              and is stated in words below rather than sitting among them as if
              it were a fourth category. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 26, marginBottom: 10 }}>
            {p.governing && (
              <Stat n={b.government} label="Government bills" sub="led by their ministers" accent={accent} />
            )}
            <Stat n={b.members} label={<>Members&rsquo; bills</>} sub="by their backbench MPs" accent={accent} />
            {b.other > 0 && (
              <Stat n={b.other} label="Local &amp; private" sub="narrow, one-off bills" accent={accent} />
            )}
          </div>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: INK, fontFamily: MANROPE, margin: '0 0 8px' }}>
            {b.passed === 0
              ? 'None have passed into law yet.'
              : `${b.passed} of the ${b.total} ${b.passed === 1 ? 'is' : 'are'} now law.`}
          </p>
        </>
      )}

      {/* The point of the whole block. Without this, "National 203" against
          "Te Pāti Māori 0" reads as a scoreboard. */}
      <p style={{ fontSize: 13.5, color: SUB, fontFamily: MANROPE, margin: '0 0 12px', lineHeight: 1.55, maxWidth: 620 }}>
        {p.governing ? (
          <>
            Government bills are the coalition&rsquo;s programme, counted here by the party of the minister in charge
            rather than belonging to that party alone.
          </>
        ) : (
          <>
            Only ministers introduce government bills, so a party in opposition has none. Their MPs enter the
            members&rsquo; ballot instead, which is drawn at random.
          </>
        )}
      </p>

      <Link
        href={none ? '/bills' : `/bills?party=${p.slug}`}
        style={{ fontSize: 14, fontWeight: 800, color: p.color, textDecoration: 'none', fontFamily: MANROPE }}
      >
        {none ? 'Browse all bills' : `See ${p.name}’s ${b.total} bills`} &rarr;
      </Link>
    </div>
  )
}

function Stat({ n, label, sub, accent }: { n: number; label: React.ReactNode; sub: string; accent: string }) {
  return (
    <div>
      <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1, color: accent, fontFamily: MANROPE }}>{n}</div>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: INK, fontFamily: MANROPE, marginTop: 5 }}>{label}</div>
      <div style={{ fontSize: 12.5, color: SUB, fontFamily: MANROPE, marginTop: 1 }}>{sub}</div>
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
        {/* Overlap the discs only when both are real photos — matches the party
            tile elsewhere. Faces sit mid-frame so a 10px bite is invisible,
            whereas initials run edge to edge and would get clipped. */}
        <span style={{ display: 'flex', flexShrink: 0 }}>
          <Avatar name={p.leader} party={p.slug} src={p.leaderPhoto} size="md" face />
          {p.coLeader && (
            <span style={{ marginLeft: p.leaderPhoto && p.coLeaderPhoto ? -10 : 4, borderRadius: '50%', boxShadow: '0 0 0 2px #fff' }}>
              <Avatar name={p.coLeader} party={p.slug} src={p.coLeaderPhoto} size="md" face />
            </span>
          )}
        </span>
        <span style={{ textAlign: 'left' }}>
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
          <div style={{ fontSize: 12.5, fontWeight: 600, color: SUB, marginTop: 1, fontFamily: MANROPE }}>
            {p.coLeader ? 'Co-leaders' : p.leaderTitle}
          </div>
        </span>
      </div>
    </div>
  )
}

/** Seats in Parliament — its own standalone row, above the "Where they stand" box. */
function SeatsRow({ p }: { p: TileParty }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <Armchair style={{ width: 64, height: 64, marginLeft: 10, color: seatColor(p.color) }} strokeWidth={2} aria-hidden />
      <span style={{ fontSize: 72, fontWeight: 800, lineHeight: 1, color: seatColor(p.color), fontFamily: MANROPE }}>{p.seats}</span>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', textAlign: 'left' }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: SUB, textTransform: 'uppercase', letterSpacing: '.02em', lineHeight: 1.15, fontFamily: MANROPE }}>Seats in</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: SUB, textTransform: 'uppercase', letterSpacing: '.02em', lineHeight: 1.15, fontFamily: MANROPE }}>Parliament</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#5b3d2a', marginTop: 4, fontFamily: MANROPE }}>As of 2023 election</span>
      </div>
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
          {p.positions.length} of {p.topicsTotal} policy topics captured so far — more being added.
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
