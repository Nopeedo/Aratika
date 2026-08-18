'use client'

/**
 * RouteProgress — a thin bar across the top of the page while a navigation is
 * in flight.
 *
 * Why this exists: every route on the site takes between 0.8 and 2.3 seconds to
 * return its first byte (/policies/economy 2.3s, /battlegrounds/epsom 2.2s), and
 * until this there was NOTHING on screen to say a click had registered. The App
 * Router keeps the current page visible while the next one loads, so a reader
 * clicks, sees the same page for two seconds, and reasonably concludes the click
 * missed — so they click again. That was being reported across the whole site.
 *
 * Listens for clicks on internal links at the document level rather than
 * wrapping every Link, because there are hundreds of them across the app and a
 * component that must be remembered at each call site is one that will be
 * forgotten. Anything that changes the URL through a normal anchor is covered.
 *
 * It only ever ADDS reassurance: if a navigation is instant the bar appears and
 * completes within a frame or two, which reads as a flicker rather than a lie.
 */

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const CLAY = '#C2410C'

export function RouteProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [active, setActive] = useState(false)
  const [width, setWidth] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }

  // Finish on arrival. The pathname (or query) changing is the one reliable
  // signal that the navigation actually completed.
  useEffect(() => {
    clearTimers()
    setWidth(100)
    const t = setTimeout(() => { setActive(false); setWidth(0) }, 220)
    timers.current.push(t)
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      // Let the browser handle anything that isn't a plain left-click on an
      // in-app link: modified clicks open tabs, and those never change the URL
      // here, so a bar started for them would hang.
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as HTMLElement | null)?.closest?.('a')
      if (!(a instanceof HTMLAnchorElement)) return
      if (a.target && a.target !== '_self') return
      if (a.hasAttribute('download')) return

      const href = a.getAttribute('href') || ''
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return

      const url = new URL(a.href, window.location.href)
      if (url.origin !== window.location.origin) return
      // Same page — no navigation will happen, so no bar.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return

      start()
    }

    function start() {
      clearTimers()
      setActive(true)
      setWidth(8)
      // Creep toward 90% but never reach it. The bar cannot know how long the
      // server will take, and a bar that completes before the page arrives is
      // worse than no bar — it says "done" while the reader is still waiting.
      const steps: [number, number][] = [[120, 35], [320, 58], [700, 74], [1200, 84], [2000, 90]]
      for (const [delay, w] of steps) timers.current.push(setTimeout(() => setWidth(w), delay))
    }

    document.addEventListener('click', onClick, true)
    // Back/forward also change the page and deserve the same feedback.
    window.addEventListener('popstate', start)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', start)
      clearTimers()
    }
  }, [])

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 9999,
        pointerEvents: 'none', opacity: active ? 1 : 0,
        transition: active ? 'opacity .1s' : 'opacity .3s ease .1s',
      }}
    >
      <div style={{
        height: '100%', width: `${width}%`, background: CLAY,
        boxShadow: `0 0 8px ${CLAY}`,
        transition: 'width .3s cubic-bezier(.4,0,.2,1)',
      }} />
    </div>
  )
}
