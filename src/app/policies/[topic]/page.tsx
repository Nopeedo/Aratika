/**
 * /policies/[topic] — per-topic party comparison.
 * Topic explainer + which parties prioritise it (linked to party pages).
 * Detailed party position statements are sourced from official party policy
 * documents and shown as they are compiled.
 */

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { BackToParty } from '@/components/policy/back-to-party'
import { notFound } from 'next/navigation'
import { Info } from 'lucide-react'
import { POLICY_TOPICS, POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import { TOPIC_ICONS } from '@/constants/policy-topic-icons'
import { TOPIC_BORDER_HEX } from '@/constants/topic-colors'
import { PolicyTopic } from '@/types'
import { BookmarkButton } from '@/components/bookmarks/bookmark-button'
import { getApprovedPositions } from '@/lib/positions/live'
import { TopicSwitcher } from '@/components/policy/topic-switcher'
import { FloatingTopicPill } from '@/components/policy/floating-topic-pill'
import { TopicBackground } from '@/components/policy/topic-background'
import { TopicInfoButton } from '@/components/policy/topic-info-button'
import { PolicyComparison } from '@/components/policy/policy-comparison'
import { PolicyCoverage } from '@/components/policy/policy-coverage'
import { BillsForTopic } from '@/components/bills/bills-for-topic'
import { INK, JADE, MANROPE, SECONDARY } from '@/constants/theme'


export function generateStaticParams() {
  return POLICY_TOPIC_ORDER.map((topic) => ({ topic }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ topic: string }> },
): Promise<Metadata> {
  const { topic } = await params
  const t = POLICY_TOPICS[topic as PolicyTopic]
  if (!t) return { title: 'Policy topic not found' }
  return { title: `${t.label}: party positions`, description: t.longDescription }
}

export default async function PolicyTopicPage(
  { params }: { params: Promise<{ topic: string }> },
) {
  const { topic } = await params
  const t = POLICY_TOPICS[topic as PolicyTopic]
  if (!t) notFound()
  const Icon = TOPIC_ICONS[t.icon]
  const hue = t.textColor.match(/text-(\w+)-\d+/)?.[1] ?? 'slate'
  const topicBorder = TOPIC_BORDER_HEX[hue] ?? TOPIC_BORDER_HEX.slate


  const positions = await getApprovedPositions(topic)

  return (
    // The homepage weave, washed with THIS topic's colour (the same hue its
    // pill wears) through the comparison, fading out below it.
    <TopicBackground color={topicBorder.rest}>

      {/* Header */}
      {/* No hairline under the header — removed by request; the header and
          the content share the same woven ground. */}
      <div>
        {/* Small bottom padding: the comparison should sit snug under the
            subtext, not a section-break away from it. */}
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px clamp(18px, 5vw, 36px) 6px' }}>
          {/* Only renders when ?from= names a party — i.e. the reader came
              here from that party's own policy section and may want to go
              back. Suspense keeps this page static. */}
          <div style={{ marginBottom: 14 }}><Suspense fallback={null}><BackToParty /></Suspense></div>

          {/* Page title. The topic used to be the h1, which read as if each
              issue were its own page; this IS the comparison page, and the
              topic below is which slice of it you're on. */}
          <h1 style={{ fontSize: 'clamp(28px, 7vw, 36px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 18px', lineHeight: 1.15 }}>
            Party Policy Comparison
          </h1>

          {/* No "All policy topics" link any more. /policies redirects here, so
              it pointed at the page you were already on. The chip row below is
              the topic navigation, and it is always in reach. */}
          {/* Every issue, so a reader can pivot topic without backing out to
              the index — the mirror of the party switcher on /parties/[slug].
              Sits right under the page title, ABOVE the topic block: pick an
              issue first, then see which one you're on. It is navigation, so it
              belongs with the title it changes, not between the description
              and the content. */}
          <div style={{ marginBottom: 22 }}>
            <TopicSwitcher current={topic} />
          </div>

          <div className="topic-head" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* The topic, as a large clone of the pill above that picked it —
                same tint, same coloured border, icon + name — so the header
                says "this one" in the same language as the switcher. Not a
                link; it is the heading. */}
            <h2
              className={t.color}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 12,
                padding: '10px 22px 10px 18px', borderRadius: 999,
                border: `3px solid ${topicBorder.active}`,
                // Always one line. The long labels ("Democracy & Government")
                // take a smaller size so they still fit a phone in one line
                // rather than breaking the pill into two.
                fontSize: t.label.length > 16 ? 'clamp(17px, 4.9vw, 30px)' : 'clamp(24px, 6.5vw, 32px)',
                fontWeight: 800, letterSpacing: '-.02em',
                color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.15,
                maxWidth: '100%', whiteSpace: 'nowrap',
              }}
            >
              {Icon && <Icon className={`size-7 ${t.textColor}`} style={{ flexShrink: 0 }} />}
              <span>{t.label}</span>
            </h2>
            {/* Soft (i): opens the "What this covers" bubble — the topic's
                scope plus the definitions the page relies on. */}
            <TopicInfoButton topicLabel={t.label} covers={t.longDescription} accent={topicBorder.active} />
          </div>
          {/* Plain subtext, not a heading: says what the list below is.
              Does NOT name the topic: the pill above already does, and
              "…on Democracy & Government" wrapped to a second line on a phone
              while "…on Health" didn't, so switching topic shifted everything
              beneath by a line even with scroll kept. One line, every topic,
              every device. */}
          <p style={{ fontSize: 15, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: '12px 0 0', lineHeight: 1.45, whiteSpace: 'nowrap' }}>
            Where each party stands on this issue
          </p>
        </div>
      </div>

      {/* Once the title pill scrolls off, a copy of it pins bottom-right with
          the other topics one tap away. */}
      <FloatingTopicPill topic={topic} />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '10px clamp(18px, 5vw, 36px) 64px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Everything below the chips fades in on a topic change. `key` is the
            topic, so React remounts this subtree and the animation replays;
            without it the content swaps in one frame and, now that the page no
            longer scrolls to the top, there is nothing at all to tell a reader
            it changed. 140ms — long enough to read as a transition, short
            enough that it never becomes the thing you are waiting for.
            Honoured by prefers-reduced-motion in globals.css. */}
        <div key={topic} className="topic-swap" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Detailed party-by-party comparison. The id marks where the
            background wash ends (TopicBackground measures it). */}
        <div id="topic-content">
        {positions.length > 0 ? (
          <PolicyComparison positions={positions} topicLabel={t.label} topic={topic} />
        ) : (
          <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12 }}>
            <Info style={{ width: 16, height: 16, color: '#1e40af', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12.5, color: '#1e3a8a', fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>
              <b>Detailed party-by-party positions are being compiled.</b> Side-by-side position statements and
              plain-language summaries for each party on {t.label.toLowerCase()} will appear here, summarised
              neutrally from official party policy and editor-checked — never paraphrased without attribution.
            </p>
          </div>
        )}
        </div>

        {/* Coverage at a glance, moved up from the foot of the page by
            request: it sits directly under the party cards it summarises,
            where "who has a position on what" answers the question the cards
            above just raised, rather than after the bills and the track
            button where nobody had got to it. */}
        <PolicyCoverage maxWidth={1000} />

        {/* Track — moved out of the header by request. Sits after the
            comparison, just above the scope note, so the header is title →
            pills → topic and nothing else. */}
        <div>
          <BookmarkButton entity={{
            kind: 'policy', refId: topic, label: t.label,
            sublabel: 'Policy topic', href: `/policies/${topic}`, accent: JADE,
          }} />
        </div>

        {/* "What this covers" is no longer a card here — it lives in the (i)
            bubble beside the topic pill in the header (TopicInfoButton), with
            the sourcing and grouping definitions alongside it. */}

        {/* What's been legislated this term (bills → record, beside the comparison) */}
        <BillsForTopic topic={topic as PolicyTopic} label={t.label} />

        </div>

        {/* The "Sources" footnote is gone from the foot of the page, by
            request. Nothing is lost: every position carries its own dated
            source link, and how the positions are sourced is in the (i)
            bubble beside the topic pill at the top. */}
      </div>
    </TopicBackground>
  )
}
