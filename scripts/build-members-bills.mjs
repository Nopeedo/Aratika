/**
 * build-members-bills.mjs — proposed members' bills by MP.
 *
 * Source: NZ Parliament, "Proposed Members' Bills" (bills.parliament.nz/
 * proposed-members-bills) — the official ballot list, captured 24 Jun 2026.
 * Each bill lists a Member in Charge; we map that to our MP slug and write
 * MP_MEMBERS_BILLS for the profile "Bills they've worked on" section.
 *
 * Run: node scripts/build-members-bills.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const GEN = join(__dirname, '..', 'src', 'constants', 'mps-generated.ts')
const OUT = join(__dirname, '..', 'src', 'constants', 'mps-members-bills.ts')

const PARTYMAP = {
  'New Zealand National': 'national', 'New Zealand Labour': 'labour',
  'Green Party of Aotearoa New Zealand': 'green', 'ACT New Zealand': 'act',
  'New Zealand First': 'nzfirst', 'Te Pāti Māori': 'tpm',
}

// [title, "Surname, [Hon/Dr] First", partyFull]
const RAW = [
  ['KiwiSaver (Financial Security in Retirement) Amendment Bill', 'Costley, Tim', 'New Zealand National'],
  ['Local Government (Auckland Council) (Disestablishment of Independent Māori Statutory Board) Amendment Bill', 'Wilson, Dr David', 'New Zealand First'],
  ['Parliamentary Budget Officer Bill', 'Edmonds, Hon Barbara', 'New Zealand Labour'],
  ['Rates Rebate (Rate-paying Occupiers) Amendment Bill', 'Hamilton, Ryan', 'New Zealand National'],
  ['Crimes (Sexual Violence Consent Reform) Amendment Bill', 'Weenink, Dr Vanessa', 'New Zealand National'],
  ['Protection of Freedom of Expression Bill', 'Foster, Andy', 'New Zealand First'],
  ['Cat Management Bill', 'Wade-Brown, Celia', 'Green Party of Aotearoa New Zealand'],
  ['Lawyers and Conveyancers (Employed Lawyers Providing Free Legal Services) Amendment Bill', 'Nakhle, Rima', 'New Zealand National'],
  ['Incorporated Societies (Small Societies) Amendment Bill', 'McClure, Laura', 'ACT New Zealand'],
  ['Education and Training (Upholding Te Tiriti o Waitangi) Amendment Bill', 'Prime, Hon Willow-Jean', 'New Zealand Labour'],
  ['Wilding Conifer Control and Eradication Legislation Bill', 'Anderson, Miles', 'New Zealand National'],
  ['Cash Transactions Protection Bill', 'Marcroft, Jenny', 'New Zealand First'],
  ['Oaths and Declarations (Administration of Declaration by Chartered Accountant) Amendment Bill', 'Redmayne, Suze', 'New Zealand National'],
  ['Members of Parliament (Duty to uphold Te Tiriti o Waitangi) Legislation Bill', 'Maipi-Clarke, Hana-Rawhiti', 'Te Pāti Māori'],
  ['Container Return Scheme Bill', 'Arbuckle, Jamie', 'New Zealand First'],
  ['Pae Ora (Healthy Futures) (Reproductive Health Strategy) Amendment Bill', 'Carter, Kahurangi', 'Green Party of Aotearoa New Zealand'],
  ['Social Security (Extension of Winter Energy Payment) Amendment Bill', 'Hernandez, Francisco', 'Green Party of Aotearoa New Zealand'],
  ['Valued Introduced Species Legislation Amendment Bill', 'Kuriger, Barbara', 'New Zealand National'],
  ['Resource Management (National and Regional Emissions) Amendment Bill', 'Cameron, Mark', 'ACT New Zealand'],
  ['Education and Training (Equal Treatment) Amendment Bill', 'Parmar, Dr Parmjeet', 'ACT New Zealand'],
  ['Local Government (Restoring Democratic Integrity) Amendment Bill', 'Luxton, Cameron', 'ACT New Zealand'],
  ['Chromated Copper Arsenate Treated Timber (Restricted Use) Legislation Bill', 'Genter, Hon Julie Anne', 'Green Party of Aotearoa New Zealand'],
  ['Policing (Cost Recovery for Special Policing Services) Amendment Bill', 'Fleming, Greg', 'New Zealand National'],
  ['Crimes (Corporate Homicide) Amendment Bill', 'Belich, Camilla', 'New Zealand Labour'],
  ['Prohibition of Seabed Mining Legislation Amendment Bill', 'Ngarewa-Packer, Debbie', 'Te Pāti Māori'],
  ["Residential Tenancies (Renters' Rights) Amendment", 'Paul, Tamatha', 'Green Party of Aotearoa New Zealand'],
  ['Tohorā Oranga Bill', 'Tuiono, Teanau', 'Green Party of Aotearoa New Zealand'],
  ['Employment Relations (Mediation Services) Amendment Bill', 'Bates, Carl', 'New Zealand National'],
  ['Electoral (Enhancing the Māori Electoral Option) Amendment Bill', 'Lyndon, Hūhana', 'Green Party of Aotearoa New Zealand'],
  ['Harmful Digital Communication (Political Commentary) Amendment Bill', 'Lee, Hon Melissa', 'New Zealand National'],
  ['Youth Homelessness Prevention Bill', 'Kaipara, Oriini', 'Te Pāti Māori'],
  ['Regulatory Standards Act Repeal Bill', 'Webb, Hon Dr Duncan', 'New Zealand Labour'],
  ['Pay Transparency Bill', 'Sepuloni, Hon Carmel', 'New Zealand Labour'],
  ['Parental Leave and Employment Protection (Shared Leave) Amendment Bill', 'Kirkpatrick, Dana', 'New Zealand National'],
  ['Accident Compensation (Extended Cover for FENZ Personnel) Amendment Bill', 'McAnulty, Hon Kieran', 'New Zealand Labour'],
  ['Smokefree Environments and Regulated Products (Vaping Products) Amendment Bill', 'Cheung, Dr Carlos', 'New Zealand National'],
  ['Broadcasting (Commercial Video on-Demand Levy) Amendment Bill', 'Jackson, Hon Willie', 'New Zealand Labour'],
  ['End of Life Choice Amendment Bill', 'Stephenson, Todd', 'ACT New Zealand'],
  ['Crimes (Offence of Failing to Report Child Harm) Amendment Bill', 'Bayly, Hon Andrew', 'New Zealand National'],
  ['Real Estate Agents (Disclosure of Defects) Amendment Bill', 'Williams, Arena', 'New Zealand Labour'],
  ['Building (Lapse of Building Consent) Amendment Bill', 'Lu, Nancy', 'New Zealand National'],
  ['Online Safety (Duties for Providers of Internet-Based Services) Bill', 'Davidson, Reuben', 'New Zealand Labour'],
  ['Marine Mammals (Enhanced Protection) Legislation Amendment Bill', 'Davidson, Mike', 'Green Party of Aotearoa New Zealand'],
  ['Building (Energy Efficient Office Buildings) Amendment Bill', 'Brooking, Hon Rachel', 'New Zealand Labour'],
  ['New Zealand Bill of Rights (Reports on Amendments) Amendment Bill', 'Walters, Vanushi', 'New Zealand Labour'],
  ['Consumer Guarantees (Agricultural Equipment Repair Information) Amendment Bill', 'Luxton, Hon Jo', 'New Zealand Labour'],
  ['Commerce (Motor Vehicle Information Scheme) Amendment Bill', 'Bidois, Dan', 'New Zealand National'],
  ['Smokefree Environments and Regulated Products (Preventing Industry Interference) Amendment Bill', 'Verrall, Hon Dr Ayesha', 'New Zealand Labour'],
  ['Retirement Villages (Fairer Repayments) Amendment Bill', 'Leary, Ingrid', 'New Zealand Labour'],
  ['Human Tissue (Organ Donation) Amendment Bill', 'MacLeod, David', 'New Zealand National'],
  ['Animal Products (Closing the Welfare Gap) Amendment Bill', 'Abel, Steve', 'Green Party of Aotearoa New Zealand'],
  ['Parental Leave and Employment Protection (Holiday Pay) Amendment Bill', 'Tinetti, Hon Jan', 'New Zealand Labour'],
  ['Residential Tenancies (Property Inspections) Amendment Bill', 'McLellan, Dr Tracey', 'New Zealand Labour'],
  ['New Zealand Bill of Rights (Right to Equal Suffrage in Local Elections) Amendment Bill', 'Uffindell, Sam', 'New Zealand National'],
  ['Unit Titles (Body Corporate Insurance Requirements) Amendment Bill', 'Nimon, Katie', 'New Zealand National'],
  ['Oranga Tamariki (Mokopuna Māori Authority) Amendment Bill', 'Kapa-Kingi, Mariameno', 'Te Pāti Māori'],
  ['Gang Free Ports Bill', 'Campbell, Dr Hamish', 'New Zealand National'],
  ['Consumer Guarantees (Motor Vehicle Repair Information) Amendment Bill', 'Andersen, Hon Ginny', 'New Zealand Labour'],
  ['Justices of the Peace (Regulating Justices) Amendment Bill', 'Salesa, Hon Jenny', 'New Zealand Labour'],
  ['Unlawful Occupation of Palestine Sanctions Bill', 'Swarbrick, Chlöe', 'Green Party of Aotearoa New Zealand'],
  ['Policing (Killing a Police Dog) Amendment Bill', 'McCallum, Grant', 'New Zealand National'],
  ['Sale and Supply of Alcohol (Repeal of Licensing Trust Monopolies) Amendment Bill', 'Court, Simon', 'ACT New Zealand'],
  ['Residential Tenancies (Unfair Rent Increases) Amendment Bill', 'Bennett, Glen', 'New Zealand Labour'],
  ['Social Security (Purpose and Principles for the Elimination of Hardship) Amendment Bill', 'Menéndez March, Ricardo', 'Green Party of Aotearoa New Zealand'],
  ['Immigration (Relationship with Human Rights Act) Amendment Bill', 'Xu-Nan, Dr Lawrence', 'Green Party of Aotearoa New Zealand'],
  ['Treaty of Waitangi (Empowerment of Waitangi Tribunal) Amendment Bill', 'Ferris, Tākuta', 'Te Pāti Māori'],
  ['Electricity Industry (Separation of Generation and Retail Businesses) Amendment Bill', 'Willis, Scott', 'Green Party of Aotearoa New Zealand'],
  ['Fair Trading (Cancellation of Subscription Contracts) Amendment Bill', 'Tangaere-Manuel, Cushla', 'New Zealand Labour'],
  ['Adverse Weather-affected Timber Recovery on Conservation Lands Bill', 'Pugh, Maureen', 'New Zealand National'],
  ["Security of Workers' Wages Amendment Bill", 'Russell, Hon Dr Deborah', 'New Zealand Labour'],
  ['Education and Training (Prioritisation in Enrolment Schemes) Amendment Bill', 'Boyack, Rachel', 'New Zealand Labour'],
  ['Community Trusts (Investment Transparency) Amendment Bill', 'Twyford, Hon Phil', 'New Zealand Labour'],
]

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

// Build name index from mps-generated.ts (slug + name + party).
const src = readFileSync(GEN, 'utf8')
const mps = []
const slugRe = /slug:\s*'([^']+)'/g
let sm
while ((sm = slugRe.exec(src))) {
  const win = src.slice(sm.index, sm.index + 800)
  const nm = win.match(/\bname:\s*'([^']+)'/)
  const pm = win.match(/\bparty:\s*'([^']+)'/)
  if (!nm) continue
  const tokens = nm[1].split(/\s+/)
  mps.push({
    slug: sm[1], name: nm[1], party: pm ? pm[1] : '',
    lastKey: norm(tokens[tokens.length - 1]),
    surnameKey: norm(tokens.slice(1).join('')),   // all but first name
    firstKey: norm(tokens[0]),
  })
}
console.log(`Indexed ${mps.length} MPs from mps-generated.ts`)

function findSlug(surnameRaw, firstRaw, partyCode) {
  const sk = norm(surnameRaw)
  const fk = norm(firstRaw.split(/\s+/)[0] || '')
  const keyMatch = (m) => m.surnameKey === sk || m.lastKey === sk
  // 1) same party + surname
  let c = mps.filter((m) => m.party === partyCode && keyMatch(m))
  // 2) any party + surname (covers MPs mis-tagged, e.g. some TPM as 'independent')
  if (c.length === 0) c = mps.filter(keyMatch)
  if (c.length === 1) return c[0].slug
  if (c.length > 1) {
    const byFirst = c.find((m) => m.firstKey === fk || m.firstKey.startsWith(fk) || fk.startsWith(m.firstKey))
    if (byFirst) return byFirst.slug
  }
  return null
}

const out = {}
const unmatched = []
for (const [title, member, partyFull] of RAW) {
  const [surnameRaw, restRaw = ''] = member.split(',')
  const firstRaw = restRaw.trim().replace(/^(Rt Hon|Hon|Dr|Sir|Dame)\s+/i, '').replace(/^(Hon|Dr)\s+/i, '')
  const partyCode = PARTYMAP[partyFull] || ''
  const slug = findSlug(surnameRaw.trim(), firstRaw, partyCode)
  if (!slug) { unmatched.push(`${member} (${partyFull})`); continue }
  ;(out[slug] ||= []).push({ title })
}

const matchedBills = Object.values(out).reduce((n, a) => n + a.length, 0)
console.log(`Matched ${matchedBills}/${RAW.length} bills across ${Object.keys(out).length} MPs`)
if (unmatched.length) console.log('UNMATCHED:\n  ' + unmatched.join('\n  '))

const body = `/**
 * mps-members-bills.ts — GENERATED by scripts/build-members-bills.mjs. Do not edit by hand.
 *
 * Proposed members' bills by MP slug, from NZ Parliament's official ballot list
 * (bills.parliament.nz/proposed-members-bills), captured ${'24 June 2026'}.
 * A members' bill is a bill proposed by a non-Minister MP, awaiting the ballot.
 */

export interface ProposedBill { title: string }

export const MEMBERS_BILLS_META = {
  asOf: '24 June 2026',
  total: ${RAW.length},
  sourceLabel: "Parliament — Proposed Members' Bills",
  sourceUrl: 'https://bills.parliament.nz/proposed-members-bills',
}

export const MP_MEMBERS_BILLS: Record<string, ProposedBill[]> = ${JSON.stringify(out, null, 2)}
`
writeFileSync(OUT, body)
console.log(`Wrote ${OUT}`)
