/**
 * push-client — browser-side Web Push helpers. Registers the service worker,
 * requests notification permission, subscribes via the Push API, and syncs the
 * subscription to /api/push/subscribe. All functions are safe to import in a
 * client component; they guard on browser support.
 */

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

export function pushSupported(): boolean {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
}

/** True on an iPhone/iPad Safari tab that is NOT yet installed to the Home
 *  Screen — where Web Push can't work until the user adds it. */
export function iosNeedsInstall(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent
  const isIOS = /iP(hone|ad|od)/.test(ua) || (navigator.platform === 'MacIntel' && (navigator as unknown as { maxTouchPoints?: number }).maxTouchPoints! > 1)
  const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
  return isIOS && !standalone && !pushSupported()
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const buffer = new ArrayBuffer(raw.length)
  const arr = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

/** Register the service worker (idempotent). Safe to call on every page load. */
export async function registerServiceWorker(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  try { await navigator.serviceWorker.register('/sw.js') } catch { /* ignore */ }
}

export type SubscribeResult =
  | { ok: true }
  | { ok: false; reason: 'unsupported' | 'ios_install' | 'not_configured' | 'denied' | 'default' | 'save_failed' | 'auth' }

/** Request permission, subscribe, and persist to the server. */
export async function subscribeToPush(): Promise<SubscribeResult> {
  if (iosNeedsInstall()) return { ok: false, reason: 'ios_install' }
  if (!pushSupported()) return { ok: false, reason: 'unsupported' }
  if (!VAPID_PUBLIC) return { ok: false, reason: 'not_configured' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, reason: permission === 'denied' ? 'denied' : 'default' }

  const reg = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    })
  }

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ subscription: sub.toJSON(), userAgent: navigator.userAgent }),
  })
  if (res.status === 401) return { ok: false, reason: 'auth' }
  if (!res.ok) return { ok: false, reason: 'save_failed' }
  return { ok: true }
}

/** Remove this device's subscription (server + browser). */
export async function unsubscribeFromPush(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return
  await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`, { method: 'DELETE' }).catch(() => {})
  await sub.unsubscribe().catch(() => {})
}

/** Whether this browser currently has an active push subscription. */
export async function isSubscribed(): Promise<boolean> {
  if (!pushSupported()) return false
  const reg = await navigator.serviceWorker.getRegistration()
  return !!(await reg?.pushManager.getSubscription())
}
