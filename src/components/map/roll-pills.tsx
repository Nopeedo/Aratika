'use client'

/**
 * RollPills — the General / Māori roll switch, once.
 *
 * It existed twice, byte for byte: map-experience.tsx and
 * battlegrounds-map.tsx each carried a segmented control with the same 7px 14px
 * padding, the same 13px/700 label, the same 8-inside-a-3px-padded-10 radii,
 * the same 14px Layers icon and the same `.map-toggle-word` span trick. Neither
 * copy was §2.2, so swapping in the shared pill row fixes the shape and the
 * duplication in one move (§1.3, §1.4).
 *
 * Two other things went with it:
 *
 * - §3.1. Both copies were bare <button>s designed at about 30px and rendered
 *   at 44px by globals.css's phone tap-target minimum, inside a 3px-padded
 *   container, so the whole control was 52px of a 375px screen. The button is
 *   the hit area now and the span is the 28px pill.
 * - §1.2 and §1.4. /battlegrounds explained the control in a caption
 *   ("The two rolls cover the same land, so view one at a time") and /map left
 *   the identical control unexplained. The sentence is in the (i) at the end of
 *   the row, on both pages.
 *
 * No "All" pill: the two rolls cover the same land, so they are exclusive by
 * nature and there is no combined view to offer. That is the one §2.2 rule this
 * row does not take, and the (i) says why.
 *
 * Neutral lit treatment (#efece5 on INK), not a colour per roll, for §2.14's
 * reason: the map underneath is already carrying a colour system, party on
 * /map and margin on /battlegrounds, and a coloured roll pill would be a second
 * one (§1.6).
 */

import { InfoButton, InfoHeading, InfoText } from '@/components/ui/info-button'
import { BORDER, INK, JADE, MANROPE } from '@/constants/theme'

export type Roll = 'general' | 'maori'

const ROLLS: { key: Roll; label: string; tail: string }[] = [
  { key: 'general', label: 'General', tail: ' electorates' },
  { key: 'maori', label: 'Māori', tail: ' electorates' },
]

export function RollPills({ value, onChange, accent = JADE }: {
  value: Roll
  onChange: (roll: Roll) => void
  /** The page's own accent, so the (i) matches the block it explains. */
  accent?: string
}) {
  return (
    <div className="roll-pills" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
      {ROLLS.map((r) => {
        const on = value === r.key
        return (
          /* §3.1: the button is the 44px target, the span is the pill. */
          <button
            key={r.key}
            onClick={() => onChange(r.key)}
            aria-pressed={on}
            style={{ display: 'inline-flex', padding: '8px 0', margin: '-8px 0', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span
              className="status-pill roll-pill"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999,
                background: on ? '#efece5' : '#fff',
                border: `2px solid ${on ? INK : BORDER}`,
                color: INK, fontFamily: MANROPE, fontWeight: 800, whiteSpace: 'nowrap',
                transition: 'background-color .2s ease, border-color .2s ease',
              }}
            >
              {r.label}
              {/* globals.css already drops this word below 768px, which is the
                  behaviour both hand-rolled copies had. Reusing the class
                  rather than shipping a second rule that says the same thing:
                  it is consumed by name only, like .status-pill, so nothing in
                  globals.css needed changing. */}
              <span className="map-toggle-word">{r.tail}</span>
            </span>
          </button>
        )
      })}

      <InfoButton accent={accent} label="Why there are two rolls" size={24} align="left">
        <InfoHeading accent={accent}>Why you see one roll at a time</InfoHeading>
        <InfoText>
          The general and Māori electorates cover the same land. A Māori electorate sits over
          several general ones, so drawing both at once would stack two sets of boundaries on
          top of each other. Switch between them here.
        </InfoText>
        <InfoHeading accent={accent}>Which roll you are on</InfoHeading>
        <InfoText>
          Voters of Māori descent choose which roll to enrol on, and that choice decides which
          electorate they vote in. Everyone else is on the general roll.
        </InfoText>
      </InfoButton>

      <style dangerouslySetInnerHTML={{ __html: ROLL_CSS }} />
    </div>
  )
}

/* Shipped with the component (§3.2). `.status-pill span` is 11px in
   globals.css, because in every other pill row the inner span is a COUNT, which
   is meant to sit under the label. Here it is the second half of the label, and
   "General" at 12.5 beside "electorates" at 11 reads as a word with a footnote.
   Scoped to this row rather than loosened in the shared rule. */
const ROLL_CSS = `
.roll-pill .map-toggle-word { font-size: inherit !important; }
`
