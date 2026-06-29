/**
 * record-analysis.ts — flagship policy DEEP DIVES for the private accountability view.
 *
 * Sourcing model (founder's choice = "hybrid"):
 *  - `designedToAffect` — factual: what the policy targets.
 *  - `argumentsFor` / `argumentsAgainst` — DRAFTED summaries of the documented
 *    public debate, attributed to who made them. These are contested claims, not
 *    facts, and are flagged on the page. Verify against the linked analysis.
 *  - `mostAffected` — the groups the policy is directed at / identified in official
 *    analysis; the actual distributional detail is in the linked Regulatory Impact
 *    Statement (RIS). We do NOT invent statistics.
 *  - `official` — links to the official source area (the Act/bill, the RIS, the
 *    select-committee report). Find the specific document there.
 *  - `publicReception` — included ONLY where there is a citable, verifiable fact
 *    (e.g. a record number of submissions). No invented poll numbers.
 *
 * We never claim a policy "caused" an economic outcome — economic series move with
 * many forces at once (see the economy section, context-only).
 */

export interface PolicyAnalysis {
  id: string
  title: string
  relatedPromiseIds: string[]
  designedToAffect: string
  argumentsFor: string[]
  argumentsAgainst: string[]
  mostAffected: string
  official: { label: string; url: string }[]
  publicReception?: string
}

const LEG = 'https://www.legislation.govt.nz/'
const BILLS_URL = 'https://www.parliament.nz/en/pb/bills-and-laws/bills-proposed-laws/'
const TREASURY = 'https://www.treasury.govt.nz/'

