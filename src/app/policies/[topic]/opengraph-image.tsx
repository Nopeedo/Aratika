/** Topic card — names the issue and how many parties we hold a position for,
 *  which is the thing that makes this page worth opening. */
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og/card'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import { getAllApprovedPositions } from '@/lib/positions/live'
import { TOPIC_BORDER_HEX } from '@/constants/topic-colors'
import type { PolicyTopic } from '@/types'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'Where the parties stand'

export default async function Image({ params }: { params: Promise<{ topic: string }> }) {
  // params is a Promise in Next 16 — read synchronously it is undefined, and
  // every card silently fell back to the generic one.
  const { topic } = await params
  const meta = POLICY_TOPICS[topic as PolicyTopic]
  if (!meta) {
    return ogCard({ eyebrow: 'Policy', title: 'Where the parties stand' })
  }
  const positions = await getAllApprovedPositions()
  const n = positions.filter((p) => p.topic === topic && p.period !== '2023' && !p.noPosition).length
  const hue = meta.textColor.match(/text-(\w+)-\d+/)?.[1] ?? 'slate'
  return ogCard({
    eyebrow: 'Where they stand',
    title: meta.label,
    subtitle: meta.description,
    stat: n > 0 ? { value: String(n), label: n === 1 ? 'party with a published position' : 'parties with published positions' } : undefined,
    accent: (TOPIC_BORDER_HEX[hue] ?? TOPIC_BORDER_HEX.slate).rest,
  })
}
