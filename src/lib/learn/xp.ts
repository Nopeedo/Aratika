/**
 * Learn gamification — XP, levels and mastery badges derived from progress.
 * Pure functions; no side effects.
 */

import { LEARN_MODULES, TIERS, type LearnTier } from '@/constants/learn-data'
import type { ProgressMap } from '@/hooks/use-learn-progress'

const XP_PER_TIER = 20
const XP_PERFECT_BONUS = 10
const XP_PER_LEVEL = 100

export interface Badge {
  moduleId: string
  title: string
}

export interface LearnStats {
  xp: number
  level: number
  xpIntoLevel: number
  xpForLevel: number
  tiersCompleted: number
  tiersTotal: number
  modulesMastered: number
  badges: Badge[]
}

const LIVE = LEARN_MODULES.filter((m) => m.status === 'live')
const TIER_KEYS = TIERS.map((t) => t.key) as LearnTier[]

export function computeStats(progress: ProgressMap): LearnStats {
  let xp = 0
  let tiersCompleted = 0
  const badges: Badge[] = []

  for (const mod of LIVE) {
    let tiersInModule = 0
    for (const tier of TIER_KEYS) {
      const r = progress[mod.id]?.[tier]
      if (r?.completed) {
        tiersCompleted++
        tiersInModule++
        xp += XP_PER_TIER + (r.total > 0 && r.score === r.total ? XP_PERFECT_BONUS : 0)
      }
    }
    if (tiersInModule === TIER_KEYS.length) {
      badges.push({ moduleId: mod.id, title: mod.title })
    }
  }

  const level = Math.floor(xp / XP_PER_LEVEL) + 1
  return {
    xp,
    level,
    xpIntoLevel: xp % XP_PER_LEVEL,
    xpForLevel: XP_PER_LEVEL,
    tiersCompleted,
    tiersTotal: LIVE.length * TIER_KEYS.length,
    modulesMastered: badges.length,
    badges,
  }
}
