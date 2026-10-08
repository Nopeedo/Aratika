/**
 * /links — the link-in-bio page.
 *
 * Reached from an Instagram or Facebook profile by someone who has never seen
 * politika.nz. One job: send them to the right place in one tap. So it runs
 * without the site chrome (see ChromeGate in the root layout) — no navbar, no
 * footer, no companion widget.
 *
 * NO DONATE, by request and for a better reason than preference: this page is
 * linked from social during the regulated period, so it is material relating to
 * an election. Asking for money in the same breath as asking someone to vote is
 * the one thing that would make a non-partisan enrolment page look like
 * something else.
 *
 * It carries its own promoter line for the same reason. Electoral Act 1993
 * s221A wants the name of the person at whose direction election material is
 * published, plus contact details — and s204A, as replaced on 1 January 2026,
 * accepts a link to a page holding them, which is what /contact is.
 *
 * The pledge link only appears while the pledge is live. A bio link that leads
 * to a redirect is worse than one link fewer.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { LogoMark } from '@/components/brand/logo-mark'
import { SITE } from '@/constants/site'
import { PLEDGE_ENABLED } from '@/constants/features'
import { BORDER, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

const DEEP = '#0E3F26'
const MINT = '#8FD3AC'

export const metadata: Metadata = {
  title: 'Politika',
  description: 'Work out your vote for the 2026 New Zealand general election. Non-partisan, free, and sourced.',
  // A bio link is not a page anyone should reach from a search result — it is a
  // doorway, and the pages it opens are the ones worth indexing.
  robots: { index: false, follow: true },
}

export default function LinksPage() {
  return (
    <div style={{ ...WOVEN_PAGE, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        width: '100%', maxWidth: 460, margin: '0 auto', flex: 1,
        padding: '56px 20px 40px', display: 'flex', flexDirection: 'column',
      }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 11 }}>
            <LogoMark size={42} className="h-[42px] w-auto shrink-0" />
            <Image src="/politika-wordmark.svg" alt={SITE.name} width={190} height={53} unoptimized style={{ height: 48, width: 'auto' }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: SECONDARY, fontFamily: MANROPE, margin: '14px 0 0' }}>
            {SITE.tagline}
          </p>
          <p style={{ fontSize: 13.5, color: TERTIARY, fontFamily: MANROPE, margin: '6px 0 0', lineHeight: 1.5 }}>
            Independent and non-partisan. Free, with nothing held back.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 30 }}>

          {/* The campaign leads, while it is running. */}
          {PLEDGE_ENABLED && (
            <Link href="/pledge" style={{ textDecoration: 'none' }}>
              <div style={{
                background: DEEP, borderRadius: 18, padding: '22px 22px 20px',
                fontFamily: MANROPE, color: '#fff',
              }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.14em', color: MINT }}>
                  THE PLEDGE
                </span>
                <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-.02em', margin: '8px 0 4px', lineHeight: 1.2 }}>
                  Will you pledge to vote?
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14.5, fontWeight: 700, color: MINT }}>
                  Add your name <ArrowRight style={{ width: 15, height: 15 }} />
                </div>
              </div>
            </Link>
          )}

          <Card
            href="/"
            eyebrow="START HERE"
            title="Work out your vote"
            sub="Every party, side by side on the issues that matter to you."
          />

          <Card
            href="https://vote.nz/enrolling/enrol-or-update/enrol-or-update-online"
            external
            eyebrow="CLOSES 25 OCTOBER"
            title="Enrol, or check you&rsquo;re enrolled"
            sub="Enrolment closes midnight, Sunday 25 October. Earlier than last election."
          />

          <Card
            href="/map"
            eyebrow="YOUR ELECTORATE"
            title="Find your local MP"
            sub="Type your address and see your electorate, and who&rsquo;s standing in it."
          />
        </div>

        {/* Socials, driven by SITE.socials so a new handle appears here the
            moment it is added there and nothing goes stale. */}
        {SITE.socials.length > 0 && (
          <div style={{ display: 'flex', gap: 9, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 }}>
            {SITE.socials.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="me noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44,
                  padding: '11px 18px', borderRadius: 999, background: SURFACE,
                  border: `1px solid ${BORDER}`, color: SECONDARY,
                  fontFamily: MANROPE, fontSize: 13.5, fontWeight: 700, textDecoration: 'none',
                }}
              >
                {s.label} <ExternalLink style={{ width: 12, height: 12, opacity: .6 }} />
              </a>
            ))}
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 36, textAlign: 'center' }}>
          <Link href="/" style={{ fontSize: 14.5, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
            politika.nz
          </Link>
          {/* s221A: the name of the person at whose direction this is published,
              and contact details. /contact holds them, which s204A allows. */}
          <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '12px 0 0', lineHeight: 1.5 }}>
            Promoted by {SITE.promoter.name}, politika.nz/contact
          </p>
        </div>
      </div>
    </div>
  )
}

function Card({ href, eyebrow, title, sub, external }: {
  href: string; eyebrow: string; title: string; sub: string; external?: boolean
}) {
  const inner = (
    <div style={{
      background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18,
      padding: '20px 22px', fontFamily: MANROPE,
    }}>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.13em', color: JADE }}>
        {eyebrow}
      </span>
      <div style={{
        fontSize: 19.5, fontWeight: 800, letterSpacing: '-.015em', color: INK,
        margin: '7px 0 4px', lineHeight: 1.25, display: 'flex',
        alignItems: 'center', gap: 7,
      }}>
        <span dangerouslySetInnerHTML={{ __html: title }} />
        {external
          ? <ExternalLink style={{ width: 15, height: 15, color: TERTIARY, flexShrink: 0 }} />
          : <ArrowRight style={{ width: 16, height: 16, color: JADE, flexShrink: 0 }} />}
      </div>
      <p style={{ fontSize: 13.5, color: SECONDARY, lineHeight: 1.5, margin: 0 }}
         dangerouslySetInnerHTML={{ __html: sub }} />
    </div>
  )
  return external
    ? <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{inner}</a>
    : <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link>
}
