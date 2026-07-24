/**
 * Bill enrichment — Step 2 of the immersive reader.
 *
 * For pending bill items in content_items, fetch the official bill text, ask
 * Claude (grounded ONLY in that text) for a neutral plain-language summary + a
 * policy-topic mapping (each topic backed by actual excerpts + a plain
 * explanation), and write it back to the item — which stays PENDING for an
 * editor to approve at /editor. Nothing is published without the human gate.
 *
 * Run:
 *   node scripts/enrich-bills.mjs              (enrich 1 — cheap test)
 *   node scripts/enrich-bills.mjs --limit=10   (enrich up to 10)
 *   node scripts/enrich-bills.mjs --all        (enrich all un-enriched bills)
 *
 * Needs: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
 */

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'
import { fetchBillText } from './lib/bill-text.mjs'

dotenv.config({ path: '.env.local' })

const args = process.argv.slice(2)
const ALL = args.includes('--all')
const limArg = args.find((a) => a.startsWith('--limit='))
const LIMIT = ALL ? 100000 : (limArg ? parseInt(limArg.split('=')[1], 10) : 1)
const STAGE_ONLY = args.includes('--stage-only')   // non-destructive: only fills data.stage
const TEXT_ONLY = args.includes('--text-only')     // non-AI: fetch + store full bill text
const SIMPLIFY = args.includes('--simplify')       // add basic (jargon-free) versions from existing text
const FORCE = args.includes('--force')             // re-process even if already populated

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const GEMINI_KEY = process.env.GEMINI_API_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
// Provider auto-selects: Gemini if its key is present (free tier), else Anthropic.
// Override with AI_PROVIDER=gemini|anthropic.
const PROVIDER = process.env.AI_PROVIDER || (GEMINI_KEY ? 'gemini' : (ANTHROPIC_KEY ? 'anthropic' : null))
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

if (!URL || !SERVICE_KEY) { console.error('Missing Supabase env'); process.exit(1) }
if (!PROVIDER) { console.error('No AI key found — add GEMINI_API_KEY (free) or ANTHROPIC_API_KEY to .env.local.'); process.exit(1) }

const supabase = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } })
const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null
console.log(`AI provider: ${PROVIDER} (${PROVIDER === 'gemini' ? GEMINI_MODEL : ANTHROPIC_MODEL})`)

// Retry wrapper for transient 429/5xx ("high demand") errors.
async function callModel(system, user) {
  let lastErr
  for (let attempt = 1; attempt <= 4; attempt++) {
    try { return await callOnce(system, user) }
    catch (e) {
      lastErr = e
      const msg = String(e?.message || '')
      const retriable = /HTTP (429|500|502|503|504)/.test(msg) || /overloaded|UNAVAILABLE|high demand/i.test(msg)
      if (!retriable || attempt === 4) break
      const wait = attempt * 4000
      console.log(`  …transient error, retrying in ${wait / 1000}s (${attempt + 1}/4)`)
      await new Promise((r) => setTimeout(r, wait))
    }
  }
  throw lastErr
}

// One call, either provider, returns the model's raw text.
async function callOnce(system, user) {
  if (PROVIDER === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 4096, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } },
      }),
    })
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
    const j = await res.json()
    return (j?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim()
  }
  const resp = await anthropic.messages.create({
    model: ANTHROPIC_MODEL, max_tokens: 4096, system,
    messages: [{ role: 'user', content: user }],
  })
  return resp.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim()
}

const TOPICS = ['housing', 'health', 'economy', 'education', 'climate', 'environment', 'crime-justice', 'treaty-maori-affairs', 'immigration', 'foreign-policy']
const PIPELINE = ['introduced', 'first-reading', 'select-committee', 'second-reading', 'committee-of-whole-house', 'third-reading', 'royal-assent']

