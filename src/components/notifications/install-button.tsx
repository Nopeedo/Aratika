'use client'

/**
 * InstallButton — a smart "Install Arapono" control.
 *  - Android / desktop Chrome: captures the browser's `beforeinstallprompt`
 *    event and fires the native install dialog on tap.
 *  - iOS Safari: can't be triggered programmatically, so it shows the
 *    "Share → Add to Home Screen" steps.
 *  - Hides itself entirely if the app is already installed, or if the browser
 *    can't install it and it isn't iOS.
 * Installing also unlocks Web Push on iOS, so this doubles as notification onboarding.
 */

import { useEffect, useState } from 'react'
import { Download, Share, SquarePlus, X, Check } from 'lucide-react'

const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const INK = '#0c0e12', SUB = '#5b6067', BORDER = '#e9e7e2', JADE = '#1F8A4C'

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

export function InstallButton() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [showIOS, setShowIOS] = useState(false)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as unknown as { standalone?: boolean }).standalone === true
    if (standalone) { setInstalled(true); return }

    const ua = navigator.userAgent
    const ios = /iP(hone|ad|od)/.test(ua) || (navigator.platform === 'MacIntel' && (navigator as unknown as { maxTouchPoints?: number }).maxTouchPoints! > 1)
    setIsIOS(ios)

    const onBIP = (e: Event) => { e.preventDefault(); setDeferred(e as BIPEvent) }
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onBIP)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  if (installed) return null
  // Nothing to offer: not installable here and not iOS.
  if (!deferred && !isIOS) return null

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px', background: '#fff', fontFamily: MANROPE }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 11, background: '#ecfdf5', flexShrink: 0 }}>
          <Download style={{ width: 20, height: 20, color: JADE }} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: INK }}>Install the Arapono app</div>
          <p style={{ fontSize: 13.5, color: SUB, lineHeight: 1.5, margin: '3px 0 0' }}>
            Add Arapono to your home screen — opens like an app, and lets you get notifications{isIOS ? ' (required on iPhone)' : ''}.
          </p>

          <div style={{ marginTop: 14 }}>
            {deferred ? (
              <button onClick={install} style={btn(true)}><Download style={ic} /> Install app</button>
            ) : (
              <button onClick={() => setShowIOS((v) => !v)} style={btn(true)}><Share style={ic} /> How to add to Home Screen</button>
            )}
          </div>

          {showIOS && isIOS && (
            <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 12, background: '#f4f6f8', position: 'relative' }}>
              <button onClick={() => setShowIOS(false)} aria-label="Close" style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: SUB }}><X style={{ width: 15, height: 15 }} /></button>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: INK, lineHeight: 1.7 }}>
                <li>Tap the <b>Share</b> button <Share style={{ width: 13, height: 13, verticalAlign: '-2px' }} /> at the bottom of Safari.</li>
                <li>Scroll down and tap <b>Add to Home Screen</b> <SquarePlus style={{ width: 13, height: 13, verticalAlign: '-2px' }} />.</li>
                <li>Tap <b>Add</b> — then open Arapono from your Home Screen.</li>
              </ol>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12.5, color: JADE, fontWeight: 700 }}>
                <Check style={{ width: 14, height: 14 }} /> Then you can turn on notifications.
              </div>
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
    border: primary ? 'none' : `1px solid ${BORDER}`, background: primary ? INK : '#fff', color: primary ? '#fff' : SUB,
  }
}
