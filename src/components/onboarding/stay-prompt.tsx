'use client'

/**
 * StayPrompt — the free-account ask, raised once a reader has actually stayed.
 *
 * Mounted in the root layout, so the clock runs across the whole visit rather
 * than per page: someone who spends two minutes on the party comparison and
 * three on their electorate has spent five minutes on the SITE, which is the
 * thing being measured.
 *
 * Four decisions worth keeping:
 *
 * 1. ENGAGED time, not wall clock. The counter only advances while the tab is
 *    visible. A tab left open in the background for an hour is not a reader,
 *    and greeting them with a sign-up box when they finally come back is the
 *    behaviour people describe as "the site ambushed me".
 *
 * 2. sessionStorage, not state and not localStorage. State alone resets on
 *    every full page load, which on a site with prerendered pages means the
 *    five minutes could never be reached by anyone who navigates with the
 *    address bar. localStorage would make it cumulative across visits, which
 *    is a different (and dishonest) claim.
 *
 * 3. It does not lock scroll, unlike the Track dialog in track-with-account.
 *    That one is raised BY a tap, so holding the page still is right. This one
 *    is uninvited, so a reader must be able to keep reading past it — the
 *    overlay closes on click, Escape closes it, and there is a Not now.
 *
 * 4. Quiet routes. The survey, the editor, the auth pages and the donation
 *    flow are all mid-task, and the worst possible moment to interrupt is
 *    question seven of twelve.
 *
 * The form is the register page's own parts — same signUp call, same password
 * rule, same fields — not a second implementation of signing up.
 */

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bookmark, BellRing, Smartphone, X, MailCheck, Mail, User as UserIcon, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Field, PasswordField, SubmitButton, ErrorBox, OrDivider, PasswordStrength, passwordIssue } from '@/components/auth/auth-ui'
import { GoogleSignIn } from '@/components/auth/google-signin'
import { safeNext } from '@/lib/auth/safe-next'
import { BORDER, INK, JADE, JADE_SUBTLE, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

/** Five minutes of engaged time, by request. */
const AFTER_SECONDS = 300
const TICK_SECONDS = 5

/** Engaged seconds this visit. Per-visit on purpose — see note 2 above. */
const SPENT_KEY = 'politika.visit.engaged'
/** When the ask was last dismissed, or 'never' once there is an account. */
const SNOOZE_KEY = 'politika.signup.snoozed'
const SNOOZE_DAYS = 30

/**
 * Mid-task routes. Prefix match, so /start and /start/results are both quiet.
 * The signed-in areas (/hub, /dashboard, /settings) do not need listing — the
 * session check below already covers them — and listing them would imply the
 * ask could otherwise appear there.
 */
const QUIET = ['/login', '/register', '/auth', '/editor', '/start', '/donate', '/subscription']

function snoozed(): boolean {
  try {
    const v = localStorage.getItem(SNOOZE_KEY)
    if (!v) return false
    if (v === 'never') return true
    const at = Number(v)
    if (!Number.isFinite(at)) return false
    return Date.now() - at < SNOOZE_DAYS * 864e5
  } catch {
    // Private mode: treat as not snoozed, but the dismiss below will also fail
    // to persist, so the ask can return on the next load. Showing it is the
    // lesser fault — the alternative is never showing it to anyone whose
    // browser blocks storage.
    return false
  }
}

export function StayPrompt() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  // Settled once we know whether there is a session. Nothing opens before then.
  const [signedOut, setSignedOut] = React.useState(false)

  /**
   * A LOCAL session check, deliberately not useUser().
   *
   * useUser() calls auth.getUser(), which validates the token against the auth
   * server on every mount. CompanionWidget already does that app-wide; a second
   * copy here would double it on every page in the site for a component whose
   * whole job is to stay out of the way. getSession() reads the stored session,
   * and for a signed-out reader — the only case this component acts on — it is
   * purely local and instant.
   */
  React.useEffect(() => {
    let alive = true
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      if (data.session) { setSignedOut(false); return }
      setSignedOut(true)
    })
    // Signing in anywhere else on the page (the Track dialog, say) should take
    // this away rather than leave it waiting to appear.
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!alive) return
      if (session) { setSignedOut(false); setOpen(false) }
    })
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [])

  const quiet = QUIET.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  React.useEffect(() => {
    if (open || !signedOut || snoozed()) return

    const read = () => {
      try { return Number(sessionStorage.getItem(SPENT_KEY)) || 0 } catch { return 0 }
    }
    const write = (n: number) => {
      try { sessionStorage.setItem(SPENT_KEY, String(n)) } catch { /* private mode */ }
    }

    // Already past the threshold when landing on a page that allows the ask —
    // e.g. they spent the five minutes inside the survey and have just come
    // out of it. Don't make them wait another five.
    if (read() >= AFTER_SECONDS) {
      if (!quiet) setOpen(true)
      return
    }

    const id = window.setInterval(() => {
      // Engaged time only. A hidden tab accrues nothing.
      if (document.visibilityState !== 'visible') return
      const next = read() + TICK_SECONDS
      write(next)
      if (next >= AFTER_SECONDS && !quiet) setOpen(true)
    }, TICK_SECONDS * 1000)

    return () => window.clearInterval(id)
  }, [open, signedOut, quiet])

  if (!open) return null

  return (
    <SignUpSheet
      next={safeNext(pathname, { fallback: '/' })}
      onClose={() => {
        setOpen(false)
        try {
          // Closing the sheet AFTER signing up must not downgrade the permanent
          // 'never' to a 30-day snooze — the same handler closes both stages.
          if (localStorage.getItem(SNOOZE_KEY) !== 'never') {
            localStorage.setItem(SNOOZE_KEY, String(Date.now()))
          }
        } catch { /* private mode */ }
      }}
      onDone={() => {
        try { localStorage.setItem(SNOOZE_KEY, 'never') } catch { /* private mode */ }
      }}
    />
  )
}

