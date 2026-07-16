/**
 * /party-inclusion — Arapono's published rule for which parties appear and how.
 * This page IS the neutrality proof: a clear, public, registration-based inclusion
 * policy that anyone (users, funders, the parties themselves) can hold us to.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Scale, ListChecks, BarChart3, ShieldCheck } from 'lucide-react'
import { PARTY_NAMES, PARLIAMENTARY_PARTIES, NON_PARLIAMENTARY_CONTESTING } from '@/constants/parties'

export const metadata: Metadata = {
  title: 'How we decide which parties are included',
  description:
    'Arapono’s inclusion policy — every party registered to contest the 2026 party vote is represented equally, by registration not polling. Poll figures are labelled, never inferred.',
}

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const PRINCIPLES = [
  {
    icon: Scale,
    title: 'Inclusion by registration, not polling',
    body: 'Any party registered with the Electoral Commission to contest the party vote is included — with a profile, policy coverage and an equal place in our comparisons. A party’s poll standing never decides whether it appears. That is the line that keeps us fair to smaller and newer parties.',
  },
  {
    icon: ListChecks,
    title: 'Equal in structure, neutral in order',
    body: 'Every contesting party gets the same sections and the same treatment. We group parties by whether they currently hold seats — a plain fact, not a ranking — and order the rest alphabetically, never by size or polling. Where a party hasn’t published a position on a topic, we say so honestly rather than leaving them out.',
  },
  {
    icon: BarChart3,
    title: 'Polls are labelled, never inferred',
    body: 'Published polls only survey the larger parties, so poll-of-polls, the seat projection and the coalition explorer can only show those. We label this limit plainly, group smaller parties as “Others”, and note where the 5% threshold excludes a contesting party — we never invent a number for a party polls don’t measure, and we never present polling as a prediction.',
  },
  {
    icon: ShieldCheck,
    title: 'Sourced, or marked as a gap',
    body: 'A party’s stated positions are summarised only from what they have actually published, with the source linked and an editor check before it appears. If we don’t yet have something, the page says “not recorded yet” — we don’t fill gaps with assumptions.',
  },
]

export default function PartyInclusionPage() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px clamp(18px, 5vw, 36px) 34px' }}>
          <Link href="/elections/2026" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none', marginBottom: 16 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> Election Centre
          </Link>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, marginBottom: 8 }}>Our approach</div>
          <h1 style={{ fontSize: 'clamp(27px, 4.5vw, 38px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 12px', lineHeight: 1.1 }}>
            How we decide which parties are included
          </h1>
          <p style={{ fontSize: 16, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.6, maxWidth: 640 }}>
            Arapono is non-partisan, and fairness has to be a rule anyone can check — not a judgement call. So here is exactly
            how we choose which parties appear, and how we handle the parts that polling can’t cover fairly.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px clamp(18px, 5vw, 36px) 64px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {PRINCIPLES.map((p) => (
          <div key={p.title} style={{ display: 'flex', gap: 16, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '20px 22px' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <p.icon style={{ width: 21, height: 21, color: JADE }} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 6px' }}>{p.title}</h2>
              <p style={{ fontSize: 14.5, color: '#33373f', fontFamily: MANROPE, margin: 0, lineHeight: 1.65 }}>{p.body}</p>
            </div>
          </div>
        ))}

        {/* The current field */}
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '22px 24px' }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>The parties we include right now</h2>
          <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 16px', lineHeight: 1.6 }}>
            Drawn from the Electoral Commission’s register of parties. The final list contesting 2026 is confirmed when
            nominations close, and we update this then.
          </p>
          {[
            { label: 'In Parliament', parties: PARLIAMENTARY_PARTIES },
            { label: 'Also registered to contest', parties: NON_PARLIAMENTARY_CONTESTING },
          ].map((grp) => (
            <div key={grp.label} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 8 }}>{grp.label}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {grp.parties.map((p) => (
                  <Link key={p} href={`/parties/${p}`} style={{ padding: '7px 12px', borderRadius: 999, border: `1px solid ${BORDER}`, background: '#fff', textDecoration: 'none', fontFamily: MANROPE, fontSize: 13, fontWeight: 700, color: INK }}>
                    {PARTY_NAMES[p].short}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
          <a href="https://elections.nz" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, textDecoration: 'none' }}>
            Source: Electoral Commission — register of political parties (elections.nz) <ArrowUpRight style={{ width: 12, height: 12, display: 'inline', verticalAlign: '-2px' }} />
          </a>
        </div>
      </div>
    </div>
  )
}
