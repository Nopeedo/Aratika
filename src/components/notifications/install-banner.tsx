'use client'

/**
 * InstallBanner — a slim, dismissible "install the app" strip for the homepage.
 * Only shows when the app is genuinely installable (Android/desktop Chrome has a
 * deferred prompt, or an iOS Safari tab that isn't installed yet). Dismissed
 * state is remembered, and it hides for good once the app is installed. Kept
 * deliberately compact so it never competes with the hero.
 */

import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'

const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const INK = '#0c0e12', SUB = '#5b6067', JADE = '#1F8A4C'
const DISMISS_KEY = 'arapono.install.dismissed'

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === '1') return
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as unknown as { standalone?: boolean }).standalone === true
    if (standalone) return

    const ua = navigator.userAgent
    const ios = /iP(hone|ad|od)/.test(ua) || (navigator.platform === 'MacIntel' && (navigator as unknown as { maxTouchPoints?: number }).maxTouchPoints! > 1)
    if (ios) { setIsIOS(true); setShow(true) }

    const onBIP = (e: Event) => { e.preventDefault(); setDeferred(e as BIPEvent); setShow(true) }
    window.addEventListener('beforeinstallprompt', onBIP)
    return () => window.removeEventListener('beforeinstallprompt', onBIP)
  }, [])

  function dismiss() { setShow(false); try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* private mode */ } }
  async function install() { if (!deferred) return; await deferred.prompt(); await deferred.userChoice; dismiss() }

  if (!show) return null

  return (
    <div style={{ background: 'transparent' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '10px clamp(14px, 5vw, 36px) 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px 10px 14px', borderRadius: 12, background: '#ecfdf5', border: `1px solid ${JADE}22`, fontFamily: MANROPE }}>
          <Download style={{ width: 18, height: 18, color: JADE, flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, color: INK, lineHeight: 1.4 }}>
            {isIOS
              ? <>Add Arapono to your Home Screen — tap <b>Share</b> <Share style={{ width: 12, height: 12, verticalAlign: '-1px' }} /> then <b>Add to Home Screen</b>.</>
              : <>Install the Arapono app for one-tap access and notifications.</>}
          </span>
          {deferred && (
            <button onClick={install} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 9, border: 'none', background: JADE, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: MANROPE, whiteSpace: 'nowrap', flexShrink: 0 }}>
              <Download style={{ width: 14, height: 14 }} /> Install
            </button>
          )}
          <button onClick={dismiss} aria-label="Dismiss" style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB, display: 'flex', flexShrink: 0, padding: 2 }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
    </div>
  )
}
