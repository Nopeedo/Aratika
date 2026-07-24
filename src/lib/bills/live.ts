/**
 * Live legislation data — reads APPROVED, enriched items from content_items
 * (the pipeline output). Only approved rows are returned (RLS enforces public
 * read of approved only), so nothing un-reviewed ever reaches the public.
 */

import { createClient } from '@/lib/supabase/server'
import { billSlugFromLink } from './slug'

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

/** Approved, enriched legislation (has a summary + policy breakdown). */
export async function getApprovedBills(): Promise<LiveBill[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_items')
    .select('id, title, summary, data')
    .eq('type', 'legislation')
    .eq('status', 'approved')
    .order('fetched_at', { ascending: false })
    .limit(300)
  return (data as Row[] | null ?? [])
    .map(toLiveBill)
    .filter((b): b is LiveBill => !!b && !!b.summary && b.policyLinks.length >= 0)
}

export async function getApprovedBillBySlug(slug: string): Promise<LiveBill | null> {
  const all = await getApprovedBills()
  const bill = all.find((b) => b.slug === slug)
  if (!bill) return null
  // Load the heavy full text only for the single bill being read.
  const supabase = await createClient()
  const { data } = await supabase.from('content_items').select('full_text').eq('id', bill.id).maybeSingle()
  return { ...bill, fullText: (data?.full_text as string | null) ?? null }
}
