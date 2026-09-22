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
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 10px', borderRadius: 9,
    fontSize: 12.5, fontWeight: 700, fontFamily: MANROPE,
    whiteSpace: 'nowrap', transition: 'all .15s ease',
  }

  if (!known) {
    return (
      <span aria-hidden style={{ ...base, background: '#fff', border: `1px solid ${BORDER}`, color: 'transparent', opacity: .5 }}>
        <Bookmark style={{ width: 13, height: 13, color: BORDER }} />
        {label}
      </span>
    )
  }

  return (
    <>
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
        <span style={{
          ...base,
          background: saved ? '#ecfdf5' : '#fff',
          border: `1px solid ${saved ? '#a7f3d0' : BORDER}`,
          color: saved ? JADE : SECONDARY,
        }}>
          {saved
            ? <BookmarkCheck style={{ width: 13, height: 13 }} />
            : <Bookmark style={{ width: 13, height: 13, color: accent }} />}
          {saved ? savedLabel : label}
        </span>
      </button>

      {askAccount && (
        <AccountDialog
          accent={accent}
          what={entity.label}
          onClose={() => setAskAccount(false)}
          onSignedIn={async () => { await toggle(entity) }}
        />
      )}
    </>
  )
}

/** The ask itself: a dialog over the page, never a navigation. */
function AccountDialog({ accent, what, onClose, onSignedIn }: {
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
