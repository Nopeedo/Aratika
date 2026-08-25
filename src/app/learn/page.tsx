/**
 * /learn — Arapono Learn hub.
 *
 * Interactive civics modules with four difficulty tiers. Every module in
 * LEARN_MODULES is currently live; the "coming soon" branch below stays because
 * it reads each module's own status, so one can be listed before its content is
 * finished. Deliberately no count here — a number in a comment is one more list
 * that stops matching the thing it describes.
 *
 * Sizing follows the rest of the site rather than its own scale. This page was
 * written with a fixed 36px gutter and a fixed 40px heading, from before the
 * clamp() convention the topic and battleground pages use — which cost it 36px
 * of width on a phone and left the heading as large at 360px as at 1280.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight, GraduationCap, Vote, Landmark, Users, FileText, MessagesSquare, UserCog, Lock,
  ClipboardCheck, Handshake, Megaphone, Scale,
} from 'lucide-react'
import { LEARN_MODULES } from '@/constants/learn-data'
import { SectionDivider } from '@/components/ui/section-divider'
import { LearnProgressBanner } from '@/components/learn/learn-progress-banner'
import { BORDER, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

export const metadata: Metadata = {
  title: 'Learn how Parliament works',
  description:
    'Interactive, beginner-to-expert lessons on how New Zealand’s Parliament and government work, ' +
    'with hands-on widgets and quizzes. Free for everyone.',
}

const ICONS: Record<string, React.ElementType> = {
  Vote, Landmark, Users, FileText, MessagesSquare, UserCog,
  ClipboardCheck, Handshake, Megaphone, Scale,
}

export default function LearnHubPage() {
  return (
    <div style={WOVEN_PAGE}>
      {/* Hero */}
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(28px, 5vh, 48px) clamp(18px, 5vw, 36px) clamp(26px, 4vh, 42px)' }}>
          <div style={{ marginBottom: 10 }}>
            <SectionDivider type="official" label="Arapono Learn" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(11px, 3vw, 16px)' }}>
            <div style={{ width: 'clamp(42px, 11vw, 54px)', height: 'clamp(42px, 11vw, 54px)', borderRadius: 15, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GraduationCap style={{ width: 'clamp(21px, 5.5vw, 28px)', height: 'clamp(21px, 5.5vw, 28px)', color: JADE }} />
            </div>
            <div>
              <h1 style={{ fontSize: 'clamp(26px, 7vw, 40px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 8px', lineHeight: 1.05 }}>
                How Parliament works
              </h1>
              <p style={{ fontSize: 'clamp(14.5px, 3.9vw, 17px)', fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, maxWidth: 640, lineHeight: 1.6, margin: 0 }}>
                Learn how New Zealand’s democracy works by <b style={{ color: INK }}>doing</b>, not by reading.
                Each module has hands-on widgets, a quick quiz, and four levels from <b style={{ color: INK }}>Kids</b> to <b style={{ color: INK }}>Expert</b>. Always free.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(24px, 4vh, 36px) clamp(18px, 5vw, 36px) 64px' }}>
        <LearnProgressBanner />
        {/* Two to a row on a phone. minmax(min(300px, 100%), 1fr) needs 616px for
            a second column; with the gutter now clamped the grid gets 324px at
            360, and every module took a full row — ten of them, 2,123px to
            list ten things. 152px, checked against that 324: two plus the 12px
            gap need 316. */}
        <style>{`
          .learn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(152px, 100%), 1fr)); gap: 12px; }
          /* A 152px track is right for a phone and wrong for a desktop: at
             1280 it produced five columns of 161px for six modules, thinner
             than the three-across it replaced. Widened above the breakpoint so
             the wide layout is unchanged from before. */
          @media (min-width: 700px) { .learn-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; } }
        `}</style>
        <div className="learn-grid">
          {LEARN_MODULES.map((m) => {
            const Icon = ICONS[m.icon] || Vote
            const live = m.status === 'live'
            const card = (
              <div className={live ? 'policy-card' : ''} style={{
                background: live ? '#fff' : SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16,
                padding: '15px 15px 13px', height: '100%', display: 'flex', flexDirection: 'column', gap: 9,
                boxShadow: live ? '0 2px 4px rgba(12,14,18,.03)' : 'none', opacity: live ? 1 : 0.75,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: live ? '#ecfdf5' : '#eceae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 19, height: 19, color: live ? JADE : TERTIARY }} />
                  </div>
                  {!live && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 800, color: TERTIARY, fontFamily: MANROPE, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                      <Lock style={{ width: 11, height: 11 }} /> Coming soon
                    </span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.25 }}>{m.title}</div>
                  <div style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.45, marginTop: 3 }}>{m.subtitle}</div>
                </div>
                {live && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, color: JADE, fontFamily: MANROPE, paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
                    Start learning <ArrowRight style={{ width: 13, height: 13 }} />
                  </div>
                )}
              </div>
            )
            return live ? (
              <Link key={m.id} href={`/learn/${m.id}`} style={{ textDecoration: 'none' }}>{card}</Link>
            ) : (
              <div key={m.id}>{card}</div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
