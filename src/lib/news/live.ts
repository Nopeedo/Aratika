/**
 * news/live.ts — read the aggregated political-news feed from content_items
 * (type='news', auto-published from credible outlets' RSS — see scripts/ingest-news.mjs).
 * We only ever store/show headline + outlet + short feed snippet + link-out.
 */

import { createClient } from '@/lib/supabase/server'
import { MP_PROFILES } from '@/constants/mps-data'

export interface NewsItem {
  id: string
  title: string
  snippet: string
  outlet: string
  kind: string            // 'media' | 'government'
  link: string
  pubDate: string | null
  parties: string[]
  topics: string[]
  /** MP slugs this item names — see MP_TERMS in scripts/political-terms.mjs. */
  mps: string[]
  /** Battleground electorates this item names — see ELECTORATE_TERMS in scripts/ingest-news.mjs. */
  electorates: string[]
  cc: boolean
  featured: boolean
  image: string | null
  /**
   * Fallback visual when the outlet publishes no picture — a portrait of an MP the
   * item names. The Beehive's releases are text-only (0 of 142 have an image), so
   * without this they all render as the same generic icon. Resolved server-side so
   * the MP dataset never reaches the browser. It is a PORTRAIT, not a photo from
   * the story, so the card labels it with the person's name rather than passing it
   * off as news photography.
   */
  portrait: { src: string; name: string } | null
  electionRelevant: boolean
}

/** First tagged MP who has a (freely licensed, self-hosted) portrait. */
function portraitFor(mps: string[]): { src: string; name: string } | null {
  for (const slug of mps) {
    const mp = MP_PROFILES[slug]
    if (mp?.photo) return { src: mp.photo, name: mp.name }
  }
  return null
}

function toItem(r: { id: string; title: string; summary: string | null; data: Record<string, unknown> }): NewsItem {
  const d = r.data || {}
  return {
    id: r.id,
    title: r.title,
    snippet: r.summary ?? '',
    outlet: String(d.outlet ?? 'Source'),
    kind: String(d.kind ?? 'media'),
    link: String(d.link ?? ''),
    pubDate: (d.pubDate as string) ?? null,
    parties: Array.isArray(d.parties) ? (d.parties as string[]) : [],
    topics: Array.isArray(d.topics) ? (d.topics as string[]) : [],
    mps: Array.isArray(d.mps) ? (d.mps as string[]) : [],
    electorates: Array.isArray(d.electorates) ? (d.electorates as string[]) : [],
    cc: d.cc === true,
    featured: d.featured === true,
    image: (d.image as string) ?? null,
    portrait: portraitFor(Array.isArray(d.mps) ? (d.mps as string[]) : []),
    electionRelevant: d.electionRelevant === true,
  }
}

/** Newest-first political news. Sorted by published date (falls back to insert order). */
export async function getNews(limit = 150): Promise<NewsItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_items')
    .select('id, title, summary, data, created_at')
    .eq('type', 'news')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit)
  const items = (data ?? []).map(toItem)
    // Election-focused: only show current affairs relevant to the 2026 vote.
    .filter((i) => i.electionRelevant)
  // sort by actual publish date where present
  return items.sort((a, b) => (b.pubDate ?? '').localeCompare(a.pubDate ?? ''))
}

/**
 * News naming a specific battleground electorate (by seat name or sitting MP —
 * see ELECTORATE_TERMS in scripts/ingest-news.mjs). Only covers the closest
 * 2023 races for now; most electorates will simply return an empty list, which
 * is the honest state, not a bug.
 */
export async function getNewsForElectorate(electorateName: string, limit = 6): Promise<NewsItem[]> {
  const all = await getNews(300)
  return all.filter((i) => i.electorates.includes(electorateName)).slice(0, limit)
}
