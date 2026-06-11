/**
 * /learn — Aratika Learn hub.
 * Interactive civics modules with four difficulty tiers. MMP is live; more follow.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight, GraduationCap, Vote, Landmark, Users, FileText, MessagesSquare, UserCog, Lock,
} from 'lucide-react'
import { LEARN_MODULES } from '@/constants/learn-data'
import { SectionDivider } from '@/components/ui/section-divider'
import { LearnProgressBanner } from '@/components/learn/learn-progress-banner'

export const metadata: Metadata = {
  title: 'Learn — How Parliament Works',
  description:
    'Interactive, beginner-to-expert lessons on how New Zealand’s Parliament and government work — ' +
    'with hands-on widgets and quizzes. Free for everyone.',
}

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const ICONS: Record<string, React.ElementType> = {
  Vote, Landmark, Users, FileText, MessagesSquare, UserCog,
}

export default function LearnHubPage() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Hero */}
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 36px 42px' }}>
          <div style={{ marginBottom: 10 }}>
            <SectionDivider type="official" label="Aratika Learn" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ width: 54, height: 54, borderRadius: 15, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GraduationCap style={{ width: 28, height: 28, color: JADE }} />
            </div>
            <div>
              <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 8px', lineHeight: 1.05 }}>
                How Parliament works
              </h1>
              <p style={{ fontSize: 17, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, maxWidth: 640, lineHeight: 1.6, margin: 0 }}>
                Learn how New Zealand’s democracy actually works — not by reading, but by <b style={{ color: INK }}>doing</b>.
                Each module has hands-on widgets, a quick quiz, and four levels from <b style={{ color: INK }}>Kids</b> to <b style={{ color: INK }}>Expert</b>. Always free.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 36px 64px' }}>
        <LearnProgressBanner />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {LEARN_MODULES.map((m) => {
            const Icon = ICONS[m.icon] || Vote
            const live = m.status === 'live'
            const card = (
              <div className={live ? 'policy-card' : ''} style={{
                background: live ? '#fff' : SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20,
                padding: '22px 22px 18px', height: '100%', display: 'flex', flexDirection: 'column', gap: 12,
                boxShadow: live ? '0 2px 4px rgba(12,14,18,.03)' : 'none', opacity: live ? 1 : 0.75,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: live ? '#ecfdf5' : '#eceae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: 22, height: 22, color: live ? JADE : TERTIARY }} />
                  </div>
                  {!live && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 800, color: TERTIARY, fontFamily: MANROPE, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                      <Lock style={{ width: 11, height: 11 }} /> Coming soon
                    </span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{m.title}</div>
                  <div style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.5, marginTop: 3 }}>{m.subtitle}</div>
                </div>
                {live && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE, paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
                    Start learning <ArrowRight style={{ width: 14, height: 14 }} />
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
