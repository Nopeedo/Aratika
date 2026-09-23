/**
 * /parties — retired as a page, kept as an entry point.
 *
 * The directory was a row of pills over seventeen tiles, and every tile said
 * the same two things: the party's name and its seat count. Nothing on it was
 * a reason to stop there, so it worked as a menu in front of the pages people
 * actually wanted, costing a tap on the way in and telling them nothing on the
 * way through.
 *
 * So the party page IS the directory now. It carries PartySwitcher at the top,
 * which lists all seventeen parties in the same two groups the directory used
 * ("In Parliament" / "Contesting 2026") — so the smaller registered parties
 * are still one tap from here, which was the directory's only unique job. What
 * a reader gets instead of a menu is a party: leader, seats, record, and where
 * they stand on every issue.
 *
 * National is the landing, as the largest party in the House and the first
 * entry in PARTY_DIRECTORY_ORDER. Not an editorial ranking, just the existing
 * order, which is also the order the switcher renders in.
 *
 * A temporary redirect, not permanent, for the same reason /policies' is: 308s
 * are cached hard by browsers and are effectively irreversible for anyone who
 * has visited, and this page has now changed shape twice.
 *
 * Removed from sitemap.ts at the same time: a sitemap must not list a URL that
 * redirects, the rule /policies and /compare are already held to.
 *
 * The directory component itself is untouched (components/parties/
 * party-directory.tsx) and the old page body is one `git show` away if this
 * needs undoing.
 */

import { redirect } from 'next/navigation'
import { PARTY_DIRECTORY_ORDER } from '@/constants/parties-data'

/**
 * Rendered per request, not prerendered. Without this Next treats the route as
 * static, and a static page cannot issue an HTTP redirect: it ships a 200 and
 * moves the reader client-side after hydration, so they load a whole page
 * before going anywhere. See the same note on /policies.
 */
export const dynamic = 'force-dynamic'

export default function PartiesIndexPage() {
  redirect(`/parties/${PARTY_DIRECTORY_ORDER[0]}`)
}
