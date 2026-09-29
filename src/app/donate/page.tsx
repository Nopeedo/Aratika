/**
 * /donate — where every Donate button on the site goes (footer, phone menu).
 * By request it's the site's own page rather than a jump straight to Stripe.
 * While SITE.donateUrl is empty it says donations open soon; once it's set,
 * the card carries the button to Onebyone's Stripe page, which processes the
 * payment on Politika's behalf.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { Heart, ArrowRight } from 'lucide-react'
import { SITE } from '@/constants/site'
import { BORDER, INK, JADE, MANROPE, SECONDARY, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

export const metadata: Metadata = {
  title: 'Support Politika',
  description: 'Politika is run independently and free to use. Donations help cover the costs of running it.',
}

export default function DonatePage() {
  return (
    <div style={WOVEN_PAGE}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 'clamp(24px, 5vh, 48px) clamp(18px, 5vw, 36px) 64px' }}>
        <h1 style={{ fontSize: 'clamp(28px, 7vw, 36px)', fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.15, fontFamily: MANROPE, color: INK, margin: '0 0 12px' }}>
          Support Politika
        </h1>
        {/* What the money is for, in the owner's terms, by request: run
            independently, working towards proper funding, and donations
            covering running costs until then. */}
        <p style={{ fontSize: 15, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 12px' }}>
          Politika is run independently. It isn&rsquo;t owned by a party, a media company or a government agency, and
          it&rsquo;s free for everyone to use.
        </p>
        <p style={{ fontSize: 15, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 12px' }}>
          Our goal is to secure proper funding so Politika can keep growing. Until then, donations help cover the
          costs of running it: hosting, data, and the time it takes to keep every figure checked against its source.
        </p>
        <p style={{ fontSize: 15, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 20px' }}>
          Every donation, big or small, helps keep the site online and free.
        </p>

        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, background: '#fff', padding: '18px 20px', boxShadow: '0 2px 8px rgba(42,18,6,.05)' }}>
          {SITE.donateUrl ? (
            <>
              <div style={{ fontSize: 20, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 6px', lineHeight: 1.25 }}>
                Make a donation
              </div>
              <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55, margin: '0 0 14px' }}>
                Card payments are processed by Onebyone Project on Politika&rsquo;s behalf, so that&rsquo;s the name
                you&rsquo;ll see on your statement.
              </p>
              <a href={SITE.donateUrl} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 999,
                background: JADE, color: '#fff', fontSize: 14.5, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none',
              }}>
                <Heart style={{ width: 16, height: 16 }} /> Donate now
              </a>
            </>
          ) : (<>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE }}>
            <Heart style={{ width: 14, height: 14 }} /> Opening soon
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '8px 0 6px', lineHeight: 1.25 }}>
            Donations aren&rsquo;t open yet
          </div>
          <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55, margin: 0 }}>
            We&rsquo;re setting up card payments now. When they open, payments will be processed by Onebyone Project on
            Politika&rsquo;s behalf, so that&rsquo;s the name you&rsquo;ll see on your statement.
          </p>
          {SITE.email && (
            <p style={{ fontSize: 13, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.55, margin: '10px 0 0' }}>
              Want to help sooner? Email <a href={`mailto:${SITE.email}`} style={{ color: JADE, fontWeight: 700, textDecoration: 'none' }}>{SITE.email}</a>.
            </p>
          )}
          </>)}
        </div>

        <Link href="/elections/2026" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 18, fontSize: 13.5, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
          Back to the 2026 Election <ArrowRight style={{ width: 14, height: 14 }} />
        </Link>
      </div>
    </div>
  )
}
