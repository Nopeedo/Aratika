/**
 * candidate-terms.mjs — tag content with the 2026 CANDIDATES it names, not just
 * the sitting MPs.
 *
 * The gap this closes: tagMPs covers all 122 current MPs, so coverage of an
 * incumbent has always tagged correctly. Challengers were invisible. Of 321
 * candidate records, only 88 are sitting MPs — the other 233 (James Christmas in
 * Tāmaki, Max Harris in Tāmaki, every first-time candidate in every seat) could
 * not be tagged at all, and in the interview tier they were actively dropped:
 * the admission gate asks whether a clip "names someone we track", and a
 * challenger was not someone we tracked.
 *
 * That is backwards for an election. The incumbent is the one voters already
 * know something about; the challenger is who they are trying to find out
 * about, and a battleground page is exactly where that question gets asked.
 *
 * addCandidateTerms in electorate-terms.mjs already folds challenger names into
 * their SEAT's terms, which is how a challenger story reaches a battleground
 * page. This is the other half: which PERSON was named, so a race can show its
 * candidates individually rather than as one undifferentiated pile of
 * electorate news.
 *
 * Matching is plain substring on the full name, so single-word names are
 * skipped entirely — a candidate called "Harris" would match Kamala Harris, a
 * Harris Tweed feature and half the property section.
 */

/** Fold macrons so "Tāmaki" matches "Tamaki" and vice versa. */
const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

/**
 * Names that are also ordinary words or the names of far more famous people.
 * A substring match on these is wrong more often than right, and a wrong
 * candidate tag on a battleground page is worse than a missing one — it puts a
 * person's name against a story that has nothing to do with them.
 */
const AMBIGUOUS = new Set([
  'john key', 'jacinda ardern',
])

/**
 * @param {object} sb Supabase client (service role).
 * @returns {Promise<{terms: Record<string,string[]>, meta: Record<string,object>}>}
 *   terms: candidate key -> lowercase name variants
 *   meta:  candidate key -> { name, electorate, electorateSlug, party, partyLabel }
 */
export async function buildCandidateTerms(sb) {
  const { data, error } = await sb
    .from('content_items')
    .select('source_id, data')
    .eq('type', 'candidate')
    .in('status', ['pending', 'approved'])
  if (error) { console.warn('candidate terms unavailable: ' + error.message); return { terms: {}, meta: {} } }

  const terms = {}
  const meta = {}
  let skippedSingle = 0, skippedAmbiguous = 0
  for (const r of data || []) {
    const d = r.data || {}
    const name = String(d.name || '').trim()
    if (!name || !name.includes(' ')) { if (name) skippedSingle++; continue }
    const lower = name.toLowerCase()
    if (AMBIGUOUS.has(lower)) { skippedAmbiguous++; continue }

    // Key on the ingest's own source_id (cand:<seat>|<name>) so a candidate tag
    // joins straight back to the record it came from, citations and all.
    const key = r.source_id || `cand:${d.electorateSlug || '?'}|${lower.replace(/\s+/g, '-')}`
    const variants = new Set([lower])
    if (strip(lower) !== lower) variants.add(strip(lower))
    terms[key] = [...variants]
    meta[key] = {
      name,
      electorate: d.electorate || null,
      electorateSlug: d.electorateSlug || null,
      party: d.party || null,
      partyLabel: d.partyLabel || null,
    }
  }
  const note = [
    skippedSingle && `${skippedSingle} single-word name(s) skipped`,
    skippedAmbiguous && `${skippedAmbiguous} ambiguous skipped`,
  ].filter(Boolean).join(', ')
  console.log(`Candidate tagging: ${Object.keys(terms).length} candidates${note ? ` (${note})` : ''}`)
  return { terms, meta }
}

/** Candidate keys named in the text. */
export function tagCandidates(text, terms) {
  const t = String(text || '').toLowerCase()
  return Object.keys(terms).filter((k) => terms[k].some((v) => t.includes(v)))
}
