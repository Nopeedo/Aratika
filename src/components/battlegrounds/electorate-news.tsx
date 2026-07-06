/**
 * ElectorateNews — a compact, sourced news/video feed for a single battleground.
 * Reuses the same content_items pipeline as the main news feed (see
 * scripts/ingest-news.mjs / ingest-videos.mjs) — nothing here is written or
 * curated specifically for this page, it's a filtered view of the real feed.
 * An honest empty state shows when no article yet names this seat or its MP —
 * that's the normal case for most electorates, not a gap in our data.
 */

import { Landmark, Newspaper, ExternalLink, PlayCircle } from 'lucide-react'
import { getNewsForElectorate, type NewsItem } from '@/lib/news/live'
import { getVideosForElectorate, type VideoItem } from '@/lib/news/videos'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

export async function ElectorateNews({ electorateName }: { electorateName: string }) {
  const [news, videos] = await Promise.all([
    getNewsForElectorate(electorateName, 5),
    getVideosForElectorate(electorateName, 2),
  ])

  if (news.length === 0 && videos.length === 0) {
    return (
      <div style={{ display: 'flex', gap: 12, padding: '16px 18px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14 }}>
        <Newspaper style={{ width: 18, height: 18, color: TERTIARY, flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>
          No coverage naming {electorateName} or its MP yet in our tracked feeds — this fills in automatically as outlets report on the race.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {videos.map((v) => <VideoRow key={v.id} v={v} />)}
      {news.map((n) => <NewsRow key={n.id} n={n} />)}
    </div>
  )
}

function NewsRow({ n }: { n: NewsItem }) {
  const gov = n.kind === 'government'
  return (
    <a href={n.link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: 12, textDecoration: 'none', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 14px', background: '#fff' }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: gov ? '#fff7e6' : '#eef4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {gov ? <Landmark style={{ width: 15, height: 15, color: '#b4810b' }} /> : <Newspaper style={{ width: 15, height: 15, color: '#5b7cc4' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE }}>{n.outlet}</span>
          {n.pubDate && <span style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE }}>· {fmtDate(n.pubDate)}</span>}
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.4 }}>{n.title}</div>
      </div>
      <ExternalLink style={{ width: 13, height: 13, color: TERTIARY, flexShrink: 0, marginTop: 3 }} />
    </a>
  )
}

function VideoRow({ v }: { v: VideoItem }) {
  return (
    <a href={`https://www.youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: 12, textDecoration: 'none', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 14px', background: '#fff' }}>
      <div style={{ position: 'relative', width: 54, height: 40, borderRadius: 8, flexShrink: 0, overflow: 'hidden', background: '#000' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={v.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <PlayCircle style={{ position: 'absolute', inset: 0, margin: 'auto', width: 18, height: 18, color: '#fff' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE }}>{v.source}</span>
          {v.pubDate && <span style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE }}>· {fmtDate(v.pubDate)}</span>}
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.4 }}>{v.title}</div>
      </div>
      <ExternalLink style={{ width: 13, height: 13, color: TERTIARY, flexShrink: 0, marginTop: 3 }} />
    </a>
  )
}
