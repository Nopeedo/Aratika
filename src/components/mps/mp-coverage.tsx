'use client'

/**
 * MpCoverage — news and video about one MP, on their profile.
 *
 * Tracking an MP got you a push and then dropped you on a page with no sign of
 * what had happened. The site has tagged every approved item by MP since the
 * ingest was built; the profile was the one place that never showed it.
 *
 * NEW SINCE YOUR LAST VISIT IS MARKED. That is the point of arriving here from a
 * notification: the reader wants to know which of these they have not seen, not
 * to re-read a week of coverage. Last-visit is per MP in localStorage, the same
 * mechanism the command centre uses — deliberately not a schema change, and it
 * degrades to "nothing marked" rather than to a wrong claim.
 *
 * Coverage is wildly uneven and stays visible rather than padded. Measured
 * across the approved pool: 58 of 123 MPs have any coverage, the median for
 * those who do is 6 items, and the range runs from Christopher Luxon on 165 to a
 * backbencher on 1. An empty state saying so is honest; filling it with the
 * party's news would not be. Those numbers now go in the (i) beside the
 * heading, where they can be stated as measurements rather than asserted as
 * three clauses of prose in the empty state (§1.2, §1.5).
 *
 * Folded per §3.6: three stories and two videos, then "Show N more" on the
 * fade. It was 837px of everything at once, below a record the page leads with.
 */

import { useState } from 'react'
import { useLastSeen } from '@/hooks/use-last-seen'
import { Newspaper, Play, ExternalLink, ChevronDown } from 'lucide-react'
import type { NewsItem } from '@/lib/news/live'
import type { VideoItem } from '@/lib/news/videos'
import { BORDER, INK, JADE, MANROPE, TERTIARY } from '@/constants/theme'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** §3.6's measured stops, copied verbatim from defining-bills.tsx. They are
 *  measured from the bottom of the PADDED box, and the 34px of collapsed
 *  padding below is the room the control sits in. */
const FOLD_MASK = 'linear-gradient(to bottom, #000 0%, #000 calc(100% - 86px), rgba(0,0,0,.12) calc(100% - 26px), transparent calc(100% - 10px))'

const VISIBLE_NEWS = 3
const VISIBLE_VIDEOS = 2

function shortDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

