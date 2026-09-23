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
 *
 * THE VIDEO CARD USED TO GET SMALLER ON A WIDE SCREEN. Measured: 166x167 at
 * 375px and 155x174 at 1920. The grid was
 * `repeat(auto-fit, minmax(min(130px, 100%), 1fr))`, which is two tracks in a
 * 343px phone column and THREE in the 490px column a desktop gives it, so the
 * extra width bought another card rather than a bigger one — §2.14's failure
 * exactly, and §5.19's reason for looking at 1920 at all. The grid is pinned to
 * two columns at every width now, so the same card is 165px wide on a phone and
 * 238px on a desktop, with the thumbnail, the type and the play badge all
 * stepped up to match. It is a scale, not a re-layout.
 */

import Link from 'next/link'
import { Play, ArrowRight } from 'lucide-react'
import { getNewsForParty } from '@/lib/news/live'
import { getVideosForParty } from '@/lib/news/videos'
import { CoverageInfo } from '@/components/parties/party-profile-info'
import { INK, TERTIARY, BORDER, MANROPE, tint } from '@/constants/theme'

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
      <span className="pc-head-chip" style={{ width: 24, height: 24, borderRadius: 8, background: tint(accent, 0.14), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 13, height: 13, color: accent }} />
      </span>
      <h3 className="pc-head-label" style={{ fontSize: 13.5, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>{label}</h3>
    </div>
  )
}

/**
 * §1.5: the gap is named. What it no longer does is claim a window it never
 * stated — "in the current window" was an ageing fact with no date against it
 * (§4), and the two feeds do not even share one: the news query has no time
 * filter at all and takes the whole approved pool, while video is cut off at
 * two years. Each says its own.
 *
 * The justification that used to follow ("that is the real state of the pool,
 * not a loading error, coverage of the smaller parties is genuinely thin") is
 * in the (i) beside the heading. It explains rather than informs, which is
 * §1.2's test.
 */
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="pc-empty" style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.55, margin: 0, maxWidth: '60ch' }}>
      {children}
    </p>
  )
}

