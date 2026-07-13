/**
 * POST /api/stripe/webhook
 * Stripe → Arapono. Verifies the signature against the RAW body, then keeps the
 * subscriptions table in sync. Writes use the service-role client (bypasses RLS).
 *
 * Local testing:  stripe listen --forward-to localhost:3000/api/stripe/webhook
 */

import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

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
