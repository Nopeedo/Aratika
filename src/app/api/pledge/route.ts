/**
 * /api/pledge — the pledge to vote.
 *
 *  GET    → { total, verified, goal, mine }       the counter, plus whether this
 *                                                 caller has already pledged
 *  POST   → { position, total, verified, already } record a pledge
 *  PATCH  { enrolled: 'yes'|'no'|'unknown' }      answer the enrolment question
 *
 * A pledge says one person tapped a button. It is not evidence that anyone
 * enrolled or voted, and nothing here should ever be presented as either: the
 * Commission's enrolment flow is a separate origin behind a bot challenge with
 * no callback and no API, so the site cannot learn what happened there. See the
 * note at the top of migration 0021.
 *
 * DEDUP, in the order it is applied:
 *   1. signed in  → one row per user_id, enforced by a partial unique index
 *   2. anonymous  → one row per device_token, an httpOnly cookie minted here
 *   3. everyone   → a generous per-hour cap on a salted IP hash
 *
 * The cap is 8 an hour, not 1. New Zealand mobile networks run CGNAT, so a
 * marae, a school or an office shares a single public address; a hard
 * one-per-IP rule would silently refuse real people in exactly the communities
 * this is for. 8 stops a script without touching a room full of phones.
 */

import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { createHash, randomUUID } from 'node:crypto'
import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPledgeTotals, PLEDGE_GOAL, PLEDGE_CACHE_TAG } from '@/lib/pledges/count'
import { PLEDGE_ENABLED } from '@/constants/features'

export const runtime = 'nodejs'

/**
 * Closed until PLEDGE_ENABLED is flipped. Every method checks this, not just
 * the ones that write: a GET that answered while the feature was dark would
 * publish a count nobody is meant to see yet, and an open POST would seed the
 * total before launch. The number has to start at a real zero on day one.
 */
const closed = () => NextResponse.json({ error: 'not_available' }, { status: 404 })

const COOKIE = 'politika_pledge'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400   // just over a year
const RATE_LIMIT = 8
const RATE_WINDOW_MS = 60 * 60 * 1000

/**
 * A salted hash of the caller's address, for rate limiting only. Never the
 * address itself: this is a civic site, the value has no use beyond counting
 * recent requests, and an un-salted hash of an IPv4 address is reversible by
 * brute force in seconds.
 */
async function ipHash(): Promise<string | null> {
  const h = await headers()
  const fwd = h.get('x-forwarded-for') || h.get('x-real-ip') || ''
  const ip = fwd.split(',')[0]?.trim()
  if (!ip) return null
  const salt = process.env.PLEDGE_IP_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!salt) return null   // no salt, no hash — rather not store a weak one
  return createHash('sha256').update(salt + '|' + ip).digest('hex').slice(0, 32)
}

/**
 * The caller's existing pledge.
 *
 * An ACCOUNT is the authority when there is one: if you are signed in and your
 * account has not pledged, you may pledge, even on a browser whose cookie
 * belongs to someone else. That is the shared phone in a household, and the
 * account check already stops you pledging twice.
 *
 * Only when there is no account does the cookie decide. The earlier version
 * fell through from the account check to the cookie check, which was wrong in
 * both directions: it blocked the second person on a shared device, and — worse
 * — a signed-in pledge left no cookie at all, so signing out and tapping again
 * counted twice.
 */
async function findMine(userId: string | null, token: string | null) {
  const sb = createAdminClient()
  if (userId) {
    const { data } = await sb.from('pledges').select('id, enrolled').eq('user_id', userId).maybeSingle()
    return data ?? null
  }
  if (token) {
    const { data } = await sb.from('pledges').select('id, enrolled').eq('device_token', token).maybeSingle()
    return data ?? null
  }
  return null
}

async function session(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  } catch {
    return null
  }
}

export async function GET() {
  if (!PLEDGE_ENABLED) return closed()
  const totals = await getPledgeTotals()
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value ?? null
  const userId = await session()
  const mine = await findMine(userId, token).catch(() => null)
  return NextResponse.json({
    total: totals.total, verified: totals.verified, goal: PLEDGE_GOAL,
    ok: totals.ok,
    mine: mine ? { pledged: true, enrolled: mine.enrolled ?? null } : { pledged: false, enrolled: null },
  })
}

export async function POST(req: Request) {
  if (!PLEDGE_ENABLED) return closed()
  let body: { source?: unknown } = {}
  try { body = await req.json() } catch { /* body is optional */ }
  const source = typeof body.source === 'string' ? body.source.slice(0, 64) : null

  const jar = await cookies()
  let token = jar.get(COOKIE)?.value ?? null
  const userId = await session()

  // Already pledged? Say so plainly and return the live number rather than
  // treating a second tap as an error. Tapping twice is a normal thing to do.
  const existing = await findMine(userId, token).catch(() => null)
  if (existing) {
    const t = await getPledgeTotals()
    return NextResponse.json({ already: true, total: t.total, verified: t.verified, goal: PLEDGE_GOAL })
  }

  const sb = createAdminClient()
  const ip = await ipHash()

  if (ip) {
    const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
    const { count } = await sb.from('pledges')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ip).gte('created_at', since)
    if ((count ?? 0) >= RATE_LIMIT) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
    }
  }

  const minted = token ?? randomUUID()
  const { error } = await sb.from('pledges').insert({
    user_id: userId,
    // Recorded for signed-in pledges too. Leaving it null meant signing out and
    // tapping again created a second row from the same browser. Someone else on
    // a shared phone is not blocked by this: findMine lets a signed-in caller
    // through on their own account regardless of whose cookie is present.
    device_token: minted,
    ip_hash: ip,
    source,
  })
  if (error) {
    // The unique indexes are the final word on duplicates: a race between two
    // taps lands here rather than double-counting.
    if (error.code === '23505') {
      const t = await getPledgeTotals()
      return NextResponse.json({ already: true, total: t.total, verified: t.verified, goal: PLEDGE_GOAL })
    }
    console.error('[pledge]', error.message)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }

  revalidateTag(PLEDGE_CACHE_TAG, 'minutes')

  // The exact count straight after the insert, so the number shown is this
  // person's actual place rather than a cached one from up to a minute ago.
  const { count } = await sb.from('pledges').select('id', { count: 'exact', head: true })
  const { count: verified } = await sb.from('pledges')
    .select('id', { count: 'exact', head: true }).not('user_id', 'is', null)

  const res = NextResponse.json({
    already: false, position: count ?? 1, total: count ?? 1,
    verified: verified ?? 0, goal: PLEDGE_GOAL,
  })
  {
    res.cookies.set(COOKIE, minted, {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
      path: '/', maxAge: COOKIE_MAX_AGE,
    })
  }
  return res
}

export async function PATCH(req: Request) {
  if (!PLEDGE_ENABLED) return closed()
  let body: { enrolled?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const enrolled = body.enrolled
  if (enrolled !== 'yes' && enrolled !== 'no' && enrolled !== 'unknown') {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const jar = await cookies()
  const token = jar.get(COOKIE)?.value ?? null
  const userId = await session()
  const mine = await findMine(userId, token).catch(() => null)
  // No pledge to attach the answer to. Not an error worth showing anyone — the
  // card just carries on.
  if (!mine) return NextResponse.json({ ok: false })

  const { error } = await createAdminClient().from('pledges').update({ enrolled }).eq('id', mine.id)
  if (error) {
    console.error('[pledge:patch]', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
