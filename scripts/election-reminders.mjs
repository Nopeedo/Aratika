/**
 * election-reminders.mjs — broadcast countdown/calendar nudges to everyone who
 * has push on. The highest mission-value notifications: enrolment + voting.
 *
 * Runs daily. Computes days-to-election and fires a reminder only on the exact
 * milestone days (30 / 7 / 1 / 0), plus any fixed EC-confirmed dates listed
 * below. Enqueues as `immediate` for every user with push enabled. Dedup on
 * (user, milestone) means each nudge goes out once.
 *
 * Run: node scripts/election-reminders.mjs [--dry-run]
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { sb, enqueue, dedupKey } from './lib/notify.mjs'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })

const ELECTION = '2026-11-07' // Saturday 7 November 2026

const todayNZ = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })
const daysUntil = Math.round((Date.parse(`${ELECTION}T00:00:00Z`) - Date.parse(`${todayNZ}T00:00:00Z`)) / 86400000)

// Countdown milestones keyed by days-before.
const MILESTONES = {
  30: { key: 'e-30', title: 'One month to the election', body: 'Make sure you’re enrolled — it takes two minutes at vote.nz.', url: '/guide' },
  7:  { key: 'e-7',  title: 'One week until the election', body: 'Advance voting opens soon — you don’t have to wait for election day.', url: '/elections/2026' },
  1:  { key: 'e-1',  title: 'Vote tomorrow', body: 'Election day is tomorrow. Find your voting place and what’s on your ballot.', url: '/elections/2026' },
  0:  { key: 'e-0',  title: 'Polls are open — vote today', body: 'It’s election day. Have your say before 7pm.', url: '/elections/2026' },
}

// Fixed EC-confirmed dates (add once the Electoral Commission publishes them):
//   { date: '2026-10-##', key: 'enrol-deadline', title: '…', body: '…', url: '/guide' }
const FIXED_EVENTS = []

// What (if anything) fires today.
const due = []
if (MILESTONES[daysUntil]) due.push(MILESTONES[daysUntil])
for (const ev of FIXED_EVENTS) if (ev.date === todayNZ) due.push(ev)

console.log(`Days until election: ${daysUntil}. Reminders due today: ${due.length}`)
if (due.length === 0) process.exit(0)

// Everyone with push enabled.
const { data: prefs, error } = await sb().from('notification_prefs').select('user_id').eq('push_enabled', true)
if (error) { console.error(error.message); process.exit(1) }
console.log(`Opted-in users: ${prefs?.length ?? 0}`)

let enqueued = 0
for (const ev of due) {
  for (const p of prefs || []) {
    await enqueue({
      userId: p.user_id, urgency: 'immediate', category: 'election',
      dedup: dedupKey('election', ev.key, p.user_id),
      title: ev.title, body: ev.body, url: ev.url,
    })
    enqueued++
  }
}
console.log(`Enqueued ${enqueued} reminder(s).`)
process.exit(0)
