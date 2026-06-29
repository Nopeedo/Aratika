import { isEnabled } from '@/constants/features'

// ─── Primary navigation — election-first pillars ──────────────────────────────
// The nav is deliberately lean: a voter should see the whole journey — decide
// (Your Vote), compare (Compare/Parties), locate (Your Electorate), hold to
// account (The Record), stay current (Latest), and understand (Learn).
// Grouped pillars open a dropdown of their sub-pages. Everything else (MPs
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
  { label: 'Your Vote', href: '/start', description: 'Find what matters to you, then build your plan', feature: 'onboarding' },
  { label: 'Compare', href: '/compare', description: 'Where every party stands, side by side', feature: 'compare' },
  { label: 'Parties', href: '/parties', description: 'Every party, their leaders and policies', feature: 'parties' },
  {
    label: 'Your Electorate', description: 'Find your seat, your MP and the 2026 race', feature: 'map',
    children: [
      { label: 'Electorate map', href: '/map', description: 'Interactive map — find your MP', feature: 'map' },
      { label: 'Battlegrounds', href: '/battlegrounds', description: 'Electorate races & candidates for 2026', feature: 'battlegrounds' },
    ],
  },
  {
    label: 'The Record', description: 'What this Parliament has actually done', feature: 'bills',
    children: [
      { label: 'Bills tracker', href: '/bills', description: 'Bills before the House — plain-language', feature: 'bills' },
      { label: 'Budget 2026', href: '/budget', description: 'Where the Government is spending', feature: 'budget' },
      { label: 'Parliament', href: '/parliament', description: 'Current seats, cabinet and snapshot', feature: 'parliament' },
    ],
  },
  {
    label: 'Latest', description: 'Live election news & video', feature: 'news',
    children: [
      { label: 'News', href: '/news', description: 'Live election news — every party, every issue', feature: 'news' },
      { label: 'Video', href: '/news#video', description: 'Leaders & the press', feature: 'news' },
    ],
  },
  { label: 'Learn', href: '/learn', description: 'How voting and Parliament work — beginner to expert', feature: 'learn' },
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

interface FooterLink { label: string; href: string; feature: string }

export const FOOTER_LINKS: Record<'learn' | 'explore' | 'account' | 'legal', FooterLink[]> = {
  learn: [
    { label: 'Find what matters to you', href: '/start', feature: 'onboarding' },
    { label: 'Your Plan', href: '/plan', feature: 'onboarding' },
    { label: 'How Parliament Works', href: '/learn', feature: 'learn' },
    { label: 'Glossary', href: '/glossary', feature: 'glossary' },
    { label: 'About Aratika', href: '/about', feature: 'about' },
    { label: 'Our Sources', href: '/about#sources', feature: 'about' },
  ],
  explore: [
    { label: 'Elections', href: '/elections', feature: 'elections' },
    { label: 'Battlegrounds', href: '/battlegrounds', feature: 'battlegrounds' },
    { label: 'Interactive Map', href: '/map', feature: 'map' },
    { label: 'MPs Directory', href: '/mps', feature: 'mps' },
    { label: 'Party Policies', href: '/policies', feature: 'policies' },
    { label: 'Compare Parties', href: '/compare', feature: 'compare' },
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
    { label: 'Privacy Policy', href: '/privacy', feature: 'about' },
    { label: 'Terms of Use', href: '/terms', feature: 'about' },
    { label: 'Submit a Correction', href: '/contact', feature: 'contact' },
  ],
}
