/**
 * PartyCoverage — recent news and video tagged to one party, on that party's page.
 *
 * The site already ingests and tags all of this; until now a party page was the
 * one place you could read what a party says about itself and see nothing of
 * what is being reported about it. Both columns are drawn from the same approved
 * pool as /news and the Election Centre, so nothing here bypasses editorial
 * review.
 *
 * Coverage is uneven by party and that is left visible rather than padded: the
 * registered minor parties genuinely have little or no coverage in the pool, and
 * an empty column stating so is honest, where filling it with loosely-related
 * items would not be. Same principle as the unpolled tiles in the Election
 * Centre.
 */

import Link from 'next/link'
import { Newspaper, Play, ArrowRight } from 'lucide-react'
import { getNewsForParty } from '@/lib/news/live'
import { getVideosForParty } from '@/lib/news/videos'
import { INK, SECONDARY, TERTIARY, BORDER, MANROPE, tint } from '@/constants/theme'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Absolute date, formatted without reading the clock — this renders on the
 *  server and a relative age would differ by the time it hydrated. */
function shortDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

function ColumnHeading({ icon: Icon, label, accent }: { icon: React.ElementType; label: string; accent: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span style={{ width: 24, height: 24, borderRadius: 8, background: tint(accent, 0.14), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 13, height: 13, color: accent }} />
      </span>
      <h3 style={{ fontSize: 13.5, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>{label}</h3>
    </div>
  )
}

function Empty({ what }: { what: string }) {
  return (
    <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.55, margin: 0 }}>
      No {what} tagged to this party in the current window. That is the real state of the
      pool, not a loading error — coverage of the smaller parties is genuinely thin.
    </p>
  )
}

export async function PartyCoverage({ slug, name, colour }: { slug: string; name: string; colour: string }) {
  const [news, videos] = await Promise.all([
    getNewsForParty(slug, 5),
    getVideosForParty(slug, 4),
  ])
  if (news.length === 0 && videos.length === 0) return null

  return (
    <div style={{ borderTop: `1px solid ${BORDER}` }}>
      <div className="ap-col" style={{ maxWidth: 1080, margin: '0 auto', padding: '30px 36px 36px' }}>

        <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>
          Latest coverage
        </h2>
        <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 20px', lineHeight: 1.5 }}>
          News and video mentioning {name}, from the sources on our coverage page.
        </p>

        <div style={{ display: 'grid', // min() so the track can never be wider than its container: a bare
          // minmax(300px, …) is 300px even inside a 288px column on a 320px
          // phone, and the overflow only hides because the page gutter absorbs it.
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 28 }}>

          <div>
            <ColumnHeading icon={Newspaper} label="In the news" accent={colour} />
            {news.length === 0 ? <Empty what="news" /> : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {news.map((n, i) => (
                  <a key={n.id} href={n.link} target="_blank" rel="noopener noreferrer" style={{
                    display: 'block', textDecoration: 'none', padding: '11px 0',
                    borderTop: i === 0 ? 'none' : `1px solid ${BORDER}`,
                  }}>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.35 }}>
                      {n.title}
                    </span>
                    <span style={{ display: 'block', fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 3 }}>
                      {n.outlet}{n.pubDate ? ` · ${shortDate(n.pubDate)}` : ''}
                    </span>
                  </a>
                ))}
              </div>
            )}
            <Link href="/news" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: colour, fontFamily: MANROPE, textDecoration: 'none', marginTop: 12 }}>
              All news <ArrowRight style={{ width: 13, height: 13 }} />
            </Link>
          </div>

          <div>
            <ColumnHeading icon={Play} label="On video" accent={colour} />
            {videos.length === 0 ? <Empty what="video" /> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(130px, 100%), 1fr))', gap: 12 }}>
                {videos.map((v) => (
                  <a key={v.id} href={`https://www.youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <span style={{ position: 'relative', display: 'block', aspectRatio: '16 / 9', borderRadius: 9, overflow: 'hidden', background: tint(colour, 0.1) }}>
                      {v.thumbnail && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Play style={{ width: 14, height: 14, color: '#fff', marginLeft: 2 }} fill="#fff" />
                        </span>
                      </span>
                    </span>
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.3, marginTop: 6 }}>
                      {v.title.length > 68 ? v.title.slice(0, 68) + '…' : v.title}
                    </span>
                    <span style={{ display: 'block', fontSize: 11, color: TERTIARY, fontFamily: MANROPE, marginTop: 2 }}>
                      {v.source}{v.pubDate ? ` · ${shortDate(v.pubDate)}` : ''}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
