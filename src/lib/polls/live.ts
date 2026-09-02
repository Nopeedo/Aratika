/**
 * Live polls — reads editor-entered `poll` items from content_items (status
 * 'approved', so RLS only ever returns reviewed rows). Falls back to the bundled
 * RECENT_POLLS when nothing has been entered yet, so the site never blanks.
 *
 * Editors add/update/remove polls at /editor/polls; the poll-of-polls average and
 * seat projection are computed from whatever this returns (see polls-data.ts).
 */

import { createClient } from '@/lib/supabase/server'
import { RECENT_POLLS, type Poll } from '@/constants/polls-data'
import type { PartySlug } from '@/types'

interface Row { data: Record<string, unknown> | null; source_url: string | null }

function toPoll(r: Row): Poll | null {
  const d = r.data ?? {}
  if (typeof d.pollster !== 'string') return null
  const parties = (d.parties && typeof d.parties === 'object' ? d.parties : {}) as Record<string, unknown>
  const clean: Partial<Record<PartySlug, number>> = {}
  for (const [k, v] of Object.entries(parties)) {
    if (typeof v === 'number' && isFinite(v)) clean[k as PartySlug] = v
  }
  return {
    pollster: d.pollster,
    fieldwork: typeof d.fieldwork === 'string' ? d.fieldwork : '',
    date: typeof d.date === 'string' ? d.date : '',
    sourceUrl: typeof d.sourceUrl === 'string' ? d.sourceUrl : (r.source_url ?? ''),
    parties: clean,
    ...(typeof d.others === 'number' && isFinite(d.others) ? { others: d.others } : {}),
  }
}

/**
 * Identity of a polling company, for "one poll per company".
 *
 * The old key was `pollster.trim().toLowerCase()`, which treats "RNZ-Reid
 * Research" and "RNZ–Reid Research" as two different companies — an ASCII
 * hyphen against an en dash, indistinguishable on screen. Both had been entered
 * at /editor/polls for the same 21 August poll, and the same happened to
 * Taxpayers' Union–Curia on 4 August. Each survived the dedupe, so the table
 * listed eight polls from six companies and the poll-of-polls averaged RNZ and
 * Curia twice. It was visible as a repeated row, but the damage was in the
 * average, where nothing looked wrong at all.
 *
 * So the key folds every dash variant to a hyphen, curly apostrophes to
 * straight, and runs of whitespace to one space. Anything that reads as the
 * same company name now counts as the same company, whichever characters an
 * editor's keyboard produced.
 */
function pollsterKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[‐-―−]/g, '-')   // ‐ ‑ ‒ – — ― and the minus sign
    .replace(/[‘’ʼ]/g, "'")    // ' ' ʼ
    .replace(/\s+/g, ' ')
    .trim()
}

/** Tie-break for two entries of the same poll: prefer the typographic dash, so
 *  the name rendered is stable rather than dependent on row order. */
function preferDisplay(candidate: string, current: string): boolean {
  const dashed = (s: string) => /[–—]/.test(s)
  return dashed(candidate) && !dashed(current)
}

/** Approved polls, newest first, ONE per pollster (their most recent). Keeps the
 *  poll-of-polls methodologically sound as polls accumulate — a prolific pollster
 *  is never double-counted, matching the bundled "latest per company" snapshot.
 *  Falls back to the bundled set if none have been entered. */
export async function getPolls(): Promise<Poll[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_items')
    .select('data, source_url')
    .eq('type', 'poll')
    .eq('status', 'approved')
    .limit(100)
  const polls = (data as Row[] | null ?? []).map(toPoll).filter((p): p is Poll => !!p)
  if (polls.length === 0) return RECENT_POLLS

  // Keep only each pollster's most recent poll.
  const latestByPollster = new Map<string, Poll>()
  for (const p of polls) {
    const key = pollsterKey(p.pollster)
    const prev = latestByPollster.get(key)
    // Strictly newer wins, so an equal-dated pair is decided by the tie-break
    // below rather than by whatever order the rows came back in.
    if (!prev) { latestByPollster.set(key, p); continue }
    const a = p.date ?? '', b = prev.date ?? ''
    if (a > b || (a === b && preferDisplay(p.pollster, prev.pollster))) latestByPollster.set(key, p)
  }
  return [...latestByPollster.values()].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
}

/** "As at" label — the most recent poll's date, formatted, or '' if unknown. */
export function pollsAsAt(polls: Poll[]): string {
  const latest = polls.map((p) => p.date).filter(Boolean).sort().pop()
  if (!latest) return ''
  const dt = new Date(`${latest}T00:00:00Z`)
  if (isNaN(dt.getTime())) return latest
  return dt.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}
