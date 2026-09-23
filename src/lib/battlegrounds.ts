/**
 * Battlegrounds — marginality analysis derived from the verified 2023 winning
 * margins. The closer the 2023 result, the more of a "battleground" the seat is.
 */

import { ELECTORATES, normalizeElectorateKey, type ElectorateInfo } from '@/constants/electorates-data'

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
  info: ElectorateInfo
  tier: MarginTier
}

/** All electorates, most marginal first. */
export function getBattlegrounds(): BattlegroundEntry[] {
  return Object.entries(ELECTORATES)
    .map(([slug, info]) => ({ slug, info, tier: classifyMargin(info.majority) }))
    .sort((a, b) => (a.info.majority ?? Infinity) - (b.info.majority ?? Infinity))
}

export const ELECTORATE_SLUGS = Object.keys(ELECTORATES)

export function getElectorateBySlug(slug: string): ElectorateInfo | undefined {
  return ELECTORATES[slug]
}

/** Map fill colour for an electorate (by its GeoJSON name), by marginality. */
export function marginColorByName(name: string): string | null {
  const info = ELECTORATES[normalizeElectorateKey(name)]
  if (!info) return null
  return classifyMargin(info.majority).color
}
