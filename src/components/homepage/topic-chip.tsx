'use client'

/**
 * TopicChip — the small bordered issue rectangle used by both homepage issue
 * pickers: the one under "What does {party} stand for?" and the standalone
 * all-parties comparison below the map. Icon + title only, no description, and
 * the icon is "imprinted" (no background box behind it).
 */

import {
  Home, Heart, Leaf, GraduationCap, Scale, Globe, Landmark, Wind, TrendingUp, Users,
} from 'lucide-react'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import { INK } from '@/constants/theme'

const TOPIC_ICONS: Record<string, React.ElementType> = { Home, Heart, TrendingUp, Leaf, GraduationCap, Scale, Globe, Landmark, Wind, Users }
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

// Deep border colours keyed by the Tailwind hue in each topic's textColor
// (e.g. "text-orange-700" → "orange"). Real hex values, NOT a class string
// built with .replace() — Tailwind's scanner only emits CSS for class names
// written literally in source, so a runtime-built "border-orange-700" never
// gets compiled and the border silently falls back to plain black. `active`
// is a shade darker so the selected chip stands out from the resting state.
export const TOPIC_BORDER_HEX: Record<string, { rest: string; active: string }> = {
  blue: { rest: '#1d4ed8', active: '#1e3a8a' },
  orange: { rest: '#c2410c', active: '#7c2d12' },
  red: { rest: '#b91c1c', active: '#7f1d1d' },
  green: { rest: '#15803d', active: '#14532d' },
  purple: { rest: '#7e22ce', active: '#581c87' },
  slate: { rest: '#334155', active: '#0f172a' },
  cyan: { rest: '#0e7490', active: '#164e63' },
  amber: { rest: '#b45309', active: '#78350f' },
  teal: { rest: '#0f766e', active: '#134e4a' },
  indigo: { rest: '#4338ca', active: '#312e81' },
}

export function TopicChip({ topicKey, active, onClick, style }: {
  topicKey: string
  active: boolean
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  style?: React.CSSProperties
}) {
  const t = POLICY_TOPICS[topicKey as keyof typeof POLICY_TOPICS]
  const Icon = TOPIC_ICONS[t.icon]
  const hue = t.textColor.match(/text-(\w+)-\d+/)?.[1] ?? 'slate'
  const b = TOPIC_BORDER_HEX[hue] ?? TOPIC_BORDER_HEX.slate
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={t.color}
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
