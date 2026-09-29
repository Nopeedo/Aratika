/**
 * POST /api/donate/checkout — opens a Stripe Checkout session for a donation
 * to Politika, on ONEBYONE PROJECT's Stripe account (Onebyone is the merchant,
 * taking donations on Politika's behalf, by the owner's arrangement).
 *
 * That's why this does NOT use lib/stripe.ts: STRIPE_SECRET_KEY is Politika's
 * own account (the premium tier). This reads DONATE_STRIPE_SECRET_KEY, which
 * must be Onebyone's key. Unset → 503, and /donate shows "open soon".
 *
 * Every session and payment carries metadata source=politika, so Onebyone can
 * tell these apart from its own campaign donations in Stripe and in its
 * webhook handlers.
 */

import Stripe from 'stripe'

const CURRENCIES = new Set(['nzd', 'usd', 'aud'])
const MIN_CENTS = 100          // $1
const MAX_CENTS = 1_000_000    // $10,000

export async function POST(request: Request) {
  const key = process.env.DONATE_STRIPE_SECRET_KEY
  if (!key) return Response.json({ error: 'Donations are not open yet' }, { status: 503 })

  let body: { amountCents?: unknown; currency?: unknown; coverFee?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Bad request' }, { status: 400 })
  }

  const amount = typeof body.amountCents === 'number' ? Math.round(body.amountCents) : NaN
  const currency = typeof body.currency === 'string' ? body.currency.toLowerCase() : ''
  if (!Number.isFinite(amount) || amount < MIN_CENTS || amount > MAX_CENTS || !CURRENCIES.has(currency)) {
    return Response.json({ error: 'Choose an amount between $1 and $10,000' }, { status: 400 })
  }

  const origin = new URL(request.url).origin
  const metadata = { source: 'politika', purpose: 'politika-running-costs', cover_fee: String(body.coverFee === true) }

  try {
    const stripe = new Stripe(key)
    // One-time only, by request: no subscriptions, so nothing recurring is
    // ever created on Onebyone's account for Politika.
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      submit_type: 'donate',
      line_items: [{ quantity: 1, price_data: { currency, unit_amount: amount, product_data: { name: 'Donation to Politika' } } }],
      payment_intent_data: { metadata, description: 'Donation to Politika' },
      metadata,
      success_url: `${origin}/donate/thank-you`,
      cancel_url: `${origin}/donate`,
    })
    return Response.json({ url: session.url })
  } catch (e) {
    console.error('[donate] checkout failed', e)
    return Response.json({ error: 'Could not open checkout' }, { status: 502 })
  }
}