export function MpCoverage({ slug, name, accent, news, videos }: {
  slug: string
  name: string
  accent: string
  news: NewsItem[]
  videos: VideoItem[]
}) {
  // Shared with MpChanges through useLastSeen: both need the same "previous
  // visit" value, and when each read-and-stamped its own copy the second one to
  // mount always compared against the timestamp the first had just written.
  const since = useLastSeen(`mp_seen_${slug}`)
  const [showAll, setShowAll] = useState(false)

  const isNew = (iso: string | null) => {
    if (since == null || !iso) return false
    const t = Date.parse(iso)
    return Number.isFinite(t) && t > since
  }

  if (news.length === 0 && videos.length === 0) {
    // §1.5: say the gap, once, in one line. Why coverage is uneven is a
    // how-to-read-this and lives in the (i) beside the heading.
    return (
      <p style={{ fontSize: 13, color: TERTIARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
        Nothing tagged to {name} in the current window.
      </p>
    )
  }

  const hidden = Math.max(0, news.length - VISIBLE_NEWS) + Math.max(0, videos.length - VISIBLE_VIDEOS)
  const collapsed = !showAll && hidden > 0
  const shownNews = collapsed ? news.slice(0, VISIBLE_NEWS) : news
  const shownVideos = collapsed ? videos.slice(0, VISIBLE_VIDEOS) : videos

  const NewFlag = () => (
    <span style={{
      fontSize: 9.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
      color: '#fff', background: JADE, borderRadius: 999, padding: '1px 6px', fontFamily: MANROPE,
    }}>New</span>
  )

  return (
    <div style={{ position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: COVERAGE_CSS }} />
      <div
        className="mpc-grid"
        style={{
          display: 'grid',
          padding: collapsed ? '0 0 34px' : 0,
          ...(collapsed ? { WebkitMaskImage: FOLD_MASK, maskImage: FOLD_MASK } : null),
        }}
      >
        {shownNews.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <Newspaper style={{ width: 15, height: 15, color: accent }} />
              <h3 style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>In the news</h3>
            </div>
            {shownNews.map((n, i) => (
              <a key={n.id} href={n.link} target="_blank" rel="noopener noreferrer" style={{
                display: 'block', textDecoration: 'none', padding: '10px 0',
                borderTop: i === 0 ? 'none' : `1px solid ${BORDER}`,
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  {isNew(n.pubDate) && <NewFlag />}
                  <span style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE }}>
                    {n.outlet}{n.pubDate ? ` · ${shortDate(n.pubDate)}` : ''}
                  </span>
                  <ExternalLink style={{ width: 10, height: 10, color: TERTIARY }} />
                </span>
                <span className="mpc-title" style={{ display: 'block', fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.35 }}>
                  {n.title}
                </span>
              </a>
            ))}
          </div>
        )}

        {shownVideos.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <Play style={{ width: 15, height: 15, color: accent }} />
              <h3 style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>On video</h3>
            </div>
            <div className="mpc-videos" style={{ display: 'grid' }}>
              {shownVideos.map((v) => (
                <a key={v.id} href={`https://www.youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <span style={{ position: 'relative', display: 'block', aspectRatio: '16 / 9', borderRadius: 8, overflow: 'hidden', background: '#eee' }}>
                    {v.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    {isNew(v.pubDate) && (
                      <span style={{ position: 'absolute', top: 5, left: 5 }}><NewFlag /></span>
                    )}
                  </span>
                  <span className="mpc-vtitle" style={{ display: 'block', fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.3, marginTop: 5, overflow: 'hidden' }}>
                    {v.title.length > 60 ? v.title.slice(0, 60) + '…' : v.title}
                  </span>
                  <span style={{ display: 'block', fontSize: 10.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 1 }}>
                    {v.source}{v.pubDate ? ` · ${shortDate(v.pubDate)}` : ''}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Named number, on the fade (§3.6). */}
      {collapsed && (
        <button
          onClick={() => setShowAll(true)}
          aria-expanded={false}
          style={{
            position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)',
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 999,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: MANROPE, fontSize: 12, fontWeight: 800, color: INK,
          }}
        >
          Show {hidden} more
          <ChevronDown style={{ width: 15, height: 15 }} strokeWidth={3} />
        </button>
      )}

      {hidden > 0 && !collapsed && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <button
            onClick={() => setShowAll(false)}
            aria-expanded
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '8px 12px', margin: '-4px 0',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: MANROPE, fontSize: 12, fontWeight: 800, color: INK,
            }}
          >
            Show fewer
            <ChevronDown style={{ width: 15, height: 15, transform: 'rotate(180deg)' }} strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  )
}

/* Shipped with the component (§3.2). The video tiles were the desktop failure
   this block had: minmax(120px) inside a ~490px column gives four 118px
   thumbnails, so a wide screen got MORE of them rather than bigger ones. 180px
   above the breakpoint gives two ~240px tiles, and the titles step up with the
   frame (11.5 to 13) so the tile is the phone tile at scale, not a phone tile
   with more air around it (§2.14). */
const COVERAGE_CSS = `
.mpc-grid { grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr)); gap: 22px; }
.mpc-videos { grid-template-columns: repeat(auto-fit, minmax(min(120px, 100%), 1fr)); gap: 10px; }
.mpc-title { font-size: 13px; }
.mpc-vtitle { font-size: 11.5px; height: 30px; }
@media (min-width: 768px) {
  .mpc-grid { gap: 28px; }
  .mpc-videos { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
  .mpc-title { font-size: 14px; }
  /* Restated at the larger size: two lines of 13px is 34px where two lines of
     11.5px was 30, and an uneven title box staggers the row below it. */
  .mpc-vtitle { font-size: 13px; height: 34px; }
}
`
