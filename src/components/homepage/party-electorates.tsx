'use client'

/**
 * PartyElectorates — the selected party's whole caucus in one framed box:
 * the MPs who WON A SEAT first, then the ones who came off the party list.
 *
 * Two rails rather than one long list. A party can have forty-odd MPs, and a
 * stacked list of them would be most of a phone screen on its own, so each
 * group scrolls sideways inside the box with buttons to page through it.
 * The order carries the point: an electorate MP was voted in by a place, a
 * list MP was brought in by the party vote, and those are different things
 * worth seeing apart.
 *
 * Electorate MPs are ordered by 2023 winning margin, widest first — a
 * published fact rather than an editorial call, and it puts a party's safest
 * seats at the front. The margin itself is not shown: "+23,376" beside a name
 * read as a score in some points system.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { ArrowRight, ChevronDown, ChevronUp, MapPin } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { MP_PROFILES } from '@/constants/mps-data'
import { MPPreview } from '@/components/homepage/mp-preview'
import { usePartyCycle } from '@/components/homepage/party-cycle'
import { ELECTORATES, normalizeElectorateKey } from '@/constants/electorates-data'
import { PARTY_COLORS, PARTY_NAMES } from '@/constants/parties'
import type { PartySlug } from '@/types'
import { INK, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

/** Darken a pale party colour so it stays legible as text. */
function ink(hex: string): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  if (lum < 0.6) return hex
  const d = (v: number) => Math.round(v * 0.58).toString(16).padStart(2, '0')
  return `#${d(r)}${d(g)}${d(b)}`
}

/** The 2023 winning margin for an electorate, used only for ordering. */
function margin(electorate?: string): number {
  if (!electorate) return 0
  return ELECTORATES[normalizeElectorateKey(electorate)]?.majority ?? 0
}

interface Card { slug: string; name: string; photo?: string; sub: string }

/** Height of a column's scrolling row area. Fixed, so every party's box is
 *  the same size and the tile cycle can't move the page. Four rows at the
 *  44px row pitch, plus a few pixels so the fifth peeks. */
const ROWS_H = 188

/** The bare up/down chevron under a column — a tap target, not a button
 *  with chrome: the fade beside it is what says there is more. */
const chevron = (accent: string, disabled = false): CSSProperties => ({
  width: 24, height: 24, minWidth: 24, minHeight: 24, borderRadius: '50%', padding: 0,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 'none',
  color: disabled ? '#00000026' : accent,
  cursor: disabled ? 'default' : 'pointer',
  transition: 'color .15s ease',
})

