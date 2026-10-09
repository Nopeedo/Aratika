'use client'

/**
 * PledgeCounter — the pledge to vote, in four steps.
 *
 *   ask        "Will you pledge to vote?" and one button. Writes nothing.
 *   details    name, email, two consents, and the confirm that records it
 *   celebrate  the ara climbs out of the burst, their number lands
 *   check      "Now check you're enrolled", with the link
 *
 * THE PLEDGE IS RECORDED ON CONFIRM, NOT ON THE FIRST TAP. The opening button
 * opens the form and sends nothing, so the number on the card means a person
 * who gave an address rather than anyone who brushed a button. An earlier
 * version counted the tap and asked for details afterwards: better conversion,
 * weaker number. This is the number the site has to be able to stand behind.
 *
 * WHAT THE NUMBER MEANS. It counts people who said they intend to vote. It is
 * not a count of enrolments or of votes and the copy never implies otherwise:
 * the Commission's enrolment flow is a separate origin behind a bot challenge
 * with no callback and no API, so this site cannot learn what happened after
 * someone leaves for vote.nz. See migration 0021.
 *
 * NOBODY IS ASKED TO GUESS. This used to ask "are you enrolled?" with yes / no /
 * I don't know. Most people genuinely cannot tell without looking it up, so
 * being asked to CHECK is more use than being asked to guess — and the site
 * stopped storing a self-reported answer it could never verify.
 *
 * THREE CONSENTS, NEVER COLLAPSED. An email given to register a pledge is not
 * agreement to appear on a public list, and not agreement to be mailed. Both
 * boxes start unticked and neither is inferred from the other. See 0022.
 *
 * Keyframes cannot live in an inline style object, so the animation ships as a
 * style tag with the component (§3.2), the same way the track control does.
 */

import * as React from 'react'
import { ExternalLink } from 'lucide-react'
import { INK, TERTIARY, BORDER, SURFACE, JADE, MANROPE } from '@/constants/theme'

const DEEP = '#0E3F26'
const MINT = '#8FD3AC'

/** vote.nz's own enrol-or-update entry point: it checks and updates as well as
 *  enrols, so it is the right destination whether or not someone is on the roll. */
const VOTE_NZ = 'https://vote.nz/enrolling/enrol-or-update/enrol-or-update-online'

type Step = 'ask' | 'details' | 'celebrate' | 'check'
interface WallEntry { id: string; name: string; named: boolean }
interface Totals { total: number; verified: number; goal: number; ok: boolean }

