/**
 * /news ("Latest") — the live political-news feed for the 2026 election.
 * Aggregates headlines from NZ outlets' own RSS feeds (RNZ, Beehive, NZ Herald,
 * Stuff, Newsroom), tagged by party/issue. We link out to every original
 * article — we never republish their content.
 *
 * Redesigned against docs/DESIGN-SPEC.md, 24 September 2026. The shell lost:
 *  - the standfirst, four lines saying the page is a news feed above a news
 *    feed, with "tap any story to read it at the source" explaining a thing
 *    that is visibly a link (§6.1)
 *  - the transparency footer, 200-odd px of explanation sitting three screens
 *    BELOW the pills it explains, and the five-outlet link row inside it, which
 *    were five more links to places every single row already links to (§1.3)
 * Both are behind the (i) beside the title now (§1.2), except the outlet names,
 * which are the one visible source line the page keeps (bills/page.tsx:132).
 *
 * The h1's clamp was inert: 4.5vw is 16.9px at 375px, so it always rendered at
 * its 30px floor. /bills uses clamp(26px, 7vw, 40px), where the vw term
 * actually scales (§3.4).
 */

import type { Metadata } from 'next'
import { Newspaper } from 'lucide-react'
import { SectionDivider } from '@/components/ui/section-divider'
import { getNews } from '@/lib/news/live'
import { getVideos, getInterviewVideos } from '@/lib/news/videos'
import { NewsFeed } from '@/components/news/news-feed'
import { AboutNews, OUTLET_NAMES } from '@/components/news/about-news'
import { BORDER, INK, MANROPE, SECONDARY, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

// Revalidated, not force-dynamic.
// The feed is polled from the sources on a schedule, so a per-request render was
// rebuilding the same page for every visitor.
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Latest election news',
  description: 'Live New Zealand political news for the 2026 election, tagged by party and issue, from RNZ, the Beehive, NZ Herald, Stuff and Newsroom.',
}

/** 1080, the content column /bills, /parties, /elections and /budget use, so
 *  every block on the site starts and ends on the same two vertical lines at
 *  1920 (§5.19). This page was 920 and sat 160px narrower than its neighbours;
 *  the story rows grow into the extra width rather than multiplying (§2.14). */
const COL = 1080

export default async function NewsPage() {
  const [items, videos, interviews] = await Promise.all([getNews(), getVideos(), getInterviewVideos()])

  return (
    <div style={WOVEN_PAGE}>
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: COL, margin: '0 auto', padding: '40px clamp(18px, 5vw, 36px) 30px' }}>
          {/* "credible" came out of the label: it is an editorial judgement
              worn as a property of the sources, with no test the reader can
              check (§1.8). What the page can say is where the stories are
              from, which it now does on the source line below. */}
          <div style={{ marginBottom: 12 }}><SectionDivider type="official" label="Live from NZ newsrooms" /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'clamp(26px, 7vw, 40px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.08 }}>
              The Latest
            </h1>
            <AboutNews />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: COL, margin: '0 auto', padding: '26px clamp(18px, 5vw, 36px) 64px' }}>
        {items.length > 0 ? (
          <NewsFeed items={items} videos={videos} interviews={interviews} />
        ) : (
          <div style={{ textAlign: 'center', padding: '50px 24px', color: SECONDARY, fontFamily: MANROPE }}>
            <Newspaper style={{ width: 30, height: 30, color: '#cbd0d6', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 6 }}>The feed is updating</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 440, margin: '0 auto' }}>Latest stories will appear here shortly.</p>
          </div>
        )}

        {/* ONE 11.5px TERTIARY line, the shape /bills closes with. The rest of
            what the footer card said is in the (i) beside the title. Not links:
            every row on this page carries its outlet as a badge and a "Read at
            {outlet}" link already (§1.3). */}
        <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '26px 0 0', lineHeight: 1.6 }}>
          Stories from {OUTLET_NAMES.slice(0, -1).join(', ')} and{' '}
          {OUTLET_NAMES[OUTLET_NAMES.length - 1]}, read from their own news
          feeds and linked at the source. We never republish articles.
        </p>
      </div>
    </div>
  )
}
