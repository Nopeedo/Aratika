/**
 * PartyLegislativeRecord — "this term in law" for a party page. Neutral, factual,
 * with the governing-vs-opposition role made explicit. See
 * src/lib/parties/legislative-record.ts for the credibility notes.
 *
 * It was three bordered Stat cards (a 28px integer over an 11.5px label) in each
 * of two branches, plus a paragraph explaining how to read them. §8 has the
 * request verbatim: "I want these stats to be more compact and not clickable,
 * and more for information." §3.3 has the shape that answered it on /bills, the
 * homepage and the tracker — "152 now law · 21 waiting to be drawn" — which took
 * ~330px of cards down to 73px of text. Same move here: two rows of 98px cards
 * become one line, and the six lines of Parliament mechanics that used to sit
 * above them are behind the (i) on the card header (§1.2).
 *
 * Every figure the cards carried is still stated. Governing keeps government
 * bills now law, government bills led in all, members' bills passed and the
 * ballot count; opposition keeps members' bills passed, the ballot count and the
 * number before Parliament. Nothing was dropped in the compaction (§5.17).
 */

import { ExternalLink, Gavel, BadgeCheck } from 'lucide-react'
import { legislativeRecordFor } from '@/lib/parties/legislative-record'
import { trackerBillCounts } from '@/lib/bills/member-party'
import { PARTY_COLORS } from '@/constants/parties'
import type { PartySlug } from '@/types'
import { CollapsibleCard } from '@/components/parties/collapsible-card'
import { RecordInfo } from '@/components/parties/party-profile-info'
import { SignShape } from '@/components/ui/sign-link'
import { isLightHex } from '@/components/homepage/battleground-card'
import { BORDER, INK, JADE, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

// Which parties actually have bills before the House in the tracker — so we only
// link through to /bills?party=… when there is something to show (opposition
// parties whose only activity is ballot members' bills have none yet).
const TRACKER_COUNTS = trackerBillCounts()

/** One figure inside the summary line. §3.3's shape: the number carries the
 *  weight, the words around it stay at reading size, and none of it is a box. */
function Fig({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <>
      <b style={{ color: INK, fontWeight: 800 }}>{n}</b> {children}
    </>
  )
}

export function PartyLegislativeRecord({ party, partyName, glance }: {
  party: PartySlug
  partyName: string
  /** The seat breakdown, rendered by the page and shown above the record.
   *  It was a sidebar card of its own until it moved in here. */
  glance?: React.ReactNode
}) {
  const r = legislativeRecordFor(party)
  const nothing = r.govBillsLed === 0 && r.membersInBallot === 0 && r.membersPassed === 0
  // The seat breakdown is worth a card on its own, so a party with no bills
  // to its name still gets this section rather than losing its numbers with
  // the record they were sitting above.
  if (nothing && !glance) return null
  const trackerCount = TRACKER_COUNTS[party] ?? 0
  const hasTrackerBills = trackerCount > 0
  // CollapsibleCard draws the party-colour frame from this, matching the cards
  // either side of it on the page.
  const accent = PARTY_COLORS[party]?.bg ?? JADE

  return (
    // Closed by default like the four sections above it: this is the fifth
    // rectangle in that column and has to behave as one. The dateline moves
    // inside, since a closed card shows its title and nothing else.
    <CollapsibleCard
      title="2023 election"
      icon={<Gavel style={{ width: 15, height: 15 }} />}
      accent={accent}
      info={!nothing ? <RecordInfo accent={accent} partyName={partyName} governing={r.governing} asOf={r.asOf} /> : undefined}
    >
      <style dangerouslySetInnerHTML={{ __html: RECORD_CSS }} />
      {glance}
      {/* The record keeps its own heading now that the card is named for the
          election: two different things live in here, the seats won and what
          was done with them. A party with no bills shows the seats alone. */}
      {!nothing && (
      <>
      {/* "What {party} has put into law", not "Legislative record this term".
          §1.7: name the party, say what happened, and leave Parliament's own
          register-keeping vocabulary out of it. The dateline goes with it:
          "Since the 2023 election · checked {date}" is what src/app/bills/
          page.tsx already says, where "54th Parliament · as at" used to. */}
      <h3 className="lr-heading" style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 3px', letterSpacing: '-.01em' }}>
        {r.governing ? `What ${partyName} has put into law` : `What ${partyName}’s MPs have put forward`}
      </h3>
      <p className="lr-dateline" style={{ fontSize: 11.5, fontWeight: 600, color: TERTIARY, fontFamily: MANROPE, margin: '0 0 12px' }}>
        Since the 2023 election · checked {r.asOf}
      </p>

      {/* One line of detail, not three cards (§4, §3.3). The explanation that
          used to sit above it — which party a government bill belongs to, what
          the ballot is, why a zero is a difference in role and not in effort —
          is in the (i) on this card's header. */}
      <p className="lr-line" style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.65, margin: 0, maxWidth: '62ch' }}>
        {r.governing ? (
          <>
            {/* "Government bills their ministers are running", not "Government
                bills led (incl. in progress)" — an abbreviation inside a
                parenthesis inside an 11.5px label (§1.7, §4). */}
            <Fig n={r.govBillsLed}>government bills their ministers are running</Fig>,{' '}
            <b style={{ color: INK, fontWeight: 800 }}>{r.govBillsPassed}</b> of them now law
            {' · '}<Fig n={r.membersPassed}>members’ bills passed</Fig>
            {r.membersInBallot > 0 && <>{' · '}<Fig n={r.membersInBallot}>waiting in the ballot</Fig></>}
          </>
        ) : (
          <>
            <Fig n={r.membersPassed}>members’ bills now law</Fig>
            {' · '}<Fig n={r.membersInBallot}>waiting to be drawn</Fig>
            {/* "Introduced this term", not "Before the House now" — §1.7 took
                that exact phrase off /bills for telling a first-time reader
                nothing about whose bills they are. */}
            {' · '}<Fig n={trackerCount}>introduced this term</Fig>
          </>
        )}
      </p>

      {r.passedMembersBills.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="lr-label" style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 8 }}>Passed into law</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {r.passedMembersBills.map((t) => (
              <div key={t} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <BadgeCheck className="lr-tick" style={{ width: 14, height: 14, color: '#166638', flexShrink: 0, position: 'relative', top: 2 }} />
                <span className="lr-bill" style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.45 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* §2.6: ONE signpost, in the party's own colour, as the way out of this
          section. It replaced a jade text link that sat in a row with the
          source line and read as the smaller of two footnotes. Light party
          colours (ACT's yellow, TOP's teal) take ink rather than white, or the
          label disappears into the fill. */}
      <div className="lr-foot" style={{ display: 'flex', alignItems: 'center', justifyContent: hasTrackerBills ? 'space-between' : 'flex-end', gap: 12, flexWrap: 'wrap', marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
        {/* Says the count, because it sits under the ballot figure and "See all
            {party} bills" read as a link to those — the tracker only holds bills
            that have actually been introduced, which is far fewer. */}
        {hasTrackerBills && (
          <span className="lr-sign">
            <SignShape href={`/bills?party=${party}`} color={accent} fg={isLightHex(accent) ? INK : '#ffffff'}>
              {trackerCount} {partyName} bill{trackerCount === 1 ? '' : 's'} in Parliament
            </SignShape>
          </span>
        )}
        <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="lr-source" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: TERTIARY, fontFamily: MANROPE, textDecoration: 'none' }}>
          Source: NZ Parliament, Bills <ExternalLink style={{ width: 12, height: 12 }} />
        </a>
      </div>
      </>
      )}
    </CollapsibleCard>
  )
}

