/**
 * /api/pledge — the pledge to vote.
 *
 *  GET   → { total, verified, goal, wall, mine }
 *  POST  → record a pledge. One tap, nothing to fill in.
 *  PUT   → attach a name, an email and consents to a pledge already made.
 *
 * TWO STEPS, ON PURPOSE. POST takes the tap and nothing else, so the counter
 * moves before anyone is asked for anything. PUT attaches details afterwards,
 * to a pledge that already counts. Asking for an email as the PRICE of
 * pledging would cost most of the conversions; asking once it is already done
 * costs none of them, and anyone who skips is still counted.
 *
 * A pledge says one person tapped a button. It is not evidence that anyone
 * enrolled or voted, and nothing here may be presented as either: the
 * Commission's enrolment flow is a separate origin behind a bot challenge with
 * no callback and no API. See migration 0021.
 *
 * THREE CONSENTS, NEVER COLLAPSED (migration 0022):
 *   giving an email   — the basis of dedup that actually holds
 *   showing a name    — opt in, default false, and only ever "First L."
 *   being emailed     — opt in, default false, its own column and its own table
 *
 * DEDUP, in the order applied:
 *   1. email        one row per address — the only key a private window cannot defeat
 *   2. signed in    one row per user_id
 *   3. anonymous    one row per device_token, an httpOnly cookie minted here
 *   4. everyone     a generous per-hour cap on a salted IP hash
 *
 * The cap is 8 an hour, not 1: New Zealand mobile networks run CGNAT, so a
 * marae, a school or an office shares a single public address, and a hard
 * one-per-IP rule would refuse real people in exactly the communities this is
 * for.
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
 * Closed until PLEDGE_ENABLED is flipped. Every method checks, not only the
 * writers: a GET answering while the feature is dark would publish a count
 * nobody is meant to see yet.
 */
const closed = () => NextResponse.json({ error: 'not_available' }, { status: 404 })

const COOKIE = 'politika_pledge'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400   // just over a year
const RATE_LIMIT = 8
const RATE_WINDOW_MS = 60 * 60 * 1000
const WALL_SIZE = 24

/** Deliberately loose. Anything stricter rejects real addresses (plus signs,
 *  long TLDs, unicode domains) and still cannot tell a live inbox from a dead
 *  one. This only catches the obviously wrong. */
const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/

/**
 * "John Doe" → "John D." Never the full name, under any setting.
 *
 * A public list of named people who pledged to vote is permanent and
 * scrapeable, and for some readers — someone leaving an abusive relationship,
 * someone whose employer has views — being on it is a cost they cannot undo.
 * One initial stays recognisable to people who know them and is close to
 * useless to anyone building a list.
 */
function publicName(name: string | null): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Anonymous'
  const first = parts[0].slice(0, 24)
  if (parts.length === 1) return first
  return `${first} ${parts[parts.length - 1][0].toUpperCase()}.`
}

/** A salted hash of the caller's address, for rate limiting only. Never the
 *  address itself: an unsalted hash of an IPv4 is brute-forced in seconds. */
async function ipHash(): Promise<string | null> {
  const h = await headers()
  const fwd = h.get('x-forwarded-for') || h.get('x-real-ip') || ''
  const ip = fwd.split(',')[0]?.trim()
  if (!ip) return null
  const salt = process.env.PLEDGE_IP_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!salt) return null
  return createHash('sha256').update(`${salt}|${ip}`).digest('hex').slice(0, 32)
}

/**
 * The caller's existing pledge.
 *
 * An ACCOUNT is the authority when there is one: signed in and not yet pledged
 * means you may pledge, even on a browser whose cookie belongs to someone else.
 * That is the shared phone in a household. Only without an account does the
 * cookie decide.
 */
async function findMine(userId: string | null, token: string | null) {
  const sb = createAdminClient()
  const cols = 'id, name, email, display_name'
  if (userId) {
    const { data } = await sb.from('pledges').select(cols).eq('user_id', userId).maybeSingle()
    return data ?? null
  }
  if (token) {
    const { data } = await sb.from('pledges').select(cols).eq('device_token', token).maybeSingle()
    return data ?? null
  }
  return null
}

async function session(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  } catch { return null }
}

/**
 * The wall: most recent pledges, as the public sees them.
 *
 * Everyone appears. Those who opted in show as "First L."; everyone else shows
 * as Anonymous rather than vanishing, so the wall reads as everyone who
 * pledged and anonymity looks like a normal choice other people are making.
 */
async function wall() {
  const { data, error } = await createAdminClient()
    .from('pledges')
    .select('id, name, display_name')
    .order('created_at', { ascending: false })
    .limit(WALL_SIZE)
  if (error || !data) return []
  return data.map((r) => {
    const named = Boolean(r.display_name && r.name)
    return { id: r.id as string, name: named ? publicName(r.name as string) : 'Anonymous', named }
  })
}

