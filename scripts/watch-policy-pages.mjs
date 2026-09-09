/**
 * watch-policy-pages.mjs — watch every policy page every party publishes.
 *
 * WHY THIS REPLACES THE KEYWORD DETECTOR
 *
 * The old detector was topic-first: it iterated 11 topics and went hunting for a
 * page for each. Nothing ever asked "what has this party actually published?"
 * That inversion produced three failures, all of them silent:
 *
 *   1. A page whose URL and link text matched none of the 61 hardcoded keyword
 *      substrings was dropped at `if (!hit) continue` before any reporting. On
 *      the committed baseline that was 264 of 404 known links — 65%. The Greens'
 *      "Affordable Kai" policy (publicly owned supermarkets, announced 7 Sep
 *      2026) matched nothing: no keyword anywhere covers food, kai, grocer,
 *      supermarket or price. Their long-standing /food_policy page has never
 *      been classifiable either.
 *
 *   2. Substring matching mislabelled what it did catch. 'iwi' matches
 *      "k·iwi·saver", so National's and NZ First's KiwiSaver policies both
 *      classified as treaty-maori-affairs. 'justice' matches the domain
 *      animaljustice.org.nz, so every Animal Justice Party link — including a
 *      pagination link whose text was "4" — classified as crime-justice.
 *
 *   3. A new page on a topic already covered was demoted to an FYI line saying
 *      the daily --if-changed run would pick it up. It cannot: that run
 *      re-hashes only the URL hardcoded in draft-positions.mjs, so a new policy
 *      at a new URL is never fetched by anything, ever.
 *
 * So topic classification moved from a GATE ON FETCHING to an OUTPUT OF READING.
 * A page gets fetched because it is on the party's index, and gets a topic
 * because something read it. No vocabulary list decides whether a policy is
 * allowed to be seen.
 *
 * HOW IT STAYS AFFORDABLE
 *
 * Every page is fetched daily (~400 of them) and hashed. A model is called only
 * for pages that are NEW or whose text actually MOVED, and those are batched.
 * A steady-state run makes zero model calls. This is the same economics that
 * already make refresh-positions --if-changed affordable daily.
 *
 * WHAT IT DOES NOT DO
 *
 * It writes nothing to content_items and publishes nothing. It maintains a
 * registry and hands draft-positions.mjs a wider set of source URLs. Every
 * position still lands as `pending` for /editor, and an approved position stays
 * live until a human replaces it.
 *
 * Run: node scripts/watch-policy-pages.mjs [--dry-run] [--party=green]
 *                                          [--max-triage=N]
 */

import dotenv from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'
import { parse } from 'node-html-parser'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: join(root, '.env.local') })

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const partyArg = (args.find((a) => a.startsWith('--party=')) || '').split('=')[1] || null
/** Ceiling on model calls in one run, so a party rebuilding its whole site
 *  cannot turn into an unbounded bill overnight. Surplus is reported, not
 *  silently dropped, and picked up on the next run. */
const MAX_TRIAGE = Number((args.find((a) => a.startsWith('--max-triage=')) || '').split('=')[1] || 120)
/** Consecutive failed fetches before a known page is evicted from the registry. */
const MISS_LIMIT = 3

const STATE_PATH = join(root, 'scripts/.state/policy-watch.json')
const SOURCES_PATH = join(root, 'scripts/.state/discovered-policy-sources.json')

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

