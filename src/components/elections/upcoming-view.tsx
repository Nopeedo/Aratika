/**
 * UpcomingView — the 2026 Election Centre. A cinematic command-centre hero, then
 * the body organised into clear zones with consistent headers (a jade eyebrow +
 * title), so the long page reads as distinct sections rather than one white
 * scroll. Flow: get ready (how your vote works) → your electorate → debates →
 * the state of the race (a dark zone echoing the hero: current Parliament, polls,
 * who could govern) → parties → election-night scaffold.
 */

import Link from 'next/link'
import { ArrowRight, ArrowUpRight, UserPlus, Clock, Info, MapPin, MessageSquare } from 'lucide-react'
import type { ElectionData } from '@/constants/elections-data'
import { BASELINE_ELECTION } from '@/constants/elections-data'
import { PARTY_NAMES, PARTY_COLORS, PARLIAMENTARY_PARTIES, NON_PARLIAMENTARY_CONTESTING } from '@/constants/parties'
import { getDebateVideos, getVideos } from '@/lib/news/videos'
import {
  pollOfPolls, pollOfPollsOthers, seatProjection, POLL_PARTIES, PREFERRED_PM,
  TURNOUT_2023, ENROLMENT_2023, ENROLMENT_LIVE_URL, POLLS_AS_AT, POLLS_SOURCE,
} from '@/constants/polls-data'
import { getPolls, pollsAsAt } from '@/lib/polls/live'
import { CommandHero } from './command-hero'
import { TwoVotes } from './two-votes'
import { PollSnapshot } from './poll-snapshot'
import { CoalitionExplorer } from './coalition-explorer'
import { PartiesContesting } from './parties-contesting'
import { SeatHemicycle } from './seat-hemicycle'
import { BattlegroundsTeaser } from '@/components/homepage/battlegrounds-teaser'
import { VideoSection } from '@/components/news/video-section'
import { BattlegroundsMap } from '@/components/battlegrounds/battlegrounds-map'

// Warm palette carried over from the homepage/hub so the Election Centre reads
// as the same product rather than a separate tool: espresso headings, warm body
// greys, warm hairlines — replacing the cold #0c0e12/#6b7078/#e9e7e2 set.
const INK = '#2A1206', SECONDARY = '#6b6157', TERTIARY = '#9a9186'
const BORDER = '#e6e2da', SURFACE = '#faf8f4', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

// Practical steps that sit alongside the "how your vote works" explainer.
// tint/ink follow the homepage policy-chip language (deep 700-level borders).
const STEPS = [
  { icon: UserPlus, title: 'Enrol or check your details', body: 'You must be enrolled to vote. Enrol or update your address anytime at vote.nz.', href: 'https://vote.nz', cta: 'Enrol at vote.nz', tint: '#ecfdf3', ink: '#15803d' },
  { icon: Clock, title: 'Vote early or on the day', body: 'Advance voting usually opens about two weeks before election day. Dates confirmed closer to the time.', href: null, cta: null, tint: '#ecfeff', ink: '#0e7490' },
]

