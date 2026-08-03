/**
 * instrumentation.ts — Next.js server/edge hooks. `onRequestError` fires for any
 * uncaught error while rendering a route or running a route handler, which is
 * exactly the "a page 500s for a real user and we never hear about it" case.
 * Routed to the dependency-free reporter (logs always; forwards to Sentry when a
 * DSN is set). See src/lib/observability/report.ts.
 */
import type { Instrumentation } from 'next'

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const { reportError } = await import('@/lib/observability/report')
  reportError(err, { route: request.path, method: request.method, phase: context.renderSource })
}
