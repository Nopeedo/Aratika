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
 * party's news would not be.
 */

import { useLastSeen } from '@/hooks/use-last-seen'
import { Newspaper, Play, ExternalLink } from 'lucide-react'
import type { NewsItem } from '@/lib/news/live'
import type { VideoItem } from '@/lib/news/videos'
import { BORDER, INK, JADE, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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

  const isNew = (iso: string | null) => {
    if (since == null || !iso) return false
    const t = Date.parse(iso)
    return Number.isFinite(t) && t > since
  }

  if (news.length === 0 && videos.length === 0) {
    return (
      <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
        Nothing tagged to {name} in the current window. Coverage is concentrated on ministers and
        party leaders — most backbenchers appear rarely, and that is the real state of the record
        rather than a gap in ours.
      </p>
    )
  }

  const NewFlag = () => (
    <span style={{
      fontSize: 9.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
      color: '#fff', background: JADE, borderRadius: 999, padding: '1px 6px', fontFamily: MANROPE,
    }}>New</span>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 26 }}>
      {news.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <Newspaper style={{ width: 13, height: 13, color: accent }} />
            <h3 style={{ fontSize: 12.5, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>In the news</h3>
          </div>
          {news.map((n, i) => (
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
              <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.35 }}>
                {n.title}
              </span>
            </a>
          ))}
        </div>
      )}

      {videos.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <Play style={{ width: 13, height: 13, color: accent }} />
            <h3 style={{ fontSize: 12.5, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>On video</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(120px, 100%), 1fr))', gap: 10 }}>
            {videos.map((v) => (
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
                <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.3, marginTop: 5 }}>
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
  )
}
