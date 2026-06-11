/**
 * POST /api/stripe/portal
 * Opens the Stripe Billing Portal so a member can manage or cancel their plan.
 * Returns { url } for the client to redirect to.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const site = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    const customerId = data?.stripe_customer_id as string | undefined
    if (!customerId) return NextResponse.json({ error: 'No billing account found' }, { status: 404 })

    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${site}/dashboard`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/portal]', err)
    return NextResponse.json({ error: 'Could not open billing portal' }, { status: 500 })
  }
}
