'use client'

/**
 * BookmarkButton — "Track" control for an MP, party, electorate or policy.
 * Free + login-required: signed-out users are routed to /login (with a return
 * path). Saved items show up in the user's command centre (/dashboard).
 */

import { useRouter, usePathname } from 'next/navigation'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useBookmarks, type BookmarkEntity } from '@/hooks/use-bookmarks'

const JADE = '#1F8A4C', INK = '#0c0e12', BORDER = '#e9e7e2'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function BookmarkButton({
  entity,
  variant = 'pill',
}: {
  entity: BookmarkEntity
  variant?: 'pill' | 'icon'
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isBookmarked, toggle, authLoading } = useBookmarks()
  const saved = isBookmarked(entity.kind, entity.refId)

  async function onClick() {
    const res = await toggle(entity)
    if (res.needsAuth) router.push(`/login?next=${encodeURIComponent(pathname || '/')}`)
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={onClick}
        disabled={authLoading}
        aria-pressed={saved}
        aria-label={saved ? `Stop tracking ${entity.label}` : `Track ${entity.label}`}
        title={saved ? 'Tracking — in your command centre' : 'Track this'}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 10, cursor: authLoading ? 'default' : 'pointer',
          background: saved ? '#ecfdf5' : '#fff', border: `1px solid ${saved ? '#a7f3d0' : BORDER}`,
          color: saved ? JADE : INK, transition: 'all .15s ease',
        }}
      >
        {saved ? <BookmarkCheck style={{ width: 18, height: 18 }} /> : <Bookmark style={{ width: 18, height: 18 }} />}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={authLoading}
      aria-pressed={saved}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7, cursor: authLoading ? 'default' : 'pointer',
        padding: '9px 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 800, fontFamily: MANROPE,
        background: saved ? '#ecfdf5' : '#fff', border: `1px solid ${saved ? '#a7f3d0' : BORDER}`,
        color: saved ? JADE : INK, transition: 'all .15s ease', whiteSpace: 'nowrap',
      }}
    >
      {saved ? <BookmarkCheck style={{ width: 16, height: 16 }} /> : <Bookmark style={{ width: 16, height: 16 }} />}
      {saved ? 'Tracking' : 'Track'}
    </button>
  )
}
