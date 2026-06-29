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
