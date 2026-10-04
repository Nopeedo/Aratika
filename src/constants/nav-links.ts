import { isEnabled } from '@/constants/features'

// ─── Primary navigation — election-first pillars ──────────────────────────────
// The nav is deliberately lean: a voter should see the whole journey — compare
// (Parties/Policies), locate (Your Electorate), hold to
// account (The Record), stay current (News/Video), and understand (Learn).
// Every item is a direct link: the menu has no dropdowns left. Everything else (MPs
// directory, policies-by-topic, glossary, take-action, dashboard) lives in the
// footer or nested deeper — gated/demoted, never deleted.

export interface NavChild {
  label: string
  href: string
  description: string
  feature: string
}

export interface NavItem {
  label: string
  /** Direct link target. Omitted for pure dropdown groups. */
  href?: string
  description: string
  /** Feature gate for the pillar itself (a group also shows if any child is enabled). */
  feature: string
  children?: NavChild[]
}

export const NAV_ITEMS: NavItem[] = [
  // "2026 Election", not "Election Centre": the menu names the thing the
  // reader is here for, not the name we gave the section that holds it.
  { label: '2026 Election', href: '/elections/2026', description: 'Polls, seat projection, your electorate and live results on the night', feature: 'elections' },
  // "Your Vote" (/start, the personal compass) left the nav by request — the
  // pillar was one label among seven, and the compass now rides the two pages
  // everyone actually lands on instead: the homepage card moved above the
  // policy grid, and the Election Centre carries the same card in its "how
  // your vote works" section. The page itself is untouched and stays linked
  // from the footer ("Find what matters to you").
  // "Party Profiles", matching the h1 on the page it opens. A label that
  // names a section rather than the destination makes the reader work out
  // they have arrived in the right place.
  { label: 'Party Profiles', href: '/parties', description: 'Every party, their leaders and policies', feature: 'parties' },
  // The policy hub reached the main nav late. It was linked only from the
  // footer and a few in-page cards, which is also where topic TRACKING lives —
  // the follow button for an issue is on /policies/[topic] and nowhere else. Two
  // people have ever tracked a topic (housing and economy, last on 7 Aug),
  // against seven electorates, and the `policy` bookmark kind feeds a whole
  // notification path that was therefore starved of subscribers.
  // "Policy Comparison", not "Policies": /policies redirects to the first
  // topic's comparison page, so the label now says what the destination
  // actually is rather than naming a section.
  { label: 'Policy Comparison', href: '/policies', description: 'Where the parties stand issue by issue, and follow the issues you care about', feature: 'policies' },
  // Straight under Policy Comparison, by request: what the parties say,
  // then what Parliament is actually passing.
  { label: 'Bills tracker', href: '/bills', description: 'Bills before the House: plain-language', feature: 'bills' },
  // News and Video sit above MPs directory, by request.
  // "Latest" is gone as a group, the last one in the menu, for the same reason
  // The Record and Your Electorate went: the label named the grouping rather
  // than either destination, and both of them cost a tap behind a dropdown
  // that held exactly two things.
  { label: 'News', href: '/news', description: 'Live election news: every party, every issue', feature: 'news' },
  // Video came out of the menu, by request: it was a second link to the
  // same page (/news#video). The clips are still on /news, below the stories.
  // Above Find your local MP, by request.
  { label: 'MPs directory', href: '/mps', description: 'Every current MP, by name or electorate', feature: 'mps' },
  // "Your Electorate" is gone as a group for the same reason The Record is:
  // the label named the grouping, not the destinations, and each of the three
  // cost a tap to reach through it.
  { label: 'Find your local MP', href: '/map', description: 'Interactive map: find your electorate and its MP', feature: 'map' },
  // Back in the menu, by request. It was hidden behind 'live-results' because
  // the page was ONLY the election-night results and showed a "not open yet"
  // card until the switch flipped — a menu item leading to a placeholder.
  //
  // The page has two real states now (app/battlegrounds/page.tsx): before
  // election night it is the seat-by-seat picture — all 72 electorates, who is
  // standing, which 2023 contests were closest — and on the night it becomes
  // the results. So it is gated on 'battlegrounds', which is on, and the
  // RESULTS block alone still waits for LIVE_RESULTS_ENABLED.
  //
  // Labelled "2026 Election map", by request: "Battlegrounds" and "Who's
  // standing" both needed explaining, and §1.7 wants the plain words a
  // first-timer already has. It also separates cleanly from "Find your local
  // MP" — that one answers where am I, this one is the whole field on a map.
  // The page's h1 and <title> carry the same name.
  { label: '2026 Election map', href: '/battlegrounds', description: 'All 72 electorates on one map: who is standing in each', feature: 'battlegrounds' },
  // "The Record" is gone as a group: it held three destinations that have
  // nothing to do with each other beyond all being facts about this term, so
  // the label explained the grouping rather than the pages, and every one of
  // them cost a tap to reach. They stand on their own now, in the order a
  // reader is likely to want them. Parliament comes out with the other two
  // rather than being left without a home in the menu.
  { label: 'Budget 2026', href: '/budget', description: 'Where the Government is spending', feature: 'budget' },
  { label: 'Parliament', href: '/parliament', description: 'Current seats, cabinet and snapshot', feature: 'parliament' },
  { label: 'Learn', href: '/learn', description: 'How voting and Parliament work, beginner to expert', feature: 'learn' },
]

