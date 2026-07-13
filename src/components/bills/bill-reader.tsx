'use client'

/**
 * BillReader — the immersive legislation reader. Header + the shared
 * summary/policy breakdown + a (coming) premium annotations teaser + full-text
 * link. The breakdown visual is shared with the editor preview via BillBreakdown.
 */

import { FileText, ExternalLink, ShieldCheck } from 'lucide-react'
import type { LiveBill } from '@/lib/bills/live'
import { BookmarkButton } from '@/components/bookmarks/bookmark-button'
import { BillBreakdown } from '@/components/bills/bill-breakdown'
import { StageTracker } from '@/components/bills/stage-tracker'
import { HaveYourSay } from '@/components/bills/have-your-say'
import { BillFullText } from '@/components/bills/bill-full-text'

const INK = '#17231b', SECONDARY = '#667066', TERTIARY = '#9aa0aa'
const BORDER = '#e4ebe2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function BillReader({ bill }: { bill: LiveBill }) {
  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* meta + trust line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 800, color: JADE, background: '#ecfdf5', border: '1px solid #cfe9d8', borderRadius: 999, padding: '3px 11px', fontFamily: MANROPE, textTransform: 'capitalize' }}>
          <FileText style={{ width: 12, height: 12 }} /> {bill.docType}
        </span>
        {bill.published && <span style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE }}>{new Date(bill.published).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: SECONDARY, fontFamily: MANROPE, marginLeft: 'auto' }}>
          <ShieldCheck style={{ width: 13, height: 13, color: JADE }} /> Non-partisan · AI-drafted, editor-reviewed
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', margin: '0 0 22px' }}>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.15, color: INK, fontFamily: MANROPE, margin: 0, flex: 1, minWidth: 240 }}>{bill.title}</h1>
        <BookmarkButton
          entity={{
            kind: 'bill', refId: bill.slug, label: bill.title,
            sublabel: bill.docType === 'act' ? 'Act' : 'Bill',
            href: `/legislation/${bill.slug}`, accent: JADE,
          }}
          variant="pill"
        />
      </div>

      {/* shared summary + policy breakdown */}
      <BillBreakdown summary={bill.summary} summaryBasic={bill.summaryBasic} policyLinks={bill.policyLinks} docType={bill.docType} />

      {/* progress timeline */}
      <StageTracker stage={bill.stage} selectCommittee={bill.selectCommittee} />

      {/* have your say */}
      <HaveYourSay stage={bill.stage} selectCommittee={bill.selectCommittee} slug={bill.slug} />

      {/* embedded full text with highlighted policy sections */}
      <BillFullText fullText={bill.fullText} policyLinks={bill.policyLinks} docType={bill.docType} contentItemId={bill.id} billSlug={bill.slug} billTitle={bill.title} />

      {/* official source link */}
      {bill.link && (
        <a href={bill.link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, textDecoration: 'none' }}>
          <ExternalLink style={{ width: 14, height: 14, color: TERTIARY }} /> View the official {bill.docType} on legislation.govt.nz
        </a>
      )}

      {/* transparency footer */}
      <p style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.6, marginTop: 24, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
        Bill text sourced from legislation.govt.nz (Parliamentary Counsel Office). Arapono’s summary and breakdown are drafted with AI grounded in that official text and reviewed by an Arapono editor for accuracy and neutrality before publishing. Arapono is non-partisan and takes no position on this {bill.docType}.
      </p>
    </div>
  )
}
