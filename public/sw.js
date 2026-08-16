/* Arapono service worker — Web Push + basic PWA shell.
 *
 * Kept dependency-free and minimal: it exists mainly to receive push messages
 * and show notifications (required for Web Push to work at all, including on
 * iOS 16.4+ installed PWAs). Offline caching can be added later; not needed for
 * notifications. */

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Show a notification when a push arrives.
self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { title: 'Arapono', body: event.data ? event.data.text() : '' }
  }

  const title = payload.title || 'Arapono'
  const tag = payload.tag || undefined
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon-192.png',
    badge: '/icon-192.png',
    // Same tag collapses onto an earlier notification instead of stacking —
    // which is what we want, since every digest carries tag 'n-digest' and a
    // pile of them would be worse than one.
    tag,
    // But a replacement is SILENT by default: it swaps the text in place with
    // no banner and no sound. The second digest and every one after it landed
    // in the notification centre unannounced, which read as "notifications
    // aren't working". renotify makes a replacement alert again; the spec
    // requires a tag alongside it, hence the guard.
    renotify: tag ? true : undefined,
    data: { url: payload.url || '/' },
    requireInteraction: false,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Focus an existing tab on the target URL, or open a new one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
