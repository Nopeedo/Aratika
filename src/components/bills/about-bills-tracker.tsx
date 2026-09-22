'use client'

/**
 * AboutBillsTracker — the (i) beside the Bills Tracker title, carrying what
 * the page's standfirst used to say in six lines of body copy above the fold.
 */

import { InfoButton, InfoHeading, InfoText } from '@/components/ui/info-button'
import { MANROPE } from '@/constants/theme'

const ACCENT = '#1F8A4C'

export function AboutBillsTracker() {
  return (
    <InfoButton accent={ACCENT} label="About the bills tracker" size={28}>
      <InfoHeading accent={ACCENT}>What this shows</InfoHeading>
      <InfoText>
        Bills before the House of Representatives: what they propose, their type,
        and how far they have progressed.
      </InfoText>
      <InfoText>
        Where we have written a plain-language breakdown of a bill, it is linked
        from that bill’s row.
      </InfoText>

      {/* The "how to read this" primer folded in here by request: one button
          beside the title rather than two on consecutive lines, both of them
          explaining the same page. */}
      <InfoHeading accent={ACCENT}>What a bill is</InfoHeading>
      <InfoText>
        A bill is a proposed law. Government bills are led by a Minister;
        Member’s bills are put forward by backbench MPs via a ballot.
      </InfoText>

      <InfoHeading accent={ACCENT}>The stages</InfoHeading>
      <InfoText>
        Introduction, then select committee (where the public can make
        submissions), then three readings, then Royal Assent, when it becomes law.
      </InfoText>

      <InfoHeading accent={ACCENT}>The labels</InfoHeading>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '0 0 14px' }}>
        {[
          { label: 'Passed into law', fg: '#065f46', bg: '#d1fae5' },
          { label: 'Select committee (submissions)', fg: '#1e40af', bg: '#eef4ff' },
          { label: 'In progress', fg: '#92400e', bg: '#fff7e6' },
        ].map((l) => (
          <span key={l.label} style={{ fontSize: 11, fontWeight: 700, color: l.fg, background: l.bg, borderRadius: 999, padding: '3px 10px', fontFamily: MANROPE }}>{l.label}</span>
        ))}
      </div>
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