export async function UpcomingView({ e }: { e: ElectionData }) {
  const base = BASELINE_ELECTION
  const debates = await getDebateVideos(12)
  const railVideos = debates.length > 0 ? debates : await getVideos(18)
  const polls = await getPolls()
  const pop = pollOfPolls(polls)
  const othersPct = pollOfPollsOthers(polls)
  const projection = seatProjection(polls)
  const projectionTotal = projection.reduce((n, s) => n + s.seats, 0)
  const asAt = pollsAsAt(polls) || POLLS_AS_AT
  const leader = [...pop].sort((a, b) => b.pct - a.pct)[0] ?? null
  const partiesContesting = PARLIAMENTARY_PARTIES.length + NON_PARLIAMENTARY_CONTESTING.length

  return (
    // One continuous woven texture behind the whole page — hero included — so it
    // sits in the same world as the homepage and hub instead of on flat white.
    <div style={{
      backgroundColor: '#f4f2ec',
      backgroundImage: 'url(/back2.jpg)',
      backgroundRepeat: 'repeat-y',
      backgroundSize: '100% auto',
      backgroundPosition: 'top center',
      minHeight: '100vh',
    }}>
      <CommandHero leader={leader} pollCount={polls.length} partiesContesting={partiesContesting} majoritySeats={61} />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(30px, 5vh, 44px) clamp(18px, 5vw, 36px) 64px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(34px, 5vh, 48px)' }}>

          {/* ── GET READY — how your vote works ─────────────────────────────── */}
          <section id="your-vote" style={{ scrollMarginTop: 80 }}>
            <ZoneHead eyebrow="Get ready to vote" title="How your vote works"
              sub="You get two votes under MMP. Here’s what each one does — then sort your enrolment." />
            <TwoVotes />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginTop: 14 }}>
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

          {/* ── YOUR ELECTORATE — battlegrounds teaser + the marginality map ── */}
          <section id="your-seat" style={{ scrollMarginTop: 80 }}>
            <ZoneHead eyebrow="Your electorate" title="The seats in play"
              sub="Coloured by how close the 2023 contest was — hotter seats are the most likely to change hands. Tap one for the race."
              link={{ href: '/battlegrounds', label: 'All battlegrounds' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <BattlegroundsTeaser />
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 18, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 2px rgba(42,18,6,.04)' }}>
                <div style={{ padding: 18 }}>
                  <BattlegroundsMap embedded />
                </div>
              </div>
            </div>
          </section>

          {/* ── DEBATES ──────────────────────────────────────────────────────── */}
          {railVideos.length > 0 && (
            <section id="debates" style={{ scrollMarginTop: 80 }}>
              <ZoneHead eyebrow="Watch" title={debates.length > 0 ? 'Debates & leader interviews' : 'Leaders & the press'}
                sub="Leaders in their own words — debates and interviews as they’re published." />
              <VideoSection videos={railVideos} />
            </section>
          )}

          {/* ── THE STATE OF THE RACE — a dark zone echoing the hero ─────────── */}
          <section>
            <DarkBanner eyebrow="The state of the race" title="Where the contest stands"
              sub={`A poll-of-polls average of ${polls.length} recent polls, as at ${asAt}. A snapshot of opinion — not a prediction.`} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 16 }}>
              {/* Current Parliament — the baseline */}
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 18, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 2px rgba(42,18,6,.04)' }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE }}>The Parliament you’re voting to change</div>
                  <div style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE }}>The current make-up, from the {base.year} General Election — your baseline for 2026.</div>
                </div>
                <div style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, alignItems: 'center' }}>
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
                    <Link href={`/elections/${base.slug}`} style={{ ...cta, marginTop: 6 }}>Full {base.year} results <ArrowRight style={ic} /></Link>
                  </div>
                </div>
              </div>

              {/* Polls */}
              <div id="polls" style={{ scrollMarginTop: 80 }}>
                <PollSnapshot
                  pop={pop}
                  othersPct={othersPct}
                  pollCount={polls.length}
                  asAt={asAt}
                  pollParties={POLL_PARTIES}
                  polls={polls}
                  preferredPM={PREFERRED_PM}
                  turnout={TURNOUT_2023}
                  enrolment={ENROLMENT_2023}
                  enrolmentUrl={ENROLMENT_LIVE_URL}
                  pollsSource={POLLS_SOURCE}
                />
              </div>

              {/* Who could govern */}
              <div id="who-governs" style={{ scrollMarginTop: 80 }}>
                <CoalitionExplorer seats={projection} total={projectionTotal} asAt={asAt} />
              </div>
            </div>
          </section>

          {/* ── PARTIES CONTESTING ───────────────────────────────────────────── */}
          <section>
            <ZoneHead eyebrow="Who’s standing" title="Parties contesting 2026"
              sub="Every party registered with the Electoral Commission to contest the party vote, grouped by whether they hold seats now — not ranked. Each tile fills to that party’s current poll-of-polls share, with the 5% threshold marked. The final list is confirmed when nominations close."
              link={{ href: '/party-inclusion', label: 'Who’s included' }} />
            <PartiesContesting pop={pop} />
          </section>

          {/* Election-night scaffold */}
          <div style={{ display: 'flex', gap: 10, padding: '16px 18px', background: SURFACE, border: `1px dashed ${TERTIARY}`, borderRadius: 14 }}>
            <Info style={{ width: 17, height: 17, color: SECONDARY, flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
              <b style={{ color: INK }}>On election night,</b> live results — party vote, seats, the new hemicycle, and a side-by-side
              comparison against {base.year} — will appear here as they’re published by the Electoral Commission.
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

/** A deep espresso zone-intro band, used to set the "state of the race" section
 *  apart from the light zones around it. Was near-black (#0a0c11) to echo the
 *  old cinematic hero; now that the hero is warm, espresso keeps the contrast
 *  without dropping a cold slab into the middle of a warm page. */
function DarkBanner({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 18, background: '#2A1206', color: '#fff', padding: 'clamp(20px, 3vw, 28px)' }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(560px 260px at 88% -20%, rgba(54,224,138,.22), transparent 60%)' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#36e08a', fontFamily: MANROPE, marginBottom: 7 }}>{eyebrow}</div>
        <h2 style={{ fontSize: 'clamp(22px, 3.8vw, 28px)', fontWeight: 800, letterSpacing: '-.01em', color: '#fff', fontFamily: MANROPE, margin: 0, lineHeight: 1.15 }}>{title}</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', fontFamily: MANROPE, margin: '8px 0 0', lineHeight: 1.55, maxWidth: 620 }}>{sub}</p>
      </div>
    </div>
  )
}

const ic: React.CSSProperties = { width: 14, height: 14 }
const cta: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }
