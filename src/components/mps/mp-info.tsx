/**
 * mp-info — the (i) bubbles for an MP profile, in one file.
 *
 * What these replaced: `ComingNote`, a dashed box with a lucide `Info` glyph
 * inside it, used five times on /mps/[slug] plus three bare intro paragraphs
 * doing the same job. It was the (i) pattern INVERTED — an always-open box with
 * a circle-i in it — and it was a fourth hand-rolled copy after the three §7
 * already records. §1.2's test applies to every paragraph in here: would a
 * reader who has seen one MP profile skip this on the next? All of them, yes.
 *
 * Each bubble is the shared §2.1 `InfoButton`, unmodified, at size 24 beside a
 * 24px heading. One (i) per section at most, per §8: "Two (i)s on one page is
 * one too many; merge them."
 *
 * These are plain components rather than a client module: the bodies are static
 * JSX with serialisable props, and InfoButton carries its own 'use client'.
 */

import Link from 'next/link'
import { InfoButton, InfoHeading, InfoText } from '@/components/ui/info-button'
import { BILL_ACTIVITY_META } from '@/constants/mps-bill-activity'
import { WRITTEN_QUESTIONS_META } from '@/constants/mps-written-questions'
import { BORDER, JADE, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

/** Everything about where this page's facts come from, beside the MP's name —
 *  the way `AboutBillsTracker` sits beside the /bills h1. It was 188px of
 *  footer under the page before. */
export function ProfileSourcesInfo({ accent, parliamentUrl }: { accent: string; parliamentUrl: string }) {
  return (
    <InfoButton accent={accent} label="Where this page's facts come from" size={26}>
      <InfoHeading accent={accent}>Where this comes from</InfoHeading>
      <InfoText>
        The biography, roles and committees are taken from{' '}
        <a href={parliamentUrl} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 700 }}>this MP&rsquo;s page on parliament.nz</a>{' '}
        and the public record, extracted in June 2026.
      </InfoText>
      <InfoHeading accent={accent}>What refreshes on its own</InfoHeading>
      <InfoText>
        Bills, written questions, declared interests and expenses come from Parliament&rsquo;s official sources
        automatically, and each block below carries the date it was last taken.
      </InfoText>
      <InfoHeading accent={accent}>What does not</InfoHeading>
      <InfoText>
        Personal votes are read out of Hansard as they occur, because Parliament publishes no per-MP list of them.
      </InfoText>
    </InfoButton>
  )
}

/** The page's whole editorial stance on why these numbers are not a league
 *  table, and the honest account of which fields we hold. */
export function ImpactInfo({ accent, isMinister }: { accent: string; isMinister: boolean }) {
  return (
    <InfoButton accent={accent} label="How to read these numbers" size={24}>
      <InfoHeading accent={accent}>Why we do not score MPs</InfoHeading>
      <InfoText>
        These are factual counts from the public record, not a score. MPs do different jobs:{' '}
        {isMinister
          ? 'ministers run portfolios rather than sponsoring members’ bills'
          : 'list and electorate MPs, ministers and backbenchers all contribute differently'}
        , and MPs first elected in 2023 have a shorter record. We show the facts so <b>you</b> can decide
        what counts as doing enough.
      </InfoText>

      <InfoHeading accent={accent}>Where the figures come from</InfoHeading>
      <InfoText>
        Bills come from{' '}
        <a href={BILL_ACTIVITY_META.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 700 }}>{BILL_ACTIVITY_META.sourceLabel}</a>,
        as at {BILL_ACTIVITY_META.asOf}. Written questions come from{' '}
        <a href={WRITTEN_QUESTIONS_META.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 700 }}>questions.parliament.nz</a>.
        Roles and committees are from parliament.nz, as at June 2026.
      </InfoText>

      <InfoHeading accent={accent}>What is not here</InfoHeading>
      <InfoText>
        Speeches in the House are not shown. Hansard files a presiding officer&rsquo;s procedural calls under the
        same type as a substantive speech, so the raw tally puts an Assistant Speaker on 2,593 above the Prime
        Minister on 29. Published as &ldquo;speeches&rdquo; that would read as an engagement score and mislead,
        which is the opposite of the point.
      </InfoText>
    </InfoButton>
  )
}

/** How the policy areas are derived. It used to be shown only when the section
 *  was EMPTY, which is the one case where the method matters least. */
export function PoliciesInfo({ accent }: { accent: string }) {
  return (
    <InfoButton accent={accent} label="How these policy areas were worked out" size={24}>
      <InfoHeading accent={accent}>How these were worked out</InfoHeading>
      <InfoText>
        We map the policy areas an MP shapes from their portfolios, spokesperson roles and select committees.
        It says where they have a hand in the work, not what they personally believe.
      </InfoText>
      <InfoHeading accent={accent}>Where the party stands</InfoHeading>
      <InfoText>
        Each area links to the comparison page for that issue, where every party&rsquo;s position sits side by side.
      </InfoText>
    </InfoButton>
  )
}

/** The ballot mechanics, lifted from §2.12's InfoButton in ballot-bills.tsx
 *  rather than rewritten, so the two explanations cannot drift. */
