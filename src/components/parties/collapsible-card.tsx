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

export function CollapsibleCard({ title, icon, accent, children, defaultOpen = false, id, className, style }: {
  title: string
  /** A rendered icon element, e.g. <Landmark style={{ width: 15, height: 15 }} />. */
  icon: React.ReactNode
  accent: string
  children: React.ReactNode
  /** Open on load. Used for nothing yet; the page opens closed by request. */
  defaultOpen?: boolean
  id?: string
  className?: string
  style?: React.CSSProperties
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div id={id} className={className} data-open={open ? '1' : '0'} style={{
      background: '#ffffff', border: `2px solid ${tint(accent, 0.45)}`, borderRadius: 18,
      padding: '14px 18px', boxShadow: '0 1px 2px rgba(42,18,6,.04), 0 8px 20px -12px rgba(42,18,6,.14)',
      ...style,
    }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: 0, margin: 0, background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', fontFamily: MANROPE,
        }}
      >
        <span style={{
          width: 28, height: 28, borderRadius: 9, background: tint(accent, 0.12),
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, color: accent,
        }}>
          {icon}
        </span>
        <h2 style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>
          {title}
        </h2>
        <ChevronDown style={{
          width: 18, height: 18, color: accent, flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s',
        }} />
      </button>

      {open && <div style={{ marginTop: 14 }}>{children}</div>}
    </div>
  )
}
