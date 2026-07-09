/**
 * defining-bills.ts — the bills that defined the 54th Parliament and frame the
 * 2026 election. A small CURATED, non-partisan set (editorial).
 *
 * ⚠ Credibility rules:
 *  - `what` is a neutral description of what the bill does. `why` is neutral
 *    context on why it's an election issue (we never say a side is right).
 *  - `champion` is the party/government that drove the bill — a matter of public
 *    record, not a judgement.
 *  - We deliberately do NOT publish per-party for/against vote tallies (we can't
 *    verify individual votes from a live source). Instead we link to where the
 *    parties stand on the topic, and to the official record to verify.
 *  - Statuses are to a Jan 2026 knowledge cutoff — verify anything later.
 */

import type { PolicyTopic } from '@/types'

export interface DefiningBill {
  slug: string               // /bills/[slug] — its own breakdown page
  title: string
  what: string
  status: string
  statusKind: 'law' | 'defeated' | 'in-progress'
  why: string
  champion: string
  topic?: PolicyTopic        // links to /policies/[topic] — only where a clean match exists
  source: { label: string; url: string }

  // ── Optional in-depth breakdown (shown on /bills/[slug] when present) ────────
  // Populated bill-by-bill from credible, cited sources. Every fact must be
  // verifiable from `sources`; leave a field out rather than guess.
  overview?: string                                   // fuller what + context
  keyProvisions?: string[]                            // what it does / how it works
  timeline?: { date: string; event: string }[]        // when — dated milestones
  publicResponse?: string                             // where/who — submissions, protests, engagement
  outcome?: string                                    // current status, in detail
  sources?: { label: string; url: string }[]          // credible sources to verify
}

export const DEFINING_BILLS_META = {
  asOf: 'January 2026',
  note: 'A curated selection of the term’s most-debated bills. Descriptions are neutral; statuses are to January 2026 — confirm later changes at the official source.',
}

const LEG = (q: string) => ({ label: 'legislation.govt.nz', url: `https://www.legislation.govt.nz/` + (q ? `?search=${encodeURIComponent(q)}` : '') })
const PARL = { label: 'parliament.nz — Bills & laws', url: 'https://www.parliament.nz/en/pb/bills-and-laws/' }