export function BillsInfo({ accent }: { accent: string }) {
  return (
    <InfoButton accent={accent} label="How the members' ballot works" size={24}>
      <InfoHeading accent={accent}>Bills in the ballot</InfoHeading>
      <InfoText>
        Bills written by MPs who are not Ministers, lodged and waiting to be drawn. They have not been
        introduced, so they have no stage yet.
      </InfoText>
      <InfoHeading accent={accent}>How the ballot works</InfoHeading>
      <InfoText>
        Each MP may have one bill in the ballot at a time. When there is room on the order paper the Clerk draws
        bills at random, and a drawn bill is then introduced and follows the ordinary stages.
      </InfoText>
      <InfoText>
        The draw is luck, not support: a bill with the numbers behind it can sit there for a whole term and never
        be drawn, and a drawn bill can still be voted down at its first reading.
      </InfoText>
      <InfoHeading accent={accent}>Government bills</InfoHeading>
      <InfoText>
        A Minister is the member in charge of the government bills in their portfolio. That is the job, not a
        personal initiative, which is why the two are counted separately.
      </InfoText>
    </InfoButton>
  )
}

/** The party-vote mechanism. It was ~8 lines at 13px above a list that for most
 *  MPs is empty: the explanation was taller than the thing it explained. */
export function VotesInfo({ accent, party }: { accent: string; party: string }) {
  return (
    <InfoButton accent={accent} label="How votes in Parliament work" size={24}>
      <InfoHeading accent={accent}>Most votes are party votes</InfoHeading>
      <InfoText>
        Parliament decides most matters by <b>party vote</b>: one member casts their whole party&rsquo;s votes at
        once. So on the large majority of votes this MP voted the same way as {party}, because that is how the
        system counts them.
      </InfoText>
      <InfoHeading accent={accent}>Votes cast on their own</InfoHeading>
      <InfoText>
        A <b>personal vote</b> is one where members walk through the lobbies individually and are named. These are
        rare, usually on matters parties leave to conscience, and they are the votes that show an MP&rsquo;s own view.
      </InfoText>
      <InfoHeading accent={accent}>Why the list can be empty</InfoHeading>
      <InfoText>
        Parliament publishes personal votes only inside the Hansard transcript, with no per-MP list, so we record
        them as they occur. An empty list usually means there have been none this term, not that we are missing them.
      </InfoText>
    </InfoButton>
  )
}

/** The "not a measure of wealth" caveat: a how-to-read-this, not a fact about
 *  this MP, and the most important sentence in that section. */
export function InterestsInfo({ accent }: { accent: string }) {
  return (
    <InfoButton accent={accent} label="What the register of interests is" size={24}>
      <InfoHeading accent={accent}>What this is</InfoHeading>
      <InfoText>
        Every MP must declare directorships, property, trusts, debts and gifts in Parliament&rsquo;s official
        register once a year.
      </InfoText>
      <InfoHeading accent={accent}>What it is not</InfoHeading>
      <InfoText>
        It registers actual and potential conflicts of interest. It is <b>not</b> a measure of wealth: it records
        that an interest exists, not what it is worth.
      </InfoText>
    </InfoButton>
  )
}

/** Ministers are disclosed separately, which is why a minister's figure here
 *  looks small. */
export function ExpensesInfo({ accent }: { accent: string }) {
  return (
    <InfoButton accent={accent} label="What these expenses cover" size={24}>
      <InfoHeading accent={accent}>What is counted</InfoHeading>
      <InfoText>
        Travel and accommodation paid by Parliamentary Service so an MP can do the job, published every quarter.
      </InfoText>
      <InfoHeading accent={accent}>What is not</InfoHeading>
      <InfoText>
        Ministers&rsquo; expenses in their portfolios are disclosed separately by the Department of Internal
        Affairs, so a minister&rsquo;s figure here covers only their work as an MP.
      </InfoText>
    </InfoButton>
  )
}

/** Why one MP has 165 items and another has one. This was three clauses of
 *  prose in the empty state, asserting the unevenness rather than measuring it;
 *  the measurements were sitting unused in mp-coverage.tsx's own docblock. */
export function CoverageInfo({ accent }: { accent: string }) {
  return (
    <InfoButton accent={accent} label="How coverage is collected" size={24}>
      <InfoHeading accent={accent}>Where this comes from</InfoHeading>
      <InfoText>
        News and video from the outlets and channels listed on our coverage page, tagged to this MP by name when
        the item is approved. We link out; we do not republish.
      </InfoText>
      <InfoHeading accent={accent}>Why some MPs have none</InfoHeading>
      <InfoText>
        Coverage is concentrated on ministers and party leaders. Measured across the approved pool, 58 of 123
        members have any coverage at all, the median for those who do is 6 items, and the range runs from 165 down
        to 1. An empty list here is the real state of the record rather than a gap in ours.
      </InfoText>
    </InfoButton>
  )
}

/** Not a bubble: the one-line §1.5 gap statement that stays VISIBLE when a
 *  section has nothing in it, with the explanation moved into the (i) beside
 *  the heading. A silent gap reads as broken; a paragraph of caveats reads as
 *  an excuse. */
export function GapLine({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 13, color: TERTIARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
      {children}
    </p>
  )
}

/** A quiet way out of a section, for the places that used to carry a second
 *  full-strength button (§2.6: several stacked make each one count for less). */
export function QuietChip({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
  const style: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '5px 10px', borderRadius: 9,
    border: `1px solid ${BORDER}`, background: '#fff', color: SECONDARY,
    fontSize: 11.5, fontWeight: 700, fontFamily: MANROPE,
    textDecoration: 'none', whiteSpace: 'nowrap',
  }
  if (external) return <a href={href} target="_blank" rel="noopener noreferrer" style={style}>{children}</a>
  return <Link href={href} style={style}>{children}</Link>
}
