'use client'

/**
 * CommandHero — the header for the 2026 Election Centre.
 *
 * Redesigned to sit in the same world as the homepage rather than beside it:
 * the woven back2.jpg texture over warm cream, espresso headline, and a
 * countdown built from the same flip-tile visual as the homepage's day counter
 * (white→cream card, hairline fold, side notches). It previously used a black
 * cinematic band with gradient-filled digits, which read as a different product
 * the moment you arrived from the landing page.
 *
 * Keeps what worked: the live ticking clock, the at-a-glance stat row, and the
 * jump-nav so the long page below stays navigable. The jump chips now use the
 * same coloured-border language as the homepage policy chips and hub tiles.
 * Numbers stay factual/sourced — the poll leader is the poll-of-polls average,
 * labelled as such.
 */

import { BackLink } from '@/components/ui/back-link'
import { useEffect, useState } from 'react'
import { CalendarDays, Users, Landmark } from 'lucide-react'
import { PARTY_COLORS, PARTY_NAMES } from '@/constants/parties'
import type { PartySlug } from '@/types'

const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
// Shared with the homepage flip counter (days-flip-countdown.tsx) so the two
// counters read as the same object.
const ESPRESSO = '#2A1206', WARM = '#5b3d2a', SUB = '#6b6157'
const CARD_TOP = '#ffffff', CARD_BOT = '#f4f1ec', CARD_LINE = '#e6e2da'
const JADE = '#1F8A4C', JADE_DARK = '#176B3B'

// Election day: Saturday 7 November 2026, local NZ (NZDT, UTC+13 in November).
const TARGET = new Date('2026-11-07T00:00:00+13:00').getTime()

// Same palette family as the hub tiles / policy chips — deep 700-level inks.
const JUMP: { label: string; href: string; tint: string; ink: string }[] = [
  { label: 'Your vote',       href: '#your-vote',   tint: '#ecfeff', ink: '#0e7490' },
  { label: 'Your seat',       href: '#your-seat',   tint: '#fef1f2', ink: '#be123c' },
  { label: 'Debates',         href: '#debates',     tint: '#f5f3ff', ink: '#6d28d9' },
  { label: 'Polls',           href: '#polls',       tint: '#eff4ff', ink: '#1d4ed8' },
  { label: 'Who could govern', href: '#who-governs', tint: '#fffbeb', ink: '#b45309' },
]

