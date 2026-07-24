'use client'

/**
 * NewsFeed — the live "Latest" political-news feed. Filter by party or topic so
 * a voter can follow what's relevant to their decision. Every card links OUT to
 * the original article (we aggregate from credible outlets' RSS; we never
 * republish their content).
 */

import { useMemo, useRef, useState } from 'react'
import { ExternalLink, Landmark, Newspaper, ChevronLeft, ChevronRight } from 'lucide-react'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import type { PartySlug, PolicyTopic } from '@/types'
import type { NewsItem } from '@/lib/news/live'
import type { VideoItem } from '@/lib/news/videos'
import { VideoSection } from '@/components/news/video-section'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Deterministic date label (UTC) — safe for SSR/hydration (no Date.now()).
function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

export function NewsFeed({ items, videos = [] }: { items: NewsItem[]; videos?: VideoItem[] }) {
  const [party, setParty] = useState<string>('all')
  const [topic, setTopic] = useState<string>('all')

  const partyCounts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const it of items) for (const p of it.parties) c[p] = (c[p] || 0) + 1
    return c
  }, [items])
  const topicCounts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const it of items) for (const t of it.topics) c[t] = (c[t] || 0) + 1
    return c
  }, [items])

  const filtered = items.filter((it) =>
    (party === 'all' || it.parties.includes(party)) &&
    (topic === 'all' || it.topics.includes(topic)),
  )

  const partyKeys = Object.keys(partyCounts).sort((a, b) => partyCounts[b] - partyCounts[a])
  const topicKeys = Object.keys(topicCounts).sort((a, b) => topicCounts[b] - topicCounts[a])

  return (
    <div>
      {/* Stories rail — swipe through the most recent */}
      <StoryRail items={items.slice(0, 14)} />

      {/* Leaders & the press — video rail */}
      <VideoSection videos={videos} />

      {/* Filters */}
      <div style={{ marginBottom: 8, fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>Follow a party</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
        <Chip label="All parties" active={party === 'all'} onClick={() => setParty('all')} />
        {partyKeys.map((p) => (
          <Chip key={p} label={`${PARTY_NAMES[p as PartySlug]?.short ?? p} (${partyCounts[p]})`} active={party === p} dot={PARTY_COLORS[p as PartySlug]?.bg} onClick={() => setParty(party === p ? 'all' : p)} />
        ))}
      </div>
      {topicKeys.length > 0 && (
        <>
          <div style={{ marginBottom: 8, fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>By issue</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 22 }}>
            <Chip label="All issues" active={topic === 'all'} onClick={() => setTopic('all')} />
            {topicKeys.map((t) => (
              <Chip key={t} label={`${POLICY_TOPICS[t as PolicyTopic]?.label ?? t} (${topicCounts[t]})`} active={topic === t} onClick={() => setTopic(topic === t ? 'all' : t)} />
            ))}
          </div>
        </>
      )}

      <div style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, marginBottom: 14 }}>
        Showing <b style={{ color: INK }}>{filtered.length}</b> of {items.length} stories
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((it) => {
          const gov = it.kind === 'government'
          return (
            <a key={it.id} href={it.link} target="_blank" rel="noopener noreferrer" className="party-card" style={{ display: 'flex', gap: 14, textDecoration: 'none', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '14px 15px', background: '#fff' }}>
              <Thumb src={it.image} gov={gov} outlet={it.outlet} portrait={it.portrait} />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: gov ? '#92400e' : '#1e40af', background: gov ? '#fff7e6' : '#eef4ff', borderRadius: 999, padding: '3px 9px', fontFamily: MANROPE }}>
                    {gov ? <Landmark style={{ width: 11, height: 11 }} /> : <Newspaper style={{ width: 11, height: 11 }} />}{it.outlet}
                  </span>
                  {it.pubDate && <span style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE }}>{fmtDate(it.pubDate)}</span>}
                  {it.cc && <span style={{ fontSize: 10, fontWeight: 700, color: '#065f46', background: '#ecfdf5', borderRadius: 5, padding: '1px 6px', fontFamily: MANROPE }} title="Creative Commons — openly licensed">CC</span>}
                </div>
                <div style={{ fontSize: 15.5, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.35, marginBottom: 6 }}>{it.title}</div>
                {it.snippet && <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.5, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{it.snippet}</p>}
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {it.parties.map((p) => (
                    <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: SECONDARY, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '2px 8px', fontFamily: MANROPE }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: PARTY_COLORS[p as PartySlug]?.bg ?? TERTIARY }} />
                      {PARTY_NAMES[p as PartySlug]?.short ?? p}
                    </span>
                  ))}
                  <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 800, color: JADE, fontFamily: MANROPE }}>
                    Read at {it.outlet} <ExternalLink style={{ width: 12, height: 12 }} />
                  </span>
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}

