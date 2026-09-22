/**
 * TopicFollowInvite — the invitation to make an account, in place of a bare
 * "Track" button.
 *
 * "Track" on its own asked for a commitment without saying what it buys, and it
 * sent signed-out readers to a login screen they had no reason to want. This
 * says the reason first: positions on this page change when parties publish,
 * and an account is how you get told. The Track button is still the action, so
 * nothing is lost for someone already signed in.
 *
 * Wears the ISSUE's colours, like the panels and the coverage table: the pill's
 * fill behind it and its border around it, so it reads as part of this topic
 * rather than a site-wide advert. Server component; no session lookup, which
 * keeps the page statically prerendered (see the note on topic switching in
 * policy/topic-switcher.tsx).
 */

import Link from 'next/link'
import { BellRing } from 'lucide-react'
import { BookmarkButton } from '@/components/bookmarks/bookmark-button'
import { topicColors } from '@/constants/topic-colors'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import { INK, MANROPE, SECONDARY } from '@/constants/theme'

export function TopicFollowInvite({ topic, label }: { topic: string; label: string }) {
  const meta = POLICY_TOPICS[topic as keyof typeof POLICY_TOPICS]
  const { border, bg } = topicColors(meta?.textColor ?? '')

  return (
    <div style={{ background: bg, border: `2px solid ${border}`, borderRadius: 16, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
        <BellRing style={{ width: 17, height: 17, color: border, flexShrink: 0 }} />
        <h2 style={{ fontSize: 17, fontWeight: 800, color: border, fontFamily: MANROPE, margin: 0, lineHeight: 1.2 }}>
          Know when {label.toLowerCase()} changes
        </h2>
      </div>

      {/* What it actually does, and no more. No "never miss out", no count of
          users: the site's claim is that it reports what parties publish, and
          this is the same claim applied to the reader's inbox. */}
      <p style={{ fontSize: 14, color: INK, fontFamily: MANROPE, lineHeight: 1.5, margin: '0 0 14px' }}>
        Parties publish and revise their policies right through the campaign, and this page follows them.
        With a free account you can follow {label.toLowerCase()} and be told when a party&rsquo;s position here is
        added or changes.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <BookmarkButton entity={{
          kind: 'policy', refId: topic, label,
          sublabel: 'Policy topic', href: `/policies/${topic}`, accent: border,
        }} />
        <Link
          href={`/register?next=${encodeURIComponent(`/policies/${topic}`)}`}
          style={{ fontSize: 13.5, fontWeight: 800, color: border, textDecoration: 'none', fontFamily: MANROPE }}
        >
          Create a free account
        </Link>
        <span style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE }}>
          Free, and you can stop at any time.
        </span>
      </div>
    </div>
  )
}
