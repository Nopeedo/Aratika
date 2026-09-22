'use client'

/**
 * useBookmarks — the user's command-centre store, client side.
 *
 * Tracking needs an account. A signed-out reader who taps Track is not
 * tracked; toggle() returns { needsAuth: true } and remembers WHAT they tried
 * to track, so the button can ask them to create an account and, once they
 * are signed in, the item is waiting for them — tracked, in their command
 * centre — without a second tap.
 *
 * Until 22 Sep 2026 tracking also worked anonymously, in localStorage, with a
 * sync to the account on sign-in. That sync is kept, so anything a reader
 * tracked on this device before the change still lands in their account the
 * first time they sign in. Nothing new is written to that list.
 */

import { useCallback, useEffect, useState } from 'react'
import { useUser } from '@/hooks/use-user'

export interface BookmarkEntity {
  kind: 'mp' | 'party' | 'electorate' | 'policy' | 'bill' | 'battleground'
  refId: string
  label: string
  sublabel?: string
  href?: string
  accent?: string
}

export interface Bookmark extends Omit<BookmarkEntity, 'refId'> {
  id: string
  ref_id: string
  created_at?: string
}

// Legacy anonymous list (pre 22 Sep 2026). Read once on sign-in and synced up;
// never written to any more.
const LS_KEY = 'politika_tracks_v1'
// The one thing a signed-out reader tried to track. Consumed on their first
// signed-in load, wherever that happens: the page they came back to, or the
// dashboard if the confirmation link dropped the return path.
const PENDING_KEY = 'politika_pending_track_v1'
const keyOf = (kind: string, ref: string) => `${kind}:${ref}`

function readLocal(): Bookmark[] {
  if (typeof window === 'undefined') return []
  try { const raw = window.localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : [] } catch { return [] }
}
function setPending(e: BookmarkEntity) {
  try { window.localStorage.setItem(PENDING_KEY, JSON.stringify(e)) } catch { /* private mode — the prompt still works, the item just isn't pre-tracked */ }
}
/** Read AND clear in one step, so the first hook instance to sign in claims it
 *  and the others on the page find nothing — one POST, not one per button. */
function takePending(): BookmarkEntity | null {
  try {
    const raw = window.localStorage.getItem(PENDING_KEY)
    if (!raw) return null
    window.localStorage.removeItem(PENDING_KEY)
    const e = JSON.parse(raw)
    return e && typeof e.kind === 'string' && typeof e.refId === 'string' && typeof e.label === 'string' ? (e as BookmarkEntity) : null
  } catch { return null }
}

export function useBookmarks() {
  const { user, loading: authLoading } = useUser()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [keys, setKeys] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const applyList = useCallback((list: Bookmark[]) => {
    setBookmarks(list)
    setKeys(new Set(list.map((b) => keyOf(b.kind, b.ref_id))))
  }, [])

  // Load, and on sign-in sync any anonymous tracks up to the account.
  useEffect(() => {
    if (authLoading) return
    let live = true

    async function init() {
      if (!user) {
        // Signed out: nothing is tracked. (The legacy local list is not shown
        // either — it is synced up on sign-in, not displayed.)
        if (live) { applyList([]); setLoading(false) }
        return
      }
      setLoading(true)
      // Push any legacy anonymous tracks up first (upsert is idempotent), then
      // clear the list; and the one item this reader tried to track while
      // signed out, if any, so it is there without a second tap.
      const post = (b: BookmarkEntity) =>
        fetch('/api/bookmarks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).catch(() => {})
      const local = readLocal()
      if (local.length) {
        await Promise.all(local.map((b) => post({ kind: b.kind, refId: b.ref_id, label: b.label, sublabel: b.sublabel, href: b.href, accent: b.accent })))
        try { window.localStorage.removeItem(LS_KEY) } catch {}
      }
      const pending = takePending()
      if (pending) await post(pending)
      try {
        const r = await fetch('/api/bookmarks')
        const d = await r.json()
        if (live) applyList(d.bookmarks ?? [])
      } catch { /* offline / table missing — degrade quietly */ }
      if (live) setLoading(false)
    }

    init()
    return () => { live = false }
  }, [user, authLoading, applyList])

  const isBookmarked = useCallback((kind: string, ref: string) => keys.has(keyOf(kind, ref)), [keys])

  const toggle = useCallback(async (e: BookmarkEntity): Promise<{ needsAuth?: boolean; saved?: boolean }> => {
    // Signed out: remember the intent and hand the decision to the caller,
    // which asks the reader to create an account. Nothing is marked tracked.
    if (!user) { setPending(e); return { needsAuth: true } }
    const k = keyOf(e.kind, e.refId)
    const wasSaved = keys.has(k)
    const item: Bookmark = {
      id: `tmp-${k}`, kind: e.kind, ref_id: e.refId, label: e.label,
      sublabel: e.sublabel, href: e.href, accent: e.accent, created_at: new Date().toISOString(),
    }

    // optimistic
    setKeys((prev) => { const n = new Set(prev); wasSaved ? n.delete(k) : n.add(k); return n })
    setBookmarks((prev) => wasSaved ? prev.filter((b) => keyOf(b.kind, b.ref_id) !== k) : [item, ...prev])

    // Signed in — persist to the account.
    try {
      if (wasSaved) {
        await fetch(`/api/bookmarks?kind=${encodeURIComponent(e.kind)}&ref=${encodeURIComponent(e.refId)}`, { method: 'DELETE' })
        return { saved: false }
      }
      const res = await fetch('/api/bookmarks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || !d.bookmark) {
        setKeys((prev) => { const n = new Set(prev); n.delete(k); return n })
        setBookmarks((prev) => prev.filter((b) => b.id !== item.id))
        return {}
      }
      setBookmarks((prev) => prev.map((b) => (b.id === item.id ? d.bookmark : b)))
      return { saved: true }
    } catch {
      setKeys((prev) => { const n = new Set(prev); wasSaved ? n.add(k) : n.delete(k); return n })
      return {}
    }
  }, [user, keys])

  return { bookmarks, isBookmarked, toggle, loading, user, authLoading }
}
