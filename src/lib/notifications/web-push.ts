/**
 * web-push helper — send a Web Push notification to a user's devices.
 *
 * Reads the user's stored subscriptions with the service-role admin client (the
 * digest/alert job sends on the system's behalf, so it must reach any user's
 * rows), sends to each, and prunes subscriptions the browser has expired
 * (404/410). No-ops cleanly if the VAPID keys aren't configured, so nothing
 * breaks in environments that haven't set them up yet.
 *
 * VAPID keys (generate once with `npx web-push generate-vapid-keys`):
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY  — the public key (safe to expose to the client)
 *   VAPID_PRIVATE_KEY             — the private key (secret; server only)
 *   VAPID_SUBJECT                 — a mailto: or https: contact (optional)
 */

import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:hello@arapono.org.nz'

export function isPushConfigured(): boolean {
  return !!(PUBLIC_KEY && PRIVATE_KEY)
}

let vapidReady = false
function ensureVapid() {
  if (vapidReady) return
  if (!isPushConfigured()) throw new Error('web-push: VAPID keys are not configured')
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY!, PRIVATE_KEY!)
  vapidReady = true
}

export interface PushPayload {
  title: string
  body: string
  /** Where clicking the notification should take the user. */
  url?: string
  /** Same tag replaces a previous notification instead of stacking. */
  tag?: string
  icon?: string
}

/** Send a push to every device a user has opted in on. Returns counts; never throws
 *  for an individual dead subscription (those are pruned). */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<{ sent: number; pruned: number }> {
  if (!isPushConfigured()) return { sent: 0, pruned: 0 }
  ensureVapid()

  const sb = createAdminClient()
  const { data: subs } = await sb
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subs || subs.length === 0) return { sent: 0, pruned: 0 }

  const body = JSON.stringify(payload)
  let sent = 0
  let pruned = 0

  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body,
      )
      sent++
    } catch (err: unknown) {
      const code = (err as { statusCode?: number })?.statusCode
      if (code === 404 || code === 410) {
        await sb.from('push_subscriptions').delete().eq('id', s.id)
        pruned++
      }
      // other errors (network/5xx) are swallowed — a single bad send must not
      // abort a whole digest run.
    }
  }
  return { sent, pruned }
}
