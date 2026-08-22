/**
 * newsletter.mjs — build and send the Arapono Weekly.
 *
 *   node scripts/newsletter.mjs                 → DRY RUN (renders, sends nothing)
 *   node scripts/newsletter.mjs --self you@x.nz → send ONE real email to you (test)
 *   node scripts/newsletter.mjs --send          → send to all subscribed accounts
 *
 * SAFETY: without --send (or --self) nothing is delivered. Newsletter is opt-OUT
 * (on by default); anyone with notification_prefs.email_digest_enabled = false is
 * skipped. One-click unsubscribe uses each user's token via /api/newsletter/unsubscribe.
 */

import dotenv from 'dotenv'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { sb, emailUser, userEmailMap } from './lib/notify.mjs'
import { renderNewsletter } from './newsletter/template.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
dotenv.config({ path: join(root, '.env.local') })

const SELF = (process.argv.find((a) => a.startsWith('--self')) || '').split('=')[1]
  || (process.argv.includes('--self') ? process.argv[process.argv.indexOf('--self') + 1] : null)
const LIVE = process.argv.includes('--send') || !!SELF
const SITE = (process.env.NEXT_PUBLIC_APP_URL || 'https://arapono.org.nz').replace(/\/$/, '')
const lc = (v) => String(v || '').toLowerCase()

const PARTY = {
  national: { name: 'National', color: '#0A5BA8' }, labour: { name: 'Labour', color: '#D5202B' },
  green: { name: 'Green', color: '#1F8A4C' }, act: { name: 'ACT', color: '#F5C518' },
  nzfirst: { name: 'NZ First', color: '#181a1f' }, tpm: { name: 'Te Pāti Māori', color: '#B11226' },
}

// ── days to election ──
const ELECTION = '2026-11-07'
const todayNZ = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })
const daysToElection = Math.max(0, Math.round((Date.parse(`${ELECTION}T00:00:00Z`) - Date.parse(`${todayNZ}T00:00:00Z`)) / 86400000))
const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString()

// ── bills (stats) ──
function loadBills() {
  const text = readFileSync(join(root, 'src/constants/bills-54.ts'), 'utf8')
  const line = text.split(/\r?\n/).find((l) => l.startsWith('export const BILLS_54:'))
  return JSON.parse(line.slice(line.indexOf('[', line.indexOf('='))).replace(/;\s*$/, ''))
}
const bills = loadBills()
const billStatusBySlug = new Map(bills.map((b) => [b.slug, b]))
const billByTitle = new Map(bills.map((b) => [lc(b.title).replace(/[^a-z0-9]/g, ''), b]))
const stats = {
  passed: bills.filter((b) => /royal assent/i.test(b.status) && b.date >= todayNZ.slice(0, 4) && b.date >= weekAgo.slice(0, 10)).length,
  newBills: bills.filter((b) => b.date >= weekAgo.slice(0, 10) && !/royal assent/i.test(b.status)).length,
  submissions: bills.filter((b) => b.submissionsCalled && b.submissionsClose && b.submissionsClose >= todayNZ).length,
}

// ── recent content (general + matching) ──
const { data: content } = await sb().from('content_items')
  .select('id, type, title, data, source_url, fetched_at, summary')
  .in('type', ['news', 'video']).eq('status', 'approved').gte('fetched_at', weekAgo)
  .order('fetched_at', { ascending: false })
const news = (content || []).filter((c) => c.type === 'news')
const video = (content || []).find((c) => c.type === 'video')

const general = {
  stories: news.slice(0, 5).map((n) => ({ title: n.title, blurb: n.summary || '', url: n.data?.link || n.source_url || `${SITE}/news`, source: n.data?.outlet || '' })),
  video: video ? { title: video.title, meta: video.data?.outlet || 'from the debates rail', url: video.data?.link || video.source_url || `${SITE}/news` } : null,
  stats,
}

// index content tags → for personalised counting
const tagIndex = (content || []).map((c) => ({
  c, parties: (c.data?.parties || []).map(lc), mps: (c.data?.mps || []).map(lc), topics: (c.data?.topics || []).map(lc),
}))

