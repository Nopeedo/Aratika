'use client'

/**
 * DefiningBills — the term's most debated bills, since the 2023 election.
 *
 * Status pills, then tiles, then a panel — and nothing is expanded until you
 * ask for it. The section used to open with one bill's full detail already
 * showing, which is a screen and a half of one bill before a reader has picked
 * anything, and made the other eight look like footnotes to it.
 *
 * The pills filter by what happened to the bill (in progress / now law /
 * defeated), the same tap-to-filter as the issue chips on the comparison page,
 * and tapping the lit one clears it. The tiles are the bills themselves; tap
 * one and its detail opens beneath, tap it again and it closes.
 *
 * Curated and neutral; every panel links to the bill's own sourced breakdown.
 */

import { Fragment, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, X } from 'lucide-react'
import { DEFINING_BILLS, DEFINING_BILLS_META, type DefiningBill } from '@/constants/defining-bills'
import { InfoButton, InfoHeading, InfoText } from '@/components/ui/info-button'
import { INK, MANROPE } from '@/constants/theme'

const CARD = '#ffffff', MUTED = '#667066', LINE = '#e4ebe2'
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

/** Pill order: what is still live, then what passed, then what did not. */
const STATUS_ORDER: DefiningBill['statusKind'][] = ['in-progress', 'law', 'defeated']

export function DefiningBills() {
  // Nothing open to begin with, by design — see the note at the top.
  const [active, setActive] = useState<string | null>(null)
  const [status, setStatus] = useState<DefiningBill['statusKind'] | null>(null)
  const [fading, setFading] = useState(false)

  const shown = status ? DEFINING_BILLS.filter((b) => b.statusKind === status) : DEFINING_BILLS

  function select(slug: string) {
    // Tapping the open tile closes it, the same as the pills: a reader who
    // opened something by tapping expects the same tap to undo it.
    if (slug === active) { setActive(null); return }
    if (!active) { setActive(slug); return }
    // Swapping between bills fades, so the height change doesn't jump.
    setFading(true)
    setTimeout(() => { setActive(slug); setFading(false) }, FADE_MS)
  }

  function filter(kind: DefiningBill['statusKind']) {
    const next = kind === status ? null : kind
    setStatus(next)
    // Don't leave a panel open for a bill the filter has just hidden.
    if (active && next && DEFINING_BILLS.find((b) => b.slug === active)?.statusKind !== next) setActive(null)
  }

  return (
    <section style={{ marginBottom: 48 }}>
      {/* The "Since the 2023 election" eyebrow is under the page title now:
          it dates the whole page rather than this section alone. */}
      {/* No standfirst under the heading: it explained the tiles that are
          directly below and visibly tappable. The curation note that used to
          close the section is in the (i) — it is a caveat about how the list
          was chosen and how current it is, which is worth having and is not
          worth four lines under the bills themselves. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.025em', color: INK, fontFamily: MANROPE, margin: 0 }}>The most debated bills</h2>
        <InfoButton accent={ACCENT_DK} label="How these bills were chosen" size={24}>
          <InfoHeading accent={ACCENT_DK}>How these were chosen</InfoHeading>
          <InfoText>{DEFINING_BILLS_META.note}</InfoText>
        </InfoButton>
      </div>

      {/* Status pills. Same tap-to-filter as the issue chips on the comparison
          page, including tapping the lit one to clear it. Each carries its own
          status colour, so the pill and the tiles it filters to agree.

          "All" leads the row: tapping the lit pill already cleared the filter,
          but that is a thing you have to know, and a reader who has narrowed
          to one status needs somewhere obvious to go back to. It is the site's
          jade rather than a status colour, because it is not one of them. */}
      <div className="bills-status-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
        <Pill
          label="All"
          count={DEFINING_BILLS.length}
          on={status === null}
          fg={ACCENT_DK}
          bar={ACCENT}
          bg="#e0f3e7"
          onClick={() => { setStatus(null); }}
        />
        {STATUS_ORDER.map((kind) => {
          const st = STATUS[kind]
          return (
            <Pill
              key={kind}
              label={st.label}
              count={DEFINING_BILLS.filter((b) => b.statusKind === kind).length}
              on={status === kind}
              fg={st.fg}
              bar={st.bar}
              bg={st.bg}
              onClick={() => filter(kind)}
            />
          )
        })}
      </div>

      {/* Tiles wrap rather than scroll sideways: with the pills above doing the
          narrowing, a row never holds more than a handful, and a rail meant two
          arrow buttons and a swipe for something that now fits. */}
      <div
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(150px, 100%), 1fr))',
          gap: 8, padding: '12px 0 2px', alignItems: 'start',
        }}
      >
        {shown.map((b) => {
          const st = STATUS[b.statusKind]
          const on = b.slug === active
          return (
            <Fragment key={b.slug}>
            {/* Styled like the issue chips: the status colour as the FILL, a
                bold outline of the same hue, and the weight of that outline
                (2px to 3px) as the only thing that changes when one is open.
                No bar across the top: the fill says which status it is, and
                the bar was saying it a second time in a third shade. */}
            <button
              onClick={() => select(b.slug)}
              aria-expanded={on}
              style={{
                textAlign: 'left', cursor: 'pointer',
                background: st.bg, borderRadius: 11, padding: '7px 10px 8px',
                borderStyle: 'solid',
                borderWidth: on ? 3 : 2,
                borderColor: on ? st.fg : st.bar,
                transition: 'border-color .2s ease, border-width .2s ease',
                fontFamily: MANROPE,
              }}
            >
              <span style={{ display: 'block', fontSize: 9.5, fontWeight: 800, color: st.fg, fontFamily: MANROPE, marginBottom: 2 }}>{st.label}</span>
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.25 }}>{b.title}</span>
            </button>

            {/* The detail opens directly under the tile that was tapped
                rather than at the foot of the whole grid, so the answer is
                next to the question. It spans every column, which on a wider
                screen breaks the row at the tapped tile — the same way an
                accordion behaves, and the only arrangement in which "beneath
                that tile" is true at more than one column. */}
            {on && (
              <div style={{ gridColumn: '1 / -1', opacity: fading ? 0 : 1, transition: `opacity ${FADE_MS}ms ease-in-out` }}>
                <BillPanel bill={b} onClose={() => setActive(null)} />
              </div>
            )}
            </Fragment>
          )
        })}
      </div>

    </section>
  )
}

