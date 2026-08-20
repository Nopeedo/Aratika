/**
 * /api/notifications — the in-app inbox.
 *
 *  GET  ?limit=&before=   → this user's notifications, newest first, + unread count
 *  POST { ids: [...] }    → mark those read
 *  POST { all: true }     → mark everything read
 *
 * The rows have existed since migration 0010 with a select policy and the
 * comment "future in-app inbox"; nothing ever read them. Push was the only
 * delivery, so a missed notification was gone for good.
 *
 * Login required. RLS restricts every query to the caller's own rows, and a
 * trigger (0013) rejects any update that touches a column other than read_at, so
 * this route cannot be used to rewrite a notification's title or destination.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const MAX_LIMIT = 100

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ notifications: [], unread: 0 })

  const url = new URL(req.url)
  const limitRaw = Number(url.searchParams.get('limit'))
  // Number('') is 0 and 0 || 30 is 30 — but an explicit ?limit=0 should not
  // silently become 30. Same trap that spent 4000 YouTube quota units.
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, MAX_LIMIT) : 30
  const before = url.searchParams.get('before')

  let q = supabase
    .from('notification_queue')
    .select('id, urgency, category, title, body, url, created_at, read_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (before) q = q.lt('created_at', before)

  const [{ data, error }, { count }] = await Promise.all([
    q,
    supabase
      .from('notification_queue')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null),
  ])
  // Degrade quietly if the migration has not been applied yet — an inbox that
  // 500s is worse than an inbox that is briefly empty.
  if (error) return NextResponse.json({ notifications: [], unread: 0 })
  return NextResponse.json({ notifications: data ?? [], unread: count ?? 0 })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'auth' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }

  const now = new Date().toISOString()
  let q = supabase.from('notification_queue').update({ read_at: now }).is('read_at', null)

  if (body.all === true) {
    // Everything currently unread. RLS scopes it to this user.
  } else if (Array.isArray(body.ids) && body.ids.length > 0) {
    const ids = body.ids.filter((x): x is string => typeof x === 'string').slice(0, MAX_LIMIT)
    if (ids.length === 0) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
    q = q.in('id', ids)
  } else {
    return NextResponse.json({ error: 'bad_request', message: 'Pass ids[] or all:true.' }, { status: 400 })
  }

  const { error } = await q
  if (error) return NextResponse.json({ error: 'write_failed', message: error.message }, { status: 500 })

  const { count } = await supabase
    .from('notification_queue')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null)
  return NextResponse.json({ ok: true, unread: count ?? 0 })
}
