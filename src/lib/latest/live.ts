/**
 * What has moved recently — the feed behind the homepage "Latest" section.
 *
 * Two sources, two shapes, one reason to exist: the site tracks candidates and
 * bills, and until now a reader could only learn something had changed by
 * following it and getting a notification. This surfaces the same events on
 * the front page, with a link to the thing that moved.
 *
 * CANDIDATES come from content_items (type='candidate', status='approved'),
 * newest first by the row's creation time — which is when the ingest staged it,
 * and an editor's approval is what makes it show. Cookie-free and cached, for
 * the same reason positions/live.ts and polls/live.ts are: a cookie-bound read
 * would force the homepage to render on every request.
 *
 * BILL MOVEMENTS come from src/constants/bill-movements.json, which
 * scripts/detect-bill-changes.mjs appends to every morning and refresh-bills.yml
 * commits. It is bundled at build time, so it refreshes with the daily deploy —
 * which is also how often the bills data itself changes, so nothing is lost.
 * The bills dataset carries no stage-change dates of its own; the log is the
 * only record of WHEN a bill moved.
 */

import { unstable_cache } from 'next/cache'
import { publicClient } from '@/lib/supabase/public'
import { ELECTORATES } from '@/constants/electorates-data'
import { PARTY_NAMES } from '@/constants/parties'
import movements from '@/constants/bill-movements.json'
import type { PartySlug } from '@/types'

export interface LatestCandidate {
  name: string
  party: PartySlug | 'independent' | null
  partyName: string | null
  electorateSlug: string
  electorateName: string
  /** ISO date the row was created — when the site first recorded them. */
  date: string
  href: string
}

export interface LatestBillMovement {
  slug: string
  title: string
  from: string
  to: string
  /** ISO date the detector saw the change. */
  date: string
  href: string
}

interface CandidateRow {
  created_at: string
  data: { name?: string; party?: string | null; electorateSlug?: string; withdrawn?: unknown } | null
}

const readRecentCandidates = unstable_cache(
  async (): Promise<CandidateRow[]> => {
    // Over-fetch a little: some rows are withdrawn or lack an electorate and get
    // filtered below, and the cap is applied after that.
    const { data } = await publicClient()
      .from('content_items')
      .select('created_at, data')
      .eq('type', 'candidate')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(60)
    return (data as CandidateRow[] | null) ?? []
  },
  ['recent-candidates'],
  { revalidate: 300, tags: ['candidates'] },
)

/** Newest approved candidates, at most `limit`, no older than `days`. */
export async function getLatestCandidates(limit = 6, days = 30): Promise<LatestCandidate[]> {
  const cutoff = new Date(Date.now() - days * 864e5).toISOString()
  const rows = await readRecentCandidates()
  const out: LatestCandidate[] = []
  for (const r of rows) {
    const d = r.data ?? {}
    if (r.created_at < cutoff) break              // ordered newest-first, so we can stop
    if (!d.name || !d.electorateSlug || d.withdrawn) continue
    const info = ELECTORATES[d.electorateSlug]
    if (!info) continue                            // an electorate we have no page for
    const party = (d.party ?? null) as LatestCandidate['party']
    out.push({
      name: d.name,
      party,
      partyName: party && party !== 'independent' ? (PARTY_NAMES[party as PartySlug]?.short ?? party) : party === 'independent' ? 'Independent' : null,
      electorateSlug: d.electorateSlug,
      electorateName: info.name,
      date: r.created_at.slice(0, 10),
      href: `/battlegrounds/${d.electorateSlug}`,
    })
    if (out.length >= limit) break
  }
  return out
}

/** Most recent bill stage changes, at most `limit`, no older than `days`. Sync — bundled JSON. */
export function getLatestBillMovements(limit = 6, days = 60): LatestBillMovement[] {
  const cutoff = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10)
  return (movements as Omit<LatestBillMovement, 'href'>[])
    .filter((m) => m.date >= cutoff)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
    // ?bill= rather than #anchor: the tracker is paginated, and the component
    // reads the param to jump to the right page before scrolling.
    .map((m) => ({ ...m, href: `/bills?bill=${encodeURIComponent(m.slug)}` }))
}
