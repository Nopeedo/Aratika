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
 * A LIVE position is never taken down by this script. When a party's pages
 * change, the re-draft is staged as data.proposed on the approved row (see
 * src/lib/positions/proposal.ts) and the site keeps rendering what the editor
 * last approved until they accept the proposal. Only rows with nothing live —
 * new, pending, rejected — are written in place.
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
import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'
import { parse } from 'node-html-parser'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { curlHtml, fetchAllSources, excerptSource, isVerbatim, pageHash, sourceFingerprint, diffSources, mergeHashes } from './lib/position-text.mjs'

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
// Report what --if-changed WOULD do, without a model call or a write. The point
// is to price a run before committing to it: the cost is one call per page that
// actually moved, not one per position, and there is no way to know which pages
// moved without fetching them. Deliberately part of this script rather than a
// separate reporter — a reporter would have to reimplement fetchSource and
// sourceFingerprint, and the first attempt at that dropped the .slice(0, 32),
// which made every row read as drifted.
const DRY_RUN = args.includes('--dry-run')
const TALLY = { drifted: [], unchanged: [], baseline: [], newDraft: [], repointed: [], immaterial: [], proposed: [], notFound: [], unreachable: [], withdrawn: [] }
const topicArg = (args.find((a) => a.startsWith('--topic=')) || '').split('=')[1] || 'economy'
// --party accepts one slug or a comma-separated cohort:
//   --party=green            one party
//   --party=national,labour  a cohort, for staging a catch-up in batches
const partyArg = (args.find((a) => a.startsWith('--party=')) || '').split('=')[1] || null
const PARTY_SET = partyArg ? partyArg.split(',').map((x) => x.trim()).filter(Boolean) : null
/**
 * Most positions this invocation may WRITE before it stops.
 *
 * Widening a topic from one configured source to several moves almost every
 * fingerprint at once, so the first run after the watcher lands would re-draft
 * essentially the whole site into /editor in one night. A review queue nobody
 * can reach the bottom of is the same as no review queue.
 *
 * The cap counts writes, not parties considered: skips and unchanged rows are
 * free and do not consume it. Whatever is left over is reported and picked up by
 * the next run, so the daily cron drains the backlog at a reviewable pace
 * instead of arriving as a wall.
 */
const MAX_DRAFTS = Number((args.find((a) => a.startsWith('--max-drafts=')) || '').split('=')[1] || 0) || Infinity
let WROTE = 0
/**
 * Most positions allowed to sit UNREVIEWED site-wide before drafting pauses.
 *
 * --max-drafts bounds one run. This bounds the blast radius, which is a
 * different quantity and the one that actually matters, because a re-drafted
 * row goes to status='pending' and the site renders only 'approved'
 * (src/lib/positions/live.ts). A pending position is not a stale position — it
 * is an ABSENT one, and /policies/[topic] does not omit it quietly:
 * policy-comparison.tsx prints "No position on economy recorded yet for
 * National, Labour, Green, ACT, NZ First, Te Pati Maori".
 *
 * That is what a cohort catch-up did on 8 Sep 2026 — eight positions, six of
 * them the parliamentary parties' economy pages, replaced by a false statement
 * about all six. --max-drafts=3 would not have prevented it: three per topic
 * across eleven topics is still thirty-three positions dark in one night.
 *
 * So the count is of the QUEUE, not of this run. Drafting pauses while the
 * editor is behind and resumes as they clear it, which keeps the amount of the
 * site that is missing bounded by review capacity rather than by crawl rate.
 */
