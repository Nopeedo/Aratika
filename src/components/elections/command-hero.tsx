'use client'

/**
 * CommandHero — the cinematic "command centre" header for the 2026 Election
 * Centre. A full-bleed dark band with a live ticking countdown (days:hrs:mins),
 * an at-a-glance stat row (days to go · seats for a majority · parties
 * contesting · poll-of-polls leader) and a jump-nav so the long page below is
 * navigable instead of an endless scroll. Numbers are factual/sourced — the
 * poll leader is the poll-of-polls average, labelled as such (non-partisan).
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, Users, Landmark } from 'lucide-react'
import { PARTY_COLORS, PARTY_NAMES } from '@/constants/parties'
import type { PartySlug } from '@/types'

const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const DISPLAY = 'var(--font-space-grotesk), system-ui, sans-serif'
const JADE = '#36e08a'

// Election day: Saturday 7 November 2026, local NZ (NZDT, UTC+13 in November).
const TARGET = new Date('2026-11-07T00:00:00+13:00').getTime()

interface JumpLink { label: string; href: string }
const JUMP: JumpLink[] = [
  { label: 'Your vote', href: '#your-vote' },
  { label: 'Your seat', href: '#your-seat' },
  { label: 'Debates', href: '#debates' },
  { label: 'Polls', href: '#polls' },
  { label: 'Who could govern', href: '#who-governs' },
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
    <section style={{ position: 'relative', overflow: 'hidden', background: '#0a0c11', color: '#fff' }}>
      {/* glow + dot-grid texture */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(900px 460px at 50% -10%, rgba(54,224,138,.22), transparent 62%), radial-gradient(700px 420px at 88% 120%, rgba(31,138,76,.16), transparent 60%)' }} />
      <div aria-hidden className="bg-dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.05 }} />

      <div style={{ position: 'relative', maxWidth: 1080, margin: '0 auto', padding: 'clamp(18px, 3vh, 26px) clamp(18px, 5vw, 40px) clamp(22px, 4vh, 34px)' }}>
        {/* Top row — back link + live eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 'clamp(16px, 3vh, 30px)' }}>
          <Link href="/elections" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.6)', textDecoration: 'none', fontFamily: MANROPE }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> All elections
          </Link>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.82)', fontFamily: MANROPE }}>
            <span className="live-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: JADE, display: 'inline-block' }} />
            Election Centre
          </span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 'clamp(26px, 4.4vw, 44px)', fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.05, fontFamily: MANROPE, margin: '0 0 4px', textAlign: 'center' }}>
          The 2026 General Election
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, color: 'rgba(255,255,255,.62)', fontFamily: MANROPE, fontSize: 'clamp(13px,1.6vw,15px)', fontWeight: 600, marginBottom: 'clamp(18px, 3vh, 28px)' }}>
          <CalendarDays style={{ width: 15, height: 15, color: JADE }} />
          Saturday 7 November 2026
        </div>

        {/* Big live countdown */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(6px, 1.6vw, 16px)', marginBottom: 6 }}>
          {units.map(([val, label], i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(6px, 1.6vw, 16px)' }}>
              <div style={{ textAlign: 'center', minWidth: 'clamp(52px, 12vw, 96px)' }}>
                <div style={{
                  fontFamily: DISPLAY, fontWeight: 700, fontSize: 'clamp(38px, 8.5vw, 78px)', lineHeight: 1,
                  color: '#fff', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em',
                  background: 'linear-gradient(180deg,#ffffff,#c7f6dd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  {val === null ? '––' : i === 0 ? val : String(val).padStart(2, '0')}
                </div>
                <div style={{ fontSize: 'clamp(10px,1.3vw,12px)', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', fontFamily: MANROPE, marginTop: 8 }}>{label}</div>
              </div>
              {i < units.length - 1 && (
                <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 'clamp(30px, 6vw, 58px)', lineHeight: 1, color: 'rgba(255,255,255,.22)', marginTop: 'clamp(2px,0.6vw,6px)' }}>:</div>
              )}
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.42)', fontFamily: MANROPE, margin: '2px 0 clamp(20px, 3.4vh, 30px)' }}>
          Final date &amp; advance-voting period confirmed by the Electoral Commission closer to the day.
        </p>

        {/* Stat band */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 'clamp(18px, 3vh, 26px)' }}>
          <Stat icon={<Landmark style={{ width: 15, height: 15, color: JADE }} />} value={String(majoritySeats)} label="seats for a majority" />
          <Stat icon={<Users style={{ width: 15, height: 15, color: JADE }} />} value={String(partiesContesting)} label="parties contesting" />
          {leader ? (
            <Stat
              icon={<span style={{ width: 11, height: 11, borderRadius: '50%', background: PARTY_COLORS[leader.slug].bg, display: 'inline-block', flexShrink: 0 }} />}
              value={`${PARTY_NAMES[leader.slug].short} ${leader.pct}%`}
              label={`poll-of-polls leader · ${pollCount} polls`}
            />
          ) : (
            <Stat icon={<Users style={{ width: 15, height: 15, color: JADE }} />} value="—" label="poll of polls" />
          )}
        </div>

        {/* Jump nav */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          {JUMP.map((j) => (
            <a key={j.href} href={j.href} style={{
              display: 'inline-flex', alignItems: 'center', fontSize: 13.5, fontWeight: 700, fontFamily: MANROPE,
              color: 'rgba(255,255,255,.9)', textDecoration: 'none', padding: '9px 16px', borderRadius: 999,
              background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)',
            }}>{j.label}</a>
          ))}
        </div>
      </div>
    </section>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 15px', borderRadius: 14, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, background: 'rgba(54,224,138,.1)', flexShrink: 0 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', fontFamily: MANROPE, lineHeight: 1.15 }}>{value}</div>
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.55)', fontFamily: MANROPE, marginTop: 1 }}>{label}</div>
      </div>
    </div>
  )
}
