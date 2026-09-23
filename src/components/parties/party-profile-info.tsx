'use client'

/**
 * PartyProfileInfo — the (i) bubbles for /parties/[slug].
 *
 * The party profile had no (i) anywhere, so every explanation was in the body:
 * six lines of Parliament mechanics in a blue box above three numbers, a
 * standfirst telling the reader to tap an issue, and a sourcing paragraph in the
 * page footer. All of it is the test in DESIGN-SPEC §1.2 — a reader who has been
 * here before skips it — so all of it is behind an (i) now, beside the heading
 * it belongs to.
 *
 * Four bubbles on four different headings, which is what §2.1 allows: the rule
 * in §8 ("two (i)s on one page is one too many") is about two on the SAME
 * heading, and /bills already carries two by it.
 *
 * Built on ui/info-button.tsx, never hand-rolled. §7 already lists three orphan
 * copies of the pattern waiting to be folded in; a fourth would have been the
 * problem it records.
 */

import { InfoButton, InfoHeading, InfoText } from '@/components/ui/info-button'
import { TOTAL_SEATS } from '@/constants/parties'

/** §2.1: 24px beside a smaller heading, 26 beside a big one. Every heading
 *  these hang off is a card header or a section h2, so 24 throughout. */
const SIZE = 24

/**
 * Beside the seat figure. Answers the four questions §8 records being asked
 * about one block of numbers: what a seat is, where they come from, why the
 * arithmetic does not land exactly, and why National reads 49 and not the 48 it
 * won on the night.
 *
 * The electorate and list split lives in here rather than on the page. It was
 * stated three times inside one card (a stacked bar, a legend under it, and two
 * rows of a table), and §8 has the verdict on showing it at all: "2 electorate
 * 9 list I don't get this." In §2.8's plain words it is one sentence.
 */
export function SeatsInfo({ accent, partyName, seats, electorateSeats, listSeats }: {
  accent: string
  partyName: string
  seats: number
  electorateSeats: number
  listSeats: number
}) {
  const majority = Math.floor(TOTAL_SEATS / 2) + 1
  return (
    <InfoButton accent={accent} size={SIZE} align="left" label="What the seat count means">
      <InfoHeading accent={accent}>What a seat is</InfoHeading>
      <InfoText>
        A seat is one MP. The 54th Parliament has {TOTAL_SEATS} of them, and every law is decided by
        those MPs voting, so a party with more seats gets more of what it wants. A group of parties
        needs {majority} between them to govern.
      </InfoText>

      {seats > 0 && (
        <>
          <InfoHeading accent={accent}>How {partyName} got theirs</InfoHeading>
          <InfoText>
            {electorateSeats} won a local seat and {listSeats} came off the party list. You get two
            votes: the party vote decides how many seats a party gets overall, the electorate vote
            decides who wins your local area.
          </InfoText>
        </>
      )}

      <InfoHeading accent={accent}>Where the number comes from</InfoHeading>
      <InfoText>
        It is the 2023 general election result, from the Electoral Commission. It is not support
        today, and it does not change between elections except by a by-election. That is why
        National reads 49 here rather than the 48 it won on the night: the Port Waikato by-election
        in November 2023 added one.
      </InfoText>

      <InfoHeading accent={accent}>Why the shares do not add up</InfoHeading>
      <InfoText>
        A party has to clear 5% of the party vote, or win an electorate, to get in at all. Votes for
        parties that do neither are set aside, which lifts everyone else&rsquo;s share slightly. And
        a party that wins more electorates than its party vote entitles it to keeps them, which is
        why this Parliament has {TOTAL_SEATS} seats rather than 120.
      </InfoText>
    </InfoButton>
  )
}

/**
 * Beside "Where they stand". Holds the standfirst that used to sit above the
 * chips ("Tap an issue to read…", pure instruction, §1.2) and the trust
 * paragraph that the position reader repeats at the foot of every panel.
 */
