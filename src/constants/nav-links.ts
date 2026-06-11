export interface NavLink {
  label: string
  href: string
  description: string
}

export const NAV_LINKS: NavLink[] = [
  {
    label: 'Parliament',
    href: '/parliament',
    description: 'Current parliament overview, seat distribution, and cabinet',
  },
  {
    label: 'Map',
    href: '/map',
    description: 'Interactive electorate map — find your MP',
  },
  {
    label: 'Parties',
    href: '/parties',
    description: 'All political parties, their leaders and policies',
  },
  {
    label: 'MPs',
    href: '/mps',
    description: 'Members of Parliament — searchable directory',
  },
  {
    label: 'Bills',
    href: '/bills',
    description: 'Bills and legislation currently before the House',
  },
  {
    label: 'Policies',
    href: '/policies',
    description: 'Party policies compared by topic',
  },
  {
    label: 'Learn',
    href: '/learn',
    description: 'Interactive lessons on how Parliament works — beginner to expert',
  },
  {
    label: 'Take Action',
    href: '/take-action',
    description: 'Draft letters to MPs & Ministers, make submissions, file OIA requests',
  },
  {
    label: 'Elections',
    href: '/elections',
    description: '2023 and 2020 election results',
  },
  {
    label: 'News',
    href: '/news',
    description: 'Latest political news from credible NZ sources',
  },
]

export const FOOTER_LINKS = {
  learn: [
    { label: 'How Parliament Works', href: '/learn' },
    { label: 'Glossary', href: '/glossary' },
    { label: 'About Aratika', href: '/about' },
    { label: 'Our Sources', href: '/about#sources' },
  ],
  explore: [
    { label: 'Interactive Map', href: '/map' },
    { label: 'MPs Directory', href: '/mps' },
    { label: 'Party Policies', href: '/policies' },
    { label: 'Bills Tracker', href: '/bills' },
    { label: 'Take Action', href: '/take-action' },
    { label: 'Public Polls', href: '/polls' },
  ],
  account: [
    { label: 'Sign Up Free', href: '/register' },
    { label: 'Log In', href: '/login' },
    { label: 'Upgrade to Premium', href: '/subscription' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Use', href: '/terms' },
    { label: 'Submit a Correction', href: '/contact' },
  ],
}