export const DEFINING_BILLS: DefiningBill[] = [
  {
    slug: 'treaty-principles-bill',
    title: 'Treaty Principles Bill',
    what: 'Proposed to define the principles of the Treaty of Waitangi in legislation.',
    status: 'Defeated at second reading (April 2025)',
    statusKind: 'defeated',
    why: 'One of the most debated bills of the term — it drew the largest public response to any bill in New Zealand history and a national hīkoi to Parliament.',
    champion: 'Championed by ACT; supported by National and NZ First only to select committee under the coalition agreement.',
    source: PARL,
    overview:
      'A Member’s Bill in the name of ACT leader David Seymour, introduced under the ACT–National coalition agreement. It sought to set out the principles of the Treaty of Waitangi in statute — replacing principles that have been developed over decades by the courts and the Waitangi Tribunal — and define them in three parts. ACT had campaigned to ultimately put the principles to a public referendum, but its coalition partners committed only to supporting the bill to the select committee stage.',
    keyProvisions: [
      'Principle 1 — Civil government: the New Zealand Government has the right to govern all New Zealanders.',
      'Principle 2 — Rights of hapū and iwi Māori: the Crown would honour the rights hapū and iwi held when they signed the Treaty (the exact wording, and its treatment of rangatiratanga, was heavily debated).',
      'Principle 3 — Right to equality: all New Zealanders are equal under the law, with the same rights and duties.',
      'The principles would be interpreted from the Act itself, rather than continuing to be shaped by the courts and the Waitangi Tribunal.',
    ],
    timeline: [
      { date: '7 Nov 2024', event: 'Introduced to Parliament' },
      { date: '14 Nov 2024', event: 'Passed its first reading 68–54 (ACT, National, NZ First)' },
      { date: '19 Nov 2024', event: 'Tens of thousands join the Hīkoi mō te Tiriti at Parliament' },
      { date: 'Nov 2024 – Jan 2025', event: 'Record public submissions to the Justice Committee' },
      { date: '4 Apr 2025', event: 'Justice Committee reports back, recommending the bill not proceed' },
      { date: '10 Apr 2025', event: 'Defeated at second reading 112–11 — only ACT in favour' },
    ],
    publicResponse:
      'The bill drew the largest public response to any bill in New Zealand’s history. The Justice Committee received more than 300,000 submissions; of those analysed, about 90% opposed the bill and 8% supported it. On 19 November 2024, tens of thousands of people marched on Parliament in the Hīkoi mō te Tiriti — described as one of the largest demonstrations in the country’s history.',
    outcome:
      'Defeated at its second reading on 10 April 2025 by 112 votes to 11 — only ACT voted in favour, as National and NZ First had committed to supporting it only to the select committee. The bill will not become law, but the debate over how the Treaty’s principles are defined remains a live election issue.',
    sources: [
      { label: 'NZ Parliament — Bills & laws', url: 'https://www.parliament.nz/en/pb/bills-and-laws/' },
      { label: 'Ministry of Justice — A Treaty Principles Bill', url: 'https://www.justice.govt.nz/justice-sector-policy/key-initiatives/a-treaty-principles-bill/' },
      { label: 'RNZ — Treaty Principles Bill coverage', url: 'https://www.rnz.co.nz/news/political/534907/treaty-principles-bill-david-seymour-s-acknowledgement-of-rangatiratanga-raises-a-whole-lot-of-questions' },
    ],
  },
  {
    slug: 'three-strikes-sentencing',
    title: 'Three Strikes sentencing legislation',
    what: 'Reinstates a regime of escalating penalties for repeat serious violent and sexual offending.',
    status: 'Now law (in force June 2025)',
    statusKind: 'law',
    why: 'A flagship law-and-order policy that the parties take clearly different positions on — a dividing line between deterrence and rehabilitation.',
    champion: 'National-led government (National, ACT, NZ First); Justice Minister Paul Goldsmith.',
    topic: 'crime-justice',
    source: LEG('three strikes'),
    overview:
      'Reinstates the “three strikes” sentencing regime that the previous government repealed in 2022, with changes intended to make it more workable. Led by Justice Minister Paul Goldsmith, it was a law-and-order commitment of the National-led coalition and a long-standing ACT policy. It sets escalating, harsher consequences for people repeatedly convicted of serious violent and sexual offending.',
    keyProvisions: [
      'Applies to 42 serious violent and sexual offences, including new strangulation and suffocation offences.',
      'First strike: the offender is formally warned of the consequences of re-offending.',
      'Second strike: the sentence is served without parole.',
      'Third strike: the maximum penalty for the offence, without parole — with a narrow exception where a court finds that would be manifestly unjust.',
      'Warnings from the earlier three-strikes regime carry over where they meet the new threshold.',
    ],
    timeline: [
      { date: '25 Jun 2024', event: 'Introduced and passed its first reading' },
      { date: '17 Dec 2024', event: 'Receives royal assent' },
      { date: '17 Jun 2025', event: 'The three-strikes regime comes into force' },
    ],
    publicResponse:
      'The government argued the regime delivers justice for victims — noting Māori make up a large share of violent-crime victims. Opposition parties and many legal and academic submitters argued three-strikes laws do not reduce crime and fall disproportionately on Māori, who are over-represented in the justice system.',
    outcome:
      'Now law — the reinstated regime has applied to qualifying offences since 17 June 2025.',
    sources: [
      { label: 'Ministry of Justice — Three strikes law', url: 'https://www.justice.govt.nz/justice-sector-policy/key-initiatives/three-strikes-law/' },
      { label: 'Beehive — Three Strikes Bill passes third reading', url: 'https://www.beehive.govt.nz/release/three-strikes-bill-passes-third-reading' },
      { label: 'NZ Legislation — Reinstating Three Strikes', url: 'https://www.legislation.govt.nz/bill/government/2024/0065/latest/whole.html' },
    ],
  },
  {
    slug: 'gangs-act-2024',
    title: 'Gangs Act 2024',
    what: 'Bans gang insignia in public places and gives police new dispersal and consorting powers.',
    status: 'Now law (in force Nov 2024)',
    statusKind: 'law',
    why: 'Central to the government’s crime agenda and a key dividing line on policing versus civil liberties.',
    champion: 'National-led government; Justice Minister Paul Goldsmith.',
    topic: 'crime-justice',
    source: LEG('gangs'),
    overview:
      'A law-and-order commitment of the National-led coalition that gives police and the courts new powers to target criminal gangs — most visibly by banning gang insignia in public places. Police began enforcing the patch ban within minutes of the law taking effect.',
    keyProvisions: [
      'Makes it an offence to display gang insignia in a public place — up to 6 months’ imprisonment or a $5,000 fine. Insignia covers patches and the items they’re on, such as jackets or vehicles.',
      'Gives police dispersal powers: they can order gang members to leave and not associate in public for 7 days where three or more are gathering.',
      'Lets the courts make non-consorting orders stopping specified gang offenders from associating for up to 3 years.',
      'Applies to a scheduled list of 35 gangs.',
    ],
    timeline: [
      { date: '19 Sep 2024', event: 'Passed its third reading' },
      { date: '21 Nov 2024', event: 'Comes into force; police enforce the patch ban from day one' },
    ],
    publicResponse:
      'Supporters argue the ban curbs the public intimidation gangs use to assert control. Critics — including some legal groups — question whether it will reduce gang harm or simply displace it, and raise civil-liberties concerns about criminalising the display of insignia.',
    outcome:
      'Now law and in force since 21 November 2024.',
    sources: [
      { label: 'NZ Police — The Gangs Act 2024', url: 'https://www.police.govt.nz/about-us/programmes-and-initiatives/gangs-act-2024' },
      { label: 'Ministry of Justice — Gang laws come into effect', url: 'https://www.justice.govt.nz/about/news-and-media/news/gang-laws-come-into-effect/' },
      { label: 'NZ Legislation — Gangs Act 2024', url: 'https://www.legislation.govt.nz/act/public/2024/36/en/latest/' },
    ],
  },
  {
    slug: 'fast-track-approvals-act-2024',
    title: 'Fast-track Approvals Act 2024',
    what: 'Creates a one-stop fast-track consenting pathway for nationally and regionally significant projects.',
    status: 'Now law (2024)',
    statusKind: 'law',
    why: 'Defines the debate between speeding up development and maintaining environmental safeguards — and became a flashpoint over ministerial conflicts of interest.',
    champion: 'National-led government; Ministers Chris Bishop (National) and Shane Jones (NZ First).',
    topic: 'climate',
    source: LEG('fast-track approvals'),
    overview:
      'Creates a permanent “one-stop shop” to speed up approvals for building and development projects of national or regional significance — from roads and renewable energy to mining and housing. Led by Infrastructure and RMA Reform Minister Chris Bishop with Regional Development and Resources Minister Shane Jones, it was a flagship growth policy of the coalition and one of its most contested.',
    keyProvisions: [
      'Sets up a single fast-track consenting pathway that can override the usual approvals required under several environmental laws.',
      '149 “listed” projects, chosen by ministers, can use the pathway directly; other projects can apply to the Infrastructure Minister to be referred in.',
      'Expert panels — not ministers — make the final approval decisions, after the government dropped an earlier plan to give three ministers sign-off power.',
    ],
    timeline: [
      { date: '2024', event: 'Introduced as the Fast-track Approvals Bill' },
      { date: 'During passage', event: 'Government drops the plan for three ministers to have the final say; expert panels decide instead' },
      { date: '23 Dec 2024', event: 'Receives royal assent and becomes law' },
    ],
    publicResponse:
      'Backers say it removes red tape holding up infrastructure and housing. Environmental groups and opposition parties opposed it, warning it weakens environmental safeguards and public input. The scheme also drew scrutiny over ministerial conflicts of interest — including from the Office of the Auditor-General — after reporting on links between some listed projects and party donations.',
    outcome:
      'Now law. The fast-track regime is operating, with the 149 listed projects able to use it and others applying to be referred in.',
    sources: [
      { label: 'Ministry for the Environment — Fast-track Approvals Act', url: 'https://environment.govt.nz/acts-and-regulations/acts/fast-track-approvals/' },
      { label: 'NZ Legislation — Fast-track Approvals Act 2024', url: 'https://www.legislation.govt.nz/act/public/2024/56/en/latest/' },
      { label: 'Office of the Auditor-General — Fast-track conflicts', url: 'https://www.oag.parliament.nz/2025/fast-track-conflicts/part1.htm' },
    ],
  },
  {
    slug: 'resource-management-reform',
    title: 'Replacing the Resource Management Act (RMA)',
    what: 'Repeals and replaces the RMA with new resource-management legislation governing how land, housing and the environment are managed.',
    status: 'In progress (before select committee)',
    statusKind: 'in-progress',
    why: 'How New Zealand manages housing growth and the environment — a core election issue, and one of the biggest reforms of the term.',
    champion: 'National-led government; Minister for RMA Reform Chris Bishop.',
    topic: 'housing',
    source: PARL,
    overview:
      'The coalition’s biggest overhaul of how New Zealand manages land, housing and the environment. It scraps the Resource Management Act 1991 — long criticised across the political spectrum as slow and costly — and replaces it with two new laws. (The government first repealed the previous Labour government’s own RMA replacement in 2023, then set about writing its own.)',
    keyProvisions: [
      'A Planning Act — focused on enabling development and regulating how land is used.',
      'A Natural Environment Act — focused on protecting the natural environment, setting environmental “bottom lines” (limits) in advance rather than negotiating them project by project.',
      'Nationally consistent zones, rules and definitions, to reduce the “postcode lottery” where the same activity is treated differently by each council.',
    ],
    timeline: [
      { date: '9 Dec 2025', event: 'Natural Environment Bill and Planning Bill introduced to Parliament' },
      { date: '13 Feb 2026', event: 'Public submissions to the select committee close' },
      { date: 'By 2029', event: 'New planning system intended to be fully operational' },
    ],
    publicResponse:
      'The two replacement bills are before the select committee, with submissions open into February 2026 — so the public debate is still under way. Supporters want a faster, cheaper and more consistent system; critics worry that setting limits up front and speeding development could weaken environmental protections and public input.',
    outcome:
      'In progress. The two replacement bills are at the select committee stage; the new system is intended to be fully operational by 2029. Until then, the RMA still applies.',
    sources: [
      { label: 'Ministry for the Environment — Resource management reforms', url: 'https://environment.govt.nz/what-government-is-doing/areas-of-work/rma/rmreform/' },
      { label: 'Beehive — Resource management reform (factsheet)', url: 'https://www.beehive.govt.nz/sites/default/files/2025-03/Factsheet%20--%20Resource%20management%20reform.pdf' },
      { label: 'NZ Parliament — Bills & laws', url: 'https://www.parliament.nz/en/pb/bills-and-laws/' },
    ],
  },
  {
    slug: 'local-water-done-well',
    title: 'Local Water Done Well (Three Waters repeal)',
    what: 'Repealed the previous government’s Three Waters / Affordable Water reforms and replaced them with a council-led model.',
    status: 'Now law (2024–25)',
    statusKind: 'law',
    why: 'Reverses a major reform; how councils fund and deliver water — and pay for it — remains a live issue.',
    champion: 'National-led government; Local Government Minister Simeon Brown.',
    source: LEG('water services'),
    overview:
      'Reverses the previous Labour government’s Three Waters reforms, which would have moved drinking water, wastewater and stormwater into a small number of large, centralised entities. In its place, the coalition’s “Local Water Done Well” keeps water assets in council ownership and control, while requiring councils to show their water services are financially sustainable.',
    keyProvisions: [
      'Repealed Labour’s Three Waters / Affordable Water legislation — done first, under urgency, as part of the government’s 100-day plan.',
      'Keeps ownership and control of water assets with local councils, rather than centralised entities.',
      'Lets councils voluntarily set up or join council-controlled organisations and work together, so they can separate water debt from their balance sheets and borrow for infrastructure — but it’s optional, not mandatory.',
      'Requires councils to show their water services meet financial-sustainability and water-quality rules.',
    ],
    timeline: [
      { date: '14 Feb 2024', event: 'Labour’s Three Waters laws repealed under urgency' },
      { date: 'Mid 2024', event: 'First Local Water Done Well law enacted (preliminary arrangements)' },
      { date: 'Dec 2024 – mid 2025', event: 'Second law sets up the enduring council-led framework' },
    ],
    publicResponse:
      'Most councils had opposed Labour’s centralised model, and the government framed the change as restoring local control. The repeal and replacement were opposed by Labour, the Greens and Te Pāti Māori, who argued a centralised model was needed to fund major water upgrades and lift water quality.',
    outcome:
      'Now law. Three Waters is repealed and the Local Water Done Well framework is in place; councils are now working through how to deliver and fund water services under it.',
    sources: [
      { label: 'Beehive — Labour’s Three Waters legislation repealed', url: 'https://www.beehive.govt.nz/release/labour%E2%80%99s-three-waters-legislation-repealed' },
      { label: 'Beehive — Government to repeal Three Waters legislation', url: 'https://www.beehive.govt.nz/release/government-repeal-three-waters-legislation' },
      { label: 'RNZ — Three Waters repeal coverage', url: 'https://www.rnz.co.nz/news/political/509010/three-waters-repeal-it-s-going-to-be-councils-and-mayors-that-cop-it' },
    ],
  },
  {
    slug: 'pae-ora-maori-health-authority',
    title: 'Pae Ora (Māori Health Authority) amendment',
    what: 'Disestablished Te Aka Whai Ora, the Māori Health Authority.',
    status: 'Now law (2024)',
    statusKind: 'law',
    why: 'A defining change to how the health system is structured, with strong views on both sides.',
    champion: 'National-led government.',
    topic: 'health',
    source: LEG('pae ora'),
  },
  {
    slug: 'smokefree-environments-repeal',
    title: 'Smokefree environments repeal',
    what: 'Repealed the previous government’s smokefree measures (denicotinisation and the smokefree-generation ban).',
    status: 'Now law (2024)',
    statusKind: 'law',
    why: 'A reversal that became a flashpoint in public-health policy.',
    champion: 'National-led government.',
    topic: 'health',
    source: LEG('smokefree'),
  },
]

export const getDefiningBill = (slug: string): DefiningBill | undefined =>
  DEFINING_BILLS.find((b) => b.slug === slug)
