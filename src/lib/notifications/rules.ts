/**
 * rules.ts — what counts as urgent, and how long routine updates demand attention.
 *
 * Without an expiry the counts stop meaning anything. Measured on the live
 * queue, the busiest account takes a median of 30 updates a day and has peaked
 * at 52; a fortnight away and a single tile would read "40+", which a reader
 * learns to ignore in exactly the way they learned to ignore the red dot.
 *
 * So routine coverage ages out of the count after three days. It is NOT deleted
 * and NOT marked read — it stays on the tracked item's own page, in full. It
 * simply stops asking to be looked at, because election news three days old is
 * not news.
 *
 * Urgent items never age out. They wait until the reader has actually seen them,
 * however long that takes, and they sort above routine coverage so a bill
 * passing cannot be buried under a week of headlines.
 */

/** Categories that are ordinary coverage: plentiful, and stale quickly. */
const ROUTINE = new Set(['news', 'video'])

/**
 * Everything that is not news or video is urgent: movement on legislation, a
 * submission window opening, a new challenger appearing in a battleground, and
 * the electoral calendar. These are rare, dated, and often actionable — the
 * opposite of a headline.
 */
export function isUrgent(category: string): boolean {
  return !ROUTINE.has(category)
}

/** How long a routine item stays in the count. */
export const ROUTINE_WINDOW_DAYS = 3

export interface Ageable {
  category: string
  created_at: string
}

/** Is this still worth showing in a count? */
export function stillCounts(item: Ageable, now = Date.now()): boolean {
  if (isUrgent(item.category)) return true
  const t = Date.parse(item.created_at)
  if (!Number.isFinite(t)) return true // unparseable date: show it rather than silently drop it
  return now - t <= ROUTINE_WINDOW_DAYS * 86_400_000
}

/** Urgent first, then newest — so the rare, actionable thing leads. */
export function byPriority<T extends Ageable>(a: T, b: T): number {
  const ua = isUrgent(a.category) ? 0 : 1
  const ub = isUrgent(b.category) ? 0 : 1
  if (ua !== ub) return ua - ub
  return b.created_at.localeCompare(a.created_at)
}

/** How many an inline panel shows before sending the reader to the full page. */
export const PANEL_LIMIT = 10
