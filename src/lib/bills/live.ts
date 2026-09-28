/**
 * Live legislation data — reads APPROVED, enriched items from content_items
 * (the pipeline output). Only approved rows are returned (RLS enforces public
 * read of approved only), so nothing un-reviewed ever reaches the public.
 */

import { unstable_cache } from 'next/cache'
import { publicClient } from '@/lib/supabase/public'
import { billSlugFromLink, normBillTitle } from './slug'

export interface PolicyLink {
  topic: string
  explanation: string
  explanationBasic?: string
  excerpts: string[]
}

export interface LiveBill {
  id: string
  slug: string
  title: string
  summary: string | null
  summaryBasic: string | null
  link: string | null
  published: string | null
  docType: 'bill' | 'act'
  policyLinks: PolicyLink[]
  stage: string | null
  selectCommittee: string | null
  /** MP in charge of the bill, e.g. "Chris Bishop" — backfilled from the
   *  Parliament API dataset by scripts/backfill-bill-members.mjs. */
  member: string | null
  /** Their MP profile slug, when they have one, so the reader can link through. */
  memberSlug: string | null
  /** The bill's page on bills.parliament.nz — where submissions are actually lodged. */
  officialUrl: string | null
  /** True only while a select committee has actually called for submissions. */
  submissionsCalled: boolean
  /** ISO date submissions close — check before inviting anyone to submit. */
  submissionsClose: string | null
  fullText: string | null
}

interface Row {
  id: string
  title: string
  summary: string | null
  data: { link?: string; published?: string; policy_links?: PolicyLink[]; enriched?: boolean; stage?: string; selectCommittee?: string; summaryBasic?: string; member?: string; memberSlug?: string | null; officialUrl?: string | null; submissionsCalled?: boolean; submissionsClose?: string | null } | null
}

function toLiveBill(r: Row): LiveBill | null {
  const link = r.data?.link ?? null
  const slug = billSlugFromLink(link)
  if (!slug) return null
  return {
    id: r.id,
    slug,
    title: r.title,
    summary: r.summary,
    summaryBasic: r.data?.summaryBasic ?? null,
    link,
    published: r.data?.published ?? null,
    docType: link?.includes('/act/') ? 'act' : 'bill',
    policyLinks: Array.isArray(r.data?.policy_links) ? r.data!.policy_links! : [],
    stage: r.data?.stage ?? null,
    selectCommittee: r.data?.selectCommittee ?? null,
    member: r.data?.member ?? null,
    memberSlug: r.data?.memberSlug ?? null,
    officialUrl: r.data?.officialUrl ?? null,
    submissionsCalled: r.data?.submissionsCalled === true,
    submissionsClose: r.data?.submissionsClose ?? null,
    fullText: null, // loaded per-bill in getApprovedBillBySlug (kept out of list queries)
  }
}

/**
 * The approved-legislation read, cached for a minute across every route.
 *
 * WHY THIS IS CACHED AND NOT JUST FAST
 *
 * This query returns ~1.3 MB. Uncached it ran once per render, and /legislation
 * alone has ~290 slugs in the sitemap — so one crawler walking those pages cost
 * roughly 374 MB of Supabase egress in a single pass, for content that changes
 * a few times a day. The free tier allows 5 GB a month; the project reached
 * 185% of it with six monthly active users and a 47 MB database, which is what
 * a number like that looks like from the outside: not one heavy page, a cheap
 * page multiplied by every URL and every crawl.
 *
 * At 60 seconds the same crawl costs one read. Bills are approved by hand in
 * /editor, so a minute of lag is invisible — the same trade positions/live.ts
 * and polls/live.ts already make.
 */
const readApprovedBills = unstable_cache(
  async (): Promise<Row[]> => {
    // publicClient, not the cookie-bound server client. This reads approved
    // public content and never needed a session, and touching cookies opts the
    // calling route out of static rendering entirely — which is what kept
    // /bills and /legislation rendering per request (2.1-2.9s to first byte).
    // News already reads the same table this way.
    const supabase = publicClient()
    const { data } = await supabase
      .from('content_items')
      .select('id, title, summary, data')
      .eq('type', 'legislation')
      .eq('status', 'approved')
      .order('fetched_at', { ascending: false })
      .limit(300)
    return (data as Row[] | null) ?? []
  },
  ['approved-bills'],
  { revalidate: 60, tags: ['bills'] },
)

/** Approved, enriched legislation (has a summary + policy breakdown). */
export async function getApprovedBills(): Promise<LiveBill[]> {
  return (await readApprovedBills())
    .map(toLiveBill)
    .filter((b): b is LiveBill => !!b && !!b.summary && b.policyLinks.length >= 0)
}

/** Normalised bill title -> our reader slug, for every published breakdown.
 *
 *  The question three pages keep asking is only ever "do we have our own page
 *  for this bill?", and each was answering it by fetching the full approved list
 *  and building the same map inline. This is that map, once.
 *
 *  Cookie-free (supabase/public) rather than the session client, so a page that
 *  is statically generated can ask at build time without opting itself into
 *  dynamic rendering — /bills/[slug] is prerendered and must stay that way. The
 *  rows are status='approved', which is what every visitor sees, so there is no
 *  session to respect.
 *
 *  Returns {} rather than throwing when Supabase is unconfigured or unreachable.
 *  Every caller falls back to linking out to Parliament — a worse link, never a
 *  broken page — and a build with no keys (the design-only setup in
 *  docs/DESIGN-HANDOFF.md) has to keep producing a site.
 */
export async function getBillReaderSlugs(): Promise<Record<string, string>> {
  try {
    // Reuses the cached read above rather than issuing a second 300-row query
    // for a subset of the same columns. Three pages call this on most renders,
    // so uncached it doubled the egress of the list it was derived from.
    const data = await readApprovedBills()
    const map: Record<string, string> = {}
    for (const r of data) {
      const slug = billSlugFromLink((r.data as { link?: string } | null)?.link)
      if (slug) map[normBillTitle(r.title)] = slug
    }
    return map
  } catch {
    return {}
  }
}

export async function getApprovedBillBySlug(slug: string): Promise<LiveBill | null> {
  const all = await getApprovedBills()
  const bill = all.find((b) => b.slug === slug)
  if (!bill) return null
  // Load the heavy full text only for the single bill being read.
  const supabase = publicClient()
  const { data } = await supabase.from('content_items').select('full_text').eq('id', bill.id).maybeSingle()
  return { ...bill, fullText: (data?.full_text as string | null) ?? null }
}
