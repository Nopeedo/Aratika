/**
 * /budget — a public, non-partisan explainer of Budget 2026.
 *
 * Credibility notes (see also src/constants/budget-2026.ts):
 *  - The Budget is an official Crown/Treasury document, NOT a party document.
 *    The page says so plainly and attributes every figure to The Treasury.
 *  - Figures are presented neutrally; no causation is claimed; the macro outlook
 *    is kept qualitative where Treasury published it qualitatively.
 */

import type { Metadata } from 'next'
import * as React from 'react'
import Link from 'next/link'
import {
  HeartPulse, GraduationCap, Scale, Construction, Home, Fuel, Shield, Zap,
  Landmark, PiggyBank, Boxes, ExternalLink, Info, TrendingUp, Wallet, ArrowRight,
} from 'lucide-react'
import { SectionDivider } from '@/components/ui/section-divider'
import {
  BUDGET_META, BUDGET_THEMES, BUDGET_OUTLOOK, BUDGET_SECTORS, KIND_LABEL,
  type BudgetKind,
} from '@/constants/budget-2026'
import { BUDGET_BASELINE } from '@/constants/budget-links'

export const metadata: Metadata = {
  title: 'Budget 2026 — what the Government is spending',
  description:
    'A plain-English, non-partisan breakdown of New Zealand’s Budget 2026: where the money goes by sector, key initiatives and the fiscal outlook. Sourced from The Treasury.',
}

const INK = '#0c0e12', SECONDARY = '#6b7078', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const SECTOR_ICON: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = {
  health: HeartPulse, education: GraduationCap, 'law-order': Scale,
  infrastructure: Construction, 'housing-welfare': Home, 'cost-of-living': Fuel,
  defence: Shield, energy: Zap, revenue: Landmark, savings: PiggyBank, other: Boxes,
}

const KIND_COLOR: Record<BudgetKind, { bg: string; fg: string }> = {
  operating: { bg: '#ecfdf5', fg: '#1F8A4C' },
  capital: { bg: '#eef4ff', fg: '#2563eb' },
  saving: { bg: '#fef3e7', fg: '#b45309' },
  mixed: { bg: '#f3effe', fg: '#7c3aed' },
}

