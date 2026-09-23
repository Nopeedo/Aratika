'use client'

/**
 * SeatsInfoButton — the (i) beside "Seats in Parliament", matching the one on
 * the bills box and the policy pages: same ring, same bubble, same "tap
 * anywhere else to close".
 *
 * It answers what the block above it assumes a reader already knows: what a
 * seat is, why 120-odd of them, why the share of the vote and the number of
 * seats do not match exactly, and why this party's number is what it is. The
 * questions came out of the copy itself — "3.1% of voters chose Te Pāti Māori"
 * next to six seats invites the arithmetic and then fails it.
 */

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Info, X } from 'lucide-react'
import { usePartyCycle } from '@/components/homepage/party-cycle'
import { BASELINE_ELECTION } from '@/constants/elections-data'
import { BORDER, INK, MANROPE, SECONDARY } from '@/constants/theme'

export function SeatsInfoButton({ accent, party, slug }: {
  /** The party's colour, for the ring and the bubble's headings. */
  accent: string
  /** The party's short name, so the last section can be about them. */
  party: string
  /** Locks the tile cycle while the bubble is open. */
  slug: string
}) {
  const { panelSlug, select } = usePartyCycle()
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const bubble = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const total = BASELINE_ELECTION.totalSeats ?? 122
  const majority = Math.floor(total / 2) + 1

  const h = (text: string) => (
    <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: accent, fontFamily: MANROPE, margin: '0 0 4px' }}>{text}</div>
  )
  const p = (text: string) => (
    <p style={{ fontSize: 14, color: INK, fontFamily: MANROPE, lineHeight: 1.55, margin: '0 0 14px', textAlign: 'left' }}>{text}</p>
  )

  return (
    <div ref={wrap} style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => {
          // Opening it stops the tiles on this party — otherwise the cycle
          // rolls on and the explanation is about someone else.
          if (!open) select(panelSlug ?? slug)
          setOpen((v) => !v)
        }}
        aria-expanded={open}
        aria-controls={id}
        aria-label="What seats in Parliament means"
        style={{
          width: 24, height: 24, minWidth: 24, minHeight: 24, borderRadius: '50%', padding: 0, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: open ? accent : 'transparent',
          border: open ? `1.5px solid ${accent}` : '1.5px solid transparent',
          color: open ? '#fff' : SECONDARY,
          transition: 'background .15s ease, border-color .15s ease, color .15s ease',
        }}
      >
        <Info style={{ width: 18, height: 18 }} strokeWidth={2} />
      </button>

      {open && (
        <div
          ref={bubble}
          id={id}
          role="dialog"
          aria-label="What seats in Parliament means"
          style={{
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

          {h('What a seat is')}
          {p(`A seat is one MP. Parliament had ${total} of them after the 2023 election, and every law is decided by them voting, so a party with more seats gets more of what it wants. A group of parties needs ${majority} between them to govern.`)}

          {h('Where the seats come from')}
          {p('You get two votes. The party vote decides how many seats each party gets overall; the electorate vote decides who wins your local area. A party that wins 30% of the party vote ends up with about 30% of the seats, whether its MPs won local races or came off its list.')}

          {h('Why the numbers don’t match exactly')}
          {p('A party has to clear 5% of the party vote, or win an electorate, to get in at all. Votes for parties that do neither are set aside, which lifts everyone else’s share slightly. And a party that wins more electorates than its party vote entitles it to keeps them, which is why Parliament had 122 seats in 2023 rather than 120.')}

          {h(`${party}’s number`)}
          {p(`The figure above is what ${party} won at the 2023 election. It is not their support today, and it does not change between elections, except by a by-election. That is why National’s count went from 48 to 49 in November 2023.`)}
        </div>
      )}
    </div>
  )
}
