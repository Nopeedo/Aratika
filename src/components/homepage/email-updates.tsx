'use client'

/**
 * EmailUpdates — the mailing list box. An email address and nothing else.
 *
 * Deliberately NOT the account flow. Signing up for mail and making an account
 * are different sizes of ask, and every other email path on this site was the
 * second one: /api/newsletter/prefs 401s without a session, email_alerts
 * references auth.users. Someone who wants to hear when something happens
 * should not have to choose a password to do it, so this writes to
 * newsletter_signups, which is keyed on the address itself.
 *
 * The copy says what is true today. Addresses are being collected; nothing
 * sends to them yet, because an unconfirmed address is one typo away from
 * being a stranger's inbox. "We'll email you when there's something worth
 * knowing" promises the thing itself without promising a schedule.
 */

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Loader2, Check } from 'lucide-react'
import { usePartyCycleOptional } from '@/components/homepage/party-cycle'
import { isLightHex } from '@/components/homepage/battleground-card'
import { BORDER, INK, JADE, MANROPE, SECONDARY } from '@/constants/theme'

export function EmailUpdates() {
  // Off the homepage there is no party cycle to follow, so the box takes the
  // site's own accent instead of demanding a provider it does not need.
  const accentColor = usePartyCycleOptional()?.accentColor ?? JADE
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'busy') return
    setState('busy')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, source: 'homepage' }),
      })
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  return (
    <section style={{ background: 'transparent' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '8px clamp(18px, 5vw, 36px) 40px' }}>
        <div style={{
          background: '#fff', border: `2px solid ${BORDER}`,
          borderRadius: 16, padding: 'clamp(16px, 3vw, 22px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
            <Mail style={{ width: 17, height: 17, color: accentColor, flexShrink: 0, transition: 'color .3s ease-in-out' }} />
            <h2 style={{ fontSize: 17, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>
              Get email updates
            </h2>
          </div>

          {state === 'done' ? (
            <p style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>
              <Check style={{ width: 16, height: 16, color: accentColor, flexShrink: 0 }} strokeWidth={3} />
              You&rsquo;re on the list. We&rsquo;ll be in touch before the election.
            </p>
          ) : (
            <>
              <form onSubmit={submit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle') }}
                  placeholder="you@example.com"
                  aria-label="Your email address"
                  style={{
                    flex: '1 1 220px', minWidth: 0, boxSizing: 'border-box',
                    fontSize: 15, fontFamily: MANROPE, color: INK,
                    padding: '10px 13px', borderRadius: 10, border: `1.5px solid ${BORDER}`,
                    background: '#fff', outlineColor: accentColor,
                  }}
                />
                <button
                  type="submit"
                  disabled={state === 'busy'}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    fontSize: 14.5, fontWeight: 800, fontFamily: MANROPE,
                    // White fails on the pale accents: on ACT's yellow the
                    // label all but disappears. Same test the party page uses
                    // for its own filled button.
                    color: isLightHex(accentColor) ? INK : '#fff',
                    background: accentColor, border: 'none', borderRadius: 10,
                    padding: '10px 18px', cursor: state === 'busy' ? 'default' : 'pointer',
                    transition: 'background-color .3s ease-in-out',
                  }}
                >
                  {state === 'busy' && <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />}
                  Sign me up
                </button>
              </form>
              {/* Consent sits under the button, not above it: the ask is the
                  field and the button, and a paragraph of terms in front of
                  them is a thing to read before you can do the thing. Below,
                  it is still before the address leaves the page. Both
                  documents open in a new tab so a typed address is not lost. */}
              <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: '10px 0 0', lineHeight: 1.55 }}>
                By signing up you agree to our{' '}
                <Link href="/terms" target="_blank" style={{ color: INK, fontWeight: 700, textDecoration: 'underline' }}>Terms of Use</Link>
                {' '}and{' '}
                <Link href="/privacy" target="_blank" style={{ color: INK, fontWeight: 700, textDecoration: 'underline' }}>Privacy Policy</Link>.
              </p>
              {state === 'error' && (
                <p style={{ fontSize: 13, color: '#b3261e', fontFamily: MANROPE, margin: '9px 0 0' }}>
                  That didn&rsquo;t go through. Check the address and try again.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
