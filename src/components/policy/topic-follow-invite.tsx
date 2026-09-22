/**
 * TopicFollowInvite — the invitation to make an account, in place of a bare
 * "Track" button.
 *
 * "Track" on its own asked for a commitment without saying what it buys, and it
 * sent signed-out readers to a login screen they had no reason to want. This
 * says the reason first: what is on these pages changes when parties publish,
 * and an account is how you get told.
 *
 * The COPY IS GENERAL, not about whichever topic you happen to be reading. An
 * account follows parties, MPs and electorates as well as issues, and someone
 * on the immigration page is being invited to the whole thing, not to a single
 * subscription. Only the colour stays local, so the card belongs to the page it
 * sits on rather than reading as a site-wide advert.
 *
 * Server component; no session lookup, which keeps the page statically
 * prerendered (see the note on topic switching in policy/topic-switcher.tsx).
 */

import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import { topicColors } from '@/constants/topic-colors'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import { INK, MANROPE, SECONDARY } from '@/constants/theme'

export function TopicFollowInvite({ topic }: { topic: string }) {
  const meta = POLICY_TOPICS[topic as keyof typeof POLICY_TOPICS]
  const { border, bg } = topicColors(meta?.textColor ?? '')
  const next = encodeURIComponent(`/policies/${topic}`)

  return (
    <div style={{ background: bg, border: `2px solid ${border}`, borderRadius: 16, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
        <Bookmark style={{ width: 17, height: 17, color: border, flexShrink: 0 }} />
        <h2 style={{ fontSize: 17, fontWeight: 800, color: border, fontFamily: MANROPE, margin: 0, lineHeight: 1.2 }}>
          Follow what you care about
        </h2>
      </div>

      {/* What it actually does, and no more. No "never miss out", no count of
          users: the site's claim is that it reports what parties publish, and
          this is the same claim applied to the reader's inbox. */}
      <p style={{ fontSize: 14, color: INK, fontFamily: MANROPE, lineHeight: 1.5, margin: '0 0 14px' }}>
        Parties publish and revise their policies right through the campaign, and these pages follow them.
        A free account lets you follow the issues, parties and MPs you care about, and be told when a
        position is added or changes.
      </p>

      {/* No Track button here any more, by request: one invitation, one
          action. Both links return to this page afterwards, so making the
          account does not cost the reader their place. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <Link
          href={`/register?next=${next}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: border, color: '#fff', borderRadius: 11,
            padding: '10px 15px', fontSize: 14, fontWeight: 800,
            textDecoration: 'none', fontFamily: MANROPE,
          }}
        >
          <Bookmark style={{ width: 15, height: 15 }} /> Track with a free account
        </Link>
        <Link href={`/login?next=${next}`} style={{ fontSize: 13.5, fontWeight: 700, color: border, textDecoration: 'none', fontFamily: MANROPE }}>
          Already have one? Sign in
        </Link>
      </div>

      <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: '12px 0 0' }}>
        Free, and you can stop at any time.
      </p>
    </div>
  )
}
