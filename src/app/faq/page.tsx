/**
 * /faq — Help & frequently asked questions. Written to build trust fast for a
 * political-information site: neutrality, who we are, funding, sources, currency,
 * corrections, and how to get started. Honest — nothing here over-claims a
 * charitable entity or funding that isn't yet in place.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { HelpCircle, Mail, ArrowUpRight } from 'lucide-react'
import { SectionDivider } from '@/components/ui/section-divider'
import { SITE } from '@/constants/site'

export const metadata: Metadata = {
  title: 'Help & FAQ',
  description: 'How Arapono stays non-partisan, where our information comes from, how we’re funded, and how to get started.',
}

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C', BODY = '#33373f'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

function QA({ q, children, first }: { q: string; children: React.ReactNode; first?: boolean }) {
  return (
    <div style={{ padding: '18px 0', borderTop: first ? 'none' : `1px solid ${BORDER}` }}>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 6px', lineHeight: 1.35 }}>{q}</h3>
      <div style={{ fontSize: 14, color: BODY, fontFamily: MANROPE, lineHeight: 1.7 }}>{children}</div>
    </div>
  )
}

const linkS: React.CSSProperties = { color: JADE, fontWeight: 700, textDecoration: 'none' }

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, margin: '0 0 4px' }}>{label}</div>
      {children}
    </div>
  )
}

export default function FaqPage() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Header */}
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '44px 36px 34px' }}>
          <div style={{ marginBottom: 10 }}><SectionDivider type="official" label="Help" /></div>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 8px', lineHeight: 1.1 }}>Frequently asked questions</h1>
          <p style={{ fontSize: 16, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.6, maxWidth: 620 }}>
            The honest answers — who we are, how we stay neutral, where our information comes from, and how to get started.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '30px 36px 64px', display: 'flex', flexDirection: 'column', gap: 34 }}>

        <Section label="Trust & independence">
          <QA q="Is Arapono politically neutral?" first>
            Yes — non-partisanship is the whole point. We present every party the same way, in their own words, and we never
            tell you who to vote for. We don’t take positions on issues, endorse candidates, or run opinion pieces, and every
            claim is sourced to an official record you can check yourself.
          </QA>
          <QA q="Do you tell me who to vote for?">
            Never. Arapono exists to help you understand your choices and feel confident — the decision is entirely yours.
            Even the personal <Link href="/start" style={linkS}>compass</Link> shows where you overlap with each party without
            picking a winner.
          </QA>
          <QA q="Who is behind Arapono?">
            Arapono is an independent, non-partisan platform — not affiliated with any political party, candidate, or lobby
            group. We are working to formalise it as a registered charitable trust with an independent board, so that its
            independence and governance are structurally guaranteed rather than just promised.
          </QA>
          <QA q="How is Arapono funded — and will it stay free?">
            Arapono is free, with no ads and no paywall, and we’re committed to keeping it that way. Our model is civic and
            philanthropic grant funding — not advertising, subscriptions, or selling your data — so the platform can stay open
            to everyone. We’ll always be transparent about where our support comes from.
          </QA>
          <QA q="Where does your information come from?">
            Official, public sources — the New Zealand Parliament, the Electoral Commission, Stats NZ, the Treasury,
            legislation.govt.nz, and each party’s own published policy. Wherever we state a fact or figure, we link to its
            source so you can verify it. See <Link href="/about#sources" style={linkS}>Our Sources</Link> for the full list.
          </QA>
          <QA q="How current is the information?">
            We keep it current continuously — the news feed refreshes several times a day, and parliamentary and election data
            is updated regularly. Where a figure has an “as at” date, we show it, so you always know how fresh it is.
          </QA>
          <QA q="What if you get something wrong?">
            Tell us and we’ll fix it fast. Accuracy is what makes Arapono worth using, so we check every report against the
            official source and correct it promptly. Use <Link href="/contact" style={linkS}>submit a correction</Link> — and
            thank you, it keeps the platform trustworthy.
          </QA>
        </Section>

        <Section label="Using Arapono">
          <QA q="Do I need an account? Is it really free?" first>
            The whole platform is free, and you don’t need an account to use it. An optional free account lets you track the
            parties, MPs and issues you care about — but everything essential works without signing in.
          </QA>
          <QA q="I’m new to politics — where do I start?">
            Right at the top of the <Link href="/" style={linkS}>home page</Link>. Use “Start here” to explore the parties, or
            take the 3-minute compass to find the issues that matter to you. And if a political word ever trips you up, switch
            on <strong>Explain terms</strong> in the menu — it adds plain-language definitions to key words across the site.
          </QA>
          <QA q="Does it work on my phone?">
            Yes — Arapono works on phones, tablets and computers.
          </QA>
          <QA q="What data do you collect about me?">
            As little as possible. We use privacy-respecting analytics to understand what’s useful, and if you create an
            account we store only what’s needed to run it. See our <Link href="/privacy" style={linkS}>privacy policy</Link> for
            the detail.
          </QA>
        </Section>

        {/* Still have a question */}
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '22px 24px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fff', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HelpCircle style={{ width: 21, height: 21, color: JADE }} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>Still have a question?</h2>
            <p style={{ fontSize: 14, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 12px' }}>
              We’d genuinely like to hear from you — questions, feedback, partnerships, or media.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href={`mailto:${SITE.email}?subject=Arapono%20enquiry`} style={btn(true)}><Mail style={ic} /> Email us</a>
              <Link href="/contact" style={btn(false)}>Contact &amp; corrections <ArrowUpRight style={ic} /></Link>
            </div>
          </div>
        </div>

        <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>
          Arapono is an independent platform and can’t help with official or urgent matters. To enrol or vote, use the
          official service at{' '}
          <a href="https://www.vote.nz" target="_blank" rel="noopener noreferrer" style={linkS}>vote.nz</a>.
        </p>
      </div>
    </div>
  )
}

const ic: React.CSSProperties = { width: 14, height: 14 }
function btn(primary: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, fontFamily: MANROPE,
    padding: '10px 16px', borderRadius: 11, textDecoration: 'none',
    background: primary ? JADE : '#fff', color: primary ? '#fff' : INK, border: primary ? 'none' : `1px solid ${BORDER}`,
  }
}
