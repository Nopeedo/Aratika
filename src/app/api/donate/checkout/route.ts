/**
 * POST /api/donate/checkout — starts a donation to Politika.
 *
 * Onebyone Project is the merchant, on Politika's behalf. Politika holds no
 * Onebyone or Stripe credentials: this asks Onebyone's server to open a
 * Stripe Checkout session (POST /api/v1/donations/politika) and hands the
 * browser the URL. The request is signed with DONATE_SHARED_SECRET (see
 * lib/donate/sign.ts); without it donations aren't open and this answers 503.
 *
 * One-time and NZD only, by request. Onebyone's webhook records the payment
 * and sends it back to /api/donate/notify, which queues Politika's receipt.
 */

import { donateSecret, sign } from '@/lib/donate/sign'
import { DONATIONS_ENABLED } from '@/constants/features'

const MIN_CENTS = 100          // $1
const MAX_CENTS = 1_000_000    // $10,000
const ONEBYONE_API = (process.env.ONEBYONE_API_URL || 'https://onebyoneproject-api.fly.dev').replace(/\/$/, '')

export async function POST(request: Request) {
  const secret = donateSecret()
  if (!DONATIONS_ENABLED || !secret) return Response.json({ error: 'Donations are not open yet' }, { status: 503 })

  let body: { amountCents?: unknown; coverFee?: unknown; emailUpdates?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Bad request' }, { status: 400 })
  }
  const amount = typeof body.amountCents === 'number' ? Math.round(body.amountCents) : NaN
  if (!Number.isFinite(amount) || amount < MIN_CENTS || amount > MAX_CENTS) {
    return Response.json({ error: 'Choose an amount between $1 and $10,000' }, { status: 400 })
  }

  // The donor's IP, so Onebyone rate-limits per donor rather than treating
  // every Politika donor as one visitor (all requests come from this server).
  const clientIp = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null

  const raw = JSON.stringify({
    amount,
    marketing_opt_in: body.emailUpdates === true,
    cover_fee: body.coverFee === true,
    client_ip: clientIp,
  })
  const ts = String(Math.floor(Date.now() / 1000))

  try {
    const res = await fetch(`${ONEBYONE_API}/api/v1/donations/politika`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-politika-timestamp': ts, 'x-politika-signature': sign(raw, ts, secret) },
      body: raw,
      cache: 'no-store',
    })
    const json = (await res.json().catch(() => ({}))) as { checkout_url?: string; detail?: string }
    if (res.ok && json.checkout_url) return Response.json({ url: json.checkout_url })
    console.error('[donate] onebyone refused', res.status, json.detail)
    return Response.json({ error: 'Could not open checkout' }, { status: res.status === 429 ? 429 : 502 })
  } catch (e) {
    console.error('[donate] onebyone unreachable', e)
    return Response.json({ error: 'Could not open checkout' }, { status: 502 })
  }
}
