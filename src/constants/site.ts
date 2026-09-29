export const SITE = {
  name: 'Politika',
  tagline: 'Navigating New Zealand Politics',
  description:
    'Your one-stop resource for clear, credible information on New Zealand\'s parliament, MPs, parties, and policies, all in one place.',
  url: 'https://politika.nz',
  email: 'hello@politika.nz',
  // Onebyone's Stripe page, which takes donations for Politika. The Donate
  // buttons (footer, phone menu) always go to /donate; with this set, /donate
  // shows a "Donate now" button to it, and while it's null /donate says
  // donations open soon. Paste the Stripe Payment Link
  // (https://buy.stripe.com/...) here.
  donateUrl: null as string | null,
  // Official accounts. These feed three things at once: the footer links, the
  // `sameAs` array in the Organization schema (how Google ties the "Politika"
  // brand to this domain), and nothing else — so adding a handle here is the
  // only edit needed when a new account goes live.
  //
  // Only list accounts that actually exist and post. A `sameAs` pointing at an
  // empty profile is a weak signal, so leave TikTok/Facebook/YouTube commented
  // out until there's something on them.
  socials: [
    // Verified live, 24 Sep 2026, by loading each profile in a real browser and
    // reading the name off it. Not by status code: Instagram answers 200 for a
    // handle that does not exist, so `arapononz`, `politikanz` and `politika.nz`
    // all looked alike from curl. The page title is the thing that differs
    // ("Politika.nz (@politika.nz)" against "Profile isn't available").
    //
    // A guessed handle here would link the whole site to a stranger's account,
    // and these URLs are also the `sameAs` in the Organization schema, which is
    // how Google associates the brand.
    { label: 'Instagram', url: 'https://www.instagram.com/politika.nz/' },
    // THE PAGE, not the profile — and those are two different things here.
    //
    // 61592825727986 (what this used to point at) is a PERSONAL PROFILE. It was
    // the Arapono one and has since been renamed "Politika NZ", so the old link
    // still resolves and looks fine — which is exactly why it needed checking
    // rather than trusting. Facebook labels it itself: its Intro reads
    // "Profile · Digital creator · Business · Entrepreneur".
    //
    // 61594988367407 is the Page, created 29 Sep 2026. Its Intro reads
    // "Page · Digital creator · Politician". A Page is the right public face
    // for an organisation: it gets insights and scheduling, it can be handed to
    // another admin, and a profile standing in for a business is against
    // Facebook's own terms. It is also the correct `sameAs` for the
    // Organization schema, which is how Google ties this brand to the domain —
    // pointing that at a personal profile says something different about what
    // Politika is.
    //
    // Verified 29 Sep 2026 by loading it and reading the Intro, not by status
    // code: both ids answer 200, and profile.php?id= addresses BOTH profiles
    // and Pages, so the URL shape proves nothing.
    { label: 'Facebook', url: 'https://www.facebook.com/people/Politikanz/61594988367407/' },
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
    description: 'Public broadcaster: political news',
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
  'This poll is not a scientific survey. Results reflect the views of Politika users only and are not representative of the New Zealand population. They should not be interpreted as a political opinion poll.'
