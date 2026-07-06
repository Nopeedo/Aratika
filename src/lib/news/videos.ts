/**
 * news/videos.ts — read the "Leaders & the press" video feed from content_items
 * (type='video', from official YouTube channel RSS — see scripts/ingest-videos.mjs).
 * We store the videoId/thumbnail and EMBED via the privacy player; never rehost.
 */

import { createClient } from '@/lib/supabase/server'

export interface VideoItem {
  id: string
  title: string
  videoId: string
  source: string
  party: string | null
  parties: string[]
  topics: string[]
  /** Battleground electorates this video names — see ELECTORATE_TERMS in scripts/ingest-videos.mjs. */
  electorates: string[]
  pubDate: string | null
  thumbnail: string
  electionRelevant: boolean
}

export async function getVideos(limit = 48): Promise<VideoItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_items')
    .select('id, title, data, created_at')
    .eq('type', 'video')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit)
  const items = (data ?? []).map((r) => {
    const d = (r.data || {}) as Record<string, unknown>
    return {
      id: r.id,
      title: r.title,
      videoId: String(d.videoId ?? ''),
      source: String(d.source ?? 'YouTube'),
      party: (d.party as string) ?? null,
      parties: Array.isArray(d.parties) ? (d.parties as string[]) : [],
      topics: Array.isArray(d.topics) ? (d.topics as string[]) : [],
      electorates: Array.isArray(d.electorates) ? (d.electorates as string[]) : [],
      pubDate: (d.pubDate as string) ?? null,
      thumbnail: String(d.thumbnail ?? ''),
      electionRelevant: d.electionRelevant === true,
    }
  })
  return items.sort((a, b) => (b.pubDate ?? '').localeCompare(a.pubDate ?? ''))
}

/** Videos naming a specific battleground electorate — see getNewsForElectorate. */
export async function getVideosForElectorate(electorateName: string, limit = 3): Promise<VideoItem[]> {
  const all = await getVideos(200)
  return all.filter((v) => v.electorates.includes(electorateName)).slice(0, limit)
}
