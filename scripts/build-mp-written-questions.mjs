/**
 * build-mp-written-questions.mjs — per-MP written parliamentary questions asked
 * THIS TERM (54th Parliament, since the 2023 election), from questions.parliament.nz's
 * public search API (undocumented, but the same shared platform as bills.parliament.nz's
 * official bills API, which we already rely on).
 *
 * The API's own filter params (parliamentNumber/person/memberId) were tested and don't
 * actually filter server-side — only `keyword` (full-text) does. So: search by each MP's
 * exact name, then filter CLIENT-SIDE to rows whose title truly starts with that MP
 * ("<number> (<year>). [Hon ]<Name> to the Minister for ...") AND whose own
 * parliamentNumber field is 54 — this avoids counting a same-named MP from an earlier
 * term, or a question that merely mentions the MP's name in its body text.
 *
 * Captures, per MP: the total count, a breakdown by Minister/portfolio (so a real
 * "where their scrutiny has gone" pattern can be shown, not just a raw number), and
 * the actual question text + actual reply text for the most recent few — so a reader
 * can see what was really asked and what really came back, not just who it went to.
 *
 * Nothing invented or summarised; every field traces to a real official record.
 *
 * Run:  node scripts/build-mp-written-questions.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const GEN = join(__dirname, '..', 'src', 'constants', 'mps-generated.ts')
const OUT = join(__dirname, '..', 'src', 'constants', 'mps-written-questions.ts')
const API = 'https://questions.parliament.nz/api/data/search'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'
const TERM = 54
const SOURCE_URL = 'https://questions.parliament.nz/'
const SOURCE_LABEL = "Written Parliamentary Questions (questions.parliament.nz)"
const RECENT_KEEP = 5
const REPLY_CAP = 500 // chars — real text, just capped so one huge reply doesn't bloat the bundle

// MPs: slug -> official name (as it appears in question titles)
const src = readFileSync(GEN, 'utf8')
const mps = []
const slugRe = /slug:\s*'([^']+)'/g
let sm
while ((sm = slugRe.exec(src))) {
  const win = src.slice(sm.index, sm.index + 400)
  const nm = win.match(/\bname:\s*'([^']+)'/)
  if (nm) mps.push({ slug: sm[1], name: nm[1] })
}
mps.push({ slug: 'christopher-luxon', name: 'Christopher Luxon' })
mps.push({ slug: 'judith-collins', name: 'Judith Collins' })

const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

// Retries transient failures/short reads — a long sequential run (125 MPs, some paging
// 6-7+ times) hit an intermittent server hiccup that silently truncated one MP's results
// on the first attempt; this makes a genuinely-empty/short page trustworthy before we
// treat it as "end of data".
async function search(keyword, page, pageSize, tries = 3) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const r = await fetch(API, {
        method: 'POST',
        headers: { 'User-Agent': UA, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: null, keyword, pageSize, page, column: 1, direction: 1 }),
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return await r.json()
    } catch (e) {
      if (attempt === tries) throw e
      await sleep(400 * attempt)
    }
  }
}

const titleRe = (name) => new RegExp(`^\\d+\\s*\\(\\d{4}\\)\\.\\s*(?:Rt\\s+)?(?:Hon\\s+)?${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+to\\s+the\\s+`, 'i')

function clean(s) {
  return (s || '').replace(/\s+/g, ' ').trim()
}
function capReply(s) {
  const t = clean(s)
  if (!t) return null
  if (/^reply due:/i.test(t)) return null // not yet answered — omit rather than show a placeholder as if it were content
  return t.length > REPLY_CAP ? t.slice(0, REPLY_CAP) + '…' : t
}

const result = {}
let done = 0
for (const mp of mps) {
  try {
    let rows = []
    // No artificial page cap — some MPs (esp. prolific opposition askers) genuinely
    // exceed 2,000 questions this term. Loop until a page comes back short, with a
    // generous safety ceiling (40 pages = 20,000 rows) against a runaway loop.
    for (let page = 1; page <= 40; page++) {
      let d = await search(mp.name, page, 500)
      // A partial (not empty, not full) page is ambiguous — could be genuinely the
      // last page, or a transient short read. Re-confirm once before trusting it,
      // since a long sequential run over many MPs can hit an intermittent hiccup.
      if (d.value && d.value.length > 0 && d.value.length < 500) {
        await sleep(300)
        const confirm = await search(mp.name, page, 500)
        if (confirm.value && confirm.value.length > d.value.length) d = confirm
      }
      if (!d.value || d.value.length === 0) break
      rows.push(...d.value)
      if (d.value.length < 500) break
      await sleep(80) // be gentle on an undocumented, shared endpoint
    }
    const re = titleRe(mp.name)
    const mine = rows.filter((r) => r.documentType === 'WrittenQuestion' && r.parliamentNumber === TERM && re.test(r.title))
    if (mine.length === 0) { done++; continue }
    mine.sort((a, b) => (b.questionReleasedDate || '').localeCompare(a.questionReleasedDate || ''))

    // Breakdown by Minister/portfolio — a real, computed pattern of where the MP's
    // written-question scrutiny has actually gone this term.
    const byMinisterMap = new Map()
    for (const r of mine) {
      const m = r.ministerialDisplayName || r.ministerName || 'Unknown'
      byMinisterMap.set(m, (byMinisterMap.get(m) || 0) + 1)
    }
    const byMinister = [...byMinisterMap.entries()]
      .map(([minister, count]) => ({ minister, count }))
      .sort((a, b) => b.count - a.count)

    // Pick a mix: the most recent overall (shows current activity) PLUS the most recent
    // ANSWERED ones (so the card always has at least a couple of real Q&A pairs to show,
    // not just "reply not yet due" — replies typically take 1-2 weeks, so an MP's newest
    // questions are almost always still pending).
    const mostRecent = mine.slice(0, 3)
    const answered = mine.filter((r) => capReply(r.replyText) !== null)
    const seen = new Set()
    const picked = []
    for (const r of [...mostRecent, ...answered]) {
      if (seen.has(r.id)) continue
      seen.add(r.id)
      picked.push(r)
      if (picked.length >= RECENT_KEEP) break
    }
    picked.sort((a, b) => (b.questionReleasedDate || '').localeCompare(a.questionReleasedDate || ''))

    result[mp.slug] = {
      count: mine.length,
      byMinister,
      recent: picked.map((r) => ({
        minister: r.ministerialDisplayName || r.ministerName || '',
        date: (r.questionReleasedDate || '').slice(0, 10),
        question: clean(r.questionText),
        reply: capReply(r.replyText),
      })),
    }
  } catch (e) {
    console.warn(`  ${mp.slug}: FAILED (${e.message})`)
  }
  done++
  if (done % 25 === 0) console.log(`  …${done}/${mps.length}`)
}

const banner = `// AUTO-GENERATED by scripts/build-mp-written-questions.mjs. Do not edit by hand.
// Per-MP written parliamentary questions asked in the 54th Parliament term (since the
// 2023 election), from questions.parliament.nz's public search API — the same shared
// platform as bills.parliament.nz's official bills API. Counts, minister breakdown, and
// question/reply text are all real official record; nothing invented or summarised.\n`

writeFileSync(OUT, `${banner}
export interface WrittenQuestionDetail { minister: string; date: string; question: string; reply: string | null }
export interface MinisterBreakdown { minister: string; count: number }
export interface MPWrittenQuestions { count: number; byMinister: MinisterBreakdown[]; recent: WrittenQuestionDetail[] }
export const WRITTEN_QUESTIONS_META = {
  term: ${TERM},
  sourceUrl: '${SOURCE_URL}',
  sourceLabel: "${SOURCE_LABEL}",
}
export const MP_WRITTEN_QUESTIONS: Record<string, MPWrittenQuestions> = ${JSON.stringify(result, null, 2)}
`, 'utf8')

console.log(`\nMatched ${Object.keys(result).length} MPs with written questions this term → ${OUT}`)
