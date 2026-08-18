/**
 * instrumentation-client.ts — Next.js client hook. Runs in the browser before
 * the app hydrates, which makes it the one place that can catch errors thrown
 * *after* render: a click handler that blows up, a fetch that rejects with
 * nobody awaiting it, a third-party script failing.
 *
 * Without this we only saw server-render errors (instrumentation.ts) and full
 * render crashes (global-error.tsx). Neither fires when the map's geocoder
 * rejects or a filter handler throws — the page keeps working well enough that
 * the reader just sees nothing happen, and we hear nothing at all. On a site
 * whose main features are interactive, that is most of the real error surface.
 *
 * Routed to the same dependency-free reporter as the server hooks: always logs,
 * forwards to Sentry only when NEXT_PUBLIC_SENTRY_DSN is set.
 * See src/lib/observability/report.ts.
 */
import { reportError } from '@/lib/observability/report'

/**
 * Errors worth nobody's attention. Reporting is only useful if the signal
 * survives, and these three drown it:
 *
 *  - "Script error." is what the browser gives us for a cross-origin script it
 *    won't describe. In practice that is nearly always a browser extension
 *    running in the reader's page, not our code. No message, no stack, nothing
 *    to act on.
 *  - The ResizeObserver loop warnings are benign by spec — the browser simply
 *    defers the callback to the next frame. Chrome reports them as errors
 *    anyway, and our map and tile rows resize constantly.
 *  - Aborted fetches are our own cleanup: navigating away mid-request rejects
 *    the in-flight promise on purpose.
 */
const IGNORED = [
  /^Script error\.?$/i,
  /ResizeObserver loop/i,
  /aborted/i, // "signal is aborted", "The user aborted a request"
  /Failed to fetch dynamically imported module/i, // a deploy landed mid-session; a reload fixes it
]

// Sentry's free tier is metered in events, so one error inside a render loop
// could spend a month's quota in a minute. Cap the volume per page load and
// never send the same message twice — a bug that fires 400 times is the same
// bug, and the first report already told us about it.
const MAX_EVENTS_PER_PAGE = 10
const seen = new Set<string>()
let sent = 0

// Aborts arrive as a DOMException whose *name* is "AbortError" while its message
// is something like "signal is aborted" — matching only on the message let every
// cancelled fetch through.
const IGNORED_NAMES = new Set(['AbortError'])

function report(error: unknown, context: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error)
  const name = error instanceof Error ? error.name : ''
  if (IGNORED_NAMES.has(name)) return
  if (IGNORED.some((re) => re.test(message))) return
  if (seen.has(message)) return
  if (sent >= MAX_EVENTS_PER_PAGE) return
  seen.add(message)
  sent++
  reportError(error, { ...context, url: location.pathname + location.search })
}

// Uncaught exceptions — thrown from event handlers, timers, callbacks.
window.addEventListener('error', (event) => {
  // A failed <img>/<script>/<link> also fires "error" on the element and bubbles
  // here with no `error` property. Those are asset problems, not exceptions.
  if (!event.error) {
    const el = event.target as HTMLElement | null
    const src = (el as HTMLImageElement | HTMLScriptElement | null)?.src
    if (el && el !== (window as unknown as HTMLElement) && src) {
      report(new Error(`Failed to load ${el.tagName.toLowerCase()}: ${src}`), { kind: 'resource' })
    }
    return
  }
  report(event.error, { kind: 'uncaught', source: event.filename, line: event.lineno })
}, true) // capture phase — resource errors do not bubble

// Rejected promises nobody handled: `void fetch(...)`, an async handler that
// throws, an await chain with no catch.
window.addEventListener('unhandledrejection', (event) => {
  report(event.reason, { kind: 'unhandledrejection' })
})

