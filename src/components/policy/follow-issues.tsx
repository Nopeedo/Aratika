'use client'

/**
 * FollowIssues — follow policy topics from the hub, without opening one.
 *
 * Until now the only place to follow an issue was the button on
 * /policies/[topic], which meant finding the hub (not in the main nav until
 * recently), choosing a topic, opening it, and only then seeing that following
 * was possible. Two people have ever done it. The `policy` bookmark kind feeds a
 * notification path — a story tagged to a topic reaches everyone following it —
 * so the shortage of subscribers was a discovery problem, not a demand one.
 *
 * A row of chips rather than a control on each card: every topic card is wrapped
 * entirely in a <Link> to its topic page, so a button inside one would be an
 * interactive element nested in a link — invalid, and it needs click
 * interception to stop a follow tap navigating away. This sidesteps that.
 *
 * Anonymous-first, via useBookmarks: a first-timer can follow issues with no
 * account and the choices sync up on sign-in. Asking someone to register at the
 * exact moment they show interest is where you lose them.
 */

import Link from 'next/link'
import { Bookmark, BookmarkCheck, ArrowRight } from 'lucide-react'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { POLICY_TOPICS, POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import { INK, SECONDARY, TERTIARY, BORDER, JADE, JADE_DARK, MANROPE } from '@/constants/theme'

export function FollowIssues() {
  const { isBookmarked, toggle, loading } = useBookmarks()

  const followed = POLICY_TOPIC_ORDER.filter((k) => isBookmarked('policy', k))
  const count = followed.length

  return (
    <div style={{
      border: `1px solid ${BORDER}`, borderRadius: 16, background: '#fff',
      padding: '16px 18px', marginBottom: 22, boxShadow: '0 2px 8px rgba(42,18,6,.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <span style={{ width: 28, height: 28, borderRadius: 9, background: `${JADE}1f`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bookmark style={{ width: 15, height: 15, color: JADE }} />
        </span>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>
            Follow the issues you care about
          </h2>
          <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: '2px 0 0', lineHeight: 1.5 }}>
            We&rsquo;ll tell you when a party changes position on one, or it&rsquo;s in the news. Tap any issue —
            no account needed.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {POLICY_TOPIC_ORDER.map((key) => {
          const topic = POLICY_TOPICS[key]
          const on = isBookmarked('policy', key)
          const Icon = on ? BookmarkCheck : Bookmark
          return (
            <button
              key={key}
              onClick={() => toggle({ kind: 'policy', refId: key, label: topic.label, sublabel: 'Policy issue', href: `/policies/${key}` })}
              disabled={loading}
              aria-pressed={on}
              aria-label={on ? `Stop following ${topic.label}` : `Follow ${topic.label}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, cursor: loading ? 'default' : 'pointer',
                fontSize: 12.5, fontWeight: 700, fontFamily: MANROPE, padding: '6px 12px', borderRadius: 999,
                border: `1px solid ${on ? JADE : BORDER}`,
                background: on ? `${JADE}1a` : '#fff',
                color: on ? JADE_DARK : INK,
                opacity: loading ? 0.6 : 1,
              }}
            >
              <Icon style={{ width: 11, height: 11, color: on ? JADE_DARK : TERTIARY }} />
              {topic.label}
            </button>
          )
        })}
      </div>

      {/* The payoff, stated only once something is actually followed — a standing
          "see them in your Command Centre" with nothing to see is a dead link. */}
      <div style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 11 }}>
        {count === 0
          ? 'Nothing followed yet.'
          : (
            <>
              Following {count} issue{count === 1 ? '' : 's'} ·{' '}
              <Link href="/command-centre" style={{ color: JADE, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                See them in your Command Centre <ArrowRight style={{ width: 11, height: 11 }} />
              </Link>
            </>
          )}
      </div>
    </div>
  )
}
