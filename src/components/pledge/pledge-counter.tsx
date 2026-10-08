'use client'

/**
 * PledgeCounter — "Will you vote?", the counter, and the moment after.
 *
 * WHAT THE NUMBER MEANS. It counts taps on this button. It is not a count of
 * enrolments or of votes, and the copy never implies otherwise: the Commission's
 * enrolment flow is a separate origin behind a bot challenge with no callback
 * and no API, so this site cannot learn what happened after someone leaves for
 * vote.nz. See migration 0021.
 *
 * THE ENROLMENT QUESTION COMES SECOND, on purpose. 90.77% of New Zealanders are
 * already enrolled (Commission, 30 September 2026), so leading with "are you
 * enrolled?" speaks to under a tenth of the country. The bigger gap is further
 * down: 829,396 people were enrolled in 2023 and did not vote. So the ask is
 * the vote, and enrolment is the follow-up for the minority who need it.
 *
 * "I don't know" is a real answer and gets its own button. You cannot see your
 * own roll entry without looking it up, and forcing a guess between yes and no
 * sends half of those people down the wrong path.
 *
 * Keyframes cannot live in an inline style object, so the animation ships as a
 * style tag with the component (§3.2), the same way the track control does.
 */

import * as React from 'react'
import { JADE, MANROPE } from '@/constants/theme'

const DEEP = '#0E3F26'
const MINT = '#8FD3AC'

type Enrolled = 'yes' | 'no' | 'unknown'

interface Totals { total: number; verified: number; goal: number; ok: boolean }

/** vote.nz's own enrol/update entry point. "No" and "I don't know" both go here:
 *  the page checks and updates as well as enrols. */
const VOTE_NZ = 'https://vote.nz/enrolling/enrol-or-update/enrol-or-update-online'

