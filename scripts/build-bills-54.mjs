/**
 * build-bills-54.mjs — full 54th-Parliament bill dataset from the official
 * NZ Parliament bills API (bills.parliament.nz/api/data).
 *
 *  1. POST /api/data/search (pageSize 500) → all bills this term
 *     (title, number, type Government/Member's/Local/Private, status, committee, date).
 *  2. GET  /api/data/Bill/<id> per bill → Member(s) in charge + assent number.
 *  3. Map member-in-charge → our MP slug; tag a policy category by keyword.
 *
 * Generates:
 *   src/constants/bills-54.ts          — full list for the /bills tracker
 *   src/constants/mps-bill-activity.ts — MP_PASSED_BILLS + MP_GOV_BILLS (by slug)
 *
 * Run: node scripts/build-bills-54.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const GEN = join(__dirname, '..', 'src', 'constants', 'mps-generated.ts')
const OUT_BILLS = join(__dirname, '..', 'src', 'constants', 'bills-54.ts')
const OUT_ACT = join(__dirname, '..', 'src', 'constants', 'mps-bill-activity.ts')
const OUT_SUMMARY = join(__dirname, '..', 'src', 'constants', 'bills-54-summary.ts')
// policy topic → bill categories (mirror of src/lib/bills/by-topic.ts)
const TOPIC_CATS = {
  economy: ['Economy & tax', 'Work & social'], housing: ['Housing & tenancy'], health: ['Health'],
  education: ['Education'], climate: ['Environment & climate', 'Transport & infrastructure'], 'crime-justice': ['Crime & justice'],
}
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'
const API = 'https://bills.parliament.nz/api/data'
const AS_OF = '24 June 2026'

const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

async function jget(url, opts = {}, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json', 'Content-Type': 'application/json' }, ...opts })
      if (!r.ok) throw new Error('HTTP ' + r.status)
      return await r.json()
    } catch (e) { if (i === tries - 1) throw e; await new Promise((z) => setTimeout(z, 600 * (i + 1))) }
  }
}

// ── MP slug index (surname/party from mps-generated.ts) ──
const src = readFileSync(GEN, 'utf8')
const mps = []
const slugRe = /slug:\s*'([^']+)'/g
let sm
while ((sm = slugRe.exec(src))) {
  const win = src.slice(sm.index, sm.index + 800)
  const nm = win.match(/\bname:\s*'([^']+)'/); const pm = win.match(/\bparty:\s*'([^']+)'/)
  if (!nm) continue
  const tk = nm[1].split(/\s+/)
  mps.push({ slug: sm[1], party: pm ? pm[1] : '', lastKey: norm(tk[tk.length - 1]), surnameKey: norm(tk.slice(1).join('')), firstKey: norm(tk[0]) })
}
function slugFor(displayName) {
  if (!displayName) return null
  const [sur, rest = ''] = displayName.split(',')
  const first = rest.trim().replace(/^(Rt Hon|Hon|Dr|Sir|Dame)\s+/i, '').replace(/^(Hon|Dr)\s+/i, '')
  const sk = norm(sur); const fk = norm((first.split(/\s+/)[0]) || '')
  const km = (m) => m.surnameKey === sk || m.lastKey === sk
  let c = mps.filter(km)
  if (c.length === 1) return c[0].slug
  if (c.length > 1) { const bf = c.find((m) => m.firstKey === fk || m.firstKey.startsWith(fk) || fk.startsWith(m.firstKey)); if (bf) return bf.slug }
  return null
}

// ── Policy category by keyword (best-effort, for the tracker filter) ──
const CATS = [
  ['Economy & tax', /tax|revenue|fiscal|appropriation|economic|kiwisaver|income|gst|customs|excise|banking|finance|commerce|companies|insolven|procurement/i],
  ['Housing & tenancy', /housing|tenanc|rent|residential|building|construction|unit titles|retirement villlage|retirement village|body corporate/i],
  ['Health', /health|pae ora|medic|pharmac|smokefree|vaping|mental|disabilit|therapeutic|gene tech|substance|alcohol|drug/i],
  ['Education', /education|training|school|curriculum|tertiary|qualification|ncea|youth guarantee|trades academ/i],
  ['Environment & climate', /climate|emission|conservation|environment|resource management|rma|water|fisheries|wildlife|biodivers|forest|seabed|mining|energy|electric/i],
  ['Crime & justice', /crime|criminal|sentenc|corrections|police|court|justice|jury|juries|gang|firearm|arms|evidence|parole|victim|offen|prison/i],
  ['Transport & infrastructure', /transport|road|rail|land transport|infrastructure|maritime|aviation|vehicle/i],
  ['Treaty & Māori', /treaty|waitangi|māori|maori|te tiriti|oranga tamariki|takutai moana|settlement/i],
  ['Local government & democracy', /local government|council|electoral|election|referend|democracy|local bill/i],
  ['Work & social', /employment|worker|wage|holidays|leave|accident compensation|acc|social security|welfare|benefit|superannuation|immigration|privacy|consumer/i],
]
const catFor = (title) => { for (const [name, re] of CATS) if (re.test(title)) return name; return 'Other' }

function billSlug(title, number) {
  return (title || number).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

// ── 1. search ──
const search = await jget(`${API}/search`, { method: 'POST', body: JSON.stringify({
  id: null, documentPreset: 1, keyword: null, selectCommittee: null, status: [], documentTypes: [],
  documentSubtypes: [], beforeCommittee: null, billStages: [], billTab: 'All', billId: null,
  includeBillStages: true, subject: null, person: null, parliament: '54', dateFrom: '2023-10-14T00:00:00',
  dateTo: null, datePeriod: null, restrictedFrom: null, restrictedTo: null, terminatedReason: null,
  prettyTerminatedReason: null, terminatedReasons: [], column: 17, direction: 1, pageSize: 500, page: 1,
}) })
const rows = search.results
console.log(`Search: ${rows.length} bills in the 54th Parliament`)

const bills = rows.map((b) => ({
  id: b.id, title: b.title, number: b.billNumber, type: b.itemType, status: b.status,
  committee: b.selectCommittee || null, date: (b.lastStageDate || b.date || '').slice(0, 10),
  category: catFor(b.title), member: null, slug: billSlug(b.title, b.billNumber),
}))

// ── 2. member in charge per bill (concurrency pool) ──
let done = 0
async function pool(items, n, fn) {
  const q = [...items.keys()]
  await Promise.all(Array.from({ length: n }, async () => {
    while (q.length) { const i = q.shift(); await fn(items[i]); done++; if (done % 40 === 0) console.log(`  …${done}/${items.length}`) }
  }))
}
await pool(bills, 6, async (b) => {
  try { const d = await jget(`${API}/Bill/${b.id}`); const m = (d.Members && d.Members[0]) || null; b.member = m ? m.DisplayName : null }
  catch { /* leave null */ }
})
console.log('Member-in-charge resolved.')

