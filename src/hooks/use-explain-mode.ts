'use client'

/**
 * useExplainMode — the site-wide "Explain the terms" switch. When on, essential
 * political terms across the site get a dotted underline and a plain-language
 * definition on tap (see <Term>). Off by one tap for people who don't need it.
 *
 * Backed by localStorage + a broadcast event (same pattern as use-bookmarks), so
 * every <Term> and the toggle stay in sync without a React context — which means
 * <Term> works anywhere, including inside server components.
 *
 * Default: ON for newcomers (the priority), OFF only if the onboarding comfort
 * level is 'expert'. An explicit tap always wins thereafter.
 */

import { useCallback, useEffect, useState } from 'react'

const LS_KEY = 'aratika_explain_v1'   // 'on' | 'off' — set once the user explicitly toggles
const PREFS_KEY = 'aratika_prefs_v2'  // onboarding prefs — read only for the smart default
const EVENT = 'aratika:explain'

function computeEnabled(): boolean {
  try {
    const explicit = localStorage.getItem(LS_KEY)
    if (explicit === 'on') return true
    if (explicit === 'off') return false
  } catch { /* ignore */ }
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw && JSON.parse(raw)?.level === 'expert') return false
  } catch { /* ignore */ }
  return true // newcomers are the priority
}

export function useExplainMode() {
  // Start false + not-ready so SSR and first paint agree; correct after mount.
  const [enabled, setEnabled] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const sync = () => setEnabled(computeEnabled())
    sync()
    setReady(true)
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev
      try { localStorage.setItem(LS_KEY, next ? 'on' : 'off') } catch { /* ignore */ }
      window.dispatchEvent(new Event(EVENT))
      return next
    })
  }, [])

  return { enabled, ready, toggle }
}
