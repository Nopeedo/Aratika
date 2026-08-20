'use client'

/**
 * BookmarkButton — "Track" control for an MP, party, electorate or policy.
 * Free + login-required: signed-out users are routed to /login (with a return
 * path). Saved items show up in the user's command centre (/dashboard).
 *
 * IT MUST NOT CLAIM A STATE IT DOES NOT KNOW YET. useBookmarks starts with an
 * empty set and `loading: true` while it checks auth and fetches the list, and
 * this button used to render the not-saved branch throughout — so opening a page
 * for something you already track showed "Track" for a second and then flipped
 * to "Tracking". A reader who acts on the first render is being told the
 * opposite of the truth, and the correction looks like their tap did something.
 * While the answer is unknown it renders a placeholder of the same size instead:
 * no label, nothing to act on, no layout shift when the answer arrives.
 */

import { useRouter, usePathname } from 'next/navigation'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useBookmarks, type BookmarkEntity } from '@/hooks/use-bookmarks'
import { BORDER, INK, JADE, MANROPE } from '@/constants/theme'

export function BookmarkButton({
  entity,
  variant = 'pill',
}: {
  entity: BookmarkEntity
  variant?: 'pill' | 'icon'
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isBookmarked, toggle, authLoading, loading } = useBookmarks()
  const saved = isBookmarked(entity.kind, entity.refId)
  // Unknown until BOTH the auth check and the list have settled. `loading`
  // alone is not enough: it is only set false after auth resolves.
  const known = !authLoading && !loading

  async function onClick() {
    const res = await toggle(entity)
    if (res.needsAuth) router.push(`/login?next=${encodeURIComponent(pathname || '/')}`)
  }

  if (variant === 'icon') {
    if (!known) {
      return (
        <span aria-hidden style={{
          display: 'inline-flex', width: 36, height: 36, borderRadius: 10,
          background: '#fff', border: `1px solid ${BORDER}`, opacity: 0.5,
        }} />
      )
    }
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

  if (!known) {
    // Same box as the real control so nothing moves when it resolves.
    return (
      <span aria-hidden style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '9px 16px', borderRadius: 10, fontSize: 16, fontWeight: 800, fontFamily: MANROPE,
        background: '#fff', border: `1px solid ${BORDER}`, color: 'transparent', opacity: 0.5,
        whiteSpace: 'nowrap',
      }}>
        <Bookmark style={{ width: 16, height: 16, color: BORDER }} />
        Track
      </span>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={authLoading}
      aria-pressed={saved}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7, cursor: authLoading ? 'default' : 'pointer',
        padding: '9px 16px', borderRadius: 10, fontSize: 16, fontWeight: 800, fontFamily: MANROPE,
        background: saved ? '#ecfdf5' : '#fff', border: `1px solid ${saved ? '#a7f3d0' : BORDER}`,
        color: saved ? JADE : INK, transition: 'all .15s ease', whiteSpace: 'nowrap',
      }}
    >
      {saved ? <BookmarkCheck style={{ width: 16, height: 16 }} /> : <Bookmark style={{ width: 16, height: 16 }} />}
      {saved ? 'Tracking' : 'Track'}
    </button>
  )
}
