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
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.tag || undefined, // same tag collapses/replaces an earlier one
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
