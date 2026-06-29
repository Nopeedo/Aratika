/**
 * Phased rollout control. Flip LAUNCH_PHASE to reveal more of the site.
 *
 * Nothing is deleted between phases — features are *gated*, not removed:
 *  - nav & footer links are filtered by isEnabled()
 *  - homepage sections render conditionally
 *  - gated public routes redirect to /coming-soon (see proxy.ts)
 *
 * Phase 1 = Election Central · Phase 2 = Accountability · Phase 3 = Engage & scale
 */

export type Phase = 1 | 2 | 3

export const LAUNCH_PHASE: Phase = 1

/**
 * Master switch for the paid tier. While false (pre-funding MVP) EVERYTHING is
 * free: all premium gates unlock and every "Premium"/"Upgrade" prompt is hidden.
 * Flip to true to bring the paywall back (Stripe wiring is untouched).
 */
export const PREMIUM_ENABLED = false

// The phase in which each feature becomes available.
export const FEATURE_PHASE: Record<string, Phase> = {
  // Phase 1 — Election Central (dashboard/command centre ships now as the centrepiece)
  elections: 1, battlegrounds: 1, map: 1, parties: 1, mps: 1, policies: 1,
  compare: 1, budget: 1, learn: 1, onboarding: 1, glossary: 1, about: 1, contact: 1, account: 1,
  dashboard: 1,
  // Bills tracker + plain-language readers — published in Phase 1.
  bills: 1, legislation: 1,
  // "Latest" — live election news feed — published in Phase 1.
  news: 1,
  // Phase 2 — Accountability
  parliament: 2, 'take-action': 2, premium: 2,
  // Phase 3 — Engage & scale
  companion: 3, polls: 3,
}

export function isEnabled(feature: string): boolean {
  const p = FEATURE_PHASE[feature]
  return p === undefined ? true : p <= LAUNCH_PHASE
}

// Public, feature-specific routes that should redirect to /coming-soon when their
// feature is gated. Auth/account/editor/onboarding routes are never listed here.
export const GATED_ROUTES: { prefix: string; feature: string }[] = [
  { prefix: '/parliament', feature: 'parliament' },
  { prefix: '/bills', feature: 'bills' },
  { prefix: '/legislation', feature: 'legislation' },
  { prefix: '/take-action', feature: 'take-action' },
  { prefix: '/news', feature: 'news' },
  { prefix: '/polls', feature: 'polls' },
  { prefix: '/subscription', feature: 'premium' },
]

export function isPathBlocked(pathname: string): boolean {
  const hit = GATED_ROUTES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + '/'))
  return hit ? !isEnabled(hit.feature) : false
}
