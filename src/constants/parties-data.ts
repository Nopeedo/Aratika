/**
 * Extended party data for profile pages.
 *
 * Leadership details are best-effort placeholders based on available
 * information and will be overridden by live NZ Parliament API data
 * once Phase 2 API integration is complete.
 *
 * Founding dates, ideology descriptions, and historical facts are
 * sourced from official party records and parliament.nz.
 */

import { PartySlug } from '@/types'

export interface PartyProfile {
  slug:           PartySlug
  name:           string
  fullName:       string
  te_reo_name?:   string          // Te Reo name where applicable
  founded:        number
  color:          string
  textColor:      string          // text on party color background
  /** Leadership — placeholder until Parliament API */
  leader:         string
  leaderTitle:    string          // 'Leader' | 'Co-leader'
  coLeader?:      string
  coLeaderTitle?: string
  /** Status */
  status:         'governing' | 'opposition'
  coalitionRole?: string          // e.g. 'Lead coalition party', 'Coalition partner'
  seats:          number
  founded_note:   string          // human-readable founding context
  website:        string
  parliamentUrl:  string          // link to party page on parliament.nz
  /** Descriptive content */
  tagline:        string          // one-line description
  overview:       string          // 2–3 sentence overview paragraph
  history:        string          // 2–3 sentence history paragraph
  ideology:       string[]        // ideology tags
  coreValues:     string[]        // 5–6 plain-language value statements
  /** Policy areas — links to /policies/[topic] */
  keyPolicyAreas: string[]        // PolicyTopic keys this party is most associated with
  /** Seat breakdown (approximate — will be replaced by API data) */
  electorateSeats: number
  listSeats:       number
}

// ─── Party profiles ───────────────────────────────────────────────────────────

