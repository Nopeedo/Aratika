/**
 * Personal Compass — the questionnaire spec.
 *
 * Part 1 (about you) reuses the existing preferences/recommendations engine to
 * route people to the right TOOLS. Part 2 below is the new "where you stand"
 * half: 8 neutral policy statements the user rates on a 5-point scale, then we
 * show — factually, sourced, and WITHOUT declaring a winner — where they overlap
 * with every party.
 *
 * NON-PARTISAN GUARANTEE (must be preserved):
 *  - Statements are neutral propositions; neither pole is framed as "correct".
 *  - Party stances are SOURCED from each party's own official material (see
 *    COMPASS_STANCES, every cell carries a sourceUrl + short verbatim quote).
 *  - The result shows overlap per party in a FIXED neutral order — never sorted
 *    by match — so nothing reads as a recommendation. It is not voting advice.
 *  - A party with no clearly-stated position is shown as `no_position`, never guessed.
 */

import type { PolicyTopic, PartySlug } from '@/types'

// ─── Answer scale (5-point Likert) ─────────────────────────────────────────────
export type LikertValue = -2 | -1 | 0 | 1 | 2
export interface LikertOption { value: LikertValue; label: string; short: string }
export const LIKERT_SCALE: LikertOption[] = [
  { value: 2,  label: 'Strongly agree',    short: 'Strongly agree' },
  { value: 1,  label: 'Agree',             short: 'Agree' },
  { value: 0,  label: 'Unsure / neutral',  short: 'Neutral' },
  { value: -1, label: 'Disagree',          short: 'Disagree' },
  { value: -2, label: 'Strongly disagree', short: 'Strongly disagree' },
]

// ─── The 8 statements ───────────────────────────────────────────────────────────
// `agreeMeans` describes — neutrally — which policy direction "agree" leans toward,
// purely so the overlap logic knows how to compare a user's answer to a party's stance.
export interface CompassStatement {
  id: string
  topic: PolicyTopic          // links the result chip to /policies/[topic]
  label: string               // short topic label for the result view
  text: string                // the statement the user rates
  agreeMeans: string          // neutral description of the "agree" direction
}

export const COMPASS_STATEMENTS: CompassStatement[] = [
  { id: 'tax-vs-services', topic: 'economy', label: 'Tax & spending',
    text: 'Taxes should be lower, even if it means less government spending on public services.',
    agreeMeans: 'lower tax, smaller state' },
  { id: 'health-funding', topic: 'health', label: 'Health',
    text: 'Public health should get significantly more funding, even if it means higher taxes.',
    agreeMeans: 'more health funding via higher tax' },
  { id: 'public-housing', topic: 'housing', label: 'Housing',
    text: 'The government should directly build more public housing to address the shortage.',
    agreeMeans: 'state-led house building' },
  { id: 'education-funding', topic: 'education', label: 'Education',
    text: 'The government should increase funding for public schools and teachers.',
    agreeMeans: 'more public-education funding' },
  { id: 'climate-speed', topic: 'climate', label: 'Climate',
    text: 'New Zealand should cut emissions faster, even if it carries short-term economic cost.',
    agreeMeans: 'faster emissions cuts' },
  { id: 'justice-sentencing', topic: 'crime-justice', label: 'Crime & justice',
    text: 'The justice system should prioritise tougher sentencing over rehabilitation.',
    agreeMeans: 'tougher sentencing focus' },
  { id: 'treaty-partnership', topic: 'treaty-maori-affairs', label: 'Treaty & Māori',
    text: 'Treaty-based partnerships and Māori-specific policies should be maintained or expanded.',
    agreeMeans: 'maintain/expand Treaty partnerships' },
  { id: 'inequality-support', topic: 'economy', label: 'Cost of living',
    text: 'The government should do more to reduce inequality and support people on low incomes.',
    agreeMeans: 'more redistribution / low-income support' },
]

// ─── Party stance on a statement (sourced) ──────────────────────────────────────
// Mapped onto the same -2..2 axis as the user's answer, so overlap is a simple
// distance. `support` = the party's position aligns with the "agree" direction.
export type StanceValue = 'strongly_support' | 'support' | 'mixed' | 'oppose' | 'strongly_oppose' | 'no_position'

export const STANCE_AXIS: Record<Exclude<StanceValue, 'no_position'>, LikertValue> = {
  strongly_support: 2, support: 1, mixed: 0, oppose: -1, strongly_oppose: -2,
}

export interface PartyStance {
  stance: StanceValue
  summary: string        // one neutral plain-language line on the party's position
  quote: string | null   // short verbatim quote from the source (<=240 chars)
  sourceUrl: string | null
  sourceLabel: string    // e.g. "Labour 2023 manifesto"
}

// statement id → party slug → stance. Populated by the sourcing step (Phase 1)
// and reviewed before launch. Parties shown in the result in this fixed,
// non-ranked order (current seat order); TOP is extra-parliamentary, omitted here.
export const COMPASS_PARTY_ORDER: PartySlug[] = ['national', 'labour', 'green', 'act', 'nzfirst', 'tpm']

export type CompassStances = Record<string, Partial<Record<PartySlug, PartyStance>>>

// Sourced stance matrix lives in its own file (one cell per party per statement,
// each with a sourceUrl). Empty cells render as "position not yet captured".
export { COMPASS_STANCES } from '@/constants/compass-stances'
