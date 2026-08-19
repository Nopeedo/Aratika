/**
 * detect-electoral-dates.mjs — notify on the electoral calendar itself.
 *
 * Every other detector here is content-driven: something was published about a
 * party, an MP, a bill you follow. None of them fire on the deadlines that
 * decide whether a person can vote at all. Enrolment closing is not news about
 * something you track — it is the one date where silence has a cost that no
 * later correction undoes.
 *
 * So this detector is different in two ways:
 *
 *  1. It notifies EVERY registered user, not only people who track something.
 *     These deadlines apply to every voter regardless of interests, and gating
 *     them behind "did you bookmark a party" would miss exactly the people who
 *     are least engaged and most likely to miss enrolment.
 *
 *  2. It fires on a schedule known in advance, so it warns ahead of time as well
 *     as on the day — the enrolment deadline is announced at 14, 7, 3 and 1 days
 *     out. A notification that arrives the evening enrolment closes is not much
 *     use to someone who has to find ID first.
 *
 * Dates come from src/constants/electoral-calendar.json, which is transcribed
 * from the Electoral Commission's published timetable. Read the header of
 * electoral-calendar.ts before changing anything: 2026 closes enrolment 13 days
 * before election day, which is NOT how 2023 worked.
 *
 * Run: node scripts/detect-electoral-dates.mjs [--dry-run] [--today=YYYY-MM-DD]
 */

import dotenv from 'dotenv'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { sb, enqueue, dedupKey, DRY } from './lib/notify.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: join(root, '.env.local') })

const calendar = JSON.parse(readFileSync(join(root, 'src/constants/electoral-calendar.json'), 'utf8'))

// --today lets the schedule be tested without waiting for October. It only ever
// changes which milestones are considered due; it cannot change what is sent.
const todayArg = process.argv.find((a) => a.startsWith('--today='))
// NZ local date. The deadlines are NZ deadlines, and a UTC-based "today" would
// run the last enrolment reminder a day late for half of each day.
const today = todayArg
  ? todayArg.slice('--today='.length)
  : new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })

const daysUntil = (from, to) =>
  Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 86_400_000)

console.log(`Electoral calendar — today is ${today} (Pacific/Auckland)`)
console.log(`Source: ${calendar.source.name} — ${calendar.source.url}`)
if (DRY) console.log('DRY RUN — nothing will be enqueued.\n')

// Which milestones are due today: either the day itself, or one of its
// pre-announced lead times.
const due = []
for (const m of calendar.milestones) {
  if (!m.notify) continue
  const away = daysUntil(today, m.date)
  if (away < 0) continue
  if (away === 0) { due.push({ m, away }); continue }
  if ((m.remindDaysBefore || []).includes(away)) due.push({ m, away })
}

if (due.length === 0) {
  const next = calendar.milestones
    .filter((m) => m.notify && daysUntil(today, m.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))[0]
  console.log(next
    ? `Nothing due today. Next: ${next.label} on ${next.date} (${daysUntil(today, next.date)} days).`
    : 'Nothing due today, and no future milestones remain.')
  process.exit(0)
}

// Everyone with a device registered for push — NOT only people who track
// something. That distinction is the point: these deadlines apply to every
// voter, and gating them behind "did you bookmark a party" would miss exactly
// the people least engaged and most likely to miss enrolment.
//
// Sourced from push_subscriptions rather than the full user list because a user
// with no device cannot receive anything: the sender would enqueue, find no
// device, and close the row undelivered. There are already 48 such rows in the
// queue from other detectors. Queueing civic deadlines nobody can receive would
// only make that worse, and would make the queue look busier than it is.
const seen = new Set()
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb()
    .from('push_subscriptions').select('user_id').order('user_id').range(from, from + 999)
  if (error) { console.error('Could not read subscriptions:', error.message); process.exit(1) }
  for (const r of data || []) seen.add(r.user_id)
  if (!data || data.length < 1000) break
}
const users = [...seen]
console.log(`Recipients: ${users.length} user(s) with a registered device\n`)
if (users.length === 0) console.log('  (nobody has push enabled — nothing to enqueue)')

let enqueued = 0
for (const { m, away } of due) {
  // The day itself is urgent; a lead-time warning is not, and waking someone at
  // 3am to say "14 days until enrolment closes" would train them to turn all of
  // this off. Same-day and last-day notices go immediate, the rest ride the
  // 7am digest.
  const urgency = away <= 1 ? 'immediate' : 'digest'

  const when =
    away === 0 ? (m.timeNote ? `Today — ${m.timeNote}.` : 'Today.')
      : away === 1 ? 'Tomorrow.'
        : `In ${away} days (${m.date}).`

  const title = away === 0 ? m.label : `${m.label} — ${away === 1 ? 'tomorrow' : `${away} days`}`
  const body = `${when} ${m.detail}`

  console.log(`  ${m.id}  ${away === 0 ? 'TODAY' : `${away}d out`}  [${urgency}]  ${title}`)
  if (!DRY) console.log(`      → ${users.length} user(s)`)

  for (const userId of users) {
    await enqueue({
      userId,
      urgency,
      category: 'election',
      // Keyed on milestone AND lead time, so the 7-day and 1-day warnings are
      // separate events while a re-run on the same day is not.
      dedup: dedupKey('electoral', m.id, String(away), userId),
      title,
      body,
      // The site's own guidance page, not vote.nz: it explains the deadline and
      // links out to the Commission to actually enrol.
      url: '/elections/2026',
    })
    enqueued++
  }
}

console.log(`\nEnqueued ${enqueued} notification(s) across ${due.length} milestone(s).`)
process.exit(0)
