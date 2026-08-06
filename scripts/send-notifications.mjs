/**
 * send-notifications.mjs — deliver queued notifications (push + email).
 *
 *   node scripts/send-notifications.mjs            → immediate mode, DRY (prints only)
 *   node scripts/send-notifications.mjs --digest   → digest mode, DRY
 *   add --send                                     → actually deliver
 *
 * SAFETY: nothing is sent unless you pass --send. Without it, the script logs
 * exactly what it would deliver so you can eyeball it first. Immediate mode is
 * skipped during quiet hours (9pm–8am NZ) so those roll to the morning.
 *
 * PUSH only — email is the weekly newsletter (phase 3), not per-notification.
 * Immediate: one push per pending item (or a summary if a user has several);
 * Digest: one "N updates on things you follow" push per user.
 * Marks rows sent so they never go twice.
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { sb, sendPushToUser, inQuietHours } from './lib/notify.mjs'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })

const LIVE = process.argv.includes('--send')
const MODE = process.argv.includes('--digest') ? 'digest' : 'immediate'
const CAP = 3
const SITE = (process.env.NEXT_PUBLIC_APP_URL || 'https://arapono.org.nz').replace(/\/$/, '')
const abs = (url) => (url?.startsWith('http') ? url : `${SITE}${url || '/'}`)

if (MODE === 'immediate' && inQuietHours()) {
  console.log('Quiet hours (9pm–8am NZ) — holding immediate notifications for the morning.')
  process.exit(0)
}

const { data: rows, error } = await sb()
  .from('notification_queue')
  .select('id, user_id, category, title, body, url, created_at')
  .is('sent_at', null).eq('urgency', MODE)
  .order('created_at', { ascending: true })
if (error) { console.error(error.message); process.exit(1) }

if (!rows?.length) { console.log(`No pending ${MODE} notifications.`); process.exit(0) }

// group by user
const byUser = new Map()
for (const r of rows) { if (!byUser.has(r.user_id)) byUser.set(r.user_id, []); byUser.get(r.user_id).push(r) }
console.log(`${MODE}: ${rows.length} pending across ${byUser.size} user(s). ${LIVE ? 'SENDING' : 'DRY RUN (add --send to deliver)'}`)

let pushed = 0

for (const [userId, items] of byUser) {
  const single = items.length === 1 ? items[0] : null
  const pushPayload = single
    ? { title: single.title, body: single.body, url: single.url || '/', tag: `n-${single.category}` }
    : { title: `${items.length} updates on what you follow`, body: items.slice(0, 3).map((i) => i.title).join(' · '), url: '/command-centre', tag: 'n-digest' }

  if (!LIVE) {
    console.log(`  ${userId.slice(0, 8)}… → push "${pushPayload.title}" (${items.length} item(s))`)
    continue
  }

  const { sent } = await sendPushToUser(userId, pushPayload)
  if (sent) pushed++
  await sb().from('notification_queue').update({ sent_at: new Date().toISOString(), channels: 'push' }).in('id', items.map((i) => i.id))
}

console.log(LIVE ? `Done. Pushed to ${pushed} user(s).` : 'Dry run complete — no notifications sent, nothing marked.')
process.exit(0)
