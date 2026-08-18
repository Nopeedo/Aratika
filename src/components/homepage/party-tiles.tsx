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

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Armchair } from 'lucide-react'
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
                  aria-label={p.name + ' — show snapshot'}
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

    </>
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
