'use client'

/**
 * Build-a-Government — pick parties from the real 2023 result and try to reach
 * a majority of the 54th Parliament.
 *
 * WHERE THE NUMBERS COME FROM. This file used to hold its own copy of the 2023
 * result (National 49, Labour 34, Green 15, ACT 11, NZ First 8, Te Pāti Māori
 * 6) and its own HOUSE = 123 and MAJORITY = 62 beside it. All three are now
 * read or derived: the seats come from CURRENT_SEATS in constants/parties.ts,
 * the House is their sum, and the majority is half of it plus one. §1.3 says
 * one fact in one place, and the version that mattered here is the one where
 * the numbers cannot drift apart: a House of 123 typed in by hand stays 123
 * after somebody corrects a seat count.
 *
 * The party toggles were a six-cell grid of checkbox cards. At 375px the grid
 * track needed 308px and this card's padding left it 299.5px, so it collapsed
 * to one column and six parties became six full-width rows, 352px of them.
 * They are §2.2 pills now, in the composition ballot-bills.tsx already uses for
 * filtering by party: two rows, about 54px.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { PARTY_COLORS, PARTY_NAMES, CURRENT_SEATS } from '@/constants/parties'
import type { PartySlug } from '@/types'
import { InfoHeading, InfoText } from '@/components/ui/info-button'
import { WidgetHeader } from './module-widget-header'
import { BORDER, INK, JADE, MANROPE, SECONDARY, tint } from '@/constants/theme'

/** The parties that won seats in 2023, largest first. Names, colours and seat
 *  counts all come from constants/parties.ts, so a party that is recoloured or
 *  recounted anywhere on Politika is recoloured and recounted here. */
const ELECTED: PartySlug[] = ['national', 'labour', 'green', 'act', 'nzfirst', 'tpm']

/** The parties that actually formed the government after the 2023 election.
 *  Kept as slugs rather than as the sentence "National + ACT + New Zealand
 *  First (68 seats)" that used to sit under the exercise: the 68 is then
 *  arithmetic on the sourced table above it rather than a figure of its own. */
const GOVERNMENT_2023: PartySlug[] = ['national', 'act', 'nzfirst']

const seatsOf = (slugs: PartySlug[]) => slugs.reduce((s, k) => s + CURRENT_SEATS[k], 0)

const HOUSE = seatsOf(ELECTED)
const MAJORITY = Math.floor(HOUSE / 2) + 1
const GOVT_SEATS = seatsOf(GOVERNMENT_2023)

export function BuildGovernment({ accent }: { accent: string }) {
  const [picked, setPicked] = useState<Set<PartySlug>>(new Set())

  const total = useMemo(
    () => ELECTED.filter((k) => picked.has(k)).reduce((s, k) => s + CURRENT_SEATS[k], 0),
    [picked],
  )
  const hasMajority = total >= MAJORITY
  const toggle = (key: PartySlug) =>
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const pct = (total / HOUSE) * 100
  const majorityPct = (MAJORITY / HOUSE) * 100

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 20, background: '#fff' }}>
      <WidgetHeader title="Build a government" accent={accent} infoLabel="How building a government works">
        <InfoHeading accent={accent}>What to do</InfoHeading>
        <InfoText>
          Pick parties until they add up to {MAJORITY} seats or more. That is the number
          needed to command the confidence of the House, which is what forming a government
          means.
        </InfoText>
        <InfoHeading accent={accent}>Why {HOUSE} seats, not 120</InfoHeading>
        <InfoText>
          Parliament normally has 120 seats, where {Math.floor(120 / 2) + 1} is a majority,
          and that is the House the seat allocator models. The 54th Parliament has {HOUSE},
          because Te Pāti Māori won more electorate seats than its share of the party vote
          entitled it to. Those extra seats are added to the House rather than taken off
          another party, which is called an overhang, so the majority here is {MAJORITY}.
        </InfoText>
        <InfoHeading accent={accent}>What actually happened</InfoHeading>
        <InfoText>
          {GOVERNMENT_2023.map((k) => PARTY_NAMES[k].short).join(', ')} formed the
          government, {GOVT_SEATS} seats between them. Seat counts are the official 2023
          general election result, Electoral Commission.
        </InfoText>
      </WidgetHeader>

      <div style={{ padding: 18 }}>
        {/* progress bar */}
        <div style={{ position: 'relative', height: 34, borderRadius: 10, background: '#f1efea', overflow: 'hidden', border: `1px solid ${BORDER}` }}>
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            style={{ height: '100%', background: hasMajority ? JADE : '#c9b03a', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
          />
          {/* majority line */}
          <div style={{ position: 'absolute', top: -3, bottom: -3, left: `${majorityPct}%`, width: 2, background: INK }} />
          <div style={{ position: 'absolute', top: 8, left: `calc(${majorityPct}% + 5px)`, fontSize: 10.5, fontWeight: 800, color: INK, fontFamily: MANROPE }}>
            {MAJORITY} = majority
          </div>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 10, display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 800, color: total > 6 ? '#fff' : INK, fontFamily: MANROPE }}>
            {total} seats
          </div>
        </div>

        {/* outcome */}
        <div style={{ minHeight: 26, marginTop: 10, marginBottom: 12 }}>
          {hasMajority ? (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE }}>
              Majority reached. This bloc can form a government.
            </motion.div>
          ) : (
            <div style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE }}>
              {total === 0 ? 'Pick a party to begin.' : `${MAJORITY - total} more seat${MAJORITY - total === 1 ? '' : 's'} needed for a majority.`}
            </div>
          )}
        </div>

        {/* §2.2 pills, multi-select: lit = the party's light fill with its
            colour at full strength on the border, unlit = white with the same
            hue at 34%. The tick that used to sit in a box on the left has gone
            with the card: a lit pill already says it is chosen (§1.3). */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ELECTED.map((slug) => (
            <PartyPill
              key={slug}
              label={PARTY_NAMES[slug].short}
              seats={CURRENT_SEATS[slug]}
              colour={PARTY_COLORS[slug].bg}
              light={PARTY_COLORS[slug].light}
              on={picked.has(slug)}
              onClick={() => toggle(slug)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/** §3.1: the button is the 44px hit area, the span is the pill. */
function PartyPill({ label, seats, colour, light, on, onClick }: {
  label: string
  seats: number
  colour: string
  light: string
  on: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      style={{ display: 'inline-flex', padding: '8px 0', margin: '-8px 0', background: 'none', border: 'none', cursor: 'pointer' }}
    >
      <span
        className="status-pill"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999,
          background: on ? light : '#fff',
          border: `2px solid ${on ? colour : tint(colour, 0.34)}`,
          color: INK, fontFamily: MANROPE, fontWeight: 800, whiteSpace: 'nowrap',
          transition: 'background-color .2s ease, border-color .2s ease',
        }}
      >
        {label}
        <span style={{ fontWeight: 700, opacity: .75 }}>{seats}</span>
      </span>
    </button>
  )
}
