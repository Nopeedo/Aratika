'use client'

/**
 * SWRegister — registers the service worker once on load, app-wide. Required for
 * the PWA (installable) and for Web Push. Renders nothing.
 */

import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/notifications/push-client'

export function SWRegister() {
  useEffect(() => { registerServiceWorker() }, [])
  return null
}
