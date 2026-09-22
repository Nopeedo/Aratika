/**
 * by-topic.ts — link the 54th-Parliament bills dataset to policy topics, so each
 * /policies/[topic] page can show "what's actually been legislated this term"
 * beside "where the parties stand".
 *
 * WHY THIS IS NOT JUST A CATEGORY LOOKUP
 *
 * bills-54.ts tags every bill with ONE category, derived by keyword-matching its
 * title (see scripts/build-bills-54.mjs). Those categories are a good filter for
 * the bills tracker, but several are broader than a policy topic:
 *
 *   "Work & social" covers employment, wages, ACC, welfare, superannuation,
 *   privacy, consumer law AND immigration. Mapping Immigration to that whole
 *   category meant the immigration page announced "16 bills passed into law"
 *   while listing bills about holidays and consumer credit. Three of those bills
 *   are actually about immigration. Reporting the other thirteen as this
 *   Parliament's immigration record is not a presentation problem, it is a
 *   factual claim the source does not support.
 *
 * So a topic may be defined by category, by a match on the bill's own title, or
 * by both, and may exclude titles a category wrongly swept in. A title rule also
 * reaches bills the keyword tagger filed under "Other" — every free-trade bill
 * was sitting there, which is why Foreign Policy showed nothing at all.
 *
 * Overlap between topics is deliberate and correct: a water services bill is
 * both environment and local government, and an immigration levy bill is both
 * immigration and tax. A bill may appear under more than one topic.
 */

import { BILLS_54, type Bill54 } from '@/constants/bills-54'
import type { PolicyTopic } from '@/types'

interface TopicRule {
  /** Bill categories that belong to this topic wholesale. */
  categories?: string[]
  /** Titles that belong to this topic whatever category they were filed under. */
  include?: RegExp
  /** Titles a category swept in wrongly. */
  exclude?: RegExp
}

const TOPIC_RULES: Partial<Record<PolicyTopic, TopicRule>> = {
  economy: { categories: ['Economy & tax', 'Work & social'] },
  housing: { categories: ['Housing & tenancy'] },
  health: { categories: ['Health'] },
  education: { categories: ['Education'] },
  climate: { categories: ['Environment & climate', 'Transport & infrastructure'] },
  environment: { categories: ['Environment & climate'] },
  'crime-justice': { categories: ['Crime & justice'] },
  'treaty-maori-affairs': { categories: ['Treaty & Māori'] },

  // Title-matched only: see the note above. The category these sit in is too
  // broad to stand in for the topic.
  immigration: { include: /immigration|visa|migrant|refugee|citizenship|overstayer|passport/i },

  // Had no mapping at all, so the section silently never rendered — while every
  // free-trade and defence bill sat in "Other" waiting to be found by title.
  'foreign-policy': { include: /free trade|trade agreement|foreign affairs|defence|sanctions|export quota|tariff/i },

  // Also had no mapping. The category exists and is mostly right; the exclusion
  // is a false positive from the keyword tagger, which reads the "Council" in
  // Game Animal Council as local government.
  'democracy-government': {
    categories: ['Local government & democracy'],
    include: /electoral|referend|constitution|official information|ombudsman/i,
    exclude: /game animal/i,
  },
}

export interface TopicBills {
  passed: Bill54[]
  active: Bill54[]
  total: number
}

/** Bills in the given policy topic this term, split into passed (now law) and active. */
export function billsForTopic(topic: PolicyTopic): TopicBills {
  const rule = TOPIC_RULES[topic]
  if (!rule) return { passed: [], active: [], total: 0 }
  const inTopic = BILLS_54.filter((b) => {
    if (rule.exclude?.test(b.title)) return false
    return !!rule.categories?.includes(b.category) || !!rule.include?.test(b.title)
  })
  const byDate = (a: Bill54, b: Bill54) => (b.date || '').localeCompare(a.date || '')
  const passed = inTopic.filter((b) => b.status === 'Royal Assent').sort(byDate)
  const active = inTopic.filter((b) => b.status !== 'Royal Assent').sort(byDate)
  return { passed, active, total: inTopic.length }
}
