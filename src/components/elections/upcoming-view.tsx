/**
 * UpcomingView — the 2026 Election Centre.
 *
 * Flow: when (the deadline) → how your vote works → who you can vote for →
 * the Parliament you are changing → your own seat → the leaders.
 *
 * COMPOSED AT 375px, not reduced to it. The page used to run 7,771px, about
 * 9.6 screens on a phone, and roughly 70% of that was content nobody had asked
 * to see: seventeen party rows, five full-height battleground cards, a 520px
 * Leaflet map with a 420px "Tap a seat" panel under it, two prose explainer
 * cards, five standfirsts and a scaffold card promising a feature that does not
 * exist. §1.1 says a section opens showing what it IS, not its contents, and
 * every block below now does.
 *
 * WHAT CAME OFF THIS FILE, and why, so none of it comes back by accident:
 *
 *  - The BattlegroundsMap embed. 1,070px, the single largest saving on the
 *    page. It arrived open, and a map is /battlegrounds' content rather than
 *    this page's — so the five closest races are this section's content and one
 *    §2.6 signpost is the way to the rest (§1.1, §2.6).
 *  - The MapPin card explaining how to read that map. Seven lines saying red is
 *    close and green is safe, above a map carrying its own margin legend. It
 *    died with the map; the part that was about the five seats is in the (i).
 *  - The election-night scaffold. §6.1: a promise about a feature that does not
 *    exist yet, the Election Centre's version of the homepage install pill,
 *    which was cut for exactly this.
 *  - The page-foot "Enrolment & voting information: Electoral Commission"
 *    link. A third link to the Commission (§1.3). KeyDates carries the vote.nz
 *    enrol button and the timetable credit, and those are the two that do work.
 *  - Five standfirsts totalling ~530px. Every one of them explained how to read
 *    the block below it, where the data came from, or why the block exists,
 *    which is the §1.2 test exactly: a returning reader skips all of it. They
 *    are (i) bubbles on their headings now, and not one fact was dropped.
 *
 * The two "Enrol or check your details" / "Vote early or on the day" cards that
 * sat here are also gone, and have been for longer. They restated the KeyDates
 * strip a few hundred pixels below: one duplicated its "Check you're enrolled"
 * link, the other spelled out in prose the same four dates the strip already
 * shows, and did it with the dates HARDCODED, while the strip reads them from
 * the Electoral Commission file. Two copies of a deadline, one sourced and one
 * typed.
 */

import type { ElectionData } from '@/constants/elections-data'
import { BASELINE_ELECTION } from '@/constants/elections-data'
import { getDebateVideos, getVideos } from '@/lib/news/videos'
import { getBattlegrounds } from '@/lib/battlegrounds'
import { MP_PROFILES } from '@/constants/mps-data'
import {
  pollOfPolls, pollOfPollsOthers, seatProjection, pollsAsAt, POLL_PARTIES, PREFERRED_PM,
  TURNOUT_2023, ENROLMENT_2023, PARTICIPATION_SOURCE, POLLS_SOURCE,
  PROJECTION_SEATS,
} from '@/constants/polls-data'
import { getPolls } from '@/lib/polls/live'
import { longDate, milestone } from '@/constants/electoral-calendar'
import { CommandHero } from './command-hero'
import { SectionRail } from './section-rail'
import { KeyDates } from './key-dates'
import { PollSnapshot } from './poll-snapshot'
import { SeatChamber } from './seat-chamber'
import { TwoVotes } from './two-votes'
import { CompassCta } from '@/components/compass/compass-cta'
import { PartiesContesting } from './parties-contesting'
import { ClosestRaces, type ClosestRace } from './closest-races'
import { VideoSection } from '@/components/news/video-section'
import { ZoneHead } from './zone-head'
import { InfoHeading, InfoText } from '@/components/ui/info-button'
import { SignShape } from '@/components/ui/sign-link'
import { WOVEN_PAGE } from '@/constants/theme'
import type { PartySlug } from '@/types'

// Warm palette carried over from the homepage/hub so the Election Centre reads
// as the same product rather than a separate tool: espresso headings, warm body
// greys, warm hairlines — replacing the cold #0c0e12/#6b7078/#e9e7e2 set.

/** Per-section accent, for the (i) bubbles only. These are the same inks the
 *  floating rail's dots use (constants/election-sections.ts); the (i) takes the
 *  colour of the block it explains, which is §1.6's "a block takes the colour
 *  of whatever it is about". They are NOT on the chips any more. */
const ACCENT = {
  vote: '#0e7490',
  parties: '#6d28d9',
  seat: '#be123c',
  watch: '#b45309',
} as const

