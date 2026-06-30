/**
 * PolicyHubGrid — homepage "Where do the parties stand?" section: the 10 policy
 * topics as a grid (each links to its comparison), with a party-colour legend.
 * Placed directly under the compass so a first-timer flows straight from finding
 * their own views into seeing where the parties stand.
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import { PARTY_COLORS } from '@/constants/parties'
import { PolicyCard } from '@/components/homepage/policy-card'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const PARTY_DOT_ORDER = ['green', 'labour', 'tpm', 'nzfirst', 'national', 'act'] as const

export function PolicyHubGrid() {
  return (
    <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px clamp(18px, 5vw, 36px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, marginBottom: 8 }}>Policy Comparison</div>
            <h2 style={{ fontSize: 'clamp(24px, 5.5vw, 28px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: 0 }}>Where do the parties stand?</h2>
            <p style={{ fontSize: 15, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, marginTop: 8, marginBottom: 0, lineHeight: 1.55 }}>
              See every party&apos;s position on the issues that matter to New Zealanders. All sourced from official party documents.
            </p>
          </div>
          <Link href="/policies" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            All policy comparisons <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))', gap: 14 }}>
          {POLICY_TOPIC_ORDER.map((key) => (
            <PolicyCard key={key} topicKey={key} />
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: TERTIARY, fontFamily: MANROPE, alignSelf: 'center', marginRight: 4 }}>Party positions shown for:</span>
          {PARTY_DOT_ORDER.map((slug) => (
            <div key={slug} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: SECONDARY, fontFamily: MANROPE }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: PARTY_COLORS[slug].bg, display: 'inline-block', flexShrink: 0 }} />
              {slug === 'tpm' ? 'Te Pāti Māori' : slug === 'nzfirst' ? 'NZ First' : slug.charAt(0).toUpperCase() + slug.slice(1)}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
