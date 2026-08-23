/**
 * news/videos.ts — read the "Leaders & the press" video feed from content_items
 * (type='video', from official YouTube channel RSS — see scripts/ingest-videos.mjs).
 * We store the videoId/thumbnail and EMBED via the privacy player; never rehost.
 */

import { publicClient } from '@/lib/supabase/public'

export interface VideoItem {
  id: string
  title: string
  videoId: string
  source: string
  party: string | null
  parties: string[]
  topics: string[]
  /** MP slugs this video names — see MP_TERMS in scripts/political-terms.mjs. */
  mps: string[]
  /** Battleground electorates this video names — see ELECTORATE_TERMS in scripts/ingest-videos.mjs. */
  electorates: string[]
  pubDate: string | null
  thumbnail: string
  electionRelevant: boolean
  /** Leaders'/minor-party debate or long-form leader interview — see DEBATE_TERMS. */
  debate: boolean
  /** Leader press event / update (standup, post-cabinet, or names a party leader). */
  presser: boolean
  /** An interview with a named leader or candidate — see INTERVIEW_TERMS. */
  interview: boolean
  /** Came from the interview tier — see the CHANNELS block in ingest-videos.mjs.
   *  Says where it came from, and nothing about the outlet's independence: the
   *  tier includes Q+A (TVNZ), Newstalk ZB (NZME) and Stuff alongside smaller
   *  outlets, so any claim beyond provenance would be false. */
  interviewTier: boolean
}

/** Nothing older than this can surface. Te Pāti Māori's official channel has been
 *  dormant since 2014, and its six approved clips were otherwise eligible to
 *  appear on a 2026 election page — a decade-old campaign video presented as
 *  current is worse than showing nothing for that party. */
const MAX_AGE_DAYS = 730

/** One approved video row -> VideoItem. Shared so every query maps identically. */
function toVideoItem(r: { id: string; title: string; data: unknown }): VideoItem {
  const d = (r.data || {}) as Record<string, unknown>
  return {
    id: r.id,
    title: r.title,
    videoId: String(d.videoId ?? ''),
    source: String(d.source ?? 'YouTube'),
    party: (d.party as string) ?? null,
    parties: Array.isArray(d.parties) ? (d.parties as string[]) : [],
    topics: Array.isArray(d.topics) ? (d.topics as string[]) : [],
    mps: Array.isArray(d.mps) ? (d.mps as string[]) : [],
    electorates: Array.isArray(d.electorates) ? (d.electorates as string[]) : [],
    pubDate: (d.pubDate as string) ?? null,
    thumbnail: String(d.thumbnail ?? ''),
    electionRelevant: d.electionRelevant === true,
    debate: d.debate === true,
    presser: d.presser === true,
    interview: d.interview === true,
    interviewTier: d.interviewTier === true,
  }
}

export async function getVideos(limit = 48): Promise<VideoItem[]> {
  const supabase = publicClient()
  const { data } = await supabase
    .from('content_items')
    .select('id, title, data, created_at')
    .eq('type', 'video')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit)
  const items = (data ?? []).map(toVideoItem)
  const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 86_400_000).toISOString().slice(0, 10)
  return items
    .filter((v) => !v.pubDate || v.pubDate.slice(0, 10) >= cutoff)
    .sort((a, b) => (b.pubDate ?? '').localeCompare(a.pubDate ?? ''))
}

/**
 * The "Leaders & the press" rail: debates AND leader press events / updates —
 * the section's subtitle always promised standups and leader updates, but only
 * debate-flagged clips qualified, so it sat nearly empty outside debate season.
 * Debates pin first; the rest follow newest-first.
 *
 * `presser` is keyword-driven (press terms, or a title naming a party leader),
 * which structurally favours the big parties: the press write about Luxon and
 * Hipkins constantly, so their clips qualify while a minor party's own channel
 * output usually doesn't mention its leader by name. The result was a rail with
 * 30 approved TOP videos available and none shown. `guaranteed` below fixes that
 * without weakening the filter for everyone else.
 */
export async function getDebateVideos(limit = 12): Promise<VideoItem[]> {
  const all = await getVideos(300)
  const eligible = all
    .filter((v) => v.debate || v.presser)
    .sort((a, b) => Number(b.debate) - Number(a.debate) || (b.pubDate ?? '').localeCompare(a.pubDate ?? ''))

  const rail = eligible.slice(0, limit)

  // Any party with recent approved video but no slot gets its newest clip, so a
  // contesting party is never invisible purely because of how its titles read.
  const represented = new Set(rail.flatMap((v) => v.parties))
  const guaranteed: VideoItem[] = []
  for (const v of all) {
    for (const p of v.parties) {
      if (represented.has(p)) continue
      represented.add(p)
      guaranteed.push(v)
      break
    }
  }

  if (!guaranteed.length) return rail
  // Keep the rail at `limit` by trimming the oldest non-guaranteed entries.
  const keep = rail.slice(0, Math.max(0, limit - guaranteed.length))
  return [...keep, ...guaranteed].sort(
    (a, b) => Number(b.debate) - Number(a.debate) || (b.pubDate ?? '').localeCompare(a.pubDate ?? ''),
  )
}

