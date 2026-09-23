/**
 * /bills — Bills tracker.
 * Top: the curated most-debated bills, as status pills and tiles. Below: the
 * full current-bills snapshot for the 54th Parliament.
 *
 * The approved breakdowns are still fetched, but no longer shown as their own
 * card grid — they were a third list of bills on a page that already had two.
 * They're reachable from each carousel panel, from the tracker rows (via
 * readerSlugs, which is what that fetch now feeds) and from /legislation.
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ExternalLink, Landmark } from 'lucide-react'
import { BillsTracker54 } from '@/components/bills/bills-tracker-54'
import { DefiningBills } from '@/components/bills/defining-bills'
import { AboutBillsTracker, AboutAllBills } from '@/components/bills/about-bills-tracker'
import { BallotBills } from '@/components/bills/ballot-bills'
import { BILLS_54_META } from '@/constants/bills-54'
import { getApprovedBills } from '@/lib/bills/live'
import { memberPartyMap } from '@/lib/bills/member-party'
import { INK, JADE, JADE_DARK, MANROPE, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

// Revalidated, not force-dynamic.
// The approved bills come from Supabase; 60s is the same freshness /policies/[topic]
// already ships with, and it takes this page off a 2.9s per-request render.
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Bills Tracker',
  description:
    'Track bills currently before the New Zealand House of Representatives: ' +
    'their type, stage and progress, with plain-language breakdowns.',
}

/** Holds the wash at full strength through the tracker, then feathers it out
 *  over the last 12% so the footer notes are not sitting in colour. */
const BILLS_WASH = 'linear-gradient(to bottom, rgba(0,0,0,.13) 0%, rgba(0,0,0,.13) 82%, rgba(0,0,0,0) 97%)'

// No searchParams here. Awaiting them made the whole route dynamic, and the
// only consumer of ?party= / ?bill= / ?topic= is the client tracker, which
// reads them itself now.
export default async function BillsPage() {
  const readable = await getApprovedBills()
  // Map each bill title → its reader slug, so the full tracker can link rows that
  // have a published breakdown through to /legislation/[slug].
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const readerSlugs: Record<string, string> = {}
  // …and its summary, so the tracker's breakdown can say what a bill DOES
  // rather than only what kind of bill it is. Only the bills with a published
  // breakdown have one: the Parliament API the other 200-odd come from
  // carries a title and a stage, no description, and inventing one for them
  // would be worse than saying nothing.
  const readerSummaries: Record<string, string> = {}
  for (const b of readable) {
    readerSlugs[norm(b.title)] = b.slug
    if (b.summary) readerSummaries[norm(b.title)] = b.summary
  }

  // Member name → party, so the tracker can filter bills by the party of the
  // MP/minister in charge (deep-linkable via /bills?party=<slug>). Built server
  // side so the large MP dataset stays out of the client bundle.
  const memberParty = memberPartyMap()

  return (
    /* The page has a colour of its own now: the site's jade, washed over the
       same weave every other page uses, fading out down the last stretch so
       the closing source notes sit on plain ground. Same construction as
       TopicBackground on /policies/[topic], but a fixed colour and no
       measuring — nothing here changes hue as you read. isolation + zIndex
       keep the wash behind the content without it escaping the page. */
    <div style={{ ...WOVEN_PAGE, position: 'relative', isolation: 'isolate' }}>
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none',
          backgroundColor: JADE,
          WebkitMaskImage: BILLS_WASH, maskImage: BILLS_WASH,
        }}
      />

      {/* Header. No rule under it — the page and the header share the same
          woven ground, and the line was drawing a box around a title. */}
      <div>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '48px clamp(18px, 5vw, 36px) 24px' }}>
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

          {/* Moved up from the defining-bills section below: it dates the whole
              page, not just that one carousel, and under the title is where a
              reader looks to find out which years they are reading about. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <Landmark style={{ width: 16, height: 16, color: JADE_DARK }} />
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: JADE_DARK, fontFamily: MANROPE }}>Since the 2023 election</span>
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
          {/* The description that stood here is in the (i) beside the heading.
              What the list covers and how to filter it is orientation, and the
              filters themselves are directly below, visible and labelled. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Sized to match "The most debated bills" above it: the two are
                peer sections of this page, and at 20px against 24px this one
                read as a subheading of the carousel rather than its own. */}
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.025em', color: INK, fontFamily: MANROPE, margin: 0 }}>All bills this term</h2>
            <AboutAllBills />
          </div>
        </div>

        {/* Suspense because the tracker calls useSearchParams: without a
            boundary that opts the whole route out of static rendering again. */}
        <Suspense fallback={null}>
          <BillsTracker54 readerSlugs={readerSlugs} readerSummaries={readerSummaries} memberParty={memberParty} />
        </Suspense>

        {/* The other half of what backbenchers are doing: bills lodged and
            waiting on a draw. Below the tracker because they are not in it —
            they have not been introduced. */}
        <BallotBills />

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