const SYSTEM = `You are a strictly NON-PARTISAN legislative analyst for Aratika, a New Zealand civic-information site. You are given the official full text of a NZ bill. Produce a factual, neutral breakdown for everyday New Zealanders.

ABSOLUTE RULES:
- NEUTRAL: describe what the bill does. Never say whether it is good or bad, never give an opinion, recommendation, or prediction, never use loaded language.
- GROUNDED: use ONLY the provided bill text. Do not invent provisions, numbers, or effects. If the text doesn't support something, leave it out.
- PLAIN: assume the reader knows NOTHING about politics or law. The BASIC fields must use NO jargon at all — if a concept is unavoidable, explain it in everyday words in the same sentence. Short sentences. Be concrete ("this means…", "in practice…"), not abstract. NZ English.
- For policy topics, ONLY include a topic if the bill genuinely and meaningfully addresses it. It is fine to return few or even one. Quote/paraphrase the actual relevant parts as short excerpts.

Return ONLY a JSON object (no markdown, no commentary) of this exact shape:
{
  "summary_basic": "60-110 words for someone with zero background. NO jargon. Explain what the bill actually does and what it means for everyday people, like you're telling a friend.",
  "summary": "120-180 word fuller summary — more specifics and context, still plain, but you may use a necessary term if you briefly explain it.",
  "stage": "<the bill's CURRENT stage — exactly one of: introduced, first-reading, select-committee, second-reading, committee-of-whole-house, third-reading, royal-assent — inferred from the document version: 'as introduced' → first-reading; referred to/considered by a committee → select-committee; 'as reported from the [name] Committee' → second-reading; an Act / received Royal assent → royal-assent>",
  "select_committee": "<the select committee name if the text names one, otherwise null>",
  "policy_links": [
    {
      "topic": "<one of: ${TOPICS.join(', ')}>",
      "explanation_basic": "ONE very plain, jargon-free sentence on how the bill affects this area for ordinary people",
      "explanation": "1-2 sentences with a little more detail, still plain",
      "excerpts": ["short quote or close paraphrase from the bill showing the connection", "..."]
    }
  ]
}`

async function enrichOne(item) {
  const link = item.data?.link
  if (!link) throw new Error('no link in item.data')
  const fullText = await fetchBillText(link)
  const text = fullText.slice(0, 80000) // cap for token/cost control; purpose & key clauses are early

  const clean = (s) => s.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim()
  const tryParse = (s) => { try { return JSON.parse(s) } catch { return null } }
  const user = `Bill title: ${item.title}\n\nOFFICIAL BILL TEXT (may be truncated):\n${text}\n\nReturn ONLY the JSON object.`

  let parsed = tryParse(clean(await callModel(SYSTEM, user)))
  if (!parsed) {
    // Long bills can overflow the token budget mid-JSON. Retry once, demanding compact, complete JSON.
    const concise = user + '\n\nIMPORTANT: Return STRICT, COMPLETE, minified JSON that is fully closed. Use at most 2 short excerpts per topic and stay within the word limits.'
    parsed = tryParse(clean(await callModel(SYSTEM, concise)))
  }
  if (!parsed) throw new Error('model returned invalid/incomplete JSON after retry')

  const summary = String(parsed.summary || '').trim()
  const summaryBasic = String(parsed.summary_basic || '').trim()
  const policy_links = (Array.isArray(parsed.policy_links) ? parsed.policy_links : [])
    .filter((p) => p && TOPICS.includes(p.topic))
    .map((p) => ({
      topic: p.topic,
      explanation: String(p.explanation || '').trim(),
      explanationBasic: String(p.explanation_basic || '').trim(),
      excerpts: (Array.isArray(p.excerpts) ? p.excerpts : []).map((e) => String(e).trim()).filter(Boolean).slice(0, 5),
    }))

  if (!summary) throw new Error('model returned empty summary')

  const stage = PIPELINE.includes(parsed.stage) ? parsed.stage : null
  const selectCommittee = parsed.select_committee && String(parsed.select_committee).toLowerCase() !== 'null' ? String(parsed.select_committee).trim() : null

  const newData = { ...item.data, summaryBasic, policy_links, stage, selectCommittee, enriched: true, enriched_at: new Date().toISOString() }
  const { error } = await supabase.from('content_items')
    .update({ summary, data: newData, status: 'pending', change_kind: 'updated', updated_at: new Date().toISOString() })
    .eq('id', item.id)
  if (error) throw error

  return { topics: policy_links.map((p) => p.topic), summaryLen: summary.length }
}

