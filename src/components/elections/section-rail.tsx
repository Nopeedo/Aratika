'use client'

/**
 * SectionRail — the hero's jump chips, kept within reach once they've scrolled
 * away.
 *
 * The Election Centre runs about twelve screens on a phone. The jump nav at the
 * top solves that only while it is on screen, which is the first screen; after
 * that the page is a long scroll with no way back to a section except more
 * scrolling. This picks up exactly where those chips leave off — it appears when
 * they leave the viewport and hides again when they return, so there is never a
 * moment with two navs or none.
 *
 * Collapsed it is a column of coloured dots on the right edge, the current
 * section filled and ringed. That state is doing two jobs: it says where you can
 * go, and it says where you ARE, which is the part a long page actually lacks.
 * Tapping expands it to labels; picking one collapses it again, because a nav
 * sitting open over the content you just navigated to is in the way.
 *
 * Sections come from ELECTION_SECTIONS, shared with the hero. Highlighting is by
 * scroll position rather than IntersectionObserver ratio: these sections differ
 * enormously in height (#your-seat is four times #seats), and "most visible"
 * hands long sections a permanent advantage — the one whose top you have most
 * recently passed is what a reader means by where they are.
 */

import * as React from 'react'
import { ELECTION_SECTIONS, HERO_JUMP_ID } from '@/constants/election-sections'
import { MANROPE } from '@/constants/theme'

const ESPRESSO = '#2A1206'
/** Distance below the viewport top that counts as "you are here" — matches the
 *  scrollMarginTop the sections use, so clicking a chip lands on the section it
 *  then reports as current instead of the one above. */
const ACTIVE_OFFSET = 96

export function SectionRail() {
  const [visible, setVisible] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [active, setActive] = React.useState<string | null>(null)
  const wrapRef = React.useRef<HTMLElement>(null)

  // Appear only once the hero's own chips are gone.
  React.useEffect(() => {
    const hero = document.getElementById(HERO_JUMP_ID)
    if (!hero) return
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(!e.isIntersecting)
        if (e.isIntersecting) setOpen(false)
      },
      { threshold: 0 },
    )
    io.observe(hero)
    return () => io.disconnect()
  }, [])

  // Current section = the last one whose top has passed the offset.
  React.useEffect(() => {
    let frame = 0
    const read = () => {
      frame = 0
      let current: string | null = null
      for (const s of ELECTION_SECTIONS) {
        const el = document.getElementById(s.id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= ACTIVE_OFFSET) current = s.id
      }
      setActive(current)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(read) }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  // Tapping anywhere else closes it, as does Escape — an expanded rail covers
  // content, so every ordinary way of dismissing a thing should work.
  React.useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const activeLabel = ELECTION_SECTIONS.find((s) => s.id === active)?.label

  return (
    <>
      <style>{`
        .rail {
          position: fixed; z-index: 1200;
          right: calc(2px + env(safe-area-inset-right, 0px));
          top: 50%; transform: translateY(-50%);
          display: flex; flex-direction: column; gap: 5px;
          padding: 5px; border-radius: 999px;
          background: rgba(255,255,255,.92); border: 1px solid #e6e2da;
          box-shadow: 0 2px 10px rgba(42,18,6,.13);
          backdrop-filter: blur(6px);
          opacity: 0; visibility: hidden; pointer-events: none;
          transition: opacity .22s ease, transform .22s ease, visibility .22s;
        }
        .rail[data-visible='true'] { opacity: 1; visibility: visible; pointer-events: auto; }
        /* Collapsed it is 30px wide against the 18px gutter the page already
           leaves, so it sits mostly beside the content rather than on it. At
           42px it covered the right-hand column's seat chips. */
        .rail[data-open='true'] { border-radius: 16px; padding: 8px; right: calc(6px + env(safe-area-inset-right, 0px)); }

        .rail-item {
          display: flex; align-items: center; gap: 9px;
          border: none; background: transparent; padding: 0; cursor: pointer;
          text-decoration: none; border-radius: 999px;
        }
        .rail-dot {
          width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0;
          box-shadow: 0 0 0 2px transparent;
          transition: box-shadow .2s ease, opacity .2s ease;
          opacity: .38;
        }
        .rail-item[data-active='true'] .rail-dot { opacity: 1; box-shadow: 0 0 0 2px #fff, 0 0 0 3.5px currentColor; }
        .rail-label {
          font-family: ${MANROPE}; font-size: 12.5px; font-weight: 800; color: ${ESPRESSO};
          white-space: nowrap; padding-right: 5px;
        }
        /* The dots stay a comfortable tap target without the rail getting fat:
           the hit area is padded, the painted dot is not. */
        .rail-item { min-height: 24px; }
        .rail[data-open='false'] .rail-item { justify-content: center; width: 20px; }

        .rail-toggle {
          margin-top: 3px; padding-top: 6px; border-top: 1px solid #ece8e0;
          display: flex; align-items: center; justify-content: center;
          background: transparent; border-left: none; border-right: none; border-bottom: none;
          cursor: pointer; color: #6b6157;
        }
        .rail-caret { width: 13px; height: 13px; transition: transform .22s ease; }
        .rail[data-open='true'] .rail-caret { transform: rotate(180deg); }

        @media (prefers-reduced-motion: reduce) {
          .rail, .rail-dot, .rail-caret { transition: none; }
        }
        /* No room for a floating rail beside a narrow page in landscape. */
        @media (max-height: 420px) { .rail { display: none; } }
      `}</style>

      <nav
        ref={wrapRef}
        className="rail"
        data-visible={visible}
        data-open={open}
        aria-label="Page sections"
        aria-hidden={!visible}
      >
        {ELECTION_SECTIONS.map((s) => {
          const isActive = s.id === active
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rail-item"
              data-active={isActive}
              style={{ color: s.ink }}
              aria-current={isActive ? 'true' : undefined}
              /* Collapsed, the label is not rendered, so the dot needs its own
                 name or the link is announced as "link" and nothing else. */
              aria-label={open ? undefined : s.label}
              title={open ? undefined : s.label}
              onClick={() => setOpen(false)}
              tabIndex={visible ? 0 : -1}
            >
              <span className="rail-dot" style={{ background: s.ink }} />
              {open && <span className="rail-label">{s.label}</span>}
            </a>
          )
        })}

        <button
          type="button"
          className="rail-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? 'Collapse section list' : `Expand section list${activeLabel ? `, currently ${activeLabel}` : ''}`}
          tabIndex={visible ? 0 : -1}
        >
          <svg className="rail-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </nav>
    </>
  )
}