/**
 * The "Interviews" rail: long-form interviews with leaders and candidates from
 * the interview tier — outlets admitted because they put leaders and candidates
 * on the record, from Q+A down to small independent shows (see CHANNELS in
 * scripts/ingest-videos.mjs).
 *
 * Kept as its own rail rather than mixed into "Leaders & the press" so the
 * outlet is unmistakable. An interview is a party's voice getting extended
 * airtime on someone else's platform, and a reader deciding who to vote for is
 * owed a clear view of who is asking the questions.
 *
 * Ordering is newest-first but round-robined by party, because straight
 * recency hands the whole rail to whichever leader had a busy fortnight. The
 * round-robin changes what you see FIRST, never what exists — scroll on and
 * every interview is still there, in recency order within its party.
 */
export async function getInterviewVideos(limit = 12): Promise<VideoItem[]> {
  const all = await getVideos(300)
  const pool = all.filter((v) => v.interviewTier)

  // Bucket by first tagged party; untagged clips ride in their own bucket so an
  // interview we couldn't attribute is never silently dropped.
  const buckets = new Map<string, VideoItem[]>()
  for (const v of pool) {
    const key = v.parties[0] ?? '—'
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(v)
  }
  for (const list of buckets.values()) list.sort((a, b) => (b.pubDate ?? '').localeCompare(a.pubDate ?? ''))

  // Parties enter the rotation ordered by their own newest item, so the single
  // most recent interview still leads the rail.
  const order = [...buckets.entries()].sort(
    (a, b) => (b[1][0]?.pubDate ?? '').localeCompare(a[1][0]?.pubDate ?? ''),
  )

  const out: VideoItem[] = []
  for (let round = 0; out.length < limit; round++) {
    let placed = false
    for (const [, list] of order) {
      if (round >= list.length) continue
      out.push(list[round])
      placed = true
      if (out.length >= limit) break
    }
    if (!placed) break   // every bucket exhausted
  }
  return out
}

/** Videos naming a specific battleground electorate — see getNewsForElectorate. */
export async function getVideosForElectorate(electorateName: string, limit = 3): Promise<VideoItem[]> {
  const all = await getVideos(200)
  return all.filter((v) => v.electorates.includes(electorateName)).slice(0, limit)
}

/**
 * Video tagged to a party, for that party's own page. Server-side filtered for
 * the same reason as getNewsForParty — see the note there.
 *
 * Deliberately NOT restricted to the interview tier or to election-relevant
 * clips: on a party's own page the party's own channel output is exactly what a
 * reader came for, and those clips are tagged to it by the channel rather than
 * by keyword.
 */
export async function getVideosForParty(slug: string, limit = 4): Promise<VideoItem[]> {
  const supabase = publicClient()
  const { data } = await supabase
    .from('content_items')
    .select('id, title, data, created_at')
    .eq('type', 'video')
    .eq('status', 'approved')
    .filter('data->parties', 'cs', JSON.stringify([slug]))
    .order('created_at', { ascending: false })
    .limit(limit * 5)
  const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 86_400_000).toISOString().slice(0, 10)
  return (data ?? [])
    .map(toVideoItem)
    .filter((v) => !v.pubDate || v.pubDate.slice(0, 10) >= cutoff)
    .sort((a, b) => (b.pubDate ?? '').localeCompare(a.pubDate ?? ''))
    .slice(0, limit)
}

/** Video tagged to one MP — see getNewsForMp for why this filters in the query. */
export async function getVideosForMp(slug: string, limit = 3): Promise<VideoItem[]> {
  const supabase = publicClient()
  const { data } = await supabase
    .from('content_items')
    .select('id, title, data, created_at')
    .eq('type', 'video')
    .eq('status', 'approved')
    .filter('data->mps', 'cs', JSON.stringify([slug]))
    .order('created_at', { ascending: false })
    .limit(limit * 5)
  const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 86_400_000).toISOString().slice(0, 10)
  return (data ?? [])
    .map(toVideoItem)
    .filter((v) => !v.pubDate || v.pubDate.slice(0, 10) >= cutoff)
    .sort((a, b) => (b.pubDate ?? '').localeCompare(a.pubDate ?? ''))
    .slice(0, limit)
}