export function CommandHero({ leader, pollCount, partiesContesting, majoritySeats }: {
  leader: { slug: PartySlug; pct: number } | null
  pollCount: number
  partiesContesting: number
  majoritySeats: number
}) {
  // Live countdown — computed on the client after mount to avoid hydration drift.
  const [t, setT] = useState<{ d: number; h: number; m: number; s: number } | null>(null)
  useEffect(() => {
    const tick = () => {
      const ms = Math.max(0, TARGET - Date.now())
      setT({
        d: Math.floor(ms / 86400000),
        h: Math.floor((ms / 3600000) % 24),
        m: Math.floor((ms / 60000) % 60),
        s: Math.floor((ms / 1000) % 60),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const units: [number | null, string][] = [
    [t?.d ?? null, 'days'], [t?.h ?? null, 'hrs'], [t?.m ?? null, 'mins'], [t?.s ?? null, 'secs'],
  ]

  return (
    // Deliberately transparent: the woven texture is painted once by the page
    // wrapper (UpcomingView) and shows through here. Giving this section its own
    // repeat-y copy would restart the tiling and leave a visible seam under the
    // hero — the same seam bug already fixed once on the homepage.
    <section style={{ position: 'relative' }}>
      <div style={{ position: 'relative', maxWidth: 1080, margin: '0 auto', padding: 'clamp(18px, 3vh, 26px) clamp(18px, 5vw, 40px) clamp(24px, 4vh, 36px)' }}>
        {/* Top row — back link + live eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 'clamp(14px, 3vh, 26px)' }}>
          <BackLink fallbackHref="/elections" label="All elections"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: WARM, textDecoration: 'none', fontFamily: MANROPE }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: JADE_DARK, fontFamily: MANROPE }}>
            <span className="live-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: JADE, display: 'inline-block' }} />
            Election Centre
          </span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 'clamp(27px, 4.6vw, 46px)', fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.05, fontFamily: MANROPE, color: ESPRESSO, margin: '0 0 6px', textAlign: 'center' }}>
          The 2026 General Election
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, color: WARM, fontFamily: MANROPE, fontSize: 'clamp(13px,1.6vw,15px)', fontWeight: 700, marginBottom: 'clamp(18px, 3vh, 28px)' }}>
          <CalendarDays style={{ width: 15, height: 15, color: JADE }} />
          Saturday 7 November 2026
        </div>

        {/* Live countdown — flip-tile look shared with the homepage counter */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 'clamp(6px, 1.4vw, 14px)', marginBottom: 8 }}>
          {units.map(([val, label], i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(6px, 1.4vw, 14px)' }}>
              <div style={{ textAlign: 'center' }}>
                <Tile text={val === null ? '––' : i === 0 ? String(val) : String(val).padStart(2, '0')} />
                <div style={{ fontSize: 'clamp(10px,1.3vw,12px)', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: WARM, fontFamily: MANROPE, marginTop: 9 }}>{label}</div>
              </div>
              {i < units.length - 1 && (
                <div aria-hidden style={{ fontWeight: 800, fontSize: 'clamp(24px, 5vw, 44px)', lineHeight: 1, color: 'rgba(42,18,6,.22)', marginTop: 'clamp(10px,2.4vw,22px)', fontFamily: MANROPE }}>:</div>
              )}
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: SUB, fontFamily: MANROPE, margin: '4px 0 clamp(20px, 3.4vh, 30px)' }}>
          Final date &amp; advance-voting period confirmed by the Electoral Commission closer to the day.
        </p>

        {/* Stat band */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 'clamp(18px, 3vh, 26px)' }}>
          <Stat icon={<Landmark style={{ width: 15, height: 15, color: JADE_DARK }} />} value={String(majoritySeats)} label="seats for a majority" />
          <Stat icon={<Users style={{ width: 15, height: 15, color: JADE_DARK }} />} value={String(partiesContesting)} label="parties contesting" />
          {leader ? (
            <Stat
              icon={<span style={{ width: 11, height: 11, borderRadius: '50%', background: PARTY_COLORS[leader.slug].bg, display: 'inline-block', flexShrink: 0 }} />}
              value={`${PARTY_NAMES[leader.slug].short} ${leader.pct}%`}
              label={`poll-of-polls leader · ${pollCount} polls`}
            />
          ) : (
            <Stat icon={<Users style={{ width: 15, height: 15, color: JADE_DARK }} />} value="—" label="poll of polls" />
          )}
        </div>

        {/* Jump nav — coloured chips, same language as the policy chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 9 }}>
          {JUMP.map((j) => (
            <a key={j.href} href={j.href} className="party-card" style={{
              display: 'inline-flex', alignItems: 'center', fontSize: 13.5, fontWeight: 800, fontFamily: MANROPE,
              color: ESPRESSO, textDecoration: 'none', padding: '9px 16px', borderRadius: 999,
              background: j.tint, border: `2px solid ${j.ink}`,
            }}>{j.label}</a>
          ))}
        </div>
      </div>
    </section>
  )
}

/** One countdown digit-pair, drawn as the homepage's flip card at rest. */
function Tile({ text }: { text: string }) {
  return (
    <div style={{
      position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 'clamp(56px, 12vw, 92px)', height: 'clamp(64px, 13vw, 96px)',
      borderRadius: 10, border: `1px solid ${CARD_LINE}`,
      background: `linear-gradient(180deg, ${CARD_TOP} 0 50%, ${CARD_BOT} 50% 100%)`,
      boxShadow: '0 3px 8px rgba(42,18,6,.10)',
      fontFamily: MANROPE, fontWeight: 800, color: ESPRESSO,
      fontSize: 'clamp(30px, 6.6vw, 56px)', letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums',
      padding: '0 clamp(8px,1.6vw,14px)',
    }}>
      {text}
      {/* fold line + side notches, matching the homepage tile */}
      <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'rgba(42,18,6,.18)', transform: 'translateY(-0.5px)' }} />
      <span aria-hidden style={{ position: 'absolute', left: -2, top: '50%', width: 4, height: 10, marginTop: -5, borderRadius: 2, background: '#cfc8bd' }} />
      <span aria-hidden style={{ position: 'absolute', right: -2, top: '50%', width: 4, height: 10, marginTop: -5, borderRadius: 2, background: '#cfc8bd' }} />
    </div>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 15px', borderRadius: 14, background: 'rgba(255,255,255,.86)', border: '1px solid #e6e2da', boxShadow: '0 1px 2px rgba(42,18,6,.04)' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, background: '#ecfdf5', flexShrink: 0 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: ESPRESSO, fontFamily: MANROPE, lineHeight: 1.15 }}>{value}</div>
        <div style={{ fontSize: 11.5, color: SUB, fontFamily: MANROPE, marginTop: 1 }}>{label}</div>
      </div>
    </div>
  )
}
