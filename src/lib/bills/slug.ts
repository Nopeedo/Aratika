/**
 * Derive a stable, readable slug for a piece of legislation from its official
 * legislation.govt.nz link, e.g.
 *   https://www.legislation.govt.nz/bill/government/2025/238/en/latest/
 *     -> bill-government-2025-238
 * Computed deterministically (no DB column needed).
 */
export function billSlugFromLink(link: string | null | undefined): string | null {
  if (!link) return null
  const m = link.match(/\/(bill|act)\/([a-z-]+)\/(\d{4})\/(\d+)\b/i)
  if (!m) return null
  return `${m[1]}-${m[2]}-${m[3]}-${m[4]}`.toLowerCase()
}

/** Normalise a bill title for matching across datasets — strip everything but
 *  a-z0-9. The Parliament register, the MP activity lists and our own approved
 *  breakdowns all carry the same titles but punctuate and case them differently,
 *  and they slug differently besides (the register has the Planning Bill as 0235
 *  where our reader has 235), so the title is the only join key that holds. It
 *  lives here rather than in bill-links so a caller can match titles without
 *  pulling the whole 270-bill register in behind it. */
export const normBillTitle = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
