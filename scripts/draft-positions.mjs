/**
 * draft-positions.mjs — Phase A of the party-by-party comparison.
 *
 * For each party, fetch their OFFICIAL policy page, and ask Claude (grounded ONLY
 * in that fetched text) for a neutral, plain-language summary of THAT party's
 * stated position on a topic. Writes each as a `position` item in content_items
 * with status='pending' — nothing is public until an editor approves at /editor.
 *
 * Credibility: grounded in the fetched source only; if the page doesn't contain a
 * clear position, we record nothing (never invent one). Every item keeps its
 * source_url. The human gate is the backstop.
 *
 * Run:
 *   node scripts/draft-positions.mjs                 (topic=economy, all parties)
 *   node scripts/draft-positions.mjs --topic=health
 *   node scripts/draft-positions.mjs --party=labour  (one party)
 *   node scripts/draft-positions.mjs --force         (re-draft even if approved)
 *
 * Needs: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'
import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'
import { execFileSync } from 'node:child_process'
import { parse } from 'node-html-parser'
import { PDFParse } from 'pdf-parse'
import { readFileSync, unlinkSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

dotenv.config({ path: '.env.local' })

const args = process.argv.slice(2)
const FORCE = args.includes('--force')
// Rewrite the approved stance/summary too, not just the breakdown. Use when a
// party has been repointed at a different page — see the merge block below.
const REPLACE = args.includes('--replace')
// Re-check approved positions against their source and re-draft only the ones
// whose source page has actually changed. Without this the drafter only ever
// FILLS GAPS: once a position is approved it is skipped forever, so a party
// could rewrite a policy and the site would keep summarising the old one
// indefinitely. Cheap because the comparison is a hash of the fetched text —
// a model call happens only when the page really moved.
const IF_CHANGED = args.includes('--if-changed')
const topicArg = (args.find((a) => a.startsWith('--topic=')) || '').split('=')[1] || 'economy'
const partyArg = (args.find((a) => a.startsWith('--party=')) || '').split('=')[1] || null
// Record a VERIFIED "no stated position" (after checking the party's policy index):
//   node scripts/draft-positions.mjs --no-position --party=tpm --topic=foreign-policy --source=<url> [--note="..."]
const NO_POSITION = args.includes('--no-position')
const sourceArg = (args.find((a) => a.startsWith('--source=')) || '').split('=')[1] || null
const noteArg = (() => { const a = args.find((x) => x.startsWith('--note=')); return a ? a.slice('--note='.length) : null })()
// '2026' = current policy from live sites; '2023' = the party's 2023 manifesto (PDF).
const PERIOD = (args.find((a) => a.startsWith('--period=')) || '').split('=')[1] === '2023' ? '2023' : '2026'
// Draft from browser-captured text saved under scripts/.cache/<party>-<topic>.txt
// or scripts/.cache/<party>.txt (for JS-rendered party sites we read via Chrome).
const FROM_CACHE = args.includes('--from-cache')
function readCache(slug, topic) {
  const dir = join(fileURLToPath(import.meta.url), '..', '.cache')
  for (const name of [`${slug}-${topic}.txt`, `${slug}.txt`]) {
    const p = join(dir, name)
    if (existsSync(p)) { const t = readFileSync(p, 'utf8').trim(); if (t.length > 200) return t }
  }
  return null
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'
if (!URL || !SERVICE_KEY) { console.error('Missing Supabase env'); process.exit(1) }
if (!ANTHROPIC_KEY) { console.error('Missing ANTHROPIC_API_KEY in .env.local'); process.exit(1) }

const supabase = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } })
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY })

// Topic catalogue (matches POLICY_TOPICS in the app).
const TOPICS = {
  economy: { label: 'Economy', desc: 'fiscal policy, tax, cost of living, employment, business regulation, infrastructure and economic growth' },
  housing: { label: 'Housing', desc: 'house prices, rents, social/public housing, building and tenancy' },
  health: { label: 'Health', desc: 'hospitals, primary care, mental health, funding and waiting times' },
  education: { label: 'Education', desc: 'schools, curriculum, tertiary, teachers and student support' },
  climate: { label: 'Climate', desc: 'emissions, climate targets, energy transition and adaptation' },
  'crime-justice': { label: 'Crime & Justice', desc: 'policing, sentencing, courts, prisons and community safety' },
  environment: { label: 'Environment', desc: 'conservation, biodiversity, water quality, pollution, oceans, waste and protecting natural habitats' },
  'treaty-maori-affairs': { label: 'Treaty & Māori Affairs', desc: 'Te Tiriti o Waitangi, Māori rights and representation, co-governance, and Māori wellbeing' },
  immigration: { label: 'Immigration', desc: 'visa and migration settings, the border, work and skills migration, refugees and citizenship' },
  'foreign-policy': { label: 'Foreign Policy', desc: 'international relations, trade agreements, defence, security and foreign affairs' },
  // Added to the site taxonomy after this map was written, so for a while the
  // pipeline could not draft or record ANYTHING for it, for any party — the
  // topic existed on the site and was permanently unfillable. If a topic is
  // added to POLICY_TOPIC_ORDER it has to be added here too.
  'democracy-government': { label: 'Democracy & Government', desc: 'elections and electoral law, the constitution, local government, public service, transparency and how decisions get made' },
}

// Each party's official policy source(s). `default` is used unless a
// topic-specific URL is listed (some parties keep each topic on its own page).
const PARTIES = [
  // National publishes ~50 individual policy pages but no single manifesto, and the
  // homepage (the old default) carries almost no policy text — which is why coverage
  // was thin and why Housing once picked up a commercial building-consent release.
  // Point each topic at the actual policy page. NB: National has no dedicated
  // Treaty/Māori Affairs policy page — that gap is real, not a capture failure.
  { slug: 'national', name: 'National', sources: {
    default:          'https://www.national.org.nz/policy-2023',
    economy:          'https://www.national.org.nz/policies/fiscal-plan',
    housing:          'https://www.national.org.nz/policies/housing-growth',
    education:        'https://www.national.org.nz/policies/teaching-the-basics-brilliantly',
    health:           'https://www.national.org.nz/policies/better-health-outcomes',
    'crime-justice':  'https://www.national.org.nz/lawandorder',
    environment:      'https://www.national.org.nz/policies/blueprint-for-a-better-environment',
    immigration:      'https://www.national.org.nz/policies/parent-visa-boost',
    'foreign-policy': 'https://www.national.org.nz/policies/foreign-affairs-defence-and-veterans',
  } },
  // /policy is a landing page that mostly links out; /our-policies is the 2026
  // election policy index and carries the actual announcements. Topic-specific
  // pages are listed where Labour has published one — they campaign on a narrow
  // set, so several topics genuinely have no published policy yet.
  // Labour publishes a page per ANNOUNCEMENT, not per topic — fifteen of them,
  // and /our-policies is the index carrying a one-line summary of each.
  //
  // So the rule here is the opposite of the Greens'. Point a topic at one
  // announcement ONLY where that announcement is the whole of what Labour has
  // said on it. Health has five policies (Medicard, prescriptions, maternity
  // scans, cervical screening, family doctor loans) and economy has four
  // (capital gains tax, Future Fund, fiscal strategy, small business); pointing
  // those at a single page would make one policy stand for the topic, which is
  // exactly the fault we found on National's immigration position pointing at
  // "Parent Visa Boost". They read the index instead, which covers all of them.
  { slug: 'labour',   name: 'Labour',         sources: {
    default:   'https://www.labour.org.nz/our-policies/',
    // One announcement each — the page IS the policy.
    climate:   'https://www.labour.org.nz/solarsaver',
    education: 'https://www.labour.org.nz/apprenticeshipboost',
    'treaty-maori-affairs': 'https://www.labour.org.nz/maori-trades-training',
  } },
  // The Greens publish a dedicated page per policy area — 56 of them — and
  // /policy is only the index that links to them. Drafting every topic from the
  // index meant summarising a page of headings, which is why their positions
  // drifted the moment that index was reorganised. Each topic now points at the
  // policy itself.
  { slug: 'green',    name: 'Green',          sources: {
    default:        'https://www.greens.org.nz/policy',
    manifesto:      'https://assets.nationbuilder.com/beachheroes/pages/17789/attachments/original/1688864858/Final-online-PDF-pages.pdf',
    economy:        'https://www.greens.org.nz/government_in_the_economy_policy',
    housing:        'https://www.greens.org.nz/housing_policy',
    health:         'https://www.greens.org.nz/health_policy',
    education:      'https://www.greens.org.nz/education_policy',
    climate:        'https://www.greens.org.nz/climate_change_policy',
    environment:    'https://www.greens.org.nz/biodiversity_environmental_regeneration_policy',
    'crime-justice':'https://www.greens.org.nz/justice_policy',
    'treaty-maori-affairs': 'https://www.greens.org.nz/te_tiriti_policy',
    immigration:    'https://www.greens.org.nz/immigration_policy',
    'foreign-policy':'https://www.greens.org.nz/global_affairs_policy',
    'democracy-government': 'https://www.greens.org.nz/governance_policy',
  } },
  // /policies is a section index with no prose, so a topic drafted from it
  // finds nothing. Each section has its own page; list them as they are needed.
  { slug: 'act',      name: 'ACT',            sources: { default: 'https://www.act.org.nz/policies', economy: 'https://www.act.org.nz/policies/economy', 'democracy-government': 'https://www.act.org.nz/policies/democracy', environment: 'https://www.act.org.nz/policies/hunting', 'crime-justice': 'https://www.act.org.nz/policies/law-and-order' } },
  // default is /policy — their CURRENT page, titled "Our Policy", ©2026, with
  // no mention of 2023. It had been /2023_policies, which is titled "2023
  // Election Policies" and opens "New Zealand First 2023 Policies": every one of
  // their eleven approved positions was drafted from 2023 campaign material and
  // shown as current. `manifesto` stays on the 2023 page, which is what that key
  // is for.
  { slug: 'nzfirst',  name: 'NZ First',       sources: { default: 'https://www.nzfirst.nz/policy', manifesto: 'https://www.nzfirst.nz/2023_policies' } },
  { slug: 'tpm',      name: 'Te Pāti Māori',  sources: { default: 'https://www.maoriparty.org.nz/policy' } },
  // TOP keeps one page per policy (opportunity.org.nz, formerly top.org.nz) — point each topic at its dedicated page.
  { slug: 'top',      name: 'The Opportunities Party', sources: {
    default:        'https://www.opportunity.org.nz/policy',
    'democracy-government': 'https://www.opportunity.org.nz/clean_up_politics',
    economy:        'https://www.opportunity.org.nz/tax-reset',
    housing:        'https://www.opportunity.org.nz/affordable_housing',
    health:         'https://www.opportunity.org.nz/healthy_people',
    education:      'https://www.opportunity.org.nz/future_fit_education',
    climate:        'https://www.opportunity.org.nz/climate_action',
    'crime-justice':'https://www.opportunity.org.nz/smart_on_crime',
  } },
  // Registered minor parties (non-parliamentary). Sources are each party's own
  // official policy page (verified). Many are single-issue or thin, so most topics
  // will honestly return {found:false} — recorded as a gap, never invented.
  { slug: 'alcp',           name: 'Aotearoa Legalise Cannabis Party', sources: { default: 'https://alcp.org.nz/policy/' } },
  { slug: 'animal-justice', name: 'Animal Justice Party Aotearoa NZ',  sources: { default: 'https://animaljustice.org.nz/policy/our-policies/' } },
  // conservatives.nz redirects to conservatives.org.nz, which is where the
  // policy pages actually live — the old default was the homepage, 1,780 chars
  // of navigation, which is why five topics were being summarised from nothing.
  // Housing, education, foreign policy and Treaty are deliberately absent: they
  // publish no page on those, so those topics fall back to the index and the
  // drafter will record nothing rather than invent one.
  { slug: 'conservative',   name: 'Conservative Party NZ',             sources: {
    default:        'https://www.conservatives.org.nz/policies/overview',
    health:         'https://www.conservatives.org.nz/policies/health',
    economy:        'https://www.conservatives.org.nz/policies/economy-1',
    environment:    'https://www.conservatives.org.nz/policies/environment',
    climate:        'https://www.conservatives.org.nz/policies/climate',
    immigration:    'https://www.conservatives.org.nz/policies/immigration',
    'crime-justice':'https://www.conservatives.org.nz/policies/policing',
    'democracy-government': 'https://www.conservatives.org.nz/policies/bureaucracy',
  } },
  { slug: 'nz-outdoors',    name: 'NZ Outdoors & Freedom Party',       sources: { default: 'http://outdoorsparty.co.nz/policy/' } },
  { slug: 'vision-nz',      name: 'Vision New Zealand',                sources: { default: 'https://www.vision.org.nz/' } },
  // Registered 5 August 2026. Without these the pipeline cannot draft or even
  // record an absence for them, which is how a party ends up with a profile
  // on the site and no route to policy coverage at all.
  { slug: 'alliance',     name: 'Alliance',       sources: { default: 'https://allianceparty.nz/what-we-stand-for/' } },
  { slug: 'free-palestine', name: 'Free Palestine', sources: { default: 'https://palfree.nz/' } },
  // /policy is a 1,215-character index — the drafter rejected it as "source text
  // too thin" on every run, which is why one position exists for a party that
  // publishes fifteen policy pages. Climate and democracy-government are left
  // unmapped: they publish nothing on either, so those fall back to the index
  // and record nothing rather than being stretched out of an adjacent page.
  { slug: 'nz-loyal',     name: 'NZ Loyal',       sources: {
    default:        'https://nzloyal.com/policy/',
    economy:        'https://nzloyal.com/economics',
    housing:        'https://nzloyal.com/housing',
    health:         'https://nzloyal.com/health',
    education:      'https://nzloyal.com/education',
    environment:    'https://nzloyal.com/environment',
    'crime-justice':'https://nzloyal.com/justice',
    'treaty-maori-affairs': 'https://nzloyal.com/treaty-of-waitangi',
    immigration:    'https://nzloyal.com/immigration',
    'foreign-policy':'https://nzloyal.com/foreign-affairs',
  } },
  { slug: 'te-tai-tokerau-party', name: 'Te Tai Tokerau Party', sources: { default: 'https://tetaitokerauparty.org.nz/' } },
  { slug: 'womens-rights',  name: 'The New Zealand Women’s Rights Party', sources: { default: 'https://womensrightsparty.nz/policy/' } },
]

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'

function curlHtml(url) {
  return execFileSync('curl', ['-s', '-L', '--max-time', '30', '-A', UA, url], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}
function fetchText(url) {
  const root = parse(curlHtml(url))
  root.querySelectorAll('script,style,noscript,svg,header,footer,nav,form').forEach((e) => e.remove())
  return root.text.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

// Party policy "index" pages often just LINK to each topic. Find the topic-specific
// sub-page so we draft from real content, not a menu of links.
const TOPIC_KEYWORDS = {
  economy: ['econom', 'tax', 'cost-of-living', 'cost_of_living', 'fiscal', 'gst'],
  housing: ['housing', 'rent', 'tenan', 'first-home', 'first_home', 'homes'],
  health: ['health', 'hospital', 'medic', 'mental'],
  education: ['education', 'school', 'student', 'teacher', 'curriculum'],
  climate: ['climate', 'emission', 'carbon', 'clean-energy', 'clean_energy'],
  'crime-justice': ['crime', 'justice', 'law-and-order', 'law_and_order', 'sentenc', 'police', 'corrections', 'gang'],
  environment: ['environment', 'conservation', 'biodiversity', 'water', 'freshwater', 'ocean', 'marine', 'pollution', 'waste', 'nature'],
  'treaty-maori-affairs': ['maori', 'māori', 'treaty', 'tiriti', 'waitangi', 'iwi', 'co-governance', 'cogovernance', 'indigenous', 'te-ao'],
  immigration: ['immigration', 'visa', 'migrant', 'migration', 'border', 'refugee', 'citizenship'],
  'foreign-policy': ['foreign', 'trade', 'defence', 'defense', 'international', 'diplomacy', 'security', 'affairs'],
  // The fourth list this topic was missing from. Without it discoverTopicUrl
  // could never find a governance page, which is why ACT and TOP came back
  // empty on the first sweep despite both publishing one.
  'democracy-government': ['democracy', 'democratic', 'constitution', 'electoral', 'election-law', 'referend', 'governance', 'government', 'local-government', 'transparen', 'lobbying', 'accountab', 'public-service', 'citizens'],
}
function discoverTopicUrl(indexUrl, topic) {
  let html; try { html = curlHtml(indexUrl) } catch { return null }
  const kws = TOPIC_KEYWORDS[topic] || [topic]
  let origin; try { origin = new URL(indexUrl).origin } catch { return null }
  const idxClean = indexUrl.replace(/#.*$/, '')
  let best = null
  for (const a of parse(html).querySelectorAll('a')) {
    const href = a.getAttribute('href'); if (!href) continue
    const hl = href.toLowerCase()
    if (/^(#|mailto|tel|javascript)/.test(hl)) continue
    const text = (a.text || '').toLowerCase().trim()
    const score = kws.reduce((s, k) => s + (hl.includes(k) ? 2 : 0) + (text.includes(k) ? 1 : 0), 0)
    if (!score) continue
    let abs; try { abs = new URL(href, indexUrl).href } catch { continue }
    try { if (new URL(abs).origin !== origin) continue } catch { continue }
    if (abs.replace(/#.*$/, '') === idxClean) continue
    if (!best || score > best.score) best = { url: abs, score }
  }
  return best?.url || null
}

// Manifesto PDFs are static and cover every topic — the reliable source for
// JS-rendered party sites. Download + extract text.
async function fetchPdfText(url) {
  const tmp = join(tmpdir(), `aratika-manifesto-${Date.now()}.pdf`)
  execFileSync('curl', ['-s', '-L', '--max-time', '60', '-A', UA, url, '-o', tmp], { maxBuffer: 64 * 1024 * 1024 })
  try {
    const parser = new PDFParse({ data: new Uint8Array(readFileSync(tmp)) })
    const res = await parser.getText()
    return (res.text || '').replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  } finally {
    try { unlinkSync(tmp) } catch { /* ignore */ }
  }
}

