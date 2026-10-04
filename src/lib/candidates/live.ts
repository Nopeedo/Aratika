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

import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
// publicClient, not the cookie-bound server client: approved candidates are
// public content, and touching cookies would opt every consuming route out of
// static rendering — the same reason bills/live.ts and news/live.ts read this way.
import { publicClient } from '@/lib/supabase/public'
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

/**
 * Every approved candidate, grouped by electorate slug, in one read.
 *
 * getApprovedCandidates() below fetches the WHOLE candidate table and then
 * filters it in JS for one seat — which is correct for a seat page and wrong
 * for a map, where any of 72 seats can be opened. Calling it per seat would
 * mean 72 identical reads of the same ~200 KB for one filter each.
 *
 * The map is a client component and cannot await anything, so this is read once
 * on the server and handed down as a prop. Cached for a minute like the other
 * public reads: candidates are approved by hand in /editor.
 *
 * NOT every seat is in the result. 361 approved candidates cover 59 of 72
 * electorates, so a lookup returning undefined is the normal state for thirteen
 * seats, and the caller has to say "none recorded yet" rather than render an
 * empty list — an empty box reads as "nobody is standing", which is false.
 */
export const getApprovedCandidatesBySlug = unstable_cache(
  async (): Promise<Record<string, Candidate2026[]>> => {
    const supabase = publicClient()
    const { data } = await supabase
      .from('content_items')
      .select('source_id, data')
      .eq('type', 'candidate')
      .eq('status', 'approved')
    const out: Record<string, Candidate2026[]> = {}
    for (const r of data ?? []) {
      const d = r.data as CandidateRow
      if (!d?.electorateSlug || typeof d.name !== 'string' || !isKnownParty(d.party)) continue
      const mpSlug = MP_BY_NAME.get(d.name.toLowerCase())
      ;(out[d.electorateSlug] ||= []).push({
        name: d.name,
        party: d.party,
        confirmed: true,
        ...(r.source_id ? { key: r.source_id as string } : {}),
        ...(mpSlug ? { mpSlug } : {}),
        // notes and citations, carried here too now. The map's candidate rows
        // open a preview, and for a challenger who isn't a sitting MP these
        // two are the only sourced things we hold — without them the preview
        // would be a name and a party. Same fields getApprovedCandidates()
        // below already carries, for the same reason.
        ...(typeof d.notes === 'string' && d.notes.trim() ? { notes: d.notes.trim() } : {}),
        ...(Array.isArray(d.citations) && d.citations.length ? { citations: d.citations.filter((c): c is string => typeof c === 'string') } : {}),
        ...(d.withdrawn?.date && d.withdrawn?.source
          ? { withdrawn: { date: d.withdrawn.date, source: d.withdrawn.source } }
          : {}),
      })
    }
    for (const list of Object.values(out)) list.sort((a, b) => a.name.localeCompare(b.name))
    return out
  },
  ['approved-candidates-by-slug'],
  { revalidate: 60, tags: ['candidates'] },
)

export async function getApprovedCandidates(electorateSlug: string, opts?: { excludeName?: string }): Promise<Candidate2026[]> {
  // Read through the CACHED sibling rather than querying again.
  //
  // This used to call `await createClient()`, which touches cookies() — and a
  // cookie read anywhere in the tree opts the whole route out of static
  // rendering. That is why all 72 /battlegrounds/[electorate] pages were
  // rendering dynamically despite generateStaticParams() returning every slug:
  // zero .html files in the build, while 123 /mps/*.html sat beside them. It is
  // the exact failure lib/supabase/public.ts exists to prevent, and it was
  // documented 100 lines above this function.
  //
  // It also pulled the ENTIRE 372-row approved-candidate table on every
  // request — no electorate filter, no limit — and threw away 71/72 of it.
  // Measured at 32,268 bytes gzipped per request.
  //
  // getApprovedCandidatesBySlug already returns this exact shape, grouped, and
  // is cached. One read now serves every seat.
  const bySlug = await getApprovedCandidatesBySlug()
  const rows = (bySlug[electorateSlug] ?? []).map((c) => ({ key: c.key ?? null, d: c as unknown as CandidateRow }))
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
