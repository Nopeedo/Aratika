'use client'

/**
 * PageViewTracker — sends one page view to /api/track per route change, for
 * the admin's own analytics (/editor/analytics). Renders nothing.
 *
 * Two random ids, neither tied to an account or a cookie:
 *   visitor  localStorage, so it survives visits: counts browsers.
 *   session  sessionStorage, so it lasts one tab sitting: counts visits.
 * If storage is blocked (private mode, blocked site data) each id falls back
 * to one made for this page load, so the view still counts.
 *
 * sendBeacon rather than fetch: it survives the page being closed or navigated
 * away from mid-send, and never holds up anything the reader is doing.
 */

import * as React from 'react'
import { usePathname } from 'next/navigation'

// Fallback ids when storage is blocked: one per page load, kept in memory so
// in-app navigation still reads as one visit rather than one per page.
const memory: Record<string, string> = {}

function stored(storage: 'localStorage' | 'sessionStorage', key: string): { id: string; fresh: boolean } {
  try {
    const s = window[storage]
    const have = s.getItem(key)
    if (have) return { id: have, fresh: false }
    const id = crypto.randomUUID()
    s.setItem(key, id)
    return { id, fresh: true }
  } catch {
    if (memory[key]) return { id: memory[key], fresh: false }
    memory[key] = crypto.randomUUID()
    return { id: memory[key], fresh: true }
  }
}

function send(path: string) {
  const visitor = stored('localStorage', 'politika-vid')
  const session = stored('sessionStorage', 'politika-sid')
  const payload = JSON.stringify({
    path,
    vid: visitor.id,
    sid: session.id,
    // Where the visit came from, only on its first page: after that
    // document.referrer is stale or our own site.
    ref: session.fresh ? document.referrer : '',
  })
  try {
    const blob = new Blob([payload], { type: 'application/json' })
    if (navigator.sendBeacon?.('/api/track', blob)) return
  } catch { /* fall through to fetch */ }
  fetch('/api/track', { method: 'POST', body: payload, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {})
}

/** How long a path has to hold before it counts. Redirecting routes change
 *  the path twice in quick succession (/policies becomes /policies/economy,
 *  /parties becomes the first party), and counting both would log a page
 *  nobody saw. */
const SETTLE_MS = 700

export function PageViewTracker() {
  const pathname = usePathname()
  // The last path sent, so a re-render or the development double effect on
  // the same path can't count one view twice.
  const last = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!pathname || last.current === pathname) return
    if (typeof crypto?.randomUUID !== 'function') return

    const flush = () => {
      window.clearTimeout(timer)
      window.removeEventListener('pagehide', flush)
      if (last.current === pathname) return
      last.current = pathname
      send(pathname)
    }
    const timer = window.setTimeout(flush, SETTLE_MS)
    // Leaving the site inside the settle window still counts the page.
    window.addEventListener('pagehide', flush)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pagehide', flush)
    }
  }, [pathname])

  return null
}
