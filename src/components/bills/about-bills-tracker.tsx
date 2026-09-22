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
