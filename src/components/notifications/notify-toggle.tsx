'use client'

/**
 * NotifyToggle — the "turn on notifications" control. Handles every permission
 * state gracefully: unsupported browser, iOS-needs-install, denied (with the
 * fix), granted/subscribed, and the not-yet-subscribed call to action. Purely
 * client-side; it talks to /api/push/subscribe under the hood.
 */

import { useEffect, useState } from 'react'
import { Bell, BellOff, BellRing, Check, Smartphone, Loader2 } from 'lucide-react'
import { pushSupported, iosNeedsInstall, subscribeToPush, unsubscribeFromPush, isSubscribed } from '@/lib/notifications/push-client'
import { MANROPE } from '@/constants/theme'

const INK = '#0c0e12', SUB = '#5b6067', BORDER = '#e9e7e2', JADE = '#1F8A4C'

// Only render once the site's VAPID public key is configured (build-time env).
// Until then the whole control stays hidden rather than showing a dead button.
const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

type State = 'loading' | 'on' | 'off' | 'denied' | 'ios' | 'unsupported'

export function NotifyToggle() {
  const [state, setState] = useState<State>('loading')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!VAPID) return
    (async () => {
      if (iosNeedsInstall()) return setState('ios')
      if (!pushSupported()) return setState('unsupported')
      if (Notification.permission === 'denied') return setState('denied')
      setState((await isSubscribed()) ? 'on' : 'off')
    })()
  }, [])

  if (!VAPID) return null

  async function turnOn() {
    setBusy(true); setError(null)
    const r = await subscribeToPush()
    setBusy(false)
    if (r.ok) return setState('on')
    if (r.reason === 'ios_install') return setState('ios')
    if (r.reason === 'unsupported') return setState('unsupported')
    if (r.reason === 'denied') return setState('denied')
    if (r.reason === 'not_configured') return setError('Notifications aren’t switched on for the site yet — check back soon.')
    if (r.reason === 'auth') return setError('Please sign in first.')
    setError('Couldn’t turn on notifications. Please try again.')
  }

  async function turnOff() {
    setBusy(true); setError(null)
    await unsubscribeFromPush()
    setBusy(false); setState('off')
  }

  const [testMsg, setTestMsg] = useState<string | null>(null)
  async function sendTest() {
    setBusy(true); setTestMsg(null)
    try {
      const res = await fetch('/api/push/test', { method: 'POST' })
      const j = await res.json().catch(() => ({}))
      setTestMsg(res.ok ? (j.sent ? 'Sent — check your device 🔔' : 'No devices found for this account.') : 'Couldn’t send a test.')
    } catch { setTestMsg('Couldn’t send a test.') }
    setBusy(false)
  }

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px', background: '#fff', fontFamily: MANROPE }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 11, background: state === 'on' ? '#ecfdf5' : '#f4f6f8', flexShrink: 0 }}>
          {state === 'on' ? <BellRing style={{ width: 20, height: 20, color: JADE }} /> : <Bell style={{ width: 20, height: 20, color: SUB }} />}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: INK }}>Notifications</div>
          <p style={{ fontSize: 13.5, color: SUB, lineHeight: 1.5, margin: '3px 0 0' }}>
            Get a heads-up when something you follow moves — a bill you track advances, or there’s big news on a party you follow.
          </p>

          {state === 'ios' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12, padding: '10px 12px', borderRadius: 10, background: '#f4f6f8' }}>
              <Smartphone style={{ width: 16, height: 16, color: SUB, flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: SUB, lineHeight: 1.5 }}>On iPhone or iPad, tap <b>Share → Add to Home Screen</b> first, open Arapono from your Home Screen, then turn notifications on here.</span>
            </div>
          )}
          {state === 'denied' && (
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: '#fef2f2', fontSize: 13, color: '#991b1b', lineHeight: 1.5 }}>
              Notifications are blocked in your browser settings for this site. Re-allow them there, then reload.
            </div>
          )}
          {state === 'unsupported' && (
            <div style={{ marginTop: 12, fontSize: 13, color: SUB }}>Your browser doesn’t support notifications. Try Chrome, Edge, or an installed app.</div>
          )}
          {error && <div style={{ marginTop: 10, fontSize: 13, color: '#991b1b' }}>{error}</div>}

          {(state === 'off' || state === 'on') && (
            <div style={{ marginTop: 14 }}>
              {state === 'off' ? (
                <button onClick={turnOn} disabled={busy} style={btn(true)}>
                  {busy ? <Loader2 className="live-dot" style={ic} /> : <Bell style={ic} />} Turn on notifications
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, color: JADE }}><Check style={ic} /> On for this device</span>
                  <button onClick={sendTest} disabled={busy} style={btn(false)}>
                    {busy ? <Loader2 className="live-dot" style={ic} /> : <BellRing style={ic} />} Send a test
                  </button>
                  <button onClick={turnOff} disabled={busy} style={btn(false)}>
                    {busy ? <Loader2 className="live-dot" style={ic} /> : <BellOff style={ic} />} Turn off
                  </button>
                  {testMsg && <span style={{ fontSize: 13, color: SUB, width: '100%' }}>{testMsg}</span>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ic: React.CSSProperties = { width: 15, height: 15 }
function btn(primary: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11,
    fontFamily: MANROPE, fontSize: 14, fontWeight: 800, cursor: 'pointer',
    border: primary ? 'none' : `1px solid ${BORDER}`,
    background: primary ? INK : '#fff', color: primary ? '#fff' : SUB,
  }
}
