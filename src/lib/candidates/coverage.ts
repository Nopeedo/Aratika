/**
 * candidates/coverage.ts — the news and video that names a specific candidate.
 *
 * A battleground page already carries an electorate-level feed, but that answers
 * "what is happening in this seat", not "who is this person and what have they
 * said". For a challenger those are very different questions, and the second one
 * is the one a voter has when they open a candidate they have never heard of.
 *
 * Nothing here is written for this page. It is a filtered view of the same
 * content_items feed the site runs on, joined through data.candidates — the tag
 * scripts/candidate-terms.mjs writes, keyed on the candidate ingest's own
 * source_id, so a story links back to the record it was matched against.
 *
 * Coverage is not endorsement and not a profile. It is "here is where this
 * person has come up", which is honest about being incomplete: a first-time
 * candidate in a safe seat may genuinely have none, and that is the truth worth
 * showing rather than padding.
 */

import { createClient } from '@/lib/supabase/server'

export interface CandidateCoverageItem {
  id: string
  kind: 'news' | 'video'
  title: string
  /** Outlet for news, channel for video. */
  source: string
  /** Where to send the reader — the original article, or the video. */
  url: string
  pubDate: string | null
}

/** Items tagged to each of `keys`, newest first. Keys with none are absent. */
export async function getCoverageForCandidates(
  keys: string[],
  perCandidate = 3,
): Promise<Map<string, CandidateCoverageItem[]>> {
  const out = new Map<string, CandidateCoverageItem[]>()
  if (keys.length === 0) return out

  const supabase = await createClient()

  // Filter server-side on the JSONB tag rather than fetching a recent slice and
  // matching in JS. The first version did the latter, taking the newest 400
  // items — and Paul Goldsmith, who has six tagged articles, showed nothing,
  // because his coverage is older than that window. There are 2352 news and
  // video rows and a plain select returns at most 1000, so ANY recency-bounded
  // fetch quietly hides the tail. A candidate with coverage rendering "nothing
  // yet" is the one wrong answer this page must never give.
  //
  // Keys are `cand:<seat>|<name>` — slug characters only. Anything carrying a
  // comma, quote or paren would break the or() grammar, so it is dropped rather
  // than allowed to corrupt the whole expression.
  const safe = keys.filter((k) => !/[,"'()]/.test(k))
  if (safe.length === 0) return out
  const { data } = await supabase
    .from('content_items')
    .select('id, type, title, data, source_url, created_at')
    .in('type', ['news', 'video'])
    .eq('status', 'approved')
    .or(safe.map((k) => `data->candidates.cs.["${k}"]`).join(','))
    .order('created_at', { ascending: false })
    .limit(200)

  const wanted = new Set(keys)
  for (const r of data ?? []) {
    const d = (r.data || {}) as Record<string, unknown>
    const tagged = Array.isArray(d.candidates) ? (d.candidates as string[]) : []
    const isVideo = r.type === 'video'
    const item: CandidateCoverageItem = {
      id: r.id,
      kind: isVideo ? 'video' : 'news',
      title: r.title,
      source: String((isVideo ? d.source : d.outlet) ?? 'Source'),
      url: String(d.link ?? r.source_url ?? ''),
      pubDate: (d.pubDate as string) ?? null,
    }
    if (!item.url) continue
    for (const k of tagged) {
      if (!wanted.has(k)) continue
      const list = out.get(k) ?? []
      list.push(item)
      out.set(k, list)
    }
  }

  for (const [k, list] of out) {
    list.sort((a, b) => (b.pubDate ?? '').localeCompare(a.pubDate ?? ''))
    out.set(k, list.slice(0, perCandidate))
  }
  return out
}
