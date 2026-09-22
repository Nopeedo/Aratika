'use client'

/**
 * TopicInfoButton — a small, quiet (i) beside the topic pill on the comparison
 * page. Tapping it opens a "What this covers" bubble holding the definitions a
 * reader needs to read the page fairly: what the topic includes and where
 * each party's position comes from.
 *
 * Deliberately a button + bubble, not a card on the page: the definitions are
 * the same on every topic, and a reader who has them once shouldn't have to
 * scroll past them again on the next nine. Soft by design — a hairline ring
 * and muted ink, so it never competes with the pill it sits beside.
 */

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Info, X } from 'lucide-react'
import { BORDER, INK, MANROPE, SECONDARY } from '@/constants/theme'

export function TopicInfoButton({ topicLabel, covers, accent }: {
  topicLabel: string
  /** The topic's longDescription — what falls under this heading. */
  covers: string
  /** The topic's border colour, for the bubble's rule and headings. */
  accent: string
}) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const bubble = useRef<HTMLDivElement>(null)
  // How far left to shift the bubble so it stays inside the viewport. It is
  // anchored to the button's left edge, and the button sits to the right of
  // a wide pill — on a phone that puts most of a 340px bubble off-screen.
  const [shift, setShift] = useState(0)
  const id = useId()

  useLayoutEffect(() => {
    if (!open || !bubble.current) return
    // r already includes the current shift; back it out to get the natural spot.
    const r = bubble.current.getBoundingClientRect()
    const gutter = 18
    const naturalLeft = r.left - shift
    const over = (r.right - shift) - (window.innerWidth - gutter)
    setShift(over > 0 ? -Math.min(over, naturalLeft - gutter) : 0)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close on a tap anywhere else, or Escape — a bubble that only closes from
  // its own X is a modal in disguise.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const h = (text: string) => (
    <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: accent, fontFamily: MANROPE, margin: '0 0 4px' }}>{text}</div>
  )
  const p = (text: string) => (
    <p style={{ fontSize: 14, color: INK, fontFamily: MANROPE, lineHeight: 1.55, margin: '0 0 14px' }}>{text}</p>
  )

  return (
    <div ref={wrap} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', alignSelf: 'center', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        aria-label={`What ${topicLabel} covers, and where the positions come from`}
        style={{
          // Fixed box + alignSelf: the header row stretches its children, and
          // a stretched circle is an oval. No fill when closed, just the ring.
          width: 26, height: 26, minWidth: 26, minHeight: 26, alignSelf: 'center', borderRadius: '50%', padding: 0, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: open ? accent : 'transparent',
          border: `1.5px solid ${open ? accent : BORDER}`,
          color: open ? '#fff' : SECONDARY,
          transition: 'background .15s ease, border-color .15s ease, color .15s ease',
        }}
      >
        <Info style={{ width: 15, height: 15 }} strokeWidth={2.25} />
      </button>

      {open && (
        <div
          ref={bubble}
          id={id}
          role="dialog"
          aria-label="What this covers"
          style={{
            position: 'absolute', top: 'calc(100% + 10px)', left: shift, zIndex: 30,
            width: 'min(340px, calc(100vw - 36px))',
            background: '#fff', border: `1px solid ${BORDER}`, borderTop: `3px solid ${accent}`,
            borderRadius: 14, padding: '16px 36px 4px 18px',
            boxShadow: '0 4px 8px rgba(42,18,6,.06), 0 16px 32px -12px rgba(42,18,6,.22)',
          }}
        >
          {/* No title row — removed by request so the content starts at the
              top. The close sits in the corner, out of the text's way; the
              first section heading leaves room for it. */}
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: SECONDARY, display: 'inline-flex' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>

          {h(topicLabel)}
          {p(covers)}

          {h('How this is sourced')}
          {p('Every position here is taken from the party\u2019s own current policy pages, summarised neutrally and checked by an editor before it goes up. Each one is dated and links to the page it came from.')}
          {p('We put the source in front of you on purpose. A summary is only ever a starting point. Follow the link and read what the party actually says, in their words, before you decide anything.')}
        </div>
      )}
    </div>
  )
}