export function PledgeCounter({ source = 'homepage', showWall = true }: {
  source?: string
  showWall?: boolean
}) {
  const [totals, setTotals] = React.useState<Totals | null>(null)
  const [step, setStep] = React.useState<Step>('ask')
  const [position, setPosition] = React.useState<number | null>(null)
  const [wall, setWall] = React.useState<WallEntry[]>([])
  const [burst, setBurst] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [listed, setListed] = React.useState(false)
  const [news, setNews] = React.useState(false)

  React.useEffect(() => {
    let alive = true
    fetch('/api/pledge')
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return
        setTotals({ total: d.total ?? 0, verified: d.verified ?? 0, goal: d.goal ?? 100000, ok: !!d.ok })
        setWall(Array.isArray(d.wall) ? d.wall : [])
        // Already pledged on this browser: straight to the thing still worth
        // doing. No burst — that belongs to the moment of pledging, and firing
        // it again at someone who pledged last week celebrates nothing.
        if (d.mine?.pledged && d.mine?.hasDetails) {
          setPosition(d.total ?? null)
          setStep('check')
        }
      })
      .catch(() => { if (alive) setTotals({ total: 0, verified: 0, goal: 100000, ok: false }) })
    return () => { alive = false }
  }, [])

  /** Step one records nothing. It only opens the form. */
  function openForm() {
    setError(null)
    setStep('details')
  }

  async function confirmPledge(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true); setError(null)
    try {
      const r = await fetch('/api/pledge', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, displayName: listed, newsletter: news, source }),
      })
      const d = await r.json()
      if (!r.ok) {
        // 'email_taken' is gone: the route now answers every already-pledged
        // case the same way, with already:true, and this screen moves on.
        setError(
          d.error === 'bad_email' ? 'That email doesn’t look right.'
          : d.error === 'rate_limited' ? 'Too many pledges from this connection just now. Try again shortly.'
          : 'That didn’t save. Try once more.'
        )
        return
      }
      setTotals((t) => ({ total: d.total, verified: d.verified, goal: d.goal, ok: t?.ok ?? true }))
      setPosition(d.position ?? d.total ?? null)
      if (Array.isArray(d.wall)) setWall(d.wall)
      // Confirming a pledge that already exists is not worth a celebration.
      if (d.already) { setStep('check'); return }
      setBurst(true)
      setStep('celebrate')
      // Long enough for the burst and the three chevrons to land, so the next
      // step does not cut off the one moment the whole thing builds to.
      window.setTimeout(() => setStep('check'), 2600)
    } catch {
      setError('That didn’t save. Try once more.')
    } finally { setBusy(false) }
  }

  // The CARD renders immediately; only the NUMBER waits for the fetch.
  //
  // Waiting for the count before rendering anything would make this a block
  // that appears after load and shoves the rest of the page down — the exact
  // layout shift this site was fixed for. The ask needs no data, so it paints
  // with the first frame and the count slots into space already reserved.
  //
  // The one case that hides the card is an explicit failure: `ok: false` means
  // the pledges table is not there yet or Supabase is unreachable, so the
  // feature is not live and a button that would fail is worse than nothing.
  if (totals && !totals.ok) return null

  const goal = totals?.goal ?? 100000
  const shown = position ?? totals?.total ?? 0
  const pct = totals ? Math.min(100, Math.max(1.2, (totals.total / goal) * 100)) : 0
  const landed = step === 'celebrate' || step === 'check'

  return (
    <section style={{ background: 'transparent' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '8px clamp(18px, 5vw, 36px) 20px' }}>
        <div className={`pl-card${landed ? ' go' : ''}`} style={{
          background: DEEP, borderRadius: 20, padding: 'clamp(28px, 5vw, 36px)',
          fontFamily: MANROPE, color: '#fff', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {burst && <Burst />}

          {step === 'ask' && (
            <>
              <h2 style={{ fontSize: 'clamp(26px, 5vw, 34px)', fontWeight: 800, letterSpacing: '-.025em', margin: '0 0 20px', lineHeight: 1.15 }}>
                Will you pledge to vote?
              </h2>
              <button onClick={openForm} className="pl-cta" style={cta(false)}>
                I&rsquo;m in
              </button>
              <Bar pct={pct} total={totals?.total ?? null} goal={goal} />
            </>
          )}

          {/* No heading. They answered the question on the screen before, and
              asking it again reads as though the first tap didn't register. */}
          {step === 'details' && (
            <form onSubmit={confirmPledge} className="pl-in">
              <Field
                label={<>Your name <span style={{ color: 'rgba(255,255,255,.45)', fontWeight: 600 }}>(optional)</span></>}
                hint="Only shown if you tick the box below."
              >
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="First and last name"
                  autoComplete="name" maxLength={80} style={input} />
              </Field>
              <Field label="Email" hint="Never shown publicly. Used to count each person once.">
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  type="email" autoComplete="email" required maxLength={320} style={input} />
              </Field>

              <div style={{ margin: '20px 0 22px' }}>
                <Check checked={listed} onChange={setListed} label="Show my name on the wall"
                  sub={'Appears as “John D.” Leave it unticked and you’ll show as Anonymous.'} />
                <Check checked={news} onChange={setNews} label="Email me updates from Politika"
                  sub="Occasional, and you can stop any time." />
              </div>

              <button type="submit" disabled={busy} className="pl-cta" style={cta(busy)}>
                {busy ? 'Saving' : 'Confirm my pledge'}
              </button>
              {error && <Err>{error}</Err>}
            </form>
          )}

          {step === 'celebrate' && (
            <>
              <Ara />
              <div className="pl-after">
                <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.14em', color: MINT, marginTop: 14 }}>
                  YOU&rsquo;RE IN
                </div>
                <div style={{ fontSize: 'clamp(42px, 9vw, 58px)', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1, margin: '10px 0 2px', fontVariantNumeric: 'tabular-nums' }}>
                  {shown.toLocaleString('en-NZ')}
                </div>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,.7)', margin: 0 }}>
                  of {goal.toLocaleString('en-NZ')}
                </p>
                <Bar pct={pct} />
              </div>
            </>
          )}

          {step === 'check' && (
            <>
              <Ara />
              <div className="pl-in">
                <p style={{ fontSize: 20, fontWeight: 800, margin: '20px 0 7px', lineHeight: 1.3 }}>
                  Now check you&rsquo;re enrolled
                </p>
                <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.66)', margin: '0 0 20px', lineHeight: 1.5 }}>
                  Most people think they are. Takes about a minute to be sure.
                </p>
                <a href={VOTE_NZ} target="_blank" rel="noopener noreferrer"
                  className="pl-cta" style={{ ...cta(false), gap: 9, fontSize: 16.5, textDecoration: 'none' }}>
                  Check at vote.nz <ExternalLink style={{ width: 15, height: 15 }} aria-hidden />
                </a>
                <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,.52)', margin: '15px 0 0' }}>
                  Enrolment closes midnight, Sunday 25 October.
                </p>
              </div>
            </>
          )}
        </div>

        {showWall && wall.length > 0 && <Wall entries={wall} total={totals?.total ?? 0} />}
      </div>
    </section>
  )
}

