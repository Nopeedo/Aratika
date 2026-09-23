/**
 * /budget — a public, non-partisan explainer of Budget 2026.
 *
 * Credibility notes (see also src/constants/budget-2026.ts):
 *  - The Budget is an official Crown/Treasury document, NOT a party document.
 *    The page says so plainly and attributes every figure to The Treasury.
 *  - Figures are presented neutrally; no causation is claimed; the macro outlook
 *    is kept qualitative where Treasury published it qualitatively.
 *
 * Redesigned against docs/DESIGN-SPEC.md, 24 September 2026. What the shell
 * lost, and where each piece went:
 *  - the standfirst (§6.1, "the homepage lost three standfirsts") → the h1 (i),
 *    with the delivery date kept as the /bills eyebrow line under the title
 *  - the "this is the Government's Budget, not a party's" callout, 321px of
 *    orientation between the reader and the money → the same (i) (§1.2)
 *  - the outlook's forecast caveat, the in-context baseline box and the tag
 *    legend → the (i) beside the heading each one qualifies
 *  - the source footer's five lines of licensing prose → the (i), leaving the
 *    ONE dated 11.5px line /bills closes with (bills/page.tsx:132)
 *  - eleven always-expanded sector cards printing 51 funding lines on arrival
 *    → §2.3 tiles that open a §2.4 panel (§1.1), in budget-sectors.tsx
 *  - six different box treatments doing the job of "a card" → two, the tile and
 *    the panel (§1.4: extra data is allowed, extra design is not)
 *  - three cross-link cards, two of which landed in the same product → two §2.6
 *    signposts
 * The delivery date was stated three times on this page; it is stated once now.
 */

import type { Metadata } from 'next'
import { ExternalLink, Landmark, Scale, ClipboardCheck } from 'lucide-react'
import { SectionDivider } from '@/components/ui/section-divider'
import { SignShape } from '@/components/ui/sign-link'
import { AboutBudget, AboutOutlook, AboutSectors, AboutThemes } from '@/components/budget/about-budget'
import { BudgetSectors, BudgetOutlook } from '@/components/budget/budget-sectors'
import { BudgetThemes } from '@/components/budget/budget-themes'
import { BUDGET_META } from '@/constants/budget-2026'
import { BORDER, INK, JADE, JADE_DARK, MANROPE, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

export const metadata: Metadata = {
  title: 'Budget 2026: what the Government is spending',
  description:
    'A plain-English, non-partisan breakdown of New Zealand’s Budget 2026: where the money goes by sector, key initiatives and the fiscal outlook. Sourced from The Treasury.',
}

/** 1080, the content column /bills, /parties and /elections use, so every block
 *  on the site starts and ends on the same two vertical lines at 1920 (§5.19).
 *  This page was 1100 and sat 20px wider than its neighbours. */
const COL = 1080

export default function BudgetPage() {
  return (
    <div style={WOVEN_PAGE}>
      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: COL, margin: '0 auto', padding: '40px clamp(18px, 5vw, 36px) 30px' }}>
          <div style={{ marginBottom: 12 }}>
            <SectionDivider type="official" label="Official: The Treasury" />
          </div>

          {/* §3.4: clamp(30px, 5vw, 46px) never fired on a phone — 5vw is
              18.75px at 375, so the h1 rendered at its 30px floor and
              "Budget 2026: where the money goes" wrapped to two 32px lines.
              /bills uses clamp(26px, 7vw, 40px), where 7vw is 26.25px at 375
              and the clamp actually scales. Matched. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'clamp(26px, 7vw, 40px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.08 }}>
              Budget {BUDGET_META.year}: where the money goes
            </h1>
            <AboutBudget />
          </div>

          {/* The /bills eyebrow (bills/page.tsx:96). It dates the whole page,
              which is why that line lives under the title there. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <Landmark style={{ width: 16, height: 16, color: JADE_DARK }} />
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: JADE_DARK, fontFamily: MANROPE }}>
              Delivered {BUDGET_META.deliveredOn}
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: COL, margin: '0 auto', padding: '26px clamp(18px, 5vw, 36px) 72px' }}>
        {/* ── What it says it does (themes) ───────────────────── */}
        <SectionHead>
          <h2 style={h2}>What Budget {BUDGET_META.year} sets out to do</h2>
          <AboutThemes />
        </SectionHead>
        <div style={{ marginBottom: 40 }}>
          <BudgetThemes />
        </div>

        {/* ── Outlook ─────────────────────────────────────────── */}
        <SectionHead>
          <h2 style={h2}>The outlook</h2>
          <AboutOutlook />
        </SectionHead>
        <div style={{ marginBottom: 42 }}>
          <BudgetOutlook />
        </div>

        {/* ── Sector breakdown ────────────────────────────────── */}
        <SectionHead>
          <h2 style={h2}>Where the money goes</h2>
          <AboutSectors />
        </SectionHead>
        <BudgetSectors />

        {/* ── Election context / cross-links ──────────────────── */}
        {/* §2.6 signposts, one per row, pulled out to the page gutter so all of
            them start on the same vertical line as each other rather than on
            the text column's inset edge (§8, "see the edges dont align").

            Two, not three. "Compare all parties" pointed at /policies, which
            redirects into the topic pages the first signpost already lands in:
            two links into one product from one block (§1.3). Nothing is lost,
            /policies/economy carries the reader into the same comparison. */}
        <h2 style={{ ...h2, marginTop: 48, marginBottom: 14 }}>Put it in context</h2>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, marginLeft: 'calc(-1 * clamp(18px, 5vw, 36px))' }}>
          <SignShape href="/policies/economy" color={JADE} fg="#fff" icon={<Scale style={{ width: 16, height: 16 }} />}>
            Compare party economic policy
          </SignShape>
          <SignShape href="/record" color={JADE_DARK} fg="#fff" icon={<ClipboardCheck style={{ width: 16, height: 16 }} />}>
            Were the promises funded?
          </SignShape>
        </div>

        {/* ── Source line ─────────────────────────────────────── */}
        {/* ONE 11.5px TERTIARY line, the shape /bills closes with. The five
            lines of licensing prose that stood here are in the h1's (i): they
            explain, they do not inform (§1.2). */}
        <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '34px 0 0', lineHeight: 1.6 }}>
          Source: {BUDGET_META.sourceLabel}, Budget {BUDGET_META.year}, delivered {BUDGET_META.deliveredOn}.{' '}
          <a href={BUDGET_META.sourceUrl} target="_blank" rel="noopener noreferrer" style={sourceLink}>
            Budget at a Glance <ExternalLink style={{ width: 11, height: 11, display: 'inline' }} />
          </a>{' '}
          <a href={BUDGET_META.fiscalDataUrl} target="_blank" rel="noopener noreferrer" style={sourceLink}>
            Treasury fiscal data <ExternalLink style={{ width: 11, height: 11, display: 'inline' }} />
          </a>
        </p>
      </div>
    </div>
  )
}

/** Heading and its (i) on one row, the /bills arrangement. */
function SectionHead({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>{children}</div>
}

/* 24px, the literal values at bills/page.tsx:120 and defining-bills.tsx:107.
   All four headings on this page were 19px under a 30px h1, so the page had no
   heading level at all and every section read as a caption (§4, "headings match
   their peers"). */
const h2: React.CSSProperties = {
  fontSize: 24, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0, letterSpacing: '-.025em',
}

const sourceLink: React.CSSProperties = { color: JADE, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }
