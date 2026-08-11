/**
 * HowToReadBills — the plain-language primer for the bills pages.
 *
 * Lives at the top of /bills rather than inside the tracker: it explains what a
 * bill and its stages ARE, which is what a first-time reader needs before the
 * carousel and the 270-row tracker, not after them.
 */

import { BORDER, INK, MANROPE, SURFACE } from '@/constants/theme'

export function HowToReadBills() {
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 8 }}>How to read this</div>
      <p style={{ fontSize: 13, color: '#3f444c', fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 10px' }}>
        A <b>bill</b> is a proposed law. <b style={{ color: '#3730a3' }}>Government bills</b> are led by a Minister; <b style={{ color: '#166638' }}>Member’s bills</b> are put forward by backbench MPs via a ballot. Each bill moves through stages — introduction → <b>select committee</b> (where the public can make submissions) → three readings → <b>Royal Assent</b>, when it becomes law.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {[
          { label: 'Passed into law', fg: '#065f46', bg: '#d1fae5' },
          { label: 'Select committee (submissions)', fg: '#1e40af', bg: '#eef4ff' },
          { label: 'In progress', fg: '#92400e', bg: '#fff7e6' },
        ].map((l) => (
          <span key={l.label} style={{ fontSize: 11, fontWeight: 700, color: l.fg, background: l.bg, borderRadius: 999, padding: '3px 10px', fontFamily: MANROPE }}>{l.label}</span>
        ))}
      </div>
    </div>
  )
}
