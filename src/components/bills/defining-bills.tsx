'use client'

/**
 * DefiningBills — the bills the 2026 election is being fought over.
 *
 * Presented as a tile carousel rather than a spotlight card plus a grid of
 * eight: you pick a bill and its detail swaps in below, the same interaction as
 * the homepage party tiles. That was the point of the change — eight stacked
 * cards plus a spotlight ran to several screens on a phone, and a reader had to
 * scroll past all of it to reach the tracker. One tile row plus one panel is a
 * fraction of the height and puts every bill one tap away.
 *
 * The old status filter chips are gone with it: with all eight tiles visible and
 * each carrying its status colour, filtering eight items added a control without
 * removing any work.
 *
 * Curated and neutral; every panel links to the bill's own sourced breakdown.
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Landmark, ArrowRight, Check, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { DEFINING_BILLS, DEFINING_BILLS_META, type DefiningBill } from '@/constants/defining-bills'
import { MANROPE } from '@/constants/theme'

const CARD = '#ffffff', INK = '#17231b', MUTED = '#667066', LINE = '#e4ebe2'
const ACCENT = '#1F8A4C', ACCENT_DK = '#14663a'
/** Matches the homepage party-panel swap so the two feel like one interaction. */
const FADE_MS = 200

/** Fade a hex to rgba — lets an unselected tile still carry its status colour as
 *  an outline, instead of the near-invisible neutral hairline it had. */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

const STATUS: Record<DefiningBill['statusKind'], { label: string; fg: string; bg: string; bar: string }> = {
  law:           { label: 'Now law',     fg: '#166638', bg: '#e0f3e7', bar: ACCENT },
  defeated:      { label: 'Defeated',    fg: '#a3251f', bg: '#f8e4e2', bar: '#c23b3b' },
  'in-progress': { label: 'In progress', fg: '#92400e', bg: '#f8ecd4', bar: '#c07a12' },
}

export function DefiningBills() {
  const first = DEFINING_BILLS.find((b) => b.featured) ?? DEFINING_BILLS[0]
  const [active, setActive] = useState(first.slug)
  const [fading, setFading] = useState(false)
  const railRef = useRef<HTMLDivElement>(null)

  const bill = DEFINING_BILLS.find((b) => b.slug === active) ?? first

  function select(slug: string) {
    if (slug === active) return
    // Fade the panel out, swap, fade back in — so the height change doesn't jump.
    setFading(true)
    setTimeout(() => { setActive(slug); setFading(false) }, FADE_MS)
  }

  const scroll = (dir: number) => railRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })

  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Landmark style={{ width: 16, height: 16, color: ACCENT_DK }} />
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: ACCENT_DK, fontFamily: MANROPE }}>Shaping the 2026 election</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.025em', color: INK, fontFamily: MANROPE, margin: 0 }}>The bills that defined this term</h2>
          <p style={{ fontSize: 14.5, color: MUTED, fontFamily: MANROPE, margin: '6px 0 0', maxWidth: 620, lineHeight: 1.55 }}>
            The legislation the 2026 election is being fought over. Tap a bill to see what it does, where it got to, and why it matters.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => scroll(-1)} aria-label="Scroll bills left" style={arrowBtn}><ChevronLeft style={{ width: 17, height: 17 }} /></button>
          <button onClick={() => scroll(1)} aria-label="Scroll bills right" style={arrowBtn}><ChevronRight style={{ width: 17, height: 17 }} /></button>
        </div>
      </div>

      {/* Tile rail — horizontally scrollable so eight bills cost one row on a
          phone instead of eight stacked cards. */}
      <div
        ref={railRef}
        style={{
          display: 'flex', gap: 10, overflowX: 'auto', scrollSnapType: 'x mandatory',
          padding: '16px 2px 6px', margin: '0 -2px',
          scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch',
        }}
      >
        {DEFINING_BILLS.map((b) => {
          const st = STATUS[b.statusKind]
          const on = b.slug === active
          return (
            <button
              key={b.slug}
              onClick={() => select(b.slug)}
              aria-pressed={on}
              style={{
                flex: '0 0 auto', width: 168, scrollSnapAlign: 'start', textAlign: 'left', cursor: 'pointer',
                background: CARD, borderRadius: 13, padding: '11px 13px 12px',
                // Unselected keeps the status colour at reduced strength, so each tile
                // reads as a distinct bill up front rather than a faint grey box.
                border: `2px solid ${on ? st.bar : hexToRgba(st.bar, 0.38)}`,
                boxShadow: on ? '0 6px 18px -10px rgba(0,0,0,.45)' : '0 1px 2px rgba(0,0,0,.03)',
                transform: on ? 'translateY(-2px)' : 'none',
                transition: 'border-color .2s ease, box-shadow .2s ease, transform .2s ease',
                fontFamily: MANROPE,
              }}
            >
              <span style={{ display: 'block', height: 3, borderRadius: 999, background: st.bar, opacity: on ? 1 : 0.6, marginBottom: 9, transition: 'opacity .2s ease' }} />
              <span style={{ display: 'block', fontSize: 10, fontWeight: 800, color: st.fg, fontFamily: MANROPE, marginBottom: 4 }}>{st.label}</span>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.28 }}>{b.title}</span>
            </button>
          )
        })}
      </div>

      {/* Panel — the selected bill */}
      <div style={{ opacity: fading ? 0 : 1, transition: `opacity ${FADE_MS}ms ease-in-out` }}>
        <BillPanel bill={bill} />
      </div>

      <p style={{ fontSize: 11.5, color: '#8a8f86', fontFamily: MANROPE, margin: '16px 0 0', lineHeight: 1.5, maxWidth: 640 }}>
        {DEFINING_BILLS_META.note}
      </p>
    </section>
  )
}

