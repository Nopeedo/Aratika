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
  }
}

/** Approved polls, newest first. Falls back to the bundled set if none entered. */
export async function getPolls(): Promise<Poll[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_items')
    .select('data, source_url')
    .eq('type', 'poll')
    .eq('status', 'approved')
    .limit(50)
  const polls = (data as Row[] | null ?? []).map(toPoll).filter((p): p is Poll => !!p)
  if (polls.length === 0) return RECENT_POLLS
  return polls.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
}

/** "As at" label — the most recent poll's date, formatted, or '' if unknown. */
export function pollsAsAt(polls: Poll[]): string {
  const latest = polls.map((p) => p.date).filter(Boolean).sort().pop()
  if (!latest) return ''
  const dt = new Date(`${latest}T00:00:00Z`)
  if (isNaN(dt.getTime())) return latest
  return dt.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}
