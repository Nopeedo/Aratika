/**
 * Derives the policy areas an MP shapes from their roles (portfolios /
 * spokesperson roles) and select-committee memberships — data we already hold,
 * sourced from the public record. This is factual ("they hold this role"), not a
 * judgement, and links each area to where the parties stand on it.
 */

import type { MPProfile } from '@/constants/mps-data'
import type { PolicyTopic } from '@/types'
import { POLICY_TOPICS } from '@/constants/policy-topics'

const KEYWORDS: { topic: PolicyTopic; words: string[] }[] = [
  { topic: 'economy', words: ['econom', 'financ', 'revenue', 'tax', 'budget', 'jobs', 'income', 'infrastructure', 'transport', 'workforce', 'employ', 'small business', 'commerce', 'trade and enterprise', 'tourism'] },
  { topic: 'housing', words: ['housing', 'building', 'construction', 'urban'] },
  { topic: 'health', words: ['health', 'mental', 'disabilit', 'aged care', 'pharmac', 'social development', 'whaikaha'] },
  { topic: 'education', words: ['education', 'tertiary', 'school', 'universit'] },
  { topic: 'climate', words: ['climate', 'energy', 'emission'] },
  { topic: 'environment', words: ['environment', 'conservation', 'ocean', 'fisher', 'water', 'agricultur', 'forestry', 'rural', 'biodivers', 'primary industries'] },
  { topic: 'crime-justice', words: ['justice', 'police', 'correction', 'court', 'crime', 'law and order', 'attorney', 'security'] },
  { topic: 'treaty-maori-affairs', words: ['māori', 'maori', 'treaty', 'waitangi', 'whānau', 'whanau', 'pacific', 'ethnic'] },
  { topic: 'immigration', words: ['immigration', 'refugee', 'border'] },
  { topic: 'foreign-policy', words: ['foreign', 'defence', 'defense', 'export', 'customs', 'trade'] },
]

export interface MPPolicyLink { topic: PolicyTopic; label: string; reason: string }

export function policiesForMP(mp: MPProfile): MPPolicyLink[] {
  const found = new Map<PolicyTopic, { kind: 'role' | 'committee'; item: string }>()

  const scan = (items: string[] | undefined, kind: 'role' | 'committee') => {
    for (const item of items ?? []) {
      const low = item.toLowerCase()
      for (const { topic, words } of KEYWORDS) {
        if (found.has(topic)) continue
        if (words.some((w) => low.includes(w))) found.set(topic, { kind, item })
      }
    }
  }
  scan(mp.portfolios, 'role')
  scan(mp.committees, 'committee')

  return [...found.entries()].map(([topic, { kind, item }]) => {
    const label = POLICY_TOPICS[topic].label
    const reason = kind === 'role'
      ? `Through their role (${item}), they help shape ${label.toLowerCase()} policy.`
      : `Sits on the ${item} committee, which scrutinises ${label.toLowerCase()}.`
    return { topic, label, reason }
  })
}
