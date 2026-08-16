'use client'

/**
 * SWRegister — registers the service worker once on load, app-wide. Required for
 * the PWA (installable) and for Web Push. Renders nothing.
 */

import { useEffect } from 'react'
import { registerServiceWorker, resyncSubscription } from '@/lib/notifications/push-client'

export function SWRegister() {
  useEffect(() => {
    registerServiceWorker()
    // Repairs anyone whose browser holds a subscription the server never
    // recorded — the state everyone who tried to turn notifications on before
    // the push tables were granted is stuck in. Mounted app-wide, so it heals
    // them on whatever page they happen to land on. Once per session, and a
    // no-op for everyone already recorded.
    resyncSubscription()
  }, [])
  return null
}
