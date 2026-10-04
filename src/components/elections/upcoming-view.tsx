/**
 * UpcomingView — the 2026 Election Centre.
 *
 * Flow: when (the deadline) → how your vote works → who you can vote for →
 * the Parliament you are changing → your own seat → the leaders. These first
 * two swapped by request, then swapped back — this is the original order.
 * Every other section has kept its place throughout.
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

import Link from 'next/link'
import type { ElectionData } from '@/constants/elections-data'
import { BASELINE_ELECTION } from '@/constants/elections-data'
import { getDebateVideos, getVideos } from '@/lib/news/videos'
import {
  pollOfPolls, pollOfPollsOthers, seatProjection, pollsAsAt, POLL_PARTIES, PREFERRED_PM,
  TURNOUT_2023, ENROLMENT_2023, PARTICIPATION_SOURCE, POLLS_SOURCE,
  PROJECTION_SEATS,
} from '@/constants/polls-data'
import { getPolls } from '@/lib/polls/live'
import { getApprovedCandidatesBySlug } from '@/lib/candidates/live'
import { longDate, milestone } from '@/constants/electoral-calendar'
import { CommandHero } from './command-hero'
import { PollSnapshot } from './poll-snapshot'
import { SeatsWithTabs } from './seats-with-tabs'
import { TwoVotes } from './two-votes'
import { PartiesContesting } from './parties-contesting'
import { SeatMapSection } from './seat-map-section'
import { VideoSection } from '@/components/news/video-section'
import { ZoneHead } from './zone-head'
import { InfoHeading, InfoText } from '@/components/ui/info-button'
import { WOVEN_PAGE } from '@/constants/theme'
import { PARTY_COLORS } from '@/constants/parties'

// Warm palette carried over from the homepage/hub so the Election Centre reads
// as the same product rather than a separate tool: espresso headings, warm body
// greys, warm hairlines — replacing the cold #0c0e12/#6b7078/#e9e7e2 set.

/** Per-section accent, for the (i) bubbles only — the (i) takes the colour of
 *  the block it explains, which is §1.6's "a block takes the colour of
 *  whatever it is about". Was also the floating rail's dot colour
 *  (constants/election-sections.ts still carries `ink` for that), before the
 *  rail was removed by request; ELECTION_SECTIONS stays as the one list of
 *  sections in page order for the hero's jump-nav link row. */
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

