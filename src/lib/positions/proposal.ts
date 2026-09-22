/**
 * A PROPOSED revision to a live position.
 *
 * Until 21 Sep 2026 the drafter's answer to "this party's page changed" was to
 * rewrite the approved row in place and set status='pending'. The site renders
 * only 'approved', so every re-draft took a live position DOWN until an editor
 * re-approved it — and because the fingerprint moved for reasons that were not
 * policy changes (a page joining the set, a fetch timing out on the runner),
 * the same Labour and National positions were re-approved on 18 Sep, re-drafted
 * on 20 Sep, and dark again by the 21st.
 *
 * A proposal lives INSIDE the approved row, under data.proposed, and touches
 * nothing the site reads. The row stays approved; the live summary, stance,
 * quotes and citation stay exactly as the editor last saw them. Approving
 * promotes the proposal into those fields; rejecting discards it and records
 * the page hashes it was drafted from, so the same state is not proposed twice.
 *
 * Pure functions, no imports: this file is imported by the editor API route
 * (TypeScript, Next.js) AND by scripts/publish-proposals.mjs (plain Node, which
 * strips the type annotations natively). One implementation of "approve", so
 * the script and the button cannot drift apart.
 */

export interface ProposedRevision {
  summary: string
  source_url: string
  stance: string
  summaryBasic: string
  quote: string
  keyProposals: string[]
  framing: 'pledge' | 'record'
  whoAffected: { group: string; detail: string }[]
  excerpts: string[]
  excerptSources: string[]
  sourceUrls: string[]
  /** Per-page fingerprints of every source this revision was drafted from. */
  sourceHashes: Record<string, string>
  /** Legacy whole-set fingerprint, kept for rows that still compare on it. */
  sourceHash: string
  asOf: string
  proposedAt: string
  /** Why the drafter proposed it: which pages were new, changed or gone. */
  reason: { added: string[]; changed: string[]; removed: string[] }
  /** The material change, in the drafter's words — what the editor is deciding on. */
  what: string
  /** A WITHDRAWAL: the party's current pages no longer state a position, and
   *  the page the live text cited changed or is gone. Approving replaces the
   *  live position with "no stated position". */
  noPosition?: boolean
}

type Data = Record<string, unknown>

export interface PositionRow {
  title?: string | null
  summary: string | null
  source_url: string | null
  data: Data | null
}

export function getProposal(data: Data | null | undefined): ProposedRevision | null {
  const p = data?.proposed
  if (!p || typeof p !== 'object') return null
  const r = p as Partial<ProposedRevision>
  return typeof r.summary === 'string' && typeof r.stance === 'string' ? (r as ProposedRevision) : null
}

/** The live fields a proposal replaces. Anything in data not listed here — party,
 *  topic, period, editor notes — is carried over untouched. */
const LIVE_FIELDS = ['stance', 'summaryBasic', 'quote', 'keyProposals', 'framing', 'whoAffected', 'excerpts', 'excerptSources', 'sourceUrls', 'sourceHashes', 'sourceHash', 'asOf'] as const

export interface PromoteOverrides {
  /** An editor's edit of the proposed detailed summary, from the review form. */
  summary?: string
  /** An editor's edit of the proposed plain summary. */
  summaryBasic?: string
}

/**
 * The row as it should be once the proposal is accepted.
 *
 * Returns every column the promotion touches, including `title`: a row that was
 * "no stated position" carries that in its title and source label, and a row
 * that becomes one must say so. The caller writes these in ONE update — the
 * edited summaries used to go in a second, unchecked write after the promote,
 * and a failure there left the proposal's own text live while reporting ok.
 */
export function promoteProposal(row: PositionRow, overrides: PromoteOverrides = {}): { title?: string; summary: string; source_url: string; data: Data } {
  const proposal = getProposal(row.data)
  if (!proposal) throw new Error('no proposal on this row')
  const data: Data = { ...(row.data ?? {}) }
  delete data.proposed
  delete data.proposalRejectedAt
  delete data.proposalRejectedBy
  for (const k of LIVE_FIELDS) data[k] = proposal[k]
  const partyName = typeof data.partyName === 'string' ? data.partyName : ''
  const topicLabel = typeof data.topicLabel === 'string' ? data.topicLabel : ''
  const wasNoPosition = data.noPosition === true
  let title: string | undefined
  if (proposal.noPosition) {
    data.noPosition = true
    data.source_label = `${partyName}: official policy index`
    title = `${partyName}: ${topicLabel} (no stated position)`
  } else {
    delete data.noPosition
    if (wasNoPosition) {
      // The public label and title said "policy index" / "no stated position".
      // A position drafted from a real page is cited to that page.
      data.source_label = `${partyName}: official policy page`
      title = `${partyName}: ${topicLabel} (current policy)`
    }
  }
  data.promotedAt = proposal.proposedAt
  const summary = typeof overrides.summary === 'string' && overrides.summary.trim() ? overrides.summary : proposal.summary
  if (typeof overrides.summaryBasic === 'string' && overrides.summaryBasic.trim()) data.summaryBasic = overrides.summaryBasic
  return { ...(title ? { title } : {}), summary, source_url: proposal.source_url, data }
}

/**
 * The row once the proposal is declined. The page hashes it was drafted from are
 * recorded as the new baseline: the editor has seen this state of the party's
 * pages and said no, so it must not come back tomorrow as the same proposal.
 *
 * Deliberately returns only `data`: a rejection is not a publication, and the
 * position notifier windows on reviewed_at to tell followers a party "updated
 * its policy". Stamping that here would send a notification for a change the
 * editor just declined.
 */
export function rejectProposal(row: PositionRow, rejectedAt: string, rejectedBy?: string): { data: Data } {
  const proposal = getProposal(row.data)
  if (!proposal) throw new Error('no proposal on this row')
  const data: Data = { ...(row.data ?? {}) }
  delete data.proposed
  data.sourceHashes = proposal.sourceHashes
  data.sourceHash = proposal.sourceHash
  data.proposalRejectedAt = rejectedAt
  if (rejectedBy) data.proposalRejectedBy = rejectedBy
  return { data }
}
