/** Battleground card. The majority is the point: "won by 18 votes" is the
 *  strongest available answer to "my vote won't change anything", and it is a
 *  fact rather than an argument. */
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og/card'
import { getElectorateBySlug, classifyMargin } from '@/lib/battlegrounds'
import { PARTY_COLORS } from '@/constants/parties'
import type { PartySlug } from '@/types'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'Electorate race'

export default async function Image({ params }: { params: Promise<{ electorate: string }> }) {
  // params is a Promise in Next 16 — see the policy card.
  const { electorate } = await params
  const info = getElectorateBySlug(electorate)
  if (!info) return ogCard({ eyebrow: 'Battlegrounds', title: 'The seats to watch in 2026' })
  const tier = classifyMargin(info.majority)
  const accent = info.party ? (PARTY_COLORS[info.party as PartySlug]?.bg ?? '#B42318') : '#B42318'
  return ogCard({
    eyebrow: tier.label,
    title: info.name,
    subtitle: info.mpName ? `Held by ${info.mpName}` : undefined,
    stat: info.majority != null
      ? { value: info.majority.toLocaleString('en-NZ'), label: info.majority === 1 ? 'vote majority in 2023' : 'vote majority in 2023' }
      : undefined,
    accent,
  })
}