export function PartyElectorates() {
  const { panelSlug } = usePartyCycle()
  // The MP whose preview is open, if any. Held here rather than per column so
  // only one can be open at a time.
  const [preview, setPreview] = useState<string | null>(null)
  const slug = panelSlug as PartySlug | null
  const colors = slug ? PARTY_COLORS[slug] : null
  const names = slug ? PARTY_NAMES[slug] : null

  const caucus = slug
    ? Object.values(MP_PROFILES).filter((mp) => mp.party === slug && mp.status === 'active')
    : []
  const seated: Card[] = caucus
    .filter((mp) => mp.role === 'electorate')
    .sort((a, b) => margin(b.electorate) - margin(a.electorate))
    .map((mp) => ({ slug: mp.slug, name: mp.name, photo: mp.photo, sub: mp.electorate ?? 'Electorate' }))
  const listed: Card[] = caucus
    .filter((mp) => mp.role === 'list')
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((mp) => ({ slug: mp.slug, name: mp.name, photo: mp.photo, sub: 'List MP' }))

  if (!slug || !colors || !names) return null
  const accent = ink(colors.bg)

  return (
    // Tighter above than below: "Tap an MP" belongs to the seat count it
    // follows, while the bills box beneath is a separate thing and needs the
    // clearance.
    <div style={{ margin: '8px 0 20px' }}>
      {/* Says the rows are tappable. Same voice as "Tap an issue" over the
          policy pills — a prompt, not a heading, so it is a plain span. */}
      <div style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,.9)', fontFamily: MANROPE, marginBottom: 8, textAlign: 'center' }}>
        Tap an MP
      </div>

      {/* ONE container, two columns inside it. Two separate frames made the
          two routes into Parliament look like two unrelated things; they are
          two halves of one caucus, so they share a box and a rule instead. */}
      <div style={{
        border: `2px solid ${colors.bg}`, background: colors.light, borderRadius: 14,
        padding: '12px 10px', transition: 'border-color .25s ease-in-out, background-color .25s ease-in-out',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
      }}>
        <Column
          onPick={setPreview}
          label="won a local seat"
          count={seated.length}
          empty="None won in 2023"
          rows={seated}
          accent={accent}
          colors={colors}
          party={slug}
        />
        <Column
          onPick={setPreview}
          label="came off the party list"
          count={listed.length}
          empty="None this term"
          rows={listed}
          accent={accent}
          colors={colors}
          party={slug}
        />
      </div>

      {/* Under BOTH boxes, since it covers both: a small outlined chip rather
          than a filled signpost — several solid signs stacked down one page
          make each of them count for less. */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
        <Link
          href={`/mps?party=${slug}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', borderRadius: 999,
            border: `1.5px solid ${accent}`, color: accent, background: 'transparent',
            fontSize: 11.5, fontWeight: 800, fontFamily: MANROPE,
            textDecoration: 'none', whiteSpace: 'nowrap',
            transition: 'border-color .25s ease-in-out, color .25s ease-in-out',
          }}
        >
          <MapPin style={{ width: 12, height: 12, flexShrink: 0 }} />
          All {names.short} MPs
          <ArrowRight style={{ width: 13, height: 13, flexShrink: 0 }} strokeWidth={3} />
        </Link>
      </div>

      {preview && <MPPreview slug={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}

/**
 * One column: a heading, then the MPs in rows under it.
 *
 * A caucus can be forty-odd MPs, so the rows scroll vertically inside a
 * capped height with buttons to page through them, rather than running the
 * page on for a screen and a half. The count is in the heading, so the reader
 * knows how much is below the fold without scrolling to find out.
 */
function Column({ label, count, empty, rows, accent, colors, party, onPick }: {
  /** Reads after the count: "2 won a local seat". */
  label: string
  count: number
  empty: string
  rows: Card[]
  accent: string
  /** The party's fill and border for this column's own frame, and the colour
   *  the bottom fade blends into. */
  colors: { bg: string; light: string }
  party: PartySlug
  /** Open this MP's preview over the page instead of navigating to them. */
  onPick: (slug: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  // Both ends: a fade and a chevron appear on whichever side still has rows
  // out of view, so once the reader has scrolled down there is a way back up
  // as well as onward.
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(true)

  // Which arrows are usable. Recomputed on scroll and resize, and whenever the
  // party changes the rows underneath.
  const sync = useCallback(() => {
    const el = ref.current
    if (!el) return
    setAtStart(el.scrollTop <= 1)
    setAtEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - 1)
  }, [])
  useEffect(() => {
    ref.current?.scrollTo({ top: 0 })
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [sync, rows.length, party])

  /**
   * Page by WHOLE ROWS, and land on a row boundary.
   *
   * Scrolling by a fraction of the height left a name sliced across the top
   * edge, which reads as broken rather than as "there is more". The row pitch
   * is measured from the first two cards (height + the flex gap), so this
   * stays right if the card size changes.
   */
  const page = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    const kids = el.children
    const first = kids[0] as HTMLElement | undefined
    if (!first) return
    const second = kids[1] as HTMLElement | undefined
    const pitch = second ? second.offsetTop - first.offsetTop : first.offsetHeight + 5
    const perPage = Math.max(1, Math.floor(el.clientHeight / pitch))
    const index = Math.round(el.scrollTop / pitch) + dir * perPage
    el.scrollTo({ top: Math.max(0, index) * pitch, behavior: 'smooth' })
  }

  return (
    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Plain words, not the official vocabulary: an "electorate MP" and a
          "list MP" mean nothing to someone who has not been taught MMP. */}
      {/* A rule under the heading, not a frame around the column: it separates
          the label from its rows without cutting the two halves apart. */}
      <div style={{
        fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
        color: '#000', fontFamily: MANROPE, lineHeight: 1.25, minHeight: '2.5em',
        borderBottom: `1.5px solid ${colors.bg}55`, paddingBottom: 6, marginBottom: 7,
      }}>
        {count} {label}
      </div>

      {rows.length === 0 ? (
        <p style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE, margin: 0, height: ROWS_H }}>{empty}</p>
      ) : (
        <>
        {/* A FIXED height, not a cap: without it a party with six MPs made a
            shorter box than one with forty, and the tile cycle turning every
            few seconds moved the whole page under the reader. */}
        <div style={{ position: 'relative', height: ROWS_H }}>
        {/* No fade at the TOP: the arrows below say what is above, and the
            heading is right there — a fade under it read as the column being
            cut off rather than scrolled. */}
        <div
          ref={ref}
          onScroll={sync}
          className="mp-rail"
          // overflow is set in CSS, not here: on a phone the list must NOT
          // scroll under a finger (see globals.css). An inline style would
          // outrank the media query.
          style={{ display: 'flex', flexDirection: 'column', gap: 5, height: '100%' }}
        >
          {rows.map((c) => (
            // A button, not a link: tapping shows a preview over the page
            // rather than leaving it. The full profile is a tap further, from
            // inside the preview.
            <button
              key={c.slug}
              type="button"
              onClick={() => onPick(c.slug)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, width: '100%',
                border: '1px solid #00000014', background: '#fff', borderRadius: 9,
                padding: '4px 8px 4px 4px', textAlign: 'left', cursor: 'pointer',
                font: 'inherit', flexShrink: 0,
              }}
            >
              <Avatar src={c.photo} name={c.name} party={party} size="xs" face />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.name}
                </span>
                <span style={{ display: 'block', fontSize: 10.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.sub}
                </span>
              </span>
            </button>
          ))}
        </div>

        {/* More below: the rows fade out at the bottom edge rather than being
            cut off mid-card, and a chevron under the column says so out loud.
            Both disappear once the reader reaches the end. Scrolling the
            column itself is what moves it; the chevron is a tap target for
            anyone who would rather not. */}
        {!atEnd && (
          <span
            aria-hidden
            style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, height: 34, pointerEvents: 'none',
              background: `linear-gradient(to bottom, ${colors.light}00, ${colors.light})`,
              borderRadius: '0 0 9px 9px',
            }}
          />
        )}
        </div>

        {/* Both controls sit together under the column, spread apart, so the
            pair is one thing in one place rather than a control above and
            another below. Each greys out at its own end. The row is always
            present, empty or not, so the box height doesn't depend on whether
            this party's list overflows. */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 4, minHeight: 24 }}>
        {!(atStart && atEnd) && (
          <>
            <button
              type="button"
              onClick={() => page(-1)}
              disabled={atStart}
              aria-label={`Show previous ${label} MPs`}
              style={chevron(accent, atStart)}
            >
              <ChevronUp style={{ width: 18, height: 18 }} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => page(1)}
              disabled={atEnd}
              aria-label={`Show more ${label} MPs`}
              style={chevron(accent, atEnd)}
            >
              <ChevronDown style={{ width: 18, height: 18 }} strokeWidth={2.5} />
            </button>
          </>
        )}
        </div>
        </>
      )}
    </div>
  )
}
