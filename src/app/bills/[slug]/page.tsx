/**
 * /bills/[slug] — Individual bill
 * Summary, stage-progress timeline, and official source link. Votes and member
 * in charge are marked pending the live Parliament data integration.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft, ArrowUpRight, Landmark, Users, Info, FileText, Lock, PenLine,
} from 'lucide-react'
import {
  getBill, BILL_SLUGS, BILLS_SOURCE_URL,
} from '@/constants/bills-data'
import { BILLS_54, BILLS_54_META } from '@/constants/bills-54'
import type { BillStatus } from '@/types'
import { DEFINING_BILLS, getDefiningBill } from '@/constants/defining-bills'
import { DefiningBillDetail } from '@/components/bills/defining-bill-detail'
import { StageTracker } from '@/components/bills/stage-tracker'
import { BillStatusBadge } from '@/components/ui/badge'
import { BookmarkButton } from '@/components/bookmarks/bookmark-button'
import { SectionDivider } from '@/components/ui/section-divider'
import { formatDate } from '@/lib/utils/format'
import { PREMIUM_ENABLED } from '@/constants/features'
import { BORDER, DISPLAY, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

export function generateStaticParams() {
  return [...BILL_SLUGS, ...DEFINING_BILLS.map((b) => b.slug)].map((slug) => ({ slug }))
}

/** Today in NZ. Fixed at build, which is fine: the bills dataset and this page
 *  are rebuilt together every morning by refresh-bills.yml. */
const TODAY_NZ = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })

/** Parliament's own wording → the enum the badge and stage tracker take. Only
 *  six values appear across all 270 bills, so this covers the dataset; anything
 *  unrecognised falls back to the curated stage rather than guessing. */
const STAGE_FROM_STATUS: Record<string, BillStatus> = {
  'first reading': 'first-reading',
  'select committee': 'select-committee',
  'second reading': 'second-reading',
  'committee of whole house': 'committee-of-whole-house',
  'third reading': 'third-reading',
  'royal assent': 'royal-assent',
}

const normTitle = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/** The daily record behind a curated bill.
 *
 *  bills-data.ts is ten hand-written entries, unchanged since the initial commit
 *  and labelled "snapshot 28 May 2026". bills-54.ts is the whole register,
 *  rebuilt every morning. Both describe the same bills, and by August four of the
 *  ten had moved on — one of them all the way to Royal Assent while this page
 *  still called it "before select committee", and another into a live submission
 *  window the page gave no hint of.
 *
 *  Matched on normalised title, not slug: the two datasets slug differently, and
 *  title matched 10/10 where slug did not. The hand-written summaries stay —
 *  they are the part worth keeping — only the moving facts come from the feed. */
function liveRecord(title: string) {
  const t = normTitle(title)
  return BILLS_54.find((b) => normTitle(b.title) === t)
}

