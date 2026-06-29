/**
 * /news ("Latest") — the live political-news feed for the 2026 election.
 * Aggregates headlines from credible NZ outlets' own RSS feeds (RNZ, Beehive,
 * NZ Herald, Stuff, Newsroom), tagged by party/issue. We link out to every
 * original article — we never republish their content.
 */

import type { Metadata } from 'next'
import { ExternalLink, Newspaper } from 'lucide-react'
import { SectionDivider } from '@/components/ui/section-divider'
import { getNews } from '@/lib/news/live'
import { getVideos } from '@/lib/news/videos'
import { NewsFeed } from '@/components/news/news-feed'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Latest — election news',
  description: 'Live New Zealand political news for the 2026 election, from credible outlets — RNZ, the Beehive, NZ Herald, Stuff and Newsroom — tagged by party and issue.',
}

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const SOURCES = [
  { name: 'RNZ', url: 'https://www.rnz.co.nz/news/political' },
  { name: 'The Beehive', url: 'https://www.beehive.govt.nz' },
  { name: 'NZ Herald', url: 'https://www.nzherald.co.nz/nz/politics/' },
  { name: 'Stuff', url: 'https://www.stuff.co.nz/national/politics' },
  { name: 'Newsroom', url: 'https://www.newsroom.co.nz' },
]

export default async function NewsPage() {
  const [items, videos] = await Promise.all([getNews(), getVideos()])

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '40px 36px 30px' }}>
          <div style={{ marginBottom: 12 }}><SectionDivider type="official" label="Live — credible NZ sources" /></div>
          <h1 style={{ fontSize: 'clamp(30px, 4.5vw, 44px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.08 }}>
            The Latest
          </h1>
          <p style={{ fontSize: 16, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: '10px 0 0', maxWidth: 660, lineHeight: 1.55 }}>
            Track the 2026 campaign as it happens — every party, every issue. Aggregated from credible NZ newsrooms and official sources; tap any story to read it at the source.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '26px 36px 64px' }}>
        {items.length > 0 ? (
          <NewsFeed items={items} videos={videos} />
        ) : (
          <div style={{ textAlign: 'center', padding: '50px 24px', color: SECONDARY, fontFamily: MANROPE }}>
            <Newspaper style={{ width: 30, height: 30, color: '#cbd0d6', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 6 }}>The feed is updating</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 440, margin: '0 auto' }}>Latest stories will appear here shortly.</p>
          </div>
        )}

        {/* Transparency footer */}
        <div style={{ marginTop: 32, padding: '16px 18px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 6 }}>How this works</div>
          <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 10px' }}>
            Aratika aggregates headlines from credible outlets’ own news feeds and links straight to the original — we don’t republish articles. Party/issue tags are automatic. We’re non-partisan: stories come from a spread of sources and cover every party.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            {SOURCES.map((s) => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
                {s.name} <ExternalLink style={{ width: 11, height: 11 }} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
