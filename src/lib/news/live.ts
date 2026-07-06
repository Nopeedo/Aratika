/**
 * news/live.ts — read the aggregated political-news feed from content_items
 * (type='news', auto-published from credible outlets' RSS — see scripts/ingest-news.mjs).
 * We only ever store/show headline + outlet + short feed snippet + link-out.
 */

import { createClient } from '@/lib/supabase/server'

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
  /** Battleground electorates this item names — see ELECTORATE_TERMS in scripts/ingest-news.mjs. */
  electorates: string[]
  cc: boolean
  featured: boolean
  image: string | null
  electionRelevant: boolean
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
    electorates: Array.isArray(d.electorates) ? (d.electorates as string[]) : [],
    cc: d.cc === true,
    featured: d.featured === true,
    image: (d.image as string) ?? null,
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
