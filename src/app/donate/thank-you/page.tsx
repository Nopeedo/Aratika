/**
 * /donate/thank-you — where Stripe Checkout returns a donor after paying.
 *
 * Also where the donate form's "Get email updates" tick box is honoured.
 * Checkout is where the donor gives their email, so the address only exists
 * once they're back: this reads the session (on Onebyone's account, via
 * DONATE_STRIPE_SECRET_KEY) and, when the payment is complete, came from
 * Politika's form and had the box ticked, adds the address to
 * newsletter_signups with source 'donate'. Same table and same rule as the
 * homepage sign-up: confirmed_at stays null, so nothing sends to it until a
 * confirmation step exists. Any failure here is swallowed: the donor still
 * gets their thank-you.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import Stripe from 'stripe'
import { ArrowRight } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { INK, JADE, MANROPE, SECONDARY, WOVEN_PAGE } from '@/constants/theme'

export const metadata: Metadata = { title: 'Thank you', robots: { index: false } }
export const dynamic = 'force-dynamic'

async function recordEmailOptIn(sessionId: string) {
  const key = process.env.DONATE_STRIPE_SECRET_KEY
  if (!key || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return
  try {
    const session = await new Stripe(key).checkout.sessions.retrieve(sessionId)
    const email = session.customer_details?.email?.trim().toLowerCase()
    if (
      session.payment_status !== 'paid' ||
      session.metadata?.source !== 'politika' ||
      session.metadata?.email_updates !== 'true' ||
      !email
    ) return
    await createAdminClient()
      .from('newsletter_signups')
      .upsert({ email, source: 'donate' }, { onConflict: 'email', ignoreDuplicates: true })
  } catch (e) {
    console.error('[donate/thank-you] email opt-in not recorded', e)
  }
}

export default async function DonateThankYouPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams
  if (session_id) await recordEmailOptIn(session_id)

  return (
    <div style={WOVEN_PAGE}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 'clamp(40px, 8vh, 80px) clamp(18px, 5vw, 36px) 64px', textAlign: 'center' }}>
        <svg viewBox="0 0 24 24" width="56" height="56" aria-hidden style={{ display: 'block', margin: '0 auto 14px' }}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#FF6B85" />
        </svg>
        <h1 style={{ fontFamily: MANROPE, fontWeight: 800, fontSize: 'clamp(28px, 7vw, 36px)', letterSpacing: '-.02em', color: INK, margin: '0 0 10px' }}>
          Thank you
        </h1>
        <p style={{ fontFamily: MANROPE, fontSize: 15, lineHeight: 1.6, color: SECONDARY, margin: '0 0 22px' }}>
          Your donation helps keep Politika running, independent and free for everyone. A receipt is on its way to
          your inbox.
        </p>
        <Link href="/elections/2026" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: MANROPE, fontSize: 14, fontWeight: 800, color: JADE, textDecoration: 'none' }}>
          Back to the 2026 Election <ArrowRight style={{ width: 15, height: 15 }} />
        </Link>
      </div>
    </div>
  )
}
