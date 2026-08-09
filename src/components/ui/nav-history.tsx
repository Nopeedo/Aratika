'use client'

/**
 * NavHistory — records the previous in-app route so a page can offer a "back to
 * where you actually came from" link.
 *
 * Why not document.referrer: Next's client-side (soft) navigations don't update
 * it, so every in-app hop still reports whatever page first loaded — useless for
 * this. sessionStorage tracks the real sequence, survives soft navigation, and
 * is per-tab so two tabs don't confuse each other.
 *
 * Renders nothing. Mounted once in the root layout.
 */

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export const NAV_PREV_KEY = 'arapono_prev_path'
const NAV_CUR_KEY = 'arapono_cur_path'

export function NavHistory() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    try {
      const cur = sessionStorage.getItem(NAV_CUR_KEY)
      // Ignore a repeat of the same path (re-render, query-only change) so the
      // "previous" slot never collapses to the page you're already on.
      if (cur && cur !== pathname) sessionStorage.setItem(NAV_PREV_KEY, cur)
      sessionStorage.setItem(NAV_CUR_KEY, pathname)
    } catch {
      // Private mode / storage disabled — back links just fall back to their default.
    }
  }, [pathname])

  return null
}
