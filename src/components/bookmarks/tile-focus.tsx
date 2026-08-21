'use client'

/**
 * TileFocus — the focused view of one tracked item's updates.
 *
 * Replaces the inline expand, which pushed every tile below it down the page.
 * That reflow is what made the earlier inbox feel like it kept growing the
 * dashboard, and the same complaint would have applied here. Instead the tile
 * lifts forward over a dimmed backdrop: the grid never moves.
 *
 * Every row goes somewhere. News opens the article at its outlet, legislation
 * and positions go to their page here, and video plays INSIDE the panel —
 * sending someone to YouTube for a two-minute clip loses them to the
 * recommendations column, and the site already embeds through the
 * privacy-enhanced player elsewhere.
 *
 * Reading marks read: opening an article or playing a video clears that item.
 * Opening the panel does not, because a glance is not reading — that was the red
 * dot's mistake.
 *
 * Routine coverage older than three days is not shown here; it is on the tracked
 * item's own page. See lib/notifications/rules.ts for why.
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { X, ExternalLink, Play, Check } from 'lucide-react'
import { isUrgent, byPriority, PANEL_LIMIT } from '@/lib/notifications/rules'
import { BORDER, INK, JADE, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

export interface TileUpdate {
  id: string
  category: string
  title: string
  url: string | null
  created_at: string
}

const CATEGORY_LABEL: Record<string, string> = {
  news: 'News', video: 'Video', bill: 'Legislation', submission: 'Legislation',
  candidate: 'Candidates', election: 'Election', position: 'Policy positions',
  'deep-dive': 'Policy positions',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function when(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

/** The videoId out of a YouTube watch/embed URL, or null if this is not one. */
function youTubeId(url: string | null): string | null {
  if (!url) return null
  const m = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/.exec(url)
  return m ? m[1] : null
}

export function TileFocus({ label, sublabel, href, updates, onClose, onRead }: {
  label: string
  sublabel?: string
  /** The tracked item's full history page. */
  href: string
  updates: TileUpdate[]
  onClose: () => void
  onRead: (ids: string[]) => void
}) {
  const [playing, setPlaying] = useState<string | null>(null)
  const [shown, setShown] = useState(false)

  // Mount, then animate — a transition cannot run from a state the element has
  // never been painted in.
  useEffect(() => {
    const t = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const dismiss = useCallback(() => {
    setShown(false)
    setTimeout(onClose, 200)
  }, [onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dismiss])

  const ordered = [...updates].sort(byPriority)
  const visible = ordered.slice(0, PANEL_LIMIT)
  const grouped: { label: string; items: TileUpdate[] }[] = []
  for (const u of visible) {
    const key = CATEGORY_LABEL[u.category] ?? 'Other'
    const hit = grouped.find((g) => g.label === key)
    if (hit) hit.items.push(u)
    else grouped.push({ label: key, items: [u] })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Updates on ${label}`}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: 'clamp(16px, 6vh, 64px) 16px',
        background: 'rgba(42,18,6,.5)',
        opacity: shown ? 1 : 0,
        transition: 'opacity .2s ease',
        overflowY: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss() }}
    >
      <div style={{
        width: 'min(460px, 100%)', background: '#fff', borderRadius: 16,
        border: `1px solid ${BORDER}`, boxShadow: '0 20px 50px rgba(42,18,6,.3)',
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0) scale(1)' : 'translateY(8px) scale(.985)',
        transition: 'opacity .22s ease, transform .22s cubic-bezier(.2,.8,.3,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{label}</div>
            {sublabel && <div style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE }}>{sublabel}</div>}
          </div>
          <button onClick={dismiss} aria-label="Close" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, borderRadius: 9, cursor: 'pointer',
            background: '#fff', border: `1px solid ${BORDER}`, color: INK,
          }}>
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>

        <div style={{ padding: '8px 16px 4px' }}>
          {grouped.map((g) => (
            <div key={g.label}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, margin: '10px 0 2px' }}>
                {g.label} · {g.items.length}
              </div>
              {g.items.map((u) => {
                const vid = u.category === 'video' ? youTubeId(u.url) : null
                const external = !!u.url && /^https?:\/\//.test(u.url) && !vid
                const urgent = isUrgent(u.category)

                const inner = (
                  <span style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    {urgent && (
                      <span style={{
                        flexShrink: 0, marginTop: 2, fontSize: 9.5, fontWeight: 800, letterSpacing: '.05em',
                        textTransform: 'uppercase', color: '#fff', background: '#b42318',
                        borderRadius: 999, padding: '1px 6px', fontFamily: MANROPE,
                      }}>Urgent</span>
                    )}
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.3 }}>
                        {u.title}
                      </span>
                      <span style={{ display: 'block', fontSize: 11, color: TERTIARY, fontFamily: MANROPE, marginTop: 1 }}>
                        {when(u.created_at)}
                      </span>
                    </span>
                    {vid ? <Play style={{ width: 12, height: 12, color: TERTIARY, flexShrink: 0, marginTop: 3 }} />
                      : external ? <ExternalLink style={{ width: 11, height: 11, color: TERTIARY, flexShrink: 0, marginTop: 3 }} /> : null}
                  </span>
                )
                const rowStyle: React.CSSProperties = {
                  display: 'block', textDecoration: 'none', padding: '7px 8px',
                  margin: '0 -8px', borderRadius: 9, cursor: 'pointer',
                }

                return (
                  <div key={u.id}>
                    {vid ? (
                      <button
                        onClick={() => { setPlaying((p) => (p === u.id ? null : u.id)); onRead([u.id]) }}
                        style={{ ...rowStyle, width: '100%', textAlign: 'left', background: 'none', border: 'none' }}
                      >{inner}</button>
                    ) : external ? (
                      <a href={u.url!} target="_blank" rel="noopener noreferrer" onClick={() => onRead([u.id])} style={rowStyle}>{inner}</a>
                    ) : u.url ? (
                      <Link href={u.url} onClick={() => onRead([u.id])} style={rowStyle}>{inner}</Link>
                    ) : (
                      <div style={rowStyle}>{inner}</div>
                    )}

                    {playing === u.id && vid && (
                      <div style={{ margin: '4px 0 8px', borderRadius: 10, overflow: 'hidden', aspectRatio: '16 / 9', background: '#000' }}>
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0`}
                          title={u.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                          allowFullScreen
                          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '10px 16px 14px', borderTop: `1px solid ${BORDER}`, marginTop: 6 }}>
          <button onClick={() => { onRead(updates.map((u) => u.id)); dismiss() }} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
            background: 'none', border: 'none', padding: 0,
            fontSize: 12, fontWeight: 800, color: SECONDARY, fontFamily: MANROPE,
          }}>
            <Check style={{ width: 12, height: 12 }} /> Mark these read
          </button>
          <Link href={href} style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
            {updates.length > PANEL_LIMIT ? `See all ${updates.length}` : 'See everything'} &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
