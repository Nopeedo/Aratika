'use client'

/**
 * InstallButton — a smart "Install Politika" control.
 *  - Android / desktop Chrome: captures the browser's `beforeinstallprompt`
 *    event and fires the native install dialog on tap.
 *  - iOS Safari: can't be triggered programmatically, so it shows the
 *    "Share → Add to Home Screen" steps.
 *  - Hides itself entirely if the app is already installed, or if the browser
 *    can't install it and it isn't iOS.
 * Installing also unlocks Web Push on iOS, so this doubles as notification onboarding.
 *
 * THE ONE CASE IT CANNOT WORK OUT: iPhone, already added to the Home Screen,
 * now browsing in Safari. `display-mode: standalone` is false in a Safari tab,
 * iOS fires no `appinstalled` event, and a Home Screen web app gets its own
 * storage partition — so a flag written inside the installed app is not
 * readable from Safari. There is no signal at all, and the card would go on
 * explaining how to add something they added last week.
 *
 * Chrome needs no equivalent: it stops firing `beforeinstallprompt` once the
 * app is installed, so the card disappears on its own. This is iOS-only.
 *
 * So the card asks. "I've already added it" is a reader telling us the thing
 * we cannot detect, and it is remembered per browser. It is offered on the
 * `hero` variant only — see the note on DISMISS_KEY.
 */

import { useEffect, useState } from 'react'
import { Download, Share, SquarePlus, X, Check, Bell } from 'lucide-react'
import { BORDER, INK, JADE, MANROPE } from '@/constants/theme'
import { stashedInstallPrompt, type InstallPromptEvent as BIPEvent } from '@/lib/pwa/install-prompt'

const SUB = '#5b6067'

/**
 * "I've already added it", remembered per browser.
 *
 * Deliberately honoured by the `hero` variant and IGNORED by `panel`. The
 * homepage card follows you around and should take no for an answer; the
 * /settings panel is somewhere you went looking for, and leaving it there is
 * what makes this dismissal safe — tap it by mistake, or get a new phone, and
 * the instructions are still where you would go to find them. Nothing else
 * could bring them back, since the flag is unreadable from the installed app.
 */
const DISMISS_KEY = 'politika.install.dismissed'

/**
 * `panel` (default) is the compact control on /settings.
 * `hero` is the homepage section — bigger, jade, and leading with the reason
 * rather than the mechanism.
 *
 * One component, not two, because the decision that matters is "can this
 * browser install, and is it already installed" — and that returning null has
 * to be made once. A separate homepage section would have rendered its heading
 * over an empty space for anyone already installed.
 */
