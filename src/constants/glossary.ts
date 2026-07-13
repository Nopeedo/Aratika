/**
 * Plain-language political glossary. Shared by the /glossary page and the
 * "Ask Arapono" companion's knowledge base.
 */

export interface GlossaryTerm {
  term: string
  def: string
  learn?: { href: string; label: string }
}

export const GLOSSARY: GlossaryTerm[] = [
  { term: 'MMP (Mixed Member Proportional)', def: 'New Zealand’s voting system. A party’s share of seats in Parliament roughly matches its share of the nationwide party vote.', learn: { href: '/learn/mmp', label: 'Learn about MMP' } },
  { term: 'Party vote', def: 'The more important of your two votes — it decides how many seats each party gets in Parliament.', learn: { href: '/learn/mmp', label: 'Your two votes' } },
  { term: 'Electorate vote', def: 'Your second vote — it chooses the single MP who represents your local area (your electorate).', learn: { href: '/learn/electorate-vs-list', label: 'Electorate vs list' } },
  { term: 'Electorate MP', def: 'An MP who won the most votes in a local electorate.' },
  { term: 'List MP', def: 'An MP who enters Parliament from their party’s ranked list, topping the party up to its proportional share of seats.' },
  { term: 'Electorate', def: 'A geographic area that elects one local MP. There are 65 general and 7 Māori electorates.' },
  { term: 'Māori electorates', def: 'Seats elected by voters who choose to be on the Māori roll. The number depends on Māori-roll enrolment.' },
  { term: 'Threshold', def: 'To win list seats, a party must get at least 5% of the party vote, or win at least one electorate.' },
  { term: 'Overhang', def: 'When a party wins more electorate seats than its party vote entitles it to. Parliament temporarily grows beyond 120 seats.' },
  { term: 'Sainte-Laguë method', def: 'The formula used to allocate seats proportionally among parties that clear the threshold.' },
  { term: 'Coalition', def: 'An arrangement where two or more parties combine to command a majority (at least 62 of 123 seats) and form a government.' },
  { term: 'Confidence and supply', def: 'An agreement under which a party agrees to support the government on key votes (confidence) and the Budget (supply).' },
  { term: 'Cabinet', def: 'The senior ministers who make the government’s collective decisions, which all ministers must publicly support.' },
  { term: 'Minister', def: 'An MP given responsibility for a portfolio (e.g. Health, Education) and the running of that area of government.' },
  { term: 'Prime Minister', def: 'The leader of the government — the MP who can command the confidence of the House.' },
  { term: 'Opposition', def: 'The parties not in government. They scrutinise and challenge the government and offer alternatives.' },
  { term: 'Speaker', def: 'The MP, elected by Parliament, who presides over debates impartially and keeps order in the House.' },
  { term: 'Backbencher', def: 'An MP who isn’t a minister — representing constituents, sitting on committees, debating and voting.' },
  { term: 'Whip', def: 'An MP who manages their party’s voting and attendance in the House.' },
  { term: 'Bill', def: 'A proposed law. It must pass through several stages and votes before it can become law.', learn: { href: '/learn/how-a-bill-becomes-law', label: 'How a bill becomes law' } },
  { term: 'Act', def: 'A bill that has passed all its stages and received Royal assent — it is now law.' },
  { term: 'Reading', def: 'A debate and vote on a bill. Bills are debated three times — the first, second and third readings.' },
  { term: 'Select committee', def: 'A small cross-party group of MPs that examines bills in detail and hears public submissions.' },
  { term: 'Submission', def: 'Your written (and optionally spoken) input to a select committee on a bill. Anyone can make one.' },
  { term: 'Division', def: 'A formal vote in the House. Most are “party votes” cast as a bloc; some are “personal votes” recorded individually.' },
  { term: 'Royal assent', def: 'The Governor-General’s signing of a bill, which turns it into an Act of Parliament.' },
  { term: 'Governor-General', def: 'The King’s representative in New Zealand. Gives Royal assent and formally appoints the government.' },
  { term: 'Hansard', def: 'The official written record of everything said in Parliament’s debates.' },
  { term: 'By-election', def: 'A vote held to fill a single electorate seat that becomes vacant between general elections.' },
  { term: 'Official Information Act (OIA)', def: 'The 1982 law that lets anyone request official information from government agencies, who must respond within 20 working days.' },
]
