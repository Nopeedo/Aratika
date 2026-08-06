/**
 * notify.mjs — shared notification engine for the Arapono pipelines.
 *
 * Detection scripts ENQUEUE rows (enqueue); the sender processes them
 * (sendPushToUser / emailUser). Everything degrades cleanly when creds are
 * absent, and honours a global dry-run so nothing goes out during testing.
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (queue + subs + users),
 *      NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (push),
 *      ZOHO_SMTP_USER, ZOHO_SMTP_PASS (email).
 *
 * DRY RUN: pass --dry-run to the running script, or set NOTIFY_DRY=1. In dry-run,
 * enqueue/send only log what they WOULD do — no DB writes, no push, no email.
 */

import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import webpush from 'web-push'
import { createHash } from 'node:crypto'

export const DRY = process.argv.includes('--dry-run') || process.env.NOTIFY_DRY === '1'

// ── Supabase (service role) ───────────────────────────────────────────────────
let _sb
export function sb() {
  if (_sb) return _sb
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('notify: Supabase service-role env missing')
  _sb = createClient(url, key, { auth: { persistSession: false } })
  return _sb
}

/** Stable per-event key so we never notify the same user of the same thing twice. */
export const dedupKey = (...parts) => createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 40)

// ── Web Push (VAPID) ──────────────────────────────────────────────────────────
let _vapid = false
function vapidReady() {
  if (_vapid) return true
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return false
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:hello@arapono.org.nz', pub, priv)
  _vapid = true
  return true
}
export const pushConfigured = () => !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)

// ── Email (Zoho SMTP) ─────────────────────────────────────────────────────────
let _mail
function mailer() {
  if (_mail !== undefined) return _mail
  if (!process.env.ZOHO_SMTP_USER || !process.env.ZOHO_SMTP_PASS) { _mail = null; return null }
  _mail = nodemailer.createTransport({
    host: 'smtp.zoho.com.au', port: 465, secure: true,
    auth: { user: process.env.ZOHO_SMTP_USER, pass: process.env.ZOHO_SMTP_PASS },
  })
  return _mail
}
export const emailConfigured = () => !!(process.env.ZOHO_SMTP_USER && process.env.ZOHO_SMTP_PASS)

// ── Quiet hours (9pm–8am NZ) ──────────────────────────────────────────────────
export function inQuietHours() {
  const hour = Number(new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland', hour: '2-digit', hour12: false }))
  return hour >= 21 || hour < 8
}

// ── Enqueue ───────────────────────────────────────────────────────────────────
/** Add a pending notification. Idempotent on (user_id, dedup_key). */
export async function enqueue({ userId, urgency, category, dedup, title, body, url }) {
  if (DRY) { console.log(`  [DRY enqueue ${urgency}/${category}] ${userId.slice(0, 8)}… "${title}"`); return }
  const { error } = await sb().from('notification_queue').upsert(
    { user_id: userId, urgency, category, dedup_key: dedup, title, body, url: url || null },
    { onConflict: 'user_id,dedup_key', ignoreDuplicates: true },
  )
  if (error) console.error(`  enqueue failed: ${error.message}`)
}

// ── Send: push ────────────────────────────────────────────────────────────────
/** Send a push to every device a user opted in on. Prunes expired subs. */
export async function sendPushToUser(userId, payload) {
  if (!vapidReady()) return { sent: 0 }
  const { data: subs } = await sb().from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', userId)
  if (!subs?.length) return { sent: 0 }
  if (DRY) { console.log(`  [DRY push] ${userId.slice(0, 8)}… → ${subs.length} device(s): "${payload.title}"`); return { sent: subs.length } }
  let sent = 0
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload))
      sent++
    } catch (e) {
      if (e?.statusCode === 404 || e?.statusCode === 410) await sb().from('push_subscriptions').delete().eq('id', s.id)
    }
  }
  return { sent }
}

// ── Send: email ───────────────────────────────────────────────────────────────
export async function emailUser(to, subject, text, html) {
  const m = mailer()
  if (!m) return false
  if (DRY) { console.log(`  [DRY email] ${to} — "${subject}"`); return true }
  await m.sendMail({ from: `"Arapono" <${process.env.ZOHO_SMTP_USER}>`, to, subject, text, html })
  return true
}

// ── User email map (auth.users; paginated) ────────────────────────────────────
export async function userEmailMap() {
  const map = new Map()
  let page = 1
  for (;;) {
    const { data, error } = await sb().auth.admin.listUsers({ page, perPage: 1000 })
    if (error) { console.error(`listUsers: ${error.message}`); break }
    for (const u of data.users) if (u.email) map.set(u.id, u.email)
    if (data.users.length < 1000) break
    page++
  }
  return map
}