export const PARTY_PROFILES: Record<PartySlug, PartyProfile> = {

  national: {
    slug:          'national',
    name:          'National',
    fullName:      'New Zealand National Party',
    founded:       1936,
    color:         '#0A5BA8',
    textColor:     '#ffffff',
    leader:        'Christopher Luxon',
    leaderTitle:   'Leader / Prime Minister',
    status:        'governing',
    coalitionRole: 'Lead coalition party',
    seats:         49,
    electorateSeats: 30,
    listSeats:       19,
    founded_note:  'Formed in 1936 from a merger of the Reform and Liberal parties',
    website:       'https://www.national.org.nz',
    parliamentUrl: 'https://www.parliament.nz/en/mps-and-electorates/party/national-party',
    tagline:       'Centre-right party leading New Zealand\'s current coalition government',
    overview:
      'The New Zealand National Party is the country\'s largest centre-right political party. ' +
      'Founded in 1936, National has governed New Zealand for most of the post-war period and ' +
      'currently leads the National–ACT–NZ First coalition government formed after the October 2023 election.',
    history:
      'National was formed in 1936 from a merger of the Reform and United parties in response to the ' +
      'first Labour government. The party has dominated New Zealand centre-right politics ever since, ' +
      'producing prime ministers including Keith Holyoake, Robert Muldoon, Jim Bolger, Jenny Shipley, ' +
      'Bill English, John Key, and the current PM Christopher Luxon.',
    ideology:      ['Centre-right', 'Liberal conservatism', 'Fiscal conservatism', 'Economic liberalism'],
    coreValues: [
      'Lower taxes and responsible government spending',
      'Strong economic growth and a competitive business environment',
      'Law and order — personal and community safety',
      'Individual freedom and personal responsibility',
      'Strong public services delivered efficiently',
      'New Zealand\'s security and international relationships',
    ],
    keyPolicyAreas: ['economy', 'crime-justice', 'housing', 'foreign-policy', 'immigration'],
  },

  labour: {
    slug:          'labour',
    name:          'Labour',
    fullName:      'New Zealand Labour Party',
    founded:       1916,
    color:         '#D5202B',
    textColor:     '#ffffff',
    leader:        'Chris Hipkins',
    leaderTitle:   'Leader of the Opposition',
    status:        'opposition',
    seats:         34,
    electorateSeats: 20,
    listSeats:       14,
    founded_note:  'Founded in 1916, one of New Zealand\'s oldest political parties',
    website:       'https://www.labour.org.nz',
    parliamentUrl: 'https://www.parliament.nz/en/mps-and-electorates/party/labour-party',
    tagline:       'Centre-left party and principal opposition to the current government',
    overview:
      'The New Zealand Labour Party is the country\'s principal centre-left party, founded by the ' +
      'trade union movement in 1916. Labour governed New Zealand from 2017 to 2023 under Jacinda Ardern ' +
      'and Chris Hipkins, and now serves as the largest opposition party in the 54th Parliament.',
    history:
      'Labour has been at the heart of New Zealand\'s progressive tradition since its founding. ' +
      'The first Labour government (1935–1949) introduced the welfare state, free healthcare, and ' +
      'state housing. Modern Labour governments have continued this tradition through Working for ' +
      'Families, KiwiSaver, and major public service investments under the Ardern–Hipkins government.',
    ideology:      ['Centre-left', 'Social democracy', 'Progressivism', 'Keynesian economics'],
    coreValues: [
      'Fair wages, workers\' rights and strong unions',
      'Accessible public healthcare and mental health services',
      'Affordable housing for all New Zealanders',
      'Climate action and environmental protection',
      'Reducing child poverty and inequality',
      'Free and high-quality public education',
    ],
    keyPolicyAreas: ['health', 'housing', 'economy', 'education', 'climate', 'treaty-maori-affairs'],
  },

  act: {
    slug:          'act',
    name:          'ACT',
    fullName:      'ACT New Zealand',
    founded:       1993,
    color:         '#F5C518',
    textColor:     '#1c1605',
    leader:        'David Seymour',
    leaderTitle:   'Leader / Deputy Prime Minister',
    status:        'governing',
    coalitionRole: 'Coalition partner',
    seats:         11,
    electorateSeats: 2,
    listSeats:       9,
    founded_note:  'Founded in 1993 from the free-market reforms of the fourth Labour government',
    website:       'https://www.act.org.nz',
    parliamentUrl: 'https://www.parliament.nz/en/mps-and-electorates/party/act-new-zealand',
    tagline:       'Classical liberal party and coalition partner in the current government',
    overview:
      'ACT New Zealand is a classical liberal party advocating for small government, free markets, ' +
      'and individual freedom. Founded in 1993, ACT entered its strongest electoral period under ' +
      'David Seymour\'s leadership and currently serves as a coalition partner alongside National ' +
      'and NZ First in the 54th Parliament.',
    history:
      'ACT emerged from the free-market reforms of the 1984–1993 Labour government, founded by ' +
      'former Labour MP Roger Douglas and others who sought to continue economic liberalisation. ' +
      'After years at the margins of parliament, the party surged under David Seymour\'s leadership, ' +
      'winning 11 seats in 2023 — its best result in over two decades.',
    ideology:      ['Classical liberalism', 'Libertarianism', 'Free market', 'Fiscal conservatism'],
    coreValues: [
      'Small government and lower taxes',
      'Individual freedom and personal responsibility',
      'Free markets and deregulation',
      'Education choice and school autonomy',
      'Law and order based on clear consequences',
      'Treaty principles — one rule of law for all New Zealanders',
    ],
    keyPolicyAreas: ['economy', 'education', 'crime-justice', 'treaty-maori-affairs', 'health'],
  },

  green: {
    slug:          'green',
    name:          'Green',
    fullName:      'Green Party of Aotearoa New Zealand',
    founded:       1990,
    color:         '#1F8A4C',
    textColor:     '#ffffff',
    leader:        'Chlöe Swarbrick',
    leaderTitle:   'Leader',
    status:        'opposition',
    seats:         15,
    electorateSeats: 1,
    listSeats:       14,
    founded_note:  'Founded in 1990, with roots in the Values Party (1972) — one of the world\'s first green parties',
    website:       'https://www.greens.org.nz',
    parliamentUrl: 'https://www.parliament.nz/en/mps-and-electorates/party/green-party-of-aotearoa-new-zealand',
    tagline:       'Green and progressive party focused on climate, environment, and social justice',
    overview:
      'The Green Party of Aotearoa New Zealand is a progressive party advocating for bold climate ' +
      'action, environmental protection, and social and economic justice. With roots in the Values ' +
      'Party — one of the world\'s first green parties, founded in 1972 — the Greens are currently ' +
      'the third-largest party in opposition with 15 seats.',
    history:
      'The Green Party traces its origins to the Values Party of 1972 — a world first in green ' +
      'politics. The modern Green Party was formally established in 1990. The Greens supported the ' +
      'Labour-led government from 2017–2023 in a confidence and supply arrangement, and remain ' +
      'a significant force in opposition politics.',
    ideology:      ['Green politics', 'Left-wing', 'Progressivism', 'Social justice', 'Ecosocialism'],
    coreValues: [
      'Urgent, science-based climate action and net-zero emissions',
      'Protection of New Zealand\'s natural environment and biodiversity',
      'Social equity — ending poverty and reducing inequality',
      'Te Tiriti o Waitangi partnership and Māori rights',
      'Affordable housing and a fair rental market',
      'A wellbeing economy — measuring success beyond GDP',
    ],
    keyPolicyAreas: ['climate', 'environment', 'housing', 'economy', 'treaty-maori-affairs', 'health'],
  },

  nzfirst: {
    slug:          'nzfirst',
    name:          'NZ First',
    fullName:      'New Zealand First',
    founded:       1993,
    color:         '#181a1f',
    textColor:     '#ffffff',
    leader:        'Winston Peters',
    leaderTitle:   'Leader / Deputy Prime Minister',
    status:        'governing',
    coalitionRole: 'Coalition partner',
    seats:         8,
    electorateSeats: 0,
    listSeats:       8,
    founded_note:  'Founded in 1993 by Winston Peters following his departure from the National Party',
    website:       'https://www.nzfirst.nz',
    parliamentUrl: 'https://www.parliament.nz/en/mps-and-electorates/party/new-zealand-first',
    tagline:       'Populist, nationalist party and coalition partner in the current government',
    overview:
      'New Zealand First is a populist party with a strong nationalist and sovereigntist orientation, ' +
      'led by veteran politician Winston Peters. Founded in 1993, NZ First is known for its focus on ' +
      'regional New Zealand, senior citizens, and controlling foreign ownership of New Zealand assets. ' +
      'The party returned to parliament in 2023 and joined the National-led coalition government.',
    history:
      'Winston Peters founded NZ First in 1993 after being dismissed from the National cabinet. ' +
      'The party has been a significant coalition-maker in New Zealand politics, having supported ' +
      'both National (1996–1999, 2017 negotiations) and Labour (2017–2020) governments. After ' +
      'failing to return to parliament in 2020, NZ First made a comeback in 2023 with 8 seats.',
    ideology:      ['Populism', 'Nationalism', 'Centrism', 'Economic nationalism', 'Social conservatism'],
    coreValues: [
      'New Zealand sovereignty — NZ owned and NZ controlled',
      'Regional development and investment outside the main centres',
      'Supporting New Zealand\'s senior citizens',
      'Controlling foreign ownership of New Zealand land and assets',
      'A strong New Zealand Defence Force',
      'Controlled and managed immigration settings',
    ],
    keyPolicyAreas: ['economy', 'foreign-policy', 'immigration', 'crime-justice', 'health'],
  },

  tpm: {
    slug:          'tpm',
    name:          'Te Pāti Māori',
    fullName:      'Te Pāti Māori',
    te_reo_name:   'Te Pāti Māori',
    founded:       2004,
    color:         '#B11226',
    textColor:     '#ffffff',
    leader:        'Rawiri Waititi',
    leaderTitle:   'Co-leader',
    coLeader:      'Debbie Ngarewa-Packer',
    coLeaderTitle: 'Co-leader',
    status:        'opposition',
    seats:         6,
    electorateSeats: 6,
    listSeats:       0,
    founded_note:  'Founded in 2004 to provide independent Māori political representation',
    website:       'https://www.maoriparty.nz',
    parliamentUrl: 'https://www.parliament.nz/en/mps-and-electorates/party/maori-party',
    tagline:       'Māori political party advocating for indigenous rights and Te Tiriti o Waitangi',
    overview:
      'Te Pāti Māori is a political party founded to represent Māori interests, uphold Te Tiriti ' +
      'o Waitangi, and advance Māori sovereignty and self-determination. All six of the party\'s ' +
      'seats are Māori electorate seats. The party is currently in opposition in the 54th Parliament.',
    history:
      'Te Pāti Māori was founded in 2004 after the Foreshore and Seabed Act controversy prompted ' +
      'Māori MPs to leave the Labour Party. The party has played a significant role in NZ politics ' +
      'since, serving in confidence and supply arrangements with National (2008–2014) before ' +
      'returning to parliament in 2020 and gaining its strongest result in 2023.',
    ideology:      ['Māori nationalism', 'Indigenous rights', 'Progressivism', 'Biculturalism', 'Left-wing'],
    coreValues: [
      'Upholding Te Tiriti o Waitangi as the founding document of Aotearoa',
      'Māori sovereignty and self-determination (tino rangatiratanga)',
      'Revitalisation of te reo Māori and Māori culture',
      'Health, housing, and education equity for Māori',
      'Economic development for Māori communities and iwi',
      'Environmental protection guided by kaitiakitanga (guardianship)',
    ],
    keyPolicyAreas: ['treaty-maori-affairs', 'health', 'housing', 'education', 'environment', 'economy'],
  },

  independent: {
    slug:          'independent',
    name:          'Independent',
    fullName:      'Independent',
    founded:       0,
    color:         '#6B7280',
    textColor:     '#ffffff',
    leader:        '',
    leaderTitle:   '',
    status:        'opposition',
    seats:         0,
    electorateSeats: 0,
    listSeats:       0,
    founded_note:  '',
    website:       '',
    parliamentUrl: 'https://www.parliament.nz',
    tagline:       'Members of Parliament not affiliated with a registered party',
    overview:      'Independent MPs are not members of any registered political party.',
    history:       '',
    ideology:      [],
    coreValues:    [],
    keyPolicyAreas: [],
  },
}

// Ordered list for directory page — exclude 'independent'
export const PARTY_DIRECTORY_ORDER: PartySlug[] = [
  'national', 'labour', 'green', 'act', 'nzfirst', 'tpm',
]
