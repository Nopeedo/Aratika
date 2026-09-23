'use client'

/**
 * PartyDirectory — every party, filtered by one row of pills.
 *
 * It replaces three stacked sections ("Governing Coalition", "Opposition",
 * "Also contesting 2026, without seats in Parliament"), each with its own
 * heading and its own count chip. Those headings were a filter that the reader
 * operated by scrolling: to see the eleven parties without seats you went past
 * six full-height tiles first, and on a phone that was three screens. The pills
 * carry the same three groups and the same counts, and the grid answers in
 * place.
 *
 * Pills are §2.2 (`.status-pill`), deliberately in ONE neutral treatment rather
 * than a colour per group. Party colour belongs to parties (§1.6), and it is
 * live in the grid directly underneath; giving "Governing" a green and
 * "Opposition" a red would be both a second colour system and a reading of the
 * politics the site does not make.
 *
 * Tiles are the §2.3 grid, `repeat(auto-fit, minmax(min(150px, 100%), 1fr))`
 * at gap 8, which is two columns on a 375px phone. auto-FIT, not auto-fill:
 * a pill narrowing the list to three parties left three empty tracks and a
 * row half full on a desktop. The two behave identically once the tiles
 * outnumber the tracks, which is why the All view never showed it.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'
import type { PartySlug } from '@/types'
import { BORDER, INK, MANROPE, SECONDARY } from '@/constants/theme'

export interface DirectoryParty {
  slug: PartySlug
  /** Short name: "National", "Te Pāti Māori". The full one is on the profile. */
  name: string
  seats: number
  group: 'governing' | 'opposition' | 'none'
  colour: string
  light: string
  leader: string | null
  leaderPhoto?: string
  coLeader?: string | null
  coLeaderPhoto?: string
}

const GROUPS: { key: 'all' | 'governing' | 'opposition' | 'none'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'governing', label: 'Governing' },
  { key: 'opposition', label: 'Opposition' },
  { key: 'none', label: 'No seats' },
]

export function PartyDirectory({ parties }: { parties: DirectoryParty[] }) {
  const [group, setGroup] = useState<'all' | 'governing' | 'opposition' | 'none'>('all')

  const counts = useMemo(() => ({
    all: parties.length,
    governing: parties.filter((p) => p.group === 'governing').length,
    opposition: parties.filter((p) => p.group === 'opposition').length,
    none: parties.filter((p) => p.group === 'none').length,
  }), [parties])

  const shown = group === 'all' ? parties : parties.filter((p) => p.group === group)

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {GROUPS.map((g) => (
          <FilterPill
            key={g.key}
            label={g.label}
            count={counts[g.key]}
            on={group === g.key}
            /* Tapping the lit one clears back to All, per §2.2. */
            onClick={() => setGroup(group === g.key ? 'all' : g.key)}
          />
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: GRID_CSS }} />
      <div className="pd-grid" style={{ display: 'grid', gap: 8 }}>
        {shown.map((p) => <PartyCard key={p.slug} party={p} />)}
      </div>
    </div>
  )
}