const MAX_PENDING = Number((args.find((a) => a.startsWith('--max-pending=')) || '').split('=')[1] || 0) || Infinity
let PENDING_NOW = 0
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
  // Every source here except crime-justice used to point into /policies/*, which
  // is National's 2023 CAMPAIGN structure — those pages survive only under
  // /policy-2023, titled "National's plan to get our country back on track".
  // national.org.nz/policies now 404s entirely. The default was /policy-2023
  // itself, so any unmapped topic was drafted from a 2023 campaign index and
  // displayed as current policy.
  //
  // Their current site publishes six root-level pages and no more. Housing,
  // immigration, environment, climate, foreign policy and Treaty all 404 —
  // National has published nothing current on any of them, so those fall back to
  // /plan and the drafter records a position only if the plan actually covers it.
  { slug: 'national', name: 'National', sources: {
    default:          'https://www.national.org.nz/plan',
    economy:          'https://www.national.org.nz/economy',
    health:           'https://www.national.org.nz/healthcare',
    education:        'https://www.national.org.nz/education',
    'crime-justice':  'https://www.national.org.nz/lawandorder',
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
    // The 2023 manifesto PDF, used only when drafting PERIOD=2023 rows.
    manifesto:      'https://assets.nationbuilder.com/beachheroes/pages/17789/attachments/original/1688864858/Final-online-PDF-pages.pdf',
    // Manifesto 2026 — 23,612 words of current policy, with a PDF edition and a
    // separate Māori Manifesto. Swept all fourteen reachable party sites: this
    // and the Women's Rights Party's policy file are the ONLY policy documents
    // any party publishes this cycle. Everyone else has replaced the manifesto
    // with topic pages, so it is the single best deep-dive source available.
    // Not wired to a topic — the per-topic policy pages above are more precise
    // for a position summary — it is here so the deep dives have a canonical
    // document to cite rather than one being hunted for again.
    manifesto2026:  'https://www.greens.org.nz/manifesto_2026',
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
  // /policies is a section index — 613 characters of links, no prose — so any
  // topic falling back to it is drafted from nothing. ACT publishes eight
  // sections and all eight are now mapped where they match a topic.
  //
  // Climate, immigration, foreign policy and Treaty are absent on purpose: ACT
  // publishes no section on any of them, so those fall back to the index and the
  // drafter records nothing rather than stretching an adjacent page. "Backing
  // Rural New Zealand" is left unmapped for the same reason — it is a real ACT
  // section but it is not one of our topics, and forcing it into environment or
  // economy would be us choosing their framing for them.
  { slug: 'act',      name: 'ACT',            sources: {
    default:        'https://www.act.org.nz/policies',
    economy:        'https://www.act.org.nz/policies/economy',
    health:         'https://www.act.org.nz/policies/health',
    housing:        'https://www.act.org.nz/policies/infrastructure',
    education:      'https://www.act.org.nz/policies/education',
    environment:    'https://www.act.org.nz/policies/hunting',
    'crime-justice':'https://www.act.org.nz/policies/law-and-order',
    'democracy-government': 'https://www.act.org.nz/policies/democracy',
    // Two topics, one page, on purpose. ACT has no Treaty section; they state
    // that position inside "Equal Rights & Democracy" — "Your rights should not
    // depend on your ancestry... one person, one vote and one law for all".
    // Checked the page says it before pointing at it, rather than assuming.
    'treaty-maori-affairs': 'https://www.act.org.nz/policies/democracy',
  } },
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

/**
 * Policy pages watch-policy-pages.mjs has found for a party on a topic.
 *
 * The config below holds AT MOST ONE url per party/topic, chosen by hand. That
 * was the whole bug: a party announcing a new policy on a new page changed
 * nothing this script fetches, so the position kept summarising the old page
 * indefinitely. The Greens' Affordable Kai announcement is exactly that shape.
 *
 * The watcher crawls every page a party publishes and records which ones are
 * policy statements and on what topic, so this file no longer has to guess in
 * advance where a policy will live. Missing file is not an error — it just means
 * the watcher has not run yet, and everything falls back to the old behaviour.
 */
const DISCOVERED = (() => {
  try {
    const p = join(fileURLToPath(import.meta.url), '..', '.state', 'discovered-policy-sources.json')
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch { return {} }
})()

/**
 * Every source URL for a party/topic: the hand-configured one first, then any
 * page the watcher found, deduped.
 *
 * The configured URL stays first and stays the citation — it is the one an
 * editor chose — while the discovered pages widen what the model actually
 * reads. A party with four separate cost-of-living policies gets summarised
 * from all four instead of from whichever one happened to be in the config.
 */
function sourceUrlsFor(slug, topic, primary) {
  const found = (DISCOVERED[slug]?.[topic] || []).map((x) => x.url)
  return [...new Set([primary, ...found].filter(Boolean))]
}

function systemPrompt(topic) {
  const t = TOPICS[topic]
  return `You are a strictly NON-PARTISAN analyst for Politika, a New Zealand civic-information site. You are given text scraped from a political party's OWN official website. Your job is to summarise THAT party's stated position on ${t.label} (${t.desc}) for everyday New Zealanders.

ABSOLUTE RULES:
- GROUNDED: use ONLY the provided text. Do not use outside knowledge. Do not invent policies, numbers, or promises. If the text does not contain a clear position on ${t.label}, return {"found": false}.
- NEUTRAL: describe what the party says. Never say whether it is good or bad; no opinion, endorsement, prediction, or loaded language.
- KEEP THEIR TENSE: a party in government often writes up what it HAS delivered rather than what it will do. Report it the way they wrote it. Never convert "Delivered income tax relief" into "Deliver income tax relief" — that puts a promise in their mouth they did not make. Say which of the two it is in "framing".
- PLAIN: assume the reader knows nothing about politics. The basic summary uses NO jargon. NZ English. Be concrete.
- VERBATIM QUOTES: "excerpts" and "quote" must be copied CHARACTER-FOR-CHARACTER from the provided text — never paraphrase, compress, stitch sentences, or change words inside them. If you cannot find a suitable exact quote, use an empty string / fewer excerpts. A paraphrase inside quotation marks is a serious error. (Any excerpt or quote that is not an exact substring of the provided text is discarded automatically.)

Return ONLY a JSON object (no markdown) of this exact shape:
{
  "found": true,
  "stance": "<=12 word headline of their position on ${t.label}",
  "summary_basic": "50-90 words, no jargon, what this party says it will do on ${t.label}",
  "summary": "100-160 words, fuller but still plain",
  "key_proposals": ["3-6 concrete things the party says it will do, OR says it has already done — whichever the text actually states. Each a short plain phrase, grounded in the text, in the same tense the party used"],
  "framing": "exactly one of: pledge (key_proposals are things the party says it WILL do) or record (things it says it HAS done). A governing party writing up its delivery is a record. If mixed, pick whichever covers most of them",
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

/**
 * Is the fresh draft a different POLICY, or the same policy in different words?
 *
 * The page hashes say a page moved. They cannot say whether the party changed
 * what it is promising or fixed a typo, added a photo caption, or published a
 * new page that restates a commitment already summarised. Every one of those
 * used to reach the editor as "Updated", which is how the same National economy
 * position was re-approved on the 18th and back in the queue on the 20th.
 *
 * Cheap check first: identical stance, proposals and plain summary need no
 * model. Otherwise one small call with both versions side by side. The answer
 * is a gate, not a verdict on the content — an editor still reads anything
 * that passes.
 */
async function materialChange(live, draft, topicLabel, reason = { added: [], changed: [], removed: [] }) {
  const key = (x) => normKey([x.stance, ...(x.keyProposals || []), x.summaryBasic].join(' | '))
  if (key(live) === key(draft)) return { material: false, what: '' }
  const sys = `You compare two neutral summaries of the SAME New Zealand political party's stated policy on ${topicLabel}. CURRENT is what a civic-information site publishes now. NEW was just drafted from the party's own website today. Decide whether NEW reflects a MATERIAL change in the party's stated policy: a new commitment, a dropped or reversed commitment, a changed number, date, target or scope, or a different overall stance. Rewording, reordering, tighter or looser phrasing, different example wording, or different quotes for the SAME commitments are NOT material. Return ONLY JSON: {"material": true|false, "what": "<=40 words naming the change in plain terms, or an empty string if not material"}`
  const show = (x) => JSON.stringify({ stance: x.stance, summary: x.summaryBasic, proposals: x.keyProposals || [], quote: x.quote || '' }, null, 1)
  const user = `Pages that were new or changed since CURRENT was written: ${[...reason.added, ...reason.changed].join(', ') || '(unknown)'}\n\nCURRENT:\n${show(live)}\n\nNEW:\n${show(draft)}\n\nReturn ONLY the JSON.`
  let raw = await callModel(sys, user)
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim()
  try {
    const v = JSON.parse(raw)
    // Strictly boolean. A verdict of "true" (the string) once read as
    // non-material because `=== true` was false, and the change was baselined
    // for good. Anything that is not a clear no is a yes: the failure mode of
    // this gate must be "show the editor", never "drop it".
    const m = v.material === true || v.material === 'true' ? true : v.material === false || v.material === 'false' ? false : null
    if (m === null) return { material: true, what: '(could not classify the change — review it)' }
    return { material: m, what: String(v.what || '').trim().slice(0, 300) }
  } catch {
    // An unparseable verdict is treated as material: the failure mode of a gate
    // that cannot read its own answer must be "show the editor", never "drop it".
    return { material: true, what: '(could not classify the change — review it)' }
  }
}
const normKey = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** Turn the model's parsed JSON into the fields a position row carries. Quote
 *  and excerpt guardrails applied here, once, for every write path. */
function buildDraft(party, topic, parsed, text, sourceParts, urls, url) {
  const keyProposals = Array.isArray(parsed.key_proposals) ? parsed.key_proposals.map((s) => String(s).trim()).filter(Boolean).slice(0, 8) : []
  // Whether those bullets are promises or a record of delivery. Anything the
  // model does not explicitly call a record is treated as a pledge: that is
  // correct for every party out of government, and labelling a promise as an
  // achievement is the worse of the two errors to make by default.
  const framing = parsed.framing === 'record' ? 'record' : 'pledge'
  const whoAffected = Array.isArray(parsed.who_affected)
    ? parsed.who_affected.filter((x) => x && (x.group || x.detail)).map((x) => ({ group: String(x.group || '').trim(), detail: String(x.detail || '').trim() })).slice(0, 6)
    : []
  // Verbatim guardrail: keep only excerpts/quote that actually appear in the source.
  const rawExcerpts = Array.isArray(parsed.excerpts) ? parsed.excerpts.map((s) => String(s).trim()).filter(Boolean) : []
  // Attribute before truncating: an excerpt has to be verbatim in ONE named
  // page, not merely somewhere in the concatenation of several. That is a
  // strictly stronger check — a quote stitched across two sources passes
  // isVerbatim(text) and fails here, correctly.
  const attributed = rawExcerpts
    .map((s) => ({ text: s, url: excerptSource(sourceParts, s) }))
    .filter((e) => e.url)
    .slice(0, 3)
  // Parallel array rather than objects: excerpts is typed string[] in four
  // frontend components and changing its shape would break them. Index i of
  // excerptSources is the page excerpts[i] came from.
  const excerpts = attributed.map((e) => e.text)
  const excerptSources = attributed.map((e) => e.url)
  const droppedExcerpts = rawExcerpts.length - excerpts.length
  let quote = String(parsed.quote || '').trim()
  if (quote && !isVerbatim(text, quote)) { quote = ''; console.warn(`  ⚠ ${party.slug}/${topic}: dropped non-verbatim quote`) }
  if (droppedExcerpts > 0) console.warn(`  ⚠ ${party.slug}/${topic}: dropped ${droppedExcerpts} non-verbatim excerpt(s)`)
  return {
    summary: String(parsed.summary || '').trim(),
    source_url: url,
    stance: String(parsed.stance || '').trim(),
    summaryBasic: String(parsed.summary_basic || '').trim(),
    quote, keyProposals, framing, whoAffected, excerpts, excerptSources, sourceUrls: urls,
  }
}

/**
 * Patch `data` on an existing row without carrying a stale snapshot forward.
 *
 * draftOne reads the row once, then spends anything from ten seconds to a
 * couple of minutes fetching pages and calling the model before it writes. A
 * write of `{ ...existing.data, patch }` puts back whatever the row held at
 * read time — so an editor who accepted this row's proposal in that window
 * had their promotion reverted and the accepted proposal resurrected, and the
 * log said nothing. The row is re-read here, immediately before the write,
 * and the patch merged into what is there NOW; the write is guarded on the
 * status the row had when first read and checked for a matched row.
 *
 * onProposal: what to do if the fresh row carries a proposal.
 *   'skip' — someone staged one meanwhile; leave it and write nothing.
 *   'drop' — this run supersedes it (--force re-drafting the same row).
 */
async function patchRow(existing, patch, label, { onProposal = 'skip' } = {}) {
  const { data: fresh, error } = await supabase.from('content_items').select('data, status').eq('id', existing.id).maybeSingle()
  if (error) { console.warn(`✗ ${label}: re-read failed (${error.message}) — nothing written`); return false }
  if (!fresh || fresh.status !== existing.status) { console.log(`  ⏭ ${label}: row was ${existing.status} when read and is ${fresh?.status ?? 'gone'} now — nothing written`); return false }
  const { proposed: current, ...keep } = fresh.data || {}
  if (current && onProposal === 'skip') { console.log(`  ⏭ ${label}: a proposal was staged on this row meanwhile — nothing written`); return false }
  const { data: hit, error: werr } = await supabase.from('content_items').update({ data: { ...keep, ...patch } }).eq('id', existing.id).eq('status', existing.status).select('id')
  if (werr || !hit?.length) { console.warn(`✗ ${label}: write failed (${werr?.message || 'no row matched'})`); return false }
  return true
}

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

  const { data: existing } = await supabase.from('content_items').select('id, status, summary, data, source_url').eq('type', 'position').eq('source_id', sourceId).maybeSingle()
  // LIVE = the site is rendering this row. Nothing below may change what it
  // renders; a live row only ever gains a data.proposed for the editor.
  const live = existing?.status === 'approved'
  if (live && !FORCE && !IF_CHANGED) { console.log(`⏭  ${party.slug}/${topic} already approved — skipping (--if-changed checks its sources, --force re-drafts it as a proposal)`); return }
  // A proposal already waiting: leave it for the editor rather than replacing
  // it with today's draft of the same pages. Same reason a pending row is not
  // re-drafted — a queue that rewrites itself under the reviewer is not a queue.
  if (live && existing.data?.proposed && !FORCE) { console.log(`⏭  ${party.slug}/${topic}: a proposed update is already awaiting review`); return }

  // The 2023 backfill reads a single archived manifesto, so it must not pull in
  // pages the watcher found on the party's site today — those are 2026 policy.
  const urls = PERIOD === '2023' ? [url] : sourceUrlsFor(party.slug, topic, url)
  if (urls.length > 1) console.log(`  + ${party.slug}/${topic}: ${urls.length} sources (1 configured, ${urls.length - 1} discovered)`)

  let text = FROM_CACHE ? readCache(party.slug, topic) : null
  // Per-source texts, kept so each excerpt can be attributed to the page it was
  // actually taken from. The cache path has only one blob and no URL breakdown,
  // so it falls back to the primary url — same behaviour as before multi-source.
  let sourceParts = [{ url, text: text || '' }]
  let failed = []
  let gone = []
  if (text) { console.log(`  📄 ${party.slug}/${topic}: using browser-captured cache`) }
  else {
    try {
      const fetched = await fetchAllSources(urls)
      text = fetched.text
      sourceParts = fetched.parts
      failed = fetched.failed
      gone = fetched.gone
    } catch (e) { console.warn(`✗ ${party.slug}: fetch failed (${e.message})`); return }
  }
  // A row that exists was drafted from a set of pages. If any page we could
  // not read today is one it has read before, the model would be re-reading a
  // PARTIAL set — and a summary written without the page that carries the tax
  // commitments "drops" the tax commitments. That is not a change in the
  // party's policy; it is a timeout on the runner. Defer the whole row until
  // every page it knows answers. A row with no history has nothing to lose.
  if (existing && failed.length) {
    const known = new Set([...Object.keys(existing.data?.sourceHashes || {}), ...(existing.data?.sourceUrls || []), existing.source_url].filter(Boolean))
    const blocking = existing.data?.sourceHashes ? failed.filter((u) => known.has(u)) : failed
    if (blocking.length) {
      TALLY.unreachable.push(`${party.slug}/${topic}`)
      console.log(`  ⏸ ${party.slug}/${topic}: ${blocking.length} source(s) unreachable today — not re-reading from a partial set, nothing written`)
      return
    }
  }
  if (!text || text.length < 400) { console.warn(`✗ ${party.slug}: source text too thin (${text?.length || 0} chars) — needs a better URL`); return }
  if (failed.length) console.log(`    (${failed.length} of ${urls.length} source(s) did not fetch — unknown, not changed)`)
  if (gone.length) console.log(`    (${gone.length} source(s) gone — HTTP 404/410)`)

  // One fingerprint PER PAGE. The old single hash covered the concatenation of
  // every source, so a page joining the set, a page timing out on the runner,
  // or the watcher listing them in a different order all read as "the party
  // changed its policy". Per page, each of those is a distinct, nameable event.
  const pageHashes = Object.fromEntries(sourceParts.map((p) => [p.url, pageHash(p.text)]))
  // What to RECORD: today's hash for every page read, the prior hash for any
  // page that failed. Never drop a page we could not read, or it comes back
  // tomorrow as "added" and re-proposes what an editor just rejected.
  const recordHashes = mergeHashes(existing?.data?.sourceHashes, pageHashes, failed)
  const fingerprint = sourceFingerprint(text)
  const cited = new Set([existing?.source_url, ...(existing?.data?.excerptSources || [])].filter(Boolean))
  let reason = { added: [], changed: [], removed: [] }
  // The page this row cites is no longer among the pages read (a repoint,
  // allowed by --replace). The citation under the quotes changes, which is
  // material whatever the gate thinks of the words.
  const repointing = !!(existing?.source_url && urls.length && !urls.includes(existing.source_url))

  if (IF_CHANGED && existing) {
    // A repoint is not a drift. If the page this row was drafted from is no
    // longer among the pages we read at all, moving it is a citation decision
    // for a human: --replace is the flag that allows it.
    if (existing.source_url && urls.length && !urls.includes(existing.source_url) && !REPLACE) {
      TALLY.repointed.push(`${party.slug}/${topic}`)
      console.log(`  ↪ ${party.slug}/${topic}: NOT drift — drafted from ${existing.source_url}, no longer among the ${urls.length} source(s) read. Re-run with --replace to move it.`)
      return
    }
    const priorPages = existing.data?.sourceHashes
    const priorCombined = existing.data?.sourceHash
    const recordBaseline = async (why) => {
      if (DRY_RUN) { TALLY.baseline.push(`${party.slug}/${topic}`); console.log(`  ⋯ ${party.slug}/${topic}: ${why} — a real run would record the page hashes, no model call`); return }
      if (!await patchRow(existing, { sourceHashes: recordHashes, sourceHash: fingerprint }, `${party.slug}/${topic}`, { onProposal: FORCE ? 'drop' : 'skip' })) return
      TALLY.baseline.push(`${party.slug}/${topic}`)
      console.log(`  ⋯ ${party.slug}/${topic}: ${why} — page hashes recorded, no re-draft`)
    }
    if (priorPages && typeof priorPages === 'object') {
      reason = diffSources(priorPages, pageHashes, failed)
    } else if (existing.data?.noPosition) {
      // "No stated position" was recorded before the watcher existed, from an
      // index page alone. Every page the watcher has since found on this topic
      // is one this row has never read, so all of them count as new.
      reason = { added: Object.keys(pageHashes), changed: [], removed: [] }
    } else if (priorCombined) {
      // Written before per-page hashes existed. If the old whole-set hash still
      // matches, nothing has moved: record the per-page baseline and stop. If
      // not, something moved and we cannot say which page — so every page is
      // treated as changed and the material-change gate decides whether the
      // POLICY moved, which is the question the old hash could never answer.
      if (priorCombined === fingerprint) return recordBaseline('unchanged (legacy fingerprint matches)')
      // (A failed fetch cannot reach here: the partial-set guard above returns
      // first for any row that exists. So a moved legacy hash means a page
      // moved, not that a page was missing from the concatenation.)
      reason = { added: [], changed: Object.keys(pageHashes), removed: [], legacy: true }
    } else {
      return recordBaseline('no baseline yet')
    }

    const moved = reason.added.length + reason.changed.length + reason.removed.length
    if (!moved) { TALLY.unchanged.push(`${party.slug}/${topic}`); console.log(`⏭  ${party.slug}/${topic}: sources unchanged${reason.unknown?.length ? ` (${reason.unknown.length} not fetched)` : ''}`); return }
    // Only pages disappeared, and none of them is cited under the live text:
    // the watcher dropped a stale index entry. Nothing to re-read.
    if (!reason.added.length && !reason.changed.length && !reason.removed.some((u) => cited.has(u))) {
      return recordBaseline(`${reason.removed.length} uncited page(s) dropped from the set`)
    }
    TALLY.drifted.push(`${party.slug}/${topic}`)
    const why = reason.legacy ? 'legacy fingerprint moved' : `+${reason.added.length} new, ~${reason.changed.length} changed, -${reason.removed.length} gone`
    console.log(`  ⚠ ${party.slug}/${topic}: SOURCES MOVED (${why}) — ${DRY_RUN ? 'a real run would re-draft and gate this' : live ? 're-drafting as a proposal' : 're-drafting for review'}`)
    for (const u of reason.added) console.log(`      + ${u}`)
    for (const u of reason.changed.slice(0, 6)) console.log(`      ~ ${u}`)
    if (DRY_RUN) return
  }
  if (DRY_RUN) { console.log(`  · ${party.slug}/${topic}: would draft (no existing row)`); TALLY.newDraft.push(`${party.slug}/${topic}`); return }

  const cap = /\.pdf($|\?)/i.test(url) ? 120000 : 40000
  // UPDATE, don't re-summarise. A live position is an editor-approved reading
  // of these pages; asking for a fresh summary from scratch produced a fresh
  // SAMPLE — the same pages, a different selection of proposals — and the gate
  // then reported commitments "dropped" that the party had never dropped (TPM
  // environment lost its freshwater-rights line; NZ First's Marsden Point zone
  // moved from the climate summary to the economy one). With the current text
  // in front of it, the model keeps what the pages still support, adds what is
  // new, and removes only what is no longer there — so a proposal is a delta.
  const prior = live && !existing.data?.noPosition ? existing.data : null
  const priorBlock = prior ? `\n\nEARLIER SUMMARY (currently published, written from an older version of these pages — UPDATE it, do not start over):\n${JSON.stringify({ stance: prior.stance, summary_basic: prior.summaryBasic, summary: existing.summary, key_proposals: prior.keyProposals || [], framing: prior.framing || 'pledge' }, null, 1)}\nRULES FOR THE UPDATE: keep every key proposal above that the OFFICIAL TEXT still supports, in the same words where the text still supports those words; add proposals the text now states that are missing; remove a proposal ONLY if the text no longer supports it. Keep the stance and framing unless the text contradicts them. Quotes and excerpts must still be verbatim from the OFFICIAL TEXT below, never from the earlier summary.` : ''
  let raw = await callModel(systemPrompt(topic), `Party: ${party.name}\nTopic: ${TOPICS[topic].label}${priorBlock}\n\nOFFICIAL TEXT (may be truncated — find the ${TOPICS[topic].label} section):\n${text.slice(0, cap)}\n\nReturn ONLY the JSON.`)
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim()
  let parsed
  try { parsed = JSON.parse(raw) } catch { console.warn(`✗ ${party.slug}: model did not return JSON`); return }
  if (!parsed.found) {
    TALLY.notFound.push(`${party.slug}/${topic}`)
    if (live && !existing.data?.noPosition) {
      // No position in the pages now. Two different situations:
      //  - A page this row CITES changed or is gone, and the position is not
      //    in what is left: the party may have withdrawn it. Silently keeping
      //    the live text would leave a retired policy on the site for good, so
      //    this is staged as a proposal whose content is "no stated position".
      //    The editor decides; the publisher skips these unless told not to.
      //  - The cited pages are as they were and only an uncited page moved:
      //    the live text is still supported. Record the hashes and move on.
      const citedMoved = [...reason.changed, ...reason.removed].some((u) => cited.has(u)) || gone.some((u) => cited.has(u))
      if (!citedMoved) {
        if (await patchRow(existing, { sourceHashes: recordHashes, sourceHash: fingerprint }, `${party.slug}/${topic}`, { onProposal: FORCE ? 'drop' : 'skip' }))
          console.log(`○ ${party.slug}/${topic}: no clear position in the pages that moved; the cited pages stand — live text kept, hashes recorded`)
        return
      }
      const label = TOPICS[topic].label
      const note = `${party.name}'s current published policy pages do not set out a specific position on ${label}. The page this position cited has changed or been removed.`
      const proposed = {
        summary: note, source_url: url, stance: `No specific stated policy on ${label}`, summaryBasic: note, quote: '',
        keyProposals: [], framing: 'pledge', whoAffected: [], excerpts: [], excerptSources: [], sourceUrls: urls,
        noPosition: true,
        sourceHashes: recordHashes, sourceHash: fingerprint, asOf: new Date().toISOString().slice(0, 10),
        proposedAt: new Date().toISOString(),
        reason: { added: reason.added, changed: reason.changed, removed: [...reason.removed, ...gone.filter((u) => !reason.removed.includes(u))] },
        what: 'No position on this topic is found in the party\'s current pages; the cited page changed or is gone. Approving replaces the live position with "no stated position".',
      }
      if (!await patchRow(existing, { proposed }, `${party.slug}/${topic}`, { onProposal: FORCE ? 'drop' : 'skip' })) return
      WROTE++
      TALLY.withdrawn.push(`${party.slug}/${topic}`)
      console.log(`  ⚠ ${party.slug}/${topic}: POSSIBLE WITHDRAWAL — proposal staged for the editor (live text untouched)`)
    } else if (live) {
      if (await patchRow(existing, { sourceHashes: recordHashes, sourceHash: fingerprint }, `${party.slug}/${topic}`, { onProposal: FORCE ? 'drop' : 'skip' }))
        console.log(`○ ${party.slug}/${topic}: still no clear position — hashes recorded`)
    } else {
      console.warn(`○ ${party.slug}: no clear ${topic} position found in the page — needs a topic-specific source`)
    }
    return
  }

  const today = new Date().toISOString().slice(0, 10)
  const draft = buildDraft(party, topic, parsed, text, sourceParts, urls, url)

  if (live) {
    // Never in place. The site keeps rendering the approved fields; the editor
    // gets the proposal beside them and decides. A "no stated position" row
    // that now has one is material by definition — the gate compares policies,
    // and there was none.
    const liveContent = { stance: existing.data?.stance, keyProposals: existing.data?.keyProposals, summaryBasic: existing.data?.summaryBasic, quote: existing.data?.quote }
    const verdict = existing.data?.noPosition
      ? { material: true, what: 'A stated position now exists where "no stated position" was recorded.' }
      : repointing
        ? { material: true, what: `The page this position cites (${existing.source_url}) is no longer among the pages read; the citation moves to ${url}.` }
        : await materialChange(liveContent, draft, TOPICS[topic].label, reason)
    if (!verdict.material) {
      // Under --force this verdict supersedes any proposal already on the row.
      if (!await patchRow(existing, { sourceHashes: recordHashes, sourceHash: fingerprint, sourceUrls: urls }, `${party.slug}/${topic}`, { onProposal: FORCE ? 'drop' : 'skip' })) return
      TALLY.immaterial.push(`${party.slug}/${topic}`)
      console.log(`  = ${party.slug}/${topic}: pages moved, policy did not — live text kept, hashes recorded (no review needed)`)
      return
    }
    const proposed = {
      ...draft,
      sourceHashes: recordHashes, sourceHash: fingerprint, asOf: today,
      proposedAt: new Date().toISOString(),
      reason: { added: reason.added, changed: reason.changed, removed: [...reason.removed, ...gone.filter((u) => !reason.removed.includes(u))] },
      what: verdict.what,
    }
    if (!await patchRow(existing, { proposed }, `${party.slug}/${topic}`, { onProposal: FORCE ? 'drop' : 'skip' })) return
    WROTE++
    TALLY.proposed.push(`${party.slug}/${topic}`)
    console.log(`✓ ${party.slug}/${topic}: PROPOSED update staged → /editor (live text untouched). ${verdict.what}`)
    return
  }

  if (existing) {
    // Nothing live to protect — a pending or rejected row — so the fresh draft
    // replaces it in place and goes back to the queue.
    const ed = existing.data || {}
    const { summary, source_url, ...fields } = draft
    const mergedData = {
      ...ed, ...fields,
      period: PERIOD, periodLabel: PERIOD === '2023' ? '2023 manifesto' : 'Current policy',
      asOf: today, sourceHashes: recordHashes, sourceHash: fingerprint,
    }
    delete mergedData.proposed
    delete mergedData.noPosition
    // Guarded on the status we READ. The fetch and the model call take a
    // minute or two, and an editor approving this row in that window must win:
    // without the guard their approval was flipped back to pending and the
    // text they approved replaced.
    const { data: hit, error } = await supabase.from('content_items').update({ data: mergedData, summary, source_url, status: 'pending', change_kind: ed.noPosition ? 'new' : 'updated', updated_at: today }).eq('id', existing.id).eq('status', existing.status).select('id')
    if (error) { console.warn(`✗ ${party.slug}: update failed (${error.message})`); return }
    if (!hit?.length) { console.log(`  ⏭ ${party.slug}/${topic}: row was ${existing.status} when read and is not now (an editor got there first) — nothing written`); return }
    WROTE++
    console.log(`✓ ${party.slug}/${topic}: re-drafted (was ${existing.status}) → pending review`)
    return
  }

  const periodLabel = PERIOD === '2023' ? '2023 manifesto' : 'Current policy'
  const { summary, source_url, ...fields } = draft
  const row = {
    type: 'position',
    source_id: sourceId,
    title: `${party.name} — ${TOPICS[topic].label} (${PERIOD === '2023' ? '2023 manifesto' : 'current policy'})`,
    summary,
    data: {
      party: party.slug, partyName: party.name, topic, topicLabel: TOPICS[topic].label,
      period: PERIOD, periodLabel,
      ...fields,
      source_label: PERIOD === '2023' ? `${party.name} — 2023 manifesto` : `${party.name} — official policy page`,
      asOf: today,
      // What each source said when this was written. --if-changed compares
      // against these to decide whether the party has moved.
      sourceHashes: recordHashes, sourceHash: fingerprint,
    },
    source_url,
    change_kind: 'new',
    status: 'pending',
  }
  const { error } = await supabase.from('content_items').insert(row)
  if (error) { console.warn(`✗ ${party.slug}: insert failed (${error.message})`); return }
  WROTE++
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
      quote: '', summaryBasic: note, keyProposals: [], framing: 'pledge', whoAffected: [], excerpts: [],
      noPosition: true, source_label: `${party.name} — official policy index`,
      asOf: new Date().toISOString().slice(0, 10),
    },
    source_url: sourceArg, change_kind: 'new', status: 'pending',
  }
  const { data: existing } = await supabase.from('content_items').select('id, status').eq('type', 'position').eq('source_id', sourceId).maybeSingle()
  // A live position is never overwritten by this script — not even with "no
  // position". If the party really has withdrawn it, the daily run stages a
  // withdrawal proposal when the cited page changes; otherwise it is the
  // editor's call, made in /editor with the live text in front of them.
  if (existing?.status === 'approved') { console.error(`✗ ${party.slug}/${topic} is LIVE (approved). Not overwriting it with "no stated position" — review it in /editor instead.`); process.exitCode = 1; return }
  const res = existing
    ? await supabase.from('content_items').update({ ...row, updated_at: new Date().toISOString() }).eq('id', existing.id).eq('status', existing.status)
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
  const list = PARTY_SET ? PARTIES.filter((p) => PARTY_SET.includes(p.slug)) : PARTIES
  if (PARTY_SET) {
    const unknown = PARTY_SET.filter((x) => !PARTIES.some((p) => p.slug === x))
    // A typo'd slug silently drafting nothing is the same shape as this whole
    // bug report: a run that reports success having done nothing.
    if (unknown.length) { console.error(`Unknown party slug(s): ${unknown.join(', ')}`); process.exit(1) }
  }
  console.log(`Drafting ${topicArg} positions for ${list.length} parties (model ${MODEL})…\n`)
  // One party's failure must not end the run. A model error — a rate limit, an
  // exhausted credit balance, a transient 500 — used to throw out of main() and
  // kill the whole topic, so parties later in the list were silently never
  // drafted and the run looked like it had simply finished. Each is isolated and
  // counted, and the tally at the end says how many actually failed.
  // How much of the site is already missing before this run adds to it.
  if (MAX_PENDING !== Infinity && !DRY_RUN) {
    const { count, error } = await supabase
      .from('content_items').select('*', { count: 'exact', head: true })
      .eq('type', 'position').eq('status', 'pending')
    // A bare .select() silently caps at 1000 rows in PostgREST, which is why
    // this counts with head+exact rather than reading rows and taking .length.
    if (error) { console.error(`Could not count the review queue: ${error.message}. Refusing to draft blind.`); process.exit(1) }
    PENDING_NOW = count || 0
    if (PENDING_NOW >= MAX_PENDING) {
      console.log(`
⏸  ${PENDING_NOW} position(s) already awaiting review (--max-pending=${MAX_PENDING}). Not drafting ${topicArg}.`)
      console.log('   Clear some of /editor and the next run continues. Nothing is lost: unmatched fingerprints bring these back.')
      return
    }
  }

  let failed = 0
  let deferred = 0
  for (const p of list) {
    if (WROTE >= MAX_DRAFTS) { deferred++; continue }
    if (PENDING_NOW + WROTE >= MAX_PENDING) { deferred++; continue }
    try { await draftOne(p, topicArg) }
    catch (e) {
      failed++
      const msg = String(e?.message || e).replace(/\s+/g, ' ').slice(0, 160)
      console.error(`✗ ${p.slug}/${topicArg}: ${msg}`)
    }
  }
  if (failed > 0) {
    console.error(`
${failed} of ${list.length} part(ies) failed on ${topicArg} — see above.`)
    // A red run, not a quiet one. With exit 0 the workflow's per-topic failure
    // accounting never fired, so an exhausted API balance looked like a day on
    // which nothing had changed.
    process.exitCode = 1
  }
  if (DRY_RUN) {
    console.log(`
── ${topicArg} — dry run, nothing written ──`)
    console.log(`   unchanged:        ${TALLY.unchanged.length}`)
    console.log(`   no baseline yet:  ${TALLY.baseline.length}`)
    console.log(`   DRIFTED:          ${TALLY.drifted.length}${TALLY.drifted.length ? '  (' + TALLY.drifted.join(', ') + ')' : ''}`)
    console.log(`   repointed (need --replace, not drift): ${TALLY.repointed.length}${TALLY.repointed.length ? '  (' + TALLY.repointed.join(', ') + ')' : ''}`)
    console.log(`   would draft new:  ${TALLY.newDraft.length}${TALLY.newDraft.length ? '  (' + TALLY.newDraft.join(', ') + ')' : ''}`)
    console.log(`   model calls a real run would make: ${TALLY.drifted.length + TALLY.newDraft.length} draft(s), plus one gate call per drifted LIVE row`)
    return
  }
  if (IF_CHANGED) {
    console.log(`
── ${topicArg} — --if-changed ──`)
    console.log(`   unchanged:            ${TALLY.unchanged.length}`)
    console.log(`   baselined (no call):  ${TALLY.baseline.length}`)
    console.log(`   moved, not material:  ${TALLY.immaterial.length}${TALLY.immaterial.length ? '  (' + TALLY.immaterial.join(', ') + ')' : ''}`)
    console.log(`   PROPOSED for review:  ${TALLY.proposed.length}${TALLY.proposed.length ? '  (' + TALLY.proposed.join(', ') + ')' : ''}`)
    console.log(`   no position found:    ${TALLY.notFound.length}${TALLY.notFound.length ? '  (' + TALLY.notFound.join(', ') + ')' : ''}`)
    console.log(`   POSSIBLE WITHDRAWAL:  ${TALLY.withdrawn.length}${TALLY.withdrawn.length ? '  (' + TALLY.withdrawn.join(', ') + ')' : ''}`)
    console.log(`   deferred, unreachable source: ${TALLY.unreachable.length}${TALLY.unreachable.length ? '  (' + TALLY.unreachable.join(', ') + ')' : ''}`)
    console.log(`   repointed (need --replace): ${TALLY.repointed.length}${TALLY.repointed.length ? '  (' + TALLY.repointed.join(', ') + ')' : ''}`)
  }
  // A cap that stops quietly is indistinguishable from a run with nothing left
  // to do — the same shape as the bug this whole change exists to fix. Say what
  // was left, and say that it is coming back.
  if (deferred) {
    // Which guard actually stopped it. The two have different remedies — raise
    // the cap, or go clear /editor — so naming the wrong one sends you to fix
    // the wrong thing. This said "--max-drafts" unconditionally and reported
    // "hit --max-drafts=3 after 1 write(s)", which is self-evidently not what
    // happened.
    const why = WROTE >= MAX_DRAFTS
      ? `--max-drafts=${MAX_DRAFTS}`
      : `--max-pending=${MAX_PENDING} (${PENDING_NOW} were already queued)`
    console.log(`\n⏸  ${deferred} part${deferred === 1 ? 'y' : 'ies'} deferred on ${topicArg}: hit ${why} after ${WROTE} write(s).`)
    console.log('   Not skipped — the next run picks them up, since their page hashes are still unmatched.')
  }
  console.log(`\nDone. New positions and proposed updates are at /editor; nothing live changed.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
