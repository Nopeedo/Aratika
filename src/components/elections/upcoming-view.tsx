/**
 * UpcomingView — the 2026 Election Centre. A warm command-centre hero, then the
 * body organised into zones with consistent headers (a jade eyebrow + title).
 *
 * Flow: the parties (fill tiles) → your electorate (closest races + marginality
 * map) → get ready (how your vote works) → debates & news → the Parliament
 * you're voting to change → election-night scaffold.
 *
 * The tiles lead because they answer "who's standing and where do they sit?" —
 * the question someone arriving at an election page actually has first.
 *
 * Deliberately shorter than it was. The poll-of-polls bar chart and the coalition
 * builder were removed once the party tiles started carrying the standings and
 * the 5% threshold — the tiles say the same thing in less space, and the page had
 * grown past six screens. The battlegrounds teaser and map were briefly removed
 * in that pass and reinstated — the closest races are the most election-relevant
 * thing on the page, and /battlegrounds is a destination rather than a substitute.
 */

import Link from 'next/link'
import { ArrowRight, ArrowUpRight, UserPlus, Clock, Info, MapPin } from 'lucide-react'
import type { ElectionData } from '@/constants/elections-data'
import { BASELINE_ELECTION } from '@/constants/elections-data'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import { getDebateVideos, getVideos } from '@/lib/news/videos'
import {
  pollOfPolls, pollOfPollsOthers, seatProjection, RECENT_POLLS, POLL_PARTIES, PREFERRED_PM,
  TURNOUT_2023, ENROLMENT_2023, ENROLMENT_LIVE_URL, POLLS_AS_AT, POLLS_SOURCE,
  PROJECTION_SEATS,
} from '@/constants/polls-data'
import { getAllApprovedPositions } from '@/lib/positions/live'
import { getPolls } from '@/lib/polls/live'
import { CommandHero } from './command-hero'
import { KeyDates } from './key-dates'
import { PollSnapshot } from './poll-snapshot'
import { CoalitionExplorer } from './coalition-explorer'
import { PolicyFaceoff } from './policy-faceoff'
import { TwoVotes } from './two-votes'
import { PartiesContesting } from './parties-contesting'
import { BattlegroundsTeaser } from '@/components/homepage/battlegrounds-teaser'
import { BattlegroundsMap } from '@/components/battlegrounds/battlegrounds-map'
import { SeatHemicycle } from './seat-hemicycle'
import { VideoSection } from '@/components/news/video-section'
import { BORDER, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

// Warm palette carried over from the homepage/hub so the Election Centre reads
// as the same product rather than a separate tool: espresso headings, warm body
// greys, warm hairlines — replacing the cold #0c0e12/#6b7078/#e9e7e2 set.

// Practical steps that sit alongside the "how your vote works" explainer.
// tint/ink follow the homepage policy-chip language (deep 700-level borders).
const STEPS = [
  { icon: UserPlus, title: 'Enrol or check your details', body: 'You must be enrolled to vote. Enrol or update your address anytime at vote.nz.', href: 'https://vote.nz', cta: 'Enrol at vote.nz', tint: '#ecfdf3', ink: '#15803d' },
  { icon: Clock, title: 'Vote early or on the day', body: 'Advance voting runs 26 October to 6 November, then election day is Saturday 7 November. Enrolment closes the day before advance voting starts.', href: null, cta: null, tint: '#ecfeff', ink: '#0e7490' },
]

export async function UpcomingView({ e }: { e: ElectionData }) {
  const base = BASELINE_ELECTION
  const debates = await getDebateVideos(12)
  const railVideos = debates.length > 0 ? debates : await getVideos(18)
  // Only a genuine debate clip may be called one.
  const hasRealDebates = debates.some((v) => v.debate)
  const polls = await getPolls()
  const pop = pollOfPolls(polls)
  // The three tools below were built for this page and never rendered on it.
  const projection = seatProjection(polls)
  const positions = await getAllApprovedPositions()
  // NZ local date — the calendar's deadlines are NZ deadlines.
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })

  return (
    // One continuous woven texture behind the whole page — hero included — so it
    // sits in the same world as the homepage and hub instead of on flat white.
    <div style={WOVEN_PAGE}>
      <CommandHero />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(30px, 5vh, 44px) clamp(18px, 5vw, 36px) 64px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(34px, 5vh, 48px)' }}>

          {/* ── WHEN — the only section where being wrong costs someone a vote ── */}
          <KeyDates today={today} />

          {/* ── PARTIES CONTESTING — the fill tiles carry the standings now ──── */}
          <section id="parties" style={{ scrollMarginTop: 80 }}>
            <ZoneHead eyebrow="Who’s standing" title="Parties contesting 2026"
              sub="Every party registered with the Electoral Commission to contest the party vote, grouped by whether they hold seats now rather than ranked. Each tile fills to that party’s current poll-of-polls share, with the 5% threshold marked. The final list is confirmed when nominations close."
              link={{ href: '/party-inclusion', label: 'Who’s included' }} />
            <PartiesContesting pop={pop} />
          </section>

          {/* ── WHERE THEY STAND — the condensed poll of polls ────────────────
              Built for this page ("PollSnapshot — the condensed poll-of-polls
              for the Election Centre") and rendered nowhere until now. It
              carries its own heading, so there is no ZoneHead here. */}
          <section id="polling" style={{ scrollMarginTop: 80 }}>
            <PollSnapshot
              pop={pop}
              othersPct={pollOfPollsOthers(polls)}
              pollCount={polls.length}
              asAt={POLLS_AS_AT}
              pollParties={POLL_PARTIES}
              polls={polls}
              preferredPM={PREFERRED_PM}
              turnout={TURNOUT_2023}
              enrolment={ENROLMENT_2023}
              enrolmentUrl={ENROLMENT_LIVE_URL}
              pollsSource={POLLS_SOURCE}
            />
          </section>

          {/* ── WHO COULD GOVERN — the interactive coalition builder ─────────── */}
          <section id="coalitions" style={{ scrollMarginTop: 80 }}>
            <CoalitionExplorer seats={projection} total={PROJECTION_SEATS} asAt={POLLS_AS_AT} />
          </section>

          {/* ── WHERE DO YOU SIT — react to stances, no sign-in ──────────────── */}
          {positions.length > 0 && (
            <section id="faceoff" style={{ scrollMarginTop: 80 }}>
              <PolicyFaceoff positions={positions} />
            </section>
          )}

          {/* ── YOUR ELECTORATE — the closest races, then the marginality map ── */}
          <section id="your-seat" style={{ scrollMarginTop: 80 }}>
            <ZoneHead eyebrow="Your electorate" title="The seats to watch in 2026"
              sub="Where 2023 was closest is where 2026 will likely be fought hardest. These were the five tightest results."
              link={{ href: '/battlegrounds', label: 'All battlegrounds' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* `embedded` drops the teaser's own eyebrow/title so this zone keeps
                  one header, and strips its standalone section padding. */}
              <BattlegroundsTeaser embedded />

              {/* The cards and the map were stacked with nothing joining them, so
                  the map read as a separate widget rather than the same five seats
                  shown in context. This states that they share one scale. */}
              <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '13px 16px' }}>
                <MapPin style={{ width: 17, height: 17, color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13.5, color: '#3f372f', fontFamily: MANROPE, margin: 0, lineHeight: 1.6 }}>
                  <b style={{ color: INK }}>Those five are the red seats on the map below.</b> It shows all 72 electorates
                  on the same scale, so the closer the 2023 result the hotter the colour, down to light green for the
                  safest. Tap any seat for its contest, not just the closest ones.
                </p>
              </div>

              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 18, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 2px rgba(42,18,6,.04)' }}>
                <div style={{ padding: 18 }}>
                  <BattlegroundsMap embedded />
                </div>
              </div>
            </div>
          </section>

          {/* ── GET READY — how your vote works ─────────────────────────────── */}
          <section id="your-vote" style={{ scrollMarginTop: 80 }}>
            <ZoneHead eyebrow="Get ready to vote" title="How your vote works"
              sub="You get two votes under MMP. Here’s what each one does." />
            <TwoVotes />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 14, marginTop: 14 }}>
              {STEPS.map((s) => (
                <div key={s.title} className="party-card" style={{ background: s.tint, border: `2px solid ${s.ink}`, borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <s.icon style={{ width: 24, height: 24, color: s.ink }} />
                  <div style={{ fontSize: 15.5, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{s.title}</div>
                  <div style={{ flex: 1, fontSize: 13, color: '#3f372f', fontFamily: MANROPE, lineHeight: 1.55 }}>{s.body}</div>
                  {s.href && s.cta && (
                    <a href={s.href} target="_blank" rel="noopener noreferrer" style={{ ...cta, color: s.ink }}>{s.cta} <ArrowUpRight style={ic} /></a>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── DEBATES / NEWS ───────────────────────────────────────────────── */}
          {railVideos.length > 0 && (
            <section id="debates" style={{ scrollMarginTop: 80 }}>
              {/* Title reflects what's actually in the rail. It used to switch on
                  `debates.length > 0`, but that list is debate OR presser — and no
                  video has ever carried the debate flag (debate season is Sep–Oct),
                  so the page promised "Debates & leader interviews" while showing
                  press standups. */}
              <ZoneHead eyebrow="Watch" title={hasRealDebates ? 'Debates & leader interviews' : 'Leaders & the press'}
                sub={hasRealDebates
                  ? 'Leaders in their own words. Debates and interviews as they’re published.'
                  : 'Leaders in their own words. Press standups and campaign updates for now, with debates appearing here once they’re broadcast.'} />
              <VideoSection videos={railVideos} hideHeading />
            </section>
          )}

          {/* ── THE CURRENT PARLIAMENT — the 2023 baseline ───────────────────── */}
          <section id="parliament" style={{ scrollMarginTop: 80 }}>
            {/* One header, not two: the panel used to carry its own title under a
                banner that described the poll-of-polls, which no longer sits in
                this zone. */}
            <ZoneHead eyebrow="Your baseline" title="The Parliament you’re voting to change"
              sub={`The current make-up, from the ${base.year} General Election. This is the starting point 2026 changes.`}
              link={{ href: `/elections/${base.slug}`, label: `Full ${base.year} results` }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 18, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 2px rgba(42,18,6,.04)' }}>
                <div style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 18, alignItems: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <SeatHemicycle results={base.results!} total={base.totalSeats!} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {base.results!.map((r) => (
                      <div key={r.party} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: MANROPE }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: PARTY_COLORS[r.party].bg }} />
                        <span style={{ fontSize: 13, color: INK, flex: 1 }}>{PARTY_NAMES[r.party].short}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: INK }}>{r.seats}</span>
                      </div>
                    ))}
                    {/* The zone header already links to the full results — one is enough. */}
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Election-night scaffold */}
          <div style={{ display: 'flex', gap: 10, padding: '16px 18px', background: SURFACE, border: `1px dashed ${TERTIARY}`, borderRadius: 14 }}>
            <Info style={{ width: 17, height: 17, color: SECONDARY, flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
              <b style={{ color: INK }}>On election night,</b> live results appear here as the Electoral Commission publishes them: party
              vote, seats, the new hemicycle, and a side-by-side comparison against {base.year}.
            </p>
          </div>

          {/* Source */}
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 14 }}>
            <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, textDecoration: 'none' }}>
              Enrolment &amp; voting information: Electoral Commission (vote.nz) <ArrowUpRight style={{ width: 11, height: 11, display: 'inline', verticalAlign: '-1px' }} />
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}

/** Consistent zone header — a jade eyebrow, a title, an optional one-liner, and an
 *  optional right-aligned link. Gives the long page a steady visual rhythm. */
function ZoneHead({ eyebrow, title, sub, link }: {
  eyebrow: string; title: string; sub?: string; link?: { href: string; label: string }
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, marginBottom: 7 }}>{eyebrow}</div>
        <h2 style={{ fontSize: 'clamp(21px, 3.6vw, 27px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.15 }}>{title}</h2>
        {sub && <p style={{ fontSize: 14.5, color: SECONDARY, fontFamily: MANROPE, margin: '8px 0 0', lineHeight: 1.55, maxWidth: 660 }}>{sub}</p>}
      </div>
      {link && (
        <Link href={link.href} style={{ ...cta, whiteSpace: 'nowrap', flexShrink: 0 }}>{link.label} <ArrowRight style={ic} /></Link>
      )}
    </div>
  )
}

const ic: React.CSSProperties = { width: 14, height: 14 }
const cta: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }
