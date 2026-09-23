'use client'

/**
 * BillsInfoButton — the (i) in the corner of the bills box, matching the one
 * beside the topic pill on /policies/[topic]: same ring, same bubble, same
 * "tap anywhere else to close" behaviour.
 *
 * Two sections, not five. It answers only what the block above it actually
 * raises: what the number counts, and why a governing party's is in the
 * hundreds where an opposition party's is a handful. The stages of a bill,
 * the ballot, and what "now law" means were each true and none of them were
 * being asked — the block no longer mentions the House or the stages, and
 * "30 now law" explains itself.
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
    <p style={{ fontSize: 14, color: INK, fontFamily: MANROPE, lineHeight: 1.55, margin: '0 0 14px', textAlign: 'left' }}>{text}</p>
  )

  return (
    <div ref={wrap} style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
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
            // Centred on the PAGE, not hung off the button: anchored to the
            // (i) it ran to the panel's right edge and left the copy sitting
            // off-centre under a centred heading.
            position: 'absolute', top: 'calc(100% + 10px)', left: left ?? 0, zIndex: 30,
            width: 'min(340px, calc(100vw - 28px))',
            background: '#fff', border: `1px solid ${BORDER}`, borderTop: `3px solid ${accent}`,
            borderRadius: 14, padding: '16px 18px 4px', textAlign: 'left',
            boxShadow: '0 4px 8px rgba(42,18,6,.06), 0 16px 32px -12px rgba(42,18,6,.22)',
          }}
        >
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: SECONDARY, display: 'inline-flex' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>

          {h('What this counts')}
          {p('A bill is a proposed law. This is how many were introduced by this party since the 2023 election, whether they have passed, been voted down, or are still somewhere in the process.')}

          {governing ? (
            <>
              {h('Why the number is large')}
              {p('A party in government supplies the ministers, and only ministers introduce government bills. Most of this figure is the coalition’s programme, counted here by the party of the minister in charge rather than owned by that party alone.')}
            </>
          ) : (
            <>
              {h('Why the number is small')}
              {p('A party in opposition has no ministers, so it can introduce no government bills at all. Its MPs put forward members’ bills instead, which go into a ballot and are drawn at random. A low count is the position they are in, not a measure of how hard they work.')}
            </>
          )}

        </div>
      )}
    </div>
  )
}
