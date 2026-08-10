/**
 * buildStancesByTopic — shapes approved party positions into the compact form the
 * bill pages expand inline (see TopicStances).
 *
 * Server-side: the full positions set is large and carries sourcing detail the
 * inline drawer doesn't show, so only the few fields it renders cross into the
 * client bundle.
 */

import { getAllApprovedPositions } from '@/lib/positions/live'
import { PARTY_DIRECTORY_ORDER, PROFILED_MINOR_PARTIES, PARTY_PROFILES } from '@/constants/parties-data'
import type { PartySlug } from '@/types'
import type { TopicStance } from '@/components/bills/topic-stances'

// Parties in Parliament first, then the rest — same order the reader meets them
// everywhere else on the site.
const ORDER = [...PARTY_DIRECTORY_ORDER, ...PROFILED_MINOR_PARTIES]

export async function buildStancesByTopic(topics: string[]): Promise<Record<string, TopicStance[]>> {
  if (topics.length === 0) return {}
  const wanted = new Set(topics)
  const positions = await getAllApprovedPositions()

  // One row per party per topic, preferring the current term over 2023.
  const best = new Map<string, (typeof positions)[number]>()
  for (const p of positions) {
    if (!wanted.has(p.topic)) continue
    const key = `${p.topic}::${p.party}`
    const ex = best.get(key)
    if (!ex || (ex.period !== '2026' && p.period === '2026')) best.set(key, p)
  }

  const out: Record<string, TopicStance[]> = {}
  for (const topic of wanted) {
    const rows: TopicStance[] = []
    for (const slug of ORDER) {
      const p = best.get(`${topic}::${slug}`)
      if (!p) continue   // not captured yet — a gap, never shown as "no position"
      const profile = PARTY_PROFILES[slug as PartySlug]
      rows.push({
        party: slug,
        partyName: profile.name,
        colour: profile.color,
        textColour: profile.textColor,
        stance: p.stance,
        summary: p.summaryBasic || p.summary,
        noPosition: p.noPosition,
      })
    }
    if (rows.length) out[topic] = rows
  }
  return out
}
