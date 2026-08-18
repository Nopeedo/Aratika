/**
 * report.ts — minimal, dependency-free error reporting (issue: "zero error
 * tracking").
 *
 * Always logs a structured error (Vercel captures server + edge console output,
 * so this alone gives visibility we didn't have before). If NEXT_PUBLIC_SENTRY_DSN
 * is set, it also POSTs the event to Sentry's ingest API directly — no SDK, so
 * nothing to break on a Next.js major bump. Isomorphic: safe from server, edge,
 * and client (the error boundary).
 *
 * This is deliberately bare-bones (message + stack + a little context). When the
 * @sentry/nextjs SDK officially supports this Next version, swapping to it adds
 * source-mapped stacks, breadcrumbs and performance — but this covers the core
 * need today: see the errors real users actually hit.
 */

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

// Parse a Sentry DSN → { url, key, dsn } for the ingest endpoint. Returns null if unset/invalid.
function parseDsn(dsn: string | undefined): { url: string; key: string; dsn: string } | null {
  if (!dsn) return null
  try {
    const u = new URL(dsn)
    const projectId = u.pathname.replace(/^\//, '')
    if (!u.username || !projectId) return null
    // The envelope endpoint, not the legacy /store/ one. Sentry deprecated
    // /store/ and newer projects can refuse it outright — and since we never
    // see the response body, that refusal would look exactly like success.
    return { url: `${u.protocol}//${u.host}/api/${projectId}/envelope/`, key: u.username, dsn }
  } catch {
    return null
  }
}

const target = parseDsn(DSN)

// One transport complaint per page load / per server instance — see below.
let warned = false

export function reportError(error: unknown, context?: Record<string, unknown>) {
  const err = error instanceof Error ? error : new Error(String(error))
  // Always log — structured, so it's greppable in Vercel/runtime logs.
  console.error('[reportError]', err.message, { stack: err.stack, ...context })

  if (!target) return
  const event = {
    event_id: crypto.randomUUID().replace(/-/g, ''),
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    level: 'error',
    environment: process.env.NODE_ENV,
    exception: { values: [{ type: err.name, value: err.message, stacktrace: { frames: [] } }] },
    extra: { stack: err.stack, ...context },
  }
  // Envelope format: three newline-delimited JSON lines — header, item header,
  // then the event itself.
  const body = [
    JSON.stringify({ event_id: event.event_id, sent_at: new Date().toISOString(), dsn: target.dsn }),
    JSON.stringify({ type: 'event' }),
    JSON.stringify(event),
  ].join('\n')

  // Fire-and-forget; never let reporting throw into the caller. But DO check the
  // reply once: silently swallowing a 400 from Sentry is how you end up trusting
  // an empty dashboard. Complaining once per page load is enough to notice, and
  // little enough to ignore.
  void fetch(target.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-sentry-envelope',
      'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=arapono-lite/1.0, sentry_key=${target.key}`,
    },
    body,
  })
    .then((res) => {
      if (!res.ok && !warned) {
        warned = true
        console.warn(`[reportError] Sentry rejected the event (HTTP ${res.status}). Errors are being logged but NOT forwarded — check NEXT_PUBLIC_SENTRY_DSN.`)
      }
    })
    .catch(() => {
      if (!warned) {
        warned = true
        console.warn('[reportError] could not reach Sentry — errors are logged but not forwarded.')
      }
    })
}