/** §3.1: the button is the 44px hit area, the span is the 28px control. */
function FilterPill({ label, count, on, onClick }: {
  label: string
  count: number
  on: boolean
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
          background: on ? '#efece5' : '#fff',
          border: `2px solid ${on ? INK : BORDER}`,
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

/**
 * One party. Light fill, 2px border, both in the party's own colour, which is
 * the treatment the homepage tiles already use.
 *
 * What came off the old 176px tile: the full registered name (two lines at this
 * width and on the profile anyway), and the "39.8% of the House" chip. The
 * share was a second encoding of the seat count sitting next to it, and the
 * House-wide split is now stated once, in the bar above the grid.
 */
function PartyCard({ party: p }: { party: DirectoryParty }) {
  const faces = [
    p.leader && p.leaderPhoto ? { name: p.leader, photo: p.leaderPhoto } : null,
    p.coLeader && p.coLeaderPhoto ? { name: p.coLeader, photo: p.coLeaderPhoto } : null,
  ].filter(Boolean) as { name: string; photo: string }[]

  return (
    <Link
      href={`/parties/${p.slug}`}
      className="party-card pd-card"
      style={{
        display: 'block', textDecoration: 'none', borderRadius: 11,
        background: p.light, border: `2px solid ${p.colour}`,
        padding: '8px 10px 9px',
      }}
    >
      <span className="pd-id" style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
        {/* Photographs only. An initials disc is not a face, and eleven of the
            seventeen leaders have no photograph on file, so the grid filled up
            with two-letter circles that carried nothing the name beside them
            did not already say. Where a photo exists it is the fastest way to
            recognise a party; where it does not, the name does that job
            alone. */}
        {faces.length > 0 && (
          <span style={{ display: 'flex', flexShrink: 0, paddingTop: 1 }}>
            {faces.map((f, i) => (
              <span key={f.name} style={i === 0 ? undefined : { marginLeft: -8, borderRadius: '50%', boxShadow: `0 0 0 2px ${p.light}` }}>
                <Avatar name={f.name} party={p.slug} src={f.photo} size="xs" face />
              </span>
            ))}
          </span>
        )}
        {/* A fixed two lines. "Women's Rights" and "Outdoors & Freedom" wrap
            where "ACT" does not, and a card that grows by a line leaves the
            row beside it short: 75px against 82px, staggered down the grid. */}
        <span className="pd-name" style={{
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          minWidth: 0, height: 32, fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.2,
        }}>
          {p.name}
        </span>
      </span>

      {/* One line, and it says the same thing whether the number is 49 or 0.
          On a phone it sits UNDER the name, because 165px is not wide enough
          for both; above the breakpoint it sits beside it (see GRID_CSS). */}
      <span className="pd-seats" style={{ display: 'block', marginTop: 6 }}>
        {p.seats > 0 ? (
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: INK, fontFamily: MANROPE, letterSpacing: '-.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{p.seats}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE }}>{p.seats === 1 ? 'seat' : 'seats'}</span>
          </span>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.3 }}>No seats yet</span>
        )}
      </span>
    </Link>
  )
}

/* The tile was the same object at 375px and at 1920: minmax(150px) with a
   1008px column gives six 161px tracks, so a desktop got MORE tiles rather than
   BIGGER ones, and the phone-sized card sat in a row of six with the page's
   margins doing the rest. /learn and /bills already stepped their tracks up
   (165 to 250, 338 to 246); this grid never did.

   200px above the breakpoint gives four 246px tiles, and at that width every
   short name in the directory fits ONE line, "Outdoors & Freedom" included
   (measured, it is the longest at ~129px against 193px of room). So the name
   box reserves one line there instead of two, and the tile comes down from 83px
   to 67px: wider, shorter, and no emptier than the phone's.

   The reserve stays FIXED, just at a different number per breakpoint. That is
   the whole point of it (§2.14): a card that grows by a line leaves the one
   beside it short and the grid staggers down the page.

   !important because the values it overrides are inline styles on the same
   elements, and an inline style outranks a stylesheet rule (§3.2). */
const GRID_CSS = `
.pd-grid { grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr)); }
@media (min-width: 768px) {
  .pd-grid { grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 10px; }
  .pd-name { height: 16px !important; -webkit-line-clamp: 1 !important; }
  /* One row, not two. A 246px card holding a name over a seat count used its
     left half and left the right half empty, which is the same phone layout
     stretched rather than a layout for the width. The name takes the room it
     needs and the count sits hard right, so the card is as wide as it is and
     22px shorter with it. */
  .pd-card { display: flex !important; align-items: center; justify-content: space-between; gap: 10px; }
  .pd-id { min-width: 0; flex: 1 1 auto; align-items: center !important; }
  .pd-seats { margin-top: 0 !important; flex-shrink: 0; }
  /* The identity row reserves the avatar's height whether or not there is
     an avatar. Only six of the seventeen leaders have a photograph on
     file, and a grid row containing none of them came out 41px against
     the 46px of a row that did: the cards in a row stretch to their
     row, so the stagger appeared between ROWS rather than within one,
     which is why it only showed at two columns. */
  .pd-id { min-height: 26px; }
}
`
