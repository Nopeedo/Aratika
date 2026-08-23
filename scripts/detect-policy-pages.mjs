/**
 * detect-policy-pages.mjs — notice when a party publishes a NEW policy page.
 *
 * The daily refresh (draft-positions --if-changed) watches pages we already
 * point at. It cannot see a page that did not exist when we last looked, which
 * is the more common event during a campaign: a party announces a policy on a
 * topic we have nothing for, and the site stays empty on that topic because
 * nothing was ever configured to look.
 *
 * That gap is not hypothetical. ACT's climate and immigration topics read as
 * gaps for months while both were reachable from their own policy index, and
 * "no clear position found in the page" looks identical whether the party is
 * silent or we pointed at the wrong URL.
 *
 * So this crawls each party's policy INDEX, records the links it offers, and
 * reports what is new since last time. It writes nothing to content_items and
 * makes no model calls — it hands an operator a URL and the exact command to
 * draft from it.
 *
 * ABSENCE IS NOT REPORTED AS REMOVAL. A page vanishing from an index usually
 * means the site was restructured or the fetch half-failed, so disappearances
 * are counted and summarised, never listed as "the party dropped this policy".
 * A parse that collapses is caught by the same share guard the candidate ingest
 * uses: if most of a party's links vanish at once, that is the fetch breaking.
 *
 * Run:
 *   node scripts/detect-policy-pages.mjs                 (all parties)
 *   node scripts/detect-policy-pages.mjs --party=act
 *   node scripts/detect-policy-pages.mjs --gaps-only     (only topics we lack)
 *   node scripts/detect-policy-pages.mjs --dry-run       (never write the baseline)
 */
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { execFileSync } from 'node:child_process'
import { parse } from 'node-html-parser'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
dotenv.config({ path: join(root, '.env.local') })

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const GAPS_ONLY = args.includes('--gaps-only')
const partyArg = (args.find((a) => a.startsWith('--party=')) || '').split('=')[1] || null
const STATE_PATH = join(here, '.state', 'policy-pages.json')
const UA = 'Mozilla/5.0 (compatible; AraponoBot/1.0; +https://arapono.org.nz)'

// Read the party list and topic keywords from draft-positions rather than
// keeping a second copy. A detector that disagrees with the drafter about which
// parties exist is worse than no detector.
const drafter = readFileSync(join(here, 'draft-positions.mjs'), 'utf8')
const PARTIES = [...drafter.matchAll(/\{ slug: '([a-z-]+)',\s*name: '([^']+)',\s*sources: \{[\s\S]*?default:\s*'([^']+)'/g)]
  .map((m) => ({ slug: m[1], name: m[2], index: m[3] }))
const kwBlock = drafter.slice(drafter.indexOf('const TOPIC_KEYWORDS = {'), drafter.indexOf('function discoverTopicUrl'))
const TOPIC_KEYWORDS = {}
for (const m of kwBlock.matchAll(/^\s{2}'?([a-z-]+)'?:\s*\[([^\]]*)\]/gm)) {
  TOPIC_KEYWORDS[m[1]] = [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1])
}

if (PARTIES.length === 0 || Object.keys(TOPIC_KEYWORDS).length === 0) {
  console.error('Could not read parties or topic keywords out of draft-positions.mjs — its shape changed. Refusing to run on a half-parse.')
  process.exit(1)
}
console.log(`Parties: ${PARTIES.length} · topics: ${Object.keys(TOPIC_KEYWORDS).length}`)

const curlHtml = (url) =>
  execFileSync('curl', ['-s', '-L', '--max-time', '45', '-A', UA, url], { maxBuffer: 24 * 1024 * 1024 }).toString()

/** Which topic a link looks like, or null. Same scoring as discoverTopicUrl. */
function classify(href, text) {
  const hl = String(href).toLowerCase()
  const tl = String(text).toLowerCase()
  let best = null
  for (const [topic, kws] of Object.entries(TOPIC_KEYWORDS)) {
    const score = kws.reduce((s, k) => s + (hl.includes(k) ? 2 : 0) + (tl.includes(k) ? 1 : 0), 0)
    if (score && (!best || score > best.score)) best = { topic, score }
  }
  return best
}

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

