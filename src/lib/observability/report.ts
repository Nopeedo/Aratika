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

// Parse a Sentry DSN → { url, key } for the store endpoint. Returns null if unset/invalid.
function parseDsn(dsn: string | undefined): { url: string; key: string } | null {
  if (!dsn) return null
  try {
    const u = new URL(dsn)
    const projectId = u.pathname.replace(/^\//, '')
    if (!u.username || !projectId) return null
    return { url: `${u.protocol}//${u.host}/api/${projectId}/store/`, key: u.username }
  } catch {
    return null
  }
}

const target = parseDsn(DSN)

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
  // Fire-and-forget; never let reporting throw into the caller.
  void fetch(target.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=arapono-lite/1.0, sentry_key=${target.key}`,
    },
    body: JSON.stringify(event),
  }).catch(() => { /* swallow — reporting must never break the app */ })
}
