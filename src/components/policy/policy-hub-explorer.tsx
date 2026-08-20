'use client'

/**
 * PolicyHubExplorer — pick an issue and read it here, rather than being sent to
 * another page.
 *
 * The hub used to be eleven cards that each navigated away. Tapping an issue on
 * a page called "Policy Hub" should open that issue, not replace the page — and
 * the thing a reader most often wants next (follow this issue) was two
 * navigations deep, which is why almost nobody found it.
 *
 * Same TopicChip and the same open-a-panel motion as the party pages, so the
 * interaction is already familiar. The full topic page still exists and is
 * linked from the panel for anyone who wants the long read.
 *
 * COVERAGE IS SHOWN, NOT HIDDEN. An issue no party has a published position on
 * stays in the row and says so. Dropping it would imply we hold positions on
 * everything we list.
 */

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Users } from 'lucide-react'
import { POLICY_TOPIC_ORDER, POLICY_TOPICS } from '@/constants/policy-topics'
import { TopicChip } from '@/components/homepage/topic-chip'
import { BookmarkButton } from '@/components/bookmarks/bookmark-button'
import { PARTY_COLORS, PARTY_NAMES } from '@/constants/parties'
import type { PartySlug } from '@/types'
import { BORDER, INK, JADE, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

/** Only what the panel needs — the full position objects are large and the
 *  panel is a summary, so the server sends this instead. */
export interface TopicCoverage {
  topic: string
  parties: { slug: string; stance: string; noPosition: boolean }[]
}

export function PolicyHubExplorer({ coverage }: { coverage: TopicCoverage[] }) {
  const byTopic = new Map(coverage.map((c) => [c.topic, c]))
  const [topic, setTopic] = useState<string | null>(null)

  const open = topic ? POLICY_TOPICS[topic as keyof typeof POLICY_TOPICS] : null
  const cov = topic ? byTopic.get(topic) : undefined
  const withPosition = (cov?.parties ?? []).filter((p) => !p.noPosition)

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
        {POLICY_TOPIC_ORDER.map((key) => (
          <TopicChip
            key={key}
            topicKey={key}
            active={topic === key}
            // Tapping the open issue closes it, so the row is a toggle rather
            // than a one-way door.
            onClick={() => setTopic((t) => (t === key ? null : key))}
          />
        ))}
      </div>

      {open && topic && (
        <div style={{
          marginTop: 14, border: `1px solid ${BORDER}`, borderTop: `4px solid ${JADE}`,
          borderRadius: 16, background: '#fff', padding: '18px 20px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0, flex: '1 1 320px' }}>
              <h2 style={{ fontSize: 19, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0, letterSpacing: '-.01em' }}>
                {open.label}
              </h2>
              <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: '4px 0 0', lineHeight: 1.5 }}>
                {open.description}
              </p>
            </div>
            {/* The reason this panel exists. Anonymous-capable — see useBookmarks. */}
            <BookmarkButton entity={{
              kind: 'policy', refId: topic, label: open.label,
              sublabel: 'Policy issue', href: `/policies/${topic}`,
            }} />
          </div>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Users style={{ width: 13, height: 13, color: TERTIARY }} />
              <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>
                {withPosition.length > 0
                  ? `${withPosition.length} ${withPosition.length === 1 ? 'party has' : 'parties have'} a published position`
                  : 'No published positions yet'}
              </span>
            </div>

            {withPosition.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {withPosition.map((p) => {
                  const colour = PARTY_COLORS[p.slug as PartySlug]?.bg ?? '#6B7280'
                  const name = PARTY_NAMES[p.slug as PartySlug]?.short ?? p.slug
                  return (
                    <Link key={p.slug} href={`/policies/${topic}/${p.slug}`} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none',
                      border: `1px solid ${BORDER}`, borderLeft: `3px solid ${colour}`, borderRadius: 9,
                      padding: '7px 11px', background: '#fff',
                    }}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{name}</span>
                      <span style={{ fontSize: 11.5, color: SECONDARY, fontFamily: MANROPE }}>{p.stance}</span>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>
                Nothing recorded on this issue yet. Following it means you hear when that changes.
              </p>
            )}

            <Link href={`/policies/${topic}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 14,
              fontSize: 12.5, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none',
            }}>
              Compare every party on {open.label} <ArrowRight style={{ width: 13, height: 13 }} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