/** How many videos the rail holds. It was 18, showing 1.06 of them at 375px
 *  with the other seventeen behind a swipe — the exact shape §2.10 records
 *  being deleted from the homepage ("a horizontal rail of description cards,
 *  which on a phone showed one and a half cards and hid the other twelve").
 *  video-section.tsx has four callers and is not this page's to restyle, so the
 *  fix from this side is to stop fetching a rail that deep and to name the
 *  count under the heading. */
const VIDEO_COUNT = 6

/** The closest races, flattened to serialisable values here so the tiles stay a
 *  client component without pulling ELECTORATES and MP_PROFILES into the
 *  bundle. `unknown` tier and a missing majority are filtered out: a seat with
 *  no verified 2023 margin cannot be called one of the closest. */
function closestRaces(): ClosestRace[] {
  return getBattlegrounds()
    .filter((b) => b.tier.key !== 'unknown' && typeof b.info.majority === 'number')
    .slice(0, 5)
    .map((b, i) => {
      const slug = b.info.mpSlug || Object.values(MP_PROFILES).find((mp) => mp.name === b.info.mpName)?.slug
      return {
        slug: b.slug,
        name: b.info.name,
        rank: i + 1,
        tierLabel: b.tier.label,
        tierColor: b.tier.color,
        party: (b.info.party as PartySlug | null) ?? null,
        mpName: b.info.mpName ?? null,
        mpPhoto: slug ? MP_PROFILES[slug]?.photo : undefined,
        majority: b.info.majority as number,
        maori: b.info.type === 'maori',
      }
    })
}

