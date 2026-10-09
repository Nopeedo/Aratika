/**
 * /links — the link-in-bio page.
 *
 * Reached from an Instagram or Facebook profile by someone who has never seen
 * politika.nz. One job, two taps available: the pledge, or the site. It runs
 * without any site chrome (ChromeGate in the root layout) — no navbar, no
 * footer, no companion widget.
 *
 * TWO LINKS ONLY, by request. An earlier version carried four, including an
 * enrol link to vote.nz; that one is gone and nothing is lost by it, because
 * the pledge flow points everyone at vote.nz to check enrolment at the end, and
 * vote.nz on the next screen.
 *
 * NO DONATE, and not only because it was asked for: this page is linked from
 * social media inside the regulated period, so it is material relating to an
 * election. Asking for money in the same breath as asking someone to vote is
 * the one thing that would make a non-partisan page look like something else.
 *
 * It carries its own promoter line for the same reason. Electoral Act 1993
 * s221A wants the name of the person at whose direction election material is
 * published plus contact details, and s204A as replaced on 1 January 2026
 * accepts a link to a page holding them, which is what /contact is.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { SITE } from '@/constants/site'
import { PLEDGE_ENABLED } from '@/constants/features'
import { BORDER, INK, JADE, MANROPE, SECONDARY, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

const DEEP = '#0E3F26'
const MINT = '#8FD3AC'

export const metadata: Metadata = {
  title: 'Politika',
  description: 'Work out your vote for the 2026 New Zealand general election. Non-partisan, free, and sourced.',
  // A doorway, not a destination. The pages it opens are the ones worth indexing.
  robots: { index: false, follow: true },
}

export default function LinksPage() {
  return (
    <div style={{ ...WOVEN_PAGE, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        width: '100%', maxWidth: 440, margin: '0 auto', flex: 1,
        padding: '52px 22px 36px', display: 'flex', flexDirection: 'column',
      }}>

        {/* The mark, in a ring. A bio page is recognised before it is read. */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 128, height: 128, borderRadius: '50%', background: DEEP,
            margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 30px -12px rgba(14,63,38,.5)',
          }}>
            <svg width="60" height="56" viewBox="0 0 28 26" aria-hidden="true">
              <g stroke={MINT} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 8 L14 2 L23 8" />
                <path d="M5 15 L14 9 L23 15" opacity="0.72" />
                <path d="M5 22 L14 16 L23 22" opacity="0.5" />
              </g>
            </svg>
          </div>

          <h1 style={{
            fontSize: 'clamp(34px, 9vw, 44px)', fontWeight: 800, letterSpacing: '-.035em',
            color: INK, fontFamily: MANROPE, margin: '22px 0 0', lineHeight: 1.1,
          }}>
            Politika
          </h1>
          <p style={{ fontSize: 16, fontWeight: 600, color: SECONDARY, fontFamily: MANROPE, margin: '10px 0 0', lineHeight: 1.5 }}>
            {SITE.tagline}
          </p>
          <p style={{ fontSize: 14, color: TERTIARY, fontFamily: MANROPE, margin: '8px 0 0', lineHeight: 1.5 }}>
            Independent and non-partisan. Free, with nothing held back.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginTop: 34 }}>
          {PLEDGE_ENABLED && (
            <Link href="/pledge" style={{ textDecoration: 'none' }}>
              <div style={{
                background: DEEP, borderRadius: 999, minHeight: 64,
                padding: '18px 26px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 10, fontFamily: MANROPE,
                fontSize: 17.5, fontWeight: 800, color: '#fff',
                boxShadow: '0 8px 22px -12px rgba(14,63,38,.55)',
              }}>
                Will you pledge to vote?
                <ArrowRight style={{ width: 18, height: 18, color: MINT, flexShrink: 0 }} />
              </div>
            </Link>
          )}

          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 999,
              minHeight: 64, padding: '18px 26px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 10, fontFamily: MANROPE,
              fontSize: 17.5, fontWeight: 800, color: INK,
            }}>
              Politika Home
              <ArrowRight style={{ width: 18, height: 18, color: JADE, flexShrink: 0 }} />
            </div>
          </Link>
        </div>

        {/* Driven by SITE.socials, so a new handle appears the moment it is added
            there rather than being forgotten here. */}
        {SITE.socials.length > 0 && (
          <div style={{ display: 'flex', gap: 9, justifyContent: 'center', flexWrap: 'wrap', marginTop: 30 }}>
            {SITE.socials.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="me noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44,
                  padding: '11px 18px', borderRadius: 999, background: '#fff',
                  border: `1px solid ${BORDER}`, color: SECONDARY,
                  fontFamily: MANROPE, fontSize: 13.5, fontWeight: 700, textDecoration: 'none',
                }}
              >
                {s.label} <ExternalLink style={{ width: 12, height: 12, opacity: .6 }} />
              </a>
            ))}
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 34, textAlign: 'center' }}>
          <Link href="/" style={{ fontSize: 14.5, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
            politika.nz
          </Link>
          <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '12px 0 0', lineHeight: 1.5 }}>
            Promoted by {SITE.promoter.name}, politika.nz/contact
          </p>
        </div>
      </div>
    </div>
  )
}