export async function PartyCoverage({ slug, colour, partyName }: { slug: string; colour: string; partyName: string }) {
  const [news, videos] = await Promise.all([
    getNewsForParty(slug, 5),
    getVideosForParty(slug, 4),
  ])
  if (news.length === 0 && videos.length === 0) return null

  return (
    <div style={{ borderTop: `1px solid ${BORDER}` }}>
      <div className="ap-col" style={{ maxWidth: 1080, margin: '0 auto', padding: '20px clamp(18px, 5vw, 36px) 36px' }}>
        <style dangerouslySetInnerHTML={{ __html: COVERAGE_CSS }} />

        {/* A section heading, not a card title. This is the last band of the
            page and the only part of it that is not the party's own material,
            so it announces itself; at 16px it was the same size as the header
            of a collapsed rectangle and read as one more of them. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 6px' }}>
          <h2 style={{ fontSize: 'clamp(22px, 5.5vw, 28px)', fontWeight: 800, letterSpacing: '-.015em', color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.15 }}>
            Latest News &amp; Video
          </h2>
          <CoverageInfo accent={colour} partyName={partyName} />
        </div>
        {/* No standfirst. It said what the headings say: this is news and video
            about the party. "From the sources on our coverage page" named a
            page it did not link to, and it is provenance, so it is in the (i)
            above (§1.2, §1.8). */}

        <div className="pc-band" style={{ display: 'grid', // min() so the track can never be wider than its container: a bare
          // minmax(300px, …) is 300px even inside a 288px column on a 320px
          // phone, and the overflow only hides because the page gutter absorbs it.
          // auto-FIT, not auto-fill (§5.18) — with only two children an auto-fill
          // row on a wide screen would hold a third track open and empty.
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 28 }}>

          <div>
            {/* No "In the news" heading: the section is named Latest News &
                Video and the stories are the first thing under it, so the
                label was naming what was already obvious. "On video" stays,
                because the thumbnails below it need telling apart. */}
            {news.length === 0 ? (
              <Empty>Nothing we have collected mentions {partyName} yet.</Empty>
            ) : (
              /* One card per story, not rows split by hairlines. Every headline
                 here is a separate thing from a separate outlet, and a rule
                 between two two-line headlines is not enough to say so: a
                 reader scanning fast reads the block as one list of sentences.
                 Same white-on-tinted-border frame as the sections above, one
                 step smaller. (From the other session, kept through the merge
                 because this file's rewrite had not made the same change.) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {news.map((n) => (
                  <a key={n.id} href={n.link} target="_blank" rel="noopener noreferrer" className="pc-news" style={{
                    display: 'block', textDecoration: 'none', padding: '11px 13px',
                    background: '#fff', border: `1px solid ${tint(colour, 0.35)}`, borderRadius: 12,
                  }}>
                    <span className="pc-news-title" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.35, maxWidth: '58ch' }}>
                      {n.title}
                    </span>
                    <span className="pc-news-meta" style={{ display: 'block', fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 3 }}>
                      {n.outlet}{n.pubDate ? ` · ${shortDate(n.pubDate)}` : ''}
                    </span>
                  </a>
                ))}
              </div>
            )}
            <Link href="/news" className="pc-all" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: colour, fontFamily: MANROPE, textDecoration: 'none', marginTop: 12 }}>
              All news <ArrowRight style={{ width: 13, height: 13 }} />
            </Link>
          </div>

          <div>
            <ColumnHeading icon={Play} label="On video" accent={colour} />
            {videos.length === 0 ? (
              <Empty>No video from the past two years mentions {partyName}.</Empty>
            ) : (
              /* Two columns at EVERY width, not auto-fit. The feed holds at
                 most four clips, so an auto-fit track that fits three at 490px
                 spends a desktop's extra width on another column instead of a
                 bigger card — which is how this card came out 11px narrower at
                 1920 than at 375. Pinned, the card is the container's width and
                 grows with it: 165px on a phone, 238px on a desktop. */
              <div className="pc-videos" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                {videos.map((v) => (
                  <a key={v.id} href={`https://www.youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <span className="pc-thumb" style={{ position: 'relative', display: 'block', aspectRatio: '16 / 9', borderRadius: 9, overflow: 'hidden', background: tint(colour, 0.1) }}>
                      {v.thumbnail && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="pc-play" style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Play style={{ width: 14, height: 14, color: '#fff', marginLeft: 2 }} fill="#fff" />
                        </span>
                      </span>
                    </span>
                    {/* A FIXED two lines, clamped, not a manual slice at 68
                        characters. 68 characters is four lines at 165px and
                        two at 238px, so the cards in a row came out different
                        heights and, because grid items stretch to their row,
                        the stagger showed BETWEEN the two rows rather than
                        inside one (§2.14). The reserve is restated at the
                        larger size: two lines of 13.5px is 36px where two
                        lines of 12px was 32. */}
                    <span className="pc-vid-title" style={{
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      height: 32, fontSize: 12, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.3, marginTop: 6,
                    }}>
                      {v.title}
                    </span>
                    {/* One line, always: the source and the date together run
                        past 165px often enough that a wrap here staggered the
                        row the same way the title did. */}
                    <span className="pc-vid-meta" style={{ display: 'block', fontSize: 11, color: TERTIARY, fontFamily: MANROPE, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

/* Shipped with the component (§3.2). Everything below 768px is the composition
   as it was; everything above it is the same composition at a larger scale
   (§2.14, §5.19), which this band had none of — it was built at 375px and then
   rendered at 1920 with a 12px caption under a 155px thumbnail.

   Measured, before and after, at the two widths §5.19 names:
     video card   375px 165x148 → unchanged     1920px 155x174 → 238x197
     news title   13.5px at both              → 15.5px above 768
   The 4px the video card loses in the 768–790px band, where the two-column
   band first appears and each column is 334px, is left alone: it is narrower
   than the border it sits inside, and closing it would mean splitting the band
   at a third breakpoint. */
const COVERAGE_CSS = `
@media (min-width: 768px) {
  .pc-band { gap: 36px !important; }

  .pc-news { padding: 14px 0 !important; }
  .pc-news-title { font-size: 15.5px !important; }
  .pc-news-meta { font-size: 12.5px !important; margin-top: 4px !important; }
  .pc-all { font-size: 14px !important; margin-top: 16px !important; }
  .pc-all svg { width: 15px !important; height: 15px !important; }
  .pc-empty { font-size: 14px !important; }

  .pc-head-chip { width: 28px !important; height: 28px !important; border-radius: 9px !important; }
  .pc-head-chip svg { width: 15px !important; height: 15px !important; }
  .pc-head-label { font-size: 16px !important; }

  .pc-videos { gap: 14px !important; }
  .pc-thumb { border-radius: 11px !important; }
  .pc-play { width: 38px !important; height: 38px !important; }
  .pc-play svg { width: 17px !important; height: 17px !important; }
  /* The reserve, restated: 2 x 13.5px x 1.3 = 35.1, so 36 (§2.14). */
  .pc-vid-title { font-size: 13.5px !important; height: 36px !important; margin-top: 8px !important; }
  .pc-vid-meta { font-size: 12px !important; margin-top: 3px !important; }
}
`
