'use client'

/**
 * PartyPolicyExplorer — one party's position on every issue, without leaving
 * the page.
 *
 * The party page used to list "policy topics most associated with" a party and
 * send you to /compare when you tapped one. That threw you out of the party you
 * came to read about, into a grid of every party at once, to answer a question
 * you did not ask. This keeps the reader where they are: pick an issue, read
 * what this party says about it, pick another.
 *
 * Same wrapping chip grid the homepage uses, so the motion is already familiar
 * by the time a reader gets here.
 *
 * COVERAGE IS SHOWN, NOT HIDDEN. Topics with no recorded position stay in the
 * grid, marked. Removing them would quietly imply the party has a position on
 * everything we happen to hold, and hide the gaps that the coverage matrix used
 * to make visible.
 */

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, FileText, Info } from 'lucide-react'
import { POLICY_TOPIC_ORDER, POLICY_TOPICS } from '@/constants/policy-topics'
import { TopicChip } from '@/components/homepage/topic-chip'
import { PositionReader } from '@/components/policy/position-reader'
import type { PartyPosition } from '@/lib/positions/live'
import type { PolicyTopic } from '@/types'
import { BORDER, INK, JADE, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

export function PartyPolicyExplorer({ partySlug, partyName, accent, positions, deepDiveTopics }: {
  partySlug: string
  partyName: string
  accent: string
  /** This party's current-policy positions, already filtered by the server. */
  positions: PartyPosition[]
  /** Topics where this party has a long-form breakdown, for the "read more" cue. */
  deepDiveTopics: string[]
}) {
  const byTopic = new Map(positions.map((p) => [p.topic, p]))
  // Open on the first topic we actually hold something for, so the panel never
  // greets a reader with an empty state when there is material to show.
  const firstWithData = POLICY_TOPIC_ORDER.find((t) => byTopic.has(t)) ?? POLICY_TOPIC_ORDER[0]
  const [topic, setTopic] = useState<string>(firstWithData)

  const covered = POLICY_TOPIC_ORDER.filter((t) => byTopic.has(t)).length
  const pos = byTopic.get(topic)
  const meta = POLICY_TOPICS[topic as PolicyTopic]
  const hasDive = deepDiveTopics.includes(topic)

  return (
    <div>
      <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 12px', lineHeight: 1.6 }}>
        Tap an issue to read {partyName}&rsquo;s position on it, in our words with their source.{' '}
        <b style={{ color: INK }}>{covered} of {POLICY_TOPIC_ORDER.length}</b> topics have a recorded position.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        {POLICY_TOPIC_ORDER.map((key) => (
          <span key={key} style={{ position: 'relative', display: 'inline-flex' }}>
            <TopicChip
              topicKey={key}
              active={topic === key}
              onClick={() => setTopic(key)}
              // Dim the ones we hold nothing for. Still tappable — the panel
              // then says plainly that nothing is recorded, which is the honest
              // answer and better than a chip that does nothing.
              style={byTopic.has(key) ? undefined : { opacity: 0.45 }}
            />
          </span>
        ))}
      </div>

      <div style={{ border: `1px solid ${BORDER}`, borderTop: `4px solid ${accent}`, borderRadius: 16, padding: '20px 22px', background: '#fff' }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 12 }}>
          {partyName} on {meta.label}
        </div>

        {pos ? (
          <PositionReader position={pos} accent={accent} topicLabel={meta.label} />
        ) : (
          <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12 }}>
            <Info style={{ width: 18, height: 18, color: '#1e40af', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13.5, color: '#1e3a8a', fontFamily: MANROPE, margin: 0, lineHeight: 1.6 }}>
              <b>We haven&rsquo;t recorded {partyName}&rsquo;s position on {meta.label.toLowerCase()} yet.</b> When they publish
              one we&rsquo;ll summarise it neutrally with the source — every contesting party is covered the same way.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 18, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
          {/* ?from= carries which party page this was opened from, so the hub
              can offer the way back. See BackToParty. */}
          <Link href={`/policies/${topic}/${partySlug}?from=${partySlug}`} style={cta}>
            {hasDive ? 'Full breakdown' : 'Full page'} <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
          <Link href={`/policies/${topic}?from=${partySlug}`} style={{ ...cta, color: SECONDARY }}>
            <FileText style={{ width: 14, height: 14 }} /> Every party on {meta.label.toLowerCase()}
          </Link>
        </div>
      </div>
    </div>
  )
}

const cta: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none',
}