/** "13 August 2026" — a deadline should read like a date. */
function fmtCloseDate(iso?: string | null) {
  if (!iso) return null
  const d = new Date(`${iso}T00:00:00Z`)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const defining = getDefiningBill(slug)
  if (defining) return { title: `${defining.title}: what it does and why it matters`, description: defining.what }
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

  // Curated "bills that defined this term" get their own breakdown view.
  const defining = getDefiningBill(slug)
  if (defining) return <DefiningBillDetail bill={defining} />

  const bill = getBill(slug)
  if (!bill) notFound()

  // Moving facts from the daily register; the written summary stays ours.
  const live = liveRecord(bill.title)
  const stage = (live && STAGE_FROM_STATUS[live.status.toLowerCase()]) ?? bill.stage
  const lastActivity = live?.date ?? bill.lastActivity
  const committee = live?.committee ?? bill.selectCommittee
  const officialUrl = live?.officialUrl ?? BILLS_SOURCE_URL

  // submissionsCalled records only that a window existed. Whether it is still
  // open is the difference between something a reader can act on and a date
  // that passed months ago, so the close date decides which is shown.
  const closes = fmtCloseDate(live?.submissionsClose)
  const submissionsOpen = !!(live?.submissionsCalled && live.submissionsClose && live.submissionsClose >= TODAY_NZ)
  const submissionsClosed = !!(live?.submissionsCalled && closes && !submissionsOpen)

  return (
    <div style={WOVEN_PAGE}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px clamp(18px, 5vw, 36px) 36px' }}>
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
            <BillStatusBadge status={stage} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: 'clamp(24px, 7vw, 32px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, lineHeight: 1.15, margin: '0 0 8px' }}>
                {bill.title}
              </h1>
              <p style={{ fontSize: 13, color: TERTIARY, fontFamily: MANROPE, margin: 0 }}>
                Last activity {formatDate(lastActivity)}
                {committee ? ` · ${committee} Committee` : ''}
              </p>
            </div>
            <BookmarkButton
              entity={{
                kind: 'bill', refId: bill.slug, label: bill.title,
                sublabel: bill.kind === 'government' ? 'Government Bill' : "Member's Bill",
                href: `/bills/${bill.slug}`, accent: JADE,
              }}
              variant="pill"
            />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px clamp(18px, 5vw, 36px) 64px', display: 'flex', flexDirection: 'column', gap: 20 }}>

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

        {/* Stage progress — shared component with the per-stage colour scheme */}
        <StageTracker stage={stage} selectCommittee={committee ?? undefined} />

        {/* Have your say.
            Driven by the register's own submission window rather than by the
            stage, which is what let this page invite submissions on a bill whose
            window had shut — and stay silent on one where it was open. The three
            states are deliberately distinct: an open window names its deadline,
            a closed one says so plainly instead of vanishing, and a bill sitting
            at select committee with no dates published gets the general case. */}
        {submissionsOpen ? (
          <Card style={{ background: '#eff6ff', border: '1px solid #bfd4fe' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <PenLine style={{ width: 17, height: 17, color: '#1e40af' }} />
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1e3a8a', fontFamily: MANROPE, margin: 0 }}>You can have your say until {closes}</h2>
            </div>
            <p style={{ fontSize: 13.5, color: '#1e40af', fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 14px' }}>
              This bill is open for public submissions{committee ? ` to the ${committee} Committee` : ''}. Anyone can make one
              and you don&apos;t need to be an expert — it closes <b>{closes}</b>. Draft yours with Arapono, then lodge it
              through the official Parliament process.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link
                href={`/take-action/submission?bill=${bill.slug}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 800, fontFamily: MANROPE, padding: '10px 16px', borderRadius: 11, background: '#1F8A4C', color: '#fff', textDecoration: 'none' }}
              >
                <PenLine style={{ width: 15, height: 15 }} /> Draft a submission
              </Link>
              <a
                href={officialUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, fontFamily: MANROPE, padding: '10px 16px', borderRadius: 11, background: '#fff', border: '1px solid #bfd4fe', color: '#1e3a8a', textDecoration: 'none' }}
              >
                How to lodge it <ArrowUpRight style={{ width: 14, height: 14 }} />
              </a>
            </div>
          </Card>
        ) : submissionsClosed ? (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
              <PenLine style={{ width: 17, height: 17, color: TERTIARY }} />
              <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>Submissions have closed</h2>
            </div>
            <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>
              The public submission window{committee ? ` to the ${committee} Committee` : ''} closed on {closes}. The
              committee&apos;s report and the submissions it received are published on the official page.
            </p>
          </Card>
        ) : stage === 'select-committee' ? (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <PenLine style={{ width: 17, height: 17, color: JADE }} />
              <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>Have your say</h2>
            </div>
            <p style={{ fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 14px' }}>
              This bill is at the select committee stage — the point where the public can make submissions
              {committee ? ` to the ${committee} Committee` : ''}. No closing date has been published yet; check the
              official page for when the window opens.
            </p>
            <Link
              href={`/take-action/submission?bill=${bill.slug}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 800, fontFamily: MANROPE, padding: '10px 16px', borderRadius: 11, background: '#1F8A4C', color: '#fff', textDecoration: 'none' }}
            >
              <PenLine style={{ width: 15, height: 15 }} /> Draft a submission
            </Link>
          </Card>
        ) : null}

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
                <b>Premium:</b> full reading history, division results and submission counts, with alerts when this bill progresses.{' '}
                <Link href="/subscription" style={{ color: '#b45309', fontWeight: 700 }}>Upgrade →</Link>
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Source attribution */}
      <div style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px clamp(18px, 5vw, 36px)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <SectionDivider type="official" label="Source" />
          <p style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>
            {/* Two vintages, stated separately. The stage and dates refresh
                every morning; the plain-language summary is hand-written and
                does not. One date covering both was how this page came to claim
                a May stage in August. */}
            Stage and dates from the official NZ Parliament register, updated {BILLS_54_META.asOf}. Plain-language
            summary written by Arapono.{' '}
            <a href={officialUrl} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 600 }}>
              View on parliament.nz <ArrowUpRight style={{ width: 11, height: 11, display: 'inline' }} />
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
