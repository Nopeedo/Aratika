'use client'

/**
 * WidgetHeader — the one title band every Learn widget wears.
 *
 * Five widgets each hand-rolled this band: a 14px title with a 12px line under
 * it telling the reader to tap things that are visibly tappable ("Move the
 * party-vote sliders and watch the House fill.", "Tap each part to learn what
 * it does.", "Click a stage, or use the buttons."). §1.2 says a line a
 * returning reader would skip is an (i), and §1.4 says the same shape once, so
 * the five near-copies are this component and the five instruction lines are
 * bubbles that carry what the body never said instead: where a number came
 * from, and which House is being modelled.
 *
 * Local to Learn on purpose. Nothing outside /learn uses it, and the shared
 * piece it consumes is §2.1's InfoButton, imported rather than rebuilt: §7
 * already records three hand-rolled copies of the (i) in this tree and Learn
 * is not going to be the fourth.
 *
 * The band rounds its own top corners (19px inside a 1px border on a 20px
 * card) because the widget cards had to give up `overflow: hidden` for this:
 * an (i) bubble is absolutely positioned under its button, and a clipping
 * ancestor cut it off at the band.
 */

import type { ReactNode } from 'react'
import { InfoButton } from '@/components/ui/info-button'
import { BORDER, INK, MANROPE, SURFACE } from '@/constants/theme'

export function WidgetHeader({ title, accent, infoLabel, children, action }: {
  title: string
  /** The module's own colour (learn-theme). A widget takes the colour of the
   *  page it is on, not of the reader's difficulty level (§1.6). */
  accent: string
  /** Accessible name for the (i). Omitted along with `children` when a widget
   *  has nothing to explain. */
  infoLabel?: string
  /** The bubble's contents: InfoHeading / InfoText sections, two to four. */
  children?: ReactNode
  /** One control at the right of the band, e.g. Reset. */
  action?: ReactNode
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      padding: '9px 14px 9px 18px', borderBottom: `1px solid ${BORDER}`,
      background: SURFACE, borderRadius: '19px 19px 0 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{title}</span>
        {children && <InfoButton accent={accent} label={infoLabel ?? title} size={24}>{children}</InfoButton>}
      </div>
      {action}
    </div>
  )
}
