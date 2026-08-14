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
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { NAV_PREV_KEY } from './nav-history'

/** Routes worth naming when you came from them. Longest prefix wins.
 *
 *  Labels are deliberately section nouns rather than index-page names: the href
 *  is the EXACT page you were on, so "Back to All parties" pointing at
 *  /parties/national would misdescribe where it goes. "Back to parties" reads
 *  correctly whether you came from the index or a single party. */
const KNOWN: { prefix: string; label: string }[] = [
  { prefix: '/elections/2026', label: 'Election Centre' },
  { prefix: '/battlegrounds',  label: 'Battlegrounds' },
  { prefix: '/compare',        label: 'Compare parties' },
  { prefix: '/policies',       label: 'the issues' },
  { prefix: '/parties',        label: 'parties' },
  { prefix: '/elections',      label: 'elections' },
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
  const pathname = usePathname()
  const rawPrev = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Never go back DOWN into a page you just came up from. Arriving at
  // /policies/health from /policies/health/green, this used to render a link
  // labelled "Back to the issues" that pointed at the party page — so back and
  // forth bounced between the same two pages and never reached /policies.
  //
  // The label describes a section while the href is the exact previous page, so
  // the two only agree when that page sits outside the current branch. A
  // descendant, or the current page itself, falls through to fallbackHref.
  const isBelow = !!rawPrev && !!pathname && (rawPrev === pathname || rawPrev.startsWith(pathname === '/' ? '/' : pathname + '/'))

  const d = rawPrev && !isBelow ? describe(rawPrev) : null
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
        // router.back() would land on the same descendant the named link was
        // just stopped from pointing at, so when the previous page is below
        // this one, go up to the fallback instead.
        if (!isBelow && typeof window !== 'undefined' && window.history.length > 1) router.back()
        else router.push(fallbackHref)
      }}
      style={base}
    >
      <ArrowLeft style={{ width: 14, height: 14 }} /> {label}
    </button>
  )
}
