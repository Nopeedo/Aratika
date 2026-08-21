'use client'

/**
 * useLastSeen — "when was this reader last on this page", read once and shared.
 *
 * Two components on the MP profile need it: the coverage feed marks articles
 * published since, and the change banner lists stats that moved since. Both
 * originally read localStorage and wrote `now` in their own effect, which is a
 * race — whichever mounted first stamped the key, and the other then compared
 * against a timestamp set milliseconds ago and found nothing new. That is not a
 * flaky bug; it fails every time, silently, and looks like "there is nothing
 * new" rather than like a fault.
 *
 * So the read-and-stamp happens exactly once per key per page load, cached at
 * module scope. Every caller gets the same prior value no matter what order they
 * mount in, and the write happens once.
 *
 * Returns null when there is no prior visit — a first-time reader should be
 * shown nothing as "new", not everything.
 */

import { useEffect, useState } from 'react'

/** key -> the timestamp of the PREVIOUS visit (null if this is the first). */
const cache = new Map<string, number | null>()

function readAndStamp(key: string): number | null {
  if (cache.has(key)) return cache.get(key)!
  let prev: number | null = null
  try {
    const raw = window.localStorage.getItem(key)
    const n = raw ? Number(raw) : null
    prev = n && Number.isFinite(n) ? n : null
    window.localStorage.setItem(key, String(Date.now()))
  } catch {
    // Private mode or storage disabled. Nothing is marked new, which is the
    // safe failure — the alternative is claiming everything is.
    prev = null
  }
  cache.set(key, prev)
  return prev
}

export function useLastSeen(key: string): number | null {
  const [since, setSince] = useState<number | null>(null)
  useEffect(() => {
    setSince(readAndStamp(key))
  }, [key])
  return since
}
