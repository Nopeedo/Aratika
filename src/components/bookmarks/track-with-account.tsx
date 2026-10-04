'use client'

/**
 * TrackWithAccount — the Track control, with the account ask kept ON THE PAGE.
 *
 * Tapping Track while signed out used to send you to /login, which is a page
 * change, a form, and a trip back, in exchange for a thing you had not yet been
 * told the value of. Now the ask happens over the page and the reader never
 * leaves it.
 *
 * Tracking REQUIRES AN ACCOUNT (see the note in use-bookmarks), so nothing is
 * saved and the tick does not turn on until there is one. The tap that raised
 * the dialog is remembered, and the moment the sign-up returns a session it is
 * carried out for real: the reader gets the account AND the thing they came for,
 * without having to tap it a second time.
 *
 * The form is the register page's, minus the navigation: same supabase signUp,
 * same field components, same password rules.
 */

import * as React from 'react'
import Link from 'next/link'
import { Bookmark, BookmarkCheck, X, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useBookmarks, type BookmarkEntity } from '@/hooks/use-bookmarks'
import { InfoButton, InfoHeading, InfoText } from '@/components/ui/info-button'
import { Field, PasswordField, SubmitButton, ErrorBox, PasswordStrength, passwordIssue } from '@/components/auth/auth-ui'
import { Mail, User as UserIcon } from 'lucide-react'
import { BORDER, INK, JADE, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

export function TrackWithAccount({ entity, label, savedLabel, accent }: {
  entity: BookmarkEntity
  label: string
  savedLabel: string
  /** The issue's colour, used sparingly: the icon and the dialog's rule. */
  accent: string
}) {
  const { isBookmarked, toggle, authLoading, loading } = useBookmarks()
  const [askAccount, setAskAccount] = React.useState(false)
  const saved = isBookmarked(entity.kind, entity.refId)
  const known = !authLoading && !loading

  async function onClick() {
    const res = await toggle(entity)
    // No account: nothing was saved, so ask for one. The entity is on this
    // component already, so the dialog can finish the job on success.
    if (res.needsAuth) setAskAccount(true)
  }

  // Quiet by design, by request: this sits under the topic heading and should
  // not compete with it. Muted ink and a hairline at rest; the issue's colour
  // only on the mark itself, and the site's green once it is on.
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '10px 17px', borderRadius: 11,
    fontSize: 14, fontWeight: 800, fontFamily: MANROPE,
    whiteSpace: 'nowrap', transition: 'all .15s ease',
  }

  // §3.2 — inline styles cannot be reached from globals.css, so the phone
  // sizing ships with the component. At 375px the jade control sits beside a
  // page title ("Tukituki", "Christopher Luxon") that already owns the row, and
  // at 14px/800 with 17px of side padding "Track this seat" plus its (i) pushed
  // past the gutter. Smaller, tighter, and allowed to sit on its own line.
  //
  // The 44px tap target is NOT reduced — that is §3.1, and the button around
  // the visible span keeps it.
  const phoneCss = `
    @media (max-width: 640px) {
      .tw-wrap { gap: 6px !important; flex-wrap: wrap; }
      .tw-pill { padding: 8px 13px !important; font-size: 13px !important; border-radius: 10px !important; }
    }
    @media (max-width: 380px) {
      .tw-pill { padding: 7px 11px !important; font-size: 12.5px !important; }
    }
  `

  // What tracking actually does. It was never said anywhere, so the control
  // asked for a commitment without naming the return — and the account
  // requirement came as a surprise at the moment of tapping.
  //
  // Every line below maps to a real detector in scripts/detect-*.mjs. "Stay up
  // to date" would have been unfalsifiable; §1.8 applies to a promise as much
  // as to a figure.
  //
  // Rendered in BOTH branches below. It does not depend on whether a session
  // has resolved, and putting it only in the resolved branch made it arrive a
  // beat late and shift the heading sideways.
  const info = (
    <InfoButton accent={accent} label="What tracking does" size={26}>
      <InfoHeading accent={accent}>What tracking does</InfoHeading>
      <InfoText>
        Tracked things gather in your dashboard, and we tell you when they change.
      </InfoText>
      <InfoHeading accent={accent}>What counts as a change</InfoHeading>
      <InfoText>
        A seat — a new candidate stands there, or news names it.{' '}
        An MP — their voting record, written questions or expenses move.{' '}
        A party — a stated position changes, or a new deep dive lands.{' '}
        An issue — any party changes its position on it.{' '}
        A bill — it moves a stage, or opens for public submissions.
      </InfoText>
      <InfoHeading accent={accent}>What it costs</InfoHeading>
      <InfoText>
        A free account, because a track saved in one browser cannot tell you
        anything later. Alerts arrive as notifications, not email, and we never
        send you anything you did not ask for.
      </InfoText>
    </InfoButton>
  )

  if (!known) {
    // Render the REAL control, not a transparent ghost.
    //
    // This used to paint an invisible placeholder until useUser() finished a
    // round trip to Supabase for the session, so the control was absent on
    // first paint and popped in a beat later — it read as still loading while
    // the rest of the page was already there.
    //
    // Untracked is the correct state for almost every reader on almost every
    // item, so draw that immediately and let the rare already-tracked case
    // settle to its mint state when the session lands. Disabled until then, so
    // a tap cannot race the answer, and aria-busy says why.
    return (
      <span className="tw-wrap" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <style dangerouslySetInnerHTML={{ __html: phoneCss }} />
        <button
          disabled
          aria-busy="true"
          aria-label={label}
          style={{
            padding: 9, margin: -9, background: 'none', border: 'none',
            cursor: 'default', display: 'inline-flex', alignItems: 'center',
          }}
        >
          <span className="tw-pill" style={{ ...base, background: JADE, border: `1.5px solid ${JADE}`, color: '#fff' }}>
            <Bookmark style={{ width: 15, height: 15 }} />
            {label}
          </span>
        </button>
        {info}
      </span>
    )
  }

  return (
    <span className="tw-wrap" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <style dangerouslySetInnerHTML={{ __html: phoneCss }} />
      {/* The VISIBLE control is the inner span; the button is the tap target.
          globals.css gives every button a 44px minimum on a phone, which is
          right for a finger and wrong for a control that is meant to sit
          quietly under a heading — it made a 26px pill render 44px tall.
          Padding out and pulling the margin back keeps both. */}
      <button
        onClick={onClick}
        disabled={authLoading}
        aria-pressed={saved}
        style={{
          padding: 9, margin: -9, background: 'none', border: 'none',
          cursor: authLoading ? 'default' : 'pointer',
          display: 'inline-flex', alignItems: 'center',
        }}
      >
        {/* Jade ground, white type, by request — it was a white ghost button
            with grey text and the page title swallowed it.

            The TRACKING state inverts instead of going louder: once it is on,
            the control is no longer an invitation and should stop competing
            with the page. Jade on mint reads as a state; jade on white reads as
            a button you have not pressed yet. */}
        <span className="tw-pill" style={{
          ...base,
          background: saved ? '#ecfdf5' : JADE,
          border: `1.5px solid ${saved ? '#a7f3d0' : JADE}`,
          color: saved ? JADE : '#fff',
        }}>
          {saved
            ? <BookmarkCheck style={{ width: 15, height: 15 }} />
            : <Bookmark style={{ width: 15, height: 15 }} />}
          {saved ? savedLabel : label}
        </span>
      </button>


      {info}

      {askAccount && (
        <AccountDialog
          accent={accent}
          what={entity.label}
          onClose={() => setAskAccount(false)}
          onSignedIn={async () => { await toggle(entity) }}
        />
      )}
    </span>
  )
}

