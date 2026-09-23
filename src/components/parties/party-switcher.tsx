/**
 * PartySwitcher — move between parties without going back to the index.
 *
 * The party pages were islands: to compare National with Labour you went back
 * to /parties and in again. This is the top layer of the party page — pick a
 * party, then pick an issue underneath it.
 *
 * Grouped "in Parliament" and "contesting", the same split the coverage matrix
 * used, so a reader can see at a glance that the smaller registered parties are
 * here rather than having to trust that they are. Inclusion is by registration,
 * not by polling or seats — the site's rule everywhere else.
 *
 * Plain links, not client state: each party keeps its own URL, so a page is
 * shareable, linkable and indexable. Switching costs a navigation, which is the
 * right trade for a layer you use once per visit — the topic layer underneath
 * is the one you click repeatedly, and that one is client-side.
 *
 * DO NOT "improve" this into client state. §5.7 is the trap waiting for it:
 * selecting a party would change the height of blocks ABOVE the viewport, the
 * browser's scroll anchoring would hold against the wrong element, and the
 * FIRST tap would jump the reader about 850px. Only the first, so it survives
 * casual testing.
 *
 * The pills are §2.2 `.status-pill` now, not a hand-rolled copy of it. They were
 * already within half a pixel of §2.2's numbers (5px 11px at 12.5px) but carried
 * a 1px border where the shared rule says 2px and took none of the rule, so the
 * two rows would have drifted apart the first time globals.css moved. Party
 * colour on a party's own pill is §1.6-correct: a block takes the colour of
 * whatever it is about.
 *
 * Each pill is wrapped in §3.1's hit-area pattern. The global 44px minimum is
 * deliberately scoped to <button>, and these are anchors, so nothing was raising
 * them off 27px — seventeen under-sized targets in one row, which is §3.1's
 * other failure mode at its worst on the site.
 */

import Link from 'next/link'
import { PARTY_PROFILES, PARTY_DIRECTORY_ORDER, PROFILED_MINOR_PARTIES } from '@/constants/parties-data'
import { PARTY_COLORS, CURRENT_SEATS, PARTY_NAMES } from '@/constants/parties'
import type { PartySlug } from '@/types'
import { BORDER, INK, MANROPE, TERTIARY } from '@/constants/theme'

export function PartySwitcher({ current }: { current: string }) {
  // In Parliament = holds seats. TOP sits in PARTY_DIRECTORY_ORDER but holds
  // none, so it is grouped with the other contesting parties rather than
  // implied into Parliament.
  const inParliament = PARTY_DIRECTORY_ORDER.filter((p) => (CURRENT_SEATS[p] ?? 0) > 0)
  const contesting = [
    ...PARTY_DIRECTORY_ORDER.filter((p) => (CURRENT_SEATS[p] ?? 0) === 0),
    ...PROFILED_MINOR_PARTIES,
  ]

  return (
    <div className="ps-switcher" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <style dangerouslySetInnerHTML={{ __html: SWITCHER_CSS }} />
      <Row label="In Parliament" parties={inParliament} current={current} />
      <Row label="Contesting 2026" parties={contesting} current={current} />
    </div>
  )
}

function Row({ label, parties, current }: { label: string; parties: PartySlug[]; current: string }) {
  if (parties.length === 0) return null
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
      <span className="ps-label" style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, flexShrink: 0, minWidth: 96 }}>
        {label}
      </span>
      {/* gap 2, not 6: §3.1's hit area adds 9px of padding above and below each
          pill and takes it back as margin, so the pills already sit 18px apart
          to a finger. The gap is only the horizontal space now. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {parties.map((p) => {
          const prof = PARTY_PROFILES[p]
          if (!prof) return null
          const col = PARTY_COLORS[p]
          const active = p === current
          return (
            /* §3.1: the LINK is the 44px hit area, the SPAN is the ~27px pill.
               The padding is taken straight back off as margin so the row lays
               out around the visible size. It has to be done by hand here
               because globals.css's 44px minimum is scoped to <button> on
               purpose, and these are anchors. */
            <Link
              key={p}
              href={`/parties/${p}`}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'inline-flex', alignItems: 'center', textDecoration: 'none',
                padding: '9px 4px', margin: '-9px -4px',
              }}
            >
              <span
                // status-pill: §2.2's one shared rule, so this row and the
                // bills row cannot drift apart. ps-chip keeps the existing
                // phone compaction and the dot that comes down with it.
                className="status-pill ps-chip"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12.5, fontWeight: 700, fontFamily: MANROPE,
                  padding: '5px 11px', borderRadius: 999, whiteSpace: 'nowrap',
                  color: active ? '#fff' : INK,
                  background: active ? (col?.bg ?? INK) : '#fff',
                  border: `2px solid ${active ? (col?.bg ?? INK) : BORDER}`,
                }}
              >
                <span className="ps-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: active ? 'rgba(255,255,255,.85)' : (col?.bg ?? TERTIARY), flexShrink: 0 }} />
                {PARTY_NAMES[p]?.short ?? prof.name}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/* Shipped with the component (§3.2). The pill SIZE is deliberately not touched
   at any width: it is §2.2's shared control, and a per-row override of the
   shared rule is the thing §2.2 exists to stop. What does change at the
   breakpoint is the frame around it — the label column and the row rhythm —
   because at 1008px the two rows sit on one line each instead of four, and at
   the phone spacing they then read as one undifferentiated block of pills. */
const SWITCHER_CSS = `
@media (min-width: 768px) {
  .ps-switcher { gap: 12px !important; }
  .ps-label { font-size: 11.5px !important; min-width: 112px !important; }
}
`
