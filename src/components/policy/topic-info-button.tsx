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
  const bubble = useRef<HTMLDivElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const id = useId()

  /**
   * Centred on the VIEWPORT, but anchored to the PAGE.
   *
   * Fixed positioning centred it and then left it hanging there while the
   * page scrolled underneath, so the bubble drifted away from the (i) that
   * opened it. Absolute keeps it attached; the offset below is what centres
   * it, measured from the wrapper out to the middle of the screen.
   */
  const [left, setLeft] = useState<number | null>(null)
  useLayoutEffect(() => {
    if (!open || !wrap.current) return
    const place = () => {
      const w = wrap.current
      if (!w) return
      const width = Math.min(340, window.innerWidth - 28)
      setLeft(window.innerWidth / 2 - width / 2 - w.getBoundingClientRect().left)
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open])

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
          // No ring at rest: the glyph is already a circle, and a border around
          // it drew a second one in grey. The ring (and the fill) come back
          // only while it is open, to show which control the bubble belongs to.
          border: `1.5px solid ${open ? accent : 'transparent'}`,
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
            position: 'absolute', top: 'calc(100% + 10px)', left: left ?? 0, zIndex: 30,
            width: 'min(340px, calc(100vw - 28px))',
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
