/**
 * UpcomingView — the 2026 Election Centre. Reprioritised for the everyday voter:
 * decide (compass + compare) → get ready → your electorate (battlegrounds + map)
 * → leaders & debates → the shape of the next Parliament → polls (demoted) →
 * parties → election-night scaffold. Polls are context, not the headline.
 */

import Link from 'next/link'
import { ArrowRight, ArrowUpRight, UserPlus, Vote, Clock, Info, CalendarX, Swords, Sparkles, Scale, MapPin, MessageSquare } from 'lucide-react'
import type { ElectionData } from '@/constants/elections-data'
import { BASELINE_ELECTION } from '@/constants/elections-data'
import { PARTY_NAMES, PARTY_COLORS, PARTY_ORDER } from '@/constants/parties'
import { getDebateVideos, getVideos } from '@/lib/news/videos'
import { CountdownBig } from './countdown-big'
import { PollTracker } from './poll-tracker'
import { SeatHemicycle } from './seat-hemicycle'
import { BattlegroundsTeaser } from '@/components/homepage/battlegrounds-teaser'
import { VideoSection } from '@/components/news/video-section'

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

      {/* ── DECIDE — the reason most people are here ─────────────────────────── */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
          <Sparkles style={{ width: 16, height: 16, color: JADE }} />
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE }}>Not sure who to vote for?</span>
        </div>
        <h2 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: '0 0 14px' }}>Start here — find your fit</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <Link href="/start" style={decideCard}>
            <div style={decideIcon}><Sparkles style={{ width: 22, height: 22, color: JADE }} /></div>
            <div style={{ fontSize: 16.5, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Take the 60-second compass</div>
            <div style={{ flex: 1, fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55 }}>Answer a few quick questions and see which parties line up with what matters to you — no sign-up, no score.</div>
            <span style={decideCta}>Start the compass <ArrowRight style={ic} /></span>
          </Link>
          <Link href="/compare" style={decideCard}>
            <div style={decideIcon}><Scale style={{ width: 22, height: 22, color: JADE }} /></div>
            <div style={{ fontSize: 16.5, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Compare the parties, side by side</div>
            <div style={{ flex: 1, fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55 }}>Pick an issue and see every party’s stance next to each other — summarised neutrally, with the sources.</div>
            <span style={decideCta}>Compare policies <ArrowRight style={ic} /></span>
          </Link>
        </div>
      </div>

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

      {/* ── YOUR ELECTORATE — battlegrounds + map ────────────────────────────── */}
      <BattlegroundsTeaser />
      <Link href="/map" style={{ textDecoration: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '18px 22px' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin style={{ width: 22, height: 22, color: JADE }} />
          </div>
          <div style={{ flex: 1, minWidth: 220, fontFamily: MANROPE }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: INK }}>Find your electorate</div>
            <div style={{ fontSize: 13, color: SECONDARY, marginTop: 2 }}>Search the interactive map to find your seat, your MP, and the 2026 race where you live.</div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, color: JADE, fontFamily: MANROPE }}>Open the map <ArrowRight style={{ width: 15, height: 15 }} /></span>
        </div>
      </Link>

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

      {/* ── POLLS — demoted to context ───────────────────────────────────────── */}
      <div id="polls" style={{ scrollMarginTop: 80 }}>
        <PollTracker />
      </div>

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
const decideCard: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 9, background: '#fff', border: `1.5px solid #cfe9d8`, borderRadius: 18, padding: '20px 22px', textDecoration: 'none' }
const decideIcon: React.CSSProperties = { width: 44, height: 44, borderRadius: 12, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }
const decideCta: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, color: JADE, fontFamily: MANROPE, marginTop: 2 }