export function InstallButton({ variant = 'panel' }: { variant?: 'panel' | 'hero' } = {}) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [showIOS, setShowIOS] = useState(false)
  const [needsSafari, setNeedsSafari] = useState(false)
  const [saidInstalled, setSaidInstalled] = useState(false)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as unknown as { standalone?: boolean }).standalone === true
    if (standalone) { setInstalled(true); return }

    // Set in the same pass as isIOS below, so React batches them into one
    // render and the card never flashes up before being dismissed.
    try { if (localStorage.getItem(DISMISS_KEY) === '1') setSaidInstalled(true) } catch { /* private mode */ }

    const ua = navigator.userAgent
    const ios = /iP(hone|ad|od)/.test(ua) || (navigator.platform === 'MacIntel' && (navigator as unknown as { maxTouchPoints?: number }).maxTouchPoints! > 1)
    setIsIOS(ios)
    // On iOS, Add-to-Home-Screen only works in Safari — not Chrome/Firefox on
    // iOS, and not the in-app browsers inside Facebook / Instagram / Gmail etc.
    const inApp = /FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|Pinterest|LinkedInApp|Messenger|MicroMessenger/i.test(ua)
    const iosOtherBrowser = ios && /CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)
    if (ios && (inApp || iosOtherBrowser)) setNeedsSafari(true)

    // The event may already have happened: it fires once, early, and on a
    // repeat visit it can beat hydration. The inline script in layout.tsx holds
    // it for us. Read the stash AND keep listening — this covers the event
    // landing on either side of hydration, and neither path alone does.
    const early = stashedInstallPrompt()
    if (early) setDeferred(early)

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

  function dismiss() {
    setSaidInstalled(true)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* private mode */ }
  }

  if (installed) return null
  // Nothing to offer: not installable here and not iOS.
  if (!deferred && !isIOS) return null
  // They told us what the browser could not. Homepage only — see DISMISS_KEY.
  if (variant === 'hero' && saidInstalled) return null

  if (variant === 'hero') {
    return (
      <section style={{ background: 'transparent' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '8px clamp(18px, 5vw, 36px) 20px' }}>
          <div style={{
            background: JADE, borderRadius: 20, padding: 'clamp(26px, 5vw, 34px)',
            fontFamily: MANROPE, display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,.17)', color: '#fff', fontSize: 12, fontWeight: 800 }}>
                <Bell style={{ width: 13, height: 13 }} /> Election alerts
              </span>
              <span style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,.17)', color: '#fff', fontSize: 12, fontWeight: 800 }}>
                No app store
              </span>
            </div>

            <h2 style={{ fontSize: 'clamp(23px, 4vw, 30px)', fontWeight: 800, letterSpacing: '-.02em', color: '#fff', margin: 0, lineHeight: 1.15 }}>
              Put Politika on your phone
            </h2>

            {/* Leads with the reason, not the mechanism. "Install our app" is a
                request; this is the only route to alerts, which is a reason. */}
            <p style={{ fontSize: 'clamp(14.5px, 2vw, 16px)', fontWeight: 500, color: 'rgba(255,255,255,.88)', lineHeight: 1.6, margin: 0, maxWidth: 520 }}>
              {needsSafari
                ? <>Open <b style={{ color: '#fff' }}>politika.nz in Safari</b> to add it — this browser can&rsquo;t. It&rsquo;s the only way to get alerts when something you follow changes.</>
                : <>It installs straight from your browser in a couple of taps, and it&rsquo;s the only way to get alerts when something you follow changes.</>}
            </p>

            <div style={{ marginTop: 2 }}>
              {deferred ? (
                <button onClick={install} style={heroBtn}><Download style={ic} /> Install Politika</button>
              ) : (
                <button onClick={() => setShowIOS((v) => !v)} style={heroBtn}>
                  <Share style={ic} /> {needsSafari ? 'How to install on iPhone' : 'How to add to Home Screen'}
                </button>
              )}
            </div>

            {showIOS && isIOS && (
              <div style={{ marginTop: 4, padding: '14px 16px', borderRadius: 13, background: 'rgba(255,255,255,.13)', position: 'relative' }}>
                <button onClick={() => setShowIOS(false)} aria-label="Close" style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.75)' }}>
                  <X style={{ width: 15, height: 15 }} />
                </button>
                <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: '#fff', lineHeight: 1.7 }}>
                  {needsSafari && <li>Open <b>politika.nz in Safari</b> first — this in-app browser can&rsquo;t install.</li>}
                  <li>Tap <b>Share</b> <Share style={{ width: 13, height: 13, verticalAlign: '-2px' }} /> (the box with an &uarr;).</li>
                  <li>Scroll down, tap <b>Add to Home Screen</b> <SquarePlus style={{ width: 13, height: 13, verticalAlign: '-2px' }} />, then <b>Add</b>.</li>
                  <li>Open Politika from your Home Screen.</li>
                </ol>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12.5, color: '#fff', fontWeight: 700 }}>
                  <Check style={{ width: 14, height: 14 }} /> Then you can turn on alerts.
                </div>
              </div>
            )}

            {/* Last, and quiet: it is a correction, not an alternative to the
                button above it. Offered on iOS only, because iOS is the only
                place the card cannot work it out for itself — beside a working
                Install button it would read as a second, contradictory option. */}
            {isIOS && (
              <div>
                <button
                  onClick={dismiss}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    background: 'none', border: 'none', padding: '6px 0', cursor: 'pointer',
                    fontFamily: MANROPE, fontSize: 13.5, fontWeight: 700,
                    color: 'rgba(255,255,255,.82)', textDecoration: 'underline',
                    textUnderlineOffset: 3,
                  }}
                >
                  <Check style={{ width: 14, height: 14 }} /> I&rsquo;ve already added it
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px', background: '#fff', fontFamily: MANROPE }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 11, background: '#ecfdf5', flexShrink: 0 }}>
          <Download style={{ width: 20, height: 20, color: JADE }} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: INK }}>Install the Politika app</div>
          <p style={{ fontSize: 13.5, color: SUB, lineHeight: 1.5, margin: '3px 0 0' }}>
            {needsSafari
              ? <>There&rsquo;s no App Store download. On iPhone you add it straight from <b>Safari</b>. This browser can&rsquo;t, so open <b>politika.nz in Safari</b> first.</>
              : <>Add Politika to your home screen. It opens like an app, and lets you get notifications{isIOS ? ' (required on iPhone)' : ''}. It&rsquo;s not an App Store download.</>}
          </p>

          <div style={{ marginTop: 14 }}>
            {deferred ? (
              <button onClick={install} style={btn(true)}><Download style={ic} /> Install app</button>
            ) : (
              <button onClick={() => setShowIOS((v) => !v)} style={btn(true)}><Share style={ic} /> {needsSafari ? 'How to install on iPhone' : 'How to add to Home Screen'}</button>
            )}
          </div>

          {showIOS && isIOS && (
            <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 12, background: '#f4f6f8', position: 'relative' }}>
              <button onClick={() => setShowIOS(false)} aria-label="Close" style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: SUB }}><X style={{ width: 15, height: 15 }} /></button>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: INK, lineHeight: 1.7 }}>
                {needsSafari && <li>First open <b>politika.nz in Safari</b> (this in-app browser can&rsquo;t install). Tap the <b>•••</b> or share icon → <b>Open in Safari</b>.</li>}
                <li>In Safari, tap the <b>Share</b> button <Share style={{ width: 13, height: 13, verticalAlign: '-2px' }} /> (the box with an ↑).</li>
                <li>Scroll down, tap <b>Add to Home Screen</b> <SquarePlus style={{ width: 13, height: 13, verticalAlign: '-2px' }} />, then <b>Add</b>.</li>
                <li>Open Politika from your Home Screen. It now behaves like an app.</li>
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

const heroBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44,
  padding: '12px 22px', borderRadius: 13, fontFamily: MANROPE,
  fontSize: 15.5, fontWeight: 800, cursor: 'pointer', border: 'none',
  background: '#fff', color: INK,
}