// `e` is still passed by the route; nothing here reads it since Closest
// races (the last thing to use e.year) came off the page.
export async function UpcomingView(_props: { e: ElectionData }) {
  const base = BASELINE_ELECTION
  const debates = await getDebateVideos(VIDEO_COUNT)
  const railVideos = debates.length > 0 ? debates : await getVideos(VIDEO_COUNT)
  // Only a genuine debate clip may be called one.
  const hasRealDebates = debates.some((v) => v.debate)
  const polls = await getPolls()
  // One read for all 72 seats. The map is a client component and cannot await,
  // and fetching per seat would mean 72 identical reads of the same table.
  // 59 of 72 electorates have candidates; the seat card handles the other 13.
  const candidatesBySlug = await getApprovedCandidatesBySlug()
  const pop = pollOfPolls(polls)
  const projection = seatProjection(polls)
  // Derived from the polls actually being averaged, not the hand-maintained
  // POLLS_AS_AT constant — that read "9 July 2026" on 10 September while the
  // figures beside it were current to 3 September.
  const asAt = pollsAsAt(polls)
  // NZ local date — the calendar's deadlines are NZ deadlines.
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })
  // The date the party list stops changing. It was claimed in prose ("the final
  // list is confirmed when nominations close") with no date against it, on a
  // page that already reads the file the date is in.
  const nominationsClose = milestone('nominations-close-2026')?.date

  return (
    // One continuous woven texture behind the whole page — hero included — so it
    // sits in the same world as the homepage and hub instead of on flat white.
    <div style={WOVEN_PAGE}>
      <CommandHero today={today} />
      {/* SectionRail — the floating vertical dot menu, one dot per section
          with a chevron to collapse — removed by request. Component stays
          in the repo (demoted, not deleted) rather than deleted outright. */}

      {/* 1080 to match /bills and /parties. This page was the narrowest
           content column on the site at 1000, which is not a difference a
           reader can attribute to anything. */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(14px, 2.2vh, 20px) clamp(18px, 5vw, 36px) 64px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(34px, 5vh, 48px)' }}>

          {/* KeyDates (§ "Show all key dates" → the full 4-date timetable)
              removed by request. It had become pure duplication: the hero
              now carries four cards, one per milestone in KeyDates' own
              SHOWN list (Writ Day, the enrolment deadline, advance voting,
              election day), each already showing its date, its label and
              its own explanation. The toggle was a second way to see
              exactly those four facts a few hundred pixels below the first.
              Component stays in the repo, demoted rather than deleted. */}

          {/* ── HOW YOUR VOTE WORKS — first again, directly under the date
              cards, by request (it had briefly swapped with the parties
              section below, then swapped back). Two votes, what each one
              does, and why the party vote decides the shape of Parliament —
              the primer the parties section below assumes. Compass CTA
              ("Find where you stand") removed from the foot of this section
              by request. The homepage carries it, below the issue
              sections — verified, not assumed: this comment and the
              homepage's each used to claim the other page had it. */}
          <section id="your-vote" style={{ scrollMarginTop: 80 }}>
            {/* The explanation is the description now, by request, and
                shorter: it sat behind the (i) as three sentences ("Two votes,
                two jobs"). A first-time reader needs exactly this before the
                two tiles below make sense, so it isn't an (i) thing — §1.2's
                test is whether a returning reader would skip it, and at one
                sentence there's nothing to skip. The /learn/mmp link rides
                along at the end. */}
            <ZoneHead eyebrow="Get ready to vote" title="How your vote works" accent={ACCENT.vote}
              note={<>
                You get two votes on the same paper: one for a party, which decides how many seats it gets, and one for
                your local MP.{' '}
                <Link href="/learn/mmp" style={{ color: ACCENT.vote, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap' }}>How MMP works</Link>
              </>} />
            <TwoVotes />
          </section>

          {/* ── EVERY PARTY YOU CAN VOTE FOR — second again, under "How
              your vote works". Wrapped in a wash of the poll leader's own
              colour — the first real colour break on the page below the
              hero, and it is not a decoration picked to break up the cream:
              it is the fact the section states (who is ahead) drawn as the
              section's own ground, the same move §1.6 makes everywhere else
              on the site ("a block takes the colour of whatever it is
              about"). */}
          <div style={{
            background: `linear-gradient(180deg, ${PARTY_COLORS[pop[0]?.slug ?? 'national'].light} 0%, rgba(255,255,255,0) 100%)`,
            margin: '0 calc(-1 * clamp(18px, 5vw, 36px))', padding: '20px clamp(18px, 5vw, 36px) 0', borderRadius: 20,
          }}>
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
                than by polling. Parties now in Parliament come first, in seat order, followed by any party polling at
                or above the 5% threshold to enter it, then the rest by their most recent published figure. The final list is confirmed when nominations close
                {nominationsClose ? `, ${longDate(nominationsClose)}` : ''}.{' '}
                <a href="/party-inclusion" style={{ color: ACCENT.parties, fontWeight: 800, textDecoration: 'none' }}>How we decide who is included</a>
              </InfoText>
              <InfoHeading accent={ACCENT.parties}>Reading the bars</InfoHeading>
              <InfoText>
                Every bar is drawn on the same axis, so the lengths can be compared directly. The dashed line marks
                5%, the share of the party vote a party needs to enter Parliament without winning an electorate.
              </InfoText>
              <InfoHeading accent={ACCENT.parties}>What a poll is not</InfoHeading>
              <InfoText>
                Others is the smaller registered parties that pollsters group together and do not report individually, so
                six parties here have no separate figure at all. That is a fact about polling coverage, not about the
                party. Politika reports polls. It does not predict the result.
              </InfoText>
            </ZoneHead>
            <PartiesContesting pop={pop} asAt={asAt}>
            {/* ── THE SEATS — one chamber, three ways to read it ───────────────── */}
            {/* Was two sections ~1600px apart, both drawing the same hemicycle:
                the 2023 Parliament here, the coalition builder there. The reader's
                questions run in sequence — what is there, what would the polls
                make it, what could govern — so they are tabs on one chart now,
                and comparing them is a tap instead of a scroll.

                SeatsWithTabs, not a plain <section>+<SeatChamber> — the mode
                tabs moved OUT of SeatChamber and up to here, right after the
                party list (where "Show fewer" used to sit), by request. See
                seats-with-tabs.tsx for why that needed a small client
                wrapper: this file is a server component and can't hold the
                `mode` state the tabs and the chamber both need to share. */}
            <SeatsWithTabs
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
            </PartiesContesting>
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
          </div>

          {/* ── THE AREA YOU VOTE IN ───────────────────────────────────────── */}
          <section id="your-seat" style={{ scrollMarginTop: 80 }}>
            {/* The map, no longer in its own closed accordion card — by
                request, its heading, description and the map itself sit
                directly on the page now. See seat-map-section.tsx. Moved
                ABOVE Closest races by request too — it carries its own
                peer-sized heading ("The area you vote in"), so nothing here
                is left without one. */}
            <SeatMapSection candidatesBySlug={candidatesBySlug} />
            {/* "Closest races" (the five tightest 2023 seats) is gone, by
                request. The component is intact in closest-races.tsx; the
                map above still shades every seat and its 2023 view shows
                the margins. */}
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
