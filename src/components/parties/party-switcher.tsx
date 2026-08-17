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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Row label="In Parliament" parties={inParliament} current={current} />
      <Row label="Contesting 2026" parties={contesting} current={current} />
    </div>
  )
}

function Row({ label, parties, current }: { label: string; parties: PartySlug[]; current: string }) {
  if (parties.length === 0) return null
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, flexShrink: 0, minWidth: 96 }}>
        {label}
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {parties.map((p) => {
          const prof = PARTY_PROFILES[p]
          if (!prof) return null
          const col = PARTY_COLORS[p]
          const active = p === current
          return (
            <Link
              key={p}
              href={`/parties/${p}`}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 12.5, fontWeight: 700, fontFamily: MANROPE, textDecoration: 'none',
                padding: '5px 11px', borderRadius: 999,
                color: active ? '#fff' : INK,
                background: active ? (col?.bg ?? INK) : '#fff',
                border: `1px solid ${active ? (col?.bg ?? INK) : BORDER}`,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? 'rgba(255,255,255,.85)' : (col?.bg ?? TERTIARY), flexShrink: 0 }} />
              {PARTY_NAMES[p]?.short ?? prof.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
