/**
 * CredibilityStrip — four sourced stat tiles + the "who we source from" badges.
 * Sits at the foot of the beginner tier as a quiet trust anchor: everything a
 * newcomer just read is grounded in official sources.
 */

import { ShieldCheck } from 'lucide-react'
import { BORDER, INK, JADE, MANROPE, TERTIARY } from '@/constants/theme'

const STATS = [
  // 7 November 2026, from the Electoral Commission's media kit — the same date
  // electoral-calendar.json is built from. This tile said "~Oct 2026", which the
  // countdown at the top of the page already contradicted.
  { value: '2026', label: 'General Election', sublabel: '7 November' },
  { value: '72', label: 'Electorates', sublabel: 'General & Māori' },
  { value: '6', label: 'Parties', sublabel: 'In Parliament' },
  { value: '123', label: 'MPs', sublabel: 'You can look up' },
]

function StatTile({ value, label, sublabel }: { value: string; label: string; sublabel: string }) {
  return (
    <div style={{ background: '#ffffff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '14px 18px', boxShadow: '0 2px 4px rgba(12,14,18,.03)', minWidth: 0 }}>
      <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-.02em', color: INK, lineHeight: 1, fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: INK, marginTop: 4, fontFamily: MANROPE }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: TERTIARY, marginTop: 2, fontFamily: MANROPE }}>{sublabel}</div>
    </div>
  )
}

export function CredibilityStrip() {
  return (
    // No borderBottom: the explore section below opens with a borderTop, so
    // this strip's own bottom rule made TWO full-width hairlines a few pixels
    // apart — and once the alerts pill moved between the sections it floated
    // inside a pair of stray white lines. One divider between sections.
    <section style={{ background: 'transparent' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '26px clamp(18px, 5vw, 36px)', display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(116px, 100%), 1fr))', gap: 12, flex: 1, minWidth: 0, maxWidth: 560 }}>
          {STATS.map((s) => (
            <StatTile key={s.label} {...s} />
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px' }}>
          {['NZ Parliament', 'Electoral Commission', 'Stats NZ', 'Non-partisan & independent'].map((label) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: TERTIARY, fontFamily: MANROPE }}>
              <ShieldCheck style={{ width: 13, height: 13, color: JADE, flexShrink: 0 }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
