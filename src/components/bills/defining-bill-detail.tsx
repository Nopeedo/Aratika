/**
 * DefiningBillDetail — breakdown page body for a "bill that defined this term".
 * Rendered by /bills/[slug] when the slug matches a curated defining bill. Content
 * is the vetted defining-bills.ts data (no fabrication); the richer sections
 * (timeline, provisions, public response, sources) render only where populated.
 */

import Link from 'next/link'
import { ArrowLeft, ArrowRight, ExternalLink, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { DEFINING_BILLS_META, type DefiningBill } from '@/constants/defining-bills'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import type { PolicyTopic } from '@/types'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const STATUS: Record<DefiningBill['statusKind'], { fg: string; bg: string; icon: React.ElementType }> = {
  law: { fg: '#065f46', bg: '#d1fae5', icon: CheckCircle2 },
  defeated: { fg: '#991b1b', bg: '#fef2f2', icon: XCircle },
  'in-progress': { fg: '#92400e', bg: '#fff7e6', icon: Clock },
}

export function DefiningBillDetail({ bill }: { bill: DefiningBill }) {
  const st = STATUS[bill.statusKind]
  const StatusIcon = st.icon
  const topic = bill.topic ? POLICY_TOPICS[bill.topic as PolicyTopic] : null

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 72px' }}>

        <Link href="/bills" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, textDecoration: 'none', marginBottom: 22 }}>
          <ArrowLeft style={{ width: 15, height: 15 }} /> All bills
        </Link>

        <div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, color: st.fg, background: st.bg, borderRadius: 999, padding: '4px 12px', fontFamily: MANROPE, marginBottom: 14 }}>
            <StatusIcon style={{ width: 13, height: 13 }} /> {bill.status}
          </span>
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, lineHeight: 1.2, margin: '0 0 16px' }}>{bill.title}</h1>

        {/* Lead — the fuller overview if we have it, else the short description */}
        <p style={{ fontSize: 17, color: '#2b2f36', fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 28px' }}>{bill.overview ?? bill.what}</p>

        {bill.timeline && bill.timeline.length > 0 && (
          <Section label="Timeline">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {bill.timeline.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: JADE, flexShrink: 0, marginTop: 6 }} />
                    {i < bill.timeline!.length - 1 && <span style={{ width: 2, flex: 1, minHeight: 20, background: '#e4e6e9' }} />}
                  </div>
                  <div style={{ paddingBottom: i < bill.timeline!.length - 1 ? 14 : 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{t.date}</div>
                    <div style={{ fontSize: 14, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.5 }}>{t.event}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {bill.keyProvisions && bill.keyProvisions.length > 0 && (
          <Section label="What it does">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {bill.keyProvisions.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: JADE, flexShrink: 0, marginTop: 8 }} />
                  <span style={{ fontSize: 15, color: '#2b2f36', fontFamily: MANROPE, lineHeight: 1.6 }}>{p}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section label="Why it defined this election"><p style={pStyle}>{bill.why}</p></Section>

        {bill.publicResponse && <Section label="Public response"><p style={pStyle}>{bill.publicResponse}</p></Section>}

        <Section label="Who championed it"><p style={pStyle}>{bill.champion}</p></Section>

        {bill.outcome && <Section label="Where it landed"><p style={pStyle}>{bill.outcome}</p></Section>}

        {/* Links out */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 30, paddingTop: 22, borderTop: `1px solid ${BORDER}` }}>
          {topic && bill.topic && (
            <Link href={`/policies/${bill.topic}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14.5, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
              Where the parties stand on {topic.label.toLowerCase()} <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
          )}
          <a href={bill.source.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, textDecoration: 'none' }}>
            Verify at the official source — {bill.source.label} <ExternalLink style={{ width: 13, height: 13 }} />
          </a>
        </div>

        {/* Sources */}
        {bill.sources && bill.sources.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h2 style={labelStyle}>Sources</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {bill.sources.map((s, i) => (
                <li key={i}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13.5, fontWeight: 600, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
                    {s.label} <ExternalLink style={{ width: 12, height: 12 }} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.55, margin: '26px 0 0', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 14px' }}>
          Neutral summary, {DEFINING_BILLS_META.asOf} knowledge cut-off — confirm any later changes at the official source. Aratika does not take a side.
        </p>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, margin: '0 0 8px' }
const pStyle: React.CSSProperties = { fontSize: 16, color: '#2b2f36', fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={labelStyle}>{label}</h2>
      {children}
    </div>
  )
}