export const POLICY_ANALYSIS: PolicyAnalysis[] = [
  {
    id: 'tax-package',
    title: 'Tax relief & cost-of-living package',
    relatedPromiseIds: ['tax-relief', 'bright-line', 'interest-deduct', 'familyboost'],
    designedToAffect: 'Take-home pay (PAYE thresholds), families with young children (FamilyBoost), and residential-property investors (interest deductibility, a 2-year bright-line test).',
    argumentsFor: [
      'The Government argues it eases cost-of-living pressure on the “squeezed middle” and unwinds years of bracket creep.',
      'Restoring interest deductibility and shortening the bright-line test, supporters say, removes a disincentive to provide rental housing.',
      'FamilyBoost is framed as targeted help with childcare costs for working families.',
    ],
    argumentsAgainst: [
      'Opposition parties and some economists argue the gains skew toward higher earners and landlords, while the fiscal cost crowds out spending elsewhere.',
      'Critics note FamilyBoost take-up came in below forecast, questioning its reach.',
      'Restoring landlord deductibility was criticised as benefiting property investors over renters/first-home buyers.',
    ],
    mostAffected: 'Middle-income earners (tax thresholds), property investors (deductibility + bright-line), and families with young children (FamilyBoost). Treasury/IRD published distributional analysis with Budget 2024 — see the official source for the breakdown by income.',
    official: [
      { label: 'Budget 2024 & tax analysis — Treasury', url: TREASURY },
      { label: 'Tax legislation — legislation.govt.nz', url: LEG },
    ],
    publicReception: 'Cost of living has consistently ranked as voters’ top concern in published polls; views on the package’s fairness were mixed (see poll aggregators for sourced figures).',
  },
  {
    id: 'law-and-order',
    title: 'Law & order: gang crackdown and Three Strikes',
    relatedPromiseIds: ['gang-patches', 'three-strikes'],
    designedToAffect: 'Gang members and police powers (public patch ban, dispersal/consorting powers); sentencing for serious repeat offenders (Three Strikes).',
    argumentsFor: [
      'The Government argues visible gang insignia intimidate the public and that the ban plus new powers give police clearer tools.',
      'Three Strikes is presented as deterrence and certainty for the most serious repeat offending, and as prioritising victims.',
    ],
    argumentsAgainst: [
      'The Law Society, parts of Police and civil-liberties groups warn of displacement rather than reduction, enforcement burden and rights concerns.',
      'Officials’ past analysis found weak evidence that Three Strikes deters; critics cite rising prison costs and disproportionate impact on Māori, who are over-represented in the justice system.',
    ],
    mostAffected: 'Gang-affiliated individuals and their communities; serious repeat offenders; Māori (over-representation in the justice system is noted in official analyses); Police and Corrections. See the RIS for the assessed impacts.',
    official: [
      { label: 'Gangs / sentencing Acts — legislation.govt.nz', url: LEG },
      { label: 'Regulatory Impact Statement (Justice) — Treasury area', url: TREASURY },
    ],
  },
  {
    id: 'three-waters',
    title: 'Three Waters repeal → Local Water Done Well',
    relatedPromiseIds: ['three-waters'],
    designedToAffect: 'Council-run drinking-water, wastewater and stormwater services, and the ratepayers who fund them.',
    argumentsFor: [
      'The Government argues repeal restores local control and removes co-governance arrangements, with councils deciding delivery models.',
      'Supporters say communities keep ownership of their assets.',
    ],
    argumentsAgainst: [
      'Critics argue the previous model’s scale and balance-sheet capacity would have spread the cost of large infrastructure upgrades.',
      'Local-government and some experts warn small/rural councils may face higher water costs, and that the underlying funding gap remains.',
    ],
    mostAffected: 'Ratepayers — especially in small and rural councils — and councils themselves. The RIS for the replacement framework sets out the assessed cost impacts.',
    official: [
      { label: 'Water Services repeal & replacement — legislation.govt.nz', url: LEG },
      { label: 'Local Water Done Well bills — Parliament', url: BILLS_URL },
    ],
  },
  {
    id: 'treaty-principles',
    title: 'Treaty Principles Bill',
    relatedPromiseIds: ['treaty-principles'],
    designedToAffect: 'How the principles of the Treaty of Waitangi are interpreted in law.',
    argumentsFor: [
      'ACT argued the principles should be defined by Parliament (and tested by referendum), in the name of equality before the law.',
    ],
    argumentsAgainst: [
      'Most parties (including coalition partners beyond ACT), legal academics, iwi and the Waitangi Tribunal argued the Bill misrepresented the Treaty, risked social division, and lacked partner consent.',
      'National supported it only to select committee and did not back it further.',
    ],
    mostAffected: 'Māori, and the wider Treaty-settlement and constitutional framework.',
    official: [
      { label: 'Treaty Principles Bill & select-committee report — Parliament', url: BILLS_URL },
      { label: 'Waitangi Tribunal reports', url: 'https://www.waitangitribunal.govt.nz/' },
    ],
    publicReception: 'The Bill drew a record number of select-committee submissions (the large majority opposed) and a major hīkoi; it was defeated at second reading in April 2025 (verifiable via Parliament).',
  },
  {
    id: 'rma-fast-track',
    title: 'Resource management: RMA repeal & Fast-track Approvals',
    relatedPromiseIds: ['rma-repeal', 'fast-track', 'rma-replace'],
    designedToAffect: 'How infrastructure, housing and development projects are consented; the role of ministers and councils in approvals.',
    argumentsFor: [
      'The Government argues the changes speed up consenting, cut cost and red tape, and unlock infrastructure and housing.',
    ],
    argumentsAgainst: [
      'Environmental groups, some legal experts and parts of local government warn of weakened environmental safeguards and uncertainty during the transition.',
      'The fast-track model’s ministerial decision-making drew concerns about due process and iwi/public input.',
    ],
    mostAffected: 'Developers and infrastructure proponents; environmental and conservation interests; councils and iwi. The RIS (Ministry for the Environment) sets out the assessed trade-offs.',
    official: [
      { label: 'Fast-track Approvals Act & RMA bills — legislation.govt.nz', url: LEG },
      { label: 'Regulatory Impact Statement (MfE) — Treasury area', url: TREASURY },
    ],
  },
  {
    id: 'maori-health',
    title: 'Disestablishing the Māori Health Authority',
    relatedPromiseIds: ['maori-health'],
    designedToAffect: 'How the health system is structured and how Māori health is commissioned (Te Aka Whai Ora abolished; functions returned to Health NZ / Ministry).',
    argumentsFor: [
      'The Government argues a single, accountable health system removes duplication and that everyone should access the same system.',
    ],
    argumentsAgainst: [
      'Critics and many in the health sector argue it removes a dedicated focus on persistent, well-documented Māori health inequities.',
    ],
    mostAffected: 'Māori health outcomes and Māori health providers; the structure of Health NZ. The RIS (Health) records the assessed impacts.',
    official: [
      { label: 'Pae Ora amendment — legislation.govt.nz', url: LEG },
      { label: 'Regulatory Impact Statement (Health) — Treasury area', url: TREASURY },
    ],
  },
  {
    id: 'welfare',
    title: 'Welfare: CPI indexation & work obligations',
    relatedPromiseIds: ['benefit-cpi', 'welfare-sanctions'],
    designedToAffect: 'How main benefit rates change over time (indexed to prices rather than wages), and the obligations/sanctions on job seekers.',
    argumentsFor: [
      'The Government argues CPI indexation protects benefits’ purchasing power while being fiscally sustainable, and that obligations strengthen work incentives.',
    ],
    argumentsAgainst: [
      'Critics argue indexing to prices rather than wages erodes benefits relative to incomes over time, widening the gap, and that sanctions can harm vulnerable people and children.',
    ],
    mostAffected: 'Beneficiaries and lower-income households over time — including sole parents and children in benefit-reliant families. The RIS (MSD) contains the distributional analysis.',
    official: [
      { label: 'Social security amendments — legislation.govt.nz', url: LEG },
      { label: 'Regulatory Impact Statement (MSD) — Treasury area', url: TREASURY },
    ],
  },
  {
    id: 'smokefree',
    title: 'Repeal of the smokefree amendments',
    relatedPromiseIds: ['smokefree'],
    designedToAffect: 'Tobacco regulation — repealing the previous government’s smokefree-generation ban, denicotinisation and retailer-reduction measures.',
    argumentsFor: [
      'The Government argued the repealed settings risked an illicit market and crime targeting fewer outlets, and cited retailer viability and personal choice; tobacco excise is also a revenue source.',
    ],
    argumentsAgainst: [
      'Public-health experts and Māori and Pacific health advocates argued repeal forgoes major health gains and worsens inequities, given higher smoking prevalence in those communities; the repeal was widely criticised by the health sector.',
    ],
    mostAffected: 'Smokers; Māori and Pacific communities (higher smoking prevalence); public-health outcomes. See the RIS (Health) for the assessed impacts.',
    official: [
      { label: 'Smokefree amendment — legislation.govt.nz', url: LEG },
      { label: 'Regulatory Impact Statement (Health) — Treasury area', url: TREASURY },
    ],
  },
]
