/**
 * Extended party data for profile pages.
 *
 * Leadership details were verified against official party sources and
 * parliament.nz in July 2026 (incl. Green + Te Pāti Māori co-leaders and
 * the registered minor-party leaders). Phase 2 will additionally sync from
 * the live NZ Parliament API.
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
  /** Leadership — verified July 2026; Phase 2 will also sync from Parliament API */
  leader:         string
  leaderTitle:    string          // 'Leader' | 'Co-leader'
  coLeader?:      string
  coLeaderTitle?: string
  /** Leader photo — only needed when the leader isn't an MP with a profile photo (e.g. extra-parliamentary parties). Open-licensed + attributed. */
  leaderPhoto?:        string
  leaderPhotoCredit?:  string
  leaderPhotoLicense?: string
  leaderPhotoSourceUrl?: string
  /** Status */
  status:         'governing' | 'opposition' | 'extra-parliamentary'
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
    leaderTitle:   'Co-leader',
    coLeader:      'Marama Davidson',
    coLeaderTitle: 'Co-leader',
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

  top: {
    slug:          'top',
    name:          'TOP',
    fullName:      'The Opportunity Party',
    founded:       2016,
    color:         '#00E5CC',
    textColor:     '#06302c',
    leader:        'Qiulae Wong',
    leaderTitle:   'Leader',
    leaderPhoto:        '/mps/qiulae-wong.jpg',
    leaderPhotoCredit:  'The Opportunity Party',
    leaderPhotoLicense: 'CC BY 4.0',
    leaderPhotoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Qiulae_portrait_1_(cropped).jpg',
    status:        'extra-parliamentary',
    seats:         0,
    electorateSeats: 0,
    listSeats:       0,
    founded_note:  'Founded in 2016 by economist Gareth Morgan as an evidence-based, policy-focused party; now led by a new generation.',
    website:       'https://www.opportunity.org.nz/',
    parliamentUrl: 'https://www.opportunity.org.nz/',
    tagline:       'Evidence-based policy — unity, innovation and nature.',
    overview:      'The Opportunity Party (TOP) is a small, policy-focused party campaigning on evidence-based reform — most notably an overhaul of the tax system — alongside environmental restoration and a less combative style of politics. It is contesting the 2026 election but is not currently in Parliament.',
    history:       'TOP was founded in 2016 by economist and philanthropist Gareth Morgan. It has stood at every general election since, but has not crossed the 5% party-vote threshold or won an electorate seat, so it holds no seats in the 54th Parliament. It is now led by Qiulae Wong.',
    ideology:      ['Evidence-based policy', 'Tax reform', 'Environmentalism', 'Social liberalism'],
    coreValues: [
      'Reset the tax system so it is fairer and rewards work and innovation',
      'Build a sustainable, high-wage economy where people can afford the basics',
      'Restore nature — healthier oceans and land, and real climate action',
      'Lower the political temperature and seek long-term, cross-party solutions',
      'Make policy based on evidence rather than ideology',
    ],
    keyPolicyAreas: ['economy', 'climate', 'housing'],
  },

  'womens-rights': {
    slug:          'womens-rights',
    name:          'Women’s Rights Party',
    fullName:      'The New Zealand Women’s Rights Party',
    founded:       2023,
    color:         '#6B3FA0',
    textColor:     '#ffffff',
    leader:        'Jill Ovens',
    leaderTitle:   'Co-leader',
    coLeader:      'Chimène de la Varis',
    coLeaderTitle: 'Co-leader',
    status:        'extra-parliamentary',
    seats:         0,
    electorateSeats: 0,
    listSeats:       0,
    founded_note:  'Founded in April 2023 by Jill Ovens and around 20 other women, in the week after a New Zealand visit by UK women’s-rights campaigner Kellie-Jay Keen.',
    website:       'https://womensrightsparty.nz/',
    parliamentUrl: 'https://womensrightsparty.nz/',
    tagline:       'Protecting the sex-based rights of women and girls.',
    overview:      'The Women’s Rights Party is a registered New Zealand party formed in 2023 to advocate for the sex-based rights of women and girls. It describes itself as women and men who believe in “democracy, equality and biological reality”, and campaigns on single-sex spaces and services, defining “woman” and “man” in law by biological sex, and the welfare of children. It holds no seats in the current Parliament.',
    history:       'The party was founded in April 2023 by Jill Ovens and around 20 other women, and registered with the Electoral Commission the same year. It contested the 2023 Port Waikato by-election and the 2023 general election, and is standing across the country in 2026. It is co-led by Jill Ovens (also its national secretary) and Chimène de la Varis.',
    ideology:      ['Women’s rights', 'Sex-based rights', 'Child safeguarding'],
    coreValues: [
      'Protect single-sex spaces and services for women and girls',
      'Define “woman” and “man” in law on the basis of biological sex',
      'Safeguard the welfare of children in health and education',
      'Uphold the rights women have historically won, and women’s autonomy',
      'Base law and policy on what the party calls biological reality',
    ],
    keyPolicyAreas: ['education', 'health', 'crime-justice'],
  },

  'animal-justice': {
    slug:          'animal-justice',
    name:          'Animal Justice Party',
    fullName:      'Animal Justice Party Aotearoa New Zealand',
    founded:       2022,
    color:         '#159A7B',
    textColor:     '#ffffff',
    leader:        'Danette Wereta',
    leaderTitle:   'Co-leader',
    coLeader:      'Rob McNeil',
    coLeaderTitle: 'Co-leader',
    status:        'extra-parliamentary',
    seats:         0, electorateSeats: 0, listSeats: 0,
    founded_note:  'Incorporated as a society in November 2022 and registered with the Electoral Commission in August 2023, alongside its Australian sister party.',
    website:       'https://animaljustice.org.nz/',
    parliamentUrl: 'https://animaljustice.org.nz/',
    tagline:       'Compassionate, non-violent, sustainable.',
    overview:      'The Animal Justice Party is a New Zealand party centred on animal welfare and animal rights. It advocates non-violence towards animals, environmental sustainability, and a transition away from animal-based agriculture towards a plant-based economy, and campaigns for stronger legal protections for animals — including a proposed Commissioner for Animals. It holds no seats in the current Parliament.',
    history:       'The party grew out of the Animal Justice Auckland advocacy group and consultation with the Australian Animal Justice Party, and registered with the Electoral Commission in August 2023. It contested its first general election that year, standing 17 candidates for 0.17% of the party vote and no seats, and later ran in the 2025 local elections. It is co-led by Danette Wereta and Rob McNeil.',
    ideology:      ['Animal rights', 'Animal welfare', 'Environmentalism'],
    coreValues: [
      'Transition to a plant-based economy, supporting farmers to change',
      'End intensive winter grazing and factory farming',
      'Oppose animal experimentation and the fur and leather trades',
      'End recreational hunting, fishing and animal-entertainment industries',
      'Create a Commissioner for Animals with legal standing',
      'Embed Te Tiriti o Waitangi principles in how animals are governed',
    ],
    keyPolicyAreas: ['environment', 'economy', 'treaty-maori-affairs'],
  },

  'alcp': {
    slug:          'alcp',
    name:          'ALCP',
    fullName:      'Aotearoa Legalise Cannabis Party',
    founded:       1996,
    color:         '#3E9B35',
    textColor:     '#ffffff',
    leader:        'Maki Herbert',
    leaderTitle:   'Co-leader',
    coLeader:      'Michael Appleby',
    coLeaderTitle: 'Co-leader',
    status:        'extra-parliamentary',
    seats:         0, electorateSeats: 0, listSeats: 0,
    founded_note:  'Founded on 30 May 1996; it has contested every general election since without winning a seat.',
    website:       'https://alcp.org.nz/',
    parliamentUrl: 'https://alcp.org.nz/',
    tagline:       'Truth, justice and freedom.',
    overview:      'The Aotearoa Legalise Cannabis Party is a single-issue party campaigning to legalise cannabis for medical, recreational and industrial (hemp) purposes. It advocates legal possession and cultivation for adults over 18, a regulated R18 market, a medical-cannabis card, and expunging past cannabis convictions, and frames prohibition as a justice issue that disproportionately affects Māori. It holds no seats in the current Parliament.',
    history:       'Founded in 1996 and led for its first years by Michael Appleby, the party has contested every general election and numerous by-elections without winning parliamentary representation; its best result was 1.66% of the party vote in 1996. Former ALCP candidates Nándor Tánczos and Metiria Turei later became Green Party MPs. It is co-led by Maki Herbert and Michael Appleby.',
    ideology:      ['Cannabis-law reform', 'Single-issue party', 'Drug-policy reform'],
    coreValues: [
      'Legalise the possession, growing and use of cannabis for adults over 18',
      '“Education not incarceration” — regulate rather than criminalise',
      'A regulated R18 cannabis market, including home-grown medicinal use',
      'Expunge past cannabis convictions',
      'Allow large-scale hemp cultivation for fuel, paper and materials',
      'Address enforcement that disproportionately affects Māori',
    ],
    keyPolicyAreas: ['crime-justice', 'health', 'economy'],
  },

  'conservative': {
    slug:          'conservative',
    name:          'Conservative Party NZ',
    fullName:      'Conservative Party NZ',
    founded:       2011,
    color:         '#1FA39A',
    textColor:     '#ffffff',
    leader:        'Helen Houghton',
    leaderTitle:   'Leader',
    status:        'extra-parliamentary',
    seats:         0, electorateSeats: 0, listSeats: 0,
    founded_note:  'First established in 2011 as the Conservative Party; later rebranded New Conservative, and reverted to Conservative Party NZ for 2026.',
    website:       'https://www.conservatives.nz/',
    parliamentUrl: 'https://www.conservatives.nz/',
    tagline:       'Strong families, a strong economy, a better future.',
    overview:      'The Conservative Party NZ is a socially and fiscally conservative party. It campaigns on traditional family values, lower taxation and smaller government, free speech, and citizen-initiated referendums, and states that it opposes what it calls “woke” ideology. It holds no seats in the current Parliament.',
    history:       'Founded in 2011 by businessman Colin Craig as the Conservative Party, its best result was 3.97% of the party vote in 2014 — never reaching the 5% threshold or an electorate seat. It was rebranded New Conservative in 2017 and reverted to Conservative Party NZ in 2026; Helen Houghton is its leader.',
    ideology:      ['Social conservatism', 'Fiscal conservatism'],
    coreValues: [
      'Defend what the party calls traditional values',
      'Restore “common sense” to government decision-making',
      'Reduce the size of government and its role in daily life',
      'Lower taxation, including a “Family Builder” tax policy',
      'Support binding citizen-initiated referendums',
      'Protect free speech',
    ],
    keyPolicyAreas: ['economy', 'crime-justice', 'education'],
  },

  'nz-outdoors': {
    slug:          'nz-outdoors',
    name:          'NZ Outdoors & Freedom',
    fullName:      'NZ Outdoors & Freedom Party',
    founded:       2015,
    color:         '#5F8D2E',
    textColor:     '#ffffff',
    leader:        'Sue Grey',
    leaderTitle:   'Leader',
    leaderPhoto:        '/mps/sue-grey.jpg',
    leaderPhotoCredit:  'Sam Hudson (Thisquality)',
    leaderPhotoLicense: 'CC BY-SA 4.0',
    leaderPhotoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Sue_Grey_(New_Zealand).jpg',
    status:        'extra-parliamentary',
    seats:         0, electorateSeats: 0, listSeats: 0,
    founded_note:  'Founded in 2015 as the NZ Outdoors Party, registered in 2017, and renamed the NZ Outdoors & Freedom Party in 2022.',
    website:       'https://outdoorsparty.co.nz/',
    parliamentUrl: 'https://outdoorsparty.co.nz/',
    tagline:       'Freedom, health, happiness and compassion as our measures of success.',
    overview:      'The NZ Outdoors & Freedom Party combines environmental and outdoor-recreation advocacy with a civil-liberties “freedom” platform. It campaigns to keep rivers and lakes clean and publicly accessible and against water privatisation, and states positions opposing 1080 poison, water fluoridation and vaccine mandates while supporting medicinal cannabis. It holds no seats in the current Parliament.',
    history:       'Co-founded in 2015 by Alan Simmons and freshwater-angling advocate David Haynes as an environmental and outdoors party, it registered in 2017. Lawyer Sue Grey joined the leadership in 2020 and the party took on anti-1080 and anti-mandate campaigning, was renamed in 2022, and joined the Freedoms NZ umbrella in 2023. It has never won a seat.',
    ideology:      ['Conservation', 'Civil liberties', 'Outdoors advocacy'],
    coreValues: [
      'Keep freshwater fresh, and rivers and lakes full and publicly accessible',
      'Water belongs to the public and is not for sale',
      'Protect the natural character of waterways and the conservation estate',
      'Oppose 1080 poison and water fluoridation',
      'Oppose what the party calls vaccine mandates, and support medicinal cannabis',
      'Greater media accountability and restored public trust',
    ],
    keyPolicyAreas: ['environment', 'health', 'crime-justice'],
  },

  'vision-nz': {
    slug:          'vision-nz',
    name:          'Vision NZ',
    fullName:      'Vision New Zealand',
    founded:       2019,
    color:         '#163A66',
    textColor:     '#ffffff',
    leader:        'Hannah Tamaki',
    leaderTitle:   'Leader',
    coLeader:      'Heker Robertson',
    coLeaderTitle: 'Deputy Leader',
    leaderPhoto:        '/mps/hannah-tamaki.jpg',
    leaderPhotoCredit:  'The Platform NZ',
    leaderPhotoLicense: 'CC BY 3.0',
    leaderPhotoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Hannah_Tamaki_in_August_2022_on_The_Platform_(cropped).jpg',
    status:        'extra-parliamentary',
    seats:         0, electorateSeats: 0, listSeats: 0,
    founded_note:  'Founded in May 2019 (initially as Coalition New Zealand) and registered as Vision NZ in December 2019.',
    website:       'https://www.vision.org.nz/',
    parliamentUrl: 'https://www.vision.org.nz/',
    tagline:       'One nation, one people, one vote.',
    overview:      'Vision New Zealand is a socially conservative, Christian-values party led by Hannah Tamaki, a co-leader of Destiny Church. It campaigns on conservative Christian and national-interest positions and presents itself as a values-based party open to all New Zealanders, not only church members. It holds no seats in the current Parliament.',
    history:       'Founded in 2019 by Hannah Tamaki, first as Coalition New Zealand and then registered as Vision NZ. It contested the 2020 general election (0.1%) and stood in 2023 as part of Brian Tamaki’s Freedoms NZ coalition, without winning a seat. Its deputy leader is Heker Robertson.',
    ideology:      ['Social conservatism', 'Christian politics'],
    coreValues: [
      'Define sex by what the party calls biological definitions',
      'Oppose abortion and the expansion of some LGBTQ+ rights',
      'Restrict immigration, including a proposed refugee moratorium',
      'Put the national interest first in trade and foreign agreements',
      'Support Māori financial autonomy, such as a Māori-owned bank',
      'Reflect Treaty of Waitangi considerations in policy',
    ],
    keyPolicyAreas: ['treaty-maori-affairs', 'immigration', 'economy'],
  },
}

// Ordered list for directory page — exclude 'independent'
export const PARTY_DIRECTORY_ORDER: PartySlug[] = [
  'national', 'labour', 'green', 'act', 'nzfirst', 'tpm', 'top',
]

// Minor parties that have a full profile PAGE but sit OUTSIDE the head-to-head
// policy comparison (which stays the parties that hold seats). NOT added to
// PARTY_DIRECTORY_ORDER, so they don't flood the comparison grid.
export const PROFILED_MINOR_PARTIES: PartySlug[] = [
  'womens-rights', 'animal-justice', 'alcp', 'conservative', 'nz-outdoors', 'vision-nz',
]
