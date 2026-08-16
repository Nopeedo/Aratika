/**
 * /api/push/test — send a test push to the signed-in user's OWN devices only.
 * Lets someone confirm notifications work end-to-end after subscribing. Safe:
 * it can only ever notify the caller (userId from their session), never anyone
 * else. Login required.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushToUser, isPushConfigured } from '@/lib/notifications/web-push'

export const runtime = 'nodejs'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'auth' }, { status: 401 })
  if (!isPushConfigured()) return NextResponse.json({ error: 'not_configured', message: 'Push isn’t configured on the server.' }, { status: 503 })

  const { sent } = await sendPushToUser(user.id, {
    title: 'Arapono',
    body: '🔔 Notifications are working — this is a test.',
    // The route already 401s anyone not signed in, so this can only ever be
    // tapped by someone with a dashboard — send them to it rather than to the
    // public page explaining what a command centre is.
    url: '/dashboard',
    tag: 'arapono-test',
  })
  return NextResponse.json({ ok: true, sent })
}
