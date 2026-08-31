'use client'

/**
 * PolicyComparison — side-by-side party positions on one topic, as a mobile-first
 * scannable stacked list (see PartyPositions). A single Plain/Detailed toggle
 * drives the expanded detail. Reads approved, editor-checked positions; parties
 * without one show an honest empty state. Neutral directory order; every row
 * cites its source.
 */

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { PARTY_DIRECTORY_ORDER } from '@/constants/parties-data'
import { CONTESTING_PARTIES, PARTY_NAMES } from '@/constants/parties'
import { PartyPositions } from '@/components/policy/party-positions'
import type { PartyPosition } from '@/lib/positions/live'
import type { PartySlug } from '@/types'
import { BORDER, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY } from '@/constants/theme'

/**
 * Every registered contesting party that isn't in the head-to-head list above.
 * DERIVED, not a second hand-kept array: a party added to CONTESTING_PARTIES
 * and forgotten here would have been invisible on every topic page, which is
 * exactly how thirty-four published positions came to be rendering nowhere.
 */
const ALSO_CONTESTING = CONTESTING_PARTIES.filter((p) => !PARTY_DIRECTORY_ORDER.includes(p))

export function PolicyComparison({ positions, topicLabel, topic }: { positions: PartyPosition[]; topicLabel: string; topic: string }) {
  const [detailed, setDetailed] = useState(false)
  const current = (slug: string) => {
    const ps = positions.filter((p) => p.party === slug)
    return ps.find((p) => p.period === '2026') ?? ps[0] // prefer current, fall back to 2023 manifesto
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 'clamp(17px, 4.5vw, 20px)', fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px', lineHeight: 1.25 }}>Where each party stands on {topicLabel}</h2>
          <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>Where each party stands going into the <b style={{ color: INK }}>2026 election</b>, summarised from their own current policy pages. Every position is dated and carries the page it came from.</p>
        </div>
        <div style={{ display: 'inline-flex', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 3, flexShrink: 0 }}>
          {[{ k: false, label: 'Plain' }, { k: true, label: 'Detailed' }].map((o) => (
            <button key={o.label} onClick={() => setDetailed(o.k)} style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, fontFamily: MANROPE,
              background: detailed === o.k ? '#fff' : 'transparent', color: detailed === o.k ? INK : TERTIARY,
              boxShadow: detailed === o.k ? '0 1px 3px rgba(12,14,18,.08)' : 'none',
            }}>{o.label}</button>
          ))}
        </div>
      </div>

      <PartyPositions parties={PARTY_DIRECTORY_ORDER} getPos={current} detailed={detailed} topic={topic} topicLabel={topicLabel} />

      <AlsoContesting getPos={current} detailed={detailed} topic={topic} topicLabel={topicLabel} />

      <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '14px 0 0', lineHeight: 1.5 }}>
        Each position is summarised neutrally from the party’s own official policy and checked by an editor before publishing — never paraphrased without the source linked. Arapono is non-partisan.
      </p>
    </div>
  )
}


/**
 * AlsoContesting — the registered parties outside the head-to-head list.
 *
 * These positions were already compiled, editor-approved and sourced, and the
 * page was already loading them: getApprovedPositions() filters by topic, not by
 * party, so all seventeen parties' positions arrive and only seven are drawn.
 * Thirty-four of them rendered nowhere. On Democracy & Government that was half
 * the parties with a published position on the topic.
 *
 * That is a fairness problem before it is a design one. The site's rule is that
 * registered parties are included by registration and not by polling, and the
 * election centre already lists all seventeen. A topic page that silently stops
 * at seven contradicts both.
 *
 * Collapsed by default, and grouped rather than merged, for the same reason the
 * election centre groups them: whether a party currently holds seats is a fact
 * about them worth showing, and seventeen expandable rows is not a list anyone
 * reads. Collapsed is not hidden — the control states how many are inside and
 * on which topic before it is opened.
 *
 * Parties with nothing recorded are NAMED rather than dropped. A panel that
 * quietly lists only the parties we happen to hold material for would imply the
 * rest have no view, when what it really shows is a gap in our own coverage.
 */
function AlsoContesting({ getPos, detailed, topic, topicLabel }: {
  getPos: (slug: string) => PartyPosition | undefined
  detailed: boolean
  topic: string
  topicLabel: string
}) {
  const [open, setOpen] = useState(false)
  const withPos = ALSO_CONTESTING.filter((p) => getPos(p))
  const withoutPos = ALSO_CONTESTING.filter((p) => !getPos(p))
  if (withPos.length === 0) return null

  const name = (p: PartySlug) => PARTY_NAMES[p]?.short ?? p

  return (
    <div style={{ marginTop: 18, border: `1px solid ${BORDER}`, borderRadius: 14, background: '#fff', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
          background: 'transparent', border: 'none', cursor: 'pointer', padding: '14px 16px',
        }}
      >
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 14.5, fontWeight: 800, color: INK, fontFamily: MANROPE }}>
            Also contesting 2026
          </span>
          {/* "…have a published position" was not true of all of them. A record
              can be an explicit finding that a party has NO stated policy on the
              topic — checked, and none found — which is a different thing from
              having one, and a different thing again from the parties named
              below as not yet recorded. All three are real states and the count
              has to be phrased so it covers them without flattening them. */}
          <span style={{ display: 'block', fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, marginTop: 2, lineHeight: 1.45 }}>
            {withPos.length} more registered {withPos.length === 1 ? 'party' : 'parties'}, and what each has published on {topicLabel.toLowerCase()}
          </span>
        </span>
        <ChevronDown style={{
          width: 18, height: 18, color: SECONDARY, flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease',
        }} />
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${BORDER}` }}>
          <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: '13px 0 14px', lineHeight: 1.55 }}>
            Grouped by whether a party currently holds seats, not by support. Every party registered with the
            Electoral Commission to contest the party vote is included, and each position below is sourced and
            checked the same way as the ones above.
          </p>

          <PartyPositions parties={withPos} getPos={getPos} detailed={detailed} topic={topic} topicLabel={topicLabel} />

          {withoutPos.length > 0 && (
            <p style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE, margin: '14px 0 0', lineHeight: 1.55 }}>
              No position on {topicLabel.toLowerCase()} recorded yet for {withoutPos.map(name).join(', ')}.{' '}
              That is a gap in our coverage, not a statement that they have no view.{' '}
              <a href="/party-inclusion" style={{ color: JADE, fontWeight: 700, textDecoration: 'none' }}>How parties are included</a>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
