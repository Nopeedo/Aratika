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
 *
 * LABELS ARE THE HEADINGS THEY JUMP TO (§1.7, §4). They used to be their own
 * vocabulary: "Your seat" landed on "The seats to watch in 2026" and sat one
 * chip away from "The seats", which landed on "The Parliament you're voting to
 * change" — two chips a reader could not tell apart, neither of them naming
 * where it went. Each label below is now the heading verbatim, or its opening
 * words where the heading runs long. Changing one means changing the other.
 */

export interface ElectionSection {
  /** Matches the `id` on the <section> in upcoming-view.tsx. */
  id: string
  label: string
  /**
   * The dot colour on the floating rail, and nothing else.
   *
   * There used to be a `tint` beside this and the hero chips wore both: a pale
   * fill and a 2px section-coloured border, six different hues in one row. That
   * is a second colour system on a page where colour already means party (the
   * bars in #parties) and status (the red enrolment deadline), which §1.6 rules
   * out — so the chips are one neutral §2.2 treatment now. The rail keeps the
   * per-section ink because there the dot is the ONLY signal: collapsed, six
   * identical grey dots say nothing about which one you are on.
   */
  ink: string
}

export const ELECTION_SECTIONS: ElectionSection[] = [
  // Green, not the strip's own red: #your-seat is already rose (#be123c) and at
  // 11px the two reds are ~20 degrees of hue apart, which is not a difference
  // you can read in a dot. Green sits ~50 degrees off the cyan next to it, and
  // matches the enrol button this section owns.
  { id: 'key-dates', label: 'Key dates', ink: '#15803d' },
  { id: 'your-vote', label: 'How your vote works', ink: '#0e7490' },
  { id: 'parties', label: 'Every party', ink: '#6d28d9' },
  { id: 'seats', label: 'Parliament now', ink: '#1d4ed8' },
  { id: 'your-seat', label: 'Closest races', ink: '#be123c' },
  { id: 'debates', label: 'Leaders & the press', ink: '#b45309' },
]

/** The hero's chip row carries this id so the rail can watch it and only appear
 *  once the chips themselves have scrolled out of view. */
export const HERO_JUMP_ID = 'hero-jump'
