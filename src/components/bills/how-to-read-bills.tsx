'use client'

/**
 * HowToReadBills — the plain-language primer for the bills pages, behind an (i).
 *
 * It used to be a card at the top of /bills: eight lines explaining what a bill
 * is and what its stages mean, standing between the reader and the bills
 * themselves. It is orientation, and orientation is exactly what belongs
 * behind an info button — there for a first-time reader, out of the way of
 * everyone who has been here before. Same button and bubble as the ones on
 * /policies/[topic] and the homepage bills box (ui/info-button).
 */

import { InfoButton, InfoHeading, InfoText } from '@/components/ui/info-button'
import { MANROPE } from '@/constants/theme'

/** The site's own jade, not a party colour: this page belongs to no party. */
const ACCENT = '#1F8A4C'

export function HowToReadBills({ label = 'How to read this' }: { label?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <InfoButton accent={ACCENT} label="How to read the bills tracker">
        <InfoHeading accent={ACCENT}>What a bill is</InfoHeading>
        <InfoText>
          A bill is a proposed law. Government bills are led by a Minister; Member’s
          bills are put forward by backbench MPs via a ballot.
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
      <span style={{ fontSize: 13, fontWeight: 700, color: ACCENT, fontFamily: MANROPE }}>{label}</span>
    </span>
  )
}
