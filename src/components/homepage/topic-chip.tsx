'use client'

/**
 * TopicChip — the small bordered issue rectangle used by both homepage issue
 * pickers: the one under "What does {party} stand for?" and the standalone
 * all-parties comparison below the map. Icon + title only, no description, and
 * the icon is "imprinted" (no background box behind it).
 */

import Link from 'next/link'
import {
  Home, Heart, Leaf, GraduationCap, Scale, Globe, Landmark, Wind, TrendingUp, Users,
} from 'lucide-react'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import { TOPIC_ICONS } from '@/constants/policy-topic-icons'
import { INK, MANROPE } from '@/constants/theme'


// Moved to constants/topic-colors.ts so server routes (the OG card) can read
// it — importing a value from a 'use client' module gave a client reference.
export { TOPIC_BORDER_HEX } from '@/constants/topic-colors'
import { TOPIC_BORDER_HEX } from '@/constants/topic-colors'

export function TopicChip({ topicKey, active, onClick, href, style }: {
  topicKey: string
  active: boolean
  /** Required unless `href` is given. */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  /**
   * Render as a link instead of a button. The policy hub uses the chip to
   * navigate, and a button that calls router.push looks identical but cannot be
   * middle-clicked, opened in a new tab, or read as a link by a screen reader.
   */
  href?: string
  style?: React.CSSProperties
}) {
  const t = POLICY_TOPICS[topicKey as keyof typeof POLICY_TOPICS]
  const Icon = TOPIC_ICONS[t.icon]
  const hue = t.textColor.match(/text-(\w+)-\d+/)?.[1] ?? 'slate'
  const b = TOPIC_BORDER_HEX[hue] ?? TOPIC_BORDER_HEX.slate
  const shared: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '9px 14px', borderRadius: 12, borderStyle: 'solid',
    borderWidth: active ? 3 : 2, borderColor: active ? b.active : b.rest,
    cursor: 'pointer', fontFamily: MANROPE, transformOrigin: '0 0',
    textDecoration: 'none',
    ...style,
  }
  const inner = (
    <>
      {Icon && <Icon className={`size-4 ${t.textColor}`} />}
      <span style={{ fontSize: 14, fontWeight: 800, color: INK, whiteSpace: 'nowrap' }}>{t.label}</span>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={`ap-chip ${t.color}`} style={shared}>
        {inner}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      // Stable hook so the chip can be shrunk at narrow widths from CSS —
      // media queries cannot live in an inline style object.
      className={`ap-chip ${t.color}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '9px 14px', borderRadius: 12, borderStyle: 'solid',
        borderWidth: active ? 3 : 2, borderColor: active ? b.active : b.rest,
        cursor: 'pointer', fontFamily: MANROPE, transformOrigin: '0 0',
        ...style,
      }}
    >
      {Icon && <Icon className={`size-4 ${t.textColor}`} />}
      <span style={{ fontSize: 14, fontWeight: 800, color: INK, whiteSpace: 'nowrap' }}>{t.label}</span>
    </button>
  )
}
