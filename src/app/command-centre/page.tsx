/**
 * /command-centre — the PUBLIC explainer for Arapono's tracking feature.
 * Works logged-out: teaches what you can track (MPs, parties, policies, bills)
 * and how news + video come to you, lets a visitor try tracking on the spot
 * (anonymous — see CommandCentreTryIt), shows a live sample of the real feed,
 * and frames the 2026 election as the live payoff. Aesthetics are deliberately
 * plain for now — the pipeline first, the look later.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Target, Bell, Radio, ArrowRight, ExternalLink, Check,
  Users, Landmark, Scale, Gavel, Newspaper, Video,
} from 'lucide-react'
import { ElectionCountdown } from '@/components/homepage/election-countdown'
import { getNews } from '@/lib/news/live'
import { getVideos } from '@/lib/news/videos'
import { PARTY_DIRECTORY_ORDER, PARTY_PROFILES } from '@/constants/parties-data'
import { POLICY_TOPICS, POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import { CommandCentreTryIt } from '@/components/command-centre/try-it'
import type { BookmarkEntity } from '@/hooks/use-bookmarks'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export const metadata: Metadata = {
  title: 'Your Command Centre — track what matters',
  description: 'Track the MPs, parties, issues and bills that matter to you, and Arapono keeps you current with news and video on exactly those things — live through the 2026 election.',
}

function shortDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })
}

const TRACKABLES = [
  { icon: Users, label: 'MPs', body: 'Follow an MP — their votes, the bills they put up, and the news that names them.' },
  { icon: Landmark, label: 'Parties', body: 'Follow a party — policy announcements, their news and video, poll movement.' },
  { icon: Scale, label: 'Policies', body: 'Follow an issue like Housing — the bills on it and where every party stands.' },
  { icon: Gavel, label: 'Bills', body: 'Follow a bill — every stage from first reading to law, and how MPs voted.' },
  { icon: Newspaper, label: 'News', body: 'You don’t chase it — news about what you follow comes to you, from credible outlets.' },
  { icon: Video, label: 'Video', body: 'Leaders, debates and the press — clips tagged to the people and issues you track.' },
]

const STEPS = [
  { n: 1, title: 'Pick what matters', body: 'Tap Track on any MP, party, issue or bill — no sign-up needed to start.' },
  { n: 2, title: 'We watch it for you', body: 'Votes, bill stages, news and video on your things — gathered from official and credible sources.' },
  { n: 3, title: 'Walk in ready for 2026', body: 'Your feed stays current, and on election night you track the results live.' },
]

export default async function CommandCentrePage() {
  const [news, videos] = await Promise.all([getNews(6), getVideos(4)])

  const trackOptions: BookmarkEntity[] = [
    ...PARTY_DIRECTORY_ORDER.slice(0, 3).map((slug) => ({
      kind: 'party' as const, refId: slug, label: PARTY_PROFILES[slug].name,
      sublabel: 'Political party', href: `/parties/${slug}`, accent: PARTY_PROFILES[slug].color,
    })),
    ...POLICY_TOPIC_ORDER.slice(0, 3).map((t) => ({
      kind: 'policy' as const, refId: t, label: POLICY_TOPICS[t].label,
      sublabel: 'Policy issue', href: `/policies/${t}`, accent: JADE,
    })),
  ]

  return (
    <div style={{ background: '#fff' }}>
      {/* Hero */}
      <section style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px clamp(18px, 5vw, 36px) 40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, marginBottom: 14 }}>
            <Target style={{ width: 15, height: 15 }} /> Your Command Centre
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 6vw, 44px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 14px', lineHeight: 1.08 }}>
            Track what matters to you.<br />We keep it current.
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2.4vw, 18px)', fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 24px', lineHeight: 1.55, maxWidth: 640 }}>
            Politics is scattered across a dozen sources. Pick the MPs, parties, issues and bills you care about —
            and Arapono brings the news, video and votes on exactly those things into one place, kept up to date all
            the way to the 2026 election.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <a href="#try" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, color: '#fff', background: JADE, borderRadius: 11, padding: '12px 20px', textDecoration: 'none', fontFamily: MANROPE }}>
              Start tracking <ArrowRight style={{ width: 15, height: 15 }} />
            </a>
            <a href="#how" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, color: INK, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 11, padding: '12px 20px', textDecoration: 'none', fontFamily: MANROPE }}>
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* How it works — 3 steps */}
      <section id="how" style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}`, scrollMarginTop: 72 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px clamp(18px, 5vw, 36px)' }}>
          <h2 style={{ fontSize: 'clamp(22px, 4.5vw, 28px)', fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 24px' }}>How it works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 16 }}>
            {STEPS.map((s) => (
              <div key={s.n} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '22px 22px' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: JADE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, fontFamily: MANROPE, marginBottom: 14 }}>{s.n}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 6 }}>{s.title}</div>
                <p style={{ fontSize: 14, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you can track */}
      <section style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px clamp(18px, 5vw, 36px)' }}>
          <h2 style={{ fontSize: 'clamp(22px, 4.5vw, 28px)', fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 6px' }}>What you can track</h2>
          <p style={{ fontSize: 15, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 24px', lineHeight: 1.55 }}>Six kinds of things — the last two come to you automatically.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 14 }}>
            {TRACKABLES.map((t) => {
              const Icon = t.icon
              return (
                <div key={t.label} style={{ display: 'flex', gap: 13, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 16px' }}>
                  <span style={{ width: 40, height: 40, borderRadius: 11, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 20, height: 20, color: JADE }} />
                  </span>
                  <span>
                    <span style={{ display: 'block', fontSize: 15.5, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 3 }}>{t.label}</span>
                    <span style={{ display: 'block', fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.5 }}>{t.body}</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Try it now */}
      <section id="try" style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}`, scrollMarginTop: 72 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px clamp(18px, 5vw, 36px)' }}>
          <h2 style={{ fontSize: 'clamp(22px, 4.5vw, 28px)', fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 6px' }}>Try it now — no sign-up</h2>
          <p style={{ fontSize: 15, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 22px', lineHeight: 1.55 }}>Tap Track on a few and watch your command centre take shape. Sign up later to keep it across devices.</p>
          <CommandCentreTryIt options={trackOptions} />
        </div>
      </section>

      {/* A live look — real feed sample */}
      <section style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px clamp(18px, 5vw, 36px)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, marginBottom: 10 }}>
            <Radio style={{ width: 14, height: 14 }} /> A live look
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 4.5vw, 28px)', fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 6px' }}>This is the kind of update that lands in your feed</h2>
          <p style={{ fontSize: 15, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 22px', lineHeight: 1.55 }}>Real, current headlines and clips — tagged to parties and issues, so only the ones you follow reach you. Sourced, with a link out to the original.</p>

          {news.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {news.map((it) => (
                <a key={it.id} href={it.link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '13px 15px', textDecoration: 'none', background: '#fff' }}>
                  <Newspaper style={{ width: 17, height: 17, color: TERTIARY, flexShrink: 0, marginTop: 2 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.4, marginBottom: 3 }}>{it.title}</span>
                    <span style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE }}>{it.outlet}{it.pubDate ? ` · ${shortDate(it.pubDate)}` : ''}</span>
                  </span>
                  <ExternalLink style={{ width: 14, height: 14, color: TERTIARY, flexShrink: 0, marginTop: 2 }} />
                </a>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13.5, color: TERTIARY, fontFamily: MANROPE, fontStyle: 'italic' }}>The live news feed is warming up — check <Link href="/news" style={{ color: JADE }}>Latest</Link> for the current stream.</p>
          )}

          {videos.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: SECONDARY, fontFamily: MANROPE, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
                <Video style={{ width: 15, height: 15 }} /> Recent video
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: 12 }}>
                {videos.map((v) => (
                  <a key={v.id} href={`https://www.youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                    {v.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.thumbnail} alt="" style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }} />
                    )}
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.4, padding: '10px 12px' }}>{v.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Election — the live payoff */}
      <section style={{ background: '#0c0e12' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px clamp(18px, 5vw, 36px)' }}>
          <div className="live-dot" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(54,224,138,.12)', color: '#36e08a', border: '1px solid rgba(54,224,138,.25)', borderRadius: 999, padding: '6px 13px', fontSize: 12.5, fontWeight: 800, fontFamily: MANROPE, marginBottom: 18 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#36e08a', display: 'inline-block' }} />
            <ElectionCountdown />
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 4.5vw, 30px)', fontWeight: 800, color: '#fff', fontFamily: MANROPE, margin: '0 0 12px', lineHeight: 1.15 }}>Track the election in real time</h2>
          <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,.78)', fontFamily: MANROPE, margin: '0 0 20px', lineHeight: 1.6, maxWidth: 640 }}>
            Follow the parties and the local race on your ballot now. On election night, watch the results come in live —
            party vote, seats, and your electorate — sourced from the Electoral Commission, with the people and parties you
            track surfaced first.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
            {[
              { icon: Target, text: 'Your ballot, previewed' },
              { icon: Bell, text: 'Live results on the night' },
              { icon: Check, text: 'Your follows surfaced first' },
            ].map((f) => {
              const Icon = f.icon
              return (
                <span key={f.text} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,.9)', fontFamily: MANROPE }}>
                  <Icon style={{ width: 16, height: 16, color: '#36e08a' }} /> {f.text}
                </span>
              )
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ background: '#fff' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px clamp(18px, 5vw, 36px)', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(22px, 4.5vw, 28px)', fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 10px' }}>Start with one thing you care about</h2>
          <p style={{ fontSize: 15, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 22px', lineHeight: 1.55 }}>Track an MP, a party, or an issue — and let Arapono keep you current all the way to the vote.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <Link href="/parties" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, color: '#fff', background: JADE, borderRadius: 11, padding: '12px 20px', textDecoration: 'none', fontFamily: MANROPE }}>
              Browse parties <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
            <Link href="/policies" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, color: INK, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 11, padding: '12px 20px', textDecoration: 'none', fontFamily: MANROPE }}>
              Explore the issues
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
