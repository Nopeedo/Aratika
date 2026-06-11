/**
 * POST /api/stripe/checkout
 * Creates (or reuses) a Stripe customer for the signed-in user and starts a
 * subscription Checkout Session. Returns { url } for the client to redirect to.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const priceId = process.env.STRIPE_MONTHLY_PRICE_ID || process.env.STRIPE_PRICE_ID
  if (!priceId) return NextResponse.json({ error: 'STRIPE_MONTHLY_PRICE_ID is not set' }, { status: 500 })

  const site = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  try {
    const stripe = getStripe()
    const admin = createAdminClient()

    // Reuse an existing Stripe customer if we have one.
    const { data: existing } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let customerId = existing?.stripe_customer_id as string | undefined
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      })
      customerId = customer.id
      await admin.from('subscriptions').upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        status: 'incomplete',
      })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      subscription_data: { metadata: { user_id: user.id } },
      // Collect a card up front even though the price includes a free trial,
      // so the subscription auto-converts to paid when the trial ends.
      payment_method_collection: 'always',
      allow_promotion_codes: true,
      success_url: `${site}/dashboard?upgraded=1`,
      cancel_url: `${site}/subscription?canceled=1`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/checkout]', err)
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 500 })
  }
}
