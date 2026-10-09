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

/**
 * Master switch for the results on /battlegrounds ("Live results 2026").
 * Flipped by hand on election night — not tied to a date, so nothing goes
 * live by itself.
 *
 * While false the page still exists at its URL and says what it is: its
 * title, when it opens (7pm on election day, from the Commission's timetable)
 * and what it will show. Only the results area is hidden. The nav links to
 * it as "Live results 2026", so the off state has to stand on its own.
 */
export const LIVE_RESULTS_ENABLED = false

/**
 * The pledge to vote. ON since 9 October 2026.
 *
 * Flipped by hand, like LIVE_RESULTS_ENABLED, so nothing goes live on its own.
 * A counter that opens at zero to an empty room reads as a failed campaign, so
 * this waits for the traffic rather than the traffic waiting for it.
 *
 * While false: the homepage card does not render, and /api/pledge refuses every
 * method. Gating the UI alone would leave the endpoint open, and anything POSTed
 * to it before launch would be in the published total on day one — the number
 * has to start at a real zero.
 *
 * Nothing else is removed. The table, the route and the component are all intact
 * and the migration can be applied whenever; flipping this to true is the whole
 * release.
 */
export const PLEDGE_ENABLED = true

/**
 * Whether the pledge card also appears on the HOMEPAGE. Paused by request.
 *
 * Separate from PLEDGE_ENABLED on purpose: the campaign is live at /pledge and
 * on the /links bio page regardless. This only controls the homepage placement,
 * so the card can come and go without taking the pledge itself down or
 * invalidating a link already in a bio.
 */
export const PLEDGE_ON_HOMEPAGE = false

/**
 * Donations. ON since 30 Sep 2026.
 *
 * They were paused on 29 Sep because the owner did not want Onebyone Project
 * processing them, and the condition written here for turning them back on was
 * that the payment move off Onebyone. It has: 8bbc4f7 put checkout on
 * Politika's own Stripe account, so the card statement reads POLITIKA, and
 * a627fe3/b8b51f7 moved the receipt to the webhook with a claim/release guard
 * so it cannot double-send.
 *
 * With this true the Donate buttons show (top bar, footer, phone menu) and
 * /api/donate/checkout accepts. It still needs STRIPE_SECRET_KEY to be a LIVE
 * key on Politika's own account in production, and STRIPE_WEBHOOK_SECRET to be
 * the signing secret of the live endpoint — the flag does not check either, so
 * a wrong key here is a failed checkout or money in the wrong account.
 */
export const DONATIONS_ENABLED = true

// The phase in which each feature becomes available.
export const FEATURE_PHASE: Record<string, Phase> = {
  // Phase 1 — Election Central (dashboard/command centre ships now as the centrepiece)
  elections: 1, battlegrounds: 1, map: 1, parties: 1, mps: 1, policies: 1,
  compare: 1, learn: 1, onboarding: 1, glossary: 1, about: 1, contact: 1, account: 1,
  dashboard: 1,
  // Bills tracker + plain-language readers — published in Phase 1.
  bills: 1, legislation: 1,
  // "Latest" — live election news feed — published in Phase 1.
  news: 1,
  // Take Action — the drafting tools — published in Phase 1.
  //
  // It was sitting in Phase 2 while the things that link INTO it shipped in
  // Phase 1, so those links dead-ended at /coming-soon: the "Write to your MP"
  // button on every MP profile, and the "have your say" links on bill pages
  // pointing at /take-action/submission while a select committee was actually
  // taking submissions. Writing to your MP is the most basic civic act the site
  // can support, and it was the one thing a reader could not do.
  //
  // Nothing had to be built for this. The studio, the four templates and the
  // letter assembly were finished; PREMIUM_ENABLED is false so the gate inside
  // the studio already opened for everyone. Only the phase number was wrong.
  'take-action': 1,
  // Phase 2 — Accountability
  parliament: 2, premium: 2,
  // Budget 2026 — hidden and disabled by request (was Phase 1): out of the
  // menu, footer and explore rail, and /budget goes to /coming-soon. Nothing
  // on the page was removed; set this back to 1 to bring it back.
  budget: 2,
  // Phase 3 — Engage & scale
  companion: 3, polls: 3,
}

export function isEnabled(feature: string): boolean {
  // Not a phase: the Live results 2026 links (menu, footer, explore rail)
  // follow the hand-flipped switch, so they appear the night it goes on.
  if (feature === 'live-results') return LIVE_RESULTS_ENABLED
  // Likewise the pledge: the nav link follows PLEDGE_ENABLED, so turning the
  // campaign off takes its link with it rather than leaving a menu item
  // pointing at a page that redirects home.
  if (feature === 'pledge') return PLEDGE_ENABLED
  const p = FEATURE_PHASE[feature]
  return p === undefined ? true : p <= LAUNCH_PHASE
}

// Public, feature-specific routes that should redirect to /coming-soon when their
// feature is gated. Auth/account/editor/onboarding routes are never listed here.
export const GATED_ROUTES: { prefix: string; feature: string }[] = [
  { prefix: '/parliament', feature: 'parliament' },
  { prefix: '/budget', feature: 'budget' },
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
