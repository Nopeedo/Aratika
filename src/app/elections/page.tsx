/**
 * /elections — no page of its own any more.
 *
 * It was a hub with one card per election (2026 upcoming, 2023 final result).
 * Removed by request along with the "All elections" back link on the results
 * page. The route redirects rather than 404ing so old links and bookmarks
 * still land somewhere useful: the 2026 Election Centre. The 2023 results
 * stay at /elections/2023, linked from the footer.
 */

import { redirect } from 'next/navigation'

export default function ElectionsIndex() {
  redirect('/elections/2026')
}
