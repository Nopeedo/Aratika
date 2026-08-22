/**
 * /policies — retired as a page, kept as an entry point.
 *
 * The hub was a heading, a paragraph, and a row of eleven chips. Nothing else
 * appeared until you tapped one, and what appeared then was a thinner version
 * of the per-topic page: party names as pills, no stance text, no plain/detailed
 * toggle, no "what this covers". Two layouts for one job, and the worse one sat
 * at the address everything links to.
 *
 * So the topic page IS the hub now. It already carries the full chip row, so
 * switching issues works exactly as it did, and every /policies link across the
 * site — the dashboard, the compass result, the budget cross-link, the homepage
 * carousel, the nav — lands somewhere useful instead of a menu.
 *
 * A temporary redirect, not permanent. 308s are cached hard by browsers and are
 * effectively irreversible for anyone who has visited; the layout here has
 * changed twice already, so this stays cheap to undo.
 *
 * Removed from sitemap.ts at the same time: a sitemap must not list a URL that
 * redirects (the same rule /compare is held to, two entries above it).
 */

import { redirect } from 'next/navigation'
import { POLICY_TOPIC_ORDER } from '@/constants/policy-topics'

export default function PolicyHubPage() {
  // The first issue in the site-wide order, the same one the chip row leads
  // with everywhere else. Not an editorial ranking — just the existing order.
  redirect(`/policies/${POLICY_TOPIC_ORDER[0]}`)
}
