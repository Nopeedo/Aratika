/**
 * /donate — where every Donate button on the site goes (footer, phone menu).
 *
 * Politika's own look, by request (a green Onebyone-style hero was tried and
 * reverted): woven page, plain title, the three paragraphs on what the money
 * is for, then one white card holding the donation form: one-time only, the
 * donor types the amount (components/donate/donate-form.tsx).
 *
 * POLITIKA IS THE MERCHANT (29 Sep 2026). Onebyone Project used to take the
 * payment on Politika's behalf, which is why this page once gated the form on
 * DONATE_SHARED_SECRET — the secret used to sign requests to Onebyone's
 * server. /api/donate/checkout now opens the Stripe session on Politika's own
 * account and needs STRIPE_SECRET_KEY, so that is what the gate checks. Gating
 * on the old secret meant the form could sit on "donations open soon" with
 * Stripe fully configured, or offer a button whose route would 503.
 */

import type { Metadata } from 'next'
import { DonateForm } from '@/components/donate/donate-form'
import { DONATIONS_ENABLED } from '@/constants/features'
import { SITE } from '@/constants/site'
import { BORDER, INK, MANROPE, SECONDARY, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

export const metadata: Metadata = {
  title: 'Support Politika',
  description: 'Politika is run independently and free to use. Donations help cover the costs of running it.',
}

// Read per request so setting the key switches the form on without a rebuild.
export const dynamic = 'force-dynamic'

const para: React.CSSProperties = { fontSize: 15, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 12px' }

export default function DonatePage() {
  // Mirrors the guard in /api/donate/checkout. If these two ever disagree, the
  // page and the route disagree about whether donations are open.
  const open = DONATIONS_ENABLED && Boolean(process.env.STRIPE_SECRET_KEY)

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

        {/* Who the money actually reaches, under "Why we ask for donations" by
            request. Politika is not yet a registered company or a charity, so a
            donation is a payment to a person, and the paragraphs above do not
            say so: "the costs of running it" reads as hosting bills. Someone
            giving money is entitled to know who receives it and that they get
            nothing back for it, before they give rather than after — a donor
            who works it out afterwards is the one who charges back. */}
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, background: '#fff', padding: '16px 18px', marginTop: 20 }}>
          <h3 style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: '-.01em', fontFamily: MANROPE, color: INK, margin: '0 0 8px' }}>
            Where your donation goes
          </h3>
          <p style={{ ...para, fontSize: 14, margin: '0 0 10px' }}>
            Politika isn&rsquo;t a registered company or a charity yet. Donations are paid to {SITE.promoter.name}, who
            builds and runs the site, and they go towards hosting and data and towards the time spent building Politika
            and checking every figure against its source.
          </p>
          <p style={{ ...para, fontSize: 14, margin: 0 }}>
            Because we aren&rsquo;t a registered charity, donations aren&rsquo;t tax-deductible and we can&rsquo;t issue
            a tax receipt. A donation isn&rsquo;t a payment for anything: everything on Politika is free, and giving or
            not giving changes nothing about what you can see.
          </p>
        </div>

      </div>
    </div>
  )
}