/* Shipped with the component and mounted OUTSIDE the governing/opposition
   branch, which is §3.2's warning made concrete: this file has two mutually
   exclusive branches and a style block inside one of them would leave the other
   unsized, exactly as the bills panel's phone sizing was mounted in one branch
   and never reached the tallest card on the page.

   The desktop half is §2.14/§5.19: the summary line, the bill list and the
   dateline were all composed at 375px and rendered at the same size inside a
   968px card, where 13.5px of body type reads as a caption. The measure is
   capped in ch so a wider card gives a longer card, not a longer line.

   The signpost's own type is stepped DOWN on a phone: SignShape sets
   white-space: nowrap, and "3 Te Pāti Māori bills in Parliament" at 14px plus
   the point's 34px of padding is wider than a 305px card interior. */
const RECORD_CSS = `
@media (max-width: 420px) {
  .lr-sign a { font-size: 13px !important; }
}
@media (min-width: 768px) {
  .lr-heading { font-size: 18px !important; margin-bottom: 4px !important; }
  .lr-dateline { font-size: 12.5px !important; margin-bottom: 16px !important; }
  .lr-line { font-size: 15.5px !important; }
  .lr-label { font-size: 12.5px !important; margin-bottom: 10px !important; }
  .lr-bill { font-size: 15px !important; }
  .lr-tick { width: 16px !important; height: 16px !important; }
  .lr-foot { margin-top: 20px !important; padding-top: 18px !important; }
  .lr-sign a { font-size: 15.5px !important; padding: 11px 38px 11px 16px !important; }
  .lr-source { font-size: 12.5px !important; }
}
`
