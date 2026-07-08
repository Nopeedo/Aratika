/**
 * ElectionAnchor — the Election Centre's homepage presence (Concept C: hero-level
 * anchor). Placed right after the hero/party tiles, before everything else, so
 * it reads as the site's central feature. Four tappable stat tiles give an
 * instant "state of the race" read — countdown, leading party (poll of polls),
 * seat estimate vs the 61-seat majority, and preferred PM — each sourced and
 * dated, then one clear CTA into the full Election Centre. Server component;
 * the countdown number itself is client-rendered (see ElectionCountdown/CountdownBig
 * pattern) to avoid a hydration mismatch, but here we keep the anchor static and
 * let the day-count fill in in a small client island.
 */

import Link from 'next/link'
import { Vote, ArrowRight, Radio } from 'lucide-react'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import { pollOfPolls, seatProjection, MAJORITY_SEATS, POLLS_AS_AT, PREFERRED_PM } from '@/constants/polls-data'
import { AnchorCountdownTile } from './election-anchor-countdown'
import { Term } from '@/components/glossary/term'

const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function ElectionAnchor() {
  const pop = pollOfPolls()
  const leader = pop[0]
  const seats = seatProjection()
  const leadingSeatBloc = seats.reduce((a, b) => (a.seats > b.seats ? a : b))
  const pmLeader = PREFERRED_PM.candidates.reduce((a, b) => (a.pct > b.pct ? a : b))

  return (
    <section style={{ background: '#0c0e12' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '44px clamp(18px, 5vw, 36px) 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#36e08a', fontFamily: MANROPE, marginBottom: 8 }}>
              <Vote style={{ width: 15, height: 15 }} /> 2026 Election Centre
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 4.5vw, 32px)', fontWeight: 800, letterSpacing: '-.02em', color: '#fff', fontFamily: MANROPE, margin: 0, lineHeight: 1.15 }}>
              The state of the race, right now
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'rgba(255,255,255,.55)', fontFamily: MANROPE }}>
            <Radio style={{ width: 13, height: 13, color: '#36e08a' }} /> Sourced, dated — as at {POLLS_AS_AT}
          </div>
        </div>

        {/* Four stat tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 12, marginBottom: 20 }}>
          <AnchorCountdownTile />

          <Link href="/elections/2026#polls" style={tileLink}>
            <div style={tileLabel}>Leading party · poll of polls</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: PARTY_COLORS[leader.slug].bg, flexShrink: 0 }} />
              <span style={tileValue}>{PARTY_NAMES[leader.slug].short} {leader.pct}%</span>
            </div>
          </Link>

          <Link href="/elections/2026#polls" style={tileLink}>
            <div style={tileLabel}>Seat estimate</div>
            <div style={tileValue}>{leadingSeatBloc.seats} <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.5)' }}>/ {MAJORITY_SEATS} to govern</span></div>
          </Link>

          <Link href="/elections/2026#polls" style={tileLink}>
            <div style={tileLabel}>Preferred PM</div>
            <div style={tileValue}>{pmLeader.name.split(' ').slice(-1)[0]} <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.6)' }}>{pmLeader.pct}%</span></div>
          </Link>
        </div>

        {/* Plain-language read of the numbers — so a newcomer takes meaning from them, not just digits. */}
        <p style={{ fontSize: 13.5, fontWeight: 500, color: 'rgba(255,255,255,.72)', fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 20px', maxWidth: 620 }}>
          <b style={{ color: '#fff', fontWeight: 700 }}>What this means:</b> {leadingSeatBloc.seats < MAJORITY_SEATS
            ? `on these polls no single party is near the ${MAJORITY_SEATS} seats needed to govern alone, so parties will likely have to team up to form a government.`
            : `a party is polling near the ${MAJORITY_SEATS} seats needed to govern.`} That&apos;s <Term name="MMP">MMP</Term> — your <Term name="Party vote">party vote</Term> decides how many seats each party gets.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <Link href="/elections/2026" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '12px 22px', borderRadius: 11, background: '#36e08a', color: '#0c0e12', fontSize: 14, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none' }}>
            Explore the Election Centre <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', fontFamily: MANROPE }}>
            Polls, seat projection, your electorate, and live results on the night.
          </span>
        </div>
      </div>
    </section>
  )
}

const tileLink: React.CSSProperties = {
  display: 'block', textDecoration: 'none', background: 'rgba(255,255,255,.05)',
  border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, padding: '16px 18px',
}
const tileLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.55)', fontFamily: MANROPE,
  textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8,
}
const tileValue: React.CSSProperties = {
  fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: MANROPE, lineHeight: 1.1,
}