/* ── pieces ──────────────────────────────────────────────────────────────── */

/**
 * The wall.
 *
 * Everyone who pledged appears. Opting out shows as Anonymous rather than
 * vanishing, so the list reads as everyone who pledged and anonymity reads as a
 * normal choice other people are making rather than an absence.
 */
function Wall({ entries, total }: { entries: WallEntry[]; total: number }) {
  // `total` is the cached count (up to a minute stale); `entries` is live. Never
  // let the header claim a number smaller than the chips sitting under it.
  const shownTotal = Math.max(total, entries.length)
  const rest = shownTotal - entries.length
  return (
    <div style={{
      background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20,
      padding: 'clamp(22px, 4vw, 28px)', fontFamily: MANROPE, marginTop: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-.02em', color: INK, margin: 0 }}>
          Who&rsquo;s pledged
        </h2>
        <span style={{ fontSize: 13, fontWeight: 700, color: JADE }}>
          {shownTotal.toLocaleString('en-NZ')} so far
        </span>
      </div>
      <p style={{ fontSize: 13, color: TERTIARY, margin: '6px 0 18px', lineHeight: 1.5 }}>
        Most recent first. Names show only for people who chose to be listed.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {entries.map((e) => (
          <span key={e.id} style={{
            padding: '9px 15px', borderRadius: 999,
            background: e.named ? '#fff' : 'transparent',
            border: `1px ${e.named ? 'solid' : 'dashed'} ${BORDER}`,
            fontSize: 14, fontWeight: e.named ? 700 : 600,
            color: e.named ? INK : TERTIARY,
          }}>
            {e.name}
          </span>
        ))}
        {rest > 0 && (
          <span style={{
            padding: '9px 15px', borderRadius: 999, background: JADE,
            fontSize: 14, fontWeight: 800, color: '#fff',
          }}>
            + {rest.toLocaleString('en-NZ')} more
          </span>
        )}
      </div>
    </div>
  )
}

function Ara() {
  return (
    <svg className="pl-ara" width="66" height="61" viewBox="0 0 28 26" aria-hidden="true" style={{ display: 'block', margin: '0 auto' }}>
      <g stroke={MINT} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 22 L14 16 L23 22" />
        <path d="M5 15 L14 9 L23 15" />
        <path d="M5 8 L14 2 L23 8" />
      </g>
    </svg>
  )
}

function Bar({ pct, total, goal }: { pct: number; total?: number | null; goal?: number }) {
  return (
    <div style={{ maxWidth: 380, margin: '24px auto 0' }}>
      <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,.18)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 5, background: MINT, transition: 'width .7s cubic-bezier(.2,.8,.2,1)' }} />
      </div>
      {goal != null && (
        /* minHeight holds the line before the count arrives, so nothing below
           this card moves when it does. */
        <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,.92)', margin: '11px 0 0', minHeight: 22 }}>
          {total != null && (
            <>
              {total.toLocaleString('en-NZ')}{' '}
              <span style={{ color: 'rgba(255,255,255,.55)', fontWeight: 600 }}>
                of {goal.toLocaleString('en-NZ')}
              </span>
            </>
          )}
        </p>
      )}
    </div>
  )
}

