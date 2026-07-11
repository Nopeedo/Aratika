/**
 * /api/editor/polls — editors add, update or remove a published poll.
 *
 * Polls are stored as content_items type='poll'. Editors have no INSERT/DELETE
 * policy on content_items (only the ingest service role writes), so — after
 * verifying the caller is an editor — we write with the admin (service-role)
 * client, exactly like the ingest job does. Entered polls go straight to
 * status='approved' because an editor is the one entering them.
 */

import { NextResponse } from 'next/server'
import { getEditor } from '@/lib/editor/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { POLL_PARTIES } from '@/constants/polls-data'

export const runtime = 'nodejs'

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export async function POST(req: Request) {
  const { user, isEditor } = await getEditor()
  if (!user) return NextResponse.json({ error: 'auth' }, { status: 401 })
  if (!isEditor) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  let body: { pollster?: unknown; fieldwork?: unknown; date?: unknown; sourceUrl?: unknown; parties?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }

  const pollster = typeof body.pollster === 'string' ? body.pollster.trim().slice(0, 120) : ''
  const fieldwork = typeof body.fieldwork === 'string' ? body.fieldwork.trim().slice(0, 120) : ''
  const date = typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : ''
  const sourceUrl = typeof body.sourceUrl === 'string' ? body.sourceUrl.trim().slice(0, 500) : ''
  if (!pollster || !date) return NextResponse.json({ error: 'missing_fields', message: 'Pollster and date are required.' }, { status: 400 })

  // Keep only known party slugs with sane numeric values.
  const raw = (body.parties && typeof body.parties === 'object' ? body.parties : {}) as Record<string, unknown>
  const parties: Record<string, number> = {}
  for (const p of POLL_PARTIES) {
    const v = raw[p]
    if (typeof v === 'number' && isFinite(v) && v >= 0 && v <= 100) parties[p] = Math.round(v * 10) / 10
  }
  if (Object.keys(parties).length === 0) return NextResponse.json({ error: 'no_numbers', message: 'Enter at least one party percentage.' }, { status: 400 })

  const source_id = `poll:${slug(pollster)}:${date}`
  const admin = createAdminClient()
  const { error } = await admin.from('content_items').upsert({
    type: 'poll',
    source_id,
    title: `${pollster} — ${fieldwork || date}`,
    status: 'approved',
    source_url: sourceUrl || null,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    data: { pollster, fieldwork, date, sourceUrl, parties },
  }, { onConflict: 'type,source_id' })

  if (error) return NextResponse.json({ error: 'write_failed', message: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, source_id })
}

export async function DELETE(req: Request) {
  const { user, isEditor } = await getEditor()
  if (!user) return NextResponse.json({ error: 'auth' }, { status: 401 })
  if (!isEditor) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  let body: { id?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const id = typeof body.id === 'string' ? body.id : null
  if (!id) return NextResponse.json({ error: 'bad_request' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('content_items').delete().eq('id', id).eq('type', 'poll')
  if (error) return NextResponse.json({ error: 'delete_failed', message: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