async function fetchSource(url) {
  return /\.pdf($|\?)/i.test(url) ? fetchPdfText(url) : fetchText(url)
}

function systemPrompt(topic) {
  const t = TOPICS[topic]
  return `You are a strictly NON-PARTISAN analyst for Aratika, a New Zealand civic-information site. You are given text scraped from a political party's OWN official website. Your job is to summarise THAT party's stated position on ${t.label} (${t.desc}) for everyday New Zealanders.

ABSOLUTE RULES:
- GROUNDED: use ONLY the provided text. Do not use outside knowledge. Do not invent policies, numbers, or promises. If the text does not contain a clear position on ${t.label}, return {"found": false}.
- NEUTRAL: describe what the party says it will do. Never say whether it is good or bad; no opinion, endorsement, prediction, or loaded language.
- PLAIN: assume the reader knows nothing about politics. The basic summary uses NO jargon. NZ English. Be concrete.
- VERBATIM QUOTES: "excerpts" and "quote" must be copied CHARACTER-FOR-CHARACTER from the provided text — never paraphrase, compress, stitch sentences, or change words inside them. If you cannot find a suitable exact quote, use an empty string / fewer excerpts. A paraphrase inside quotation marks is a serious error. (Any excerpt or quote that is not an exact substring of the provided text is discarded automatically.)

Return ONLY a JSON object (no markdown) of this exact shape:
{
  "found": true,
  "stance": "<=12 word headline of their position on ${t.label}",
  "summary_basic": "50-90 words, no jargon, what this party says it will do on ${t.label}",
  "summary": "100-160 words, fuller but still plain",
  "key_proposals": ["3-6 concrete things the party says it will do, each a short plain phrase, grounded in the text"],
  "who_affected": [{"group": "an everyday group this touches, e.g. renters / small businesses / superannuitants", "detail": "ONE neutral, plain sentence on how it touches them in practice — what it does, not whether it's good or bad"}],
  "excerpts": ["1-3 SHORT verbatim quotes (<=240 chars each) copied exactly from the provided text"],
  "quote": "<=240 char verbatim quote from the provided text that captures their position, or empty string if none fits"
}
NEVER predict outcomes or say a policy is good/bad in who_affected — only describe who it touches and what it does. If no clear position is present, return exactly: {"found": false}`
}