// ── Stage-only backfill (non-destructive: never touches status/summary) ──
const STAGE_SYSTEM = `Identify a New Zealand bill's CURRENT stage in Parliament from its official text/version line. Signals: "as introduced" → "first-reading"; referred to / considered by a committee → "select-committee"; "as reported from the [name] Committee" → "second-reading"; passed all stages / received Royal assent / is an Act → "royal-assent". Choose exactly one of: ${PIPELINE.join(', ')}. Return ONLY JSON: {"stage":"<one>","select_committee":"<committee name or null>"}`

async function getStage(title, text) {
  let raw = await callModel(STAGE_SYSTEM, `Bill title: ${title}\n\nOFFICIAL TEXT (truncated):\n${text.slice(0, 40000)}\n\nReturn ONLY the JSON.`)
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim()
  const j = JSON.parse(raw)
  const stage = PIPELINE.includes(j.stage) ? j.stage : null
  const selectCommittee = j.select_committee && String(j.select_committee).toLowerCase() !== 'null' ? String(j.select_committee).trim() : null
  return { stage, selectCommittee }
}

async function stageBackfill() {
  const { data, error } = await supabase
    .from('content_items')
    .select('id, title, data')
    .eq('type', 'legislation')
    .limit(400)
  if (error) { console.error(error); process.exit(1) }
  const cands = (data || [])
    .filter((it) => typeof it.data?.link === 'string' && it.data.link.includes('/bill/') && it.data?.enriched && !it.data?.stage)
    .slice(0, ALL ? 100000 : (limArg ? LIMIT : 100))
  if (!cands.length) { console.log('No enriched bills missing a stage.'); return }
  console.log(`Backfilling stage for ${cands.length} bill(s)…`)
  let ok = 0
  for (const item of cands) {
    try {
      const text = await fetchBillText(item.data.link)
      const { stage, selectCommittee } = await getStage(item.title, text)
      // preserve status, summary, policy_links — only add stage fields
      const { error: e } = await supabase.from('content_items')
        .update({ data: { ...item.data, stage, selectCommittee }, updated_at: new Date().toISOString() })
        .eq('id', item.id)
      if (e) throw e
      ok++
      console.log(`✓ ${item.title} — stage: ${stage || '?'}${selectCommittee ? ` (${selectCommittee})` : ''}`)
    } catch (e) { console.error(`✗ ${item.title} — ${e.message}`) }
  }
  console.log(`Done. Stage set for ${ok}/${cands.length}.`)
}

// ── Full-text backfill (no AI — just fetch + store the cleaned text) ──
async function textBackfill() {
  const { data, error } = await supabase
    .from('content_items')
    .select('id, title, data, full_text')
    .eq('type', 'legislation')
    .limit(400)
  if (error) { console.error(error); process.exit(1) }
  const cands = (data || [])
    .filter((it) => typeof it.data?.link === 'string' && it.data.link.includes('/bill/') && it.data?.enriched && (FORCE || !it.full_text))
    .slice(0, ALL ? 100000 : (limArg ? LIMIT : 100))
  if (!cands.length) { console.log('No enriched bills missing full text.'); return }
  console.log(`Fetching full text for ${cands.length} bill(s)…`)
  let ok = 0
  for (const item of cands) {
    try {
      const text = await fetchBillText(item.data.link, { preserveBreaks: true })
      const { error: e } = await supabase.from('content_items')
        .update({ full_text: text, updated_at: new Date().toISOString() })
        .eq('id', item.id)
      if (e) throw e
      ok++
      console.log(`✓ ${item.title} — ${text.length.toLocaleString()} chars`)
    } catch (e) { console.error(`✗ ${item.title} — ${e.message}`) }
  }
  console.log(`Done. Text stored for ${ok}/${cands.length}.`)
}

