/** Party card, in that party's own colour. */
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og/card'
import { PARTY_PROFILES } from '@/constants/parties-data'
import { CURRENT_SEATS } from '@/constants/parties'
import type { PartySlug } from '@/types'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'Party profile'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  // params is a Promise in Next 16 — see the policy card.
  const { slug } = await params
  const p = PARTY_PROFILES[slug as PartySlug]
  if (!p) return ogCard({ eyebrow: 'Parties', title: 'Every party contesting 2026' })
  const seats = CURRENT_SEATS[slug as PartySlug] ?? 0
  return ogCard({
    eyebrow: 'Party profile',
    title: p.name,
    subtitle: 'Policies, leadership and record — sourced, not summarised for you',
    stat: seats > 0 ? { value: String(seats), label: seats === 1 ? 'seat in Parliament' : 'seats in Parliament' } : undefined,
    accent: p.color,
  })
}
