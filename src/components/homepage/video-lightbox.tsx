'use client'

/**
 * VideoLightbox — plays a clip in a panel over the page instead of sending the
 * reader to YouTube. The front page is a one-stop scroll-through; losing your
 * place to watch a 40-second clip is the opposite of that.
 *
 * Not every video CAN be embedded: a channel can switch embedding off, and
 * some clips are blocked in some countries. The player reports that as an
 * error code (101 / 150) rather than showing anything useful, so this listens
 * for it and falls back to opening the clip on YouTube in a new tab, closing
 * the panel behind it. The reader gets the video either way and never lands on
 * a dead black box.
 *
 * Uses the YouTube IFrame Player API, loaded once and shared. The clip is
 * requested from youtube-nocookie.com, which doesn't set tracking cookies
 * unless the video is actually played.
 */

import { useEffect, useRef, useState } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { INK, MANROPE, SECONDARY } from '@/constants/theme'

export interface PlayingVideo { videoId: string; title: string; source: string }

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void }
}

/** Load the IFrame API once per page; resolve as soon as it's ready. */
let apiPromise: Promise<any> | null = null
function loadApi(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('server'))
  if (window.YT?.Player) return Promise.resolve(window.YT)
  apiPromise ??= new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(window.YT) }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  })
  return apiPromise
}

export function VideoLightbox({ video, accent, onClose }: {
  video: PlayingVideo
  accent: string
  onClose: () => void
}) {
  const holder = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const watchUrl = `https://www.youtube.com/watch?v=${video.videoId}`

  // Escape closes, and the page behind must not scroll under the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  useEffect(() => {
    let player: any = null
    let cancelled = false
    loadApi().then((YT) => {
      if (cancelled || !holder.current) return
      player = new YT.Player(holder.current, {
        videoId: video.videoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          // 101 and 150 both mean "the owner doesn't allow embedding". 2 and 5
          // are a bad id / an unplayable clip. All of them leave a dead frame,
          // so hand the reader to YouTube instead.
          onError: () => {
            if (cancelled) return
            setFailed(true)
            window.open(watchUrl, '_blank', 'noopener,noreferrer')
            onClose()
          },
        },
      })
    }).catch(() => setFailed(true))
    return () => { cancelled = true; try { player?.destroy() } catch { /* already gone */ } }
  }, [video.videoId, watchUrl, onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 80,
        background: 'rgba(12,14,18,.72)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(12px, 4vw, 32px)',
      }}
    >
      {/* Stop clicks inside the panel from closing it. */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(880px, 100%)', background: '#fff', borderRadius: 16, overflow: 'hidden',
          border: `4px solid ${accent}`, boxShadow: '0 24px 60px -12px rgba(12,14,18,.5)',
        }}
      >
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000' }}>
          {!failed && <div ref={holder} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />}
          {failed && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
              <p style={{ color: '#fff', fontSize: 14.5, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
                This clip can&rsquo;t be played here. Opening it on YouTube&hellip;
              </p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, marginBottom: 2 }}>{video.source}</div>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.35 }}>{video.title}</div>
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 13, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, textDecoration: 'none' }}
            >
              Watch on YouTube <ExternalLink style={{ width: 12, height: 12 }} />
            </a>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close video"
            style={{
              // Fixed box + alignSelf: the row stretches its children, and a
              // stretched circle is an oval.
              flexShrink: 0, alignSelf: 'flex-start', boxSizing: 'border-box',
              width: 32, height: 32, minWidth: 32, minHeight: 32, padding: 0,
              borderRadius: '50%', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: `1.5px solid ${accent}`, color: INK,
            }}
          >
            <X style={{ width: 17, height: 17 }} />
          </button>
        </div>
      </div>
    </div>
  )
}
