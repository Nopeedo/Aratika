'use client'

/**
 * useLearnProgress — tracks completed learn modules/tiers.
 *
 * Works for everyone via localStorage. When the user is signed in, progress is
 * also synced to Supabase (learn_progress table): on login it merges local +
 * cloud (keeping the best score per tier) and pushes anything missing upstream,
 * and each new result is upserted. If the table/RLS isn't available it silently
 * stays local-only, so nothing ever breaks.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { LearnTier } from '@/constants/learn-data'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'

export interface TierResult {
  completed: boolean
  score: number
  total: number
}

// moduleId -> tier -> result
export type ProgressMap = Record<string, Partial<Record<LearnTier, TierResult>>>

const STORAGE_KEY = 'aratika_learn_v1'

function readLocal(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}
function writeLocal(p: ProgressMap) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)) } catch { /* ignore */ }
}

/** Merge two maps keeping the higher score per (module, tier). */
function mergeMaps(base: ProgressMap, incoming: ProgressMap): ProgressMap {
  const out: ProgressMap = JSON.parse(JSON.stringify(base))
  for (const mod of Object.keys(incoming)) {
    out[mod] = out[mod] || {}
    for (const tier of Object.keys(incoming[mod]) as LearnTier[]) {
      const cur = out[mod][tier]
      const inc = incoming[mod][tier]!
      if (!cur || inc.score >= cur.score) out[mod][tier] = inc
    }
  }
  return out
}

export function useLearnProgress() {
  const { user } = useUser()
  const [progress, setProgress] = useState<ProgressMap>({})
  const [loaded, setLoaded] = useState(false)
  const progressRef = useRef<ProgressMap>({})
  const syncedFor = useRef<string | null>(null)

  const apply = useCallback((next: ProgressMap) => {
    progressRef.current = next
    setProgress(next)
  }, [])

  // Initial local load.
  useEffect(() => {
    apply(readLocal())
    setLoaded(true)
  }, [apply])

  // On login: pull cloud, merge with local, push anything cloud is missing.
  useEffect(() => {
    if (!user) { syncedFor.current = null; return }
    if (syncedFor.current === user.id) return
    syncedFor.current = user.id

    ;(async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('learn_progress')
          .select('module_id, tier, score, total')
        if (error) return // table missing / unavailable → stay local

        const cloud: ProgressMap = {}
        for (const row of data || []) {
          cloud[row.module_id] = cloud[row.module_id] || {}
          cloud[row.module_id][row.tier as LearnTier] = { completed: true, score: row.score, total: row.total }
        }

        const merged = mergeMaps(cloud, readLocal())
        apply(merged)
        writeLocal(merged)

        // Upsert rows where local beats (or is missing from) cloud.
        const upserts: { user_id: string; module_id: string; tier: string; score: number; total: number }[] = []
        for (const mod of Object.keys(merged)) {
          for (const tier of Object.keys(merged[mod]) as LearnTier[]) {
            const m = merged[mod][tier]!
            const c = cloud[mod]?.[tier]
            if (!c || m.score > c.score) {
              upserts.push({ user_id: user.id, module_id: mod, tier, score: m.score, total: m.total })
            }
          }
        }
        if (upserts.length) {
          await supabase.from('learn_progress').upsert(upserts, { onConflict: 'user_id,module_id,tier' })
        }
      } catch {
        /* offline / table absent — local-only is fine */
      }
    })()
  }, [user, apply])

  const record = useCallback((moduleId: string, tier: LearnTier, score: number, total: number) => {
    const existing = progressRef.current[moduleId]?.[tier]
    if (existing && existing.score >= score) return // keep best

    const next: ProgressMap = {
      ...progressRef.current,
      [moduleId]: { ...(progressRef.current[moduleId] || {}), [tier]: { completed: true, score, total } },
    }
    apply(next)
    writeLocal(next)

    if (user) {
      try {
        const supabase = createClient()
        supabase
          .from('learn_progress')
          .upsert({ user_id: user.id, module_id: moduleId, tier, score, total }, { onConflict: 'user_id,module_id,tier' })
          .then(() => {}, () => {})
      } catch { /* ignore */ }
    }
  }, [user, apply])

  const moduleDone = useCallback(
    (moduleId: string) => Object.values(progress[moduleId] || {}).some((r) => r?.completed),
    [progress],
  )

  return { progress, loaded, record, moduleDone, isSynced: !!user }
}
