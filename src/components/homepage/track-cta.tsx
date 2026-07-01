/**
 * TrackCta — homepage section that introduces the Command Centre in the
 * first-five-minutes flow: what you can track and the promise that news/video
 * come to you. Links through to the full /command-centre explainer. Server
 * component; plain by design (aesthetics pass comes later).
 */

import Link from 'next/link'
import { Target, ArrowRight, Users, Landmark, Scale, Gavel, Newspaper, Video } from 'lucide-react'

const INK = '#0c0e12', SECONDARY = '#6b7078', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const THINGS = [
  { icon: Users, label: 'MPs' },
  { icon: Landmark, label: 'Parties' },
  { icon: Scale, label: 'Policies' },
  { icon: Gavel, label: 'Bills' },
  { icon: Newspaper, label: 'News' },
  { icon: Video, label: 'Video' },
]

export function TrackCta() {
  return (
    <section style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '52px clamp(18px, 5vw, 36px)' }}>
        <div style={{ background: '#0c0e12', borderRadius: 22, padding: 'clamp(24px, 4vw, 40px)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#36e08a', fontFamily: MANROPE, marginBottom: 14 }}>
            <Target style={{ width: 15, height: 15 }} /> Your Command Centre
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 5vw, 34px)', fontWeight: 800, letterSpacing: '-.01em', color: '#fff', fontFamily: MANROPE, margin: '0 0 12px', lineHeight: 1.12, maxWidth: 640 }}>
            Track what matters to you — we keep it current
          </h2>
          <p style={{ fontSize: 'clamp(14px, 2.3vw, 16px)', fontWeight: 500, color: 'rgba(255,255,255,.78)', fontFamily: MANROPE, margin: '0 0 22px', lineHeight: 1.6, maxWidth: 620 }}>
            Follow the MPs, parties, issues and bills you care about. The news, video and votes on exactly those things
            come to you — one place, kept up to date all the way to the 2026 election.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 26 }}>
            {THINGS.map((t) => {
              const Icon = t.icon
              return (
                <span key={t.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 999, padding: '7px 13px', fontFamily: MANROPE }}>
                  <Icon style={{ width: 15, height: 15, color: '#36e08a' }} /> {t.label}
                </span>
              )
            })}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Link href="/command-centre" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, color: '#0c0e12', background: '#36e08a', borderRadius: 11, padding: '12px 20px', textDecoration: 'none', fontFamily: MANROPE }}>
              See how tracking works <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
            <Link href="/command-centre#try" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, color: '#fff', background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 11, padding: '12px 20px', textDecoration: 'none', fontFamily: MANROPE }}>
              Try it now
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
