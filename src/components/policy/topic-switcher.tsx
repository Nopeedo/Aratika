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

import Link from 'next/link'
import { POLICY_TOPIC_ORDER, POLICY_TOPICS } from '@/constants/policy-topics'
import { TOPIC_ICONS } from '@/constants/policy-topic-icons'
import type { PolicyTopic } from '@/types'
import { BORDER, INK, MANROPE, TERTIARY } from '@/constants/theme'

// Same hues the homepage chips use, so a topic looks like itself everywhere.
const HUE: Record<string, string> = {
  blue: '#2563eb', orange: '#ea580c', red: '#dc2626', purple: '#7c3aed',
  teal: '#0d9488', green: '#16a34a', slate: '#475569', amber: '#d97706',
  indigo: '#4f46e5', cyan: '#0891b2', violet: '#7c3aed',
}

export function TopicSwitcher({ current }: { current: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {POLICY_TOPIC_ORDER.map((key) => {
        const t = POLICY_TOPICS[key as PolicyTopic]
        const Icon = TOPIC_ICONS[t.icon]
        const hue = t.textColor.match(/text-(\w+)-\d+/)?.[1] ?? 'slate'
        const col = HUE[hue] ?? HUE.slate
        const active = key === current
        return (
          <Link
            key={key}
            href={`/policies/${key}`}
            scroll={false}
            aria-current={active ? 'page' : undefined}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 12.5, fontWeight: 700, fontFamily: MANROPE, textDecoration: 'none',
              padding: '6px 12px', borderRadius: 999,
              color: active ? '#fff' : INK,
              background: active ? col : '#fff',
              border: `1px solid ${active ? col : BORDER}`,
              whiteSpace: 'nowrap',
            }}
          >
            {Icon && <Icon style={{ width: 13, height: 13, color: active ? '#fff' : col, flexShrink: 0 }} />}
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