/** One filter pill.
 *
 *  The BUTTON is only the tap target; the span inside is the pill. globals.css
 *  gives every button a 44px minimum on a phone (a deliberate tap-target rule)
 *  and the chip row this matches is made of links, so a button styled as a pill
 *  came out half as tall again as the row it copies. Padding out and pulling
 *  the margin back keeps the finger target and hands the size back to CSS. */
function Pill({ label, count, on, fg, bar, bg, onClick }: {
  label: string
  count: number
  on: boolean
  fg: string
  bar: string
  bg: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      style={{
        display: 'inline-flex', padding: '8px 0', margin: '-8px 0',
        background: 'none', border: 'none', cursor: 'pointer',
      }}
    >
      <span
        className="status-pill"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          borderRadius: 999,
          background: on ? bg : CARD,
          border: `2px solid ${on ? bar : hexToRgba(bar, 0.34)}`,
          color: fg, fontFamily: MANROPE, fontWeight: 800,
          transition: 'background-color .2s ease, border-color .2s ease',
        }}
      >
        {label}
        <span style={{ fontWeight: 700, opacity: .75 }}>{count}</span>
      </span>
    </button>
  )
}

function BillPanel({ bill, onClose }: { bill: DefiningBill; onClose: () => void }) {
  const st = STATUS[bill.statusKind]
  const f = bill.featured
  return (
    <div className="bill-panel" style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 20, padding: 'clamp(20px, 3vw, 28px)', boxShadow: '0 1px 2px rgba(0,0,0,.03), 0 28px 56px -46px rgba(0,0,0,.4)' }}>
      {/* Shipped with the component, and mounted for EVERY panel: it carries
          the phone sizing for the whole card, not just the dated timeline it
          started as. It used to render inside the timeline branch, so the
          featured bill — the one with the journey and the big figures, and
          the tallest card of the lot — never received any of it. */}
      <style dangerouslySetInnerHTML={{ __html: TIMELINE_CSS }} />
      {/* Badge left, close right: the tile that opened this is above and can
          close it again, but a reader who has scrolled the panel's length
          should not have to go back up to find that out. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: st.fg, background: st.bg, borderRadius: 999, padding: '4px 11px', fontFamily: MANROPE }}>
          {st.label}
        </span>
        <button type="button" onClick={onClose} aria-label="Close this bill" style={{ background: 'none', border: 'none', padding: 6, margin: -6, cursor: 'pointer', color: MUTED, display: 'inline-flex', flexShrink: 0 }}>
          <X style={{ width: 17, height: 17 }} />
        </button>
      </div>
      <h3 className="bill-panel-title" style={{ fontSize: 'clamp(20px, 3.2vw, 25px)', fontWeight: 800, letterSpacing: '-.025em', color: INK, fontFamily: MANROPE, margin: '13px 0 8px', lineHeight: 1.2 }}>{bill.title}</h3>
      <p className="bill-panel-what" style={{ fontSize: 14.5, color: MUTED, fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 22px', maxWidth: 640 }}>{bill.what}</p>

      {/* The featured bill has a hand-built journey; every other bill has a dated
          timeline, so both get a progress read rather than only the spotlight. */}
      {f ? (
        <>
          <p className="bill-panel-label" style={labelStyle}>Its journey through Parliament</p>
          <Journey nodes={f.journey} />
          <div className="bill-panel-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap: 14, marginTop: 26, paddingTop: 22, borderTop: `1px solid ${LINE}` }}>
            {f.stats.map((s, i) => (
              <div key={i}>
                <div className="bill-panel-stat-n" style={{ fontSize: 25, fontWeight: 800, letterSpacing: '-.02em', color: ACCENT_DK, fontFamily: MANROPE, fontVariantNumeric: 'tabular-nums' }}>
                  {typeof s.to === 'number' ? <CountUp to={s.to} suffix={s.suffix ?? ''} /> : s.text}
                </div>
                <div className="bill-panel-stat-l" style={{ fontSize: 12, color: MUTED, fontFamily: MANROPE, lineHeight: 1.4, marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </>
      ) : bill.timeline && bill.timeline.length > 0 ? (
        <>
          <p className="bill-panel-label" style={labelStyle}>How it progressed</p>
          {/* The date sits in a fixed 108px column beside the event. On a phone
              that left the event about 200px to wrap in, so a one-line note
              like "Government drops the plan for three ministers to have the
              final say" ran to five ragged lines. Under 760px the date moves
              above the event and the text gets the full card width. */}
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bill.timeline.slice(0, 4).map((t, i) => (
              <li key={i} className="bill-tl-row">
                <span className="bill-tl-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: st.bar }} />
                <span className="bill-tl-date" style={{ fontSize: 12, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{t.date}</span>
                <span className="bill-tl-event" style={{ fontSize: 13, color: MUTED, fontFamily: MANROPE, lineHeight: 1.5 }}>{t.event}</span>
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

      <div className="bill-panel-foot" style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${LINE}`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 18 }}>
        <div>
          <p className="bill-panel-label" style={labelStyle}>Why it matters</p>
          <p style={{ fontSize: 13.5, color: MUTED, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>{bill.why}</p>
        </div>
        <div>
          <p className="bill-panel-label" style={labelStyle}>Where it came from</p>
          <p style={{ fontSize: 13.5, color: MUTED, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>{bill.champion}</p>
        </div>
      </div>

      <Link className="bill-panel-more" href={`/bills/${bill.slug}`} style={{ marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: ACCENT_DK, fontFamily: MANROPE, textDecoration: 'none' }}>
        Read the full breakdown <ArrowRight style={{ width: 14, height: 14 }} />
      </Link>
    </div>
  )
}

function Journey({ nodes }: { nodes: NonNullable<DefiningBill['featured']>['journey'] }) {
  const p = useProgress(1500)
  const n = nodes.length
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 4, ['--bill-journey-p' as string]: String(p) } as React.CSSProperties}>
      <span className="bill-journey-rail" style={{ position: 'absolute', left: 11, right: 11, top: 11, height: 2, background: LINE }} />
      <span className="bill-journey-fill" style={{ position: 'absolute', left: 11, top: 11, height: 2, background: ACCENT, width: `calc((100% - 22px) * ${p})`, transition: 'width .2s linear' }} />
      {nodes.map((node, i) => {
        const lit = p >= (n > 1 ? i / (n - 1) : 1) - 0.001
        const isStop = node.state === 'stop'
        const beadBg = lit ? (isStop ? '#c23b3b' : ACCENT) : CARD
        const beadBorder = lit ? (isStop ? '#c23b3b' : ACCENT) : LINE
        return (
          <div key={i} className="bill-journey-node" style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, flex: 1, textAlign: 'center' }}>
            <span className="bill-journey-bead" style={{ width: 24, height: 24, borderRadius: '50%', background: beadBg, border: `2px solid ${beadBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: lit ? 'scale(1)' : 'scale(.7)', opacity: lit ? 1 : 0.55, transition: 'all .3s ease' }}>
              {lit && (isStop ? <X style={{ width: 12, height: 12, color: '#fff' }} /> : <Check style={{ width: 12, height: 12, color: '#fff' }} />)}
            </span>
            <span className="bill-journey-label" style={{ fontSize: 10.5, fontWeight: lit ? 700 : 600, color: lit ? INK : MUTED, fontFamily: MANROPE, lineHeight: 1.3, maxWidth: '9ch', transition: 'color .3s ease' }}>{node.label}</span>
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

/* Date beside the event on desktop, above it on a phone. Shipped with the
   component so the rules and the class names can't arrive a build apart — the
   date's column width is set here, not inline, precisely so the media query can
   drop it. */
const TIMELINE_CSS = `
/* Compacting for phones, the same treatment the coverage matrix got: the card
   was ~900px tall before the first stat, mostly padding and display type sized
   for a desktop column. Every number here is a size REDUCTION, never a new
   layout — the card reads the same, it just stops spending a screen and a half
   saying it. Inline styles set the desktop sizes, so these have to be a media
   query in a stylesheet to win. */
@media (max-width: 600px) {
  .bill-panel { padding: 14px !important; border-radius: 16px !important; }
  .bill-panel-title { font-size: 19px !important; margin: 10px 0 6px !important; }
  .bill-panel-what { font-size: 13px !important; line-height: 1.5 !important; margin-bottom: 14px !important; }
  .bill-panel-label { font-size: 10px !important; margin-bottom: 10px !important; letter-spacing: .07em !important; }
  /* Two up rather than one per row: "300,000+" and "90%" are short, and a
     column each turned four figures into four full-width blocks. */
  .bill-panel-stats { grid-template-columns: 1fr 1fr !important; gap: 10px !important; margin-top: 14px !important; padding-top: 12px !important; }
  .bill-panel-stat-n { font-size: 19px !important; }
  .bill-panel-stat-l { font-size: 11px !important; line-height: 1.3 !important; }
  .bill-panel-foot { margin-top: 14px !important; padding-top: 12px !important; gap: 12px !important; }
  .bill-panel-foot p:last-child { font-size: 12.5px !important; line-height: 1.5 !important; }
  .bill-panel-more { margin-top: 14px !important; font-size: 12.5px !important; }
  .bill-journey-node { gap: 6px !important; }
  .bill-journey-bead { width: 18px !important; height: 18px !important; }
  .bill-journey-bead svg { width: 9px !important; height: 9px !important; }
  .bill-journey-label { font-size: 9.5px !important; max-width: 8ch !important; }
  /* The rail is positioned against the bead's centre, so it moves with it:
     half of 18 is 9, not 11. */
  .bill-journey-rail { left: 9px !important; right: 9px !important; top: 8px !important; }
  .bill-journey-fill { left: 9px !important; top: 8px !important; width: calc((100% - 18px) * var(--bill-journey-p, 0)) !important; }
}

.bill-tl-row { display: flex; gap: 11px; align-items: flex-start; }
.bill-tl-dot { flex-shrink: 0; margin-top: 6px; }
.bill-tl-date { width: 108px; flex-shrink: 0; }
@media (max-width: 760px) {
  .bill-tl-row { display: grid; grid-template-columns: 8px 1fr; column-gap: 11px; row-gap: 2px; align-items: start; }
  .bill-tl-dot { grid-column: 1; grid-row: 1; align-self: start; }
  .bill-tl-date { grid-column: 2; grid-row: 1; width: auto; }
  .bill-tl-event { grid-column: 2; grid-row: 2; }
}
`