export default function BudgetPage() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="bg-dot-grid" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 36px 30px' }}>
          <div style={{ marginBottom: 12 }}>
            <SectionDivider type="official" label="Official — The Treasury" />
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 46px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.08 }}>
            Budget {BUDGET_META.year}: where the money goes
          </h1>
          <p style={{ fontSize: 16, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: '10px 0 0', maxWidth: 680, lineHeight: 1.55 }}>
            Delivered {BUDGET_META.deliveredOn}. A plain-English, non-partisan breakdown of what the
            Government is spending, by sector — with every figure taken from The Treasury.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '26px 36px 72px' }}>
        {/* ── "What this is" credibility callout ──────────────── */}
        <div style={{ display: 'flex', gap: 12, padding: '16px 18px', background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: 14, marginBottom: 30 }}>
          <Info style={{ width: 19, height: 19, color: JADE, flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13.5, lineHeight: 1.6, color: '#3f444c', fontFamily: MANROPE }}>
            <strong style={{ color: INK }}>This is the Government’s Budget, not a party’s.</strong>{' '}
            The Budget is an official document published by The Treasury and presented by the {BUDGET_META.financeMinister}.
            It was delivered by the {BUDGET_META.governmentLabel}. We present the figures neutrally and don’t take a side on them.
            <span style={{ display: 'block', marginTop: 6, color: SECONDARY, fontSize: 12.5 }}>
              {BUDGET_META.fundingNote}
            </span>
          </div>
        </div>

        {/* ── What it says it does (themes) ───────────────────── */}
        <h2 style={sectionH2()}>What Budget {BUDGET_META.year} sets out to do</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12, marginBottom: 40 }}>
          {BUDGET_THEMES.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 16px', border: `1px solid ${BORDER}`, borderRadius: 12 }}>
              <span style={{ width: 24, height: 24, borderRadius: 7, background: '#ecfdf5', color: JADE, fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: MANROPE }}>{i + 1}</span>
              <span style={{ fontSize: 13.5, lineHeight: 1.5, color: '#3f444c', fontFamily: MANROPE }}>{t}</span>
            </div>
          ))}
        </div>

        {/* ── Outlook ─────────────────────────────────────────── */}
        <h2 style={sectionH2()}>The outlook</h2>
        <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 14px', maxWidth: 680 }}>
          Treasury publishes these as forecasts. We quote them as stated and don’t add precise figures
          beyond what Treasury put in words on its summary.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14, marginBottom: 42 }}>
          {[
            { ...BUDGET_OUTLOOK.economic, icon: TrendingUp },
            { ...BUDGET_OUTLOOK.fiscal, icon: Wallet },
          ].map((o) => (
            <div key={o.title} style={{ padding: '18px 20px', border: `1px solid ${BORDER}`, borderRadius: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                <o.icon style={{ width: 18, height: 18, color: JADE }} />
                <span style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{o.title}</span>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#3f444c', fontFamily: MANROPE, margin: '0 0 10px' }}>{o.summary}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {o.indicators.map((ind) => (
                  <span key={ind} style={{ fontSize: 11.5, fontWeight: 600, color: SECONDARY, background: '#f4f4f2', borderRadius: 6, padding: '3px 8px', fontFamily: MANROPE }}>{ind}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── In context (what's already in place) ────────────── */}
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px', marginBottom: 42, background: '#f8fafc' }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 8 }}>
            In context — what’s already in place
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {BUDGET_BASELINE.points.map((pt, i) => (
              <li key={i} style={{ fontSize: 13, color: '#3f444c', fontFamily: MANROPE, lineHeight: 1.55 }}>{pt}</li>
            ))}
          </ul>
          <p style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, margin: '10px 0 0', lineHeight: 1.5 }}>
            New Budget funding (below) is mostly money added <em>on top of</em> existing spending — read it against this baseline.
          </p>
          <a href={BUDGET_BASELINE.source.url} target="_blank" rel="noopener noreferrer" style={{ ...verifyLink(), marginTop: 8 }}>
            {BUDGET_BASELINE.source.label} <ExternalLink style={{ width: 13, height: 13 }} />
          </a>
        </div>

        {/* ── Sector breakdown ────────────────────────────────── */}
        <h2 style={sectionH2()}>Where the money goes</h2>
        <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 18px', maxWidth: 680 }}>
          New funding by area. Each figure is tagged{' '}
          <Chip k="operating" /> <Chip k="capital" /> <Chip k="saving" /> so you can see what’s ongoing
          spending, one-off investment, or a saving.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 16 }}>
          {BUDGET_SECTORS.map((s) => {
            const Icon = SECTOR_ICON[s.key] ?? Boxes
            return (
              <div key={s.key} style={{ border: `1px solid ${BORDER}`, borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 4 }}>
                  <span style={{ width: 38, height: 38, borderRadius: 11, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 19, height: 19, color: JADE }} />
                  </span>
                  <div>
                    <div style={{ fontSize: 15.5, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.15 }}>{s.label}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: JADE, fontFamily: MANROPE }}>{s.headline}</div>
                  </div>
                </div>
                <p style={{ fontSize: 12.5, lineHeight: 1.5, color: SECONDARY, fontFamily: MANROPE, margin: '6px 0 12px' }}>{s.blurb}</p>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {s.items.map((it, i) => (
                    <li key={i} style={{ display: 'flex', gap: 9, alignItems: 'baseline' }}>
                      {it.amount && (
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: INK, fontFamily: MANROPE, whiteSpace: 'nowrap', flexShrink: 0, minWidth: 64 }}>{it.amount}</span>
                      )}
                      <span style={{ fontSize: 12.5, lineHeight: 1.5, color: '#3f444c', fontFamily: MANROPE }}>
                        {it.text}
                        {it.kind && (
                          <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: KIND_COLOR[it.kind].fg, background: KIND_COLOR[it.kind].bg, borderRadius: 5, padding: '1px 6px', whiteSpace: 'nowrap' }}>{KIND_LABEL[it.kind]}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* ── Election context / cross-links ──────────────────── */}
        <h2 style={{ ...sectionH2(), marginTop: 48 }}>Put it in context</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          <CrossLink href="/policies/economy" title="Compare party economic policy" body="See how each party’s stated economy and tax policy stacks up against what’s actually budgeted." />
          <CrossLink href="/compare" title="Compare all parties" body="Where every party stands across health, education, housing, crime and more — side by side." />
          <CrossLink href="/record" title="Were the promises funded?" body="Track the government’s promises against the record (private accountability deep-dive)." />
        </div>

        {/* ── Source footer ───────────────────────────────────── */}
        <div style={{ marginTop: 44, padding: '18px 20px', background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 6 }}>Source</div>
          <p style={{ fontSize: 12.5, lineHeight: 1.6, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 10px' }}>
            All figures from {BUDGET_META.sourceLabel}, Budget {BUDGET_META.year} (delivered {BUDGET_META.deliveredOn}).
            Aratika summarises the official material and does not reproduce it in full. Always verify against the original.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            <a href={BUDGET_META.sourceUrl} target="_blank" rel="noopener noreferrer" style={verifyLink()}>
              Budget at a Glance <ExternalLink style={{ width: 13, height: 13 }} />
            </a>
            <a href={BUDGET_META.fiscalDataUrl} target="_blank" rel="noopener noreferrer" style={verifyLink()}>
              Treasury fiscal data <ExternalLink style={{ width: 13, height: 13 }} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function sectionH2(): React.CSSProperties {
  return { fontSize: 19, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 14px', letterSpacing: '-.01em' }
}
function verifyLink(): React.CSSProperties {
  return { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }
}

function Chip({ k }: { k: BudgetKind }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: KIND_COLOR[k].fg, background: KIND_COLOR[k].bg, borderRadius: 5, padding: '1px 6px' }}>{KIND_LABEL[k]}</span>
  )
}

function CrossLink({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px', display: 'block' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
        <span style={{ fontSize: 14.5, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{title}</span>
        <ArrowRight style={{ width: 16, height: 16, color: JADE, flexShrink: 0 }} />
      </div>
      <p style={{ fontSize: 12.5, lineHeight: 1.5, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>{body}</p>
    </Link>
  )
}
