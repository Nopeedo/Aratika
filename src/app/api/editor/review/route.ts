/**
 * POST /api/editor/review — an editor approves/rejects a pending content item,
 * optionally editing the neutral summary first. Editor-only (enforced by both
 * the membership check here and RLS on content_items).
 *
 * Two kinds of item come through here:
 *
 *  - A PENDING row (status='pending'): a new item that is not on the site.
 *    Approve flips it to 'approved'; reject to 'rejected'.
 *
 *  - A PROPOSAL (`proposal: true`): a LIVE position (status='approved') that
 *    carries a re-draft under data.proposed. The row stays approved either way.
 *    Approve promotes the proposal into the live fields; reject discards it and
 *    baselines the page hashes so the same state is not proposed again. The
 *    promote/reject logic lives in src/lib/positions/proposal.ts, shared with
 *    scripts/publish-proposals.mjs, so the button and the script agree.
 *
 * Every write is guarded on the status it expects and checked for a matched
 * row. "ok: true" here means a row changed, not that no error was thrown — a
 * review that matched nothing (someone else got there first) is a 409.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEditor } from '@/lib/editor/auth'
import { getProposal, promoteProposal, rejectProposal, type PositionRow } from '@/lib/positions/proposal'

export const runtime = 'nodejs'

type Db = Awaited<ReturnType<typeof createClient>>
type Action = 'approve' | 'reject'
type Outcome = { ok: true } | { ok: false; error: string; status: number }

/** Only a note the editor actually typed is stored; an empty field must not
 *  blank a note left on the row by an earlier review. */
const noteOf = (v: unknown) => (typeof v === 'string' && v.trim() ? { editor_notes: v.slice(0, 2000) } : {})

/** Apply approve/reject to ONE row that carries a proposal. */
async function reviewProposal(supabase: Db, id: string, action: Action, by: string, overrides: { summary?: string; summaryBasic?: string }, notes: unknown): Promise<Outcome> {
  const { data: row, error: readErr } = await supabase.from('content_items').select('title, summary, source_url, data, status').eq('id', id).eq('status', 'approved').maybeSingle()
  if (readErr) return { ok: false, error: readErr.message, status: 500 }
  if (!row || !getProposal(row.data as PositionRow['data'])) return { ok: false, error: 'no_proposal', status: 409 }
  const now = new Date().toISOString()
  // Approve is a publication: reviewed_at is what the position notifier windows
  // on to tell followers the party updated its policy. Reject is not, and must
  // not look like one.
  const update = action === 'approve'
    ? { ...promoteProposal(row as PositionRow, overrides), change_kind: 'updated', reviewed_by: by, reviewed_at: now, updated_at: now, ...noteOf(notes) }
    : { ...rejectProposal(row as PositionRow, now, by), updated_at: now, ...noteOf(notes) }
  const { data: hit, error } = await supabase.from('content_items').update(update).eq('id', id).eq('status', 'approved').select('id')
  if (error) return { ok: false, error: error.message, status: 500 }
  if (!hit?.length) return { ok: false, error: 'no_proposal', status: 409 }
  return { ok: true }
}

export async function POST(req: Request) {
  const { user, isEditor } = await getEditor()
  if (!user) return NextResponse.json({ error: 'auth' }, { status: 401 })
  if (!isEditor) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  let body: { id?: unknown; ids?: unknown; action?: unknown; summary?: unknown; summaryBasic?: unknown; notes?: unknown; proposal?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }

  const action: Action | null = body.action === 'approve' || body.action === 'reject' ? body.action : null
  if (!action) return NextResponse.json({ error: 'bad_request' }, { status: 400 })

  const supabase = await createClient()

  // ── Bulk action: approve/reject many at once (no per-item summary edits) ──
  if (Array.isArray(body.ids)) {
    const ids = [...new Set(body.ids.filter((x): x is string => typeof x === 'string'))].slice(0, 500)
    if (ids.length === 0) return NextResponse.json({ error: 'bad_request' }, { status: 400 })

    // The queue mixes pending rows with live rows carrying proposals, and a
    // bulk selection can hold both. Proposals are handled one by one (each is
    // a promote of that row's own data); the rest go through the single update
    // that was always here, filtered on status='pending' so a live row can
    // never be flipped to 'rejected' by a stray id. If the lookup itself fails
    // nothing is written: guessing which ids are proposals is how proposals
    // silently fall through to the pending path and vanish from the queue.
    const { data: withProposals, error: lookupErr } = await supabase.from('content_items').select('id').in('id', ids).eq('status', 'approved').not('data->proposed', 'is', null)
    if (lookupErr) return NextResponse.json({ error: 'update_failed', message: lookupErr.message, updated: 0 }, { status: 500 })
    const proposalIds = new Set((withProposals ?? []).map((r) => r.id as string))
    let updated = 0
    const failures: string[] = []
    for (const id of ids) {
      if (!proposalIds.has(id)) continue
      const r = await reviewProposal(supabase, id, action, user.id, {}, body.notes)
      if (r.ok) updated++; else failures.push(`${id}: ${r.error}`)
    }
    const rest = ids.filter((id) => !proposalIds.has(id))
    if (rest.length) {
      const { error, count } = await supabase.from('content_items').update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        ...noteOf(body.notes),
      }, { count: 'exact' }).in('id', rest).eq('status', 'pending')
      if (error) return NextResponse.json({ error: 'update_failed', message: error.message, updated }, { status: 500 })
      updated += count ?? 0
    }
    if (failures.length) return NextResponse.json({ error: 'partial', message: `${failures.length} proposal(s) failed: ${failures.join('; ')}`, updated }, { status: 500 })
    return NextResponse.json({ ok: true, updated })
  }

  const id = typeof body.id === 'string' ? body.id : null
  if (!id) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const summary = typeof body.summary === 'string' ? body.summary.slice(0, 4000) : undefined
  const summaryBasic = typeof body.summaryBasic === 'string' ? body.summaryBasic.slice(0, 4000) : undefined

  // ── A proposed update to a live position ──
  if (body.proposal === true) {
    const r = await reviewProposal(supabase, id, action, user.id, { summary, summaryBasic }, body.notes)
    if (!r.ok) return NextResponse.json({ error: r.error === 'no_proposal' ? 'no_proposal' : 'update_failed', message: r.error }, { status: r.status })
    return NextResponse.json({ ok: true })
  }

  const update: Record<string, unknown> = {
    status: action === 'approve' ? 'approved' : 'rejected',
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...noteOf(body.notes),
  }
  if (summary !== undefined) update.summary = summary

  // Persist an edited basic (plain) summary into data without clobbering other keys.
  if (summaryBasic !== undefined) {
    const { data: row } = await supabase.from('content_items').select('data').eq('id', id).maybeSingle()
    const existing = (row?.data as Record<string, unknown>) ?? {}
    update.data = { ...existing, summaryBasic }
  }

  // Never let the plain path touch a live row: that is exactly the write that
  // used to take positions off the site. A live row is reviewed only as a
  // proposal, above. And a match on nothing is reported, not swallowed — the
  // row was published or reviewed by someone else while this editor read it.
  const { data: hit, error } = await supabase.from('content_items').update(update).eq('id', id).eq('status', 'pending').select('id')
  if (error) return NextResponse.json({ error: 'update_failed', message: error.message }, { status: 500 })
  if (!hit?.length) return NextResponse.json({ error: 'not_pending', message: 'This item is no longer pending — someone else reviewed or published it. Reload the queue.' }, { status: 409 })

  return NextResponse.json({ ok: true })
}
