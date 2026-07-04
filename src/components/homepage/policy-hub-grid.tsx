/**
 * PolicyHubGrid — homepage "Where do the parties stand?" section. The topic grid
 * is now INLINE (see PolicyExplorer): tapping a topic opens the simplified party
 * comparison right here, no page change. Fetches approved positions on the server
 * and hands them to the client explorer. Placed directly under the compass.
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import { PARTY_COLORS } from '@/constants/parties'
import { getAllApprovedPositions } from '@/lib/positions/live'
import { PolicyExplorer } from '@/components/homepage/policy-explorer'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const PARTY_DOT_ORDER = ['green', 'labour', 'tpm', 'nzfirst', 'national', 'act'] as const

export async function PolicyHubGrid() {
  const positions = await getAllApprovedPositions()

  return (
    <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px clamp(18px, 5vw, 36px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, marginBottom: 8 }}>Policy Comparison</div>
            <h2 style={{ fontSize: 'clamp(24px, 5.5vw, 28px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: 0 }}>Where do the parties stand?</h2>
            <p style={{ fontSize: 15, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, marginTop: 8, marginBottom: 0, lineHeight: 1.55 }}>
              Tap any issue to see where every party stands, right here — drawn from each party’s <b style={{ color: INK }}>most recent published policy</b>, not their stance at a past election.
            </p>
          </div>
          <Link href="/policies" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            All policy comparisons <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>

        <PolicyExplorer topicKeys={POLICY_TOPIC_ORDER} positions={positions} />

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
