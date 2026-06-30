/**
 * /policies — Policy Hub
 * The 10 policy topics, with which parties prioritise each. Links to per-topic
 * comparison pages.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight, Home, Heart, Leaf, GraduationCap, Scale,
  Globe, Landmark, Wind, TrendingUp, Users,
} from 'lucide-react'
import { POLICY_TOPICS, POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import { PARTY_PROFILES, PARTY_DIRECTORY_ORDER } from '@/constants/parties-data'
import { PolicyTopic } from '@/types'
import { SectionDivider } from '@/components/ui/section-divider'
import { PolicyCoverage } from '@/components/policy/policy-coverage'

export const metadata: Metadata = {
  title: 'Policy Hub',
  description:
    'Compare where New Zealand\'s political parties stand on the issues that matter — ' +
    'housing, health, the economy, climate and more.',
}

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const ICONS: Record<string, React.ElementType> = {
  Home, Heart, TrendingUp, Leaf, GraduationCap, Scale, Globe, Landmark, Wind, Users,
}

function partiesForTopic(topic: PolicyTopic) {
  return PARTY_DIRECTORY_ORDER.filter((p) => PARTY_PROFILES[p].keyPolicyAreas.includes(topic))
}

export default function PolicyHubPage() {
  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>
      <div className="bg-dot-grid" style={{ background: '#ffffff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px clamp(18px, 5vw, 36px) 40px' }}>
          <div style={{ marginBottom: 8 }}>
            <SectionDivider type="official" label="Party Policy Comparison" />
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, marginBottom: 10 }}>
            Policy Hub
          </h1>
          <p style={{ fontSize: 17, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, maxWidth: 620, lineHeight: 1.6, margin: 0 }}>
            Where do the parties stand on the issues that matter to you? Explore each topic to see which
            parties make it a priority — and how their positions compare.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(18px, 5vw, 36px) clamp(18px, 5vw, 36px) 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {POLICY_TOPIC_ORDER.map((key) => {
            const topic = POLICY_TOPICS[key]
            const Icon = ICONS[topic.icon]
            const parties = partiesForTopic(key)
            return (
              <Link key={key} href={`/policies/${key}`} style={{ textDecoration: 'none' }}>
                <div className="policy-card" style={{
                  background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 20,
                  padding: '22px 22px 18px', boxShadow: '0 2px 4px rgba(12,14,18,.03)',
                  height: '100%', display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                  <div className={topic.color} style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {Icon && <Icon className={`size-5 ${topic.textColor}`} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{topic.label}</div>
                    <div style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.5, marginTop: 4 }}>{topic.description}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE }}>Priority for</span>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {parties.map((p) => (
                          <span key={p} title={PARTY_PROFILES[p].name} style={{ width: 10, height: 10, borderRadius: '50%', background: PARTY_PROFILES[p].color, border: '1.5px solid rgba(255,255,255,.6)' }} />
                        ))}
                      </div>
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 800, color: JADE, fontFamily: MANROPE }}>
                      Compare <ArrowRight style={{ width: 12, height: 12 }} />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
      <PolicyCoverage maxWidth={1100} />
    </div>
  )
}