function Field({ label, hint, children }: { label: React.ReactNode; hint: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14, textAlign: 'left' }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.82)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,.5)', margin: '6px 0 0' }}>{hint}</p>
    </div>
  )
}

function Check({ checked, onChange, label, sub }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; sub: string
}) {
  return (
    <label style={{ display: 'flex', gap: 11, alignItems: 'flex-start', marginBottom: 13, textAlign: 'left', cursor: 'pointer' }}>
      {/* aria-label is explicit because the visible text lives in nested spans
          and the accessibility tree reported this as an unnamed "checkbox, on".
          A consent a screen reader cannot read is not a consent. */}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        aria-label={`${label}. ${sub}`}
        style={{ width: 22, height: 22, flexShrink: 0, marginTop: 1, accentColor: MINT, cursor: 'pointer' }} />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: '#fff', lineHeight: 1.35 }}>{label}</span>
        <span style={{ display: 'block', fontSize: 12.5, color: 'rgba(255,255,255,.58)', lineHeight: 1.45, marginTop: 3 }}>{sub}</span>
      </span>
    </label>
  )
}

function Err({ children }: { children: React.ReactNode }) {
  return <p role="alert" style={{ fontSize: 13.5, color: '#ffd9c7', margin: '14px 0 0', lineHeight: 1.5 }}>{children}</p>
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

const cta = (busy: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  minHeight: 44, padding: '15px 32px', borderRadius: 13, border: 'none',
  background: '#fff', color: DEEP, fontFamily: MANROPE,
  fontSize: 17.5, fontWeight: 800, cursor: busy ? 'default' : 'pointer',
  opacity: busy ? 0.7 : 1,
})

const input: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,.1)',
  border: '1px solid rgba(255,255,255,.26)', borderRadius: 12,
  padding: '15px 16px', fontSize: 16, color: '#fff',
  fontFamily: MANROPE, outline: 'none',
}

const CSS = `
.pl-card > *:not(.pl-burst) { position: relative; z-index: 1 }
.pl-cta:hover { background: ${MINT} }
.pl-card input::placeholder { color: rgba(255,255,255,.45) }
.pl-card input[type="text"]:focus, .pl-card input[type="email"]:focus { border-color: ${MINT} }

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
/* Mounts when the burst is over, so no delay — a delay here would read as the
   step having failed to load. */
.pl-in { animation: pl-lift 300ms ease-out forwards; opacity: 0; transform: translateY(6px) }

@media (prefers-reduced-motion: reduce) {
  .pl-card.go .pl-burst span, .pl-card.go .pl-ring { display: none }
  .pl-card.go .pl-ara path, .pl-card.go .pl-after, .pl-in {
    animation-duration: 1ms !important; animation-delay: 0ms !important;
  }
}
@media (max-width: 420px) {
  .pl-burst span { --dist: 72px !important }
}
`
