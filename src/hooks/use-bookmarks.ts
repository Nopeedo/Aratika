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
// The one thing a signed-out reader tried to track, with when. Consumed on
// their first signed-in load — by whichever surface gets there first: a Track
// button on the page they came back to, or PendingTrackSync in the site
// layout, which is what makes the dashboard fallback real.
const PENDING_KEY = 'politika_pending_track_v1'
// An intent older than this is stale: someone else may be signing in on this
// browser, or the reader has long since moved on. Applying it to whichever
// account appears next would put a stranger's tap into their notifications.
const PENDING_TTL_MS = 24 * 60 * 60 * 1000
const keyOf = (kind: string, ref: string) => `${kind}:${ref}`

function readLocal(): Bookmark[] {
  if (typeof window === 'undefined') return []
  try { const raw = window.localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : [] } catch { return [] }
}
function setPending(e: BookmarkEntity) {
  try { window.localStorage.setItem(PENDING_KEY, JSON.stringify({ entity: e, at: Date.now() })) } catch { /* private mode: the prompt still works, the item just isn't pre-tracked */ }
}
/** The reader said "not now": the intent goes with it. */
export function clearPendingTrack() {
  try { window.localStorage.removeItem(PENDING_KEY) } catch { /* ignore */ }
}
function peekPending(): BookmarkEntity | null {
  try {
    const raw = window.localStorage.getItem(PENDING_KEY)
    if (!raw) return null
    const v = JSON.parse(raw)
    const e = v?.entity
    if (!e || typeof e.kind !== 'string' || typeof e.refId !== 'string' || typeof e.label !== 'string') { clearPendingTrack(); return null }
    if (typeof v.at !== 'number' || Date.now() - v.at > PENDING_TTL_MS) { clearPendingTrack(); return null }
    return e as BookmarkEntity
  } catch { return null }
}

const post = (b: BookmarkEntity) =>
  fetch('/api/bookmarks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })

/**
 * The once-per-sign-in sync: push the legacy anonymous list, then the pending
 * intent, up to the account. Module-scoped so that every hook instance on a
 * page (one per Track button) awaits the SAME promise before fetching its
 * list. Without that, only the instance that claimed the pending item waited
 * for the POST; every other button's GET could be served before the upsert
 * committed, and the just-tracked item showed as untracked next to one that
 * showed it tracked. Keyed by user id so a sign-out and sign-in as someone
 * else runs it again, and cleared on failure so a lost request is retried on
 * the next load rather than remembered as done.
 *
 * Resolves to true when something was posted, so a caller that rendered its
 * list on the server (the dashboard) knows to refresh.
 */
let syncFor: { userId: string; done: Promise<boolean> } | null = null
export function syncPendingTracks(userId: string): Promise<boolean> {
  if (syncFor && syncFor.userId === userId) return syncFor.done
  const done = (async () => {
    let posted = false
    const local = readLocal()
    if (local.length) {
      const results = await Promise.all(local.map((b) => post({ kind: b.kind, refId: b.ref_id, label: b.label, sublabel: b.sublabel, href: b.href, accent: b.accent }).then((r) => r.ok).catch(() => false)))
      if (results.every(Boolean)) { try { window.localStorage.removeItem(LS_KEY) } catch { /* ignore */ } }
      posted = results.some(Boolean)
    }
    const pending = peekPending()
    if (pending) {
      // Removed only once the account has it. A removal before the POST made a
      // failed request into a silently forgotten intent.
      const ok = await post(pending).then((r) => r.ok).catch(() => false)
      if (ok) { clearPendingTrack(); posted = true }
    }
    return posted
  })()
  syncFor = { userId, done }
  done.catch(() => { syncFor = null })
  return done
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

  // Load, after the once-per-sign-in sync has landed.
  useEffect(() => {
    if (authLoading) return
    let live = true

    async function init() {
      if (!user) {
        // Signed out: nothing is tracked. (The legacy local list is not shown
        // either; it is synced up on sign-in, not displayed.)
        if (live) { applyList([]); setLoading(false) }
        return
      }
      setLoading(true)
      await syncPendingTracks(user.id).catch(() => false)
      try {
        const r = await fetch('/api/bookmarks')
        const d = await r.json()
        if (live) applyList(d.bookmarks ?? [])
      } catch { /* offline / table missing: degrade quietly */ }
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