// ── Simplify backfill — add jargon-free BASIC versions from existing detailed text ──
const SIMPLIFY_SYSTEM = `Rewrite a NZ bill's summary and policy explanations into BASIC versions for someone with NO knowledge of politics or law. Rules: absolutely no jargon (if a concept is unavoidable, explain it in everyday words); short, plain, friendly, concrete sentences; keep the meaning exactly; stay factual and neutral (no opinions); NZ English. Return ONLY JSON: {"summary_basic":"60-110 word plain summary","policy_links":[{"topic":"<topic key>","explanation_basic":"one jargon-free sentence"}]}`

async function simplifyOne(item) {
  const pls = Array.isArray(item.data?.policy_links) ? item.data.policy_links : []
  const input = { summary: item.summary, policy_links: pls.map((p) => ({ topic: p.topic, explanation: p.explanation })) }
  let raw = await callModel(SIMPLIFY_SYSTEM, `Bill: ${item.title}\n\n${JSON.stringify(input)}\n\nReturn ONLY the JSON.`)
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim()
  const parsed = JSON.parse(raw)
  const summaryBasic = String(parsed.summary_basic || '').trim()
  const basics = new Map((Array.isArray(parsed.policy_links) ? parsed.policy_links : []).map((p) => [p.topic, String(p.explanation_basic || '').trim()]))
  const policy_links = pls.map((p) => ({ ...p, explanationBasic: basics.get(p.topic) || p.explanationBasic || '' }))
  const { error } = await supabase.from('content_items')
    .update({ data: { ...item.data, summaryBasic, policy_links }, updated_at: new Date().toISOString() })
    .eq('id', item.id)
  if (error) throw error
  return { summaryBasic }
}

async function simplifyBackfill() {
  const { data, error } = await supabase
    .from('content_items')
    .select('id, title, summary, data')
    .eq('type', 'legislation')
    .limit(400)
  if (error) { console.error(error); process.exit(1) }
  const cands = (data || [])
    .filter((it) => it.data?.enriched && it.summary && !it.data?.summaryBasic)
    .slice(0, ALL ? 100000 : (limArg ? LIMIT : 100))
  if (!cands.length) { console.log('No enriched bills missing a basic version.'); return }
  console.log(`Adding basic (plain) versions for ${cands.length} bill(s)…`)
  let ok = 0
  for (const item of cands) {
    try { await simplifyOne(item); ok++; console.log(`✓ ${item.title}`) }
    catch (e) { console.error(`✗ ${item.title} — ${e.message}`) }
  }
  console.log(`Done. Basic versions added for ${ok}/${cands.length}.`)
}

async function main() {
  if (TEXT_ONLY) return textBackfill()
  if (STAGE_ONLY) return stageBackfill()
  if (SIMPLIFY) return simplifyBackfill()
  // pull pending legislation items that are bills and not yet enriched
  const { data, error } = await supabase
    .from('content_items')
    .select('id, title, data, status')
    .eq('type', 'legislation')
    .eq('status', 'pending')
    .order('fetched_at', { ascending: false })
    .limit(300)
  if (error) { console.error(error); process.exit(1) }

  const candidates = (data || [])
    .filter((it) => typeof it.data?.link === 'string' && it.data.link.includes('/bill/'))
    .filter((it) => !it.data?.enriched)
    .slice(0, LIMIT)

  if (candidates.length === 0) { console.log('No un-enriched pending bills to process.'); return }
  console.log(`Enriching ${candidates.length} bill(s)…`)

  let ok = 0
  for (const item of candidates) {
    try {
      const r = await enrichOne(item)
      ok++
      console.log(`✓ ${item.title} — ${r.summaryLen} char summary, topics: ${r.topics.join(', ') || '(none)'}`)
    } catch (e) {
      console.error(`✗ ${item.title} — ${e.message}`)
    }
  }
  console.log(`Done. Enriched ${ok}/${candidates.length}. Review at /editor.`)
}

// Exit explicitly on success too: the Supabase client holds keep-alive sockets open,
// so without this the process finishes its work but never exits — which in CI means
// the step hangs instead of completing (it once blocked a run for 2h39m).
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
