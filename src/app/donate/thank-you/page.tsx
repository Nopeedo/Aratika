/**
 * /donate/thank-you — where Stripe Checkout returns a donor after paying.
 *
 * Nothing is looked up here. The payment is confirmed server to server:
 * Stripe posts checkout.session.completed to /api/stripe/webhook, which writes
 * the row in public.donations that scripts/donation-receipts.mjs receipts from
 * hello@politika.nz, and records the newsletter tick if it was ticked.
 *
 * (Until 29 Sep 2026 this went through Onebyone Project's server and
 * /api/donate/notify. Politika is its own merchant now — see
 * api/donate/checkout for why.)
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { INK, JADE, MANROPE, SECONDARY, WOVEN_PAGE } from '@/constants/theme'

export const metadata: Metadata = { title: 'Thank you', robots: { index: false } }

/**
 * Awaiting searchParams makes this route dynamic. That trade is wrong on
 * /mps and /bills, which is why they refuse it — but this page is noindexed
 * and only ever reached once, straight after a payment, so there is nothing
 * to prerender for.
 *
 * The reference is validated before it is shown. It arrives in the URL, so
 * anyone can put anything in it; React escapes the text, so this is not an
 * XSS — but attacker-chosen words rendered under Politika’s letterhead are
 * a phishing line ("your reference: call 0800…"). Only the shape
 * /api/donate/checkout actually generates is echoed back.
 */
export default async function DonateThankYouPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref: rawRef } = await searchParams
  const reference = rawRef && /^POL-[A-Z0-9]{1,12}$/.test(rawRef) ? rawRef : null
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
          Your donation helps keep Politika running, independent and free for everyone. Your receipt will arrive
          by email from hello@politika.nz shortly.
        </p>
        {reference && (
          <p style={{ fontFamily: MANROPE, fontSize: 13, lineHeight: 1.6, color: SECONDARY, margin: '-12px 0 22px' }}>
            Your reference: <strong style={{ color: INK }}>{reference}</strong>
          </p>
        )}
        <Link href="/elections/2026" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: MANROPE, fontSize: 14, fontWeight: 800, color: JADE, textDecoration: 'none' }}>
          Back to the 2026 Election <ArrowRight style={{ width: 15, height: 15 }} />
        </Link>
      </div>
    </div>
  )
}