/** The ask itself: a dialog over the page, never a navigation. */
/** Exported so BookmarkButton raises the SAME on-page ask rather than a
 *  second implementation of it. */
export function AccountDialog({ accent, what, onClose, onSignedIn }: {
  accent: string
  what: string
  onClose: () => void
  /** Run the track the reader asked for, now that there is somewhere to put it. */
  onSignedIn: () => Promise<void>
}) {
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [sent, setSent] = React.useState(false)

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const issue = passwordIssue(password)
    if (issue) { setError(issue); return }
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: { name } },
    })
    if (error) { setError(error.message); setLoading(false); return }
    // A session means they are signed in right now, so do the thing they
    // originally tapped before closing. Without one, the account is waiting on
    // an email link and there is nowhere to save it yet.
    if (data.session) {
      await onSignedIn()
      onClose()
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(20,16,12,.42)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Create a free account"
    >
      <div style={{ background: '#fff', borderRadius: 16, borderTop: `4px solid ${accent}`, width: '100%', maxWidth: 380, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 60px -18px rgba(42,18,6,.4)' }}>
        <div style={{ padding: '18px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.25 }}>
              {sent ? 'Check your email' : 'Create a free account'}
            </h2>
            <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', padding: 6, margin: -6, cursor: 'pointer', color: SECONDARY, display: 'inline-flex', flexShrink: 0 }}>
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>

          {sent ? (
            <div style={{ marginTop: 12 }}>
              <MailCheck style={{ width: 22, height: 22, color: JADE }} />
              <p style={{ fontSize: 14, color: INK, fontFamily: MANROPE, lineHeight: 1.55, margin: '8px 0 0' }}>
                We&rsquo;ve sent a link to <b>{email}</b>. Confirm it, and then tap Track again to follow
                {' '}{what.toLowerCase()}. Tracking needs an account, so nothing is saved until yours exists.
              </p>
            </div>
          ) : (
            <>
              {/* Says what the account is FOR, in terms of the thing they just
                  tapped. Not "sign up to continue": the reason is the point. */}
              <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.5, margin: '8px 0 14px' }}>
                Tracking lives in your account, so we can tell you when a position on{' '}
                <b style={{ color: INK }}>{what.toLowerCase()}</b> is added or changes. Make one and we&rsquo;ll start
                tracking it straight away.
              </p>

              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {error && <ErrorBox message={error} />}
                <Field icon={UserIcon} type="text" placeholder="Your name" value={name} onChange={setName} autoComplete="name" />
                <Field icon={Mail} type="email" placeholder="you@example.com" value={email} onChange={setEmail} autoComplete="email" />
                <PasswordField placeholder="Create a password" value={password} onChange={setPassword} autoComplete="new-password" />
                <PasswordStrength value={password} />
                <SubmitButton loading={loading}>Create account</SubmitButton>
              </form>

              <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, margin: '12px 0 0', lineHeight: 1.5 }}>
                Already have one? <Link href="/login" style={{ color: accent, fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>.
                Your tracks come with you.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
