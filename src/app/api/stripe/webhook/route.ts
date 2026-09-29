/**
 * POST /api/stripe/webhook
 * Stripe → Politika. Verifies the signature against the RAW body, then keeps the
 * subscriptions table in sync. Writes use the service-role client (bypasses RLS).
 *
 * Local testing:  stripe listen --forward-to localhost:3000/api/stripe/webhook
 */

import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailConfigured, sendMail } from '@/lib/email/send'
// The same renderer the cron backstop uses. One copy of the template, so the
// receipt a donor gets is the same one either way.
import { renderReceipt } from '../../../../../scripts/donation-receipt/template.mjs'

// nodemailer needs Node APIs, so this route must not be moved to the edge
// runtime. Next defaults to Node for route handlers; stating it means a
// later edge migration fails loudly here instead of silently dropping
// every receipt.
export const runtime = 'nodejs'

type AdminClient = ReturnType<typeof createAdminClient>

async function upsertFromSubscription(admin: AdminClient, sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  let userId = sub.metadata?.user_id as string | undefined

  // Fall back to looking the user up by customer id if metadata is missing.
  if (!userId) {
    const { data } = await admin.from('subscriptions').select('user_id').eq('stripe_customer_id', customerId).maybeSingle()
    userId = data?.user_id as string | undefined
  }
  if (!userId) return

  // current_period_end has lived in slightly different places across API versions.
  const anySub = sub as unknown as { current_period_end?: number; items?: { data?: { current_period_end?: number; price?: { id?: string } }[] } }
  const cpe = anySub.current_period_end ?? anySub.items?.data?.[0]?.current_period_end
  const priceId = sub.items?.data?.[0]?.price?.id ?? null

  await admin.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    price_id: priceId,
    status: sub.status,
    current_period_end: cpe ? new Date(cpe * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  })
}

/**
 * A completed donation → a row in public.donations.
 *
 * Politika became the merchant on 29 Sep 2026 (see api/donate/checkout). Before
 * that, Onebyone Project's server took the payment and posted the result to
 * /api/donate/notify; now the payment happens on our own account, so this is
 * where the record comes from.
 *
 * Upsert on stripe_session_id with ignoreDuplicates, because Stripe retries a
 * webhook it did not get a 2xx for and will happily deliver the same event
 * twice. A donation recorded twice is a receipt sent twice, and a donor being
 * thanked for money they gave once reads as being charged twice.
 *
 * paid_at comes from the event, not now(): a retry delivered an hour later must
 * not claim the donation happened an hour late.
 */
