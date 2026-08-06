/**
 * /api/push/subscribe — store or remove a Web Push subscription for the signed-in
 * user. Login required. RLS guarantees a user only ever touches their own rows.
 *  POST   { subscription: PushSubscriptionJSON, userAgent? } → save + push_enabled=true
 *  DELETE ?endpoint=<endpoint>                               → remove that device
 * Resilient if the tables aren't created yet (degrades quietly).
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'auth', message: 'Sign in to turn on notifications.' }, { status: 401 })

  let body: { subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }; userAgent?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }

  const sub = body.subscription
  const endpoint = typeof sub?.endpoint === 'string' ? sub.endpoint : ''
  const p256dh = typeof sub?.keys?.p256dh === 'string' ? sub.keys.p256dh : ''
  const auth = typeof sub?.keys?.auth === 'string' ? sub.keys.auth : ''
  if (!endpoint || !p256dh || !auth) return NextResponse.json({ error: 'bad_request', message: 'Invalid subscription.' }, { status: 400 })

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { user_id: user.id, endpoint, p256dh, auth, user_agent: typeof body.userAgent === 'string' ? body.userAgent.slice(0, 300) : null, last_seen: new Date().toISOString() },
      { onConflict: 'endpoint' },
    )
  if (error) return NextResponse.json({ error: 'insert_failed', message: error.message }, { status: 500 })

  // Flip the master push toggle on (create the prefs row if absent).
  await supabase.from('notification_prefs').upsert({ user_id: user.id, push_enabled: true, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'auth' }, { status: 401 })

  const endpoint = new URL(req.url).searchParams.get('endpoint')
  if (!endpoint) return NextResponse.json({ error: 'bad_request' }, { status: 400 })

  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  if (error) return NextResponse.json({ error: 'delete_failed', message: error.message }, { status: 500 })

  // If this was their last device, flip the master toggle off.
  const { count } = await supabase.from('push_subscriptions').select('id', { count: 'exact', head: true })
  if ((count ?? 0) === 0) {
    await supabase.from('notification_prefs').upsert({ user_id: user.id, push_enabled: false, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  }
  return NextResponse.json({ ok: true })
}