async function callModel(system, user) {
  let lastErr
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const resp = await anthropic.messages.create({ model: MODEL, max_tokens: 1200, system, messages: [{ role: 'user', content: user }] })
      return resp.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim()
    } catch (e) {
      lastErr = e
      const msg = String(e?.message || '')
      if (!/429|500|502|503|504|overloaded/i.test(msg) || attempt === 4) break
      await new Promise((r) => setTimeout(r, attempt * 4000))
    }
  }
  throw lastErr
}

// ── Verbatim guardrail ────────────────────────────────────────────────────────
// The model is told to copy quotes exactly, but LLMs drift — an audit (Jul 2026)
// found paraphrases, stitched sentences and altered wording presented inside
// quotation marks. This deterministically drops any excerpt/quote that is not an
// actual substring of the scraped source, so a fabricated quote can never ship.
function normText(s) {
  return String(s)
    .toLowerCase()
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}
function isVerbatim(source, s) {
  // Strip wrapping quotes / ellipsis so a legitimately trimmed excerpt still matches.
  const q = normText(s).replace(/^["'….\s]+|["'….\s]+$/g, '')
  if (q.length < 12) return false
  return normText(source).includes(q)
}

/** Fingerprint of the source text a position was drafted from.
 *
 *  Whitespace-normalised so a reflow or a rotating "last updated" line does not
 *  read as a policy change, and truncated to the same window the model sees —
 *  a change past that point could not have affected the summary anyway. */
const sourceFingerprint = (text) =>
  createHash('sha256').update(String(text || '').replace(/\s+/g, ' ').trim().slice(0, 40000)).digest('hex').slice(0, 32)

async function draftOne(party, topic) {
  const sourceId = `${party.slug}-${topic}-${PERIOD}`
  let url
  if (PERIOD === '2023') {
    url = party.sources.manifesto
    if (!url) { console.warn(`○ ${party.slug}: no 2023 manifesto configured`); return }
  } else {
    url = party.sources[topic]
    if (!url) {
      const discovered = discoverTopicUrl(party.sources.default, topic)
      url = discovered || party.sources.default
      if (discovered) console.log(`  ↪ ${party.slug}: found ${topic} page → ${discovered}`)
    }
  }

  // Don't clobber an editor-approved row unless --force (which AUGMENTS — see below).
  const { data: existing } = await supabase.from('content_items').select('id, status, summary, data').eq('type', 'position').eq('source_id', sourceId).maybeSingle()
  if (existing?.status === 'approved' && !FORCE && !IF_CHANGED) { console.log(`⏭  ${party.slug}/${topic} already approved — skipping (use --force to add the deeper breakdown)`); return }

  let text = FROM_CACHE ? readCache(party.slug, topic) : null
  if (text) { console.log(`  📄 ${party.slug}/${topic}: using browser-captured cache`) }
  else { try { text = await fetchSource(url) } catch (e) { console.warn(`✗ ${party.slug}: fetch failed (${e.message})`); return } }
  if (!text || text.length < 400) { console.warn(`✗ ${party.slug}: source text too thin (${text?.length || 0} chars) — needs a better URL`); return }

  const fingerprint = sourceFingerprint(text)
  // Any existing row, not just an approved one. A row already waiting in the
  // review queue would otherwise be re-drafted on every run, spending a model
  // call to produce the same text an editor has not looked at yet.
  if (IF_CHANGED && existing) {
    const prior = existing.data?.sourceHash
    // No fingerprint means the row predates this check. Record one and leave the
    // approved summary alone: re-drafting every old row on the first run would
    // be a bill for no information, since we cannot tell whether it changed.
    if (!prior) {
      await supabase.from('content_items').update({ data: { ...existing.data, sourceHash: fingerprint } }).eq('id', existing.id)
      console.log(`  ⋯ ${party.slug}/${topic}: baseline fingerprint recorded, no re-draft`)
      return
    }
    if (prior === fingerprint) { console.log(`⏭  ${party.slug}/${topic}: source unchanged`); return }
    console.log(`  ⚠ ${party.slug}/${topic}: SOURCE CHANGED — re-drafting for review`)
  }

  const cap = /\.pdf($|\?)/i.test(url) ? 120000 : 40000
  let raw = await callModel(systemPrompt(topic), `Party: ${party.name}\nTopic: ${TOPICS[topic].label}\n\nOFFICIAL TEXT (may be truncated — find the ${TOPICS[topic].label} section):\n${text.slice(0, cap)}\n\nReturn ONLY the JSON.`)
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim()
  let parsed
  try { parsed = JSON.parse(raw) } catch { console.warn(`✗ ${party.slug}: model did not return JSON`); return }
  if (!parsed.found) { console.warn(`○ ${party.slug}: no clear ${topic} position found in the page — needs a topic-specific source`); return }

  const today = new Date().toISOString().slice(0, 10)
  const keyProposals = Array.isArray(parsed.key_proposals) ? parsed.key_proposals.map((s) => String(s).trim()).filter(Boolean).slice(0, 8) : []
  const whoAffected = Array.isArray(parsed.who_affected)
    ? parsed.who_affected.filter((x) => x && (x.group || x.detail)).map((x) => ({ group: String(x.group || '').trim(), detail: String(x.detail || '').trim() })).slice(0, 6)
    : []
  // Verbatim guardrail: keep only excerpts/quote that actually appear in the source.
  const rawExcerpts = Array.isArray(parsed.excerpts) ? parsed.excerpts.map((s) => String(s).trim()).filter(Boolean) : []
  const excerpts = rawExcerpts.filter((s) => isVerbatim(text, s)).slice(0, 3)
  const droppedExcerpts = rawExcerpts.length - excerpts.length
  let quote = String(parsed.quote || '').trim()
  if (quote && !isVerbatim(text, quote)) { quote = ''; console.warn(`  ⚠ ${party.slug}/${topic}: dropped non-verbatim quote`) }
  if (droppedExcerpts > 0) console.warn(`  ⚠ ${party.slug}/${topic}: dropped ${droppedExcerpts} non-verbatim excerpt(s)`)

  if (existing) {
    // Two modes, because "the source changed" and "we improved the source" are
    // different situations.
    //
    // MERGE (default): keep the editor-approved stance and summary, add the
    // deeper breakdown. Right when a party edits a page we were already reading
    // — an editor's wording still describes it, and silently overwriting their
    // work would be rude and lossy.
    //
    // REPLACE (--replace): rewrite the summary text as well. Right when the
    // source has been REPOINTED — the Greens' every topic was summarised from
    // their /policy index, a page of headings, so the approved stance describes
    // a page we are no longer reading. Merging there keeps a sentence written
    // about the wrong document and attaches fresh quotes to it.
    const ed = existing.data || {}
    const rewritten = REPLACE ? {
      stance: String(parsed.stance || '').trim(),
      summaryBasic: String(parsed.summary_basic || '').trim(),
      quote,
    } : {}
    const mergedData = { ...ed, ...rewritten, keyProposals, whoAffected, excerpts, asOf: today, sourceHash: fingerprint }
    // source_url moves with the excerpts. It used to be left alone, so
    // re-pointing a party at a better page — the Greens' housing_policy instead
    // of their /policy index — rewrote the quotes from the new page while the
    // citation still named the old one. The excerpts were then attributed to a
    // page that does not contain them, which is a worse failure than the stale
    // summary it was fixing.
    const { error } = await supabase.from('content_items').update({ data: mergedData, ...(REPLACE ? { summary: String(parsed.summary || '').trim() } : {}), source_url: url, status: 'pending', change_kind: 'updated', updated_at: today }).eq('id', existing.id)
    if (error) { console.warn(`✗ ${party.slug}: update failed (${error.message})`); return }
    console.log(REPLACE
      ? `✓ ${party.slug}/${topic}: REWRITTEN from ${url} → pending review`
      : `✓ ${party.slug}/${topic}: breakdown added (kept your approved text) → pending re-approve`)
    return
  }

  const periodLabel = PERIOD === '2023' ? '2023 manifesto' : 'Current policy'
  const row = {
    type: 'position',
    source_id: sourceId,
    title: `${party.name} — ${TOPICS[topic].label} (${PERIOD === '2023' ? '2023 manifesto' : 'current policy'})`,
    summary: String(parsed.summary || '').trim(),
    data: {
      party: party.slug, partyName: party.name, topic, topicLabel: TOPICS[topic].label,
      period: PERIOD, periodLabel,
      stance: String(parsed.stance || '').trim(),
      quote,
      summaryBasic: String(parsed.summary_basic || '').trim(),
      keyProposals, whoAffected, excerpts,
      source_label: PERIOD === '2023' ? `${party.name} — 2023 manifesto` : `${party.name} — official policy page`,
      asOf: today,
      // What the source said when this was written. --if-changed compares
      // against it to decide whether the party has moved.
      sourceHash: fingerprint,
    },
    source_url: url,
    change_kind: 'new',
    status: 'pending',
  }
  const { error } = await supabase.from('content_items').insert(row)
  if (error) { console.warn(`✗ ${party.slug}: insert failed (${error.message})`); return }
  console.log(`✓ ${party.slug}/${topic}: "${row.data.stance}"`)
}

// Record a verified "no stated position" — a deliberate, sourced editorial entry,
// NOT an automatic default. Goes through the editor gate like any other position.
async function noPositionOne(party, topic) {
  const sourceId = `${party.slug}-${topic}-2026`
  const label = TOPICS[topic].label
  const note = noteArg || `${party.name}'s published policy does not set out a specific position on ${label}. Verified against their official policy index (see source).`
  const row = {
    type: 'position', source_id: sourceId,
    title: `${party.name} — ${label} (no stated position)`,
    summary: note,
    data: {
      party: party.slug, partyName: party.name, topic, topicLabel: label,
      period: '2026', periodLabel: 'Current policy',
      stance: `No specific stated policy on ${label}`,
      quote: '', summaryBasic: note, keyProposals: [], whoAffected: [], excerpts: [],
      noPosition: true, source_label: `${party.name} — official policy index`,
      asOf: new Date().toISOString().slice(0, 10),
    },
    source_url: sourceArg, change_kind: 'new', status: 'pending',
  }
  const { data: existing } = await supabase.from('content_items').select('id').eq('type', 'position').eq('source_id', sourceId).maybeSingle()
  const res = existing
    ? await supabase.from('content_items').update({ ...row, updated_at: new Date().toISOString() }).eq('id', existing.id)
    : await supabase.from('content_items').insert(row)
  if (res.error) { console.warn(`✗ ${party.slug}: ${res.error.message}`); return }
  console.log(`✓ ${party.slug}/${topic}: recorded "no stated position" → pending review`)
}

async function main() {
  if (!TOPICS[topicArg]) { console.error(`Unknown topic '${topicArg}'. Known: ${Object.keys(TOPICS).join(', ')}`); process.exit(1) }

  if (NO_POSITION) {
    const party = PARTIES.find((p) => p.slug === partyArg)
    if (!party || !sourceArg) { console.error('--no-position needs --party=<slug> and --source=<official policy-index url>'); process.exit(1) }
    await noPositionOne(party, topicArg)
    console.log('\nReview at /editor — approve only after confirming the topic is genuinely absent from their policy.')
    return
  }
  const list = partyArg ? PARTIES.filter((p) => p.slug === partyArg) : PARTIES
  console.log(`Drafting ${topicArg} positions for ${list.length} parties (model ${MODEL})…\n`)
  // One party's failure must not end the run. A model error — a rate limit, an
  // exhausted credit balance, a transient 500 — used to throw out of main() and
  // kill the whole topic, so parties later in the list were silently never
  // drafted and the run looked like it had simply finished. Each is isolated and
  // counted, and the tally at the end says how many actually failed.
  let failed = 0
  for (const p of list) {
    try { await draftOne(p, topicArg) }
    catch (e) {
      failed++
      const msg = String(e?.message || e).replace(/\s+/g, ' ').slice(0, 160)
      console.error(`✗ ${p.slug}/${topicArg}: ${msg}`)
    }
  }
  if (failed > 0) console.error(`
${failed} of ${list.length} part(ies) failed on ${topicArg} — see above.`)
  console.log(`\nDone. Review at /editor, then they appear on /policies/${topicArg}.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
