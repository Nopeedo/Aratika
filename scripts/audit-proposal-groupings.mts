/**
 * audit-proposal-groupings.mts — does every curated grouping still describe the
 * position it replaces?
 *
 * A grouping in constants/policy-proposal-groups.ts REPLACES a position's
 * keyProposals on the homepage panel, by design (see that file's docblock). The
 * accepted cost was that a proposal added in /editor would not reach the panel.
 * The unaccepted cost, found on 1 Oct 2026, is what happens when a position is
 * REWRITTEN rather than added to: National's foreign-policy position was
 * re-drafted to be about trade and exports, the grouping still said diplomacy,
 * a combat-ready military and veterans, and the homepage showed a party
 * position no editor had approved while the policy page showed the real one.
 *
 * Nothing warns about that, because a grouping is matched on topic+party alone
 * and never compared to the text it is standing in for. This does the compare.
 *
 * It is deliberately crude: it asks whether the grouping and the live position
 * share ANY meaningful vocabulary. That is enough to separate "reworded" from
 * "about something else entirely", which is the failure that matters.
 *
 *   npx tsx scripts/audit-proposal-groupings.mts
 */
import { readFileSync } from 'node:fs'
import { PROPOSAL_GROUPINGS } from '../src/constants/policy-proposal-groups'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }),
) as Record<string, string>

const U = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '')
const K = env.SUPABASE_SERVICE_ROLE_KEY

const STOP = new Set(['will','the','and','for','with','that','this','from','their','they','are','new','zealand','nz','more','over','than','into','have','has','been','make','made','ensure','support','a','an','of','to','in','on','by','at','is','it','as','be','or','we','our','all','up','out','per','cent','next','term','years','year'])
const words = (s: string) => new Set(
  s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w)),
)

const rows = await (await fetch(
  `${U}/rest/v1/content_items?select=data&type=eq.position&status=eq.approved&limit=2000`,
  { headers: { apikey: K, Authorization: `Bearer ${K}` } },
)).json() as { data: { party: string; topic: string; stance?: string; keyProposals?: string[] } }[]

const live = new Map<string, { stance: string; text: string }>()
for (const { data: d } of rows) {
  if (!d?.party || !d?.topic) continue
  live.set(`${d.party}::${d.topic}`, {
    stance: d.stance ?? '',
    text: [d.stance ?? '', ...(d.keyProposals ?? [])].join(' '),
  })
}

const drifted: string[] = []
const orphaned: string[] = []
let ok = 0

for (const g of PROPOSAL_GROUPINGS) {
  const key = `${g.party}::${g.topic}`
  const pos = live.get(key)
  const groupText = g.proposals.map((p: unknown) =>
    typeof p === 'string' ? p : [(p as { headline?: string }).headline, ...((p as { detail?: string[] }).detail ?? [])].join(' '),
  ).join(' ')

  if (!pos) { orphaned.push(`${key}  (no approved position — the grouping shows content nothing backs)`); continue }

  const a = words(groupText), b = words(pos.text)
  let shared = 0
  for (const w of a) if (b.has(w)) shared++
  const overlap = a.size ? shared / a.size : 0

  if (overlap < 0.15) {
    drifted.push(`${key}\n      overlap ${(overlap * 100).toFixed(0)}%\n      live stance : ${pos.stance.slice(0, 74)}\n      grouping    : ${groupText.slice(0, 74)}`)
  } else ok++
}

console.log(`${PROPOSAL_GROUPINGS.length} groupings checked against ${live.size} approved positions\n`)
console.log(`  consistent : ${ok}`)
console.log(`  DRIFTED    : ${drifted.length}   (grouping describes something else)`)
console.log(`  orphaned   : ${orphaned.length}   (no approved position at all)`)
if (drifted.length) { console.log('\n── DRIFTED ──'); drifted.forEach((d) => console.log('  ' + d + '\n')) }
if (orphaned.length) { console.log('── ORPHANED ──'); orphaned.forEach((o) => console.log('  ' + o)) }
process.exit(drifted.length || orphaned.length ? 1 : 0)
