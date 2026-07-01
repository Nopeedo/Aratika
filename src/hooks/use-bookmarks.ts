'use client'

/**
 * useBookmarks — the user's command-centre store, client side.
 *
 * Works ANONYMOUSLY: tracked items live in localStorage so a first-timer can
 * start tracking in their first five minutes without an account. The moment
 * they sign in, any local tracks are pushed up to their account (idempotent
 * upsert) and cleared locally, so nothing is lost. Signed-in users are then
 * backed by Supabase as before.
 *
 * Cross-instance sync: every toggle broadcasts `aratika:tracks`, and the hook
 * also listens for the native `storage` event, so multiple BookmarkButtons and
 * counters on the same page (or across tabs) stay in step for anonymous users.
 */

import { useCallback, useEffect, useState } from 'react'
import { useUser } from '@/hooks/use-user'

export interface BookmarkEntity {
  kind: 'mp' | 'party' | 'electorate' | 'policy' | 'bill'
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

const LS_KEY = 'aratika_tracks_v1'
const SYNC_EVENT = 'aratika:tracks'
const keyOf = (kind: string, ref: string) => `${kind}:${ref}`

function readLocal(): Bookmark[] {
  if (typeof window === 'undefined') return []
  try { const raw = window.localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : [] } catch { return [] }
}
function writeLocal(list: Bookmark[]) {
  try { window.localStorage.setItem(LS_KEY, JSON.stringify(list)) } catch { /* quota / private mode — ignore */ }
  try { window.dispatchEvent(new CustomEvent(SYNC_EVENT)) } catch { /* older browsers */ }
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
        // Anonymous — source of truth is localStorage.
        if (live) { applyList(readLocal()); setLoading(false) }
        return
      }
      setLoading(true)
      // Push anonymous tracks up first (upsert is idempotent), then clear local.
      const local = readLocal()
      if (local.length) {
        await Promise.all(local.map((b) =>
          fetch('/api/bookmarks', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kind: b.kind, refId: b.ref_id, label: b.label, sublabel: b.sublabel, href: b.href, accent: b.accent }),
          }).catch(() => {}),
        ))
        try { window.localStorage.removeItem(LS_KEY) } catch {}
      }
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

  // Keep anonymous instances (this page + other tabs) in sync.
  useEffect(() => {
    if (authLoading || user) return
    const resync = () => applyList(readLocal())
    window.addEventListener(SYNC_EVENT, resync)
    window.addEventListener('storage', resync)
    return () => { window.removeEventListener(SYNC_EVENT, resync); window.removeEventListener('storage', resync) }
  }, [user, authLoading, applyList])

  const isBookmarked = useCallback((kind: string, ref: string) => keys.has(keyOf(kind, ref)), [keys])

  const toggle = useCallback(async (e: BookmarkEntity): Promise<{ needsAuth?: boolean; saved?: boolean }> => {
    const k = keyOf(e.kind, e.refId)
    const wasSaved = keys.has(k)
    const item: Bookmark = {
      id: `tmp-${k}`, kind: e.kind, ref_id: e.refId, label: e.label,
      sublabel: e.sublabel, href: e.href, accent: e.accent, created_at: new Date().toISOString(),
    }

    // optimistic (both modes)
    setKeys((prev) => { const n = new Set(prev); wasSaved ? n.delete(k) : n.add(k); return n })
    setBookmarks((prev) => wasSaved ? prev.filter((b) => keyOf(b.kind, b.ref_id) !== k) : [item, ...prev])

    // Anonymous — persist to localStorage, no network.
    if (!user) {
      const local = readLocal().filter((b) => keyOf(b.kind, b.ref_id) !== k)
      writeLocal(wasSaved ? local : [item, ...local])
      return { saved: !wasSaved }
    }

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