export async function GET() {
  if (!PLEDGE_ENABLED) return closed()
  const totals = await getPledgeTotals()
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value ?? null
  const userId = await session()
  const mine = await findMine(userId, token).catch(() => null)
  return NextResponse.json({
    total: totals.total, verified: totals.verified, goal: PLEDGE_GOAL, ok: totals.ok,
    wall: await wall().catch(() => []),
    mine: mine
      ? { pledged: true, hasDetails: Boolean(mine.email), listed: Boolean(mine.display_name) }
      : { pledged: false, hasDetails: false, listed: false },
  })
}

export async function POST(req: Request) {
  if (!PLEDGE_ENABLED) return closed()
  let body: { source?: unknown } = {}
  try { body = await req.json() } catch { /* body is optional */ }
  const source = typeof body.source === 'string' ? body.source.slice(0, 64) : null

  const jar = await cookies()
  const token = jar.get(COOKIE)?.value ?? null
  const userId = await session()

  // Tapping twice is a normal thing to do, not an error to show anyone.
  const existing = await findMine(userId, token).catch(() => null)
  if (existing) {
    const t = await getPledgeTotals()
    return NextResponse.json({
      already: true, total: t.total, verified: t.verified, goal: PLEDGE_GOAL,
      hasDetails: Boolean(existing.email),
    })
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
  // Recorded for signed-in pledges too: leaving it null meant signing out and
  // tapping again created a second row from the same browser.
  const { error } = await sb.from('pledges').insert({
    user_id: userId, device_token: minted, ip_hash: ip, source,
  })
  if (error) {
    // The unique indexes are the final word: a race between two taps lands here
    // rather than double-counting.
    if (error.code === '23505') {
      const t = await getPledgeTotals()
      return NextResponse.json({ already: true, total: t.total, verified: t.verified, goal: PLEDGE_GOAL })
    }
    console.error('[pledge]', error.message)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }

  revalidateTag(PLEDGE_CACHE_TAG, 'minutes')

  // The exact count straight after the insert, so the number shown is this
  // person's real place rather than a cached one up to a minute old.
  const { count } = await sb.from('pledges').select('id', { count: 'exact', head: true })
  const { count: verified } = await sb.from('pledges')
    .select('id', { count: 'exact', head: true }).not('email', 'is', null)

  const res = NextResponse.json({
    already: false, position: count ?? 1, total: count ?? 1,
    verified: verified ?? 0, goal: PLEDGE_GOAL, hasDetails: false,
  })
  res.cookies.set(COOKIE, minted, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    path: '/', maxAge: COOKIE_MAX_AGE,
  })
  return res
}

/** Step two: attach details to a pledge that already counts. */
export async function PUT(req: Request) {
  if (!PLEDGE_ENABLED) return closed()
  let body: { name?: unknown; email?: unknown; displayName?: unknown; newsletter?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || email.length > 320 || !LOOKS_LIKE_EMAIL.test(email)) {
    return NextResponse.json({ error: 'bad_email' }, { status: 400 })
  }
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : ''
  const newsletter = body.newsletter === true
  // Ticking "show my name" without giving one would put a bare "Anonymous" on
  // the wall under a setting that claims otherwise.
  const listed = body.displayName === true && name.length > 0

  const jar = await cookies()
  const token = jar.get(COOKIE)?.value ?? null
  const userId = await session()
  const mine = await findMine(userId, token).catch(() => null)
  if (!mine) return NextResponse.json({ error: 'no_pledge' }, { status: 409 })

  const sb = createAdminClient()
  const { error } = await sb.from('pledges')
    .update({ name: name || null, email, display_name: listed, newsletter })
    .eq('id', mine.id)

  if (error) {
    // Someone already pledged with this address. Their own pledge still counts;
    // it simply stays without details, which is a state the UI can explain
    // calmly rather than an error worth alarming anyone over.
    if (error.code === '23505') return NextResponse.json({ error: 'email_taken' }, { status: 409 })
    console.error('[pledge:put]', error.message)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }

  // The newsletter is a SEPARATE consent and a separate table. confirmed_at
  // stays null: migration 0018 is explicit that a row there records that
  // someone ASKED, not that the address is theirs, and nothing may send until a
  // confirmation step exists. ignoreDuplicates so a second pledge cannot
  // resurrect an unsubscribe.
  if (newsletter) {
    const { error: nErr } = await sb.from('newsletter_signups')
      .upsert({ email, source: 'pledge' }, { onConflict: 'email', ignoreDuplicates: true })
    if (nErr) console.error('[pledge:newsletter]', nErr.message)
  }

  revalidateTag(PLEDGE_CACHE_TAG, 'minutes')
  const t = await getPledgeTotals()
  return NextResponse.json({
    ok: true, listed, total: t.total, verified: t.verified,
    wall: await wall().catch(() => []),
  })
}
