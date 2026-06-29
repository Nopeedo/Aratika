'use client'

/**
 * useBookmarks — the user's command-centre store, client side.
 * Fetches the signed-in user's bookmarks once, then toggles optimistically.
 * Login-aware: toggle() returns { needsAuth: true } when signed out so callers
 * can route to /login instead of silently failing.
 */

import { useCallback, useEffect, useState } from 'react'
import { useUser } from '@/hooks/use-user'

export interface BookmarkEntity {
  kind: 'mp' | 'party' | 'electorate' | 'policy'
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

const keyOf = (kind: string, ref: string) => `${kind}:${ref}`

export function useBookmarks() {
  const { user, loading: authLoading } = useUser()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [keys, setKeys] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { setBookmarks([]); setKeys(new Set()); setLoading(false); return }
    let live = true
    setLoading(true)
    fetch('/api/bookmarks')
      .then((r) => r.json())
      .then((d) => {
        if (!live) return
        const list: Bookmark[] = d.bookmarks ?? []
        setBookmarks(list)
        setKeys(new Set(list.map((b) => keyOf(b.kind, b.ref_id))))
      })
      .catch(() => {})
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [user, authLoading])

  const isBookmarked = useCallback((kind: string, ref: string) => keys.has(keyOf(kind, ref)), [keys])

  const toggle = useCallback(async (e: BookmarkEntity): Promise<{ needsAuth?: boolean; saved?: boolean }> => {
    if (!user) return { needsAuth: true }
    const k = keyOf(e.kind, e.refId)
    const wasSaved = keys.has(k)

    // optimistic
    setKeys((prev) => { const n = new Set(prev); wasSaved ? n.delete(k) : n.add(k); return n })
    if (wasSaved) {
      setBookmarks((prev) => prev.filter((b) => keyOf(b.kind, b.ref_id) !== k))
    } else {
      setBookmarks((prev) => [{ id: `tmp-${k}`, kind: e.kind, ref_id: e.refId, label: e.label, sublabel: e.sublabel, href: e.href, accent: e.accent }, ...prev])
    }

    try {
      if (wasSaved) {
        await fetch(`/api/bookmarks?kind=${encodeURIComponent(e.kind)}&ref=${encodeURIComponent(e.refId)}`, { method: 'DELETE' })
        return { saved: false }
      } else {
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(e),
        })
        const d = await res.json().catch(() => ({}))
        if (!res.ok || !d.bookmark) {
          // save failed (e.g. table not migrated yet) — undo the optimistic add
          setKeys((prev) => { const n = new Set(prev); n.delete(k); return n })
          setBookmarks((prev) => prev.filter((b) => b.id !== `tmp-${k}`))
          return {}
        }
        setBookmarks((prev) => prev.map((b) => (b.id === `tmp-${k}` ? d.bookmark : b)))
        return { saved: true }
      }
    } catch {
      // rollback on failure
      setKeys((prev) => { const n = new Set(prev); wasSaved ? n.add(k) : n.delete(k); return n })
      return {}
    }
  }, [user, keys])

  return { bookmarks, isBookmarked, toggle, loading, user, authLoading }
}
