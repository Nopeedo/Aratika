/**
 * UpcomingView — the 2026 Election Centre. Reprioritised for the everyday voter:
 * decide (compass + compare) → get ready → your electorate (battlegrounds + map)
 * → leaders & debates → the shape of the next Parliament → polls (demoted) →
 * parties → election-night scaffold. Polls are context, not the headline.
 */

import Link from 'next/link'
import { ArrowRight, ArrowUpRight, UserPlus, Vote, Clock, Info, CalendarX, MapPin, MessageSquare } from 'lucide-react'
import type { ElectionData } from '@/constants/elections-data'
import { BASELINE_ELECTION } from '@/constants/elections-data'
import { PARTY_NAMES, PARTY_COLORS, PARTY_ORDER } from '@/constants/parties'
import { getDebateVideos, getVideos } from '@/lib/news/videos'
import { getAllApprovedPositions } from '@/lib/positions/live'
import {
  pollOfPolls, seatProjection, RECENT_POLLS, POLL_PARTIES, PREFERRED_PM,
  TURNOUT_2023, ENROLMENT_2023, ENROLMENT_LIVE_URL, POLLS_AS_AT, POLLS_SOURCE,
} from '@/constants/polls-data'
import { CountdownBig } from './countdown-big'
import { PollSnapshot } from './poll-snapshot'
import { CoalitionExplorer } from './coalition-explorer'
import { SeatHemicycle } from './seat-hemicycle'
import { BattlegroundsTeaser } from '@/components/homepage/battlegrounds-teaser'
import { VideoSection } from '@/components/news/video-section'
import { BattlegroundsMap } from '@/components/battlegrounds/battlegrounds-map'
import { PolicyFaceoff } from './policy-faceoff'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const STEPS = [
  { icon: UserPlus, title: 'Enrol or check your details', body: 'You must be enrolled to vote. Enrol or update your address anytime at vote.nz.', href: 'https://vote.nz', cta: 'Enrol at vote.nz' },
  { icon: Vote, title: 'Understand your two votes', body: 'Under MMP you cast a party vote and an electorate vote. Learn exactly what each one does.', href: '/learn/mmp', cta: 'Learn about MMP' },
  { icon: Clock, title: 'Vote early or on the day', body: 'Advance voting usually opens about two weeks before election day. Dates confirmed closer to the time.', href: null, cta: null },
]

export async function UpcomingView({ e }: { e: ElectionData }) {
  const base = BASELINE_ELECTION
  const debates = await getDebateVideos(12)
  const railVideos = debates.length > 0 ? debates : await getVideos(18)
  const positions = await getAllApprovedPositions()
  const pop = pollOfPolls()
  const projection = seatProjection()
  const projectionTotal = projection.reduce((n, s) => n + s.seats, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
      <CountdownBig />

      {/* Key date */}
      <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12 }}>
        <CalendarX style={{ width: 17, height: 17, color: '#b45309', flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: '#92400e', fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
          <b>Election day is Saturday 7 November 2026.</b> The writ, enrolment deadlines and advance-voting period are
          set by the Electoral Commission closer to the election — we’ll publish them here as soon as they’re official.
        </p>
      </div>

      {/* ── DECIDE — an interactive head-to-head, not a link-out ──────────────── */}
      <PolicyFaceoff positions={positions} />

      {/* ── GET READY ────────────────────────────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 14px' }}>Get ready to vote</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {STEPS.map((s) => (
            <div key={s.title} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon style={{ width: 20, height: 20, color: JADE }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{s.title}</div>
              <div style={{ flex: 1, fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55 }}>{s.body}</div>
              {s.href && s.cta && (
                s.href.startsWith('http') ? (
                  <a href={s.href} target="_blank" rel="noopener noreferrer" style={cta}>{s.cta} <ArrowUpRight style={ic} /></a>
                ) : (
                  <Link href={s.href} style={cta}>{s.cta} <ArrowRight style={ic} /></Link>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── YOUR ELECTORATE — battlegrounds teaser + the marginality map ─────── */}
      <BattlegroundsTeaser />
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 18, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin style={{ width: 20, height: 20, color: JADE }} />
          </div>
          <div style={{ flex: 1, minWidth: 0, fontFamily: MANROPE }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: INK }}>The seats in play</div>
            <div style={{ fontSize: 13, color: SECONDARY, marginTop: 2 }}>Coloured by how close the 2023 contest was — hotter seats are the most likely to change hands. Tap one for the race.</div>
          </div>
          <Link href="/battlegrounds" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none', flexShrink: 0 }}>All battlegrounds <ArrowRight style={{ width: 14, height: 14 }} /></Link>
        </div>
        <div style={{ padding: 18 }}>
          <BattlegroundsMap embedded />
        </div>
      </div>

      {/* ── LEADERS & DEBATES ────────────────────────────────────────────────── */}
      {railVideos.length > 0 && (
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <MessageSquare style={{ width: 16, height: 16, color: JADE }} />
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE }}>{debates.length > 0 ? 'Debates & leader interviews' : 'Leaders & the press'}</span>
          </div>
          <VideoSection videos={railVideos} />
        </div>
      )}

      {/* ── THE SHAPE OF THE NEXT PARLIAMENT ─────────────────────────────────── */}
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

      {/* ── POLLS — condensed to a snapshot; detail behind an expander ────────── */}
      <div id="polls" style={{ scrollMarginTop: 80 }}>
        <PollSnapshot
          pop={pop}
          pollCount={RECENT_POLLS.length}
          asAt={POLLS_AS_AT}
          pollParties={POLL_PARTIES}
          polls={RECENT_POLLS}
          preferredPM={PREFERRED_PM}
          turnout={TURNOUT_2023}
          enrolment={ENROLMENT_2023}
          enrolmentUrl={ENROLMENT_LIVE_URL}
          pollsSource={POLLS_SOURCE}
        />
      </div>

      {/* ── WHO COULD GOVERN — interactive coalition builder ──────────────────── */}
      <CoalitionExplorer seats={projection} total={projectionTotal} asAt={POLLS_AS_AT} />

      {/* Parties likely contesting */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>Parties contesting</h2>
        <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 12px' }}>
          The parties currently in Parliament. Others may register to contest — the final list is confirmed when nominations close.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PARTY_ORDER.map((p) => (
            <Link key={p} href={`/parties/${p}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 999, border: `1px solid ${BORDER}`, background: '#fff', textDecoration: 'none', fontFamily: MANROPE }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: PARTY_COLORS[p].bg }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>{PARTY_NAMES[p].short}</span>
            </Link>
          ))}
        </div>
      </div>

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
          Enrolment & voting information: Electoral Commission (vote.nz) <ArrowUpRight style={{ width: 11, height: 11, display: 'inline', verticalAlign: '-1px' }} />
        </a>
      </div>
    </div>
  )
}

const ic: React.CSSProperties = { width: 14, height: 14 }
const cta: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }
