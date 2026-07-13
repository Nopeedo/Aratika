/**
 * MP detail layer — enriched fields scraped from each MP's official
 * parliament.nz page (role history, dates, committees, ministerial /
 * spokesperson roles). Layered over the basic generated profiles in mps-data.ts.
 *
 * Added in priority batches (leaders → Cabinet → the rest). Bios are factual
 * summaries composed from the verified facts on each MP's official page — no
 * invented detail. Source: parliament.nz (current roles as published).
 */

import type { MPProfile } from './mps-data'

// Keyed by Arapono profile slug (firstname-lastname). Each value is a partial
// override merged over that MP's basic profile.
export const MP_DETAIL: Record<string, Partial<MPProfile>> = {

  // ── Batch 1: party leaders ──────────────────────────────────────────────

  'chris-hipkins': {
    title: 'Leader of the Opposition',
    enteredParliament: 2008,
    bio:
      'Chris Hipkins is the Member of Parliament for Remutaka and leader of the New Zealand Labour Party. ' +
      'First elected in 2008, he has served across six Parliaments (49th–54th). He became Labour leader and ' +
      'Prime Minister in January 2023, and has been Leader of the Opposition since the November 2023 election.',
    portfolios: [
      'Leader of the Opposition',
      'Labour Party Leader',
      'Opposition Spokesperson — National Security and Intelligence',
      'Opposition Spokesperson — Ministerial Services',
    ],
    committees: ['Intelligence and Security'],
  },

  'chloe-swarbrick': {
    title: 'Green Party Co-Leader',
    enteredParliament: 2017,
    bio:
      'Chlöe Swarbrick is the Member of Parliament for Auckland Central and co-leader of the Green Party of ' +
      'Aotearoa New Zealand. First elected as a list MP in 2017, she won the Auckland Central electorate in 2020 ' +
      'and became Green co-leader in 2024. She is the party’s spokesperson for finance, climate change, and mental health.',
    portfolios: [
      'Green Party Co-Leader',
      'Spokesperson — Finance',
      'Spokesperson — Climate Change',
      'Spokesperson — Mental Health',
      'Spokesperson — Drug Law Reform',
      'Spokesperson — Revenue',
    ],
  },

  'marama-davidson': {
    title: 'Green Party Co-Leader',
    enteredParliament: 2015,
    bio:
      'Marama Davidson is a Green Party list MP and has been co-leader of the Green Party of Aotearoa New Zealand ' +
      'since 2018. First elected in 2015, she is the party’s spokesperson for conservation, child poverty reduction, ' +
      'and the prevention of family and sexual violence.',
    portfolios: [
      'Green Party Co-Leader',
      'Spokesperson — Conservation',
      'Spokesperson — Child Poverty Reduction',
      'Spokesperson — Prevention of Family and Sexual Violence',
      'Spokesperson — Social Investment',
    ],
  },

  'david-seymour': {
    title: 'Deputy Prime Minister',
    enteredParliament: 2014,
    bio:
      'David Seymour is the Member of Parliament for Epsom and leader of ACT New Zealand. First elected in 2014, ' +
      'he became Deputy Prime Minister in May 2025 under the National–ACT–NZ First coalition. He is Minister for ' +
      'Regulation and an Associate Minister of Finance, Education, Health, and Justice.',
    portfolios: [
      'Deputy Prime Minister',
      'Minister for Regulation',
      'Associate Minister of Finance',
      'Associate Minister of Education (Partnership Schools)',
      'Associate Minister of Health (Pharmac)',
      'Associate Minister of Justice (Treaty Principles Bill)',
      'ACT Party Leader',
    ],
  },

  'winston-peters': {
    title: 'Minister of Foreign Affairs',
    enteredParliament: 1978,
    bio:
      'Winston Peters is a New Zealand First list MP and the party’s founder and leader. First elected in 1978, ' +
      'he is one of New Zealand’s longest-serving MPs and currently serves as Minister of Foreign Affairs in the ' +
      'coalition government. He has previously served as Deputy Prime Minister on multiple occasions.',
    portfolios: [
      'Minister of Foreign Affairs',
      'Minister for Racing',
      'Minister of Rail',
      'NZ First Party Leader',
    ],
    committees: ['Intelligence and Security', 'Privileges'],
  },

  'debbie-ngarewa-packer': {
    title: 'Te Pāti Māori Co-Leader',
    enteredParliament: 2020,
    bio:
      'Debbie Ngarewa-Packer is the Member of Parliament for Te Tai Hauāuru and co-leader of Te Pāti Māori. ' +
      'First elected in 2020, she sits on the Health Committee and serves as a party whip.',
    portfolios: ['Te Pāti Māori Co-Leader', 'Te Pāti Māori Whip (Matarau)'],
    committees: ['Health'],
  },

  'rawiri-waititi': {
    title: 'Te Pāti Māori Co-Leader',
    enteredParliament: 2020,
    bio:
      'Rawiri Waititi is the Member of Parliament for Waiariki and co-leader of Te Pāti Māori. First elected in ' +
      '2020, he sits on the Finance and Expenditure Committee.',
    portfolios: ['Te Pāti Māori Co-Leader'],
    committees: ['Finance and Expenditure'],
  },

  // ── Batch 2: Cabinet ministers ──────────────────────────────────────────

  'nicola-willis': {
    title: 'Minister of Finance',
    enteredParliament: 2018,
    bio:
      'Nicola Willis is a National Party list MP and deputy leader of the National Party. First elected in 2018, ' +
      'she is Minister of Finance, Minister for Economic Growth, and Minister for Social Investment in the coalition government.',
    portfolios: ['Minister of Finance', 'Minister for Economic Growth', 'Minister for Social Investment', 'National Party Deputy Leader'],
  },

  'chris-bishop': {
    title: 'Minister of Housing',
    enteredParliament: 2014,
    bio:
      'Chris Bishop is the Member of Parliament for Hutt South. First elected in 2014, he holds senior portfolios ' +
      'including Housing, Infrastructure, Transport and RMA Reform, and serves as Attorney-General.',
    portfolios: ['Attorney-General', 'Minister of Housing', 'Minister for Infrastructure', 'Minister for RMA Reform', 'Minister of Transport', 'Associate Minister of Finance'],
    committees: ['Privileges'],
  },

  'simeon-brown': {
    title: 'Minister of Health',
    enteredParliament: 2017,
    bio:
      'Simeon Brown is the Member of Parliament for Pakuranga. First elected in 2017, he is Minister of Health, ' +
      'Minister of Energy, and Minister for State Owned Enterprises.',
    portfolios: ['Minister of Health', 'Minister of Energy', 'Minister for State Owned Enterprises'],
  },

  'erica-stanford': {
    title: 'Minister of Education',
    enteredParliament: 2017,
    bio:
      'Erica Stanford is the Member of Parliament for East Coast Bays. First elected in 2017, she is Minister of ' +
      'Education and Minister of Immigration, and lead coordination minister for the Government’s response to the ' +
      'Royal Commission into Abuse in Care.',
    portfolios: ['Minister of Education', 'Minister of Immigration', 'Lead Coordination Minister — Abuse in Care Response'],
  },

  'paul-goldsmith': {
    title: 'Minister of Justice',
    enteredParliament: 2011,
    bio:
      'Paul Goldsmith is a National Party list MP. First elected in 2011, he is Minister of Justice, Minister for ' +
      'Treaty of Waitangi Negotiations, and Minister for Media and Communications, among other portfolios.',
    portfolios: ['Minister of Justice', 'Minister for Treaty of Waitangi Negotiations', 'Minister for Media and Communications', 'Minister for Arts, Culture and Heritage', 'Minister for Pacific Peoples', 'Minister for Public Service and Digitising Government'],
  },

  'mark-mitchell': {
    title: 'Minister of Police',
    enteredParliament: 2011,
    bio:
      'Mark Mitchell is the Member of Parliament for Whangaparāoa. First elected in 2011, he is Minister of Police, ' +
      'Minister of Corrections, and Minister for Emergency Management and Recovery.',
    portfolios: ['Minister of Police', 'Minister of Corrections', 'Minister for Emergency Management and Recovery', 'Minister for Ethnic Communities', 'Minister for Sport and Recreation', 'Associate Minister for National Security and Intelligence'],
  },

  'shane-reti': {
    enteredParliament: 2014,
    bio:
      'Dr Shane Reti is the Member of Parliament for Whangārei. A medical doctor first elected in 2014, he is a ' +
      'former Minister of Health and currently serves on the Foreign Affairs, Defence and Trade and the Governance ' +
      'and Administration select committees.',
    committees: ['Foreign Affairs, Defence and Trade', 'Governance and Administration'],
  },

  'todd-mcclay': {
    title: 'Minister for Trade and Investment',
    enteredParliament: 2008,
    bio:
      'Todd McClay is the Member of Parliament for Rotorua. First elected in 2008, he is Minister of Agriculture, ' +
      'Minister for Trade and Investment, and Minister of Forestry.',
    portfolios: ['Minister of Agriculture', 'Minister for Trade and Investment', 'Minister of Forestry', 'Associate Minister of Foreign Affairs'],
  },

  'louise-upston': {
    title: 'Leader of the House',
    enteredParliament: 2008,
    bio:
      'Louise Upston is the Member of Parliament for Taupō. First elected in 2008, she is Leader of the House and ' +
      'Minister for Social Development and Employment, with further portfolios including Tourism and Hospitality and Disability Issues.',
    portfolios: ['Leader of the House', 'Minister for Social Development and Employment', 'Minister for Child Poverty Reduction', 'Minister for Disability Issues', 'Minister for Tourism and Hospitality', 'Minister for the Community and Voluntary Sector'],
    committees: ['Business', 'Standing Orders'],
  },

  'casey-costello': {
    title: 'Minister of Customs',
    enteredParliament: 2023,
    bio:
      'Casey Costello is a New Zealand First list MP. First elected in 2023, she is Minister of Customs and Minister ' +
      'for Seniors, and an Associate Minister of Health, Immigration and Police.',
    portfolios: ['Minister of Customs', 'Minister for Seniors', 'Associate Minister of Health', 'Associate Minister of Immigration', 'Associate Minister of Police'],
  },

  'shane-jones': {
    title: 'Minister for Resources',
    enteredParliament: 2005,
    bio:
      'Shane Jones is a New Zealand First list MP and the party’s deputy leader. First elected in 2005, he is ' +
      'Minister for Resources, Minister for Regional Development, and Minister for Oceans and Fisheries.',
    portfolios: ['Minister for Resources', 'Minister for Regional Development', 'Minister for Oceans and Fisheries', 'Associate Minister of Finance', 'Associate Minister of Energy', 'NZ First Deputy Leader'],
  },

  'brooke-van-velden': {
    title: 'Minister for Workplace Relations and Safety',
    enteredParliament: 2020,
    bio:
      'Brooke van Velden is the Member of Parliament for Tāmaki and deputy leader of ACT New Zealand. First elected ' +
      'in 2020, she is Minister of Internal Affairs and Minister for Workplace Relations and Safety.',
    portfolios: ['Minister of Internal Affairs', 'Minister for Workplace Relations and Safety', 'ACT Party Deputy Leader'],
    committees: ['Intelligence and Security'],
  },

  'nicole-mckee': {
    title: 'Minister for Courts',
    enteredParliament: 2020,
    bio:
      'Nicole McKee is an ACT Party list MP. First elected in 2020, she is Minister for Courts and Associate ' +
      'Minister of Justice (Firearms).',
    portfolios: ['Minister for Courts', 'Associate Minister of Justice (Firearms)'],
  },

  // ── Batch 3a: remaining ministers ───────────────────────────────────────

  'karen-chhour': {
    title: 'Minister for Children',
    enteredParliament: 2020,
    bio: 'Karen Chhour is an ACT Party list MP. First elected in 2020, she is Minister for Children and Minister for the Prevention of Family and Sexual Violence.',
    portfolios: ['Minister for Children', 'Minister for the Prevention of Family and Sexual Violence'],
  },

  'matt-doocey': {
    title: 'Minister for Mental Health',
    enteredParliament: 2014,
    bio: 'Matt Doocey is the Member of Parliament for Waimakariri. First elected in 2014, he is Minister for Mental Health and an Associate Minister of Health.',
    portfolios: ['Minister for Mental Health', 'Associate Minister of Health'],
  },

  'nicola-grigg': {
    title: 'Minister for Women',
    enteredParliament: 2020,
    bio: 'Nicola Grigg is the Member of Parliament for Selwyn. First elected in 2020, she is Minister for Women, Minister for the Environment, and Minister of State for Trade and Investment.',
    portfolios: ['Minister for Women', 'Minister for the Environment', 'Minister of State for Trade and Investment', 'Associate Minister for ACC'],
  },

  'andrew-hoggard': {
    title: 'Minister for Biosecurity',
    enteredParliament: 2023,
    bio: 'Andrew Hoggard is an ACT Party list MP. First elected in 2023, he is Minister for Biosecurity and Minister for Food Safety, and an Associate Minister of Agriculture and of the Environment.',
    portfolios: ['Minister for Biosecurity', 'Minister for Food Safety', 'Associate Minister of Agriculture (Animal Welfare, Skills)', 'Associate Minister for the Environment'],
  },

  'chris-penk': {
    title: 'Minister of Defence',
    enteredParliament: 2017,
    bio: 'Chris Penk is the Member of Parliament for Kaipara ki Mahurangi. First elected in 2017, he is Minister of Defence, Minister for Building and Construction, and the Minister responsible for the GCSB and the NZSIS.',
    portfolios: ['Minister of Defence', 'Minister responsible for the GCSB', 'Minister responsible for the NZSIS', 'Minister for Building and Construction', 'Minister for Space', 'Minister for Veterans', 'Associate Minister for Emergency Management and Recovery'],
  },

  'tama-potaka': {
    title: 'Minister for Māori Development',
    enteredParliament: 2022,
    bio: 'Tama Potaka is the Member of Parliament for Hamilton West. First elected in 2022, he is Minister for Māori Development, Minister of Conservation, Minister for Whānau Ora, and Minister for Māori Crown Relations: Te Arawhiti.',
    portfolios: ['Minister for Māori Development', 'Minister of Conservation', 'Minister for Whānau Ora', 'Minister for Māori Crown Relations: Te Arawhiti', 'Associate Minister of Housing (Social Housing)'],
  },

  'penny-simmonds': {
    title: 'Minister for Tertiary Education',
    enteredParliament: 2020,
    bio: 'Penny Simmonds is the Member of Parliament for Invercargill. First elected in 2020, she is Minister for Science, Innovation and Technology and Minister for Tertiary Education and Skills.',
    portfolios: ['Minister for Science, Innovation and Technology', 'Minister for Tertiary Education', 'Associate Minister for Social Development and Employment'],
  },

  'simon-watts': {
    title: 'Minister of Climate Change',
    enteredParliament: 2020,
    bio: 'Simon Watts is the Member of Parliament for North Shore. First elected in 2020, he is Minister of Climate Change, Minister of Local Government, Minister of Revenue, and Minister for Auckland.',
    portfolios: ['Minister of Climate Change', 'Minister of Local Government', 'Minister of Revenue', 'Minister for Auckland'],
  },

  'mark-patterson': {
    title: 'Minister for Rural Communities',
    enteredParliament: 2017,
    bio: 'Mark Patterson is a New Zealand First list MP. First elected in 2017, he is Minister for Rural Communities and an Associate Minister of Agriculture and of Regional Development.',
    portfolios: ['Minister for Rural Communities', 'Associate Minister of Agriculture', 'Associate Minister for Regional Development'],
  },

  'james-meager': {
    title: 'Minister for Youth',
    enteredParliament: 2023,
    bio: 'James Meager is the Member of Parliament for Rangitata. First elected in 2023, he is Minister for Youth, Minister for the South Island, and Minister for Hunting and Fishing.',
    portfolios: ['Minister for Youth', 'Minister for the South Island', 'Minister for Hunting and Fishing', 'Associate Minister of Transport'],
  },

  'scott-simpson': {
    title: 'Minister for ACC',
    enteredParliament: 2011,
    bio: 'Scott Simpson is the Member of Parliament for Coromandel. First elected in 2011, he is Minister for ACC and Minister of Statistics, and Deputy Leader of the House.',
    portfolios: ['Minister for ACC', 'Minister of Statistics', 'Deputy Leader of the House'],
    committees: ['Privileges'],
  },

  // ── Batch 3b: senior opposition & backbench MPs ─────────────────────────

  'carmel-sepuloni': {
    title: 'Deputy Leader of the Opposition',
    enteredParliament: 2008,
    bio: 'Carmel Sepuloni is the Member of Parliament for Kelston and deputy leader of the Labour Party. First elected in 2008, she served as Deputy Prime Minister in the 2023 Labour government and is now Deputy Leader of the Opposition.',
    portfolios: ['Deputy Leader of the Opposition', 'Labour Party Deputy Leader', 'Opposition Spokesperson — Pacific Peoples', 'Opposition Spokesperson — Women', 'Opposition Spokesperson — Auckland Issues'],
  },

}
