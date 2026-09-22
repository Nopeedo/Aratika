'use client'

/**
 * OpenLinksInNewTab — every link in the homepage's CONTENT opens a new tab,
 * external and internal alike. The front page is the one-stop scroll-through;
 * following a link out of it shouldn't lose the reader's place in it.
 *
 * Done once here rather than adding target="_blank" to every <a> and <Link>
 * across the dozen components the page is built from — that would be easy to
 * miss on the next component added, and easy to drift.
 *
 * How it works, and why it's a CAPTURE listener: Next's <Link> handles clicks
 * with its own React onClick that calls router.push — but it first checks
 * isModifiedEvent(), which returns true when the anchor has a `target` other
 * than _self, and then lets the browser handle the click natively instead.
 * React's delegated handlers run in the bubble phase at the root; a native
 * capture-phase listener runs before them. So setting target="_blank" on the
 * anchor here, in capture, is enough for both plain <a>s AND <Link>s to open
 * a new tab through ordinary browser behaviour — no window.open, so no popup
 * blocker, and middle-click/ctrl-click keep working as they already did.
 *
 * Scope is the page content. The navbar and footer render from the root
 * layout on every page, and site navigation spawning new tabs would be odd —
 * so header/footer/nav are left alone. Same-document jumps (the hero's
 * #parties anchor), mailto:/tel:, and downloads are left alone too.
 *
 * Renders nothing. Mounted once in app/page.tsx.
 */

import { useEffect } from 'react'

export function OpenLinksInNewTab() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a) return
      // Site chrome, not page content.
      if (a.closest('header, footer, nav')) return
      if (a.hasAttribute('download')) return

      const href = a.getAttribute('href') || ''
      if (/^(mailto|tel|javascript):/i.test(href)) return

      // Same document — an in-page jump (#parties) or a bare "#" (Leaflet's
      // map zoom controls are <a href="#">). Not a page link; keep this tab.
      let url: URL
      try { url = new URL(href, location.href) } catch { return }
      if (url.origin === location.origin && url.pathname === location.pathname && url.search === location.search) return

      a.setAttribute('target', '_blank')
      a.setAttribute('rel', 'noopener noreferrer')
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return null
}