/** A nav item is visible if it (a) is a direct link with its feature enabled, or
 *  (b) is a group with at least one enabled child. Returns groups with their
 *  child lists already filtered to the enabled ones. */
export function visibleNav(): NavItem[] {
  const out: NavItem[] = []
  for (const item of NAV_ITEMS) {
    if (item.children) {
      const children = item.children.filter((c) => isEnabled(c.feature))
      if (children.length > 0) out.push({ ...item, children })
    } else if (isEnabled(item.feature)) {
      out.push(item)
    }
  }
  return out
}

/**
 * The desktop bar's "More" dropdown, by request, so the bar isn't one long
 * row: these three sit behind it, in this order. The phone menu is a list with
 * room for everything and keeps them flat (visibleNav()).
 */
const DESKTOP_MORE_HREFS = ['/mps', '/map', '/learn']

export function desktopNav(): NavItem[] {
  const all = visibleNav()
  const more = all.filter((i) => !i.children && i.href && DESKTOP_MORE_HREFS.includes(i.href))
  const rest = all.filter((i) => !more.includes(i))
  if (more.length === 0) return rest
  return [
    ...rest,
    {
      label: 'More',
      description: 'MPs, your local MP and how Parliament works',
      feature: 'more',
      children: more.map((i) => ({ label: i.label, href: i.href!, description: i.description, feature: i.feature })),
    },
  ]
}

interface FooterLink { label: string; href: string; feature: string }

// `learn` and `explore` are no longer rendered: the footer dropped both
// columns by request. Kept so they can come back without rebuilding them.
export const FOOTER_LINKS: Record<'learn' | 'explore' | 'account' | 'legal', FooterLink[]> = {
  learn: [
    { label: 'Find what matters to you', href: '/start', feature: 'onboarding' },
    { label: 'Your Plan', href: '/plan', feature: 'onboarding' },
    { label: 'How Parliament Works', href: '/learn', feature: 'learn' },
    { label: 'Glossary', href: '/glossary', feature: 'glossary' },
    { label: 'About Politika', href: '/about', feature: 'about' },
    { label: 'Our Sources', href: '/about#sources', feature: 'about' },
  ],
  explore: [
    { label: 'Command Centre', href: '/command-centre', feature: 'dashboard' },
    // Was 'Elections' → /elections, a hub that's gone now. This keeps the
    // 2023 results reachable; 2026 is already in the main nav.
    { label: '2023 results', href: '/elections/2023', feature: 'elections' },
    { label: 'Live results 2026', href: '/battlegrounds', feature: 'live-results' },
    { label: 'Interactive Map', href: '/map', feature: 'map' },
    { label: 'MPs Directory', href: '/mps', feature: 'mps' },
    { label: 'Party Policies', href: '/policies', feature: 'policies' },
    { label: 'Budget 2026', href: '/budget', feature: 'budget' },
    { label: 'Bills Tracker', href: '/bills', feature: 'bills' },
    { label: 'Take Action', href: '/take-action', feature: 'take-action' },
    { label: 'Public Polls', href: '/polls', feature: 'polls' },
  ],
  account: [
    { label: 'Sign Up Free', href: '/register', feature: 'account' },
    { label: 'Log In', href: '/login', feature: 'account' },
    { label: 'Upgrade to Premium', href: '/subscription', feature: 'premium' },
  ],
  legal: [
    // "Our Sources" sits here rather than under Learn because the Learn and
    // Explore columns are not rendered — this is the only footer group a
    // reader sees. It was reachable only from the About page once the
    // "Data sourced from:" strip came off the top of the footer, which is a
    // strange place to hide the working on a site whose pitch is showing it.
    // It also stays in `learn` above: that list is intact for whenever those
    // columns come back, and nothing renders it today, so this is not a
    // duplicate on screen.
    { label: 'Our Sources', href: '/about#sources', feature: 'about' },
    { label: 'Help & FAQ', href: '/faq', feature: 'about' },
    { label: 'Privacy Policy', href: '/privacy', feature: 'about' },
    { label: 'Terms of Use', href: '/terms', feature: 'about' },
    { label: 'Submit a Correction', href: '/contact', feature: 'contact' },
  ],
}
