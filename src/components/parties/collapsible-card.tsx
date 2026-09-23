'use client'

/**
 * CollapsibleCard — a section of the party page as a closed rectangle that
 * opens when you tap it.
 *
 * The page was five stacked cards, each holding a paragraph or a list, all
 * open at once: about two and a half phone screens of prose before "Where they
 * stand", which is the part a reader came for. Closed, the same five are a
 * short menu of what this party's page holds, and the reader opens the one
 * they want.
 *
 * Same frame as the Card it replaces (white, 2px tinted border, radius 18), so
 * the two can sit in one column while sections are converted.
 *
 * The icon arrives as an element, not a component: this is a client component
 * and a lucide function cannot cross the server boundary as a prop, but the
 * rendered <Landmark /> element can.
 *
 * data-open is on the root so a stylesheet can treat the two states
 * differently. Nothing uses it yet: the one rule that did, .ap-stand, is gone.
 *
 * The button is the whole header row and carries no padding of its own — the
 * card supplies it — because the global `button { min-height: 44px }` mobile
 * rule inflates any small control that owns its own box (DESIGN-SPEC 3.1).
 *
 * `info` is an (i) for the header row (§1.2, §2.1). It sits AFTER the button
 * rather than beside the title, where §8 asks for it, because the button is the
 * whole row and a button inside a button is invalid HTML. align="right" on the
 * bubble is what makes the end of the row the right place for it.
 *
 * DESKTOP (§2.14, §5.19). Every one of these numbers was composed at 375px and
 * then rendered unchanged at 1920, where a 16px title on a 1008px-wide card
 * reads as a caption. The card cannot multiply — it is one column at every
 * width — so the whole of "grow, don't multiply" here is stepping the CONTENTS
 * up: padding 9/14 to 13/20, icon 26 to 32, title 16 to 19, chevron 18 to 22.
 * It is a scale, not a re-layout: same order, same proportions.
 */

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { INK, MANROPE } from '@/constants/theme'

/** Party colour at low alpha. Same helper the page uses for its own frames. */
function tint(hex: string, a: number) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

export function CollapsibleCard({ title, icon, accent, children, info, defaultOpen = false, id, className, style }: {
  title: string
  /** A rendered icon element, e.g. <Landmark style={{ width: 15, height: 15 }} />. */
  icon: React.ReactNode
  accent: string
  children: React.ReactNode
  /** An (i) for this section's explanation (§1.2). Sits at the end of the
   *  header row; give its bubble align="right". */
  info?: React.ReactNode
  /** Open on load. Overview uses it: a page that is nothing but five closed
   *  rectangles gives a reader no reason to open any of them, so the first
   *  one shows what the rest are like. */
  defaultOpen?: boolean
  id?: string
  className?: string
  style?: React.CSSProperties
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div id={id} className={`cc-card${className ? ` ${className}` : ''}`} data-open={open ? '1' : '0'} style={{
      background: '#ffffff', border: `2px solid ${tint(accent, 0.45)}`, borderRadius: 18,
      padding: '9px 14px', boxShadow: '0 1px 2px rgba(42,18,6,.04), 0 8px 20px -12px rgba(42,18,6,.14)',
      ...style,
    }}>
      <style dangerouslySetInnerHTML={{ __html: CARD_CSS }} />
      {/* The (i) is a sibling of the toggle, not a child of it: nesting a
          button inside a button is invalid HTML and the inner one stops
          receiving its own clicks in some browsers. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0,
            padding: 0, margin: 0, background: 'none', border: 'none',
            cursor: 'pointer', textAlign: 'left', fontFamily: MANROPE,
          }}
        >
          <span className="cc-icon" style={{
            width: 26, height: 26, borderRadius: 8, background: tint(accent, 0.12),
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, color: accent,
          }}>
            {icon}
          </span>
          <h2 className="cc-title" style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>
            {title}
          </h2>
          <ChevronDown className="cc-chev" style={{
            width: 18, height: 18, color: accent, flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s',
          }} />
        </button>
        {info}
      </div>

      {open && <div className="cc-body" style={{ marginTop: 14 }}>{children}</div>}
    </div>
  )
}

/* Shipped with the component, not in globals.css (§3.2) — an inline style
   cannot be made responsive from a stylesheet, and this card is styled inline.
   !important throughout because every value it overrides is an inline style on
   the same element.

   768px is the breakpoint §2.14 set for the directory these cards sit one tap
   from, so a reader crossing it meets one change of scale, not two. */
const CARD_CSS = `
@media (min-width: 768px) {
  .cc-card { padding: 13px 20px !important; border-radius: 22px !important; }
  .cc-icon { width: 32px !important; height: 32px !important; border-radius: 10px !important; }
  /* The icon arrives as a rendered element with its size set inline by the
     caller, so it is scaled here rather than by a prop: the card cannot know
     the viewport at render time. */
  .cc-icon svg { width: 18px !important; height: 18px !important; }
  .cc-title { font-size: 19px !important; }
  .cc-chev { width: 22px !important; height: 22px !important; }
  .cc-body { margin-top: 18px !important; }
}
`
