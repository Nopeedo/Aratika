'use client'

/**
 * DefiningBills — "Bills that defined this term" section on /bills. Jade theme:
 * a featured spotlight (animated journey + count-up stats) for the flagged bill,
 * then a filterable at-a-glance grid. Curated, neutral; each card links to its
 * own breakdown at /bills/[slug]. See src/constants/defining-bills.ts.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Landmark, ArrowRight, Flag, Check, X } from 'lucide-react'
import { DEFINING_BILLS, DEFINING_BILLS_META, type DefiningBill } from '@/constants/defining-bills'

const CARD = '#ffffff', SOFT = '#eef3ec', INK = '#17231b', MUTED = '#667066', LINE = '#e4ebe2'
const ACCENT = '#1F8A4C', ACCENT_DK = '#14663a'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const STATUS: Record<DefiningBill['statusKind'], { label: string; fg: string; bg: string; bar: string; pct: number }> = {
  law:           { label: 'Now law',     fg: '#166638', bg: '#e0f3e7', bar: ACCENT,     pct: 100 },
  defeated:      { label: 'Defeated',    fg: '#a3251f', bg: '#f8e4e2', bar: '#c23b3b',  pct: 62 },
  'in-progress': { label: 'In progress', fg: '#92400e', bg: '#f8ecd4', bar: '#c07a12',  pct: 45 },
}

const FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'law', label: 'Now law' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'defeated', label: 'Defeated' },
]

export function DefiningBills() {
  const featured = DEFINING_BILLS.find((b) => b.featured)
  const [filter, setFilter] = useState('all')
  const shown = DEFINING_BILLS.filter((b) => filter === 'all' || b.statusKind === filter)

  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Landmark style={{ width: 16, height: 16, color: ACCENT_DK }} />
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: ACCENT_DK, fontFamily: MANROPE }}>Shaping the 2026 election</span>
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.025em', color: INK, fontFamily: MANROPE, margin: 0 }}>The bills that defined this term</h2>
      <p style={{ fontSize: 14.5, color: MUTED, fontFamily: MANROPE, margin: '6px 0 20px', maxWidth: 620, lineHeight: 1.55 }}>
        The legislation the 2026 election is being fought over — what each does, where it got to, and where the parties stand. Neutral, and sourced.
      </p>

      {featured && <Spotlight bill={featured} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', margin: '32px 0 16px' }}>
        <h3 style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: 0 }}>All {DEFINING_BILLS.length}, at a glance</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              fontSize: 12.5, fontWeight: 700, fontFamily: MANROPE, borderRadius: 999, padding: '7px 14px', cursor: 'pointer',
              color: filter === f.key ? '#fff' : INK, background: filter === f.key ? INK : CARD,
              border: `1px solid ${filter === f.key ? INK : LINE}`,
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {shown.map((b) => <BillCard key={b.slug} bill={b} />)}
      </div>

      <p style={{ fontSize: 11.5, color: '#8a8f86', fontFamily: MANROPE, margin: '16px 0 0', lineHeight: 1.5, maxWidth: 640 }}>
        {DEFINING_BILLS_META.note}
      </p>
    </section>
  )
}

// ─── Featured spotlight ──────────────────────────────────────────────────────

function Spotlight({ bill }: { bill: DefiningBill }) {
  const f = bill.featured!
  return (
    <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 20, padding: '26px 28px 24px', boxShadow: '0 1px 2px rgba(0,0,0,.03), 0 28px 56px -46px rgba(0,0,0,.4)' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#a3251f', background: '#f8e4e2', borderRadius: 999, padding: '4px 11px', fontFamily: MANROPE }}>
        <Flag style={{ width: 12, height: 12 }} /> {f.tagline}
      </span>
      <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: '-.025em', color: INK, fontFamily: MANROPE, margin: '13px 0 8px', lineHeight: 1.2 }}>{bill.title}</div>
      <p style={{ fontSize: 14.5, color: MUTED, fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 24px', maxWidth: 60 * 8 }}>{bill.what}</p>

      <p style={labelStyle}>Its journey through Parliament</p>
      <Journey nodes={f.journey} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 26, paddingTop: 22, borderTop: `1px solid ${LINE}` }}>
        {f.stats.map((s, i) => (
          <div key={i}>
            <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: '-.02em', color: ACCENT_DK, fontFamily: MANROPE, fontVariantNumeric: 'tabular-nums' }}>
              {typeof s.to === 'number' ? <CountUp to={s.to} suffix={s.suffix ?? ''} /> : s.text}
            </div>
            <div style={{ fontSize: 12, color: MUTED, fontFamily: MANROPE, lineHeight: 1.4, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
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

// ─── At-a-glance card ────────────────────────────────────────────────────────

function BillCard({ bill }: { bill: DefiningBill }) {
  const st = STATUS[bill.statusKind]
  return (
    <Link href={`/bills/${bill.slug}`} className="party-card" style={{ display: 'flex', flexDirection: 'column', background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: '16px 17px 14px', textDecoration: 'none' }}>
      <span style={{ alignSelf: 'flex-start', fontSize: 10.5, fontWeight: 800, color: st.fg, background: st.bg, borderRadius: 999, padding: '3px 10px', fontFamily: MANROPE }}>{st.label}</span>
      <div style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: '-.015em', color: INK, fontFamily: MANROPE, lineHeight: 1.25, margin: '10px 0 6px' }}>{bill.title}</div>
      <p style={{ fontSize: 12.5, color: MUTED, fontFamily: MANROPE, lineHeight: 1.5, margin: '0 0 12px', flex: 1 }}>{bill.what}</p>
      <div style={{ height: 4, background: LINE, borderRadius: 999, overflow: 'hidden', marginBottom: 12 }}>
        <span style={{ display: 'block', height: '100%', width: `${st.pct}%`, background: st.bar, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 11.5, fontWeight: 800, color: ACCENT_DK, fontFamily: MANROPE, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        Read the breakdown <ArrowRight style={{ width: 13, height: 13 }} />
      </span>
    </Link>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: MUTED, fontFamily: MANROPE, margin: '0 0 16px' }
