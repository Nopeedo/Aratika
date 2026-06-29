'use client'

/**
 * VideoSection — "Leaders & the press". A swipeable rail of official YouTube
 * videos (press standups, leader updates, debates) filterable by party. Clicking
 * opens a privacy-enhanced (youtube-nocookie) pop-up player — we embed, we don't
 * rehost. See src/lib/news/videos.ts.
 */

import { useRef, useState, useEffect } from 'react'
import { Play, X, ChevronLeft, ChevronRight, Vote } from 'lucide-react'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import type { PartySlug } from '@/types'
import type { VideoItem } from '@/lib/news/videos'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function VideoSection({ videos }: { videos: VideoItem[] }) {
  const [party, setParty] = useState('all')
  const [open, setOpen] = useState<VideoItem | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (videos.length === 0) return null
  const counts: Record<string, number> = {}
  for (const v of videos) for (const p of v.parties) counts[p] = (counts[p] || 0) + 1
  const partyKeys = Object.keys(counts).sort((a, b) => counts[b] - counts[a])
  const shown = videos.filter((v) => party === 'all' || v.parties.includes(party))
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 300, behavior: 'smooth' })

  return (
    <section style={{ marginBottom: 30 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
        <h2 style={{ fontSize: 19, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>Leaders &amp; the press</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => scroll(-1)} aria-label="Scroll left" style={arrowBtn}><ChevronLeft style={{ width: 18, height: 18 }} /></button>
          <button onClick={() => scroll(1)} aria-label="Scroll right" style={arrowBtn}><ChevronRight style={{ width: 18, height: 18 }} /></button>
        </div>
      </div>
      <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 12px' }}>Press standups, leader updates and debates — straight from official channels.</p>

      {/* party filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
        <FChip label="All" active={party === 'all'} onClick={() => setParty('all')} />
        {partyKeys.map((p) => (
          <FChip key={p} label={`${PARTY_NAMES[p as PartySlug]?.short ?? p} (${counts[p]})`} dot={PARTY_COLORS[p as PartySlug]?.bg} active={party === p} onClick={() => setParty(party === p ? 'all' : p)} />
        ))}
      </div>

      <div ref={ref} className="vid-rail" style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 8 }}>
        {shown.map((v) => (
          <button key={v.id} onClick={() => setOpen(v)} className="story-card" style={{ flex: '0 0 286px', width: 286, scrollSnapAlign: 'start', textAlign: 'left', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', padding: 0, fontFamily: MANROPE }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play style={{ width: 22, height: 22, color: '#fff', marginLeft: 3 }} fill="#fff" />
                </span>
              </span>
              {v.electionRelevant && (
                <span style={{ position: 'absolute', top: 8, right: 8, display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 800, color: '#3a2c00', background: '#F6CE45', borderRadius: 999, padding: '2px 7px' }}>
                  <Vote style={{ width: 10, height: 10 }} /> ELECTION
                </span>
              )}
            </div>
            <div style={{ padding: '11px 13px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: SECONDARY, marginBottom: 5 }}>{v.source}</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: INK, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.title}</div>
              {v.parties.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                  {v.parties.map((p) => (
                    <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, color: SECONDARY, background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: 999, padding: '2px 7px' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: PARTY_COLORS[p as PartySlug]?.bg ?? TERTIARY }} />
                      {PARTY_NAMES[p as PartySlug]?.short ?? p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* pop-up player */}
      {open && (
        <div onClick={() => setOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(900px, 96vw)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
              <div style={{ color: '#fff', fontFamily: MANROPE, fontSize: 14.5, fontWeight: 700, lineHeight: 1.3 }}>{open.title} <span style={{ color: 'rgba(255,255,255,.6)', fontWeight: 500 }}>· {open.source}</span></div>
              <button onClick={() => setOpen(null)} aria-label="Close" style={{ flexShrink: 0, width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.15)', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><X style={{ width: 18, height: 18 }} /></button>
            </div>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000', borderRadius: 12, overflow: 'hidden' }}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${open.videoId}?autoplay=1&rel=0`}
                title={open.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              />
            </div>
            <a href={`https://www.youtube.com/watch?v=${open.videoId}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 10, fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.75)', fontFamily: MANROPE, textDecoration: 'none' }}>Watch on YouTube ↗</a>
          </div>
        </div>
      )}
    </section>
  )
}

const arrowBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 999, border: `1px solid ${BORDER}`, background: '#fff', color: INK, cursor: 'pointer' }

function FChip({ label, active, onClick, dot }: { label: string; active: boolean; onClick: () => void; dot?: string }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, fontFamily: MANROPE, padding: '6px 12px', borderRadius: 999, cursor: 'pointer', color: active ? '#fff' : INK, background: active ? INK : '#fff', border: `1px solid ${active ? INK : BORDER}` }}>
      {dot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, display: 'inline-block' }} />}
      {label}
    </button>
  )
}
