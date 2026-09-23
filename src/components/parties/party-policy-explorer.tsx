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
import { ArrowRight, FileText } from 'lucide-react'
import { POLICY_TOPIC_ORDER, POLICY_TOPICS } from '@/constants/policy-topics'
import { TopicChip } from '@/components/homepage/topic-chip'
import { PositionReader } from '@/components/policy/position-reader'
import type { PartyPosition } from '@/lib/positions/live'
import type { PolicyTopic } from '@/types'
import { BORDER, INK, JADE, MANROPE, TERTIARY } from '@/constants/theme'

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
  // Nothing selected to begin with. This used to open on the first topic we
  // held something for, which meant the party page always carried one issue's
  // full panel — several hundred words and a Plain/Detailed control — chosen
  // by list order rather than by the reader. It pushed everything below it
  // down and answered a question nobody had asked. Closed, the control is a
  // row of chips; the panel is what a tap buys you.
  const [topic, setTopic] = useState<string | null>(null)

  // The "{covered} of 11" count moved to the card header's (i), which is where
  // the standfirst that carried it went (§1.2). The page computes it there.
  const pos = topic ? byTopic.get(topic) : undefined
  const meta = topic ? POLICY_TOPICS[topic as PolicyTopic] : null
  const hasDive = !!topic && deepDiveTopics.includes(topic)

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: EXPLORER_CSS }} />
      {/* The standfirst that sat here ("Tap an issue to read {party}'s position
          on it, in our words with their source. {covered} of 11 topics have a
          recorded position.") is behind the (i) on this card's header. It was
          three lines of instruction above a row of chips that explains itself,
          which is §1.2's test verbatim: a reader who has been here before skips
          it. The count went with it rather than being dropped (§5.17) — the
          bubble states it, and the dimmed chips show it. */}

      {/* topic-switcher: §2.2's shared rule, so this row and the identical row
          on /policies/[topic] are one size instead of two. It was on the loose
          .ap-chip rule (7px 11px at 13px on a phone) while the other was on the
          switcher's (4px 9px at 11.5px), which is the precise thing §2.2 exists
          to stop. Measured: eleven chips packed at 44px a row came to 304px of
          picker before any content. */}
      <div className={`topic-switcher pp-topics${topic ? ' pp-picked' : ''}`} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        {POLICY_TOPIC_ORDER.map((key) => (
          <span key={key} style={{ position: 'relative', display: 'inline-flex' }}>
            <TopicChip
              topicKey={key}
              active={topic === key}
              // Tapping the open one closes it, so the reader can put the
              // panel away again without picking something else.
              onClick={() => setTopic((c) => (c === key ? null : key))}
              // Dim the ones we hold nothing for. Still tappable — the panel
              // then says plainly that nothing is recorded, which is the honest
              // answer and better than a chip that does nothing.
              style={byTopic.has(key) ? undefined : { opacity: 0.45 }}
            />
          </span>
        ))}
      </div>

      {topic && meta && (
      <div className="pp-panel" style={{ border: `1px solid ${BORDER}`, borderTop: `4px solid ${accent}`, borderRadius: 16, padding: '20px 22px', background: '#fff' }}>
        <div className="pp-panel-eyebrow" style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 12 }}>
          {partyName} on {meta.label}
        </div>

        {pos ? (
          <PositionReader position={pos} accent={accent} topicLabel={meta.label} />
        ) : (
          /* Unboxed. This was a #eff6ff / #bfdbfe / #1e3a8a info card, a
             fourth visual idiom on a page that already had three, in colours
             that are in no other redesigned page and not in theme.ts. §1.5
             says the gap has to be named, not that it needs a frame: the words
             do the work, in TERTIARY, the way the coverage columns state their
             own gaps. */
          <p className="pp-gap" style={{ fontSize: 13.5, color: TERTIARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.6, maxWidth: '66ch' }}>
            <b style={{ color: INK }}>We haven&rsquo;t recorded {partyName}&rsquo;s position on {meta.label.toLowerCase()} yet.</b>{' '}
            That is a gap in what we hold, not a statement that they have no view. When they publish
            one we&rsquo;ll summarise it neutrally with the source, every contesting party is covered
            the same way.
          </p>
        )}

        <div className="pp-panel-foot" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 18, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
          {/* ?from= carries which party page this was opened from, so the hub
              can offer the way back. See BackToParty. */}
          <Link href={`/policies/${topic}/${partySlug}?from=${partySlug}`} className="pp-cta" style={cta}>
            {/* §4: name the party and name the topic. "Full breakdown" and
                "Full page" named neither, and the two sat 40px apart from a
                second link that also went to the policy hub. */}
            {hasDive ? `${partyName} on ${meta.label}, in full` : `${partyName}’s full page on ${meta.label}`} <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
          <Link href={`/policies/${topic}?from=${partySlug}`} className="pp-cta" style={{ ...cta, color: TERTIARY }}>
            <FileText style={{ width: 14, height: 14 }} /> Every party on {meta.label.toLowerCase()}
          </Link>
        </div>
      </div>
      )}
    </div>
  )
}

const cta: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none',
}

/* Shipped with the component (§3.2), because everything it sizes is an inline
   style and a stylesheet cannot reach one.

   The CHIPS are not resized at any width: they are §2.2's shared control and a
   per-row override is what §2.2 exists to prevent. What grows at the breakpoint
   is the panel, which is the only thing here that is a container rather than a
   control — 20/22 of padding and 15px of body type inside a 968px card read as
   a phone panel that had been stretched (§5.19).

   The first three rules are a defence, not a size, and they are what wearing
   §2.2's shared rule costs on a row of BUTTONS rather than links:

   - globals.css fades `.topic-switcher .ap-chip:not([aria-current])` to 55%,
     which is right on /policies/[topic], where the chips are links and the
     current one carries aria-current. These are buttons carrying aria-pressed,
     so nothing here ever carries aria-current and the entire row would render
     at 55% with nothing selected. Cancelled, then reinstated below on the
     reader's own terms: the row only recedes once a topic HAS been picked, so
     dimming always means "not this one" and never "nothing yet".
   - the same rule forces `border-width: 2px`, which flattens the 3px border
     TopicChip draws on the active chip. Without it nothing marks the selection
     at all: the active border COLOUR is inline and survives, the width is not.

   Four class selectors so these outrank the globals rules outright rather than
   relying on source order, which §5.5 warns is what decides between equal
   weights. The inline 0.45 on a topic we hold nothing for still wins over the
   dimming, because it is inline. */
const EXPLORER_CSS = `
.topic-switcher.pp-topics .ap-chip:not([aria-current]) { opacity: 1; }
.topic-switcher.pp-topics .ap-chip[aria-pressed="true"] { border-width: 3px !important; }
.topic-switcher.pp-topics.pp-picked .ap-chip[aria-pressed="false"] { opacity: .55; }
.topic-switcher.pp-topics.pp-picked .ap-chip[aria-pressed="false"]:hover,
.topic-switcher.pp-topics.pp-picked .ap-chip[aria-pressed="false"]:focus-visible { opacity: 1; }
@media (min-width: 768px) {
  .pp-panel { padding: 26px 30px !important; border-radius: 20px !important; }
  .pp-panel-eyebrow { font-size: 13px !important; margin-bottom: 16px !important; }
  .pp-gap { font-size: 15px !important; }
  .pp-panel-foot { margin-top: 22px !important; padding-top: 18px !important; gap: 20px !important; }
  .pp-cta { font-size: 14.5px !important; }
  .pp-cta svg { width: 16px !important; height: 16px !important; }
}
`
