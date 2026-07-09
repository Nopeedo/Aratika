/**
 * DefiningBillDetail — breakdown page body for a "bill that defined this term".
 * Rendered by /bills/[slug] when the slug matches a curated defining bill. Content
 * is the vetted defining-bills.ts data (no fabrication); links out to the official
 * source and, where a clean match exists, to where the parties stand on the topic.
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

        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, lineHeight: 1.2, margin: '0 0 26px' }}>{bill.title}</h1>

        <Section label="What it does">{bill.what}</Section>
        <Section label="Why it defined this election">{bill.why}</Section>
        <Section label="Who championed it">{bill.champion}</Section>

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

        <p style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.55, margin: '26px 0 0', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 14px' }}>
          Neutral summary, {DEFINING_BILLS_META.asOf} knowledge cut-off — confirm any later changes at the official source. Aratika does not take a side.
        </p>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h2 style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, margin: '0 0 7px' }}>{label}</h2>
      <p style={{ fontSize: 16, color: '#2b2f36', fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>{children}</p>
    </div>
  )
}
