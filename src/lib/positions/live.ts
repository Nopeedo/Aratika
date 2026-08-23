/**
 * Live party positions — reads APPROVED `position` items from content_items
 * (the comparison pipeline output). RLS returns only approved rows, so nothing
 * un-reviewed reaches the public site.
 */

import { createClient as createPublicClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'

export interface WhoAffected { group: string; detail: string }

export interface PartyPosition {
  party: string
  partyName: string
  topic: string
  period: string          // '2023' | '2026'
  periodLabel: string
  stance: string
  summary: string | null        // detailed
  summaryBasic: string | null   // plain
  quote: string | null
  keyProposals: string[]
  whoAffected: WhoAffected[]
  excerpts: string[]
  noPosition: boolean      // true = verified "no stated policy on this topic"
  sourceLabel: string
  sourceUrl: string | null
  asOf: string | null
}

interface Row {
  summary: string | null
  source_url: string | null
  data: Record<string, unknown> | null
}

function toPosition(r: Row): PartyPosition | null {
  const d = r.data ?? {}
  if (typeof d.party !== 'string' || typeof d.topic !== 'string') return null
  return {
    party: d.party,
    partyName: typeof d.partyName === 'string' ? d.partyName : d.party,
    topic: d.topic,
    period: typeof d.period === 'string' ? d.period : '2026',
    periodLabel: typeof d.periodLabel === 'string' ? d.periodLabel : 'Current policy',
    stance: typeof d.stance === 'string' ? d.stance : '',
    summary: r.summary,
    summaryBasic: typeof d.summaryBasic === 'string' ? d.summaryBasic : null,
    quote: typeof d.quote === 'string' && d.quote ? d.quote : null,
    keyProposals: Array.isArray(d.keyProposals) ? (d.keyProposals as unknown[]).map(String) : [],
    whoAffected: Array.isArray(d.whoAffected)
      ? (d.whoAffected as Record<string, unknown>[]).map((x) => ({ group: String(x.group ?? ''), detail: String(x.detail ?? '') })).filter((x) => x.group || x.detail)
      : [],
    excerpts: Array.isArray(d.excerpts) ? (d.excerpts as unknown[]).map(String) : [],
    noPosition: d.noPosition === true,
    sourceLabel: typeof d.source_label === 'string' ? d.source_label : 'Official source',
    sourceUrl: r.source_url,
    asOf: typeof d.asOf === 'string' ? d.asOf : null,
  }
}

/**
 * Approved positions, read WITHOUT cookies and cached.
 *
 * These rows are public: status='approved' is what the site renders to everyone,
 * and RLS already refuses anon any other status (checked — anon sees 116
 * approved and 0 pending). Reading them through the cookie-bound server client
 * was therefore asking a question whose answer never depended on who was asking,
 * and it cost every consuming route its ability to be cached: /parties/[slug]
 * was force-dynamic, so switching party meant a server render plus a Supabase
 * round trip, measured at 1.7-2.4s per click on production.
 *
 * Cached for a minute. Positions are approved by hand in /editor a few times a
 * day, so a minute of lag is invisible; the alternative the old comment worried
 * about was build-time staleness, which is days, not seconds.
 */
const readApproved = unstable_cache(
  async (): Promise<Row[]> => {
    const supabase = createPublicClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    )
    const { data } = await supabase
      .from('content_items')
      .select('summary, source_url, data')
      .eq('type', 'position')
      .eq('status', 'approved')
      .limit(800)
    return (data as Row[] | null) ?? []
  },
  ['approved-positions'],
  { revalidate: 60, tags: ['positions'] },
)

/** Approved positions for one topic. */
export async function getApprovedPositions(topic: string): Promise<PartyPosition[]> {
  return (await readApproved())
    .map(toPosition)
    .filter((p): p is PartyPosition => !!p && p.topic === topic)
}

/** Every approved position across all topics (for the /compare tool). */
export async function getAllApprovedPositions(): Promise<PartyPosition[]> {
  return (await readApproved()).map(toPosition).filter((p): p is PartyPosition => !!p)
}

/** A single approved position for one party + topic (latest period preferred). */
export async function getApprovedPosition(topic: string, party: string, period = '2026'): Promise<PartyPosition | null> {
  const all = await getApprovedPositions(topic)
  return all.find((p) => p.party === party && p.period === period) ?? all.find((p) => p.party === party) ?? null
}