/* ── The ask ──────────────────────────────────────────────────────────────── */

// Inline styles cannot carry a media query (§3.2), so the phone treatment ships
// as a style tag with the component. On a phone it becomes a bottom sheet: a
// centred card with a form in it is taller than a small viewport once the
// keyboard is up, and the top of it goes off screen.
const SHEET_CSS = `
.sp-scrim { align-items: center; }
.sp-card { max-width: 420px; border-radius: 18px; }
@media (max-width: 640px) {
  .sp-scrim { align-items: flex-end; padding: 0; }
  .sp-card { max-width: none; border-radius: 18px 18px 0 0; max-height: 92vh; }
}
`

const REASONS: [React.ElementType, string, string][] = [
  [Bookmark, 'Follow what matters to you', 'A seat, an MP, a party, an issue or a bill.'],
  [BellRing, 'Hear when it changes', 'A new candidate, a stated position, a bill moving a stage.'],
  [Smartphone, 'On every device you sign in on', 'Your list travels with the account, not the browser.'],
]

function SignUpSheet({ next, onClose, onDone }: {
  next: string
  onClose: () => void
  /** Called once an account exists, so the ask never returns. */
  onDone: () => void
}) {
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [stage, setStage] = React.useState<'form' | 'sent' | 'in'>('form')

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const issue = passwordIssue(password)
    if (issue) { setError(issue); return }
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        data: { name },
      },
    })
    if (error) { setError(error.message); setLoading(false); return }
    setLoading(false)
    onDone()
    // A session means they are signed in right now. No redirect: they were
    // reading something when this appeared, and taking them to a dashboard
    // would lose it.
    setStage(data.session ? 'in' : 'sent')
  }

  return (
    <div
      className="sp-scrim"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="false"
      aria-label="Create a free account"
      style={{
        position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(20,16,12,.42)',
        display: 'flex', justifyContent: 'center', padding: 18,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: SHEET_CSS }} />
      <div
        className="sp-card"
        style={{
          background: '#fff', width: '100%', maxHeight: '88vh', overflowY: 'auto',
          borderTop: `4px solid ${JADE}`, fontFamily: MANROPE,
          boxShadow: '0 24px 60px -18px rgba(42,18,6,.4)',
        }}
      >
        <div style={{ padding: '20px 22px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.12em', color: JADE }}>
                FREE ACCOUNT
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: INK, margin: '5px 0 0', lineHeight: 1.25, letterSpacing: '-.01em' }}>
                {stage === 'sent' ? 'Check your email' : stage === 'in' ? 'You’re in' : 'Keep what you’ve found'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{ background: 'none', border: 'none', padding: 6, margin: -6, cursor: 'pointer', color: SECONDARY, display: 'inline-flex', flexShrink: 0 }}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>

          {stage === 'sent' && (
            <div style={{ marginTop: 12 }}>
              <MailCheck style={{ width: 22, height: 22, color: JADE }} />
              <p style={{ fontSize: 14, color: INK, lineHeight: 1.55, margin: '8px 0 0' }}>
                We&rsquo;ve sent a link to <b>{email}</b>. Confirm it and your account is ready —
                it brings you back to where you were.
              </p>
            </div>
          )}

          {stage === 'in' && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 14, color: INK, lineHeight: 1.55, margin: 0 }}>
                Your account is ready. The Track button on any seat, party, issue or bill will
                save it from here on.
              </p>
              <button
                type="button"
                onClick={onClose}
                style={{
                  marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 7, minHeight: 44,
                  padding: '11px 20px', borderRadius: 12, border: 'none', background: JADE,
                  color: '#fff', fontFamily: MANROPE, fontSize: 15, fontWeight: 800, cursor: 'pointer',
                }}
              >
                <Check style={{ width: 16, height: 16 }} /> Back to reading
              </button>
            </div>
          )}

          {stage === 'form' && (
            <>
              <p style={{ fontSize: 13.5, color: SECONDARY, lineHeight: 1.55, margin: '10px 0 14px' }}>
                You&rsquo;ve been reading a few minutes. An account keeps the things you care about in
                one place and tells you when they change. We never send you anything you didn&rsquo;t
                ask for.
              </p>

              <ul style={{ listStyle: 'none', margin: '0 0 16px', padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {REASONS.map(([Icon, title, detail]) => (
                  <li key={title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: JADE_SUBTLE, flexShrink: 0 }}>
                      <Icon style={{ width: 15, height: 15, color: JADE }} />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, color: INK, lineHeight: 1.35 }}>{title}</span>
                      <span style={{ display: 'block', fontSize: 12.5, color: SECONDARY, lineHeight: 1.45 }}>{detail}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <GoogleSignIn next={next} onError={setError} />
              <OrDivider />

              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {error && <ErrorBox message={error} />}
                <Field icon={UserIcon} type="text" placeholder="Your name" value={name} onChange={setName} autoComplete="name" />
                <Field icon={Mail} type="email" placeholder="you@example.com" value={email} onChange={setEmail} autoComplete="email" />
                <PasswordField placeholder="Create a password" value={password} onChange={setPassword} autoComplete="new-password" />
                <PasswordStrength value={password} />
                <SubmitButton loading={loading}>Create account</SubmitButton>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
                <p style={{ fontSize: 12.5, color: TERTIARY, margin: 0, lineHeight: 1.5 }}>
                  Already have one?{' '}
                  <Link href={`/login?next=${encodeURIComponent(next)}`} style={{ color: JADE, fontWeight: 700, textDecoration: 'none' }}>
                    Sign in
                  </Link>
                </p>
                {/* An explicit out, not just the ×. The × reads as "close this
                    box"; this reads as "and do not ask me again", which is what
                    it does for the next 30 days. */}
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10,
                    padding: '8px 14px', fontFamily: MANROPE, fontSize: 13, fontWeight: 700,
                    color: SECONDARY, cursor: 'pointer',
                  }}
                >
                  Not now
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