// ── Parties, read from the drafter so there is one list, not two ─────────────
// A second copy of this list would drift, and the drift would look like a party
// having published nothing.
const drafter = readFileSync(join(root, 'scripts/draft-positions.mjs'), 'utf8')
const PARTIES = []
{
  const block = drafter.slice(drafter.indexOf('const PARTIES = ['), drafter.indexOf('function discoverTopicUrl'))
  for (const m of block.matchAll(/\{\s*slug:\s*'([a-z-]+)',\s*name:\s*'([^']*)'[\s\S]{0,600}?default:\s*'([^']+)'/g)) {
    PARTIES.push({ slug: m[1], name: m[2], index: m[3] })
  }
}
const TOPICS = (() => {
  const b = drafter.slice(drafter.indexOf('const TOPIC_KEYWORDS = {'), drafter.indexOf('function discoverTopicUrl'))
  return [...b.matchAll(/^\s{2}'?([a-z-]+)'?:\s*\[/gm)].map((m) => m[1])
})()

if (!PARTIES.length || !TOPICS.length) {
  console.error('Could not read parties or topics out of draft-positions.mjs — its shape changed. Refusing to run on a half-parse.')
  process.exit(1)
}

const targets = partyArg ? PARTIES.filter((p) => p.slug === partyArg) : PARTIES
if (!targets.length) { console.error(`No party matching --party=${partyArg}`); process.exit(1) }

console.log(`Watching ${targets.length} part${targets.length === 1 ? 'y' : 'ies'} across ${TOPICS.length} topics`)
if (DRY) console.log('DRY RUN — no state written.\n')

// ── Fetch helpers ────────────────────────────────────────────────────────────
// --fail matters: without it curl exits 0 on a 404 and hands back the error
// page, so a dead policy URL looks like a page whose content merely changed —
// it would be re-triaged forever and never evicted.
const curlHtml = (url) =>
  execFileSync('curl', ['-s', '-L', '--fail', '--max-time', '45', '-A', UA, url], { maxBuffer: 24 * 1024 * 1024 }).toString()

/**
 * The readable text of a page, with the furniture removed.
 *
 * Hashing raw HTML is the obvious implementation and it is useless: a nav
 * highlight, a rotating "latest news" strip or a copyright year moves the hash
 * every single day, so every page reads as changed and every page costs a model
 * call. Stripping to main content and normalising whitespace is what makes
 * "changed" mean "the policy text moved".
 */
function pageText(html) {
  const r = parse(html)
  r.querySelectorAll('script,style,noscript,svg,header,footer,nav,form,iframe').forEach((e) => e.remove())
  return r.text.replace(/\s+/g, ' ').trim()
}

const contentHash = (text) => createHash('sha256').update(String(text || '').slice(0, 40000)).digest('hex').slice(0, 32)

/** Same-origin links on an index page. Anchor text kept for the triage prompt. */
function linksOn(indexUrl) {
  const html = curlHtml(indexUrl)
  let origin
  try { origin = new URL(indexUrl).origin } catch { return [] }
  const idxClean = indexUrl.replace(/#.*$/, '')
  const out = new Map()
  for (const a of parse(html).querySelectorAll('a')) {
    const href = a.getAttribute('href')
    if (!href || /^(#|mailto|tel|javascript)/i.test(href)) continue
    let abs
    try { abs = new URL(href, indexUrl).href.replace(/#.*$/, '') } catch { continue }
    try { if (new URL(abs).origin !== origin) continue } catch { continue }
    if (abs === idxClean) continue
    const text = (a.text || '').replace(/\s+/g, ' ').trim()
    if (!out.has(abs) || (text && !out.get(abs))) out.set(abs, text)
  }
  return [...out.entries()].map(([url, text]) => ({ url, text }))
}

/**
 * Obvious non-content, excluded before we spend a fetch on it.
 *
 * Deliberately a thin list of things that are structurally not policy — a
 * donate form, a login, a pagination cursor. It is NOT a topic filter and must
 * never become one: the whole point of this rewrite is that we do not decide
 * what a policy is allowed to be about before reading it. When in doubt the
 * page is fetched, and the model says no cheaply once and is never asked again.
 */
const JUNK = /\/(donate|join|login|signin|sign-in|register|privacy|terms|contact|subscribe|shop|store|cart|checkout|search|feed|rss|tag|tags|author|category|wp-|page)\/?(\d+\/?)?$|\.(pdf|jpe?g|png|gif|svg|webp|mp4|zip|docx?)$/i

// ── State ────────────────────────────────────────────────────────────────────
/** { [slug]: { [url]: { hash, verdict, topic, title, firstSeen, lastChanged, triages } } } */
let state = {}
if (existsSync(STATE_PATH)) {
  try { state = JSON.parse(readFileSync(STATE_PATH, 'utf8')) }
  catch (e) { console.warn(`  ⚠ could not read state (${e.message}) — treating as first run`) }
}

// One-time migration from the old detector's link baseline.
//
// Never-forget only protects pages already in THIS registry, and the old
// baseline holds pages that have since fallen off their party's index — 49
// live National policy pages among them, everything from /policies/familyboost
// to /policies/electrify-nz. Without this they would be permanently invisible:
// not on any index to be discovered, not in the registry to be remembered.
// Harmless to re-run; anything already known keeps its hash and verdict.
{
  let migrated = 0
  try {
    const old = JSON.parse(readFileSync(join(root, 'scripts/.state/policy-pages.json'), 'utf8'))
    for (const [slug, urls] of Object.entries(old)) {
      if (!Array.isArray(urls)) continue
      const reg = (state[slug] ||= {})
      for (const u of urls) {
        if (reg[u] || JUNK.test(new URL(u).pathname)) continue
        reg[u] = { firstSeen: 'migrated', triages: 0 }
        migrated++
      }
    }
  } catch { /* no old baseline — nothing to migrate */ }
  if (migrated) console.log(`  migrated ${migrated} page(s) from the previous detector's baseline
`)
}

const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null
if (!anthropic) {
  // Say so loudly. A run that quietly cannot classify anything, and therefore
  // reports no new policies, is indistinguishable from a run where no party
  // published anything — which is exactly the failure this file exists to end.
  console.warn('  ⚠ ANTHROPIC_API_KEY not set — pages will be hashed and tracked, but nothing can be classified.')
}

/**
 * Ask the model which of these pages are policy statements, and on what topic.
 *
 * Batched because the per-page question is small and the per-call overhead is
 * not: 20 pages per call turns a 400-page bootstrap into 20 calls. Only the
 * first 1200 characters of each page are sent — enough to tell a policy from a
 * media release or an events listing, and far less than drafting needs.
 */
async function triage(batch) {
  if (!anthropic) return batch.map(() => null)
  const system =
    'You classify pages from New Zealand political party websites. You are not summarising or evaluating policy, ' +
    'and you must not comment on whether any policy is good. For each numbered page decide two things.\n\n' +
    'isPolicy: true only if the page states what the party would DO — a policy, a plan, a commitment, a position. ' +
    'False for news or media releases about events, biographies, membership or donation pages, event listings, ' +
    'general "about us" pages, and index pages that only link elsewhere.\n\n' +
    `topic: if isPolicy, the single best fit from exactly this list: ${TOPICS.join(', ')}. ` +
    'Choose on what the page is ABOUT, never on words in the URL. A KiwiSaver policy is economy, not a Māori-affairs ' +
    'policy. A supermarket or grocery-price policy is economy. A policy named in te reo Māori takes the topic of its ' +
    'subject, not treaty-maori-affairs, unless it is genuinely about the Treaty, Māori representation or Māori affairs.\n\n' +
    'Reply with ONLY a JSON array, one object per page, in the same order: ' +
    '[{"n":1,"isPolicy":true,"topic":"economy","title":"Short plain title"}]. ' +
    'When isPolicy is false, set topic to null.'
  const user = batch.map((b, i) =>
    `--- PAGE ${i + 1} ---\nURL: ${b.url}\nLINK TEXT: ${b.linkText || '(none)'}\nCONTENT: ${b.text.slice(0, 1200)}`,
  ).join('\n\n')

  const resp = await anthropic.messages.create({
    model: MODEL, max_tokens: 2000, system, messages: [{ role: 'user', content: user }],
  })
  const raw = resp.content.map((c) => (c.type === 'text' ? c.text : '')).join('')
  const m = raw.match(/\[[\s\S]*\]/)
  if (!m) { console.warn('  ⚠ triage returned no JSON array — batch left unclassified, will retry next run'); return batch.map(() => null) }
  let parsed
  try { parsed = JSON.parse(m[0]) } catch { console.warn('  ⚠ triage JSON did not parse — batch left unclassified'); return batch.map(() => null) }
  return batch.map((_, i) => {
    const r = parsed.find((x) => Number(x.n) === i + 1) || parsed[i]
    if (!r) return null
    const topic = r.isPolicy && TOPICS.includes(r.topic) ? r.topic : null
    return { isPolicy: !!r.isPolicy && !!topic, topic, title: String(r.title || '').slice(0, 120) }
  })
}

// ── Crawl ────────────────────────────────────────────────────────────────────
// NZ local date, not UTC. NZ is UTC+12/13, so a morning run here stamps
// yesterday in UTC — which makes the freshness heartbeat read a day stale and
// would eventually cry wolf. The rest of the repo (electoral-calendar,
// detect-electoral-dates) uses Pacific/Auckland for the same reason.
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })
const pending = []          // pages needing triage this run
const stats = { crawled: 0, fetched: 0, unchanged: 0, failed: 0, skippedJunk: 0, offIndex: 0, dropped: 0 }
const firstRunParties = []

for (const p of targets) {
  const known = state[p.slug] || {}
  const isFirstRun = Object.keys(known).length === 0
  if (isFirstRun) firstRunParties.push(p.slug)

  let links
  try { links = linksOn(p.index) } catch (e) { console.warn(`  ✗ ${p.slug}: index fetch failed (${e.message})`); continue }

  // The same broken-fetch guard the old detector had, and for the same reason:
  // a blocked or redirected index returns a handful of links, and without this
  // every page we hold would read as "gone" and the registry would be gutted in
  // one run. Keeping the old state is always the safer failure.
  const onIndex = links.filter((l) => !JUNK.test(new URL(l.url).pathname))
  stats.skippedJunk += links.length - onIndex.length

  // ONCE WATCHED, ALWAYS WATCHED — until the page actually 404s.
  //
  // An index is a menu, not an archive. National's /plan links twelve policy
  // pages today; forty-nine more are live, published, reachable by search, and
  // simply no longer on the menu. The old detector rediscovered this every run
  // and threw it away with the line "an index dropping a link usually means the
  // site moved it, not that the policy was withdrawn" — correct reasoning,
  // followed by dropping the page anyway.
  //
  // So the crawl set is the index UNION everything already known. A page leaves
  // only by returning 404 on MISS_LIMIT consecutive runs, because one bad
  // response during a deploy must not evict a real policy.
  const knownUrls = Object.keys(known)
  const seenOnIndex = new Set(onIndex.map((l) => l.url))
  const candidates = [
    ...onIndex,
    ...knownUrls.filter((u) => !seenOnIndex.has(u)).map((u) => ({ url: u, text: known[u]?.title || '' })),
  ]
  stats.offIndex += candidates.length - onIndex.length
  // A thin index used to abort the party entirely, because losing the link list
  // meant losing the pages. With never-forget that is no longer true: every
  // known page is still checked, so a broken index only costs DISCOVERY of new
  // pages for one run. Worth saying out loud, not worth skipping the party for.
  const knownCount = knownUrls.length
  if (knownCount >= 5 && onIndex.length < knownCount * 0.4) {
    console.warn(`  ⚠ ${p.slug}: index returned only ${onIndex.length} links (know ${knownCount}). Possible broken fetch — no new pages will be discovered this run; known pages still checked.`)
  }

  stats.crawled += candidates.length
  const next = state[p.slug] = state[p.slug] || {}

  for (const l of candidates) {
    let text
    try { text = pageText(curlHtml(l.url)); stats.fetched++; if (known[l.url]) known[l.url].misses = 0 }
    catch {
      // A page that is gone stays watched for MISS_LIMIT runs before eviction.
      // One 502 during a deploy must never delete a real policy, and a genuine
      // 404 three days running is a real removal worth acting on.
      stats.failed++
      const e = known[l.url]
      if (e) {
        e.misses = (e.misses || 0) + 1
        if (e.misses >= MISS_LIMIT) { delete known[l.url]; stats.dropped++; console.log(`  − ${p.slug}: dropped after ${MISS_LIMIT} failed fetches — ${l.url}`) }
      }
      continue
    }
    if (text.length < 300) continue     // a stub or a redirect landing page

    const hash = contentHash(text)
    const prior = next[l.url]

    // Unchanged AND already judged. Both halves are load-bearing.
    //
    // Testing the hash alone loses every page that was recorded but never
    // classified — anything past the --max-triage ceiling, or in a batch whose
    // model call failed. Those keep their hash, so on the next run they look
    // unchanged, get skipped, and are never classified again: recorded as done
    // while nothing was done, which is the exact failure this repo keeps hitting.
    // A page with no verdict is unfinished work no matter how still its content is.
    if (prior && prior.hash === hash && prior.verdict) { stats.unchanged++; continue }

    const entry = next[l.url] = prior || { firstSeen: today, triages: 0 }
    entry.hash = hash
    entry.lastChanged = today

    // Everything new or changed is triaged, first run included.
    //
    // An earlier version of this file skipped triage on a first run to avoid a
    // flood, marking pages 'unseeded'. That was a bug: the next run finds the
    // hash unchanged, skips the page entirely, and the entry stays unclassified
    // forever. Any page not triaged here is one nothing will ever look at again.
    //
    // Flood control does not belong here anyway. Triage is cheap — 20 pages per
    // call, a few cents for the whole site — and its output is a registry, not
    // an editor queue. What actually needs throttling is DRAFTING, which is
    // refresh-positions' decision, made against fingerprints this file records.
    // A first run's findings are reported as a baseline rather than as news;
    // that is presentation, and it is handled at the report, not here.
    // `backlog` = recorded on an earlier run but never judged (over the triage
    // ceiling, or a failed batch). Not news — just work that was queued and is
    // now being finished — so it is counted with the baseline, not announced.
    pending.push({ slug: p.slug, name: p.name, url: l.url, linkText: l.text, text, entry,
      isNew: !prior, firstRun: isFirstRun, backlog: !!prior && !prior.verdict })
  }

  const seen = Object.keys(next).length
  console.log(`  ${p.slug.padEnd(22)} ${String(candidates.length).padStart(3)} pages` +
    (isFirstRun ? '  (first run — recording state)' : `  ${pending.filter((x) => x.slug === p.slug).length} new/changed of ${seen} tracked`))
}

// ── Triage ───────────────────────────────────────────────────────────────────
const overflow = Math.max(0, pending.length - MAX_TRIAGE)
const toTriage = pending.slice(0, MAX_TRIAGE)
if (overflow) console.log(`\n${overflow} page(s) over the --max-triage=${MAX_TRIAGE} ceiling — NOT dropped, picked up next run.`)

const drafts = []
const reclassified = []
if (toTriage.length && anthropic && !DRY) {
  console.log(`\nTriaging ${toTriage.length} new/changed page(s) in ${Math.ceil(toTriage.length / 20)} call(s)…`)
  for (let i = 0; i < toTriage.length; i += 20) {
    const batch = toTriage.slice(i, i + 20)
    let verdicts
    try { verdicts = await triage(batch) }
    catch (e) { console.warn(`  ⚠ triage call failed (${e.message}) — batch retried next run`); continue }
    batch.forEach((b, j) => {
      const v = verdicts[j]
      if (!v) return
      b.entry.triages = (b.entry.triages || 0) + 1
      b.entry.verdict = v.isPolicy ? 'policy' : 'not-policy'
      b.entry.title = v.title

      // A PAGE KEEPS THE TOPIC IT WAS FIRST GIVEN.
      //
      // Topic is the one field that feeds draft-positions: it decides which
      // topic's source set a URL joins, so a page moving between topics
      // re-drafts every position in BOTH the topic it left and the one it
      // joined. Classification is a model call and is not deterministic, so an
      // unchanged page re-triaged after a trivial edit can flip and take a
      // dozen positions with it. That is what happened on 8 Sep 2026:
      // national.org.nz/policies/new-trade moved economy -> foreign-policy and
      // a wave of re-drafts followed, none of which reflected a party changing
      // anything.
      //
      // So first classification wins, and a later disagreement is REPORTED
      // rather than applied — visible if a party genuinely repurposes a page,
      // silent-free but stable if the model is just wavering. Titles are not
      // stabilised because nothing downstream reads them.
      const held = b.entry.topic
      if (v.isPolicy) {
        if (held && v.topic && v.topic !== held) {
          reclassified.push(`${b.slug}: ${b.url} — filed ${held}, re-triage says ${v.topic} (kept ${held})`)
        }
        b.entry.topic = held || v.topic
        drafts.push({ ...b, topic: b.entry.topic, title: v.title })
      } else {
        b.entry.topic = null
      }
    })
  }
} else if (toTriage.length && DRY) {
  console.log(`\n(dry run — ${toTriage.length} page(s) would be triaged)`)
}

// ── Report ───────────────────────────────────────────────────────────────────
console.log(`\ncrawled ${stats.crawled} · fetched ${stats.fetched} · unchanged ${stats.unchanged} · junk skipped ${stats.skippedJunk} · fetch failed ${stats.failed}`)

// A first run classifies a party's whole catalogue at once. Those are not
// "new policies announced" — they are the baseline — so they are counted and
// not listed one by one, or a first run would read as 51 breaking stories.
const seeded = drafts.filter((d) => d.firstRun || d.backlog)
const newPolicies = drafts.filter((d) => !d.firstRun && !d.backlog && d.isNew)
const changedPolicies = drafts.filter((d) => !d.firstRun && !d.backlog && !d.isNew)

if (seeded.length) {
  const byParty = seeded.reduce((m, d) => ((m[d.name] = (m[d.name] || 0) + 1), m), {})
  console.log(`\nBASELINE RECORDED — ${seeded.length} policy page(s) classified for the first time:`)
  for (const [name, n] of Object.entries(byParty)) console.log(`  · ${name}: ${n}`)
  console.log('  These now feed the drafter. refresh-positions will re-draft the topics they widen.')
}

if (newPolicies.length) {
  console.log(`\nNEW POLICY PAGES (${newPolicies.length}):`)
  for (const d of newPolicies) console.log(`  · ${d.name} / ${d.topic} — "${d.title}"\n      ${d.url}`)
}
if (changedPolicies.length) {
  console.log(`\nCHANGED POLICY PAGES (${changedPolicies.length}):`)
  for (const d of changedPolicies) console.log(`  · ${d.name} / ${d.topic} — "${d.title}"\n      ${d.url}`)
}
if (reclassified.length) {
  console.log(`
RE-TRIAGE DISAGREED ON ${reclassified.length} PAGE(S) — original topic kept:`)
  for (const r of reclassified) console.log(`  ~ ${r}`)
  console.log('  If a party has genuinely repurposed a page, move it by hand; otherwise this is the model wavering.')
}

if (!newPolicies.length && !changedPolicies.length && !firstRunParties.length) {
  console.log('\nNo new or changed policy pages.')
}

// ── Write the source registry the drafter reads ──────────────────────────────
// party → topic → [{url, title}], every page currently judged a policy. This is
// what widens draft-positions.mjs from "the one URL in the config" to "every
// page this party publishes on this topic".
const sources = {}
for (const [slug, pages] of Object.entries(state)) {
  for (const [url, e] of Object.entries(pages)) {
    if (e.verdict !== 'policy' || !e.topic) continue
    ;((sources[slug] ||= {})[e.topic] ||= []).push({ url, title: e.title || '' })
  }
}
for (const t of Object.values(sources)) for (const list of Object.values(t)) list.sort((a, b) => a.url.localeCompare(b.url))

// A heartbeat, committed with the file, so something outside this script can
// tell whether it ran. Twelve days of scheduled failures went unnoticed because
// the only evidence was a red badge and a log nobody opened; check-freshness
// reads this instead and fails the morning check if the watcher goes quiet.
// `_meta` cannot collide with a party key — slugs are [a-z-]+ and cannot start
// with an underscore — and the drafter only ever looks up by slug, so it never
// sees this.
sources._meta = {
  lastRun: today,
  parties: Object.keys(sources).length,
  policyPages: Object.values(sources).reduce((n, t) => n + Object.values(t).reduce((m, l) => m + l.length, 0), 0),
}

if (DRY) { console.log('\n(dry run — state not written)'); process.exit(0) }

mkdirSync(dirname(STATE_PATH), { recursive: true })
writeFileSync(STATE_PATH, JSON.stringify(state, null, 0))
writeFileSync(SOURCES_PATH, JSON.stringify(sources, null, 2))

console.log(`\nState written. ${sources._meta.policyPages} policy page(s) across ${sources._meta.parties} part(ies) now feed the drafter.`)

// A detector whose only output is stdout in a green log is not a detector. The
// old one was exactly that, which is why twelve days of it failing for an
// unrelated git error went unnoticed — nobody was reading a passing run either.
// Exit 2 when there is real work waiting, so the run goes red for a true reason
// and the daily refresh has something to act on.
if (newPolicies.length || changedPolicies.length) {
  console.log('\nExiting 2: policy pages changed. refresh-positions will re-draft them into /editor.')
  process.exit(2)
}
process.exit(0)
