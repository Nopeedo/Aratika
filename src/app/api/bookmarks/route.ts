/**
 * /api/bookmarks — the user's command centre store.
 *  GET                                   → all of the signed-in user's bookmarks
 *  POST  { kind, refId, label, sublabel?, href?, accent? }
 *                                        → save a bookmark (idempotent upsert)
 *  DELETE ?kind=<kind>&ref=<refId>       → remove a bookmark
 *
 * Login required; free in every phase. RLS guarantees users only ever
 * see/touch their own rows. Resilient if the table hasn't been created yet.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const KINDS = ['mp', 'party', 'electorate', 'policy']

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ bookmarks: [] })

  const { data, error } = await supabase
    .from('bookmarks')
    .select('id, kind, ref_id, label, sublabel, href, accent, created_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ bookmarks: [] }) // table missing / offline — degrade quietly
  return NextResponse.json({ bookmarks: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'auth', message: 'Sign in to save bookmarks.' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }

  const kind = typeof body.kind === 'string' && KINDS.includes(body.kind) ? body.kind : null
  const refId = typeof body.refId === 'string' ? body.refId.trim().slice(0, 200) : ''
  const label = typeof body.label === 'string' ? body.label.trim().slice(0, 200) : ''
  if (!kind || !refId || !label) return NextResponse.json({ error: 'bad_request', message: 'Missing bookmark details.' }, { status: 400 })

  const row = {
    user_id: user.id,
    kind,
    ref_id: refId,
    label,
    sublabel: typeof body.sublabel === 'string' ? body.sublabel.slice(0, 200) : null,
    href: typeof body.href === 'string' ? body.href.slice(0, 300) : null,
    accent: typeof body.accent === 'string' ? body.accent.slice(0, 32) : null,
  }
  const { data, error } = await supabase
    .from('bookmarks')
    .upsert(row, { onConflict: 'user_id,kind,ref_id' })
    .select('id, kind, ref_id, label, sublabel, href, accent, created_at')
    .single()
  if (error) return NextResponse.json({ error: 'insert_failed', message: error.message }, { status: 500 })
  return NextResponse.json({ bookmark: data })
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'auth', message: 'Sign in first.' }, { status: 401 })

  const params = new URL(req.url).searchParams
  const kind = params.get('kind')
  const ref = params.get('ref')
  if (!kind || !ref) return NextResponse.json({ error: 'bad_request' }, { status: 400 })

  const { error } = await supabase.from('bookmarks').delete().eq('kind', kind).eq('ref_id', ref)
  if (error) return NextResponse.json({ error: 'delete_failed', message: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
