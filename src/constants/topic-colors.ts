/**
 * topic-colors.ts — deep border colours per policy topic hue.
 *
 * Lives here rather than in topic-chip.tsx because that file is 'use client':
 * importing this map into a server route (the Open Graph card generator) gave a
 * client reference instead of the object, and every lookup came back undefined.
 *
 * Keyed by the Tailwind hue in each topic's textColor ("text-orange-700" ->
 * "orange"). Real hex values, NOT a class string built with .replace() —
 * Tailwind's scanner only emits CSS for class names written literally in source,
 * so a runtime-built "border-orange-700" never compiles and the border silently
 * falls back to black. `active` is a shade darker so a selected chip stands out.
 */
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

/** The pill's FILL per hue — Tailwind's `-100` shade, the same as the
 *  `bg-{hue}-100` class each topic carries in POLICY_TOPICS. Used as the
 *  FALLBACK inside var(--color-{hue}-100, …) below: Tailwind v4 defines its
 *  palette in oklch and these v3 hexes are a hair off, so the live value comes
 *  from Tailwind's own theme variable and matches the pill exactly. */
export const TOPIC_BG_HEX: Record<string, string> = {
  blue: '#dbeafe',
  orange: '#ffedd5',
  red: '#fee2e2',
  green: '#dcfce7',
  purple: '#f3e8ff',
  slate: '#f1f5f9',
  cyan: '#cffafe',
  amber: '#fef3c7',
  teal: '#ccfbf1',
  indigo: '#e0e7ff',
}

/** Both colours for a topic key, looked up the way TopicChip does it (hue
 *  parsed from the topic's textColor class). */
export function topicColors(textColor: string): { border: string; bg: string } {
  const hue = textColor.match(/text-(\w+)-\d+/)?.[1] ?? 'slate'
  return {
    border: (TOPIC_BORDER_HEX[hue] ?? TOPIC_BORDER_HEX.slate).rest,
    bg: `var(--color-${hue in TOPIC_BG_HEX ? hue : 'slate'}-100, ${TOPIC_BG_HEX[hue] ?? TOPIC_BG_HEX.slate})`,
  }
}
