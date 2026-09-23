/**
 * ZoneHead — the Election Centre's section header, in one place.
 *
 * An eyebrow, a title, the (i) that holds everything the standfirst used to
 * say, and an optional one-line note. Every section on /elections/2026 opens
 * with this, so the page's rhythm is one decision rather than six.
 *
 * It lives in its own file because three components render a peer heading and
 * they cannot all import it from the page: upcoming-view.tsx imports KeyDates
 * and SeatChamber, so a heading constant exported from there and imported back
 * by either of them is a circular import, which for a plain const means reading
 * it as `undefined` depending on which module the bundler initialises first.
 * A leaf module nothing else imports cannot have that problem.
 *
 * WHAT CAME OFF THE OLD HEADER. It had a `sub` slot, and five sections filled
 * it with a standfirst: 530px of prose explaining how to read the block below
 * it, where the data came from, or why the block existed. Every one of those is
 * §1.2's definition of a bubble, and every one of them is now an (i) on the
 * heading it belonged to, with nothing lost. `note` is what is left, and it is
 * for a FACT the reader needs before they tap anything, never for an
 * explanation: how many clips are in the rail, or that no debates have been
 * broadcast yet (§1.5). If a note starts explaining, it belongs in the (i).
 *
 * It also had a right-aligned text link, which is now a §2.6 SignShape placed
 * by the section that needs one, at most one per section, pulled out to the
 * page gutter so every sign on the site starts on the same vertical line.
 */

import type { ReactNode } from 'react'
import { InfoButton } from '@/components/ui/info-button'
import { INK, JADE, MANROPE, SECONDARY } from '@/constants/theme'

/**
 * The one heading size every peer section on this page uses (§4).
 *
 * A CLAMP, not a flat number and not a media query. The spec's rule is that two
 * sections on one page are the same size, which is a rule about a number, so
 * the number is in one place and the three components that render a peer
 * heading all read it.
 *
 * 24px everywhere it fits, which is the size /bills uses for "The most debated
 * bills"; 22px at 375px, where "Leaders & the press" beside a 24px (i) wraps to
 * two lines and pushes the bubble's anchor down the page.
 *
 * §3.2 says a component styled inline cannot be made responsive from
 * globals.css, and its answer is a <style> block shipped with the component. A
 * clamp is the same answer with fewer moving parts: it responds without a
 * stylesheet at all, so it cannot be mounted inside one branch and missed by
 * another, which is the failure §3.2 exists to warn about. KeyDates still ships
 * a real <style> block, because a grid's COLUMN COUNT cannot be clamped.
 */
export const PEER_HEADING = 'clamp(22px, 5.5vw, 24px)'

export function ZoneHead({ eyebrow, title, accent, infoLabel, note, children }: {
  eyebrow: string
  title: string
  /** The (i)'s fill and heading colour — the section's own ink, because a block
   *  takes the colour of whatever it is about (§1.6). */
  accent: string
  /** Accessible name for the (i). Says what the bubble answers, not "info".
   *  Optional: KeyDates' (i) moved up to the hero by request, so this
   *  section's own ZoneHead call carries no infoLabel/children and renders
   *  no (i) here at all — the content didn't get duplicated, it moved. */
  infoLabel?: string
  note?: string
  children?: ReactNode
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, marginBottom: 6 }}>{eyebrow}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h2 style={{ fontSize: PEER_HEADING, fontWeight: 800, letterSpacing: '-.025em', color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.15 }}>{title}</h2>
        {/* size 24 rather than the default 26: §2.1's "24 beside a smaller
            heading", and these headings are 22px on a phone. */}
        {infoLabel && children && <InfoButton accent={accent} label={infoLabel} size={24}>{children}</InfoButton>}
      </div>
      {note && <p style={{ fontSize: 'clamp(12px, 3.4vw, 12.5px)', color: SECONDARY, fontFamily: MANROPE, margin: '7px 0 0', lineHeight: 1.5 }}>{note}</p>}
    </div>
  )
}