function BillPanel({ bill }: { bill: DefiningBill }) {
  const st = STATUS[bill.statusKind]
  const f = bill.featured
  return (
    <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 20, padding: 'clamp(20px, 3vw, 28px)', boxShadow: '0 1px 2px rgba(0,0,0,.03), 0 28px 56px -46px rgba(0,0,0,.4)' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: st.fg, background: st.bg, borderRadius: 999, padding: '4px 11px', fontFamily: MANROPE }}>
        {st.label}
      </span>
      <h3 style={{ fontSize: 'clamp(20px, 3.2vw, 25px)', fontWeight: 800, letterSpacing: '-.025em', color: INK, fontFamily: MANROPE, margin: '13px 0 8px', lineHeight: 1.2 }}>{bill.title}</h3>
      <p style={{ fontSize: 14.5, color: MUTED, fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 22px', maxWidth: 640 }}>{bill.what}</p>

      {/* The featured bill has a hand-built journey; every other bill has a dated
          timeline, so both get a progress read rather than only the spotlight. */}
      {f ? (
        <>
          <p style={labelStyle}>Its journey through Parliament</p>
          <Journey nodes={f.journey} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginTop: 26, paddingTop: 22, borderTop: `1px solid ${LINE}` }}>
            {f.stats.map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: '-.02em', color: ACCENT_DK, fontFamily: MANROPE, fontVariantNumeric: 'tabular-nums' }}>
                  {typeof s.to === 'number' ? <CountUp to={s.to} suffix={s.suffix ?? ''} /> : s.text}
                </div>
                <div style={{ fontSize: 12, color: MUTED, fontFamily: MANROPE, lineHeight: 1.4, marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </>
      ) : bill.timeline && bill.timeline.length > 0 ? (
        <>
          <p style={labelStyle}>How it progressed</p>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bill.timeline.slice(0, 4).map((t, i) => (
              <li key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: st.bar, flexShrink: 0, marginTop: 6 }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: INK, fontFamily: MANROPE, width: 108, flexShrink: 0 }}>{t.date}</span>
                <span style={{ fontSize: 13, color: MUTED, fontFamily: MANROPE, lineHeight: 1.5 }}>{t.event}</span>
              </li>
            ))}
          </ol>
          {bill.timeline.length > 4 && (
            <p style={{ fontSize: 12, color: '#8a8f86', fontFamily: MANROPE, margin: '10px 0 0' }}>
              +{bill.timeline.length - 4} more in the full breakdown
            </p>
          )}
        </>
      ) : null}

      <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${LINE}`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
        <div>
          <p style={labelStyle}>Why it matters</p>
          <p style={{ fontSize: 13.5, color: MUTED, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>{bill.why}</p>
        </div>
        <div>
          <p style={labelStyle}>Where it came from</p>
          <p style={{ fontSize: 13.5, color: MUTED, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>{bill.champion}</p>
        </div>
      </div>

      <Link href={`/bills/${bill.slug}`} style={{ marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: ACCENT_DK, fontFamily: MANROPE, textDecoration: 'none' }}>
        Read the full breakdown <ArrowRight style={{ width: 14, height: 14 }} />
      </Link>
    </div>
  )
}

function Journey({ nodes }: { nodes: NonNullable<DefiningBill['featured']>['journey'] }) {
  const p = useProgress(1500)
  const n = nodes.length
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 4 }}>
      <span style={{ position: 'absolute', left: 11, right: 11, top: 11, height: 2, background: LINE }} />
      <span style={{ position: 'absolute', left: 11, top: 11, height: 2, background: ACCENT, width: `calc((100% - 22px) * ${p})`, transition: 'width .2s linear' }} />
      {nodes.map((node, i) => {
        const lit = p >= (n > 1 ? i / (n - 1) : 1) - 0.001
        const isStop = node.state === 'stop'
        const beadBg = lit ? (isStop ? '#c23b3b' : ACCENT) : CARD
        const beadBorder = lit ? (isStop ? '#c23b3b' : ACCENT) : LINE
        return (
          <div key={i} style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, flex: 1, textAlign: 'center' }}>
            <span style={{ width: 24, height: 24, borderRadius: '50%', background: beadBg, border: `2px solid ${beadBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: lit ? 'scale(1)' : 'scale(.7)', opacity: lit ? 1 : 0.55, transition: 'all .3s ease' }}>
              {lit && (isStop ? <X style={{ width: 12, height: 12, color: '#fff' }} /> : <Check style={{ width: 12, height: 12, color: '#fff' }} />)}
            </span>
            <span style={{ fontSize: 10.5, fontWeight: lit ? 700 : 600, color: lit ? INK : MUTED, fontFamily: MANROPE, lineHeight: 1.3, maxWidth: '9ch', transition: 'color .3s ease' }}>{node.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function CountUp({ to, suffix }: { to: number; suffix: string }) {
  const p = useProgress(1300)
  return <>{Math.round(to * p).toLocaleString('en-NZ')}{suffix}</>
}

/** Eased 0→1 progress over `dur` ms. Time-based (not step count), so it always
 *  reaches 1 even when the tab is backgrounded and timers are throttled. */
function useProgress(dur: number) {
  const [p, setP] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => {
      const raw = Math.min((Date.now() - start) / dur, 1)
      setP(1 - Math.pow(1 - raw, 3))
      if (raw >= 1) clearInterval(id)
    }, 40)
    return () => clearInterval(id)
  }, [dur])
  return p
}

const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: MUTED, fontFamily: MANROPE, margin: '0 0 16px' }
const arrowBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34,
  borderRadius: 999, border: `1px solid ${LINE}`, background: CARD, color: INK, cursor: 'pointer',
}
