'use client'

/**
 * BackLink — returns the user to wherever they came from, so a bill opened from
 * /bills goes back to /bills, not to /legislation.
 *
 * Two levels of behaviour:
 *  1. If the previous in-app route is one we can name, render a real link that
 *     says where it goes — "Back to Election Centre". Naming it matters: pages
 *     used to carry hard-coded parent links ("All elections", "All parties"), so
 *     arriving from the Election Centre and clicking back walked you UP that
 *     page's own branch instead of returning you to where you actually were.
 *  2. Otherwise fall back to the original behaviour — browser back when there's
 *     in-app history, else `fallbackHref`.
 *
 * The named upgrade is applied after mount, never during render: reading
 * sessionStorage while rendering would make the server and client markup differ.
 */

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { NAV_PREV_KEY } from './nav-history'

/** Routes worth naming when you came from them. Longest prefix wins. */
const KNOWN: { prefix: string; label: string }[] = [
  { prefix: '/elections/2026', label: 'Election Centre' },
  { prefix: '/battlegrounds',  label: 'Battlegrounds' },
  { prefix: '/compare',        label: 'Compare parties' },
  { prefix: '/policies',       label: 'the issues' },
  { prefix: '/parties',        label: 'All parties' },
  { prefix: '/elections',      label: 'All elections' },
  { prefix: '/dashboard',      label: 'your dashboard' },
  { prefix: '/bills',          label: 'The Record' },
  { prefix: '/news',           label: 'Latest' },
  { prefix: '/hub',            label: 'your hub' },
  { prefix: '/mps',            label: 'MPs' },
  { prefix: '/map',            label: 'the map' },
]

function describe(path: string): { href: string; label: string } | null {
  const hit = [...KNOWN]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((k) => path === k.prefix || path.startsWith(k.prefix + '/'))
  return hit ? { href: path, label: hit.label } : null
}

// sessionStorage is external state, so read it through useSyncExternalStore: the
// server snapshot is null and the client snapshot is the stored path, which lets
// React render the plain fallback during hydration and swap in the named link
// afterwards — without a mismatch, and without setState inside an effect.
const subscribe = () => () => {}
const getSnapshot = () => { try { return sessionStorage.getItem(NAV_PREV_KEY) } catch { return null } }
const getServerSnapshot = () => null

export function BackLink({ fallbackHref, label = 'Back', style }: {
  fallbackHref: string
  label?: string
  style?: React.CSSProperties
}) {
  const router = useRouter()
  const rawPrev = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Only name routes we recognise — "Back to /some/deep/path" reads worse than
  // the page's own sensible default.
  const d = rawPrev ? describe(rawPrev) : null
  const prev = d && d.href !== fallbackHref ? d : null

  const base: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'none', ...style }

  if (prev) {
    return (
      <Link href={prev.href} style={base}>
        <ArrowLeft style={{ width: 14, height: 14 }} /> Back to {prev.label}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined' && window.history.length > 1) router.back()
        else router.push(fallbackHref)
      }}
      style={base}
    >
      <ArrowLeft style={{ width: 14, height: 14 }} /> {label}
    </button>
  )
}
