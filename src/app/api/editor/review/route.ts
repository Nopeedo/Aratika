/**
 * POST /api/editor/review — an editor approves/rejects a pending content item,
 * optionally editing the neutral summary first. Editor-only (enforced by both
 * the membership check here and RLS on content_items).
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEditor } from '@/lib/editor/auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { user, isEditor } = await getEditor()
  if (!user) return NextResponse.json({ error: 'auth' }, { status: 401 })
  if (!isEditor) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  let body: { id?: unknown; ids?: unknown; action?: unknown; summary?: unknown; summaryBasic?: unknown; notes?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }

  const action = body.action === 'approve' || body.action === 'reject' ? body.action : null
  if (!action) return NextResponse.json({ error: 'bad_request' }, { status: 400 })

  const supabase = await createClient()

  // ── Bulk action: approve/reject many at once (no per-item summary edits) ──
  if (Array.isArray(body.ids)) {
    const ids = body.ids.filter((x): x is string => typeof x === 'string').slice(0, 500)
    if (ids.length === 0) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
    const { error, count } = await supabase.from('content_items').update({
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_by: user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      ...(typeof body.notes === 'string' ? { editor_notes: body.notes.slice(0, 2000) } : {}),
    }, { count: 'exact' }).in('id', ids).eq('status', 'pending')
    if (error) return NextResponse.json({ error: 'update_failed', message: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, updated: count ?? ids.length })
  }

  const id = typeof body.id === 'string' ? body.id : null
  if (!id) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const update: Record<string, unknown> = {
    status: action === 'approve' ? 'approved' : 'rejected',
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  if (typeof body.summary === 'string') update.summary = body.summary.slice(0, 4000)
  if (typeof body.notes === 'string') update.editor_notes = body.notes.slice(0, 2000)

  // Persist an edited basic (plain) summary into data without clobbering other keys.
  if (typeof body.summaryBasic === 'string') {
    const { data: row } = await supabase.from('content_items').select('data').eq('id', id).maybeSingle()
    const existing = (row?.data as Record<string, unknown>) ?? {}
    update.data = { ...existing, summaryBasic: body.summaryBasic.slice(0, 4000) }
  }

  const { error } = await supabase.from('content_items').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: 'update_failed', message: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