function StoryRail({ items }: { items: NewsItem[] }) {
  const ref = useRef<HTMLDivElement>(null)
  if (items.length === 0) return null
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 300, behavior: 'smooth' })
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>In the headlines</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => scroll(-1)} aria-label="Scroll left" style={arrowBtn}><ChevronLeft style={{ width: 18, height: 18 }} /></button>
          <button onClick={() => scroll(1)} aria-label="Scroll right" style={arrowBtn}><ChevronRight style={{ width: 18, height: 18 }} /></button>
        </div>
      </div>
      <div ref={ref} className="story-rail" style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 8, scrollbarWidth: 'thin' }}>
        {items.map((it) => <StoryCard key={it.id} it={it} />)}
      </div>
      <style>{`.story-rail::-webkit-scrollbar{height:8px}.story-rail::-webkit-scrollbar-track{background:transparent}.story-rail::-webkit-scrollbar-thumb{background:#d8d5cf;border-radius:99px}`}</style>
    </div>
  )
}

function StoryCard({ it }: { it: NewsItem }) {
  const [err, setErr] = useState(false)
  const gov = it.kind === 'government'
  const accent = it.parties[0] ? (PARTY_COLORS[it.parties[0] as PartySlug]?.bg ?? '#1b1d22') : '#1b1d22'
  const hasImg = it.image && !err
  return (
    <a href={it.link} target="_blank" rel="noopener noreferrer" className="story-card" style={{ position: 'relative', flex: '0 0 264px', width: 264, height: 330, borderRadius: 16, overflow: 'hidden', scrollSnapAlign: 'start', textDecoration: 'none', background: accent, border: `1px solid ${BORDER}`, display: 'block' }}>
      {hasImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={it.image!} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setErr(true)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : it.portrait ? (
        // No published picture (the Beehive's releases carry none), so show a
        // portrait of an MP the item names. Labelled with their name so it reads as
        // a portrait, not as a photograph taken from the story.
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={it.portrait.src} alt={it.portrait.name} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
          <span style={{ position: 'absolute', top: 10, left: 10, zIndex: 2, fontSize: 10.5, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,.55)', borderRadius: 999, padding: '3px 9px', fontFamily: MANROPE }}>
            {it.portrait.name}
          </span>
        </>
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {gov ? <Landmark style={{ width: 40, height: 40, color: 'rgba(255,255,255,.5)' }} /> : <Newspaper style={{ width: 40, height: 40, color: 'rgba(255,255,255,.5)' }} />}
        </div>
      )}
      {/* gradient for legibility */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,.15) 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,.78) 100%)' }} />

      {/* top row: outlet + date */}
      <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,.45)', borderRadius: 999, padding: '3px 9px', fontFamily: MANROPE, backdropFilter: 'blur(2px)' }}>{it.outlet}</span>
        {it.pubDate && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,.45)', borderRadius: 999, padding: '3px 9px', fontFamily: MANROPE, backdropFilter: 'blur(2px)' }}>{fmtDate(it.pubDate)}</span>}
      </div>

      {/* bottom: headline + tags */}
      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', fontFamily: MANROPE, lineHeight: 1.28, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 8 }}>{it.title}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {it.parties.map((p) => (
            <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,.18)', borderRadius: 999, padding: '2px 7px', fontFamily: MANROPE }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: PARTY_COLORS[p as PartySlug]?.bg ?? '#fff' }} />
              {PARTY_NAMES[p as PartySlug]?.short ?? p}
            </span>
          ))}
          {it.topics.slice(0, 2).map((t) => (
            <span key={t} style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,.18)', borderRadius: 999, padding: '2px 7px', fontFamily: MANROPE }}>
              {POLICY_TOPICS[t as PolicyTopic]?.label ?? t}
            </span>
          ))}
        </div>
      </div>
    </a>
  )
}

const arrowBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 999, border: `1px solid ${BORDER}`, background: '#fff', color: INK, cursor: 'pointer' }

function Thumb({ src, gov, outlet, portrait }: { src: string | null; gov: boolean; outlet: string; portrait?: { src: string; name: string } | null }) {
  const [err, setErr] = useState(false)
  const box: React.CSSProperties = { width: 116, height: 88, flexShrink: 0, borderRadius: 10, overflow: 'hidden', background: gov ? '#fff7e6' : '#eef4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }
  if (src && !err) {
    return (
      <div style={box}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    )
  }
  // No published picture — fall back to a portrait of an MP the item names, with
  // their name as alt text so it is announced as a person, not a story photo.
  if (portrait) {
    return (
      <div style={box} title={portrait.name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={portrait.src} alt={portrait.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
      </div>
    )
  }
  return (
    <div style={box} aria-hidden title={outlet}>
      {gov ? <Landmark style={{ width: 24, height: 24, color: '#b4810b' }} /> : <Newspaper style={{ width: 24, height: 24, color: '#5b7cc4' }} />}
    </div>
  )
}

function Chip({ label, active, onClick, dot }: { label: string; active: boolean; onClick: () => void; dot?: string }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, fontFamily: MANROPE, padding: '6px 12px', borderRadius: 999, cursor: 'pointer', color: active ? '#fff' : INK, background: active ? INK : '#fff', border: `1px solid ${active ? INK : BORDER}` }}>
      {dot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, display: 'inline-block' }} />}
      {label}
    </button>
  )
}
