/**
 * /bills/[slug] — Individual bill
 * Summary, stage-progress timeline, and official source link. Votes and member
 * in charge are marked pending the live Parliament data integration.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft, ArrowUpRight, Landmark, Users, Info, Check, FileText, Vote, Lock, PenLine,
} from 'lucide-react'
import {
  getBill, BILL_SLUGS, BILL_STAGE_PIPELINE, BILLS_SOURCE_URL, BILLS_SNAPSHOT_DATE,
} from '@/constants/bills-data'
import { BillStatusBadge } from '@/components/ui/badge'
import { SectionDivider } from '@/components/ui/section-divider'
import { formatDate } from '@/lib/utils/format'
import { PREMIUM_ENABLED } from '@/constants/features'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const DISPLAY = 'var(--font-space-grotesk), system-ui, sans-serif'

export function generateStaticParams() {
  return BILL_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const bill = getBill(slug)
  if (!bill) return { title: 'Bill not found' }
  return { title: bill.title, description: bill.summary }
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18, padding: '22px 24px', boxShadow: '0 2px 4px rgba(12,14,18,.03)', ...style }}>
      {children}
    </div>
  )
}

export default async function BillDetailPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const bill = getBill(slug)
  if (!bill) notFound()

  const currentIdx = BILL_STAGE_PIPELINE.findIndex((s) => s.key === bill.stage)

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>

      {/* Header */}
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 36px 36px' }}>
          <Link href="/bills" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: SECONDARY, textDecoration: 'none', fontFamily: MANROPE, marginBottom: 22 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> All bills
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700,
              color: bill.kind === 'government' ? '#1e40af' : '#7c3aed',
              background: bill.kind === 'government' ? '#eff6ff' : '#f5f3ff',
              border: `1px solid ${bill.kind === 'government' ? '#bfdbfe' : '#ddd6fe'}`,
              borderRadius: 999, padding: '3px 11px', fontFamily: MANROPE,
            }}>
              {bill.kind === 'government' ? <Landmark style={{ width: 12, height: 12 }} /> : <Users style={{ width: 12, height: 12 }} />}
              {bill.kind === 'government' ? 'Government Bill' : "Member's Bill"}
            </span>
            <span style={{ fontSize: 12.5, color: TERTIARY, fontFamily: DISPLAY }}>Bill no. {bill.number}</span>
            <BillStatusBadge status={bill.stage} />
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, lineHeight: 1.15, margin: '0 0 8px' }}>
            {bill.title}
          </h1>
          <p style={{ fontSize: 13, color: TERTIARY, fontFamily: MANROPE, margin: 0 }}>
            Last activity {formatDate(bill.lastActivity)}
            {bill.selectCommittee ? ` · ${bill.selectCommittee} Committee` : ''}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 36px 64px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Summary */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
            <FileText style={{ width: 17, height: 17, color: JADE }} />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>What this bill does</h2>
          </div>
          <p style={{ fontSize: 14.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.7, margin: 0 }}>
            {bill.summary}
          </p>
          <p style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE, marginTop: 12, fontStyle: 'italic' }}>
            Plain-language summary of the bill&apos;s official title. Read the full text and explanatory
            note on the official page.
          </p>
        </Card>

        {/* Stage progress */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
            <Vote style={{ width: 17, height: 17, color: JADE }} />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>Progress through Parliament</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {BILL_STAGE_PIPELINE.map((s, i) => {
              const done    = i < currentIdx
              const current = i === currentIdx
              const last    = i === BILL_STAGE_PIPELINE.length - 1
              const color   = done ? JADE : current ? INK : '#cbd0d6'
              return (
                <div key={s.key} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  {/* Marker + line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch' }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: done ? JADE : current ? INK : '#fff',
                      border: `2px solid ${done ? JADE : current ? INK : '#cbd0d6'}`,
                    }}>
                      {done ? <Check style={{ width: 13, height: 13, color: '#fff' }} />
                        : current ? <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />
                        : <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#cbd0d6' }} />}
                    </div>
                    {!last && <div style={{ width: 2, flex: 1, minHeight: 22, background: done ? JADE : '#e4e6e9' }} />}
                  </div>
                  {/* Label */}
                  <div style={{ paddingBottom: last ? 0 : 14 }}>
                    <div style={{ fontSize: 14, fontWeight: current ? 800 : 600, color, fontFamily: MANROPE }}>
                      {s.label}
                      {current && <span style={{ fontSize: 11, fontWeight: 700, color: JADE, marginLeft: 8 }}>● Current stage</span>}
                    </div>
                    {current && s.key === 'select-committee' && bill.selectCommittee && (
                      <div style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, marginTop: 2 }}>
                        {bill.selectCommittee} Committee — open for public submissions at this stage.
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Have your say — submission CTA (bills open at select committee) */}
        {bill.stage === 'select-committee' && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <PenLine style={{ width: 17, height: 17, color: JADE }} />
              <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>Have your say</h2>
            </div>
            <p style={{ fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 14px' }}>
              This bill is at the select committee stage — the time when the public can make submissions
              {bill.selectCommittee ? ` to the ${bill.selectCommittee} Committee` : ''}. Draft your submission with Aratika,
              then lodge it through the official Parliament process before the closing date.
            </p>
            <Link
              href={`/take-action/submission?bill=${bill.slug}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 800, fontFamily: MANROPE, padding: '10px 16px', borderRadius: 11, background: '#1F8A4C', color: '#fff', textDecoration: 'none' }}
            >
              <PenLine style={{ width: 15, height: 15 }} /> Draft a submission
            </Link>
          </Card>
        )}

        {/* Member in charge + votes (pending) */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
            <Users style={{ width: 17, height: 17, color: JADE }} />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>Member in charge &amp; votes</h2>
          </div>
          <div style={{ display: 'flex', gap: 10, padding: '13px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12 }}>
            <Info style={{ width: 16, height: 16, color: '#1e40af', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12.5, color: '#1e3a8a', fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>
              The member in charge and the division (vote) results for each reading will appear here once
              the live Parliament data integration is in place — including how each party and MP voted.
            </p>
          </div>
          {/* Premium teaser */}
          {PREMIUM_ENABLED && (
            <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, background: 'linear-gradient(145deg,#fff9e6,#fffdf5)', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Lock style={{ width: 15, height: 15, color: '#b45309', flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: '#92400e', fontFamily: MANROPE, lineHeight: 1.5 }}>
                <b>Premium:</b> full reading history, division results, and submission counts — with alerts when this bill progresses.{' '}
                <Link href="/subscription" style={{ color: '#b45309', fontWeight: 700 }}>Upgrade →</Link>
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Source attribution */}
      <div style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 36px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <SectionDivider type="official" label="Source" />
          <p style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>
            Bill status from the official NZ Parliament register (snapshot {formatDate(BILLS_SNAPSHOT_DATE)}).{' '}
            <a href={BILLS_SOURCE_URL} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 600 }}>
              View on parliament.nz <ArrowUpRight style={{ width: 11, height: 11, display: 'inline' }} />
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
