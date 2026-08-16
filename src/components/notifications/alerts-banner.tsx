'use client'

/**
 * AlertsBanner — the slim, dismissible prompt above the party tiles.
 *
 * Supersedes the old install-only pill. Installing was never the point: on
 * desktop and Android you can have notifications without installing anything,
 * and only iOS makes Add-to-Home-Screen a prerequisite for Web Push. So this
 * offers whichever of the two actually applies:
 *
 *   notify   push works here and isn't on yet  → request permission on tap
 *   ios      iPhone/iPad Safari, not installed → show the Add-to-Home steps
 *   install  push unavailable but installable  → offer the native install
 *
 * The permission prompt only ever fires from a tap. Browsers penalise sites
 * that call requestPermission() on load, and a cold prompt is the reason most
 * people click Block — this is the same custom-banner-then-native-prompt
 * pattern Facebook and the rest use.
 *
 * `beforeinstallprompt` fires once, early in page load, so the listener has to
 * be mounted with the page rather than opened on demand. That is why this is
 * inline in the homepage and not a modal opened from a button.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Download, Share, SquarePlus, X, Check } from 'lucide-react'
import { pushSupported, iosNeedsInstall, isSubscribed, subscribeToPush } from '@/lib/notifications/push-client'
import { INK, JADE, MANROPE } from '@/constants/theme'

const SUB = '#5b6067'
const DISMISS_KEY = 'arapono.alerts.dismissed'
const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

// A stadium pill works while everything sits on one line. Once the copy wraps —
// which it does on a phone — the rounded ends leave a crescent of dead space and
// the content drifts right. Below 640 it becomes a plain rounded card that fills
// the width instead.
const BANNER_CSS = `
.ab-col { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.ab-pill {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end;
  border-radius: 999px; padding: 5px 8px 5px 14px;
}
@media (max-width: 640px) {
  .ab-col { align-items: stretch; }
  .ab-pill { border-radius: 16px; padding: 12px; justify-content: flex-end; }
  .ab-copy { width: 100%; }
}
`

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

type Mode = 'hidden' | 'notify' | 'ios' | 'install'
type Result = null | 'done' | 'auth' | 'denied' | 'error'

export function AlertsBanner() {
  const [mode, setMode] = useState<Mode>('hidden')
  const [deferred, setDeferred] = useState<BIPEvent | null>(null)
  const [needsSafari, setNeedsSafari] = useState(false)
  const [steps, setSteps] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result>(null)

  useEffect(() => {
    try { if (localStorage.getItem(DISMISS_KEY) === '1') return } catch { /* private mode */ }

    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as unknown as { standalone?: boolean }).standalone === true

    // The install prompt can arrive after we've already decided what to show,
    // so always listen — it either becomes the offer or a secondary button.
    const onBIP = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BIPEvent)
      setMode((m) => (m === 'hidden' ? 'install' : m))
    }
    window.addEventListener('beforeinstallprompt', onBIP)

    ;(async () => {
      if (iosNeedsInstall()) {
        const ua = navigator.userAgent
        // Add-to-Home-Screen only exists in Safari — not Chrome/Firefox on iOS,
        // and not the in-app browsers inside Facebook, Instagram or Gmail.
        const inApp = /FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|Pinterest|LinkedInApp|Messenger|MicroMessenger/i.test(ua)
        if (inApp || /CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)) setNeedsSafari(true)
        return setMode('ios')
      }
      if (!VAPID || !pushSupported()) return
      // Already blocked at browser level: nothing this banner can do, and
      // asking again is exactly the nagging that got them to block it.
      if (Notification.permission === 'denied') return
      if (await isSubscribed()) return
      setMode((m) => (m === 'install' && !standalone ? 'install' : 'notify'))
    })()

    return () => window.removeEventListener('beforeinstallprompt', onBIP)
  }, [])

  function dismiss() {
    setMode('hidden')
    try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* private mode */ }
  }

  async function turnOn() {
    setBusy(true); setResult(null)
    const r = await subscribeToPush()
    setBusy(false)
    if (r.ok) {
      setResult('done')
      try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* private mode */ }
      setTimeout(() => setMode('hidden'), 2600)
      return
    }
    if (r.reason === 'auth') return setResult('auth')
    if (r.reason === 'denied') return setResult('denied')
    if (r.reason === 'ios_install') return setMode('ios')
    setResult('error')
  }

  async function install() {
    if (!deferred) return setSteps((v) => !v)
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    dismiss()
  }

  if (mode === 'hidden') return null

  const copy =
    mode === 'notify' ? 'Get told when something you follow moves.'
    : mode === 'ios' ? 'Add Arapono to your Home Screen to get alerts.'
    : 'Install Arapono — it opens like an app.'

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 clamp(18px, 5vw, 36px)' }}>
      <style dangerouslySetInnerHTML={{ __html: BANNER_CSS }} />
      <div className="ab-col">
        <div
          className="ab-pill"
          style={{
            background: '#ecfdf5', border: `1px solid ${JADE}2e`,
            boxShadow: '0 1px 3px rgba(12,14,18,.06)', fontFamily: MANROPE,
          }}
        >
          {result === 'done' ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800, color: JADE, padding: '5px 6px' }}>
              <Check style={{ width: 14, height: 14 }} /> Alerts are on
            </span>
          ) : (
            <>
              <span className="ab-copy" style={{ fontSize: 12.5, color: INK, fontWeight: 600 }}>
                {result === 'auth' ? 'Sign in to turn these on.'
                  : result === 'denied' ? 'Your browser is blocking alerts — allow them in site settings.'
                  : result === 'error' ? 'That didn’t work. Try again?'
                  : copy}
              </span>

              {result === 'auth' ? (
                <Link href="/login" style={pill(true)}>Sign in</Link>
              ) : mode === 'notify' ? (
                <button onClick={turnOn} disabled={busy} style={pill(true)}>
                  <Bell style={ic} /> {busy ? 'Just a sec…' : 'Turn on alerts'}
                </button>
              ) : (
                <button onClick={install} style={pill(true)}>
                  <Download style={ic} /> {mode === 'ios' ? 'How' : 'Install'}
                </button>
              )}

              {/* Where both are possible, install is the lesser offer — a plain
                  link, so it never competes with the one that does the work. */}
              {mode === 'notify' && deferred && result === null && (
                <button onClick={install} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB, fontSize: 12, fontWeight: 700, fontFamily: MANROPE, textDecoration: 'underline', padding: '0 2px' }}>
                  or install
                </button>
              )}

              <button onClick={dismiss} aria-label="Dismiss" style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB, display: 'flex', padding: 3 }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </>
          )}
        </div>

        {steps && mode === 'ios' && (
          <div style={{ maxWidth: 330, padding: '10px 12px', borderRadius: 12, background: '#fff', border: `1px solid ${JADE}22`, boxShadow: '0 6px 18px rgba(12,14,18,.10)', fontFamily: MANROPE }}>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: INK, lineHeight: 1.7 }}>
              {needsSafari && <li>Open <b>arapono.org.nz in Safari</b> — this browser can’t install it.</li>}
              <li>Tap <b>Share</b> <Share style={{ width: 12, height: 12, verticalAlign: '-1px' }} /> in Safari.</li>
              <li>Tap <b>Add to Home Screen</b> <SquarePlus style={{ width: 12, height: 12, verticalAlign: '-1px' }} />.</li>
              <li>Open it from your Home Screen, then turn alerts on.</li>
            </ol>
            <div style={{ fontSize: 11.5, color: SUB, marginTop: 8 }}>Arapono isn’t in the App Store — you add it from Safari.</div>
          </div>
        )}
      </div>
    </div>
  )
}

const ic: React.CSSProperties = { width: 14, height: 14 }
function pill(primary: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 999,
    border: primary ? 'none' : `1px solid ${JADE}2e`, background: primary ? JADE : '#fff',
    color: primary ? '#fff' : INK, fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
    fontFamily: MANROPE, whiteSpace: 'nowrap', textDecoration: 'none',
  }
}
