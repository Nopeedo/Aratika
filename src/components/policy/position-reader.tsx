'use client'

/**
 * PositionReader — the in-depth, neutral breakdown of one party's stance, on our
 * own site. Plain/Detailed toggle, key proposals, who it affects (neutral), and
 * short cited excerpts that each link to the official source to verify. Never
 * says good/bad; never reproduces the party's full policy text.
 */

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, ListChecks, Users, Quote, ShieldCheck } from 'lucide-react'
import type { PartyPosition } from '@/lib/positions/live'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function PositionReader({ position, accent, topicLabel }: { position: PartyPosition; accent: string; topicLabel: string }) {
  const [detailed, setDetailed] = useState(false)
  const body = detailed ? (position.summary || position.summaryBasic) : (position.summaryBasic || position.summary)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Stance + summary */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          {position.stance && <div style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.3, flex: 1, minWidth: 240 }}>{position.stance}</div>}
          <div style={{ display: 'inline-flex', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 3, flexShrink: 0 }}>
            {[{ k: false, label: 'Plain' }, { k: true, label: 'Detailed' }].map((o) => (
              <button key={o.label} onClick={() => setDetailed(o.k)} style={{
                padding: '6px 13px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, fontFamily: MANROPE,
                background: detailed === o.k ? '#fff' : 'transparent', color: detailed === o.k ? INK : TERTIARY,
                boxShadow: detailed === o.k ? '0 1px 3px rgba(12,14,18,.08)' : 'none',
              }}>{o.label}</button>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 15, color: '#23262c', fontFamily: MANROPE, lineHeight: 1.7, margin: 0 }}>{body}</p>
      </div>

      {/* Key proposals */}
      {position.keyProposals.length > 0 && (
        <Section icon={ListChecks} title="What they say they'll do">
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {position.keyProposals.map((k, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: '#23262c', fontFamily: MANROPE, lineHeight: 1.5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, flexShrink: 0, marginTop: 8 }} /> {k}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Who this affects */}
      {position.whoAffected.length > 0 && (
        <Section icon={Users} title="Who this affects">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
            {position.whoAffected.map((w, i) => (
              <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 14px', background: SURFACE }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 3 }}>{w.group}</div>
                <div style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.5 }}>{w.detail}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Cited excerpts */}
      {position.excerpts.length > 0 && (
        <Section icon={Quote} title="In their own words">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {position.excerpts.map((q, i) => (
              <blockquote key={i} style={{ margin: 0, paddingLeft: 14, borderLeft: `3px solid ${accent}`, fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, fontStyle: 'italic' }}>“{q}”</blockquote>
            ))}
          </div>
          {position.sourceUrl && (
            <a href={position.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none', marginTop: 12 }}>
              Verify at {position.sourceLabel} <ExternalLink style={{ width: 13, height: 13 }} />
            </a>
          )}
        </Section>
      )}

      {/* Source / trust footer */}
      <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
        <ShieldCheck style={{ width: 17, height: 17, color: JADE, flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
          Summarised neutrally from {position.partyName}’s own official policy{position.asOf ? ` (as at ${position.asOf})` : ''} and checked by an editor — never paraphrased without the source linked, and never an endorsement.{' '}
          {position.sourceUrl && <a href={position.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 700 }}>Read the original ↗</a>}{' '}
          Arapono is non-partisan. <Link href="/compare" style={{ color: JADE, fontWeight: 700 }}>Compare all parties on {topicLabel} →</Link>
        </p>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
        <Icon style={{ width: 17, height: 17, color: JADE }} />
        <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}
