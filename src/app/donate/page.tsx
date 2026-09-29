/**
 * /donate — where every Donate button on the site goes (footer, phone menu).
 *
 * Politika's own look, by request (a green Onebyone-style hero was tried and
 * reverted): woven page, plain title, the three paragraphs on what the money
 * is for, then one white card holding the donation form: one-time only, the
 * donor types the amount (components/donate/donate-form.tsx).
 *
 * Onebyone takes the payment as the merchant, on Politika's behalf:
 * /api/donate/checkout asks Onebyone's server to open the Stripe checkout,
 * signed with DONATE_SHARED_SECRET. Until that is set in the environment the
 * form still shows, and its button says donations open soon.
 */

import type { Metadata } from 'next'
import { DonateForm } from '@/components/donate/donate-form'
import { BORDER, INK, MANROPE, SECONDARY, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

export const metadata: Metadata = {
  title: 'Support Politika',
  description: 'Politika is run independently and free to use. Donations help cover the costs of running it.',
}

// Read per request so setting the key switches the form on without a rebuild.
export const dynamic = 'force-dynamic'

const para: React.CSSProperties = { fontSize: 15, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 12px' }

export default function DonatePage() {
  const open = Boolean(process.env.DONATE_SHARED_SECRET)

  return (
    <div style={WOVEN_PAGE}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 'clamp(24px, 5vh, 48px) clamp(18px, 5vw, 36px) 64px' }}>
        <h1 style={{ fontSize: 'clamp(28px, 7vw, 36px)', fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.15, fontFamily: MANROPE, color: INK, margin: '0 0 10px' }}>
          Support Politika
        </h1>
        {/* The ask, short and bold, by request (two sentences read too long).
            The why is under "Why we ask for donations" below the form. */}
        <p style={{ fontSize: 19, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.3, letterSpacing: '-.01em', margin: '0 0 18px' }}>
          Make a donation to help keep Politika running.
        </p>
        {/* The form first, by request, then what the money is for. */}
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, background: '#fff', padding: '20px 20px 18px', boxShadow: '0 2px 8px rgba(42,18,6,.05)' }}>
          <DonateForm open={open} />
        </div>

        <p style={{ fontFamily: MANROPE, fontSize: 12.5, color: TERTIARY, textAlign: 'center', margin: '10px 0 22px' }}>
          Secured by Stripe
        </p>
        {/* What the money is for, in the owner's terms: run independently,
            working towards proper funding, and donations covering running
            costs until then. Under its own heading, by request, so it reads
            as the answer to a question rather than small print. */}
        <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.01em', lineHeight: 1.25, fontFamily: MANROPE, color: INK, margin: '0 0 8px' }}>
          Why we ask for donations
        </h2>
        <p style={para}>
          Politika is run independently. It isn&rsquo;t owned by a party, a media company or a government agency, and
          it&rsquo;s free for everyone to use.
        </p>
        <p style={para}>
          Our goal is to secure proper funding so Politika can keep growing. Until then, donations help cover the
          costs of running it: hosting, data, and the time it takes to keep every figure checked against its source.
        </p>
        <p style={{ ...para, margin: 0 }}>
          Every donation, big or small, helps keep the site online and free.
        </p>

      </div>
    </div>
  )
}