export async function UpcomingView({ e }: { e: ElectionData }) {
  const base = BASELINE_ELECTION
  const debates = await getDebateVideos(VIDEO_COUNT)
  const railVideos = debates.length > 0 ? debates : await getVideos(VIDEO_COUNT)
  // Only a genuine debate clip may be called one.
  const hasRealDebates = debates.some((v) => v.debate)
  const polls = await getPolls()
  const pop = pollOfPolls(polls)
  const projection = seatProjection(polls)
  // Derived from the polls actually being averaged, not the hand-maintained
  // POLLS_AS_AT constant — that read "9 July 2026" on 10 September while the
  // figures beside it were current to 3 September.
  const asAt = pollsAsAt(polls)
  // NZ local date — the calendar's deadlines are NZ deadlines.
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })
  const races = closestRaces()
  // The date the party list stops changing. It was claimed in prose ("the final
  // list is confirmed when nominations close") with no date against it, on a
  // page that already reads the file the date is in.
  const nominationsClose = milestone('nominations-close-2026')?.date

  return (
    // One continuous woven texture behind the whole page — hero included — so it
    // sits in the same world as the homepage and hub instead of on flat white.
    <div style={WOVEN_PAGE}>
      <CommandHero />
      <SectionRail />

      {/* 1080 to match /bills and /parties. This page was the narrowest
           content column on the site at 1000, which is not a difference a
           reader can attribute to anything. */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(30px, 5vh, 44px) clamp(18px, 5vw, 36px) 64px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(34px, 5vh, 48px)' }}>

          {/* ── WHEN — first, because it is the only section with a deadline ────
              Everything else on this page can be read the day before the
              election and still be useful. This one cannot: enrolment closes
              25 October, thirteen days early, and a reader who arrives on
              26 October has already lost the choice no matter how well they
              understand MMP. Knowledge keeps; a closed roll doesn't.

              It also now carries the enrolment link and the "you must be
              enrolled" line, so it is the whole of what someone has to DO —
              which belongs above what they need to know. */}
          <KeyDates today={today} />

          {/* ── HOW YOUR VOTE WORKS — the primer everything below assumes ───────
              Two votes, what each one does, and why the party vote decides the
              shape of Parliament. It used to sit second-to-last, under the
              polls, the seat projection and the electorate map, all of which
              are unreadable to someone who does not already know this. Second
              is right: a reader who knows MMP scrolls past it in a second, and
              one who doesn't cannot reconstruct it from a hemicycle.

              The tiles are what make "scrolls past it in a second" true. Open,
              this block was 468px of prose that the argument above says most
              readers skip, which is §1.1's whole point. */}
          <section id="your-vote" style={{ scrollMarginTop: 80 }}>
            <ZoneHead eyebrow="Get ready to vote" title="How your vote works" accent={ACCENT.vote}
              infoLabel="How MMP gives you two votes">
              <InfoHeading accent={ACCENT.vote}>Two votes, two jobs</InfoHeading>
              <InfoText>
                Under MMP you cast two votes on the same paper. The party vote decides the share of Parliament&rsquo;s 120
                seats each party gets, and it is where most of your influence is: it sets the overall balance. The
                electorate vote picks the one MP for your local area.
              </InfoText>
              {/* The overhang is explained ONCE, in the (i) on the chamber
                   that shows both numbers, where it derives them from the data
                   instead of typing them. It was here as well, ~700px earlier,
                   in the same sentences against hard-coded figures (§1.3). */}
              <InfoText>
                <a href="/learn/mmp" style={{ color: ACCENT.vote, fontWeight: 800, textDecoration: 'none' }}>How MMP works in full</a>
              </InfoText>
            </ZoneHead>
            <TwoVotes />
            {/* The personal compass, here as well as on the homepage — it left
                the nav, and "which vote do I cast" is the question this section
                exists to answer, so its answer-machine belongs at the end of
                it. Same card as the homepage, deliberately: one object, seen
                twice, reads as the same tool rather than two features.

                The negative margin cancels the card's OWN section gutter. It is
                a <section> with clamp(40px,7vw,72px) / clamp(18px,5vw,36px) of
                padding, nested inside this container which already applies
                clamp(18px,5vw,36px) — so the card sat inset 37.5px from each
                edge at 375px while every other block on this page sits at
                18.75px, and added 80px of vertical padding on top of the 40px
                flex gap. §8, "see the edges dont align": measure the two
                things rather than nudging one. compass-cta.tsx is shared with
                the homepage, so the cancellation lives here rather than there. */}
            {/* The card carries its own section padding, so it is cancelled
                 here rather than doubled, on both axes, which lands the card
                 exactly on the column's edges.

                 It only works because the column above is 1080, the same
                 maxWidth compass-cta sets for itself. At the old 1000 the same
                 cancellation pulled the card 36px PAST each edge and it was the
                 one block on the page wider than the page; cancelling the
                 vertical only then left it 72px NARROWER than the tiles above
                 it, which read as an accident in the other direction. Change
                 one of these two numbers and you have to change the other. */}
            <div style={{ margin: 'calc(-1 * clamp(40px, 7vw, 72px)) calc(-1 * clamp(18px, 5vw, 36px))' }}>
              <CompassCta />
            </div>
          </section>

          {/* ── EVERY PARTY YOU CAN VOTE FOR ─────────────────────────────────
              The standfirst that sat here explained how to read a chart, where
              the list comes from and when it changes: three (i) sections, and
              it still said "each tile fills" for a component that has not been
              tiles since parties-contesting.tsx was rewritten to rows. */}
          <section id="parties" style={{ scrollMarginTop: 80 }}>
            {/* The heading used to read "Every party you can vote for", which
                 describes the LIST and says nothing about the bars and the
                 percentages that are the bulk of what is under it. A reader
                 met six rows of numbers with no statement anywhere above them
                 of what the numbers were. The eyebrow still carries who is on
                 the list; the heading now carries what is being measured
                 (§1.7 plain words, §4 name the year). */}
            <ZoneHead eyebrow="Who’s standing" title="Where the parties are polling for 2026" accent={ACCENT.parties}
              infoLabel="Which parties are listed and where the figures come from">
              <InfoHeading accent={ACCENT.parties}>Who is on this list</InfoHeading>
              <InfoText>
                Every party registered with the Electoral Commission to contest the party vote, by registration rather
                than by polling. The parliamentary parties come first, in seat order, then the rest by their most recent
                published figure. The final list is confirmed when nominations close
                {nominationsClose ? `, ${longDate(nominationsClose)}` : ''}.{' '}
                <a href="/party-inclusion" style={{ color: ACCENT.parties, fontWeight: 800, textDecoration: 'none' }}>How we decide who is included</a>
              </InfoText>
              <InfoHeading accent={ACCENT.parties}>Reading the bars</InfoHeading>
              <InfoText>
                Every bar is drawn on the same axis, so the lengths can be compared directly. What the dashed line is
                for is written under the bars themselves, where the line is.
              </InfoText>
              <InfoHeading accent={ACCENT.parties}>What a poll is not</InfoHeading>
              <InfoText>
                Others is the smaller registered parties that pollsters group together and do not report individually, so
                six parties here have no separate figure at all. That is a fact about polling coverage, not about the
                party. Politika reports polls. It does not predict the result.
              </InfoText>
            </ZoneHead>
            <PartiesContesting pop={pop} asAt={asAt} />
            {/* §2.6's exception, and the same move the bills block made: the way
                out of this block is a small outlined chip INSIDE it rather than
                a signpost of its own, because the detail behind it belongs to
                the bars directly above. */}
            <div style={{ marginTop: 16 }}>
              <PollSnapshot
                othersPct={pollOfPollsOthers(polls)}
                pollCount={polls.length}
                asAt={asAt}
                pollParties={POLL_PARTIES}
                polls={polls}
                preferredPM={PREFERRED_PM}
                turnout={TURNOUT_2023}
                enrolment={ENROLMENT_2023}
                participationSource={PARTICIPATION_SOURCE}
                pollsSource={POLLS_SOURCE}
              />
            </div>
          </section>

          {/* ── THE SEATS — one chamber, three ways to read it ───────────────── */}
          {/* Was two sections ~1600px apart, both drawing the same hemicycle:
              the 2023 Parliament here, the coalition builder there. The reader's
              questions run in sequence — what is there, what would the polls
              make it, what could govern — so they are tabs on one chart now,
              and comparing them is a tap instead of a scroll. */}
          <section id="seats" style={{ scrollMarginTop: 80 }}>
            <SeatChamber
              elected={base.results!}
              electedTotal={base.totalSeats!}
              electedYear={base.year}
              electedSlug={base.slug}
              projection={projection}
              projectionTotal={PROJECTION_SEATS}
              asAt={asAt}
              /* §1.4: the seat dots are a control on the homepage and were inert
                 here. A string rather than a handler, because this is a server
                 component and a function cannot cross that boundary — tapping a
                 seat scrolls to that party's row in #parties, which is the pick
                 this page has to offer. */
              pickScrollsToIdPrefix="party-row-"
            />
          </section>

          {/* ── CLOSEST RACES ───────────────────────────────────────────────── */}
          <section id="your-seat" style={{ scrollMarginTop: 80 }}>
            <ZoneHead eyebrow="Your electorate" title="Closest races" accent={ACCENT.seat}
              infoLabel="Why these five seats">
              <InfoHeading accent={ACCENT.seat}>Why these five</InfoHeading>
              <InfoText>
                Where {base.year} was closest is where {e.year} will likely be fought hardest. These were the five
                tightest results of the 72 electorates, by winning margin.
              </InfoText>
              <InfoHeading accent={ACCENT.seat}>What the labels mean</InfoHeading>
              <InfoText>
                Ultra-marginal is a {base.year} majority under 1,500 votes, marginal under 3,500, competitive under
                7,000. Every other electorate is on the full map, coloured on the same scale, down to light green for the
                safest.
              </InfoText>
            </ZoneHead>
            <ClosestRaces races={races} year={base.year} />
            {/* §2.6, one per section: the map WAS this block, 520px of Leaflet
                plus a 420px "Tap a seat" panel, arriving open. It is a
                destination now, and the sign is pulled out to the page gutter
                so it starts on the same vertical line as every other signpost
                on the site (§8, "buttons with triangles always on margin same
                place"). */}
            <div style={{ marginTop: 18, marginLeft: 'calc(-1 * clamp(18px, 5vw, 36px))' }}>
              <SignShape href="/battlegrounds" color={ACCENT.seat} fg="#fff">
                All 72 seats on the map
              </SignShape>
            </div>
          </section>

          {/* ── LEADERS & THE PRESS ──────────────────────────────────────────
              The heading used to switch on `debates.length > 0`, but that list
              is debate OR presser — and no video has ever carried the debate
              flag (debate season is Sep–Oct), so the page promised "Debates &
              leader interviews" while showing press standups. It is one heading
              now, matching the jump chip that points at it (§4), and what is
              actually in the rail is the line underneath. */}
          {railVideos.length > 0 && (
            <section id="debates" style={{ scrollMarginTop: 80 }}>
              <ZoneHead eyebrow="Watch" title="Leaders & the press" accent={ACCENT.watch}
                infoLabel="What is in this rail and what is missing"
                /* §1.5: say what is missing, in one line, rather than going
                   silent or burying it. The why is behind the (i). */
                note={hasRealDebates
                  ? `The latest ${railVideos.length} clips, debates included.`
                  : `The latest ${railVideos.length} clips. No debates broadcast yet.`}>
                <InfoHeading accent={ACCENT.watch}>Leaders in their own words</InfoHeading>
                <InfoText>
                  Press standups and campaign updates, straight from the parties&rsquo; and broadcasters&rsquo; own
                  channels, newest first.
                </InfoText>
                {!hasRealDebates && (
                  <>
                    <InfoHeading accent={ACCENT.watch}>Where the debates are</InfoHeading>
                    <InfoText>
                      The televised leaders&rsquo; debates are not scheduled until the campaign proper. They will appear
                      in this rail once they are broadcast, alongside the standups.
                    </InfoText>
                  </>
                )}
              </ZoneHead>
              <VideoSection videos={railVideos} hideHeading />
            </section>
          )}

        </div>
      </div>
    </div>
  )
}
