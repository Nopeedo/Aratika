'use client'

/**
 * GoogleSignIn — Google Identity Services (GIS) button that signs in with an ID
 * token via Supabase `signInWithIdToken`, instead of the redirect OAuth flow.
 *
 * Why: the redirect flow bounces through `<project>.supabase.co`, which (a) looks
 * untrustworthy on the consent screen and (b) on iOS opens in a webview that
 * doesn't share Safari's Google session, so the user has to retype their email.
 * GIS renders Google's own account picker using the DEVICE's Google session —
 * seamless on iOS — and never shows the supabase.co redirect screen.
 *
 * Progressive enhancement: if the public Google client id isn't configured, or
 * GIS fails to load / isn't supported, it silently falls back to the redirect
 * `GoogleButton`. So this is safe to ship before the env var + Google client
 * origins are set up — nothing changes until then.
 *
 * Also falls back for an installed PWA running in standalone display mode —
 * GIS's own origin check reliably throws Google's "origin_mismatch" error
 * there (confirmed on Android's installed-app/WebAPK shell) even when the
 * origin is correctly registered; this is a GIS/standalone-mode limitation,
 * not a config problem. The classic redirect flow doesn't hit that check (it
 * only relies on the Authorized Redirect URI), so it's reliable there instead.
 *

 * Setup required (one-time, outside the code):
 *   1. Vercel env: NEXT_PUBLIC_GOOGLE_CLIENT_ID = the OAuth *Web* client id
 *      (the same client id Supabase's Google provider uses).
 *   2. Google Cloud → that client's "Authorized JavaScript origins":
 *      https://arapono.org.nz  (and http://localhost:3000 for dev).
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GoogleButton } from './auth-ui'

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

// Installed home-screen app (Android WebAPK, or iOS "Add to Home Screen").
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone === true
}

// Minimal shape of the bits of GIS we call — avoids pulling in a types package.
interface GsiId {
  initialize(config: Record<string, unknown>): void
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void
}
declare global {
  interface Window { google?: { accounts?: { id?: GsiId } } }
}

const hex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return hex(digest)
}

function randomNonce(): string {
  const arr = new Uint8Array(32)
  crypto.getRandomValues(arr)
  return hex(arr)
}

function loadGis(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const existing = document.getElementById('gis-script') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('GIS failed to load')))
      return
    }
    const s = document.createElement('script')
    s.id = 'gis-script'
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('GIS failed to load'))
    document.head.appendChild(s)
  })
}

export function GoogleSignIn({ next = '/dashboard', onError }: { next?: string; onError?: (msg: string) => void }) {
  const router = useRouter()
  const hostRef = React.useRef<HTMLDivElement>(null)
  const rawNonceRef = React.useRef('')
  const [state, setState] = React.useState<'loading' | 'ready' | 'failed'>(CLIENT_ID ? 'loading' : 'failed')

  React.useEffect(() => {
    if (!CLIENT_ID || !window.crypto?.subtle || isStandalone()) { setState('failed'); return }
    let cancelled = false

    ;(async () => {
      await loadGis()
      const id = window.google?.accounts?.id
      if (cancelled || !id || !hostRef.current) { setState('failed'); return }

      const rawNonce = randomNonce()
      rawNonceRef.current = rawNonce
      const hashedNonce = await sha256Hex(rawNonce) // GIS gets the hash; Supabase gets the raw value.
      if (cancelled) return

      id.initialize({
        client_id: CLIENT_ID,
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
        callback: async (resp: { credential?: string }) => {
          if (!resp.credential) { onError?.('Google didn’t return a sign-in token — try again.'); return }
          const supabase = createClient()
          const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: resp.credential, nonce: rawNonceRef.current })
          if (error) { onError?.(error.message); return }
          router.push(next)
          router.refresh()
        },
      })

      hostRef.current.innerHTML = ''
      id.renderButton(hostRef.current, {
        type: 'standard', theme: 'outline', size: 'large',
        text: 'continue_with', shape: 'rectangular', logo_alignment: 'left',
        width: Math.min(400, Math.round(hostRef.current.offsetWidth) || 320),
      })
      if (!cancelled) setState('ready')
    })().catch(() => { if (!cancelled) setState('failed') })

    return () => { cancelled = true }
  }, [next, onError, router])

  // GIS unavailable / not configured → the proven redirect flow still works.
  if (state === 'failed') return <GoogleButton next={next} onError={onError} />

  return (
    <div style={{ position: 'relative', minHeight: 44, display: 'flex', justifyContent: 'center' }}>
      <div ref={hostRef} style={{ colorScheme: 'light', width: '100%', display: 'flex', justifyContent: 'center' }} />
      {state === 'loading' && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 10, border: '1px solid #e9e7e2', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#9aa0aa', fontFamily: 'var(--font-manrope), system-ui, sans-serif' }}>
          Loading Google…
        </div>
      )}
    </div>
  )
}
