/**
 * detect-mp-stat-changes.mjs — record when an MP's record actually moves.
 *
 * The "Impact this term" tiles are rebuilt wholesale from Parliament's API every
 * day, so nothing anywhere remembered yesterday's values. A reader could not be
 * shown that a member's bill had passed since they last looked, because the page
 * only ever knew the present.
 *
 * Two artefacts, deliberately:
 *
 *   scripts/.state/mp-stats.json      the current values, for diffing. Same
 *                                     mechanism as bill-status.json.
 *   src/constants/mp-stat-changes.json a DATED, append-only changelog the site
 *                                     imports and renders.
 *
 * The changelog is what makes "changed since YOUR last visit" possible. A
 * last-run state file can only answer "did this move today", which is the wrong
 * question for a reader who was last here a fortnight ago.
 *
 * Both files are committed by refresh-bills.yml, which already commits
 * src/constants and scripts/.state.
 *
 * FIRST RUN RECORDS A BASELINE AND NOTHING ELSE. Without that, every MP would
 * appear to have changed on the day this shipped.
 *
 * Run: node scripts/detect-mp-stat-changes.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const STATE_PATH = join(here, '.state', 'mp-stats.json')
const LOG_PATH = join(root, 'src/constants/mp-stat-changes.json')
const DRY = process.argv.includes('--dry-run')

/** How long a change stays in the changelog. Beyond this nobody is being told
 *  "new since your last visit" — they have not visited in six months. */
const KEEP_DAYS = 180

// The stats that actually move. All four are regenerated daily from
// Parliament's API by refresh-bills.yml and its siblings.
//
// Portfolios and select committees are deliberately NOT tracked. They live in
// GENERATED_DETAIL, which uses unquoted keys and so does not parse as JSON the
// way the other generated files do — and they change on a reshuffle, which is
// rare and announced, not the sort of quiet movement this exists to surface.
const FIELDS = [
  ['govBills', 'Government bills in charge'],
  ['passedBills', 'Members’ bills passed into law'],
  ['ballotBills', 'Members’ bills in the ballot'],
  ['writtenQuestions', 'Written questions'],
  ['speeches', 'Speeches in the House'],
]

/**
 * Pull a named export out of a generated .ts constants file. These are written
 * by generator scripts as plain literals with quoted keys, so they parse as
 * JSON; the hand-curated files do not, which is why only generated ones are
 * read here.
 */
function readJsonExport(rel, name) {
  const src = readFileSync(join(root, rel), 'utf8')
  const m = new RegExp(`export const ${name}[^=]*=\s*`).exec(src)
  if (!m) throw new Error(`${name} not found in ${rel}`)
  const start = src.indexOf('{', m.index + m[0].length - 1)
  let depth = 0
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}') {
      depth--
      if (depth === 0) return JSON.parse(src.slice(start, i + 1))
    }
  }
  throw new Error(`${name} in ${rel} is unterminated`)
}

const passed = readJsonExport('src/constants/mps-bill-activity.ts', 'MP_PASSED_BILLS')
const gov = readJsonExport('src/constants/mps-bill-activity.ts', 'MP_GOV_BILLS')
const ballot = readJsonExport('src/constants/mps-members-bills.ts', 'MP_MEMBERS_BILLS')
const questions = readJsonExport('src/constants/mps-written-questions.ts', 'MP_WRITTEN_QUESTIONS')
const speeches = readJsonExport('src/constants/mps-speeches.ts', 'MP_SPEECHES')

// Every MP mentioned by any source. Taking the union rather than a roster means
// this cannot silently miss someone who only appears in one file.
const slugs = new Set([
  ...Object.keys(passed), ...Object.keys(gov), ...Object.keys(ballot),
  ...Object.keys(questions), ...Object.keys(speeches),
])

const len = (v) => (Array.isArray(v) ? v.length : 0)
const cnt = (v) => (v && typeof v.count === 'number' ? v.count : null)

const current = {}
for (const slug of slugs) {
  current[slug] = {
    govBills: len(gov[slug]),
    passedBills: len(passed[slug]),
    ballotBills: len(ballot[slug]),
    writtenQuestions: cnt(questions[slug]),
    speeches: cnt(speeches[slug]),
  }
}
console.log(`MPs read: ${slugs.size}`)

const previous = existsSync(STATE_PATH) ? JSON.parse(readFileSync(STATE_PATH, 'utf8')) : null
const today = new Date().toISOString().slice(0, 10)

if (!previous) {
  if (!DRY) {
    mkdirSync(dirname(STATE_PATH), { recursive: true })
    writeFileSync(STATE_PATH, JSON.stringify(current, null, 0))
    if (!existsSync(LOG_PATH)) writeFileSync(LOG_PATH, JSON.stringify({ changes: [] }, null, 2) + '\n')
  }
  console.log('First run — baseline recorded, no changes logged.')
  process.exit(0)
}

const changes = []
for (const [slug, now] of Object.entries(current)) {
  const was = previous[slug]
  if (!was) continue // new MP: nothing to compare against, and not a "change"
  for (const [key, label] of FIELDS) {
    const a = was[key]
    const b = now[key]
    if (a == null || b == null || a === b) continue
    changes.push({ mp: slug, field: key, label, from: a, to: b, date: today })
  }
}

const log = existsSync(LOG_PATH) ? JSON.parse(readFileSync(LOG_PATH, 'utf8')) : { changes: [] }
const cutoff = new Date(Date.now() - KEEP_DAYS * 86_400_000).toISOString().slice(0, 10)
const kept = (log.changes || []).filter((c) => c.date >= cutoff)
const next = { generated: today, changes: [...changes, ...kept] }

console.log(`Changes detected: ${changes.length}`)
for (const c of changes.slice(0, 12)) console.log(`  ${c.mp} · ${c.label}: ${c.from} → ${c.to}`)
if (changes.length > 12) console.log(`  …and ${changes.length - 12} more`)
console.log(`Changelog: ${next.changes.length} entries within ${KEEP_DAYS} days`)

if (DRY) { console.log('\nDRY RUN — nothing written.'); process.exit(0) }
mkdirSync(dirname(STATE_PATH), { recursive: true })
writeFileSync(STATE_PATH, JSON.stringify(current, null, 0))
writeFileSync(LOG_PATH, JSON.stringify(next, null, 2) + '\n')
console.log('\nWrote state + changelog.')
process.exit(0)
