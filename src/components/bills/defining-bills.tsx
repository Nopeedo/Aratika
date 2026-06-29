/**
 * DefiningBills — "Bills shaping the 2026 election" featured section on /bills.
 * Curated, neutral; links each bill to where the parties stand on the topic and
 * to the official source. See src/constants/defining-bills.ts for credibility notes.
 */

import Link from 'next/link'
import { Landmark, ExternalLink, ArrowRight, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { DEFINING_BILLS, DEFINING_BILLS_META, type DefiningBill } from '@/constants/defining-bills'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import type { PolicyTopic } from '@/types'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const STATUS: Record<DefiningBill['statusKind'], { fg: string; bg: string; icon: React.ElementType }> = {
  law: { fg: '#065f46', bg: '#d1fae5', icon: CheckCircle2 },
  defeated: { fg: '#991b1b', bg: '#fef2f2', icon: XCircle },
  'in-progress': { fg: '#92400e', bg: '#fff7e6', icon: Clock },
}

export function DefiningBills() {
  return (
    <section style={{ marginBottom: 44 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Landmark style={{ width: 16, height: 16, color: JADE }} />
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE }}>Shaping the 2026 election</span>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>The bills that defined this term</h2>
      <p style={{ fontSize: 14.5, color: SECONDARY, fontFamily: MANROPE, margin: '6px 0 0', maxWidth: 620, lineHeight: 1.55 }}>
        The legislation the 2026 election is being fought over — what each does, where it got to, and where the parties stand. Neutral, and sourced.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 14, marginTop: 18 }}>
        {DEFINING_BILLS.map((b) => {
          const st = STATUS[b.statusKind]; const Icon = st.icon
          const topic = b.topic ? POLICY_TOPICS[b.topic as PolicyTopic] : null
          return (
            <div key={b.title} style={{ border: `1px solid ${BORDER}`, borderRadius: 16, padding: '18px 20px', background: '#fff', display: 'flex', flexDirection: 'column' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: st.fg, background: st.bg, borderRadius: 999, padding: '3px 10px', fontFamily: MANROPE, alignSelf: 'flex-start', marginBottom: 10 }}>
                <Icon style={{ width: 12, height: 12 }} /> {b.status}
              </span>
              <div style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.3, marginBottom: 7 }}>{b.title}</div>
              <p style={{ fontSize: 13.5, color: '#3f444c', fontFamily: MANROPE, lineHeight: 1.55, margin: '0 0 8px' }}>{b.what}</p>
              <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55, margin: '0 0 10px' }}><b style={{ color: INK }}>Why it matters:</b> {b.why}</p>
              <p style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.5, margin: '0 0 14px' }}>{b.champion}</p>

              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                {topic && (
                  <Link href={`/policies/${b.topic}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
                    Where parties stand <ArrowRight style={{ width: 13, height: 13 }} />
                  </Link>
                )}
                <a href={b.source.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, textDecoration: 'none' }}>
                  {b.source.label} <ExternalLink style={{ width: 11, height: 11 }} />
                </a>
              </div>
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '14px 0 0', lineHeight: 1.5, maxWidth: 640 }}>
        {DEFINING_BILLS_META.note}
      </p>
    </section>
  )
}
