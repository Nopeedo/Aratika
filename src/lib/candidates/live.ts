/**
 * candidates/live.ts — editor-approved 2026 candidates for an electorate.
 *
 * Fed by scripts/ingest-candidates.mjs (weekly scrape of announced candidates,
 * staged as pending) + the /editor gate: only status='approved' items ever
 * reach a battleground page. Curated entries in candidates-2026.ts always win
 * over these (richer profiles), and the sitting MP is excluded — the battle
 * page renders the incumbent separately as "the defender", and Wikipedia lists
 * incumbents as candidates too, which would double them up.
 *
 * Items whose party label couldn't be mapped to a known PartySlug are skipped
 * here (never mislabelled); they stay visible in /editor until the ingest's
 * PARTY_MAP learns their label.
 */

import { createClient } from '@/lib/supabase/server'
import type { Candidate2026 } from '@/constants/candidates-2026'
import { PARTY_NAMES } from '@/constants/parties'
import { PARTY_PROFILES } from '@/constants/parties-data'
import { MP_PROFILES } from '@/constants/mps-data'
import type { PartySlug } from '@/types'

interface CandidateRow {
  electorateSlug?: string
  name?: string
  party?: string | null
  notes?: string
  citations?: unknown[]
  /** Written only by scripts/mark-withdrawn.mjs, and only with a citation. */
  withdrawn?: { date?: string; source?: string }
}

/**
 * PARTY_PROFILES as well as PARTY_NAMES.
 *
 * PARTY_NAMES holds eight slugs: the six in Parliament, TOP, and independent.
 * Everything else was dropped here silently — including Animal Justice, ALCP,
 * NZ Outdoors and Vision NZ, which have full profiles on this site and tiles on
 * /parties. Audited 23 August 2026: 30 of 321 approved candidates never reached
 * a page, and 23 of 72 seats showed an incomplete field with no sign anyone was
 * missing. Sue Grey in West Coast-Tasman, Hannah Tamaki in Papakura and Maki
 * Herbert in Te Tai Tokerau were all invisible on the seats they are contesting.
 *
 * That contradicted /party-inclusion, which states inclusion is by registration
 * rather than polling. The rule held on the parties page and broke here.
 *
 * Still dropped, deliberately: labels the ingest could not map to any party we
 * profile — Alliance, New Conservative, Te Tai Tokerau Party, Build the Nation.
 * Those need checking against the Electoral Commission register before they
 * appear, since the rule is about REGISTERED parties. "New Conservative" is not
 * obviously the same entity as the profiled "Conservative Party NZ", and
 * guessing is how a candidate gets mislabelled.
 */
const isKnownParty = (p: unknown): p is PartySlug | 'independent' =>
  p === 'independent' || (typeof p === 'string' && (p in PARTY_NAMES || p in PARTY_PROFILES))

// 82 of the announced candidates are sitting MPs (list MPs contesting seats,
// MPs switching electorates). Matching them to their profile wires up the
// freely-licensed portrait we already hold — the card renders it via mpSlug.
const MP_BY_NAME = new Map(Object.values(MP_PROFILES).map((mp) => [mp.name.toLowerCase(), mp.slug]))

export async function getApprovedCandidates(electorateSlug: string, opts?: { excludeName?: string }): Promise<Candidate2026[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_items')
    .select('source_id, data')
    .eq('type', 'candidate')
    .eq('status', 'approved')
  const rows = (data ?? [])
    .map((r) => ({ key: r.source_id as string | null, d: r.data as CandidateRow }))
    .filter(({ d }) => d?.electorateSlug === electorateSlug && typeof d.name === 'string')
  const out: Candidate2026[] = []
  for (const { key, d } of rows) {
    if (!isKnownParty(d.party)) continue
    if (opts?.excludeName && d.name!.toLowerCase() === opts.excludeName.toLowerCase()) continue
    const mpSlug = MP_BY_NAME.get(d.name!.toLowerCase())
    // notes and citations were being dropped here. They are the only sourced
    // things we hold about most challengers — without them a candidate panel
    // opens onto an empty box, which is exactly how it read for 319 of the 321
    // candidates, since only two have curated profiles.
    out.push({
      name: d.name!,
      party: d.party,
      confirmed: true,
      ...(key ? { key } : {}),
      ...(mpSlug ? { mpSlug } : {}),
      ...(typeof d.notes === 'string' && d.notes.trim() ? { notes: d.notes.trim() } : {}),
      ...(Array.isArray(d.citations) && d.citations.length ? { citations: d.citations.filter((c) => typeof c === 'string') } : {}),
      // Carried through, not filtered out. A withdrawn candidate still renders,
      // marked as withdrawn — see the field's note in candidates-2026.ts.
      ...(d.withdrawn?.date && d.withdrawn?.source
        ? { withdrawn: { date: d.withdrawn.date, source: d.withdrawn.source } }
        : {}),
    })
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}
