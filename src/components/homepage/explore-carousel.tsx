'use client'

/**
 * ExploreCarousel — the homepage's single "everything else" surface. The core of
 * the page is now just the tiles, the policy topics and the map; every other
 * feature (the race, news, battlegrounds, bills, budget, tracking, learn) is
 * demoted to a card in this horizontal rail with a link through to its full page.
 * Keeps the homepage short while still signposting the whole toolkit.
 *
 * Cards are feature-gated so a card only appears when its route is live in the
 * current launch phase (see constants/features).
 */

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowRight, ArrowLeft, ChevronRight, BarChart3, Scale, FileText, Wallet,
  Newspaper, Swords, Vote, LayoutDashboard, GraduationCap,
} from 'lucide-react'
import { isEnabled } from '@/constants/features'
import { BORDER, INK, JADE, MANROPE, TERTIARY } from '@/constants/theme'

const SUB = '#5b6067'

// Left/right inset that lines the rail up with the centred 1280 container while
// letting the rail itself run full-bleed to the viewport edges — so cards scroll
// off the screen edge cleanly instead of being sliced inside the container.
const GUTTER = 'calc(max(0px, (100% - 1280px) / 2) + clamp(18px, 5vw, 36px))'

interface Feature {
  feature: string
  title: string
  desc: string
  href: string
  Icon: React.ComponentType<{ style?: React.CSSProperties }>
  tint: string
}

const FEATURES: Feature[] = [
  { feature: 'elections', title: 'Election Centre', desc: 'Polls, seat projection & live results on the night', href: '/elections/2026', Icon: BarChart3, tint: '#eef4ff' },
  { feature: 'compare', title: 'Compare parties', desc: 'Every party, side by side on the issues', href: '/policies', Icon: Scale, tint: '#f2fbf6' },
  { feature: 'bills', title: 'The Record', desc: 'Bills and what this Parliament has actually done', href: '/bills', Icon: FileText, tint: '#fdf4ff' },
  { feature: 'budget', title: 'Budget 2026', desc: 'Where the Government is spending your money', href: '/budget', Icon: Wallet, tint: '#fff7ed' },
  { feature: 'news', title: 'Latest news & video', desc: 'Election coverage across every party', href: '/news', Icon: Newspaper, tint: '#eff6ff' },
  { feature: 'battlegrounds', title: 'Battlegrounds', desc: 'The marginal seats that decide the election', href: '/battlegrounds', Icon: Swords, tint: '#fef2f2' },
  { feature: 'onboarding', title: 'Get ready to vote', desc: 'Enrol, and learn how it all works', href: '/guide', Icon: Vote, tint: '#f2fbf6' },
  { feature: 'dashboard', title: 'Track what matters', desc: 'Follow the parties & MPs you care about', href: '/command-centre', Icon: LayoutDashboard, tint: '#f0fdfa' },
  { feature: 'learn', title: 'Learn the basics', desc: 'How voting and Parliament work', href: '/learn', Icon: GraduationCap, tint: '#faf5ff' },
]

export function ExploreCarousel() {
  const railRef = React.useRef<HTMLDivElement>(null)
  const cards = FEATURES.filter((f) => isEnabled(f.feature))
  if (cards.length === 0) return null

  const scroll = (dir: -1 | 1) => {
    const el = railRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 560), behavior: 'smooth' })
  }

  return (
    <section style={{ background: 'transparent', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px clamp(18px, 5vw, 36px) 22px' }}>
        {/* Header + desktop arrows */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, marginBottom: 6 }}>The rest of the toolkit</div>
            <h2 style={{ fontSize: 'clamp(24px,3.4vw,30px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: 0 }}>Explore more, whenever you want</h2>
            <p style={{ fontSize: 15.5, color: SUB, fontFamily: MANROPE, margin: '6px 0 0' }}>Everything else lives here — dip in when you&rsquo;re ready, no pressure.</p>
          </div>
          <div className="ec-arrows" style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => scroll(-1)} aria-label="Scroll left" style={arrowBtn}><ArrowLeft style={{ width: 18, height: 18 }} /></button>
            <button onClick={() => scroll(1)} aria-label="Scroll right" style={arrowBtn}><ArrowRight style={{ width: 18, height: 18 }} /></button>
          </div>
        </div>
      </div>

      {/* Rail — full-bleed to the viewport edge (padding lines the first/last
          card up with the header), so cards scroll off-screen cleanly instead
          of being sliced inside the centred container. */}
      <div ref={railRef} className="ec-rail" style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', paddingLeft: GUTTER, paddingRight: GUTTER, paddingBottom: 60, scrollPaddingLeft: GUTTER }}>
          {cards.map((f) => (
            <Link key={f.href} href={f.href} className="ec-card" style={{
              flex: '0 0 auto', width: 262, scrollSnapAlign: 'start', textDecoration: 'none',
              display: 'flex', flexDirection: 'column', background: '#fff', border: `1px solid ${BORDER}`,
              borderRadius: 18, padding: '20px 20px 18px', fontFamily: MANROPE,
              boxShadow: '0 1px 2px rgba(12,14,18,.04)', transition: 'transform .15s ease, box-shadow .15s ease, border-color .15s ease',
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 13, background: f.tint, marginBottom: 14 }}>
                <f.Icon style={{ width: 22, height: 22, color: INK }} />
              </span>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 13.5, color: SUB, lineHeight: 1.5, flex: 1 }}>{f.desc}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13.5, fontWeight: 800, color: JADE, marginTop: 14 }}>
                Open <ChevronRight style={{ width: 15, height: 15 }} />
              </div>
            </Link>
          ))}
        </div>

      <style>{`
        .ec-rail::-webkit-scrollbar { display: none; }
        .ec-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(12,14,18,.10); border-color: #dcdad5; }
        @media (max-width: 720px) { .ec-arrows { display: none !important; } }
      `}</style>
    </section>
  )
}

const arrowBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40,
  borderRadius: 11, border: `1px solid ${BORDER}`, background: '#fff', color: INK, cursor: 'pointer',
}
