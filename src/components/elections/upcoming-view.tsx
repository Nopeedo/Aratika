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
import { SeatHemicycle } from './seat-hemicycle'
import { BattlegroundsTeaser } from '@/components/homepage/battlegrounds-teaser'
import { VideoSection } from '@/components/news/video-section'
import { BattlegroundsMap } from '@/components/battlegrounds/battlegrounds-map'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

// Practical steps that sit alongside the "how your vote works" explainer.
const STEPS = [
  { icon: UserPlus, title: 'Enrol or check your details', body: 'You must be enrolled to vote. Enrol or update your address anytime at vote.nz.', href: 'https://vote.nz', cta: 'Enrol at vote.nz' },
  { icon: Clock, title: 'Vote early or on the day', body: 'Advance voting usually opens about two weeks before election day. Dates confirmed closer to the time.', href: null, cta: null },
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
    <div style={{ background: '#fff', minHeight: '100vh' }}>
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
                <div key={s.title} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <s.icon style={{ width: 20, height: 20, color: JADE }} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{s.title}</div>
                  <div style={{ flex: 1, fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55 }}>{s.body}</div>
                  {s.href && s.cta && (
                    <a href={s.href} target="_blank" rel="noopener noreferrer" style={cta}>{s.cta} <ArrowUpRight style={ic} /></a>
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
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 18, overflow: 'hidden' }}>
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
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 18, overflow: 'hidden' }}>
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
              sub="Every party registered with the Electoral Commission to contest the party vote — grouped by whether they hold seats now, not ranked. The final list is confirmed when nominations close."
              link={{ href: '/party-inclusion', label: 'Who’s included' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'In Parliament', parties: PARLIAMENTARY_PARTIES },
                { label: 'Also registered to contest', parties: NON_PARLIAMENTARY_CONTESTING },
              ].map((grp) => (
                <div key={grp.label}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 8 }}>{grp.label}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {grp.parties.map((p) => (
                      <Link key={p} href={`/parties/${p}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 999, border: `1px solid ${BORDER}`, background: '#fff', textDecoration: 'none', fontFamily: MANROPE }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: PARTY_COLORS[p].bg }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>{PARTY_NAMES[p].short}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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

/** A dark zone-intro band that echoes the command-centre hero, used to set the
 *  "state of the race" section apart from the light zones around it. */
function DarkBanner({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 18, background: '#0a0c11', color: '#fff', padding: 'clamp(20px, 3vw, 28px)' }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(560px 260px at 88% -20%, rgba(54,224,138,.2), transparent 60%)' }} />
      <div aria-hidden className="bg-dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.05 }} />
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