export function PositionsInfo({ accent, partyName, covered, total }: {
  accent: string
  partyName: string
  covered: number
  total: number
}) {
  return (
    <InfoButton accent={accent} size={SIZE} align="right" label="How these positions are written">
      <InfoHeading accent={accent}>What you are reading</InfoHeading>
      <InfoText>
        Each issue opens {partyName}&rsquo;s current policy, summarised neutrally in our words and
        checked by an editor, with a link to their own source. Nothing is paraphrased without the
        source linked. Politika is non-partisan.
      </InfoText>

      <InfoHeading accent={accent}>Why some issues are dim</InfoHeading>
      <InfoText>
        {covered} of {total} issues have a recorded position. A dimmed issue means we hold nothing
        yet, not that the party has no view. Every contesting party is covered the same way, and the
        gaps are left showing rather than quietly dropped.
      </InfoText>

      <InfoHeading accent={accent}>Current policy only</InfoHeading>
      <InfoText>
        What a party said in 2023 is kept for the then-and-now comparison and is not shown here,
        because a three-year-old manifesto entry presented as today&rsquo;s policy would misstate
        the party.
      </InfoText>
    </InfoButton>
  )
}

/**
 * Beside the 2023 election card's record. Six lines of Parliament mechanics
 * came out of the body for this: they explained how to read three numbers, which
 * is §1.2 exactly, and they sat in a blue box that was a fourth visual idiom on
 * a page that already had three.
 */
export function RecordInfo({ accent, partyName, governing, asOf }: {
  accent: string
  partyName: string
  governing: boolean
  /** The capture date the figures are counted to, so the bubble ages honestly. */
  asOf: string
}) {
  return (
    <InfoButton accent={accent} size={SIZE} align="right" label="How this record is counted">
      {governing ? (
        <>
          <InfoHeading accent={accent}>Government bills</InfoHeading>
          <InfoText>
            As a governing party, {partyName}&rsquo;s ministers lead government legislation.
            Government bills are the coalition&rsquo;s collective programme, counted here by the
            party of the minister in charge rather than as one party&rsquo;s alone.
          </InfoText>
        </>
      ) : (
        <>
          <InfoHeading accent={accent}>Members&rsquo; bills</InfoHeading>
          <InfoText>
            An opposition party does not lead government bills, only ministers can, so a zero there
            is a difference in role and not a measure of activity. Its MPs advance policy through
            members&rsquo; bills instead.
          </InfoText>
          <InfoHeading accent={accent}>What the ballot is</InfoHeading>
          <InfoText>
            Each MP may lodge one members&rsquo; bill in a ballot, and a few are drawn at random
            each fortnight to be introduced. Most never are, so the ballot figure is what is
            waiting, not what is in front of Parliament.
          </InfoText>
        </>
      )}

      <InfoHeading accent={accent}>Where the figures come from</InfoHeading>
      <InfoText>
        Counted from the member in charge of each bill on NZ Parliament&rsquo;s own bills register,
        as at {asOf}. Facts only: nothing here is scored or ranked, and the figures move between
        captures.
      </InfoText>
    </InfoButton>
  )
}

/**
 * Beside "Latest News & Video". The standfirst it replaces named a coverage
 * page it did not link to, and the empty state claimed "the current window"
 * without ever saying what the window was.
 */
export function CoverageInfo({ accent, partyName }: { accent: string; partyName: string }) {
  return (
    <InfoButton accent={accent} size={SIZE} align="right" label="Where this coverage comes from">
      <InfoHeading accent={accent}>Where this comes from</InfoHeading>
      <InfoText>
        The same approved pool that feeds our newsroom and the Election Centre, tagged to
        {' '}{partyName} by name. Nothing here bypasses editorial review, and none of it is written
        by us: it is what other outlets have published.
      </InfoText>

      <InfoHeading accent={accent}>Why some parties have little</InfoHeading>
      <InfoText>
        Coverage is genuinely uneven by party, and an empty column says so rather than being padded
        out with loosely related items. The smaller registered parties are reported on far less than
        the six in Parliament, which is a fact about the news, not a gap in the site.
      </InfoText>
    </InfoButton>
  )
}
