'use client'

/**
 * SeatsWithTabs — the §2.2 mode pills (If polls held / Who could govern),
 * drawn ABOVE the seats section rather than inside it.
 *
 * SeatChamber draws these tabs itself by default, directly above its own
 * heading. By request the tabs moved up to sit right after the party list —
 * where "Show fewer" used to be, before this whole block was revealed — so
 * they had to come out of SeatChamber and be rendered by something that can
 * hold the shared `mode` state above it. upcoming-view.tsx is a server
 * component and can't hold that state itself, hence this thin client
 * wrapper: it owns `mode`, renders SeatModeTabs, then the seats section with
 * SeatChamber controlled (`mode`, `onModeChange`, `hideTabs`) so the two
 * can't drift out of sync or render two tab rows.
 */

import { useState } from 'react'
import { SeatChamber, type Mode, type SeatEntry } from './seat-chamber'
import type { PartyResult } from '@/constants/elections-data'

export function SeatsWithTabs(props: {
  elected: PartyResult[]
  electedTotal: number
  electedYear: number
  electedSlug: string
  projection: SeatEntry[]
  projectionTotal: number
  asAt: string
  pickScrollsToIdPrefix?: string
}) {
  // The pills (If polls held / Who could govern) were removed by request, so
  // the chamber is fixed on the poll projection: there is no control left to
  // change `mode`, and "Who could govern" is no longer reachable from this
  // page. SeatModeTabs is still exported from seat-chamber.tsx if it's wanted
  // back — render it here above the section, as it was.
  const [mode, setMode] = useState<Mode>('polls')
  return (
    <section id="seats" style={{ scrollMarginTop: 80 }}>
      <SeatChamber {...props} mode={mode} onModeChange={setMode} hideTabs />
    </section>
  )
}
