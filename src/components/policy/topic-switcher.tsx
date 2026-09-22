/**
 * TopicSwitcher — move between issues without going back to the index.
 *
 * The mirror image of PartySwitcher. Together they give the two policy views the
 * same navigation model, one axis each:
 *
 *   /parties/[slug]     party switcher -> topic chips -> that party's position
 *   /policies/[topic]   topic chips    -> every party -> their positions
 *
 * Before this, changing topic meant backing out to /policies, which is what made
 * the two pages feel like separate places rather than two views of one dataset.
 *
 * Plain links, same reasoning as PartySwitcher: each topic keeps its own URL, so
 * a page stays shareable and indexable. They are also what tracked topics and
 * notification deep-links point at, so they are not decoration.
 *
 * scroll={false} is what makes this feel instant, and it is worth recording why,
 * because the obvious diagnosis was wrong. Switching topic was reported as
 * "loading" — but the route is statically prerendered and prefetched, and the
 * swap measures 34-71ms on production. Nothing loads. What happened was the
 * scroll position resetting to the top on every navigation: tap a chip from
 * halfway down the page and you are thrown back to the header, which reads as a
 * reload whether or not anything was fetched. Staying put keeps the chip row
 * under the reader's thumb while the content beneath it changes, which is the
 * behaviour the party page gets for free by never navigating at all.
 *
 * The alternative considered was the party page's approach — hold every topic
 * in client state and switch with useState. That would have shipped all 116
 * approved positions (99KB trimmed, ~28KB gzipped) to every reader including
 * one who opens a single topic, to remove a delay that was already 34ms, and it
 * would have left the URL saying "economy" while the page showed housing.
 */

import { POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import { TopicChip } from '@/components/homepage/topic-chip'

/**
 * Renders the SAME chips as the homepage issue picker (TopicChip, link mode),
 * so a topic looks like itself everywhere: tinted fill, coloured border, the
 * current one drawn heavier. It used to be a separate white-pill design that
 * only matched the homepage on hue.
 */
export function TopicSwitcher({ current }: { current: string }) {
  return (
    // .topic-switcher shrinks the chips to the pill size this row always had
    // (see globals.css) — the homepage chips are sized for a picker that IS
    // the content; here they are a nav row above it.
    <div className="topic-switcher" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {POLICY_TOPIC_ORDER.map((key) => (
        <TopicChip key={key} topicKey={key} active={key === current} href={`/policies/${key}`} keepScroll />
      ))}
    </div>
  )
}
