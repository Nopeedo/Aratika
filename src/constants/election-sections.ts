/**
 * The Election Centre's sections, in page order — the ONE list.
 *
 * This existed twice by accident: the hero's jump chips carried their own copy,
 * so when #parliament was folded into #seats the section stopped existing and
 * the chip pointing at it stayed, doing nothing when tapped, for two commits.
 * Removing a section and updating a list of sections are separate edits and
 * nothing forces the second. Now the hero chips and the floating rail read the
 * same array, so a section can only go missing from both at once.
 *
 * Order here IS the order on the page. If a section moves in
 * components/elections/upcoming-view.tsx, move it here too — the rail highlights
 * by scroll position, so a list out of order shows the wrong section as current.
 */

export interface ElectionSection {
  /** Matches the `id` on the <section> in upcoming-view.tsx. */
  id: string
  label: string
  /** Pale fill and the deep 700-level ink used for border, dot and text. */
  tint: string
  ink: string
}

export const ELECTION_SECTIONS: ElectionSection[] = [
  // Green, not the strip's own red: #your-seat is already rose (#be123c) and at
  // 11px the two reds are ~20 degrees of hue apart, which is not a difference
  // you can read in a dot. Green sits ~50 degrees off the cyan next to it, and
  // matches the enrol button this section owns.
  { id: 'key-dates', label: 'Key dates', tint: '#ecfdf3', ink: '#15803d' },
  { id: 'your-vote', label: 'Your vote', tint: '#ecfeff', ink: '#0e7490' },
  { id: 'parties', label: 'The parties', tint: '#f5f3ff', ink: '#6d28d9' },
  { id: 'seats', label: 'The seats', tint: '#eff4ff', ink: '#1d4ed8' },
  { id: 'your-seat', label: 'Your seat', tint: '#fef1f2', ink: '#be123c' },
  { id: 'debates', label: 'Watch', tint: '#fffbeb', ink: '#b45309' },
]

/** The hero's chip row carries this id so the rail can watch it and only appear
 *  once the chips themselves have scrolled out of view. */
export const HERO_JUMP_ID = 'hero-jump'
