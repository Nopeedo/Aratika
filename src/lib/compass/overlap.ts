/**
 * computeOverlap — turns the user's compass answers into a per-party "where you
 * line up" view. NON-PARTISAN by construction:
 *  - Parties are returned in a FIXED neutral order (COMPASS_PARTY_ORDER), never
 *    sorted by agreement — so nothing reads as a ranking or recommendation.
 *  - It reports overlap on the issues the user actually answered, with a
 *    per-statement breakdown that links back to each party's sourced position.
 *  - Cells the party has no stated position on, or the user left neutral, simply
 *    don't count — they're shown as "—", never inferred.
 */

import {
  COMPASS_STATEMENTS, COMPASS_STANCES, STANCE_AXIS, COMPASS_PARTY_ORDER,
} from '@/constants/compass'
import type { LikertValue } from '@/constants/compass'
import type { PartySlug } from '@/types'

export type AgreeKind = 'agree' | 'disagree' | 'partial' | 'na'

export interface StatementOverlap {
  id: string
  label: string
  userValue: LikertValue
  partyAxis: number | null   // party's stance on the -2..2 axis (null = no position)
  kind: AgreeKind
  sourceUrl: string | null
  summary: string | null
  quote: string | null
}

export interface PartyOverlap {
  party: PartySlug
  counted: number    // statements the user answered AND the party has a position on
  sameSide: number   // of those, how many lean the same direction
  statements: StatementOverlap[]
}

export function computeOverlap(answers: Record<string, number>): PartyOverlap[] {
  // Fixed neutral order — deliberately NOT sorted by score.
  return COMPASS_PARTY_ORDER.map((party): PartyOverlap => {
    let counted = 0, sameSide = 0
    const statements = COMPASS_STATEMENTS.map((s): StatementOverlap => {
      const userValue = (answers[s.id] ?? 0) as LikertValue
      const cell = COMPASS_STANCES[s.id]?.[party]
      const partyAxis = cell && cell.stance !== 'no_position' ? STANCE_AXIS[cell.stance] : null

      let kind: AgreeKind = 'na'
      if (partyAxis !== null && userValue !== 0) {
        counted++
        if (partyAxis === 0) kind = 'partial'
        else if ((userValue > 0) === (partyAxis > 0)) { kind = 'agree'; sameSide++ }
        else kind = 'disagree'
      }
      return {
        id: s.id, label: s.label, userValue, partyAxis, kind,
        sourceUrl: cell?.sourceUrl ?? null, summary: cell?.summary ?? null, quote: cell?.quote ?? null,
      }
    })
    return { party, counted, sameSide, statements }
  })
}

/** Topics the user engaged with (non-neutral answer) — feeds the tool plan. */
export function engagedTopics(answers: Record<string, number>) {
  const strong: string[] = []   // |value| === 2
  const some: string[] = []     // |value| === 1
  for (const s of COMPASS_STATEMENTS) {
    const v = answers[s.id] ?? 0
    if (Math.abs(v) === 2) strong.push(s.topic)
    else if (Math.abs(v) === 1) some.push(s.topic)
  }
  // de-dupe, strongest first
  const seen = new Set<string>()
  const ordered = [...strong, ...some].filter((t) => (seen.has(t) ? false : (seen.add(t), true)))
  return { issues: ordered, topIssues: ordered.slice(0, 3) }
}
