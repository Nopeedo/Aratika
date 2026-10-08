/**
 * The pledge totals, cached.
 *
 * This number is read on every render of the homepage card, so it must not be a
 * database round trip per visitor. This site has already taken down its own
 * Supabase project once by letting a hot path query on every request, so the
 * count goes through unstable_cache with a short window: the number is allowed
 * to be up to a minute stale, which nobody can perceive on a counter that moves
 * a few times an hour.
 *
 * TWO NUMBERS, ALWAYS. `total` is every pledge. `verified` is the subset that
 * gave an email, which is the figure to quote when someone asks how this was
 * counted: an address is unique in the table, where a cookie is defeated by a
 * private window. Reporting one without the other would overstate what the site
 * can actually stand behind.
 *
 * This counted signed-in accounts before the pledge took an email. An address
 * is the stronger key and covers far more pledges, and /api/pledge counts
 * `verified` the same way — the two must not drift.
 */

import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export const PLEDGE_GOAL = 100000

export interface PledgeTotals {
  total: number
  verified: number
  /** False when the table is missing or Supabase is unreachable. */
  ok: boolean
}

export const PLEDGE_CACHE_TAG = 'pledges'

async function read(): Promise<PledgeTotals> {
  try {
    const sb = createAdminClient()
    // head:true returns the count without any rows, so this costs almost no
    // egress regardless of how large the table gets.
    const [all, signed] = await Promise.all([
      sb.from('pledges').select('id', { count: 'exact', head: true }),
      sb.from('pledges').select('id', { count: 'exact', head: true }).not('email', 'is', null),
    ])
    if (all.error || signed.error) return { total: 0, verified: 0, ok: false }
    return { total: all.count ?? 0, verified: signed.count ?? 0, ok: true }
  } catch {
    // Missing env in a local build, table not migrated yet, network down. The
    // card renders its own empty state rather than throwing the page away.
    return { total: 0, verified: 0, ok: false }
  }
}

export const getPledgeTotals = unstable_cache(read, ['pledge-totals'], {
  revalidate: 60,
  tags: [PLEDGE_CACHE_TAG],
})
