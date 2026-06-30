/**
 * /policies/[topic] — per-topic party comparison.
 * Topic explainer + which parties prioritise it (linked to party pages).
 * Detailed party position statements are sourced from official party policy
 * documents and shown as they are compiled.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Info, Home, Heart, Leaf, GraduationCap, Scale,
  Globe, Landmark, Wind, TrendingUp, Users,
} from 'lucide-react'
import { POLICY_TOPICS, POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import { PARTY_PROFILES, PARTY_DIRECTORY_ORDER } from '@/constants/parties-data'
import { PolicyTopic } from '@/types'
import { Avatar } from '@/components/ui/avatar'
import { SectionDivider } from '@/components/ui/section-divider'
import { BookmarkButton } from '@/components/bookmarks/bookmark-button'
import { getApprovedPositions } from '@/lib/positions/live'
import { PolicyComparison } from '@/components/policy/policy-comparison'
import { PolicyCoverage } from '@/components/policy/policy-coverage'
import { BillsForTopic } from '@/components/bills/bills-for-topic'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const ICONS: Record<string, React.ElementType> = {
  Home, Heart, TrendingUp, Leaf, GraduationCap, Scale, Globe, Landmark, Wind, Users,
}

export function generateStaticParams() {
  return POLICY_TOPIC_ORDER.map((topic) => ({ topic }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ topic: string }> },
): Promise<Metadata> {
  const { topic } = await params
  const t = POLICY_TOPICS[topic as PolicyTopic]
  if (!t) return { title: 'Policy topic not found' }
  return { title: `${t.label} — Party Positions`, description: t.longDescription }
}

export default async function PolicyTopicPage(
  { params }: { params: Promise<{ topic: string }> },
) {
  const { topic } = await params
  const t = POLICY_TOPICS[topic as PolicyTopic]
  if (!t) notFound()
  const Icon = ICONS[t.icon]

  const priorityParties = PARTY_DIRECTORY_ORDER.filter((p) => PARTY_PROFILES[p].keyPolicyAreas.includes(topic as PolicyTopic))
  const otherParties = PARTY_DIRECTORY_ORDER.filter((p) => !priorityParties.includes(p))

  const positions = await getApprovedPositions(topic)

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>

      {/* Header */}
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px clamp(18px, 5vw, 36px) clamp(18px, 5vw, 36px)' }}>
          <Link href="/policies" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: SECONDARY, textDecoration: 'none', fontFamily: MANROPE, marginBottom: 22 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> All policy topics
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className={t.color} style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {Icon && <Icon className={`size-7 ${t.textColor}`} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE }}>Policy Topic</div>
              <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.1 }}>{t.label}</h1>
            </div>
            <BookmarkButton entity={{
              kind: 'policy', refId: topic, label: t.label,
              sublabel: 'Policy topic', href: `/policies/${topic}`, accent: JADE,
            }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px clamp(18px, 5vw, 36px) 64px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* What this covers */}
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18, padding: '22px 24px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 10px' }}>What this covers</h2>
          <p style={{ fontSize: 14.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.7, margin: 0 }}>{t.longDescription}</p>
        </div>

        {/* Parties prioritising this */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>Parties prioritising {t.label}</h2>
          <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 14px' }}>
            Parties that list this as one of their key policy areas. Tap a party to see its full profile.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {priorityParties.map((p) => {
              const party = PARTY_PROFILES[p]
              return (
                <Link key={p} href={`/parties/${p}`} style={{ textDecoration: 'none' }}>
                  <div className="party-card" style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 4px rgba(12,14,18,.03)' }}>
                    <div style={{ height: 4, background: party.color }} />
                    <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 11 }}>
                      <Avatar name={party.leader} party={p} size="sm" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{party.name}</div>
                        <div style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE }}>{party.leader}</div>
                      </div>
                      <ArrowRight style={{ width: 14, height: 14, color: TERTIARY }} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
          {otherParties.length > 0 && (
            <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 12 }}>
              Other parties in Parliament also hold positions on {t.label.toLowerCase()} — view any party&apos;s profile for their full policy areas.
            </p>
          )}
        </div>

        {/* Detailed party-by-party comparison */}
        {positions.length > 0 ? (
          <PolicyComparison positions={positions} topicLabel={t.label} topic={topic} />
        ) : (
          <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12 }}>
            <Info style={{ width: 16, height: 16, color: '#1e40af', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12.5, color: '#1e3a8a', fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>
              <b>Detailed party-by-party positions are being compiled.</b> Side-by-side position statements and
              plain-language summaries for each party on {t.label.toLowerCase()} will appear here, summarised
              neutrally from official party policy and editor-checked — never paraphrased without attribution.
            </p>
          </div>
        )}

        {/* What's been legislated this term (bills → record, beside the comparison) */}
        <BillsForTopic topic={topic as PolicyTopic} label={t.label} />

        {/* Source */}
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <SectionDivider type="official" label="Sources" />
          <p style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>
            Topic framing is editorial; party positions will be sourced from each party&apos;s official policy material.
          </p>
        </div>
      </div>
      <PolicyCoverage maxWidth={1000} />
    </div>
  )
}
