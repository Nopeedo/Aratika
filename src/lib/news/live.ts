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

/**
 * News tagged to a party, for that party's own page.
 *
 * Filtered in the QUERY, not after fetching the newest N. The pattern used by
 * getNewsForElectorate — pull 300 rows then filter in memory — silently hides
 * everything about a party that has not been in the news lately: with ~60 items
 * arriving a day, 300 rows is under a week, so a minor party's coverage falls
 * off the end and the page renders "no coverage" while the rows sit in the
 * table. This is the same class of bug that made a frontbencher's 14 articles
 * invisible on the candidate view.
 *
 * `cs` is JSONB containment on data->parties. A party's own releases are tagged
 * with its slug by the ingest, so they come through here too.
 */
export async function getNewsForParty(slug: string, limit = 6): Promise<NewsItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_items')
    .select('id, title, summary, data, created_at')
    .eq('type', 'news')
    .eq('status', 'approved')
    .filter('data->parties', 'cs', JSON.stringify([slug]))
    .order('created_at', { ascending: false })
    .limit(limit * 4)
  return (data ?? [])
    .map(toItem)
    .sort((a, b) => (b.pubDate ?? '').localeCompare(a.pubDate ?? ''))
    .slice(0, limit)
}

/**
 * News tagged to one MP, for their profile.
 *
 * Filtered in the query for the same reason as getNewsForParty: pulling the
 * newest N and filtering in memory hides everything about an MP who has not been
 * in the news this week, and most MPs are exactly that. Measured across the
 * approved pool, 58 of 123 MPs have any coverage at all and the median for those
 * who do is 6 items — a backbencher's single article would never survive a
 * 300-row window.
 */
export async function getNewsForMp(slug: string, limit = 5): Promise<NewsItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_items')
    .select('id, title, summary, data, created_at')
    .eq('type', 'news')
    .eq('status', 'approved')
    .filter('data->mps', 'cs', JSON.stringify([slug]))
    .order('created_at', { ascending: false })
    .limit(limit * 4)
  return (data ?? [])
    .map(toItem)
    .sort((a, b) => (b.pubDate ?? '').localeCompare(a.pubDate ?? ''))
    .slice(0, limit)
}
