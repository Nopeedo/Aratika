'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PARTY_COLORS } from '@/constants/parties'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import {
  Home, Heart, Leaf, GraduationCap, Scale,
  Globe, Landmark, Wind, TrendingUp, Users,
} from 'lucide-react'

const TOPIC_ICONS: Record<string, React.ElementType> = {
  Home, Heart, TrendingUp, Leaf, GraduationCap,
  Scale, Globe, Landmark, Wind, Users,
}

const PARTY_DOT_ORDER = ['green', 'labour', 'tpm', 'nzfirst', 'national', 'act'] as const

const INK      = '#0c0e12'
const JADE     = '#1F8A4C'
const SECONDARY = '#6b7078'
const BORDER   = '#e9e7e2'

export function PolicyCard({ topicKey }: { topicKey: string }) {
  const topic = POLICY_TOPICS[topicKey as keyof typeof POLICY_TOPICS]
  const Icon  = TOPIC_ICONS[topic.icon]

  return (
    <Link href={`/policies/${topicKey}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        className="policy-card"
        style={{
          background:    '#ffffff',
          border:        `1px solid ${BORDER}`,
          borderRadius:  20,
          padding:       '22px 20px 18px',
          boxShadow:     '0 2px 4px rgba(12,14,18,.03)',
          cursor:        'pointer',
          height:        '100%',
          display:       'flex',
          flexDirection: 'column',
          gap:           10,
          transition:    'box-shadow 0.15s, border-color 0.15s, transform 0.15s',
        }}
      >
        {/* Icon */}
        <div
          className={topic.color}
          style={{
            width: 40, height: 40,
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {Icon && <Icon className={`size-5 ${topic.textColor}`} />}
        </div>

        {/* Label + description */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 15, fontWeight: 800, color: INK,
            fontFamily: 'var(--font-manrope), system-ui, sans-serif',
            marginBottom: 4,
          }}>
            {topic.label}
          </div>
          <div style={{
            fontSize: 12, color: SECONDARY,
            fontFamily: 'var(--font-manrope), system-ui, sans-serif',
            lineHeight: 1.5,
          }}>
            {topic.description}
          </div>
        </div>

        {/* Party colour dots + Compare link */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {PARTY_DOT_ORDER.map((slug) => (
              <span
                key={slug}
                title={slug === 'tpm' ? 'Te Pāti Māori' : slug === 'nzfirst' ? 'NZ First' : slug.charAt(0).toUpperCase() + slug.slice(1)}
                style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: PARTY_COLORS[slug].bg,
                  display: 'inline-block',
                  border: '1.5px solid rgba(255,255,255,0.6)',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, color: JADE,
            fontFamily: 'var(--font-manrope), system-ui, sans-serif',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            Compare
            <ArrowRight style={{ width: 11, height: 11 }} />
          </span>
        </div>
      </div>
    </Link>
  )
}
