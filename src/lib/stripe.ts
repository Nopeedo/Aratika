/**
 * Stripe server client (lazy). Constructed on first use so the app still builds
 * before STRIPE_SECRET_KEY is set. Never import this in client components.
 */

import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    _stripe = new Stripe(key)
  }
  return _stripe
}

/** Statuses that count as "premium". */
export const ACTIVE_STATUSES = ['active', 'trialing']
