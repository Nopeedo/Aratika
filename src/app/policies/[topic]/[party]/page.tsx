/**
 * /policies/[topic]/[party] — in-depth breakdown of one party's stated position
 * on one topic, on our own site. Neutral: what they propose, who it touches, with
 * short cited excerpts and a link to verify. Reads approved positions only.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Info } from 'lucide-react'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import { PARTY_PROFILES } from '@/constants/parties-data'
import { CONTESTING_PARTIES } from '@/constants/parties'
import { PolicyTopic, PartySlug } from '@/types'
import { getApprovedPosition } from '@/lib/positions/live'
import { PositionReader } from '@/components/policy/position-reader'
import { PolicyCoverage } from '@/components/policy/policy-coverage'

export const dynamic = 'force-dynamic'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export async function generateMetadata({ params }: { params: Promise<{ topic: string; party: string }> }): Promise<Metadata> {
  const { topic, party } = await params
  const t = POLICY_TOPICS[topic as PolicyTopic]
  const p = PARTY_PROFILES[party as PartySlug]
  if (!t || !p) return { title: 'Position not found' }
  return { title: `${p.name} on ${t.label}`, description: `${p.name}'s stated position on ${t.label} — a neutral breakdown sourced from their official policy.` }
}

export default async function PositionPage({ params }: { params: Promise<{ topic: string; party: string }> }) {
  const { topic, party } = await params
  const t = POLICY_TOPICS[topic as PolicyTopic]
  const p = PARTY_PROFILES[party as PartySlug]
  if (!t || !p || party === 'independent' || !CONTESTING_PARTIES.includes(party as PartySlug)) notFound()

  const pos = await getApprovedPosition(topic, party)

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Header */}
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ height: 6, background: p.color }} />
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 36px 32px' }}>
          <Link href={`/policies/${topic}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: SECONDARY, textDecoration: 'none', fontFamily: MANROPE, marginBottom: 18 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> All parties on {t.label}
          </Link>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, marginBottom: 6 }}>{t.label} · Party position</div>
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.1 }}>
            {p.name} on {t.label}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 36px 64px' }}>
        {pos ? (
          <PositionReader position={pos} accent={p.color} topicLabel={t.label} />
        ) : (
          <div style={{ display: 'flex', gap: 10, padding: '16px 18px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14 }}>
            <Info style={{ width: 18, height: 18, color: '#1e40af', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13.5, color: '#1e3a8a', fontFamily: MANROPE, margin: 0, lineHeight: 1.6 }}>
              <b>We haven’t recorded {p.name}’s position on {t.label.toLowerCase()} yet.</b> When they’ve published one, we’ll
              summarise it neutrally with the source — every contesting party is covered the same way.{' '}
              <Link href={`/policies/${topic}`} style={{ color: JADE, fontWeight: 700 }}>See the other parties →</Link>
            </p>
          </div>
        )}
      </div>
      <PolicyCoverage maxWidth={900} />
    </div>
  )
}
