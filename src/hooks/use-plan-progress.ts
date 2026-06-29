'use client'

/**
 * usePlanProgress — tracks which recommended steps a person has completed.
 * Steps are keyed by their destination href. Stored in localStorage (works
 * without an account; will sync to the account in the AI phase).
 *
 * All instances in the tab stay in sync via a custom event, so the auto-tick
 * tracker, the /plan page, and the homepage card never disagree.
 */

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'aratika_plan_done_v1'
const EVENT = 'aratika-plan-progress'

function read(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function write(next: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent(EVENT, { detail: next }))
  } catch { /* ignore */ }
}

export function usePlanProgress() {
  const [done, setDone] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setDone(read())
    setLoaded(true)
    const sync = () => setDone(read())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener('storage', sync) }
  }, [])

  const markDone = useCallback((href: string) => {
    setDone((prev) => {
      if (prev.includes(href)) return prev
      const next = [...prev, href]
      write(next)
      return next
    })
  }, [])

  const toggle = useCallback((href: string) => {
    setDone((prev) => {
      const next = prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
      write(next)
      return next
    })
  }, [])

  const reset = useCallback(() => { setDone([]); write([]) }, [])

  const isDone = useCallback((href: string) => done.includes(href), [done])

  return { done, loaded, markDone, toggle, reset, isDone }
}