async function recordDonation(admin: AdminClient, session: Stripe.Checkout.Session) {
  const amount = session.amount_total
  if (!amount || amount <= 0) {
    console.error('[webhook] donation session with no amount', session.id)
    return
  }
  const m = session.metadata ?? {}
  const { error } = await admin.from('donations').upsert({
    stripe_session_id: session.id,
    reference: (m.reference as string) || `POL-${session.id.slice(-8).toUpperCase()}`,
    amount_cents: amount,
    currency: session.currency ?? 'nzd',
    // customer_details is where Checkout puts what the donor actually typed;
    // customer_email is only set when it was passed in beforehand, which it is
    // not here, so reading that alone loses every address.
    donor_email: session.customer_details?.email ?? session.customer_email ?? null,
    donor_name: session.customer_details?.name ?? null,
    email_updates: m.email_updates === 'true',
    cover_fee: m.cover_fee === 'true',
    paid_at: new Date((session.created ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
  }, { onConflict: 'stripe_session_id', ignoreDuplicates: true })

  if (error) {
    console.error('[webhook] donation insert failed', session.id, error.message)
    return
  }

  // The receipt goes now, not on a schedule. It used to wait for
  // .github/workflows/donation-receipts.yml, which runs every ten minutes and
  // took about six hours to start firing at all after it was added. Ten
  // minutes is long enough for a donor to go looking for a receipt that has
  // not arrived. That workflow stays as the backstop for anything this misses.
  try {
    await sendReceipt(admin, session.id)
  } catch (e) {
    // A receipt failure must never fail the webhook. A non-2xx makes Stripe
    // redeliver the event, and the donation itself is already recorded.
    console.error('[webhook] receipt step threw', session.id, e instanceof Error ? e.message : e)
  }
}

/**
 * Send the receipt for a donation, exactly once.
 *
 * CLAIM, THEN SEND. Stripe redelivers any event it did not get a 2xx for, and
 * the cron backstop can be running at the same moment, so "is it unsent? then
 * send it" double-sends under a race — and a donor thanked twice for one
 * donation reads as having been charged twice. The update below only matches
 * while receipt_sent_at is still null, so exactly one caller wins it.
 *
 * If the send then fails, the claim is RELEASED so the backstop can retry,
 * with the reason and the attempt recorded rather than swallowed.
 */
async function sendReceipt(admin: AdminClient, sessionId: string) {
  if (!emailConfigured()) {
    // Loud, because the failure is invisible otherwise: the donation is
    // recorded, the webhook returns 200, and no receipt is ever sent. These
    // have only ever been GitHub Actions secrets — the deployment needs them
    // too now that the app sends mail itself.
    console.error('[webhook] ZOHO_SMTP_USER / ZOHO_SMTP_PASS not set here: no receipt for', sessionId)
    return
  }

  const { data: claimed, error: claimError } = await admin
    .from('donations')
    .update({ receipt_sent_at: new Date().toISOString() })
    .eq('stripe_session_id', sessionId)
    .is('receipt_sent_at', null)
    .select('id, reference, amount_cents, currency, donor_email, donor_name, paid_at, receipt_attempts')

  if (claimError) {
    console.error('[webhook] could not claim the receipt', sessionId, claimError.message)
    return
  }
  // Already receipted — an earlier delivery of this same event, or the
  // backstop got there first. Nothing to do, and nothing wrong.
  if (!claimed || claimed.length === 0) return

  const d = claimed[0]

  if (!d.donor_email) {
    // Nothing to send to. Park it beyond the backstop’s retry window instead
    // of leaving it to be picked up every ten minutes forever. MAX_ATTEMPTS
    // mirrors scripts/donation-receipts.mjs; if that changes, change this.
    await admin
      .from('donations')
      .update({ receipt_sent_at: null, receipt_error: 'no donor email', receipt_attempts: 5 })
      .eq('id', d.id)
    return
  }

  try {
    const { subject, html, text } = renderReceipt({
      name: d.donor_name,
      amountCents: d.amount_cents,
      currency: d.currency,
      reference: d.reference,
      paidAt: d.paid_at,
      siteUrl: process.env.NEXT_PUBLIC_APP_URL,
    })
    await sendMail({ to: d.donor_email, subject, text, html })
    console.log('[webhook] receipt sent', d.reference)
  } catch (e) {
    const message = String(e instanceof Error ? e.message : e).slice(0, 300)
    await admin
      .from('donations')
      .update({ receipt_sent_at: null, receipt_error: message, receipt_attempts: (d.receipt_attempts ?? 0) + 1 })
      .eq('id', d.id)
    console.error('[webhook] receipt failed, released for retry', d.reference, message)
  }
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const sig = req.headers.get('stripe-signature')
  if (!secret || !sig) return new NextResponse('Missing webhook secret or signature', { status: 400 })

  const body = await req.text() // RAW body — required for signature verification

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret)
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed', err)
    return new NextResponse('Invalid signature', { status: 400 })
  }

  try {
    const admin = createAdminClient()
    const stripe = getStripe()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          if (!sub.metadata?.user_id && session.client_reference_id) {
            sub.metadata = { ...sub.metadata, user_id: session.client_reference_id }
          }
          await upsertFromSubscription(admin, sub)
        } else if (session.metadata?.kind === 'donation') {
          await recordDonation(admin, session)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await upsertFromSubscription(admin, event.data.object as Stripe.Subscription)
        break
      }
      default:
        break
    }
  } catch (err) {
    console.error('[stripe/webhook] handler error', err)
    return new NextResponse('Handler error', { status: 500 })
  }

  return NextResponse.json({ received: true })
}
