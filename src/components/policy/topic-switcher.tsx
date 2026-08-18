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
 * a page stays shareable and indexable.
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
