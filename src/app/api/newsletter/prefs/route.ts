/**
 * /api/newsletter/prefs — turn the weekly email on or off for the signed-in user.
 *
 * The one-click link in the email (/api/newsletter/unsubscribe) has always been
 * the only way off the list. That works if you still have an email; it does not
 * if you deleted it, never got one, or simply want to check what you're signed
 * up to. This is the same switch, reachable from the dashboard.
 *
 * Upsert rather than update: notification_prefs only gets a row when someone
 * turns push on, so a user who never did that has nothing to update yet.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'auth' }, { status: 401 })

  let body: { enabled?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  if (typeof body.enabled !== 'boolean') return NextResponse.json({ error: 'bad_request' }, { status: 400 })

  const { error } = await supabase
    .from('notification_prefs')
    .upsert(
      { user_id: user.id, email_digest_enabled: body.enabled, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )
  if (error) return NextResponse.json({ error: 'save_failed', message: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, enabled: body.enabled })
}
