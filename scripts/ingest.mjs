/**
 * Daily ingest — pulls from official sources and stages new/changed items into
 * Supabase `content_items` as status='pending' for editorial review. Nothing is
 * published directly; an editor approves items via /editor.
 *
 * Run:  node scripts/ingest.mjs            (real pull — needs PARLIAMENT_API_KEY)
 *       node scripts/ingest.mjs --demo     (insert one sample item to test the
 *                                           editor workflow without the API)
 *
 * Env required:
 *   NEXT_PUBLIC_SUPABASE_URL   (or SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY  (service role — bypasses RLS to stage items)
 *   PARLIAMENT_API_KEY         (NZ Parliament Open Data API — for the real pull)
 */

import { createClient } from '@supabase/supabase-js'
import Parser from 'rss-parser'
import dotenv from 'dotenv'

// Load .env.local for local runs (harmless in CI, where the file is absent and
// env comes from the workflow's `env:` block).
dotenv.config({ path: '.env.local' })

const DEMO = process.argv.includes('--demo')
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

// ── Sources ───────────────────────────────────────────────────────────────────
// Official PCO legislation RSS feeds (browser-free, no key). The new NZ
// Legislation site (launched 8 Mar 2026) moved the feed URLs, so set the exact
// one(s) here or via the LEGISLATION_RSS_URLS env var (comma-separated). Find the
// current Bills feed URL on:
//   https://www.legislation.govt.nz/learn-more/find-and-use-legislation/keep-up-to-date-with-legislation/
// (the old feeds also still work via classic.legislation.govt.nz until decommissioned).
const DEFAULT_FEEDS = [
  // { url: 'https://www.legislation.govt.nz/<bills-feed-path>', type: 'legislation', label: 'NZ Legislation — Bills' },
]

function feeds() {
  const env = process.env.LEGISLATION_RSS_URLS
  if (env) return env.split(',').map((u) => u.trim()).filter(Boolean).map((url) => ({ url, type: 'legislation', label: 'NZ Legislation' }))
  return DEFAULT_FEEDS
}

const rss = new Parser({
  timeout: 20000,
  headers: { 'User-Agent': 'AratikaBot/1.0 (+https://aratika.nz; non-partisan civic information)' },
})

/**
 * Pull from the configured RSS feeds and normalise each item to:
 *   { type, source_id, title, data, summary, source_url }
 * Resilient: a failing feed is logged and skipped, never crashes the run.
 */
async function fetchSources() {
  const list = feeds()
  if (list.length === 0) {
    console.warn('No feeds configured. Set LEGISLATION_RSS_URLS (comma-separated) or DEFAULT_FEEDS to the current legislation Bills feed URL. (Use --demo to test the workflow.)')
    return []
  }
  const out = []
  for (const feed of list) {
    try {
      const parsed = await rss.parseURL(feed.url)
      for (const item of parsed.items ?? []) {
        const link = item.link || item.guid || ''
        out.push({
          type: feed.type,
          source_id: item.guid || link || item.title,
          title: (item.title || 'Untitled').trim(),
          data: {
            published: item.isoDate || item.pubDate || '',
            link,
            source: feed.label,
          },
          // Pre-fill a draft summary from the feed; the editor rewrites it to be
          // factual and neutral before approving.
          summary: (item.contentSnippet || item.content || '').replace(/\s+/g, ' ').trim().slice(0, 500),
          source_url: link,
        })
      }
      console.log(`Feed OK: ${feed.label} (${parsed.items?.length ?? 0} items)`)
    } catch (e) {
      console.warn(`Feed failed (skipped): ${feed.url} — ${e.message}`)
    }
  }
  return out
}

function demoItems() {
  return [{
    type: 'members_bill',
    source_id: 'demo-1',
    title: 'Demo Members’ Bill — Plain Language Act Amendment',
    data: { sponsor: 'Sample MP', party: 'Sample Party', status: 'In the ballot', number: 'DEMO-1' },
    summary: 'A sample members’ bill, shown so the editorial review workflow can be tested before the live API is connected.',
    source_url: 'https://bills.parliament.nz/proposed-members-bills',
  }]
}

async function upsertPending(item) {
  const { data: existing, error } = await supabase
    .from('content_items')
    .select('id, data, status')
    .eq('type', item.type).eq('source_id', item.source_id)
    .maybeSingle()
  if (error) throw error

  if (!existing) {
    await supabase.from('content_items').insert({
      type: item.type, source_id: item.source_id, title: item.title,
      data: item.data, summary: item.summary ?? null,
      status: 'pending', change_kind: 'new', source_url: item.source_url ?? null,
      fetched_at: new Date().toISOString(),
    })
    return 'new'
  }

  // Compare ONLY the feed-provided fields — never the editorial enrichment that
  // an editor added (policy_links, summaryBasic, stage, enriched, …).
  const ex = existing.data ?? {}
  const feedFields = ['link', 'published', 'source']
  const unchanged = feedFields.every((k) => ex[k] === item.data[k])
  if (unchanged) return 'unchanged'

  // MERGE: overlay the fresh feed fields but preserve everything the editor added.
  const mergedData = { ...ex, ...item.data }
  // A bill already approved+enriched stays live; we just refresh its factual feed
  // fields in place. Only not-yet-approved items sit in the pending queue.
  const nextStatus = existing.status === 'approved' ? 'approved' : 'pending'
  await supabase.from('content_items').update({
    title: item.title, data: mergedData,
    status: nextStatus, change_kind: 'updated', source_url: item.source_url ?? null,
    fetched_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq('id', existing.id)
  return 'updated'
}

async function main() {
  const items = DEMO ? demoItems() : await fetchSources()

  // Safeguard: a real pull that returns nothing is almost certainly a broken
  // fetch — abort and keep the last-good data rather than wiping anything.
  if (!DEMO && items.length === 0) {
    console.error('No items returned — aborting (keeping last-good data). Wire fetchSources() once the API key is set.')
    process.exit(1)
  }

  const counts = { new: 0, updated: 0, unchanged: 0 }
  for (const item of items) {
    try { counts[await upsertPending(item)]++ }
    catch (e) { console.error('Failed on', item.type, item.source_id, e.message) }
  }
  console.log(`Ingest done — new: ${counts.new}, updated: ${counts.updated}, unchanged: ${counts.unchanged}. New/updated await review at /editor.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
