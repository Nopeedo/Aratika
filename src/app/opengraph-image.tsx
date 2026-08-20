/** Default share card, used by any route without its own. */
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og/card'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'Arapono — non-partisan New Zealand election information'

export default async function Image() {
  return ogCard({
    eyebrow: 'New Zealand · 2026',
    title: 'Every party, every issue, one place',
    subtitle: 'Sourced, non-partisan information for the 2026 General Election',
  })
}
