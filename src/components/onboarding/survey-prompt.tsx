'use client'

/**
 * SurveyPrompt — the compass, asked for once and then never again.
 *
 * The survey used to be a full section on the homepage (CompassCta). It was
 * asking twelve questions of a reader who had not yet decided to give the site
 * two minutes, and it took a screen of the front page to do it. This asks in a
 * card the reader can wave away, and the section is gone.
 *
 * NO MEANS NO, PERMANENTLY. "No thanks" and the close button do the same thing
 * and it does not expire. The account ask (stay-prompt.tsx) snoozes for 30 days
 * because signing up is a standing offer; a survey is a one-off, and coming
 * back to ask again is how a prompt becomes an irritation. Taking the survey
 * sets the same flag, so nobody is asked to do a thing they have just done.
 * After that the footer link is the way in, which is what it is there for.
 *
 * IT WAITS FOR THE READER TO SCROLL. Not a timer: a card that appears while
 * someone is still reading the first screen is an interruption, and a card that
 * appears on load is an ambush. Scrolling past the hero is the reader showing
 * they are actually here.
 *
 * IT NEVER BLOCKS. A corner card, not a modal, with no scrim and nothing to
 * dismiss before the page can be used. It also sits BELOW the account sheet
 * (z 60 against its 80), so on the rare visit where both are due, the one that
 * takes over the screen is on top rather than fighting it.
 *
 * Keyframes and media queries cannot live in an inline style object (§3.2), so
 * both ship as a style tag with the component.
 */

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, ArrowRight } from 'lucide-react'
import { BORDER, INK, JADE, MANROPE, SECONDARY, SURFACE } from '@/constants/theme'

/** Set on dismiss AND on taking the survey. No expiry, by design. */
const KEY = 'politika.survey.dismissed'
/** Roughly the hero. Below this the reader has not seen anything yet. */
const SCROLL_TRIGGER = 700

function alreadyAnswered(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    // Private mode, or site data blocked. Treat as dismissed rather than
    // "ask again": the opposite choice means a reader whose browser cannot
    // remember the refusal gets asked on every single visit, which is the
    // behaviour this component exists to avoid.
    return true
  }
}

export function SurveyPrompt() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  const [gone, setGone] = React.useState(false)

  React.useEffect(() => {
    // The homepage only. It is mounted there, but a layout change should not
    // quietly turn this into a site-wide pop-up.
    if (pathname !== '/' || alreadyAnswered()) return

    const onScroll = () => {
      if (window.scrollY < SCROLL_TRIGGER) return
      setOpen(true)
      window.removeEventListener('scroll', onScroll)
    }
    // Checked once up front as well: a reader who reloads mid-page, or follows
    // a link to an anchor, is already past the trigger and never fires a scroll.
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  function close() {
    try { localStorage.setItem(KEY, '1') } catch { /* private mode */ }
    setGone(true)
    // Let the card animate out before it leaves the tree.
    window.setTimeout(() => setOpen(false), 220)
  }

  if (!open) return null

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className={`sp-wrap${gone ? ' out' : ''}`} role="dialog" aria-label="Take the survey">
        <button onClick={close} aria-label="No thanks" className="sp-x">
          <X style={{ width: 16, height: 16 }} />
        </button>

        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', color: JADE, margin: '0 0 6px' }}>
          2 MINUTES
        </p>
        <h2 style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.02em', color: INK, margin: '0 0 6px', lineHeight: 1.25 }}>
          Take the survey
        </h2>
        <p style={{ fontSize: 13.5, color: SECONDARY, lineHeight: 1.5, margin: '0 0 16px' }}>
          Twelve quick questions. Then we point you at the parts of the site that answer what you care about.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Taking it counts as answering the ask, so it is not raised again. */}
          <Link href="/start" onClick={close} className="sp-go">
            Start <ArrowRight style={{ width: 15, height: 15 }} />
          </Link>
          <button onClick={close} className="sp-no">No thanks</button>
        </div>
      </div>
    </>
  )
}

const CSS = `
.sp-wrap {
  position: fixed; right: 18px; bottom: 18px; z-index: 60;
  width: min(360px, calc(100vw - 36px));
  background: ${SURFACE}; border: 1px solid ${BORDER}; border-radius: 16px;
  padding: 18px 18px 17px; font-family: ${MANROPE};
  box-shadow: 0 2px 6px rgba(42,18,6,.06), 0 18px 40px -18px rgba(42,18,6,.3);
  animation: sp-in 260ms cubic-bezier(.2,.8,.2,1) both;
}
.sp-wrap.out { animation: sp-out 200ms ease-in both }
@keyframes sp-in  { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
@keyframes sp-out { from { opacity: 1; transform: none } to { opacity: 0; transform: translateY(10px) } }

.sp-x {
  position: absolute; top: 10px; right: 10px; width: 30px; height: 30px;
  display: inline-flex; align-items: center; justify-content: center;
  border: none; background: none; border-radius: 8px; cursor: pointer;
  color: ${SECONDARY};
}
.sp-x:hover { background: rgba(42,18,6,.06); color: ${INK} }

.sp-go {
  display: inline-flex; align-items: center; gap: 7px; min-height: 42px;
  padding: 11px 20px; border-radius: 11px; background: ${JADE}; color: #fff;
  font-size: 14.5px; font-weight: 800; text-decoration: none;
}
.sp-go:hover { background: #176B3B }

.sp-no {
  min-height: 42px; padding: 11px 14px; border: none; background: none;
  font-family: ${MANROPE}; font-size: 13.5px; font-weight: 700;
  color: ${SECONDARY}; cursor: pointer; border-radius: 11px;
}
.sp-no:hover { background: rgba(42,18,6,.06); color: ${INK} }

/* On a phone it spans the width and lifts clear of the companion button in the
   bottom-left corner, which it would otherwise cover. */
@media (max-width: 640px) {
  .sp-wrap { left: 12px; right: 12px; bottom: 84px; width: auto }
}
@media (prefers-reduced-motion: reduce) {
  .sp-wrap, .sp-wrap.out { animation-duration: 1ms !important }
}
`
