/**
 * Data for the reveal-card learn interactives (What Parliament is, Select
 * committees, Who does what). Factual, non-partisan civics content.
 */

export interface RevealItem {
  label: string
  body: string
  icon: string // lucide icon name
}

export const PARLIAMENT_PARTS: RevealItem[] = [
  { label: 'The Sovereign', icon: 'Crown', body: 'King Charles III is New Zealand’s head of state. In New Zealand he is represented by the Governor-General, who gives Royal assent to laws and formally appoints the government.' },
  { label: 'The House of Representatives', icon: 'Users', body: 'The MPs New Zealanders elect — around 120 of them. The House debates and passes laws, votes on money, and holds the government to account. This is the part you vote for.' },
  { label: 'The Government (the Beehive)', icon: 'Briefcase', body: 'The Prime Minister and ministers who run the country day to day. The government is formed from Parliament but is a distinct branch — the “executive”. Ministers work in the Beehive.' },
  { label: 'The Courts', icon: 'Scale', body: 'The judiciary interprets and applies the law independently of Parliament and the government. Keeping these branches separate is a key check on power.' },
]

export const COMMITTEE_STEPS: RevealItem[] = [
  { label: 'A bill is referred', icon: 'FileInput', body: 'After a bill’s first reading, the House usually sends it to a subject select committee — a small, cross-party group of MPs — for detailed study.' },
  { label: 'The public is invited', icon: 'Megaphone', body: 'The committee calls for public submissions. Anyone — you, an expert, an organisation — can send a written submission and ask to speak to it.' },
  { label: 'Submissions are heard', icon: 'Ear', body: 'The committee listens to submitters, officials and experts, and works through the detail of the bill, often proposing changes.' },
  { label: 'The committee reports back', icon: 'FileCheck', body: 'The committee reports to the House (usually within six months) with its recommended changes, before the bill’s second reading.' },
  { label: 'Beyond bills', icon: 'Search', body: 'Committees also scrutinise government spending (Estimates and annual reviews), run inquiries, and consider petitions and international treaties.' },
]

export const ROLES: RevealItem[] = [
  { label: 'Prime Minister', icon: 'Star', body: 'Leads the government and chairs Cabinet. The PM is the MP who can command the confidence of the House — usually the leader of the largest governing party.' },
  { label: 'Cabinet & Ministers', icon: 'Briefcase', body: 'Senior MPs who each run a portfolio (health, education, finance…). In Cabinet they make collective decisions that all ministers must publicly support.' },
  { label: 'The Opposition', icon: 'Swords', body: 'The parties not in government. They scrutinise and challenge the government and offer alternatives, with “shadow” spokespeople matching each minister.' },
  { label: 'The Speaker', icon: 'Gavel', body: 'Elected by MPs to preside over debates impartially, keep order, and apply the rules of the House. The Speaker steps back from party politics.' },
  { label: 'Backbenchers', icon: 'Users', body: 'MPs without ministerial roles. They represent their voters, sit on select committees, debate, and vote — the backbone of the House.' },
  { label: 'The Governor-General', icon: 'Crown', body: 'The King’s representative in New Zealand. Gives Royal assent to laws, appoints the government, and acts on the advice of ministers.' },
]
