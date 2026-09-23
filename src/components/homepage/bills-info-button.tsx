'use client'

/**
 * BillsInfoButton — the (i) in the corner of the bills box, matching the one
 * beside the topic pill on /policies/[topic]: same ring, same bubble, same
 * "tap anywhere else to close" behaviour.
 *
 * It carries the explanation the box itself shouldn't: what a bill is, what
 * "before the House" means, why a governing party has hundreds and an
 * opposition party a handful, and why the government count is attributed to
 * the minister's party rather than owned by it. That last paragraph used to
 * sit under the figures as body copy — true, necessary, and four lines of
 * process explanation between the reader and the next thing.
 */

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Info, X } from 'lucide-react'
import { usePartyCycle } from '@/components/homepage/party-cycle'
import { BORDER, INK, MANROPE, SECONDARY } from '@/constants/theme'

export function BillsInfoButton({ accent, governing, slug }: {
  /** The party's colour, for the ring and the bubble's headings. */
  accent: string
  /** Governing parties get the attribution note; opposition gets the ballot. */
  governing: boolean
  /** The party this box belongs to, so opening the bubble stops the cycle
   *  on them — otherwise the tiles roll on and the reader is two paragraphs
   *  into an explanation of a party the page has already left. */
  slug: string
}) {
  const { panelSlug, select } = usePartyCycle()
  const [open, setOpen] = useState(false)
  const bubble = useRef<HTMLDivElement>(null)
  // The button sits in the box's top-right corner, so a 340px bubble anchored
  // to it hangs off the right of a phone. Shift it back inside.
  const [shift, setShift] = useState(0)
  const id = useId()

  useLayoutEffect(() => {
    if (!open || !bubble.current) return
    const r = bubble.current.getBoundingClientRect()
    const gutter = 18
    const naturalRight = r.right - shift
    const over = naturalRight - (window.innerWidth - gutter)
    setShift(over > 0 ? -over : 0)
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

  const h = (text: string) => (
    <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: accent, fontFamily: MANROPE, margin: '0 0 4px' }}>{text}</div>
  )
  const p = (text: string) => (
    <p style={{ fontSize: 14, color: INK, fontFamily: MANROPE, lineHeight: 1.55, margin: '0 0 14px', textAlign: 'left' }}>{text}</p>
  )

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => {
          // Opening it locks the tiles onto this party (no-op if the reader
          // has already picked one). Closing leaves the pick alone: they
          // chose it by opening this, and undoing that would restart the
          // cycle under them.
          if (!open) select(panelSlug ?? slug)
          setOpen((v) => !v)
        }}
        aria-expanded={open}
        aria-controls={id}
        aria-label="What bills before the House means"
        style={{
          // No ring at rest: the glyph already reads as a circle, and a ring
          // around it made two concentric circles at 26px. The ring (and the
          // fill) come back only while it is open, to show it is the thing
          // the bubble belongs to.
          width: 26, height: 26, minWidth: 26, minHeight: 26, borderRadius: '50%', padding: 0, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: open ? accent : 'transparent',
          border: open ? `1.5px solid ${accent}` : '1.5px solid transparent',
          color: open ? '#fff' : SECONDARY,
          transition: 'background .15s ease, border-color .15s ease, color .15s ease',
        }}
      >
        {/* 15px in a 26px box, the same as every other (i) on the site. It was
            a 30px glyph in a 34px box here — nearly twice the area, which read
            as a different control rather than the same one. */}
        <Info style={{ width: 15, height: 15 }} strokeWidth={2.25} />
      </button>

      {open && (
        <div
          ref={bubble}
          id={id}
          role="dialog"
          aria-label="What bills before the House means"
          style={{
            position: 'absolute', top: 'calc(100% + 10px)', right: shift, zIndex: 30,
            width: 'min(340px, calc(100vw - 36px))',
            background: '#fff', border: `1px solid ${BORDER}`, borderTop: `3px solid ${accent}`,
            borderRadius: 14, padding: '16px 18px 4px', textAlign: 'left',
            boxShadow: '0 4px 8px rgba(42,18,6,.06), 0 16px 32px -12px rgba(42,18,6,.22)',
          }}
        >
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: SECONDARY, display: 'inline-flex' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>

          {h('Bills before the House')}
          {p('A bill is a proposed law. It is introduced in Parliament, debated and voted on several times, and only becomes law if it passes every stage. "Before the House" means it has been introduced and is still somewhere in that process.')}

          {h('Government bills')}
          {p('Only ministers can introduce these, and they are the government’s programme for the term. Most of them pass, because the parties in government hold the numbers to vote them through.')}

          {h('Members’ bills')}
          {p('Any MP who is not a minister can put one forward, whichever party they are in. Far more are written than can be debated, so they go into a ballot and are drawn at random. Most never get pulled out.')}

          {governing ? (
            <>
              {h('Whose bills are these?')}
              {p('Government bills are the coalition’s programme, counted here by the party of the minister in charge. They are not that party’s alone: they were agreed by the parties in government together, and passed with their combined votes.')}
            </>
          ) : (
            <>
              {h('Why the number is small')}
              {p('A party in opposition has no ministers, so it can introduce no government bills at all. Its MPs enter the members’ ballot like everyone else. A low count here is the position they are in, not a measure of how hard they work.')}
            </>
          )}

          {h('Now law')}
          {p('The count of these bills that have been through every stage and been signed into law. The rest are still somewhere in the process, or were voted down.')}
        </div>
      )}
    </div>
  )
}
