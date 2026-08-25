/**
 * Per-module colour for Arapono Learn — the same tint-plus-deep-ink language the
 * hub tiles and topic chips use, so Learn looks like a room in the same house
 * rather than a separate product. The pairs are drawn from the palette already
 * on /hub; where a module has an obvious sibling there it borrows that colour
 * (voting modules take the "Get ready to vote" cyan, the bills module takes The
 * Record's fuchsia, Parliament takes Learn's own amber from the hub tile).
 *
 * Read through learnTheme(), never directly: a module added without an entry
 * here degrades to the site jade instead of crashing the card — the "list that
 * didn't grow" failure, defused with a fallback rather than left to throw.
 */

export interface LearnTheme {
  /** Pale card fill. */
  tint: string
  /** Deep 700-level hue for border, icon and the call-to-action line. */
  ink: string
}

const THEMES: Record<string, LearnTheme> = {
  'mmp': { tint: '#ecfeff', ink: '#0e7490' },
  'how-to-vote': { tint: '#f0fdfa', ink: '#0f766e' },
  'electorate-vs-list': { tint: '#fef1f2', ink: '#be123c' },
  'government-formation': { tint: '#eff4ff', ink: '#1d4ed8' },
  'what-is-parliament': { tint: '#fffbeb', ink: '#b45309' },
  'roles': { tint: '#f5f3ff', ink: '#6d28d9' },
  'how-a-bill-becomes-law': { tint: '#fdf3ff', ink: '#a21caf' },
  'select-committees': { tint: '#fff6ed', ink: '#c2410c' },
  'have-your-say': { tint: '#fff1f1', ink: '#b91c1c' },
  'how-policies-work': { tint: '#ecfdf3', ink: '#15803d' },
}

const FALLBACK: LearnTheme = { tint: '#ecfdf5', ink: '#1F8A4C' }

export function learnTheme(moduleId: string): LearnTheme {
  return THEMES[moduleId] ?? FALLBACK
}
