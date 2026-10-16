/**
 * repoint-tttp-housing.mjs — point Te Tai Tokerau Party's housing position at
 * the policy, not at the homepage.
 *
 * WHAT WAS WRONG. content_items 25710467 was scraped from the party's HOME page
 * and captured the three bullets under their candidate's "what she is standing
 * for" block. It never reached /our-policies/, where the actual housing policy
 * lives: Mana Taumaru, the Local Build Policy, under Pillar Two — Whare. The row
 * is not false, it is about a fifth of the policy, and it omits the mechanism
 * entirely — hemp-lime panels, a regional trade academy, a papakāinga rollout.
 *
 * The housing film was built from the full page, so the site and the film
 * currently disagree about what this party's housing policy is. This closes
 * that.
 *
 * EVERY QUOTE AND EXCERPT BELOW IS VERBATIM from
 * tetaitokerauparty.org.nz/our-policies, checked 15 October 2026. The series
 * has been bitten before by AI-written text presented as a party's own words,
 * so nothing here is paraphrased into quotation marks.
 *
 * Run: node scripts/repoint-tttp-housing.mjs            (report only)
 *      node scripts/repoint-tttp-housing.mjs --apply
 */
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })
const APPLY = process.argv.includes('--apply')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } })

const URL = 'https://tetaitokerauparty.org.nz/our-policies/'

/** Verbatim from the Mana Taumaru section. */
const QUOTE =
  'The Mana Taumaru Local Build Policy uses agricultural products from our industrial hemp industry to train local rangatahi to manufacture certified building panels and construct highly insulated, fireproof, mould-free homes for our people.'

const EXCERPTS = [
  'Generations of our families are trapped in overcrowded, uninsulated, damp houses — leading to some of the highest rates of preventable rheumatic fever and respiratory illness in the developed world.',
  'The current building model relies on expensive imported materials and corporate supply chains.',
  'The Rohe Construction Academy: a fully funded, practical trade academy in Te Tai Tokerau employing young locals — particularly those transitioning off government assistance — at a living wage while they learn certified skills in masonry, eco-engineering, and advanced construction.',
  'Local Material Manufacturing: regional processing facilities mixing agricultural hemp hurd with local lime binders to create high-spec, carbon-negative, Building Code compliant panels.',
  'The Papakāinga and Social Rollout: homes built on ancestral land and community papakāinga blocks, allocated first to families in overcrowded conditions or substandard rentals — bypassing commercial developers.',
  'Sovereign Energy and Warmth: every home where an elder is the primary occupant prioritised for fully funded solar panel installations and battery storage, integrated into community-managed grids guaranteeing zero-cost baseline electricity for heating, cooling, and medical devices.',
]

const KEY_PROPOSALS = [
  'Manufacture building panels regionally from industrial hemp hurd and local lime, rather than imported materials',
  'Fund a practical trade academy in Te Tai Tokerau training local rangatahi on a living wage while they qualify',
  'Build the homes on ancestral land and community papakāinga blocks, bypassing commercial developers',
  'Allocate first to families in overcrowded conditions or substandard rentals',
  'Prioritise homes with a kaumātua as primary occupant for funded solar panels and battery storage',
]

const SUMMARY =
  'Te Tai Tokerau Party’s housing policy is Mana Taumaru, the Local Build Policy, under its Whare pillar, and it is written for the Te Tai Tokerau region rather than nationally. The party says generations of families are in overcrowded, uninsulated and damp houses, with some of the highest rates of preventable rheumatic fever and respiratory illness in the developed world, and that the current building model depends on expensive imported materials and corporate supply chains. Its answer is a local supply chain: regional facilities mixing industrial hemp hurd with local lime into building panels the party describes as carbon-negative and Building Code compliant; a fully funded trade academy in the region training local rangatahi on a living wage; and homes built on ancestral land and community papakāinga blocks, allocated first to families in overcrowded conditions or substandard rentals. Alongside it, the Mana Kaumātua policy would prioritise homes with an elder as primary occupant for funded solar panels and battery storage.'

const SUMMARY_BASIC =
  'Te Tai Tokerau Party wants to make building materials locally out of hemp instead of importing them, train local young people at a funded trade academy to make the panels and build the homes, and put those homes on ancestral land and papakāinga blocks — going first to families living in overcrowded or substandard housing. Homes with an elder living in them would also get funded solar panels and batteries. The policy is for the Te Tai Tokerau region.'

const rows = []
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from('content_items')
    .select('id,title,status,summary,source_url,data').eq('type', 'position').order('id').range(f, f + 999)
  if (error) { console.error(error.message); process.exit(1) }
  rows.push(...(data || []))
  if (!data || data.length < 1000) break
}

const row = rows.find((r) =>
  r.data?.party === 'te-tai-tokerau-party' && r.data?.topic === 'housing' && r.data?.period === '2026')
if (!row) { console.error('no current Te Tai Tokerau housing position found'); process.exit(1) }

console.log(`row      ${row.id}  (${row.status})`)
console.log(`title    ${row.title}\n`)
console.log('── source_url ──')
console.log(`  from   ${row.source_url}`)
console.log(`  to     ${URL}\n`)
console.log('── quote ──')
console.log(`  from   ${String(row.data?.quote).slice(0, 110)}…`)
console.log(`  to     ${QUOTE.slice(0, 110)}…\n`)
console.log(`── keyProposals ──  ${(row.data?.keyProposals || []).length} -> ${KEY_PROPOSALS.length}`)
for (const p of row.data?.keyProposals || []) console.log(`  -  ${p}`)
for (const p of KEY_PROPOSALS) console.log(`  +  ${p}`)
console.log(`\n── excerpts ──  ${(row.data?.excerpts || []).length} -> ${EXCERPTS.length}  (all verbatim)`)
console.log(`── summary ──  ${String(row.summary || '').length} -> ${SUMMARY.length} chars`)
console.log(`\nasOf stays ${row.data?.asOf}; status stays ${row.status}; the explainer film attachment is preserved.`)

if (!APPLY) { console.log('\n(report only — pass --apply to write)'); process.exit(0) }

const data = {
  ...row.data,
  quote: QUOTE,
  excerpts: EXCERPTS,
  excerptSources: EXCERPTS.map(() => URL),
  keyProposals: KEY_PROPOSALS,
  summaryBasic: SUMMARY_BASIC,
  sourceUrls: [URL],
  source_label: 'Te Tai Tokerau Party — Our Policies (Whare)',
  stance: 'Build locally from hemp, trained locally, on ancestral land in Te Tai Tokerau',
}
const { error } = await sb.from('content_items')
  .update({ summary: SUMMARY, source_url: URL, data }).eq('id', row.id)
if (error) { console.error(error.message); process.exit(1) }
console.log('\n✓ repointed to the policy page')
