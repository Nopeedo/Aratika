'use client'

/**
 * PolicyComparison — side-by-side party positions on one topic, as a mobile-first
 * scannable stacked list (see PartyPositions), parliamentary parties first and
 * the other registered parties under their own heading. Reads approved, editor-checked positions; parties
 * without one show an honest empty state. Neutral directory order; every row
 * cites its source.
 */

import { CONTESTING_PARTIES, PARLIAMENTARY_PARTIES } from '@/constants/parties'
import { PartyPositions } from '@/components/policy/party-positions'
import { TrackWithAccount } from '@/components/bookmarks/track-with-account'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import { topicColors } from '@/constants/topic-colors'
import type { PartyPosition } from '@/lib/positions/live'
import { MANROPE, SECONDARY } from '@/constants/theme'

/**
 * The head-to-head list is the parties that HOLD SEATS — PARLIAMENTARY_PARTIES,
 * not PARTY_DIRECTORY_ORDER, which also carries TOP. TOP has no seats; putting
 * it alone among the six read as favouring one minor party over the ten
 * others, so it now sits with them under "also contesting" below.
 *
 * Every registered contesting party that isn't in the head-to-head list.
 * DERIVED, not a second hand-kept array: a party added to CONTESTING_PARTIES
 * and forgotten here would have been invisible on every topic page, which is
 * exactly how thirty-four published positions came to be rendering nowhere.
 */
const ALSO_CONTESTING = CONTESTING_PARTIES.filter((p) => !PARLIAMENTARY_PARTIES.includes(p))

export function PolicyComparison({ positions, topicLabel, topic }: { positions: PartyPosition[]; topicLabel: string; topic: string }) {
  // Current policy ONLY. This used to fall back to the party's 2023 manifesto
  // row when no 2026 position existed — and rendered it with no label, so a
  // reader saw "NZ First on housing" and was shown what NZ First said in 2023
  // as though it were what they say today, two months before an election.
  //
  // The party page never did this (see parties/[slug]/page.tsx: "would
  // misrepresent the party if shown as what they say today"), and this page's
  // own share image counts only 2026 rows. So the same topic could show NZ
  // First here, hide them on their party page, and count them out in the
  // preview — three answers from one dataset. A missing position is reported
  // honestly below as "no position recorded yet", which is true.
  const current = (slug: string) => positions.find((p) => p.party === slug && p.period === '2026')
  // The issue's colour, for the track control at the foot of the list.
  const hue = topicColors(POLICY_TOPICS[topic as keyof typeof POLICY_TOPICS]?.textColor ?? '').border

  return (
    <div>
      {/* No heading here any more — "Where each party stands on {topic}" is
          the subtext under the topic pill in the page header. */}
      <PartyPositions parties={PARLIAMENTARY_PARTIES} getPos={current} topic={topic} topicLabel={topicLabel} />

      <NotInParliament getPos={current} topic={topic} topicLabel={topicLabel} />

      {/* Track again at the foot of the list. The one under the heading is for
          the reader who knows immediately; this is for the one who has just
          read every party's position and NOW has a reason to follow it. Same
          control, so both show the same state and either can turn it off. */}
      <div style={{ marginTop: 18 }}>
        <TrackWithAccount
          entity={{
            kind: 'policy', refId: topic, label: topicLabel,
            sublabel: 'Policy topic', href: `/policies/${topic}`, accent: hue,
          }}
          label={`Track ${topicLabel.toLowerCase()} changes`}
          savedLabel={`Tracking ${topicLabel.toLowerCase()} changes`}
          accent={hue}
        />
      </div>

      {/* No sourcing footnote here any more. It lives in the (i) bubble beside
          the topic pill in the header (TopicInfoButton), removed from the foot
          of the list by request. */}
    </div>
  )
}


/**
 * NotInParliament — the registered parties outside the head-to-head list,
 * as a second run of the SAME cards under a plain heading.
 *
 * These positions were already compiled, editor-approved and sourced, and the
 * page was already loading them: getApprovedPositions() filters by topic, not
 * by party, so every contesting party's positions arrive. Leaving them out
 * would be a fairness problem before a design one — the site's rule is that
 * registered parties are included by registration and not by polling.
 *
 * This used to be a collapsed "Also contesting 2026" box with its own
 * explainer. Opened out by request: one list, two headings, same format for
 * everyone, with whether a party currently holds seats carried by the heading.
 *
 * Parties with nothing recorded are NAMED rather than dropped. A list that
 * quietly shows only the parties we hold material for would imply the rest
 * have no view, when what it really shows is a gap in our own coverage.
 */
function NotInParliament({ getPos, topic, topicLabel }: {
  getPos: (slug: string) => PartyPosition | undefined
  topic: string
  topicLabel: string
}) {
  const withPos = ALSO_CONTESTING.filter((p) => getPos(p))
  if (withPos.length === 0) return null

  return (
    <div style={{ marginTop: 26 }}>
      <h3 style={{ fontSize: 15, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 10px', lineHeight: 1.45 }}>
        Parties not in Parliament
      </h3>

      {/* EVERY party in this group gets its own card, including the ones with
          nothing captured yet: PartyPositions already renders those as a card
          reading "no position captured yet". They used to be swept into a grey
          sentence underneath the list, which named nine parties in a run-on
          line nobody reads and gave them a different, lesser shape on the page
          than the parties we happen to have got to. Same card, same size, the
          gap stated plainly inside it. */}
      <PartyPositions parties={ALSO_CONTESTING} getPos={getPos} topic={topic} topicLabel={topicLabel} />
    </div>
  )
}