// ── recipients ──
const emails = await userEmailMap()
const { data: prefsRows } = await sb().from('notification_prefs').select('user_id, email_digest_enabled, unsubscribe_token')
const prefs = new Map((prefsRows || []).map((p) => [p.user_id, p]))
let recipientIds = [...emails.keys()].filter((id) => prefs.get(id)?.email_digest_enabled !== false)
if (SELF) {
  const match = [...emails.entries()].find(([, e]) => lc(e) === lc(SELF))
  recipientIds = match ? [match[0]] : []
  if (!match) console.log(`--self ${SELF}: no account with that email; nothing to send.`)
}

// all bookmarks grouped by user (for the personalised block)
// `href` is the page the reader tracked from. Without it every row in the
// personalised block was dead text: the one section built around what someone
// follows was the one section they could not click.
const { data: bms } = await sb().from('bookmarks').select('user_id, kind, ref_id, label, href')
const bmByUser = new Map()
for (const b of bms || []) { if (!bmByUser.has(b.user_id)) bmByUser.set(b.user_id, []); bmByUser.get(b.user_id).push(b) }

/** Where a tracked row points.
 *
 *  The bookmark's own href first — it is the page they tracked from, and for
 *  bills it is the ONLY link that resolves: /bills/[slug] serves the ten curated
 *  bills and the defining ones, not the daily register, so /bills/<register-slug>
 *  is a 404. The per-kind fallbacks are for bookmarks saved before href was
 *  stored, and bills fall back to the tracker rather than to a guess. */
function linkFor(b) {
  if (b.href) return `${SITE}${b.href}`
  if (b.kind === 'party') return `${SITE}/parties/${b.ref_id}`
  if (b.kind === 'mp') return `${SITE}/mps/${b.ref_id}`
  if (b.kind === 'policy') return `${SITE}/policies/${b.ref_id}`
  return `${SITE}/bills`
}

function trackedFor(userId) {
  const out = []
  for (const b of (bmByUser.get(userId) || [])) {
    if (out.length >= 5) break
    if (b.kind === 'bill') {
      const bill = billStatusBySlug.get(b.ref_id) || billByTitle.get(lc(b.label).replace(/[^a-z0-9]/g, ''))
      if (bill) out.push({ dot: '#3730a3', title: bill.title, chip: bill.status, meta: 'A bill you follow.', url: linkFor(b) })
    } else if (b.kind === 'party' || b.kind === 'mp' || b.kind === 'policy') {
      const field = b.kind === 'party' ? 'parties' : b.kind === 'mp' ? 'mps' : 'topics'
      const matches = tagIndex.filter((t) => t[field].includes(lc(b.ref_id)))
      if (matches.length) {
        const p = PARTY[b.ref_id]
        out.push({ dot: p?.color || '#9a9186', title: p?.name || b.label, chip: `${matches.length} new`, meta: matches[0].c.title, url: linkFor(b) })
      }
    }
  }
  return out
}

// ── build unsubscribe URL (mint a prefs row/token on send if missing) ──
async function unsubUrl(userId) {
  let token = prefs.get(userId)?.unsubscribe_token
  if (!token) {
    if (!LIVE) return `${SITE}/api/newsletter/unsubscribe?token=DRYRUN`
    const { data } = await sb().from('notification_prefs').upsert({ user_id: userId, email_digest_enabled: true }, { onConflict: 'user_id' }).select('unsubscribe_token').single()
    token = data?.unsubscribe_token
  }
  return `${SITE}/api/newsletter/unsubscribe?token=${token}`
}

console.log(`Newsletter — ${daysToElection} days to election · ${general.stories.length} stories · ${recipientIds.length} recipient(s). ${LIVE ? (SELF ? `SELF → ${SELF}` : 'SENDING') : 'DRY RUN'}`)

let sent = 0
for (const userId of recipientIds) {
  const tracked = { items: trackedFor(userId) }
  const { subject, html, text } = renderNewsletter({
    name: '', daysToElection, tracked, general, siteUrl: SITE,
    // /dashboard, not /command-centre. Everyone receiving this has an account
    // by definition, so "your command centre" has to mean the one with their
    // things in it — /command-centre is the public page explaining the feature.
    unsubscribeUrl: await unsubUrl(userId), manageUrl: `${SITE}/dashboard`,
  })
  const to = emails.get(userId)
  if (!to) continue
  if (!LIVE) { console.log(`  ${to} — "${subject}" (${tracked.items.length} tracked)`); continue }
  if (await emailUser(to, subject, text, html)) sent++
}
console.log(LIVE ? `Done. Sent ${sent} email(s).` : 'Dry run complete — nothing sent.')
process.exit(0)
