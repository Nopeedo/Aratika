/**
 * by-topic.ts — link the 54th-Parliament bills dataset to policy topics, so each
 * /policies/[topic] page can show "what's actually been legislated this term"
 * beside "where the parties stand". Maps a PolicyTopic to the bill categories
 * used in bills-54.ts (which are keyword-derived).
 */

import { BILLS_54, type Bill54 } from '@/constants/bills-54'
import type { PolicyTopic } from '@/types'

const TOPIC_CATEGORIES: Partial<Record<PolicyTopic, string[]>> = {
  economy: ['Economy & tax', 'Work & social'],
  housing: ['Housing & tenancy'],
  health: ['Health'],
  education: ['Education'],
  climate: ['Environment & climate', 'Transport & infrastructure'],
  'crime-justice': ['Crime & justice'],
  environment: ['Environment & climate'],
  immigration: ['Work & social'],
  'treaty-maori-affairs': ['Treaty & Māori'],
}

export interface TopicBills {
  passed: Bill54[]
  active: Bill54[]
  total: number
}

/** Bills in the given policy topic this term, split into passed (now law) and active. */
export function billsForTopic(topic: PolicyTopic): TopicBills {
  const cats = TOPIC_CATEGORIES[topic]
  if (!cats) return { passed: [], active: [], total: 0 }
  const inTopic = BILLS_54.filter((b) => cats.includes(b.category))
  const byDate = (a: Bill54, b: Bill54) => (b.date || '').localeCompare(a.date || '')
  const passed = inTopic.filter((b) => b.status === 'Royal Assent').sort(byDate)
  const active = inTopic.filter((b) => b.status !== 'Royal Assent').sort(byDate)
  return { passed, active, total: inTopic.length }
}
