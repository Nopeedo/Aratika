/**
 * Verify the site-wide companion ceiling is armed.
 *
 * Run after applying supabase/migrations/0016_companion_day_total.sql:
 *   node scripts/check-companion-ceiling.mjs
 *
 * Reports today's site-wide question total and the configured ceiling. Until
 * the migration is applied the RPC does not exist, the route's check fails OPEN
 * (logs and allows through), and this prints NOT ARMED — which is the honest
 * state, not a crash.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = { ...process.env }
try {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* CI supplies real env vars */ }

const max = Math.max(0, Number(env.COMPANION_DAILY_MAX ?? 1500))
const day = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data, error } = await sb.rpc('companion_day_total', { p_day: day })

if (error) {
  console.log(`NOT ARMED — companion_day_total is missing (${error.message})`)
  console.log('  The route fails open, so questions are limited per user only.')
  console.log('  Apply supabase/migrations/0016_companion_day_total.sql to arm it.')
  // exitCode, not exit(): exit() tears the process down while the Supabase
  // client still holds a socket, which trips a libuv assertion on Windows.
  process.exitCode = 1
} else {
const used = Number(data ?? 0)
console.log(`ARMED  ${day} (NZ): ${used} of ${max} questions used site-wide`)
console.log(`  ~USD ${(used * 0.014).toFixed(2)} spent today, ceiling ~USD ${(max * 0.014).toFixed(2)}`)
if (used >= max) console.log('  CEILING REACHED — /api/ask is returning 429 until tomorrow.')
}