export function PledgeCounter({ source = 'homepage' }: { source?: string }) {
  const [totals, setTotals] = React.useState<Totals | null>(null)
  const [pledged, setPledged] = React.useState(false)
  const [position, setPosition] = React.useState<number | null>(null)
  const [enrolled, setEnrolled] = React.useState<Enrolled | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    let alive = true
    fetch('/api/pledge')
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return
        setTotals({ total: d.total ?? 0, verified: d.verified ?? 0, goal: d.goal ?? 100000, ok: !!d.ok })
        if (d.mine?.pledged) { setPledged(true); setPosition(d.total ?? null); setEnrolled(d.mine.enrolled ?? null) }
      })
      .catch(() => { if (alive) setTotals({ total: 0, verified: 0, goal: 100000, ok: false }) })
    return () => { alive = false }
  }, [])

  async function pledge() {
    if (busy) return
    setBusy(true); setFailed(false)
    try {
      const r = await fetch('/api/pledge', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ source }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'failed')
      setTotals((t) => ({ total: d.total, verified: d.verified, goal: d.goal, ok: t?.ok ?? true }))
      setPosition(d.position ?? d.total ?? null)
      setPledged(true)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  async function answer(value: Enrolled) {
    setEnrolled(value)
    // Fire and forget: the answer is useful to have and not worth blocking the
    // reader on, and the destination opens either way.
    fetch('/api/pledge', {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ enrolled: value }),
    }).catch(() => {})
    if (value !== 'yes') window.open(VOTE_NZ, '_blank', 'noopener,noreferrer')
  }

  // The CARD renders immediately; only the NUMBER waits for the fetch.
  //
  // Waiting for the count before rendering anything would make this a block
  // that appears after load and shoves the rest of the page down — the exact
  // layout shift this site was just fixed for. The ask needs no data, so it
  // paints with the first frame and the count slots into space already
  // reserved for it.
  //
  // The one case that still hides the card is an explicit failure: `ok: false`
  // means the pledges table is not there yet or Supabase is unreachable, so the
  // feature is not live and a button that would fail is worse than nothing.
  if (totals && !totals.ok) return null

  const goal = totals?.goal ?? 100000
  const shown = pledged ? (position ?? totals?.total ?? 0) : (totals?.total ?? 0)
  const pct = totals ? Math.min(100, Math.max(1.2, (totals.total / goal) * 100)) : 0

  return (
    <section style={{ background: 'transparent' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '8px clamp(18px, 5vw, 36px) 20px' }}>
        <div className={`pl-card${pledged ? ' go' : ''}`} style={{
          background: DEEP, borderRadius: 20, padding: 'clamp(28px, 5vw, 36px)',
          fontFamily: MANROPE, color: '#fff', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {pledged && <Burst />}

          {!pledged ? (
            <>
              <h2 style={{ fontSize: 'clamp(26px, 5vw, 34px)', fontWeight: 800, letterSpacing: '-.025em', margin: '0 0 20px', lineHeight: 1.15 }}>
                Will you pledge to vote?
              </h2>
              <button onClick={pledge} disabled={busy} className="pl-cta" style={{
                minHeight: 44, padding: '15px 38px', borderRadius: 13, border: 'none',
                background: '#fff', color: DEEP, fontFamily: MANROPE,
                fontSize: 18, fontWeight: 800, cursor: busy ? 'default' : 'pointer',
                opacity: busy ? 0.7 : 1,
              }}>
                {busy ? 'One moment' : 'Yes, I pledge'}
              </button>
              {failed && (
                <p style={{ fontSize: 13.5, color: '#ffd9c7', margin: '14px 0 0' }}>
                  That didn&rsquo;t save. Try once more.
                </p>
              )}
            </>
          ) : (
            <>
              <svg className="pl-ara" width="72" height="67" viewBox="0 0 28 26" aria-hidden="true" style={{ display: 'block', margin: '0 auto' }}>
                <g stroke={MINT} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 22 L14 16 L23 22" />
                  <path d="M5 15 L14 9 L23 15" />
                  <path d="M5 8 L14 2 L23 8" />
                </g>
              </svg>
              <div className="pl-after">
                <div style={{ fontSize: 'clamp(42px, 9vw, 58px)', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1, marginTop: 14, fontVariantNumeric: 'tabular-nums' }}>
                  {shown.toLocaleString('en-NZ')}
                </div>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,.7)', margin: '5px 0 0' }}>
                  of {goal.toLocaleString('en-NZ')}
                </p>
              </div>
            </>
          )}

          {/* The bar carries the collective number in both states. */}
          <div style={{ maxWidth: 380, margin: '24px auto 0' }}>
            <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,.18)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 5, background: MINT, transition: 'width .7s cubic-bezier(.2,.8,.2,1)' }} />
            </div>
            {!pledged && (
              /* minHeight holds the line before the count arrives, so nothing
                 below this card moves when it does. */
              <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,.92)', margin: '11px 0 0', minHeight: 22 }}>
                {totals ? (
                  <>
                    {totals.total.toLocaleString('en-NZ')}{' '}
                    <span style={{ color: 'rgba(255,255,255,.55)', fontWeight: 600 }}>
                      of {goal.toLocaleString('en-NZ')}
                    </span>
                  </>
                ) : null}
              </p>
            )}
          </div>

          {pledged && enrolled === null && (
            <div className="pl-after" style={{ marginTop: 26 }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,.9)', margin: '0 0 14px' }}>
                Are you enrolled?
              </p>
              <div style={{ display: 'flex', gap: 9, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => answer('yes')} style={solid}>Yes</button>
                <button onClick={() => answer('no')} style={ghost}>No, enrol me</button>
                <button onClick={() => answer('unknown')} style={ghost}>I don&rsquo;t know</button>
              </div>
              <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,.52)', margin: '14px 0 0' }}>
                Enrolment closes midnight, Sunday 25 October.
              </p>
            </div>
          )}

          {pledged && enrolled !== null && (
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.72)', margin: '22px 0 0', lineHeight: 1.55 }}>
              {enrolled === 'yes'
                ? 'Good. Now work out who you’re voting for.'
                : <>vote.nz is open in another tab. Enrolment closes <b style={{ color: '#fff' }}>midnight, Sunday 25 October</b>.</>}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

/** Rays with uneven length, reach and delay. Evenly spaced identical rays read
 *  as a mechanical starburst rather than something thrown. Deterministic, so a
 *  re-render never reshuffles it mid-animation. */
function Burst() {
  const rays = React.useMemo(() => Array.from({ length: 22 }, (_, i) => {
    const j = ((i * 37) % 11) / 11
    return {
      a: i * (360 / 22) + j * 6, len: 16 + j * 20,
      dist: 84 + j * 70, dur: 700 + j * 260, dl: j * 90,
    }
  }), [])
  return (
    <div className="pl-burst" aria-hidden>
      {rays.map((r, i) => (
        <span key={i} style={{
          ['--a' as string]: `${r.a}deg`, ['--len' as string]: `${r.len}px`,
          ['--dist' as string]: `${r.dist}px`, ['--dur' as string]: `${r.dur}ms`,
          ['--dl' as string]: `${r.dl}ms`,
        }} />
      ))}
      <i className="pl-ring" />
      <i className="pl-ring slow" />
    </div>
  )
}

const solid: React.CSSProperties = {
  minHeight: 44, padding: '12px 24px', borderRadius: 12, border: 'none',
  background: '#fff', color: DEEP, fontFamily: MANROPE, fontSize: 15, fontWeight: 800, cursor: 'pointer',
}
const ghost: React.CSSProperties = {
  minHeight: 44, padding: '12px 24px', borderRadius: 12,
  border: '1.5px solid rgba(255,255,255,.45)', background: 'transparent',
  color: '#fff', fontFamily: MANROPE, fontSize: 15, fontWeight: 800, cursor: 'pointer',
}

const CSS = `
.pl-card > *:not(.pl-burst) { position: relative; z-index: 1 }
.pl-cta:hover { background: ${MINT} }

.pl-burst { position: absolute; inset: 0; pointer-events: none; z-index: 0 }
.pl-burst span {
  position: absolute; left: 50%; top: 50%;
  width: 2.5px; height: var(--len, 24px); margin: -1px 0 0 -1.25px;
  border-radius: 2px; transform-origin: 50% 100%;
  background: linear-gradient(to top, rgba(143,211,172,0), ${MINT});
  transform: rotate(var(--a)) translateY(-8px) scaleY(.25); opacity: 0;
}
.pl-card.go .pl-burst span {
  animation: pl-ray var(--dur, 820ms) cubic-bezier(.12,.75,.25,1) var(--dl, 0ms) forwards;
}
@keyframes pl-ray {
  0%   { transform: rotate(var(--a)) translateY(-8px) scaleY(.25); opacity: 0 }
  14%  { opacity: 1 }
  65%  { opacity: .85 }
  100% { transform: rotate(var(--a)) translateY(calc(-1 * var(--dist, 110px))) scaleY(1.2); opacity: 0 }
}
.pl-ring {
  position: absolute; left: 50%; top: 50%; width: 44px; height: 44px;
  margin: -22px 0 0 -22px; border-radius: 50%; border: 2px solid ${MINT};
  opacity: 0; transform: scale(.3);
}
.pl-card.go .pl-ring { animation: pl-ring 900ms cubic-bezier(.1,.8,.3,1) forwards }
.pl-card.go .pl-ring.slow { animation-duration: 1150ms; animation-delay: 110ms; border-width: 1px }
@keyframes pl-ring { 0% { opacity: .85; transform: scale(.3) } 100% { opacity: 0; transform: scale(4.6) } }

.pl-ara path { opacity: 0; transform: translateY(18px) }
.pl-card.go .pl-ara path { animation: pl-lift 640ms cubic-bezier(.2,.8,.2,1) forwards }
.pl-card.go .pl-ara path:nth-child(1) { animation-delay: 380ms }
.pl-card.go .pl-ara path:nth-child(2) { animation-delay: 260ms }
.pl-card.go .pl-ara path:nth-child(3) { animation-delay: 140ms }
@keyframes pl-lift { to { opacity: 1; transform: translateY(0) } }
.pl-after { opacity: 0; transform: translateY(8px) }
.pl-card.go .pl-after { animation: pl-lift 420ms ease-out 780ms forwards }

@media (prefers-reduced-motion: reduce) {
  .pl-card.go .pl-burst span, .pl-card.go .pl-ring { display: none }
  .pl-card.go .pl-ara path, .pl-card.go .pl-after {
    animation-duration: 1ms !important; animation-delay: 0ms !important;
  }
}
@media (max-width: 420px) {
  .pl-burst span { --dist: 72px !important }
}
`
