/**
 * Battlegrounds — marginality analysis derived from the verified 2023 winning
 * margins. The closer the 2023 result, the more of a "battleground" the seat is.
 */

import { ELECTORATES, normalizeElectorateKey, type ElectorateInfo } from '@/constants/electorates-data'
import { ELECTORATES_2026, get2026Electorate } from '@/constants/electorates-2026'

export interface MarginTier {
  key: string
  label: string
  color: string
  /** upper bound (exclusive) on the 2023 majority for this tier */
  max: number
  /**
   * §2.3 needs three values per status, not one: the strong hue for the map
   * fill and the pill border, a light tint for the tile fill, and a foreground
   * dark enough to read on that tint. `color` alone was being used for all
   * three, so a tier label sat in #f59e0b on white.
   */
  light: string
  fg: string
  /**
   * §4, "name the number": the tier names are pundits' words and the threshold
   * that defines them was nowhere on the site. Stated in the (i) on
   * /battlegrounds rather than on the pill, where it would not fit.
   */
  threshold: string
}

export const MARGIN_TIERS: MarginTier[] = [
  { key: 'ultra',       label: 'Ultra-marginal', color: '#dc2626', max: 1500,     light: '#fdecea', fg: '#a3251f', threshold: 'won by fewer than 1,500 votes' },
  { key: 'marginal',    label: 'Marginal',       color: '#ea580c', max: 3500,     light: '#fdeee4', fg: '#9a3412', threshold: 'won by 1,500 to 3,499 votes' },
  { key: 'competitive', label: 'Competitive',    color: '#f59e0b', max: 7000,     light: '#fdf3dd', fg: '#92400e', threshold: 'won by 3,500 to 6,999 votes' },
  // Light green rather than grey: on the map, grey read as "no data" next to
  // the pending-result fill, when a safe seat is a known result.
  { key: 'safe',        label: 'Safe',           color: '#86c79a', max: Infinity, light: '#e9f4ed', fg: '#1f6b42', threshold: 'won by 7,000 votes or more' },
]

/**
 * The two seats with no 2023 winning margin: Port Waikato (the 2023 general
 * election was cancelled there after a candidate died, so the seat came from a
 * by-election) and Tāmaki Makaurau (won in 2023, then a 2025 by-election).
 *
 * Exported because the list used to show "All electorates (72)" over four tier
 * pills adding to 70, and gave no home to the two rows the arithmetic was
 * missing. It is not in MARGIN_TIERS, because classifyMargin must not be able
 * to put a seat in it by comparing a number.
 */
/**
 * A seat created in the 2025 boundary review.
 *
 * Distinct from UNKNOWN_TIER, which means "we do not have the 2023 margin".
 * These seats HAVE no 2023 margin, because they did not exist in 2023, and
 * labelling them "Result pending" implies a number is coming that never will.
 */
export const NEW_SEAT_TIER: MarginTier = {
  key: 'new', label: 'New electorate', color: '#8a7f6d', max: 0,
  light: '#f2efe8', fg: '#5b5247',
  threshold: 'created in the 8 August 2025 boundary review, so it has no previous result',
}

export const UNKNOWN_TIER: MarginTier = {
  key: 'unknown', label: 'Result pending', color: '#d8d5cf', max: 0,
  light: '#f5f3ef', fg: '#6b6157', threshold: 'no 2023 winning margin on record',
}

export function classifyMargin(majority?: number): MarginTier {
  if (majority == null) return UNKNOWN_TIER
  return MARGIN_TIERS.find((t) => majority < t.max) ?? MARGIN_TIERS[MARGIN_TIERS.length - 1]
}

export interface BattlegroundEntry {
  slug: string
  info: SeatInfo
  tier: MarginTier
}

/** The tier for a seat, which is not always a margin: a seat created in 2025
 *  has no previous result to be marginal against. */
export function seatTier(info: { majority?: number; newIn2026?: boolean }): MarginTier {
  return info.newIn2026 ? NEW_SEAT_TIER : classifyMargin(info.majority)
}

/** All electorates, most marginal first. */
export function getBattlegrounds(): BattlegroundEntry[] {
  // The 2026 field, not the 2023 one. The ten seats created in the boundary
  // review have no prior margin, so they classify as UNKNOWN rather than being
  // given a predecessor's number.
  return ELECTORATES_2026
    .map((e) => { const info = getElectorateBySlug(e.slug)!; return { slug: e.slug, info, tier: seatTier(info) } })
    .sort((a, b) => (a.info.majority ?? Infinity) - (b.info.majority ?? Infinity))
}

/**
 * A seat as it is being CONTESTED in 2026, with whatever is known about who
 * holds it now.
 *
 * The two were the same thing until the Representation Commission's 8 August
 * 2025 review, and treating them as the same thing afterwards is what broke
 * the candidate pages: the site went on offering /battlegrounds/wellington-central
 * (a seat nobody can vote for in 2026) while /battlegrounds/wellington-north
 * (where 8 people are actually standing) returned 404.
 */
export type SeatInfo = ElectorateInfo & {
  /** No sitting MP: the seat was created in the 2025 boundary review. */
  newIn2026?: boolean
  /** The Electoral Commission's official candidate count for this seat. */
  officialCandidates?: number
}

/**
 * Routes come from the 2026 list, so a page exists for exactly the seats being
 * contested — all 71 of them, and nothing else.
 */
export const ELECTORATE_SLUGS = ELECTORATES_2026.map((e) => e.slug)

export function getElectorateBySlug(slug: string): SeatInfo | undefined {
  const seat = get2026Electorate(slug)
  if (!seat) return undefined
  // A seat whose name survived the review keeps its 2023 metadata — the MP, the
  // party and the margin are still facts about who holds it going in. Its
  // BOUNDARIES may still have moved, which is why the page says so rather than
  // implying the contest is unchanged.
  const prior = ELECTORATES[slug]
  if (prior && !seat.newIn2026) {
    return { ...prior, name: seat.name, type: seat.type, officialCandidates: seat.candidates }
  }
  // Created in 2025: there is no incumbent to defend it, so party/MP/majority
  // are deliberately absent rather than inherited from a predecessor. Naming a
  // single heir would invent a continuity the Commission did not create.
  return {
    name: seat.name,
    type: seat.type,
    party: null,
    verified: false,
    newIn2026: true,
    officialCandidates: seat.candidates,
  }
}

/** Map fill colour for an electorate (by its GeoJSON name), by marginality. */
export function marginColorByName(name: string): string | null {
  const info = ELECTORATES[normalizeElectorateKey(name)]
  if (!info) return null
  return classifyMargin(info.majority).color
}
