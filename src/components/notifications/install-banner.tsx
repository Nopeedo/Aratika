'use client'

/**
 * InstallBanner — a compact, dismissible "install the app" PILL, right-aligned
 * just above the party tiles. Only shows when the app is genuinely installable
 * (Android/desktop Chrome has a deferred prompt, or an iOS Safari tab that isn't
 * installed). Remembers dismissal; hides once installed. Deliberately small so
 * it sits beside the tiles without competing with the hero.
 */

import { useEffect, useState } from 'react'
import { Download, Share, SquarePlus, X } from 'lucide-react'
import { INK, JADE, MANROPE } from '@/constants/theme'

const SUB = '#5b6067'
const DISMISS_KEY = 'arapono.install.dismissed'

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [needsSafari, setNeedsSafari] = useState(false)
  const [show, setShow] = useState(false)
  const [hint, setHint] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === '1') return
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as unknown as { standalone?: boolean }).standalone === true
    if (standalone) return

    const ua = navigator.userAgent
    const ios = /iP(hone|ad|od)/.test(ua) || (navigator.platform === 'MacIntel' && (navigator as unknown as { maxTouchPoints?: number }).maxTouchPoints! > 1)
    if (ios) {
      setIsIOS(true); setShow(true)
      const inApp = /FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|Pinterest|LinkedInApp|Messenger|MicroMessenger/i.test(ua)
      if (inApp || /CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)) setNeedsSafari(true)
    }

    const onBIP = (e: Event) => { e.preventDefault(); setDeferred(e as BIPEvent); setShow(true) }
    window.addEventListener('beforeinstallprompt', onBIP)
    return () => window.removeEventListener('beforeinstallprompt', onBIP)
  }, [])

  function dismiss() { setShow(false); try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* private mode */ } }
  async function tap() {
    if (deferred) { await deferred.prompt(); await deferred.userChoice; dismiss() }
    else setHint((v) => !v)
  }

  if (!show) return null

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 clamp(18px, 5vw, 36px)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ecfdf5', border: `1px solid ${JADE}2e`, borderRadius: 999, padding: '4px 6px 4px 4px', boxShadow: '0 1px 3px rgba(12,14,18,.06)', fontFamily: MANROPE }}>
          <button onClick={tap} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 999, border: 'none', background: JADE, color: '#fff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: MANROPE, whiteSpace: 'nowrap' }}>
            <Download style={{ width: 14, height: 14 }} /> {isIOS ? 'Get the app' : 'Install app'}
          </button>
          <button onClick={dismiss} aria-label="Dismiss" style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB, display: 'flex', padding: 3 }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {hint && isIOS && (
          <div style={{ maxWidth: 320, padding: '10px 12px', borderRadius: 12, background: '#fff', border: `1px solid ${JADE}22`, boxShadow: '0 6px 18px rgba(12,14,18,.10)', fontFamily: MANROPE }}>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: INK, lineHeight: 1.7 }}>
              {needsSafari && <li>Open <b>arapono.org.nz in Safari</b> (this browser can&rsquo;t install it).</li>}
              <li>Tap <b>Share</b> <Share style={{ width: 12, height: 12, verticalAlign: '-1px' }} /> in Safari.</li>
              <li>Tap <b>Add to Home Screen</b> <SquarePlus style={{ width: 12, height: 12, verticalAlign: '-1px' }} />.</li>
            </ol>
            <div style={{ fontSize: 11.5, color: SUB, marginTop: 8 }}>Arapono isn&rsquo;t in the App Store — you add it from Safari.</div>
          </div>
        )}
      </div>
    </div>
  )
}
