/**
 * TrackCta — the Command Centre, INLINE on the homepage. Pitch → an auto-advancing
 * showcase of how tracking works for each type (TrackShowcase) → a live "try it"
 * island (real Track buttons + a tray that fills as you tap). A small link to
 * /command-centre remains for the deeper page (live feed + election tracker).
 * Server component that builds the track options and renders the client islands.
 * Plain by design — aesthetics pass comes later.
 */

import Link from 'next/link'
import { Target, ArrowRight } from 'lucide-react'
import { PARTY_DIRECTORY_ORDER, PARTY_PROFILES } from '@/constants/parties-data'
import { POLICY_TOPICS, POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import { CommandCentreTryIt } from '@/components/command-centre/try-it'
import { TrackShowcase } from '@/components/homepage/track-showcase'
import type { BookmarkEntity } from '@/hooks/use-bookmarks'

const INK = '#0c0e12', SECONDARY = '#6b7078', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function TrackCta() {
  const trackOptions: BookmarkEntity[] = [
    ...PARTY_DIRECTORY_ORDER.slice(0, 3).map((slug) => ({
      kind: 'party' as const, refId: slug, label: PARTY_PROFILES[slug].name,
      sublabel: 'Political party', href: `/parties/${slug}`, accent: PARTY_PROFILES[slug].color,
    })),
    ...POLICY_TOPIC_ORDER.slice(0, 3).map((t) => ({
      kind: 'policy' as const, refId: t, label: POLICY_TOPICS[t].label,
      sublabel: 'Policy issue', href: `/policies/${t}`, accent: JADE,
    })),
  ]

  return (
    <section style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '52px clamp(18px, 5vw, 36px)' }}>
        {/* Pitch */}
        <div style={{ background: '#0c0e12', borderRadius: 22, padding: 'clamp(24px, 4vw, 40px)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#36e08a', fontFamily: MANROPE, marginBottom: 14 }}>
            <Target style={{ width: 15, height: 15 }} /> Your Command Centre
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 5vw, 34px)', fontWeight: 800, letterSpacing: '-.01em', color: '#fff', fontFamily: MANROPE, margin: '0 0 12px', lineHeight: 1.12, maxWidth: 640 }}>
            Track what matters to you — we keep it current
          </h2>
          <p style={{ fontSize: 'clamp(14px, 2.3vw, 16px)', fontWeight: 500, color: 'rgba(255,255,255,.78)', fontFamily: MANROPE, margin: 0, lineHeight: 1.6, maxWidth: 620 }}>
            Follow the MPs, parties, issues and bills you care about. The news, video and votes on exactly those things
            come to you — one place, kept up to date all the way to the 2026 election.
          </p>
        </div>

        {/* Auto-advancing "how tracking works" review — one type at a time */}
        <TrackShowcase />

        {/* Try it — INLINE, no navigation. Track buttons + a live tray that fills as you tap. */}
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 22, padding: 'clamp(20px, 4vw, 32px)', marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 3px' }}>Try it now — no sign-up</h3>
              <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>Tap Track and watch your command centre take shape, right here.</p>
            </div>
            <Link href="/command-centre" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: JADE, textDecoration: 'none', fontFamily: MANROPE, whiteSpace: 'nowrap' }}>
              Live feed &amp; election tracker <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
          <CommandCentreTryIt options={trackOptions} />
        </div>
      </div>
    </section>
  )
}
