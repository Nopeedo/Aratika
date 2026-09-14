/**
 * Live polls — reads editor-entered `poll` items from content_items (status
 * 'approved', so RLS only ever returns reviewed rows). Falls back to the bundled
 * RECENT_POLLS when nothing has been entered yet, so the site never blanks.
 *
 * Editors add/update/remove polls at /editor/polls; the poll-of-polls average and
 * seat projection are computed from whatever this returns (see polls-data.ts).
 */

import { unstable_cache } from 'next/cache'
import { publicClient } from '@/lib/supabase/public'
import { RECENT_POLLS, type Poll } from '@/constants/polls-data'
import type { PartySlug } from '@/types'

interface Row { data: Record<string, unknown> | null; source_url: string | null }

function toPoll(r: Row): Poll | null {
  const d = r.data ?? {}
  if (typeof d.pollster !== 'string') return null
  const parties = (d.parties && typeof d.parties === 'object' ? d.parties : {}) as Record<string, unknown>
  const clean: Partial<Record<PartySlug, number>> = {}
  for (const [k, v] of Object.entries(parties)) {
    if (typeof v === 'number' && isFinite(v)) clean[k as PartySlug] = v
  }
  return {
    pollster: d.pollster,
    fieldwork: typeof d.fieldwork === 'string' ? d.fieldwork : '',
    date: typeof d.date === 'string' ? d.date : '',
    sourceUrl: typeof d.sourceUrl === 'string' ? d.sourceUrl : (r.source_url ?? ''),
    parties: clean,
    ...(typeof d.others === 'number' && isFinite(d.others) ? { others: d.others } : {}),
  }
}

/**
 * Identity of a polling company, for "one poll per company".
 *
 * The old key was `pollster.trim().toLowerCase()`, which treats "RNZ-Reid
 * Research" and "RNZ–Reid Research" as two different companies — an ASCII
 * hyphen against an en dash, indistinguishable on screen. Both had been entered
 * at /editor/polls for the same 21 August poll, and the same happened to
 * Taxpayers' Union–Curia on 4 August. Each survived the dedupe, so the table
 * listed eight polls from six companies and the poll-of-polls averaged RNZ and
 * Curia twice. It was visible as a repeated row, but the damage was in the
 * average, where nothing looked wrong at all.
 *
 * So the key folds every dash variant to a hyphen, curly apostrophes to
 * straight, and runs of whitespace to one space. Anything that reads as the
 * same company name now counts as the same company, whichever characters an
 * editor's keyboard produced.
 */
function pollsterKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[‐-―−]/g, '-')   // ‐ ‑ ‒ – — ― and the minus sign
    .replace(/[‘’ʼ]/g, "'")    // ' ' ʼ
    .replace(/\s+/g, ' ')
    .trim()
}

/** Tie-break for two entries of the same poll, in priority order:
 *
 *  1. MORE PARTY FIGURES WINS. Completeness beats typography — one copy of a
 *     duplicate can be missing a party the other has, and showing the thinner
 *     record means a party silently reads as unpolled. That happened: the
 *     ingest dropped The Opportunities Party for a month (Wikipedia relabelled
 *     the column TOP -> OPP), and the two copies of the 21 Aug RNZ–Reid poll
 *     disagreed about whether TOP existed at all.
 *  2. Then the typographic dash, so the rendered name is the nicer one.
 *  3. Then the name itself, so the result is DETERMINISTIC. The previous
 *     version returned false whenever both names carried a dash, leaving the
 *     winner to be whatever order the database happened to return.
 */
function preferDisplay(candidate: Poll, current: Poll): boolean {
  const n = (p: Poll) => Object.keys(p.parties).length
  if (n(candidate) !== n(current)) return n(candidate) > n(current)
  const dashed = (s: string) => /[–—]/.test(s)
  if (dashed(candidate.pollster) !== dashed(current.pollster)) return dashed(candidate.pollster)
  return candidate.pollster < current.pollster
}

/**
 * Cookie-free and cached, for the same reason positions/live.ts is.
 *
 * This used to go through the cookie-bound server client. Reading cookies opts
 * every route that calls it into dynamic rendering, and this is on the election
 * centre's critical path — so /elections/2026 was rendered from scratch on every
 * request, 2.3–2.6 seconds per RSC fetch measured against production. A reader
 * who clicked through from the homepage while scrolled down sat on the old page
 * at the old scroll position for that long, then the new page snapped to top.
 * That is the "page shifts on every click" the site was showing.
 *
 * Approved polls are public data: RLS lets anon read them, there is nothing
 * per-user in them, and a minute of lag is invisible for figures that change
 * a few times a month. The anon key is the right client and the cache is safe.
 */
const readApprovedPolls = unstable_cache(
  async (): Promise<Row[]> => {
    const { data } = await publicClient()
      .from('content_items')
      .select('data, source_url')
      .eq('type', 'poll')
      .eq('status', 'approved')
      .limit(100)
    return (data as Row[] | null) ?? []
  },
  ['approved-polls'],
  { revalidate: 60, tags: ['polls'] },
)

/** Approved polls, newest first, ONE per pollster (their most recent). Keeps the
 *  poll-of-polls methodologically sound as polls accumulate — a prolific pollster
 *  is never double-counted, matching the bundled "latest per company" snapshot.
 *  Falls back to the bundled set if none have been entered. */
export async function getPolls(): Promise<Poll[]> {
  const polls = (await readApprovedPolls()).map(toPoll).filter((p): p is Poll => !!p)
  if (polls.length === 0) return RECENT_POLLS

  // Keep only each pollster's most recent poll.
  const latestByPollster = new Map<string, Poll>()
  for (const p of polls) {
    const key = pollsterKey(p.pollster)
    const prev = latestByPollster.get(key)
    // Strictly newer wins, so an equal-dated pair is decided by the tie-break
    // below rather than by whatever order the rows came back in.
    if (!prev) { latestByPollster.set(key, p); continue }
    const a = p.date ?? '', b = prev.date ?? ''
    if (a > b || (a === b && preferDisplay(p, prev))) latestByPollster.set(key, p)
  }
  return [...latestByPollster.values()].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
}
