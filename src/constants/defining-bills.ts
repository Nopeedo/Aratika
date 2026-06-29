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
  title: string
  what: string
  status: string
  statusKind: 'law' | 'defeated' | 'in-progress'
  why: string
  champion: string
  topic?: PolicyTopic        // links to /policies/[topic] — only where a clean match exists
  source: { label: string; url: string }
}

export const DEFINING_BILLS_META = {
  asOf: 'January 2026',
  note: 'A curated selection of the term’s most-debated bills. Descriptions are neutral; statuses are to January 2026 — confirm later changes at the official source.',
}

const LEG = (q: string) => ({ label: 'legislation.govt.nz', url: `https://www.legislation.govt.nz/` + (q ? `?search=${encodeURIComponent(q)}` : '') })
const PARL = { label: 'parliament.nz — Bills & laws', url: 'https://www.parliament.nz/en/pb/bills-and-laws/' }

export const DEFINING_BILLS: DefiningBill[] = [
  {
    title: 'Treaty Principles Bill',
    what: 'Proposed to define the principles of the Treaty of Waitangi in legislation.',
    status: 'Defeated at second reading (April 2025)',
    statusKind: 'defeated',
    why: 'One of the most debated bills of the term — it drew a record number of select-committee submissions and a large national hīkoi.',
    champion: 'Championed by ACT; supported by National and NZ First only to select committee under the coalition agreement.',
    source: PARL,
  },
  {
    title: 'Three Strikes sentencing legislation',
    what: 'Reinstates a regime of escalating penalties for repeat serious violent and sexual offending.',
    status: 'Now law (2025)',
    statusKind: 'law',
    why: 'A flagship law-and-order policy that parties take clearly different positions on.',
    champion: 'National-led government (National, ACT, NZ First).',
    topic: 'crime-justice',
    source: LEG('three strikes'),
  },
  {
    title: 'Gangs Act 2024',
    what: 'Bans gang insignia in public places and gives police new dispersal and consorting powers.',
    status: 'Now law (2024)',
    statusKind: 'law',
    why: 'Central to the government’s crime agenda and a key dividing line on policing.',
    champion: 'National-led government.',
    topic: 'crime-justice',
    source: LEG('gangs'),
  },
  {
    title: 'Fast-track Approvals Act 2024',
    what: 'Creates a one-stop fast-track consenting pathway for nationally and regionally significant projects.',
    status: 'Now law (2024)',
    statusKind: 'law',
    why: 'Defines the debate between speeding up development and maintaining environmental safeguards.',
    champion: 'National-led government.',
    topic: 'climate',
    source: LEG('fast-track approvals'),
  },
  {
    title: 'Replacing the Resource Management Act (RMA)',
    what: 'Repeals and replaces the RMA with new resource-management legislation governing how land, housing and the environment are managed.',
    status: 'In progress (2025)',
    statusKind: 'in-progress',
    why: 'How New Zealand manages housing growth and the environment — a core election issue.',
    champion: 'National-led government.',
    topic: 'housing',
    source: PARL,
  },
  {
    title: 'Local Water Done Well (Three Waters repeal)',
    what: 'Repealed the previous government’s Three Waters / Affordable Water reforms and replaced them with a council-led model.',
    status: 'Now law (2024)',
    statusKind: 'law',
    why: 'Reverses a major reform; how councils fund and deliver water remains a live issue.',
    champion: 'National-led government.',
    source: LEG('water services'),
  },
  {
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
