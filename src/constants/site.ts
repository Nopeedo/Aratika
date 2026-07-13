export const SITE = {
  name: 'Arapono',
  tagline: 'Navigating New Zealand Politics',
  description:
    'Your one-stop resource for clear, credible information on New Zealand\'s parliament, MPs, parties, and policies — all in one place.',
  url: 'https://arapono.nz',
  email: 'hello@arapono.nz',
  social: {
    twitter: 'https://twitter.com/aratikatnz',
    facebook: 'https://facebook.com/aratikatnz',
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
