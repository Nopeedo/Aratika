/**
 * /about — who Aratika is, our principles, and our official data sources
 * (the #sources section is linked from the footer).
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, Scale, ShieldCheck, Unlock, Compass } from 'lucide-react'
import { SectionDivider } from '@/components/ui/section-divider'
import { DATA_SOURCES } from '@/constants/site'

export const metadata: Metadata = {
  title: 'About Aratika',
  description: 'Aratika is an independent, non-partisan platform making New Zealand politics clear, credible and accessible.',
}

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const PRINCIPLES = [
  { icon: Scale, title: 'Non-partisan', body: 'We present every party, MP and policy even-handedly. We don’t endorse anyone, and we never tell you how to vote.' },
  { icon: ShieldCheck, title: 'Credible', body: 'Everything is drawn from official sources and attributed. If we get something wrong, we fix it fast.' },
  { icon: Unlock, title: 'Accessible', body: 'The core information is free for everyone, in plain language — from a Kids level all the way to expert detail.' },
  { icon: Compass, title: 'Independent', body: 'We’re not affiliated with the Government, Parliament, or any political party. We answer to our users.' },
]

export default function AboutPage() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 880, margin: '0 auto', padding: '48px 36px 40px' }}>
          <div style={{ marginBottom: 10 }}><SectionDivider type="official" label="About" /></div>
          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 12px', lineHeight: 1.05 }}>
            New Zealand politics, made clear.
          </h1>
          <p style={{ fontSize: 18, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, maxWidth: 640, lineHeight: 1.6, margin: 0 }}>
            Aratika is an independent, non-partisan platform that helps every New Zealander understand who represents them,
            what’s being decided, and how to have their say — all sourced from official information.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '36px 36px 64px', display: 'flex', flexDirection: 'column', gap: 36 }}>

        {/* Mission */}
        <section>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 10px' }}>Why we exist</h2>
          <p style={{ fontSize: 15.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.7, margin: 0 }}>
            Politics shapes everyday life, yet official information is scattered, jargon-heavy, and easy to tune out. Aratika
            brings it together in one place — MP and party profiles, the bills before the House, an interactive electorate
            map, plain-language explainers, and tools to write to your representatives — so getting informed feels less like
            a chore and more like something you actually want to do.
          </p>
        </section>

        {/* Principles */}
        <section>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 16px' }}>What we stand for</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {PRINCIPLES.map((p) => (
              <div key={p.title} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '18px 20px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <p.icon style={{ width: 20, height: 20, color: JADE }} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{p.title}</div>
                <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: '4px 0 0' }}>{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sources */}
        <section id="sources" style={{ scrollMarginTop: 80 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 6px' }}>Our sources</h2>
          <p style={{ fontSize: 14, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 16px', lineHeight: 1.6 }}>
            Credibility is the whole point. Everything on Aratika traces back to official, public sources:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {DATA_SOURCES.map((s) => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div className="party-card" style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{s.name}</span>
                    <ArrowUpRight style={{ width: 13, height: 13, color: TERTIARY }} />
                  </div>
                  <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55, margin: '4px 0 0' }}>{s.description}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Independence note */}
        <section style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '20px 22px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 8px' }}>Independent &amp; non-partisan</h2>
          <p style={{ fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.7, margin: 0 }}>
            Aratika is not affiliated with the Government, Parliament, the Electoral Commission, or any political party. Spotted
            something that looks wrong or one-sided? Please <Link href="/contact" style={{ color: JADE, fontWeight: 700, textDecoration: 'none' }}>tell us</Link> — holding ourselves to account is part of the deal.
          </p>
        </section>
      </div>
    </div>
  )
}
