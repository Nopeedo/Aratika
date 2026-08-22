/**
 * sitemap.xml — the list of public pages we ask Google to index.
 *
 * Driven by isEnabled() rather than a hand-kept list, so flipping LAUNCH_PHASE
 * in constants/features.ts widens the sitemap automatically instead of leaving
 * Phase 2/3 pages invisible to search. Nothing login-gated, noindexed, or
 * gated-to-/coming-soon appears here.
 *
 * The two DB-backed sections (published positions, live legislation) are
 * best-effort: if Supabase is unreachable at build time we still emit the full
 * static sitemap rather than failing the build.
 */

import type { MetadataRoute } from 'next'
import { SITE } from '@/constants/site'
import { isEnabled } from '@/constants/features'
import { MP_SLUGS } from '@/constants/mps-data'
import { PARTY_DIRECTORY_ORDER, PROFILED_MINOR_PARTIES } from '@/constants/parties-data'
import { CONTESTING_PARTIES } from '@/constants/parties'
import { POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import { allDeepDivePaths } from '@/constants/policy-deep-dives'
import { BILL_SLUGS } from '@/constants/bills-data'
import { DEFINING_BILLS } from '@/constants/defining-bills'
import { ELECTION_SLUGS } from '@/constants/elections-data'
import { LEARN_MODULE_IDS } from '@/constants/learn-data'
import { ELECTORATE_SLUGS } from '@/lib/battlegrounds'
import { getAllApprovedPositions } from '@/lib/positions/live'
import { getApprovedBills } from '@/lib/bills/live'

// Regenerate hourly — the live sections (news-driven legislation, newly approved
// positions) change on their own schedule, and an hourly sitemap is plenty fresh
// for a crawler that visits far less often than that.
export const revalidate = 3600

type Entry = MetadataRoute.Sitemap[number]
type Freq = NonNullable<Entry['changeFrequency']>

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const url = (path: string) => `${SITE.url}${path}`

  const entry = (path: string, priority: number, changeFrequency: Freq): Entry => ({
    url: url(path),
    lastModified: now,
    changeFrequency,
    priority,
  })

  const entries: Entry[] = []

  // ── Core ──────────────────────────────────────────────────────────────────
  entries.push(entry('', 1.0, 'daily'))

  // Entry points into the site — the on-ramps a first-time visitor lands on.
  entries.push(
    entry('/guide', 0.9, 'monthly'),
    entry('/start', 0.9, 'monthly'),
    entry('/hub', 0.7, 'weekly'),
    entry('/command-centre', 0.7, 'weekly'),
  )

  // ── Election centre ───────────────────────────────────────────────────────
  if (isEnabled('elections')) {
    entries.push(entry('/elections', 0.9, 'weekly'))
    for (const year of ELECTION_SLUGS) {
      // The upcoming election is the flagship page; past results are reference.
      const upcoming = year === '2026'
      entries.push(entry(`/elections/${year}`, upcoming ? 1.0 : 0.6, upcoming ? 'daily' : 'yearly'))
    }
  }

  if (isEnabled('battlegrounds')) {
    entries.push(entry('/battlegrounds', 0.8, 'weekly'))
    for (const slug of ELECTORATE_SLUGS) {
      entries.push(entry(`/battlegrounds/${slug}`, 0.7, 'weekly'))
    }
  }

  if (isEnabled('map')) entries.push(entry('/map', 0.8, 'monthly'))
  // /compare is retired and redirects to /policies — a sitemap must not list
  // a URL that redirects.

  // ── People & parties ──────────────────────────────────────────────────────
  if (isEnabled('parties')) {
    entries.push(entry('/parties', 0.9, 'weekly'))
    for (const slug of [...PARTY_DIRECTORY_ORDER, ...PROFILED_MINOR_PARTIES]) {
      entries.push(entry(`/parties/${slug}`, 0.8, 'weekly'))
    }
    // Explains why every registered party is included — our fairness position.
    entries.push(entry('/party-inclusion', 0.5, 'yearly'))
  }

  if (isEnabled('mps')) {
    entries.push(entry('/mps', 0.9, 'weekly'))
    // The single biggest block of pages, and the one most likely to be found by
    // someone searching an MP by name.
    for (const slug of MP_SLUGS) {
      entries.push(entry(`/mps/${slug}`, 0.8, 'weekly'))
    }
  }

  // ── Policy ────────────────────────────────────────────────────────────────
  if (isEnabled('policies')) {
    // /policies is not listed: it now redirects to the first topic, and a
    // sitemap must not list a URL that redirects — the same rule /compare is
    // held to above. The topic pages carry the content and the priority.
    for (const topic of POLICY_TOPIC_ORDER) {
      entries.push(entry(`/policies/${topic}`, 0.9, 'weekly'))
    }

    // Per-party positions: only list combinations that actually have an approved
    // position, so we never point a crawler at an empty "no position yet" page.
    for (const { topic, party } of await approvedPositionPairs()) {
      entries.push(entry(`/policies/${topic}/${party}`, 0.7, 'monthly'))
    }

    // Deep dives. Not gated on an approved position — a breakdown is sourced
    // from the party's own published document, so the page stands up whether or
    // not we've recorded a summary position beside it. Priority sits above the
    // position pages because these are the most substantial thing on the site.
    for (const { topic, party, slug } of allDeepDivePaths()) {
      entries.push(entry(`/policies/${topic}/${party}/${slug}`, 0.75, 'monthly'))
    }
  }

  // ── Legislation ───────────────────────────────────────────────────────────
  if (isEnabled('bills')) {
    entries.push(entry('/bills', 0.8, 'weekly'))
    for (const slug of new Set([...BILL_SLUGS, ...DEFINING_BILLS.map((b) => b.slug)])) {
      entries.push(entry(`/bills/${slug}`, 0.6, 'weekly'))
    }
  }

  if (isEnabled('legislation')) {
    entries.push(entry('/legislation', 0.8, 'weekly'))
    for (const slug of await approvedBillSlugs()) {
      entries.push(entry(`/legislation/${slug}`, 0.6, 'weekly'))
    }
  }

  // ── News & learning ───────────────────────────────────────────────────────
  if (isEnabled('news')) entries.push(entry('/news', 0.8, 'daily'))
  if (isEnabled('budget')) entries.push(entry('/budget', 0.7, 'monthly'))

  if (isEnabled('learn')) {
    entries.push(entry('/learn', 0.7, 'monthly'))
    for (const id of LEARN_MODULE_IDS) {
      entries.push(entry(`/learn/${id}`, 0.6, 'monthly'))
    }
  }

  if (isEnabled('glossary')) entries.push(entry('/glossary', 0.6, 'monthly'))

  // ── Info & trust ──────────────────────────────────────────────────────────
  // These carry little search traffic but a lot of credibility signal — for a
  // civic-information site, "who runs this and how is it funded" matters.
  if (isEnabled('about')) entries.push(entry('/about', 0.7, 'monthly'))
  if (isEnabled('contact')) entries.push(entry('/contact', 0.5, 'yearly'))
  entries.push(
    entry('/faq', 0.6, 'monthly'),
    entry('/plan', 0.4, 'yearly'),
    entry('/privacy', 0.3, 'yearly'),
    entry('/terms', 0.3, 'yearly'),
  )

  return entries
}

/** Approved 2026 positions as unique topic/party pairs. Empty if Supabase is down. */
async function approvedPositionPairs(): Promise<{ topic: string; party: string }[]> {
  try {
    const all = await getAllApprovedPositions()
    const seen = new Set<string>()
    const pairs: { topic: string; party: string }[] = []
    for (const p of all) {
      // The page renders the 2026 position; independents have no policy page.
      if (p.period !== '2026') continue
      if (p.party === 'independent') continue
      if (!CONTESTING_PARTIES.includes(p.party as (typeof CONTESTING_PARTIES)[number])) continue
      if (!POLICY_TOPIC_ORDER.includes(p.topic as (typeof POLICY_TOPIC_ORDER)[number])) continue
      const key = `${p.topic}/${p.party}`
      if (seen.has(key)) continue
      seen.add(key)
      pairs.push({ topic: p.topic, party: p.party })
    }
    return pairs
  } catch {
    return []
  }
}

/** Slugs of approved live bills. Empty if Supabase is down. */
async function approvedBillSlugs(): Promise<string[]> {
  try {
    const bills = await getApprovedBills()
    return [...new Set(bills.map((b) => b.slug).filter(Boolean))]
  } catch {
    return []
  }
}
