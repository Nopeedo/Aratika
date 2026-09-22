'use client'

/**
 * TrackPrompt — what a signed-out reader sees when they tap Track.
 *
 * Tracking needs an account, and the old behaviour was a silent bounce to
 * /login: no explanation, and the wrong page for someone who has never signed
 * up. This says why an account is worth it FOR THE THING THEY JUST TAPPED (an
 * MP's votes, a bill's next stage, a topic's positions) and sends them to
 * create one, with the return path preserved so they land back here. The hook
 * has already remembered what they tried to track, so it is waiting for them.
 *
 * A dialog, not window.alert(): alert() blocks the page, cannot carry a link,
 * and reads as an error.
 *
 * Declining (Not now, the X, Escape, the backdrop) also forgets the intent:
 * a tap the reader walked away from must not be applied to whichever account
 * signs in on this browser next. Following either link keeps it.
 */

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Bookmark, X } from 'lucide-react'
import { clearPendingTrack, type BookmarkEntity } from '@/hooks/use-bookmarks'
import { BORDER, INK, JADE, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

/** The plural the headline uses: "track policy topics", not "track policy". */
const NOUN: Record<BookmarkEntity['kind'], string> = {
  mp: 'MPs',
  party: 'parties',
  policy: 'policy topics',
  bill: 'bills',
  electorate: 'electorates',
  battleground: 'electorate races',
}

/** What tracking THIS thing gets them, in one sentence, no sales voice. */
function why(e: BookmarkEntity): string {
  switch (e.kind) {
    case 'mp': return `Tracking ${e.label} puts their bills, votes and written questions in your command centre, and tells you when something new lands.`
    case 'party': return `Tracking ${e.label} brings their new policy positions, bills and coverage to you as they happen.`
    case 'policy': return `Tracking ${e.label} keeps every party's position on it in one place, and tells you when one of them changes.`
    case 'bill': return `Tracking ${e.label} tells you when it moves a stage or opens for public submissions.`
    default: return `Tracking ${e.label} brings new candidates and results for the seat to you.`
  }
}

const FOCUSABLE = 'a[href], button:not([disabled])'

export function TrackPrompt({ entity, returnTo, onClose }: { entity: BookmarkEntity; returnTo: string; onClose: () => void }) {
  const card = useRef<HTMLDivElement>(null)
  const primary = useRef<HTMLAnchorElement>(null)
  // Where a click STARTED. A drag that begins on the card text and ends over
  // the backdrop dispatches click to the backdrop; that is not a dismissal.
  const pressedBackdrop = useRef(false)
  const next = encodeURIComponent(returnTo || '/')

  const decline = () => { clearPendingTrack(); onClose() }

  useEffect(() => {
    // Return focus to whatever opened the dialog (the Track button) on close;
    // otherwise the focused element is unmounted and focus falls to <body>.
    const opener = document.activeElement as HTMLElement | null
    primary.current?.focus()
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') { ev.preventDefault(); decline(); return }
      // Keep Tab inside the dialog. aria-modal promises the page behind is
      // inert; without this, Tab from "Not now" walked onto the obscured page.
      if (ev.key === 'Tab' && card.current) {
        const items = Array.from(card.current.querySelectorAll<HTMLElement>(FOCUSABLE))
        if (!items.length) return
        const first = items[0], last = items[items.length - 1]
        if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus() }
        else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); opener?.focus?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      onMouseDown={(ev) => { pressedBackdrop.current = ev.target === ev.currentTarget }}
      onClick={(ev) => { if (ev.target === ev.currentTarget && pressedBackdrop.current) decline() }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(12,14,18,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}
    >
      <div
        ref={card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="track-prompt-title"
        style={{ width: 'min(440px, 100%)', background: '#fff', borderRadius: 18, border: `1px solid ${BORDER}`, boxShadow: '0 24px 60px rgba(0,0,0,.25)', padding: '22px 22px 18px', fontFamily: MANROPE }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 12, background: '#ecfdf5', color: JADE, flexShrink: 0 }}>
            <Bookmark style={{ width: 20, height: 20 }} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 id="track-prompt-title" style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.01em', color: INK, margin: '6px 0 6px', lineHeight: 1.25 }}>
              Create a free account to track {NOUN[entity.kind]}
            </h2>
            <p style={{ fontSize: 14.5, color: SECONDARY, margin: 0, lineHeight: 1.55 }}>{why(entity)}</p>
          </div>
          <button onClick={decline} aria-label="Not now" style={{ background: 'none', border: 'none', cursor: 'pointer', color: TERTIARY, padding: 4, margin: -4, flexShrink: 0 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginTop: 18 }}>
          <Link
            ref={primary}
            href={`/register?next=${next}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11, background: JADE, color: '#fff', fontSize: 15, fontWeight: 800, textDecoration: 'none' }}
          >
            Create a free account
          </Link>
          <Link
            href={`/login?next=${next}`}
            style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 14px', borderRadius: 11, border: `1px solid ${BORDER}`, background: '#fff', color: INK, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}
          >
            I have an account
          </Link>
          <button onClick={decline} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SECONDARY, fontSize: 14.5, fontWeight: 700, fontFamily: MANROPE, padding: '10px 4px', marginLeft: 'auto' }}>
            Not now
          </button>
        </div>
        <p style={{ fontSize: 12.5, color: TERTIARY, margin: '14px 0 0', lineHeight: 1.5 }}>
          It takes a minute. You&apos;ll come straight back here, with {entity.label} already tracked.
        </p>
      </div>
    </div>
  )
}