for (const b of bills) b.mpSlug = slugFor(b.member)

// ── 3a. tracker dataset ──
const passed = bills.filter((b) => b.status === 'Royal Assent')
const order = { 'Royal Assent': 0, 'Third Reading': 1, 'Committee of whole House': 2, 'Second Reading': 3, 'Select Committee': 4, 'First Reading': 5, Terminated: 6 }
const tracker = bills
  .filter((b) => b.status !== 'Terminated')
  .sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || (b.date || '').localeCompare(a.date || ''))
  .map((b) => ({ slug: b.slug, title: b.title, number: b.number, type: b.type, status: b.status, category: b.category, committee: b.committee, member: b.member, date: b.date }))

writeFileSync(OUT_BILLS, `/**
 * bills-54.ts — GENERATED by scripts/build-bills-54.mjs. Do not edit by hand.
 * Source: NZ Parliament bills API (bills.parliament.nz/api/data), 54th Parliament,
 * captured ${AS_OF}. Excludes withdrawn/terminated bills.
 */
export type BillType = 'Government' | "Member's" | 'Local' | 'Private'
export interface Bill54 {
  slug: string; title: string; number: string; type: BillType; status: string
  category: string; committee: string | null; member: string | null; date: string
}
export const BILLS_54_META = { asOf: '${AS_OF}', total: ${tracker.length}, passed: ${passed.length}, sourceLabel: 'NZ Parliament — Bills', sourceUrl: 'https://bills.parliament.nz/' }
export const BILL_CATEGORIES = ${JSON.stringify([...new Set(tracker.map((b) => b.category))].sort())}
export const BILLS_54: Bill54[] = ${JSON.stringify(tracker, null, 0)}
`)
console.log(`Wrote ${OUT_BILLS} (${tracker.length} active bills)`)

// ── 3a-ii. tiny per-topic counts (so the client /plan can show numbers without the full dataset) ──
const topicCounts = {}
for (const [topic, cats] of Object.entries(TOPIC_CATS)) {
  const inT = tracker.filter((b) => cats.includes(b.category))
  topicCounts[topic] = { passed: inT.filter((b) => b.status === 'Royal Assent').length, active: inT.filter((b) => b.status !== 'Royal Assent').length }
}
writeFileSync(OUT_SUMMARY, `/** GENERATED by scripts/build-bills-54.mjs — tiny per-topic bill counts for the client /plan. */
export const BILLS_54_TOPIC_COUNTS: Record<string, { passed: number; active: number }> = ${JSON.stringify(topicCounts, null, 2)}
`)
console.log(`Wrote ${OUT_SUMMARY}`)

// ── 3b. MP bill activity ──
const passedMembers = {}   // members' bills enacted, by slug
const govByMinister = {}   // government bills in charge, by slug
for (const b of bills) {
  if (!b.mpSlug) continue
  if (/member/i.test(b.type) && b.status === 'Royal Assent') (passedMembers[b.mpSlug] ||= []).push({ title: b.title })
  if (/gov/i.test(b.type)) (govByMinister[b.mpSlug] ||= []).push({ title: b.title, status: b.status })
}
const matchedGov = bills.filter((b) => /gov/i.test(b.type) && b.mpSlug).length
const totalGov = bills.filter((b) => /gov/i.test(b.type)).length
console.log(`Passed members' bills mapped: ${Object.values(passedMembers).reduce((n, a) => n + a.length, 0)} across ${Object.keys(passedMembers).length} MPs`)
console.log(`Government bills mapped to a minister: ${matchedGov}/${totalGov}`)

writeFileSync(OUT_ACT, `/**
 * mps-bill-activity.ts — GENERATED by scripts/build-bills-54.mjs. Do not edit by hand.
 * 54th-Parliament bill activity by MP, from the official bills API. Captured ${AS_OF}.
 *  - MP_PASSED_BILLS: members' bills that became law (Royal Assent), by MP slug.
 *  - MP_GOV_BILLS:    government bills the MP is "member in charge" of (Ministers).
 */
export interface BillRef { title: string; status?: string }
export const BILL_ACTIVITY_META = { asOf: '${AS_OF}', sourceLabel: 'NZ Parliament — Bills', sourceUrl: 'https://bills.parliament.nz/' }
export const MP_PASSED_BILLS: Record<string, BillRef[]> = ${JSON.stringify(passedMembers, null, 2)}
export const MP_GOV_BILLS: Record<string, BillRef[]> = ${JSON.stringify(govByMinister, null, 2)}
`)
console.log(`Wrote ${OUT_ACT}`)
