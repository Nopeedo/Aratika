export const SITE = {
  name: 'Arapono',
  tagline: 'Navigating New Zealand Politics',
  description:
    'Your one-stop resource for clear, credible information on New Zealand\'s parliament, MPs, parties, and policies — all in one place.',
  url: 'https://arapono.org.nz',
  email: 'hello@arapono.org.nz',
  // Official accounts. These feed three things at once: the footer links, the
  // `sameAs` array in the Organization schema (how Google ties the "Arapono"
  // brand to this domain), and nothing else — so adding a handle here is the
  // only edit needed when a new account goes live.
  //
  // Only list accounts that actually exist and post. A `sameAs` pointing at an
  // empty profile is a weak signal, so leave TikTok/Facebook/YouTube commented
  // out until there's something on them.
  socials: [
    { label: 'Instagram', url: 'https://www.instagram.com/arapononz/' },
    // The canonical profile URL, resolved from a facebook.com/share/ short
    // link before adding — share links redirect and can rotate, so the footer
    // carries the address they point AT, verified live 28 Aug 2026.
    { label: 'Facebook', url: 'https://www.facebook.com/people/Arapono-Arapono/pfbid0239fo87kAKYeU8SkAQExLZGjSwTfEgVeADcfPr5BDjAm6M1zNAgXkAprLLvKoRFwbl/' },
    // { label: 'TikTok', url: 'https://www.tiktok.com/@…' },
    // { label: 'YouTube', url: 'https://www.youtube.com/@…' },
  ] as { label: string; url: string }[],

  // Promoter statement (Electoral Act 1993 s204F). An election advertisement must
  // be "Promoted/authorised by NAME, FULL STREET ADDRESS", clearly displayed, at all
  // times. The footer renders this ONLY when `address` is set — so nothing incomplete
  // ever goes public. Fill `address` (trust registered office / PO box / street) to
  // publish it. The EC recommended adding one (Ticket 182285, Jul 2026).
  promoter: {
    name: 'Tawhiao Watene',
    address: '', // ← set this to publish the promoter statement
  },
  pricing: {
    monthly: {
      amountNZD: 20,
      amountCents: 2000,
      label: '$20 / month',
    },
    annual: {
      amountNZD: 200,
      amountCents: 20000,
      label: '$200 / year',
      saving: '$40',
      effectiveMonthly: '$16.67',
    },
    trialDays: 14,
  },
  currentParliament: '54th' as const,
  previousParliament: '53rd' as const,
  currentPM: 'Christopher Luxon',
  currentPMSlug: 'christopher-luxon',
  currentPMParty: 'national' as const,
  electionYear: 2026,
} as const

export const DATA_SOURCES = [
  {
    name: 'New Zealand Parliament',
    url: 'https://www.parliament.nz',
    description: 'Official source for MP data, bills, votes, and Hansard',
    tier: 'api' as const,
  },
  {
    name: 'Electoral Commission',
    url: 'https://www.elections.nz',
    description: 'Official election results, candidate registrations, enrolment',
    tier: 'api' as const,
  },
  {
    name: 'Stats NZ',
    url: 'https://www.stats.govt.nz',
    description: 'Demographic and socioeconomic data',
    tier: 'api' as const,
  },
  {
    name: 'New Zealand Treasury',
    url: 'https://www.treasury.govt.nz',
    description: 'Budget documents and economic forecasts',
    tier: 'rss' as const,
  },
  {
    name: 'Radio New Zealand (RNZ)',
    url: 'https://www.rnz.co.nz',
    description: 'Public broadcaster — political news',
    tier: 'rss' as const,
  },
  {
    name: 'Beehive',
    url: 'https://www.beehive.govt.nz',
    description: 'Government press releases and ministerial statements',
    tier: 'rss' as const,
  },
] as const

export const POLL_DISCLAIMER =
  'This poll is not a scientific survey. Results reflect the views of Arapono users only and are not representative of the New Zealand population. They should not be interpreted as a political opinion poll.'
