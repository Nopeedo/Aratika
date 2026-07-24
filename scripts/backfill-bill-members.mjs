/**
 * backfill-bill-members.mjs — put the member in charge onto legislation items.
 *
 * There are two bill datasets and only one of them knows who is responsible:
 *   • src/constants/bills-54.ts   — from the Parliament API. Has `member` for
 *     every bill ("Bishop, Hon Chris"). Powers the /bills tracker.
 *   • content_items (type='legislation') — from the PCO/RSS ingest. Powers the
 *     plain-language /legislation reader pages. Had NO sponsor field at all.
 *
 * So a reader on the explainer page — arguably the person who most needs it —
 * could not see who put the bill forward. This joins the two, deterministically
 * (no AI): by bill number first, then by normalised title, mirroring the
 * fallback already used in command-centre.tsx (title matches where slugs miss).
 *
 * Writes data.member ("Chris Bishop") and, when the MP has a profile,
 * data.memberSlug so the reader page can link to them.
 *
 * Run: node scripts/backfill-bill-members.mjs [--dry-run]
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

dotenv.config({ path: '.env.local' })
const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const DRY = process.argv.includes('--dry-run')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// ── 1. Bills from the generated constant (single-line JSON array) ─────────────
function loadBills() {
  // The generator writes the whole array on one line, so read it line-wise —
  // a regex across the file is brittle here (CRLF checkouts, nested "]").
  const text = readFileSync(join(root, 'src/constants/bills-54.ts'), 'utf8')
  // NB: must be the exact declaration — 'export const BILLS_54' also prefixes
  // BILLS_54_META, which is an object and has no array to parse.
  const line = text.split(/\r?\n/).find((l) => l.startsWith('export const BILLS_54:'))
  if (!line) throw new Error('Could not locate the BILLS_54 array in bills-54.ts')
  // Start after the '=' — the first '[' on the line belongs to the type
  // annotation (Bill54[]), not the data.
  const eq = line.indexOf('=')
  const json = line.slice(line.indexOf('[', eq)).replace(/;\s*$/, '')
  return JSON.parse(json)
}

// ── 2. MP slugs, so the member can link to their profile ─────────────────────
function loadMps() {
  const byName = new Map()
  for (const rel of ['src/constants/mps-generated.ts', 'src/constants/mps-data.ts']) {
    for (const line of readFileSync(join(root, rel), 'utf8').split('\n')) {
      const slug = line.match(/slug:\s*'([^']+)'/)?.[1]
      const name = line.match(/name:\s*'([^']+)'/)?.[1]
      if (slug && name) byName.set(name.toLowerCase(), slug)
    }
  }
  return byName
}

/** "Bishop, Hon Chris" → "Chris Bishop"; drops honorifics. */
function tidyMember(raw) {
  if (!raw) return null
  const [surname, given = ''] = String(raw).split(',').map((s) => s.trim())
  const first = given.replace(/\b(Rt\s+Hon|Hon|Dr|Sir|Dame|Prof)\b\.?/gi, '').replace(/\s+/g, ' ').trim()
  return first ? `${first} ${surname}` : surname
}

const normTitle = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')

const bills = loadBills()
const mpByName = loadMps()

const byNumber = new Map(), byTitle = new Map()
for (const b of bills) {
  if (b.number) byNumber.set(String(b.number).trim(), b)
  byTitle.set(normTitle(b.title), b)
}

const { data, error } = await sb.from('content_items').select('id, title, data').eq('type', 'legislation')
if (error) { console.error(error.message); process.exit(1) }
const rows = data || []

let matchedNum = 0, matchedTitle = 0, unmatched = 0, linked = 0, updated = 0
const updates = []
for (const r of rows) {
  const num = r.data?.billNumber ? String(r.data.billNumber).trim() : null
  let bill = num ? byNumber.get(num) : null
  if (bill) matchedNum++
  else {
    bill = byTitle.get(normTitle(r.title))
    if (bill) matchedTitle++
  }
  if (!bill || !bill.member) { unmatched++; continue }

  const member = tidyMember(bill.member)
  const memberSlug = mpByName.get(String(member).toLowerCase()) || null
  if (memberSlug) linked++

  // Also carry across the submission facts. The reader page used to infer "you can
  // submit" from the stage alone, and had no link to Parliament's own submission
  // page — so it could invite a submission after the window had closed, and then
  // give nowhere to lodge it.
  const next = {
    ...r.data,
    member, memberSlug, memberRaw: bill.member,
    officialUrl: bill.officialUrl ?? r.data?.officialUrl ?? null,
    submissionsCalled: bill.submissionsCalled ?? false,
    submissionsClose: bill.submissionsClose ?? null,
  }
  const same = r.data?.member === member && r.data?.memberSlug === memberSlug
    && r.data?.officialUrl === next.officialUrl
    && (r.data?.submissionsCalled ?? false) === next.submissionsCalled
    && (r.data?.submissionsClose ?? null) === next.submissionsClose
  if (same) continue
  updates.push({ id: r.id, data: next })
}

console.log(`legislation items: ${rows.length}`)
console.log(`  matched by bill number: ${matchedNum}`)
console.log(`  matched by title:       ${matchedTitle}`)
console.log(`  no match / no member:   ${unmatched}`)
console.log(`  member links to an MP profile: ${linked}`)
console.log(`  needing update: ${updates.length}`)

if (DRY) { console.log('\n(dry run — re-run without --dry-run to write)'); process.exit(0) }
for (const u of updates) {
  const { error: e2 } = await sb.from('content_items').update({ data: u.data }).eq('id', u.id)
  if (!e2) updated++
}
console.log(`\nUpdated ${updated}/${updates.length}.`)
process.exit(0)
