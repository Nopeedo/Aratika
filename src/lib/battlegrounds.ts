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
}

export const MARGIN_TIERS: MarginTier[] = [
  { key: 'ultra',       label: 'Ultra-marginal', color: '#dc2626', max: 1500 },
  { key: 'marginal',    label: 'Marginal',       color: '#ea580c', max: 3500 },
  { key: 'competitive', label: 'Competitive',    color: '#f59e0b', max: 7000 },
  { key: 'safe',        label: 'Safe',           color: '#94a3b8', max: Infinity },
]

const UNKNOWN_TIER: MarginTier = { key: 'unknown', label: 'Result pending', color: '#d8d5cf', max: 0 }

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
