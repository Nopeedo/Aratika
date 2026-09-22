'use client'

/**
 * BookmarkButton — "Track" control for an MP, party, electorate or policy.
 * Free + account-required: a signed-out reader who taps it gets the on-page
 * account ask (AccountDialog) —
 * why an account is worth it for this thing, and a link to create one that
 * brings them back here with it tracked. (It used to bounce silently to /login,
 * which explained nothing and was the wrong page for someone with no account.)
 * Saved items show up in the user's command centre (/dashboard).
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

import { useState } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useBookmarks, type BookmarkEntity } from '@/hooks/use-bookmarks'
import { AccountDialog } from '@/components/bookmarks/track-with-account'
import { BORDER, INK, JADE, MANROPE } from '@/constants/theme'

export function BookmarkButton({
  entity,
  variant = 'pill',
  label,
  savedLabel,
  accent,
  compact = false,
}: {
  entity: BookmarkEntity
  variant?: 'pill' | 'icon'
  /**
   * Override the pill's wording. "Track" alone is fine beside a thing it
   * obviously refers to; under a topic heading it reads better as what it
   * actually does ("Track immigration changes"). The saved state gets its own
   * label so it can stay a statement rather than an instruction.
   */
  label?: string
  savedLabel?: string
  /** Tint for the resting state, so the control can wear the issue's colour. */
  accent?: string
  /** Smaller type and padding, for a control that sits under a heading rather
   *  than standing on its own. */
  compact?: boolean
}) {
  const { isBookmarked, toggle, authLoading, loading } = useBookmarks()
  const [prompting, setPrompting] = useState(false)
  const saved = isBookmarked(entity.kind, entity.refId)
  // Unknown until BOTH the auth check and the list have settled. `loading`
  // alone is not enough: it is only set false after auth resolves.
  const known = !authLoading && !loading

  async function onClick() {
    const res = await toggle(entity)
    if (res.needsAuth) setPrompting(true)
  }
  // No returnTo any more: the ask happens over the page, so there is no
  // trip away from it to come back from.
  // The account ask happens over the page, and the tap that raised it is
  // carried out the moment there is a session — same dialog the policy page's
  // Track control uses, so there is one of these, not two.
  const prompt = prompting
    ? <AccountDialog accent={entity.accent ?? JADE} what={entity.label} onClose={() => setPrompting(false)} onSignedIn={async () => { await toggle(entity) }} />
    : null

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
      <>
      {prompt}
      <button
        onClick={onClick}
        disabled={authLoading}
        aria-pressed={saved}
        aria-label={saved ? `Stop tracking ${entity.label}` : `Track ${entity.label}`}
        title={saved ? 'Tracking, in your command centre' : 'Track this'}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 10, cursor: authLoading ? 'default' : 'pointer',
          background: saved ? '#ecfdf5' : '#fff', border: `1px solid ${saved ? '#a7f3d0' : BORDER}`,
          color: saved ? JADE : INK, transition: 'all .15s ease',
        }}
      >
        {saved ? <BookmarkCheck style={{ width: 18, height: 18 }} /> : <Bookmark style={{ width: 18, height: 18 }} />}
      </button>
      </>
    )
  }

  const pad = compact ? '6px 11px' : '9px 16px'
  const size = compact ? 13.5 : 16
  const glyph = compact ? 14 : 16
  const restText = label ?? 'Track'
  const savedText = savedLabel ?? (label ? `Tracking ${entity.label.toLowerCase()}` : 'Tracking')

  if (!known) {
    // Same box as the real control so nothing moves when it resolves.
    return (
      <span aria-hidden style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: pad, borderRadius: 10, fontSize: size, fontWeight: 800, fontFamily: MANROPE,
        background: '#fff', border: `1px solid ${BORDER}`, color: 'transparent', opacity: 0.5,
        whiteSpace: 'nowrap',
      }}>
        <Bookmark style={{ width: glyph, height: glyph, color: BORDER }} />
        {restText}
      </span>
    )
  }

  return (
    <>
    {prompt}
    <button
      onClick={onClick}
      disabled={authLoading}
      aria-pressed={saved}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7, cursor: authLoading ? 'default' : 'pointer',
        padding: pad, borderRadius: 10, fontSize: size, fontWeight: 800, fontFamily: MANROPE,
        background: saved ? '#ecfdf5' : '#fff', border: `1px solid ${saved ? '#a7f3d0' : (accent ?? BORDER)}`,
        color: saved ? JADE : (accent ?? INK), transition: 'all .15s ease', whiteSpace: 'nowrap',
      }}
    >
      {saved ? <BookmarkCheck style={{ width: glyph, height: glyph }} /> : <Bookmark style={{ width: glyph, height: glyph }} />}
      {saved ? savedText : restText}
    </button>
    </>
  )
}
