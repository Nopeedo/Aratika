/**
 * /bills — Bills tracker.
 * Top: the curated bills that defined this term, as a tile carousel. Below: the
 * full current-bills snapshot for the 54th Parliament.
 *
 * The approved breakdowns are still fetched, but no longer shown as their own
 * card grid — they were a third list of bills on a page that already had two.
 * They're reachable from each carousel panel, from the tracker rows (via
 * readerSlugs, which is what that fetch now feeds) and from /legislation.
 */

import type { Metadata } from 'next'
import { ExternalLink } from 'lucide-react'
import { BillsTracker54 } from '@/components/bills/bills-tracker-54'
import { DefiningBills } from '@/components/bills/defining-bills'
import { HowToReadBills } from '@/components/bills/how-to-read-bills'
import { AboutBillsTracker } from '@/components/bills/about-bills-tracker'
import { BILLS_54_META } from '@/constants/bills-54'
import { getApprovedBills } from '@/lib/bills/live'
import { memberPartyMap } from '@/lib/bills/member-party'
import { BORDER, INK, JADE, MANROPE, SECONDARY, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Bills Tracker',
  description:
    'Track bills currently before the New Zealand House of Representatives: ' +
    'their type, stage and progress, with plain-language breakdowns.',
}

export default async function BillsPage({ searchParams }: { searchParams: Promise<{ party?: string; bill?: string; topic?: string }> }) {
  const { party: initialParty, bill: initialBill, topic: initialTopic } = await searchParams
  const readable = await getApprovedBills()
  // Map each bill title → its reader slug, so the full tracker can link rows that
  // have a published breakdown through to /legislation/[slug].
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const readerSlugs: Record<string, string> = {}
  for (const b of readable) readerSlugs[norm(b.title)] = b.slug

  // Member name → party, so the tracker can filter bills by the party of the
  // MP/minister in charge (deep-linkable via /bills?party=<slug>). Built server
  // side so the large MP dataset stays out of the client bundle.
  const memberParty = memberPartyMap()

  return (
    <div style={WOVEN_PAGE}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '48px clamp(18px, 5vw, 36px) 40px' }}>
          {/* No "Official Parliament Data" badge: the page says where every
              bill came from on the bill itself, and the badge was a claim
              about the page rather than a fact about any of its rows. */}
          {/* Title, then the two explanations as (i) buttons beside it: what
              this page IS and how to read it are both orientation, and eight
              lines of it stood between the reader and the bills. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'clamp(26px, 7vw, 40px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: 0 }}>
              Bills Tracker
            </h1>
            <AboutBillsTracker />
          </div>
          <div style={{ marginTop: 12 }}>
            <HowToReadBills />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px clamp(18px, 5vw, 36px) 64px' }}>

        {/* The "how to read this" primer is an (i) beside the title now, not a
            card here. */}

        {/* ── Bills shaping the election (curated) ── */}
        <DefiningBills />

        {/* ── Full bills tracker (54th Parliament) ── */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>All bills before Parliament</h2>
          <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>
            Every bill of this Parliament. Filter by policy area, type or stage. {BILLS_54_META.passed} have passed into law.
          </p>
        </div>

        <BillsTracker54 readerSlugs={readerSlugs} memberParty={memberParty} initialParty={initialParty} initialBill={initialBill} initialTopic={initialTopic} />

        <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 18 }}>
          Source: {BILLS_54_META.sourceLabel}, 54th Parliament, as at {BILLS_54_META.asOf}.{' '}
          <a href={BILLS_54_META.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 700 }}>
            Official register <ExternalLink style={{ width: 11, height: 11, display: 'inline' }} />
          </a>
        </p>
      </div>
    </div>
  )
}
