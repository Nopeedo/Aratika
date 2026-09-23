'use client'

/**
 * InfoButton — the soft (i) and its bubble, in one place.
 *
 * The pattern arrived three times: beside the topic pill on /policies/[topic],
 * in the corner of the homepage bills box, and now on the bills tracker. Each
 * copy re-derived the same four things — a quiet circle that fills in when
 * open, a card anchored under it, closing on its × or Escape, and the
 * shift that keeps a 340px bubble inside a 375px phone. This is the shell;
 * callers supply only what the bubble says.
 *
 * `align` is which edge the bubble hangs from: "left" for a button at the
 * start of a row, "right" for one in a corner. Either way it is measured
 * after opening and pulled back inside the viewport if it overhangs.
 */

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Info, X } from 'lucide-react'
import { BORDER, INK, MANROPE, SECONDARY } from '@/constants/theme'

/** Vertical padding added to the button and taken straight back off as
 *  margin, so a 24px glyph is a 44px-tall target and the row still lays out
 *  around 24px (§3.1). */
const HIT = 10

export function InfoButton({
  accent,
  label,
  align = 'left',
  size = 26,
  onOpen,
  children,
}: {
  /** Ring, fill and heading colour. */
  accent: string
  /** Accessible name for the button and the bubble. */
  label: string
  align?: 'left' | 'right'
  size?: number
  /** Called when it opens — e.g. to stop a carousel cycling under the reader. */
  onOpen?: () => void
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const bubble = useRef<HTMLDivElement>(null)
  const [shift, setShift] = useState(0)
  const id = useId()

  // Measured, not guessed: the button can sit anywhere on the row, and the
  // bubble is wider than the space left beside it on a phone.
  useLayoutEffect(() => {
    if (!open || !bubble.current) return
    const r = bubble.current.getBoundingClientRect()
    const gutter = 18
    if (align === 'right') {
      const over = (r.right - shift) - (window.innerWidth - gutter)
      setShift(over > 0 ? -over : 0)
      return
    }
    const naturalLeft = r.left - shift
    const over = (r.right - shift) - (window.innerWidth - gutter)
    setShift(over > 0 ? -Math.min(over, naturalLeft - gutter) : 0)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Escape closes it; the X closes it; tapping the (i) again closes it.
   * Tapping ELSEWHERE does not, by request.
   *
   * It used to close on any pointerdown outside the bubble, which is the
   * usual popover behaviour and was wrong here: these bubbles are several
   * paragraphs long, so reading one means scrolling, and a scroll that starts
   * with a finger anywhere but exactly inside the card reads as an outside
   * tap and shuts it mid-sentence. A thing you have to read is not a menu.
   */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', alignSelf: 'center', flexShrink: 0 }}>
      {/* §3.1: the BUTTON is the hit area, the SPAN is the control. The pad is
          taken straight back off as margin, so the row is laid out as if the
          control were its visible size while a finger gets the full 44px.

          This carried `minHeight: size` inline, which beat the
          `button { min-height: 44px }` rule globals.css applies on phones, so
          every (i) on the site was a 24px target. It is the §3.1 trap in its
          other direction: the documented symptom is a control INFLATED to 44px
          by that rule, and the cure for that (a fixed inline size) silently
          opts the control out of the minimum altogether. */}
      <button
        type="button"
        onClick={() => { if (!open) onOpen?.(); setOpen((v) => !v) }}
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        style={{
          // VERTICAL only, as §3.1's worked example has it. Padding all four
          // sides made the 44px box overhang the row horizontally too, which is
          // how an invisible hit area makes a container scrollable (§5.13) and
          // what put the (i) over the pill beside it. Height was the binding
          // constraint anyway: the circle is already wider than it is tall
          // against the 44px minimum globals.css applies to every button.
          padding: `${HIT}px 0`, margin: `${-HIT}px 0`,
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 0, minWidth: 0,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span
          aria-hidden
          style={{
            // Fixed box + alignSelf on the wrapper: a flex row will stretch its
            // children, and a stretched circle is an oval.
            width: size, height: size, minWidth: size, minHeight: size,
            borderRadius: '50%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: open ? accent : 'transparent',
            // No ring at rest: the glyph is already a circle, and a border
            // around it drew a second one in grey. The ring (and the fill) come
            // back only while it is open, to show which control the bubble
            // belongs to.
            border: `1.5px solid ${open ? accent : 'transparent'}`,
            color: open ? '#fff' : SECONDARY,
            transition: 'background .15s ease, border-color .15s ease, color .15s ease',
          }}
        >
          <Info style={{ width: size * 0.58, height: size * 0.58 }} strokeWidth={2.25} />
        </span>
      </button>

      {open && (
        <div
          ref={bubble}
          id={id}
          role="dialog"
          aria-label={label}
          style={{
            position: 'absolute', top: 'calc(100% + 10px)', zIndex: 30,
            ...(align === 'right' ? { right: shift } : { left: shift }),
            width: 'min(340px, calc(100vw - 36px))',
            background: '#fff', border: `1px solid ${BORDER}`, borderTop: `3px solid ${accent}`,
            borderRadius: 14, padding: '16px 36px 4px 18px', textAlign: 'left',
            boxShadow: '0 4px 8px rgba(42,18,6,.06), 0 16px 32px -12px rgba(42,18,6,.22)',
          }}
        >
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: SECONDARY, display: 'inline-flex' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
          {children}
        </div>
      )}
    </div>
  )
}

/** A heading inside a bubble, in the accent colour. */
export function InfoHeading({ accent, children }: { accent: string; children: ReactNode }) {
  return (
    <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: accent, fontFamily: MANROPE, margin: '0 0 4px' }}>{children}</div>
  )
}

/** A paragraph inside a bubble. */
export function InfoText({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: 14, color: INK, fontFamily: MANROPE, lineHeight: 1.55, margin: '0 0 14px', textAlign: 'left' }}>{children}</p>
  )
}
