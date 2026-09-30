/**
 * POST /api/donate/checkout — starts a donation to Politika.
 *
 * POLITIKA IS THE MERCHANT. This used to hand the payment to Onebyone Project,
 * which opened the Stripe session on its own account; Politika held no Stripe
 * credentials and only redirected to the URL it was given. That worked, and it
 * put "ONEBYONE" on the donor's card statement — a name they never chose to
 * give money to, on a line they cannot ask us about. A donation that looks
 * unrecognised is a donation that gets charged back.
 *
 * So the session is created here, on Politika's own Stripe account, and the
 * statement line says POLITIKA.
 *
 * One-time and NZD only, by request. The payment is recorded by
 * /api/stripe/webhook on checkout.session.completed, which writes the row in
 * public.donations that scripts/donation-receipts.mjs then receipts.
 */

import { getStripe } from '@/lib/stripe'
import { DONATIONS_ENABLED } from '@/constants/features'
import { SITE } from '@/constants/site'

const MIN_CENTS = 100          // $1
const MAX_CENTS = 1_000_000    // $10,000

/**
 * What the donor sees on their statement, after the account’s own descriptor.
 *
 * Stripe builds the line as ACCOUNT DESCRIPTOR + this suffix, capped at 22
 * characters for the two together. The account descriptor is a dashboard
 * setting no code can read or set; as of 30 Sep 2026 it is POLITIKA.NZ
 * (confirmed against the live account, settings.payments.statement_descriptor).
 *
 * So: POLITIKA.NZ (11) + a separator + DONATION (8) = 20, inside the cap.
 *
 * This used to say 'POLITIKA DONATION'. That was right while the account was
 * still named Aratika — the suffix was the only half carrying the real name,
 * so a donor at least saw Politika somewhere. Now that the account says
 * POLITIKA.NZ, keeping it would print the name twice AND blow the 22-character
 * cap (11 + 1 + 17 = 29), so Stripe would truncate it mid-word.
 *
 * If the account descriptor is ever changed, redo the arithmetic here.
 *
 * Stripe rejects the characters < > \ ' " * in a suffix.
 */
const STATEMENT_SUFFIX = 'DONATION'

export async function POST(request: Request) {
  if (!DONATIONS_ENABLED) return Response.json({ error: 'Donations are not open yet' }, { status: 503 })
  if (!process.env.STRIPE_SECRET_KEY) {
    // Explicit, not a generic 500: the only way this happens is a missing env
    // var in the deployment, and "donations are not open" would hide it.
    console.error('[donate] STRIPE_SECRET_KEY is not set')
    return Response.json({ error: 'Donations are not open yet' }, { status: 503 })
  }

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
  const coverFee = body.coverFee === true
  const emailUpdates = body.emailUpdates === true

  const site = (process.env.NEXT_PUBLIC_APP_URL || SITE.url).replace(/\/$/, '')

  // A short human reference the donor can quote in an email. Generated before
  // the session so it can go in metadata and on the receipt; the session id is
  // the real key, this is only for people.
  const reference = `POL-${Date.now().toString(36).toUpperCase().slice(-6)}`

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      currency: 'nzd',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'nzd',
          unit_amount: amount,
          // No Stripe Price object: the amount is whatever the donor typed, so
          // creating a Price per donation would litter the account.
          product_data: {
            name: 'Donation to Politika',
            description: 'Keeps Politika free and independent. Not a payment for goods or services.',
          },
        },
      }],
      // Asked for, not inferred: the receipt needs somewhere to go, and the
      // donations table's donor_email is what the receipt script reads.
      customer_creation: 'always',
      payment_intent_data: {
        statement_descriptor_suffix: STATEMENT_SUFFIX,
        description: `Politika donation ${reference}`,
      },
      // Read back by /api/stripe/webhook. Everything the donations row needs
      // that Stripe does not carry natively lives here, because a webhook that
      // has to call back into our own API to find out what a payment was for
      // is a second thing that can fail.
      metadata: {
        kind: 'donation',
        reference,
        email_updates: String(emailUpdates),
        cover_fee: String(coverFee),
      },
      // /donate/thank-you, not back to /donate. This pointed at the form
      // itself with ?done=1, which nothing read: a donor who had just paid
      // landed on the same form, looking exactly as it did before they paid.
      // That is how someone pays twice, and it left the written thank-you
      // page unreachable.
      success_url: `${site}/donate/thank-you?ref=${reference}`,
      cancel_url: `${site}/donate?cancelled=1`,
    })

    if (!session.url) {
      console.error('[donate] stripe returned a session with no url', session.id)
      return Response.json({ error: 'Could not open checkout' }, { status: 502 })
    }
    return Response.json({ url: session.url })
  } catch (e) {
    console.error('[donate] stripe session failed', e instanceof Error ? e.message : e)
    return Response.json({ error: 'Could not open checkout' }, { status: 502 })
  }
}
