'use client'

/**
 * AboutBillsTracker — the (i) beside the Bills Tracker title, carrying what
 * the page's standfirst used to say in six lines of body copy above the fold.
 */

import { InfoButton, InfoHeading, InfoText } from '@/components/ui/info-button'

const ACCENT = '#1F8A4C'

export function AboutBillsTracker() {
  return (
    <InfoButton accent={ACCENT} label="What the bills tracker shows" size={28}>
      <InfoHeading accent={ACCENT}>What this shows</InfoHeading>
      <InfoText>
        Bills before the House of Representatives: what they propose, their type,
        and how far they have progressed.
      </InfoText>
      <InfoText>
        Where we have written a plain-language breakdown of a bill, it is linked
        from that bill’s row.
      </InfoText>
    </InfoButton>
  )
}

/** The (i) beside "All bills this term", carrying what the list covers and
 *  how to narrow it — a line that sat above filters that already say so. */
export function AboutAllBills() {
  return (
    <InfoButton accent={ACCENT} label="What this list covers" size={24}>
      <InfoHeading accent={ACCENT}>What this covers</InfoHeading>
      <InfoText>
        Every bill put to Parliament since the 2023 election, including the ones
        already made law.
      </InfoText>
      <InfoText>Filter the list by topic, type, stage or party.</InfoText>
    </InfoButton>
  )
}