// Which party/topic pairs we already hold something for — so a new page on a
// topic we already cover is noise, and one on a gap is the whole point.
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data: positions, error } = await sb.from('content_items').select('data').eq('type', 'position')
if (error) { console.error(`Could not read positions: ${error.message}`); process.exit(1) }
const covered = new Set(
  (positions || [])
    .filter((r) => String(r.data?.period || '') !== '2023')
    .map((r) => `${String(r.data?.party).toLowerCase()}|${String(r.data?.topic).toLowerCase()}`),
)

const prior = existsSync(STATE_PATH) ? JSON.parse(readFileSync(STATE_PATH, 'utf8')) : {}
const next = {}
const findings = []
let vanishedTotal = 0

for (const p of PARTIES) {
  if (partyArg && p.slug !== partyArg) { next[p.slug] = prior[p.slug]; continue }
  let links
  try { links = linksOn(p.index) } catch (e) {
    console.warn(`  ✗ ${p.slug}: fetch failed (${e.message.slice(0, 60)}) — keeping the previous baseline`)
    next[p.slug] = prior[p.slug]
    continue
  }
  const known = prior[p.slug] || []
  // A collapsed parse must not read as the party deleting its policies, and
  // must not overwrite a good baseline with a bad one.
  if (known.length >= 5 && links.length < known.length * 0.4) {
    console.warn(`  ⚠ ${p.slug}: only ${links.length} links, was ${known.length}. Treating as a broken fetch; baseline kept.`)
    next[p.slug] = known
    continue
  }
  next[p.slug] = links.map((l) => l.url)

  const knownSet = new Set(known)
  const fresh = links.filter((l) => !knownSet.has(l.url))
  const vanished = known.filter((u) => !links.some((l) => l.url === u))
  vanishedTotal += vanished.length

  const first = known.length === 0
  for (const l of fresh) {
    const hit = classify(l.url, l.text)
    if (!hit) continue
    const isGap = !covered.has(`${p.slug}|${hit.topic}`)
    if (GAPS_ONLY && !isGap) continue
    findings.push({ party: p, url: l.url, text: l.text, topic: hit.topic, isGap, first })
  }
  console.log(`  ${p.slug.padEnd(22)} ${String(links.length).padStart(3)} links` +
    (first ? '  (first run — recording baseline)' : `  ${fresh.length} new, ${vanished.length} gone`))
}

console.log('')
const gaps = findings.filter((f) => f.isGap && !f.first)
const other = findings.filter((f) => !f.isGap && !f.first)
const baseline = findings.filter((f) => f.first)

if (gaps.length) {
  console.log(`NEW POLICY PAGE ON A TOPIC WE HAVE NOTHING FOR (${gaps.length}):`)
  for (const f of gaps) {
    console.log(`  · ${f.party.name} — ${f.topic}`)
    console.log(`      "${f.text.slice(0, 60)}"  ${f.url}`)
    console.log(`      add to draft-positions.mjs sources, then:`)
    console.log(`      node scripts/draft-positions.mjs --party=${f.party.slug} --topic=${f.topic}`)
  }
} else if (!baseline.length) {
  console.log('No new policy pages on uncovered topics.')
}

if (other.length) {
  console.log(`\nNew pages on topics we already cover (${other.length}) — the daily --if-changed run will pick these up if they replace the page we read:`)
  for (const f of other.slice(0, 12)) console.log(`  · ${f.party.name}/${f.topic}: ${f.url}`)
}

if (baseline.length) console.log(`\nFirst run for some parties — ${baseline.length} classified link(s) recorded as baseline, not reported as new.`)
if (vanishedTotal) console.log(`\n${vanishedTotal} link(s) no longer on an index. NOT reported individually: an index dropping a link usually means the site moved it, not that the policy was withdrawn.`)

if (DRY) { console.log('\n(dry run — baseline not written)'); process.exit(0) }
mkdirSync(dirname(STATE_PATH), { recursive: true })
writeFileSync(STATE_PATH, JSON.stringify(next, null, 0))
console.log(`\nBaseline written for ${Object.keys(next).length} parties.`)
process.exit(0)
