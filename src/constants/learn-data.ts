/**
 * Aratika Learn — interactive civics curriculum content.
 *
 * Each module is authored at four difficulty tiers (kids → expert). The same
 * concept, four depths. Content is factual and non-partisan, drawn from
 * parliament.nz / elections.nz civics material.
 *
 * The MMP module is the flagship template; further modules follow the same shape.
 */

import { HOW_TO_VOTE, GOVERNMENT_FORMATION, HAVE_YOUR_SAY, POLICY_TOPICS_MOD } from './learn-extra'

export type LearnTier = 'kids' | 'beginner' | 'intermediate' | 'expert'

export const TIERS: { key: LearnTier; label: string; blurb: string }[] = [
  { key: 'kids',         label: 'Kids',         blurb: 'Ages 5–8 · simple & playful' },
  { key: 'beginner',     label: 'Beginner',     blurb: 'New to how it works' },
  { key: 'intermediate', label: 'Intermediate', blurb: 'The real mechanics' },
  { key: 'expert',       label: 'Expert',       blurb: 'The fine detail' },
]

export interface ContentBlock {
  heading?: string
  body: string
}

export interface QuizQuestion {
  q: string
  options: string[]
  answer: number          // index of correct option
  explain: string         // shown after answering
}

export interface TierContent {
  intro: ContentBlock[]
  quiz: QuizQuestion[]
}

export interface LearnModule {
  id: string
  title: string
  subtitle: string
  /** lucide icon name */
  icon: string
  /** which interactive widgets this module shows (rendered between intro and quiz) */
  interactives: ('seat-allocator' | 'build-government' | 'bill-journey' | 'two-votes' | 'parliament-parts' | 'committee-steps' | 'roles-grid')[]
  tiers: Record<LearnTier, TierContent>
  status: 'live' | 'coming-soon'
}

// ─── MMP module ───────────────────────────────────────────────────────────────

const MMP: LearnModule = {
  id: 'mmp',
  title: 'MMP & your two votes',
  subtitle: 'How New Zealanders choose their Parliament',
  icon: 'Vote',
  interactives: ['seat-allocator', 'build-government'],
  status: 'live',
  tiers: {

    kids: {
      intro: [
        { body: 'New Zealand has lots of people — far too many to all sit in one room and decide the rules! So we choose some people to do it for us. They meet in a big building called Parliament.' },
        { heading: 'We choose them by voting', body: 'When you grow up, you get to vote. Voting is how we say who we want to make the rules for everyone.' },
        { heading: 'Two ticks!', body: 'In New Zealand you get to make TWO choices when you vote. One choice picks a team (a party). The other choice picks one person from your local area. Try the colourful chart below — move the sliders and watch the seats fill up!' },
      ],
      quiz: [
        { q: 'Where do the people we choose make the rules?', options: ['A castle', 'Parliament', 'The library'], answer: 1, explain: 'Yes! They meet in Parliament.' },
        { q: 'How do we choose them?', options: ['By voting', 'By running fast', 'By drawing'], answer: 0, explain: 'That’s right — we vote!' },
        { q: 'How many choices do you get when you vote in New Zealand?', options: ['One', 'Two', 'Ten'], answer: 1, explain: 'Two ticks — one for a team, one for a local person.' },
      ],
    },

    beginner: {
      intro: [
        { body: 'New Zealand uses a voting system called MMP — Mixed Member Proportional. The big idea is simple: a party’s share of seats in Parliament should match its share of the votes.' },
        { heading: 'You get two votes', body: 'Your party vote chooses which party you support — this is the most important one, because it decides how many seats each party gets. Your electorate vote chooses the local MP for the area you live in.' },
        { heading: 'Parliament has 120 seats', body: 'To govern, a party (or a group of parties working together) needs more than half — at least 61 seats. Use the seat allocator below: drag the party-vote sliders and watch the seats fill the House.' },
      ],
      quiz: [
        { q: 'Which of your two votes decides how many seats a party gets?', options: ['The electorate vote', 'The party vote', 'Neither'], answer: 1, explain: 'The party vote is the key one — it sets each party’s share of seats.' },
        { q: 'About how many seats are usually in Parliament?', options: ['50', '120', '300'], answer: 1, explain: 'Parliament has around 120 seats.' },
        { q: 'How many seats are needed to govern?', options: ['At least 61', 'Exactly 100', 'Any number'], answer: 0, explain: 'You need more than half — at least 61 of 120.' },
        { q: 'What does your electorate vote choose?', options: ['The Prime Minister', 'Your local MP', 'The whole government'], answer: 1, explain: 'It picks the MP for your local electorate.' },
      ],
    },

    intermediate: {
      intro: [
        { body: 'Under MMP, each voter casts a party vote and an electorate vote. The party vote is decisive: it determines the overall proportion of seats each party holds in the 120-seat House.' },
        { heading: 'The threshold', body: 'To win list seats, a party must clear one of two hurdles: at least 5% of the nationwide party vote, OR win at least one electorate seat. Parties below the threshold (and without an electorate) get no seats.' },
        { heading: 'Electorate + list = total', body: 'A party first fills its electorate seats; the rest of its entitlement is topped up from its party list. So total seats stay proportional to the party vote.' },
        { heading: 'Forming a government', body: 'No single party usually wins a majority, so parties negotiate coalitions to reach 61+ seats. Try the allocator, then use Build-a-Government to combine parties into a majority.' },
      ],
      quiz: [
        { q: 'What is the party-vote threshold for list seats?', options: ['1%', '5% (or win an electorate)', '10%'], answer: 1, explain: 'A party needs 5% of the party vote, or at least one electorate seat.' },
        { q: 'How does a party fill its seat entitlement?', options: ['Only from the list', 'Electorate seats first, then list top-up', 'Only electorate seats'], answer: 1, explain: 'Electorate seats are filled first; the list tops up to the proportional total.' },
        { q: 'Why do NZ governments usually involve more than one party?', options: ['It’s required by law', 'One party rarely wins 61 seats alone', 'Parties must always merge'], answer: 1, explain: 'MMP makes single-party majorities rare, so coalitions form to reach 61.' },
        { q: 'Which vote determines overall proportionality?', options: ['Electorate vote', 'Party vote', 'Both equally'], answer: 1, explain: 'The party vote sets each party’s proportion of the 120 seats.' },
      ],
    },

    expert: {
      intro: [
        { body: 'MMP allocates seats using the Sainte-Laguë method. Each qualifying party’s party-vote total is divided by the odd numbers 1, 3, 5, 7… The resulting quotients are ranked, and the 120 seats awarded to the highest quotients in turn.' },
        { heading: 'Qualifying', body: 'Only parties that reach 5% of the party vote — or win at least one electorate — enter the Sainte-Laguë allocation. Votes for non-qualifying parties are effectively wasted, and are excluded before allocation.' },
        { heading: 'Overhang', body: 'If a party wins more electorate seats than its party-vote entitlement, it keeps the extra seats and Parliament temporarily grows beyond 120 — an overhang. The 54th Parliament has 123 seats for this reason.' },
        { heading: 'Coalition formation', body: 'After the count, the Governor-General appoints a government able to command confidence of the House. By convention this is the bloc that can demonstrate 61+ votes on confidence and supply. Use the tools below to model allocations and majorities.' },
      ],
      quiz: [
        { q: 'Which divisor sequence does Sainte-Laguë use?', options: ['1, 2, 3, 4…', '1, 3, 5, 7…', '2, 4, 6, 8…'], answer: 1, explain: 'Sainte-Laguë divides each party’s votes by 1, 3, 5, 7… and ranks the quotients.' },
        { q: 'What causes an overhang?', options: ['A party wins more electorates than its party-vote entitlement', 'Too many list MPs', 'A tie in the party vote'], answer: 0, explain: 'Overhang seats arise when electorate wins exceed the proportional entitlement.' },
        { q: 'What happens to votes for parties below the threshold?', options: ['They transfer to the largest party', 'They are excluded before allocation (wasted)', 'They become list seats'], answer: 1, explain: 'Sub-threshold votes are excluded from the Sainte-Laguë allocation.' },
        { q: 'On what basis does the Governor-General appoint a government?', options: ['The largest single party always governs', 'The bloc that can command confidence (61+) of the House', 'A nationwide referendum'], answer: 1, explain: 'Government is formed by whoever can command the confidence of the House.' },
      ],
    },
  },
}

// ─── How a bill becomes law ─────────────────────────────────────────────────

const BILL: LearnModule = {
  id: 'how-a-bill-becomes-law',
  title: 'How a bill becomes law',
  subtitle: 'A bill’s journey through the House',
  icon: 'FileText',
  interactives: ['bill-journey'],
  status: 'live',
  tiers: {

    kids: {
      intro: [
        { body: 'A new rule for the whole country starts as just an idea. While it’s still an idea being decided, we call it a bill.' },
        { heading: 'Lots of checks', body: 'A bill can’t become a real rule straight away. First, lots of people read it, talk about it, and fix it up to make it better.' },
        { heading: 'Voting yes', body: 'At each step, the people in Parliament vote. If enough of them say “yes” every time, the bill finally becomes a real rule — a law! Follow the bill below as it travels along its journey.' },
      ],
      quiz: [
        { q: 'What do we call a new rule while it is still being decided?', options: ['A law', 'A bill', 'A book'], answer: 1, explain: 'Yes — it’s called a bill until it passes!' },
        { q: 'How do people in Parliament decide if a bill should keep going?', options: ['They vote', 'They run a race', 'They flip a coin'], answer: 0, explain: 'They vote at each step.' },
        { q: 'What does a bill become if it passes all the steps?', options: ['A game', 'A law', 'A song'], answer: 1, explain: 'It becomes a law — a real rule for the country!' },
      ],
    },

    beginner: {
      intro: [
        { body: 'A bill is a proposed law. Before it can become law, it must pass through several stages in Parliament — and survive a vote at each one.' },
        { heading: 'Three readings', body: 'A bill is debated three times (called “readings”). In between, a select committee studies it closely and the public can have their say by making a submission.' },
        { heading: 'Becoming law', body: 'If a bill passes its third reading, the Governor-General signs it (“Royal assent”) and it becomes an Act — the official law of New Zealand. Click through each stage below to follow a bill’s journey.' },
      ],
      quiz: [
        { q: 'What is a bill?', options: ['A finished law', 'A proposed law', 'A type of vote'], answer: 1, explain: 'A bill is a proposed law that still has to pass through Parliament.' },
        { q: 'How can the public have a say on a bill?', options: ['By making a select committee submission', 'By voting in the House', 'They can’t'], answer: 0, explain: 'Anyone can make a submission to the select committee studying a bill.' },
        { q: 'How many times is a bill debated (“read”) in the House?', options: ['Once', 'Three times', 'Ten times'], answer: 1, explain: 'There are three readings, with stages in between.' },
        { q: 'What is a bill called once it becomes law?', options: ['An Act', 'A motion', 'A clause'], answer: 0, explain: 'After Royal assent, a bill becomes an Act of Parliament.' },
      ],
    },

    intermediate: {
      intro: [
        { body: 'Most bills are Government bills, but MPs can also introduce Member’s bills (drawn from a ballot), and there are Local and Private bills. Each follows broadly the same path through the House.' },
        { heading: 'The stages', body: 'First reading → select committee → second reading → committee of the whole House → third reading → Royal assent. A bill must pass a vote at each reading to proceed.' },
        { heading: 'Select committee', body: 'After the first reading, a select committee examines the bill, calls for public submissions, and reports back (usually within six months) with recommended changes.' },
        { heading: 'Committee of the whole House', body: 'Here the House debates the bill part by part and can make detailed amendments before the final third-reading vote. Step through the full journey below.' },
      ],
      quiz: [
        { q: 'How are Member’s bills usually selected for introduction?', options: ['By the Speaker’s choice', 'Drawn from a ballot', 'By public vote'], answer: 1, explain: 'Member’s bills are drawn at random from the ballot (“the biscuit tin”).' },
        { q: 'What happens at the committee of the whole House?', options: ['The bill is examined part by part and amended', 'The public makes submissions', 'The bill is introduced'], answer: 0, explain: 'The whole House goes through the bill in detail and can amend it.' },
        { q: 'Roughly how long does a select committee usually have to report back?', options: ['One week', 'Six months', 'Five years'], answer: 1, explain: 'The standard period is about six months.' },
        { q: 'Which stage comes immediately before Royal assent?', options: ['First reading', 'Third reading', 'Select committee'], answer: 1, explain: 'The third reading is the final vote before Royal assent.' },
      ],
    },

    expert: {
      intro: [
        { body: 'A bill’s passage is governed by the Standing Orders of the House. Each reading is a decision of the House; failure at any reading defeats the bill. Government bills dominate the order paper, with Member’s, Local and Private bills filling members’ days.' },
        { heading: 'Amendments & SOPs', body: 'Amendments are proposed through the select committee report and, at the committee of the whole House, via Supplementary Order Papers (SOPs). The committee stage can be taken in parts and debated by question.' },
        { heading: 'Urgency & time', body: 'The Government can move urgency to compress or skip stages and sit beyond normal hours. Some bills bypass select committee entirely under urgency — a recurring point of constitutional debate.' },
        { heading: 'Financial veto & entrenchment', body: 'The Government holds a financial veto over provisions with more than minor fiscal impact. A few provisions (e.g. core electoral law) are entrenched, requiring a 75% majority or a referendum to change. Walk the full process below.' },
      ],
      quiz: [
        { q: 'What instrument is used to propose amendments during the committee of the whole House?', options: ['A select committee report', 'A Supplementary Order Paper (SOP)', 'A Royal Commission'], answer: 1, explain: 'SOPs are used to propose amendments at the committee of the whole House stage.' },
        { q: 'What can the Government use to compress or skip stages of a bill?', options: ['Urgency', 'A referendum', 'The financial veto'], answer: 0, explain: 'Moving urgency lets the House compress stages and sit extended hours.' },
        { q: 'What majority is required to amend an entrenched electoral provision?', options: ['A simple majority', '75% (or a referendum)', 'Unanimous'], answer: 1, explain: 'Entrenched provisions need a 75% majority or a referendum.' },
        { q: 'What governs the detailed procedure for a bill’s passage?', options: ['The Standing Orders', 'The Bill of Rights', 'The Treaty of Waitangi'], answer: 0, explain: 'The Standing Orders of the House set out the procedure.' },
      ],
    },
  },
}

// ─── What Parliament is ──────────────────────────────────────────────────────

const WHAT_IS: LearnModule = {
  id: 'what-is-parliament',
  title: 'What Parliament is',
  subtitle: 'The House, the Beehive & the Crown',
  icon: 'Landmark',
  interactives: ['parliament-parts'],
  status: 'live',
  tiers: {
    kids: {
      intro: [
        { body: 'Parliament is where the rules for all of New Zealand are made. It’s a big group of people we choose, who meet in Wellington.' },
        { heading: 'A building shaped like a beehive!', body: 'One of the Parliament buildings is even shaped like a beehive — that’s where the country’s leaders have their offices.' },
        { heading: 'Working together', body: 'Lots of different people have different jobs. Tap the cards below to meet the main parts.' },
      ],
      quiz: [
        { q: 'What is made at Parliament?', options: ['Toys', 'The country’s rules (laws)', 'Food'], answer: 1, explain: 'Parliament makes New Zealand’s laws.' },
        { q: 'What is one Parliament building shaped like?', options: ['A beehive', 'A boat', 'A ball'], answer: 0, explain: 'The Beehive! That’s where ministers work.' },
        { q: 'Which city is Parliament in?', options: ['Auckland', 'Wellington', 'Hamilton'], answer: 1, explain: 'Parliament is in Wellington, the capital.' },
      ],
    },
    beginner: {
      intro: [
        { body: 'Parliament is the body that makes New Zealand’s laws. It is made up of the House of Representatives — the MPs we elect — and the Sovereign (King Charles III), represented here by the Governor-General.' },
        { heading: 'Parliament vs the Government', body: 'The Government — the Prime Minister and ministers — is formed from Parliament, but it’s a separate part that runs the country day to day. Ministers work in the Beehive.' },
        { heading: 'The main parts', body: 'Tap each card below to see who does what in New Zealand’s system.' },
      ],
      quiz: [
        { q: 'Which part of Parliament do we elect?', options: ['The Sovereign', 'The House of Representatives', 'The courts'], answer: 1, explain: 'We elect the MPs of the House of Representatives.' },
        { q: 'Who represents the King in New Zealand?', options: ['The Prime Minister', 'The Governor-General', 'The Speaker'], answer: 1, explain: 'The Governor-General is the King’s representative.' },
        { q: 'Where do ministers work?', options: ['The Beehive', 'The library', 'The courts'], answer: 0, explain: 'Ministers work in the Beehive, the executive wing.' },
      ],
    },
    intermediate: {
      intro: [
        { body: 'New Zealand’s system has three branches: the legislature (Parliament — the House plus the Sovereign), the executive (the Government: PM, Cabinet, ministers and the public service), and the judiciary (the courts).' },
        { heading: 'No single written constitution', body: 'New Zealand’s constitution is found across several sources — the Constitution Act 1986, other statutes, the Treaty of Waitangi, and conventions — rather than one document.' },
        { heading: 'Checks and balances', body: 'The House passes laws and controls money; the Government must hold the confidence of the House; the Governor-General gives Royal assent; the courts apply the law independently. Explore the parts below.' },
      ],
      quiz: [
        { q: 'Which branch makes the laws?', options: ['The executive', 'The legislature (Parliament)', 'The judiciary'], answer: 1, explain: 'Parliament — the legislature — makes the laws.' },
        { q: 'The Government must hold the ___ of the House.', options: ['confidence', 'silence', 'majority of ministers'], answer: 0, explain: 'A government must hold the confidence of the House.' },
        { q: 'Where is New Zealand’s constitution found?', options: ['In one written document', 'Across several sources and conventions', 'Only in the Treaty of Waitangi'], answer: 1, explain: 'It is spread across statutes, the Treaty, and conventions.' },
      ],
    },
    expert: {
      intro: [
        { body: 'New Zealand is a constitutional monarchy with a Westminster-style parliamentary system. Since the Legislative Council was abolished in 1951, Parliament has been unicameral — a single chamber, the House of Representatives, together with the Sovereign.' },
        { heading: 'Parliamentary sovereignty', body: 'Parliament can make or unmake any law; courts cannot strike down primary legislation. This is tempered by conventions, the Treaty, the Bill of Rights Act, and democratic accountability.' },
        { heading: 'Conventions & the Cabinet Manual', body: 'Much of the system runs on unwritten convention — codified in practice by the Cabinet Manual — including responsible government, collective responsibility, and the Governor-General acting on ministerial advice.' },
        { heading: 'Separation of powers', body: 'The separation is partial: the executive sits within and is drawn from the legislature, while the judiciary is independent. Explore each part below.' },
      ],
      quiz: [
        { q: 'How many chambers does the New Zealand Parliament have?', options: ['Two', 'One (unicameral)', 'Three'], answer: 1, explain: 'Unicameral since the Legislative Council was abolished in 1951.' },
        { q: 'What doctrine holds that Parliament can make or unmake any law?', options: ['Judicial review', 'Parliamentary sovereignty', 'Federalism'], answer: 1, explain: 'Parliamentary sovereignty.' },
        { q: 'What largely documents New Zealand’s constitutional conventions?', options: ['The Cabinet Manual', 'The Bill of Rights', 'The Electoral Act'], answer: 0, explain: 'The Cabinet Manual records much constitutional practice.' },
      ],
    },
  },
}

// ─── Electorate vs List MPs ──────────────────────────────────────────────────

const ELEC_LIST: LearnModule = {
  id: 'electorate-vs-list',
  title: 'Electorate vs List MPs',
  subtitle: 'Who actually represents you',
  icon: 'Users',
  interactives: ['two-votes'],
  status: 'live',
  tiers: {
    kids: {
      intro: [
        { body: 'New Zealand has two kinds of MPs. Some are picked to look after a local area — these are electorate MPs.' },
        { heading: 'List MPs', body: 'Others come from a party’s list to make the numbers fair. They’re called list MPs. Both kinds are real MPs who help make the rules!' },
        { heading: 'Your two votes', body: 'You help choose both. Try the ballot below to see what each of your two votes does.' },
      ],
      quiz: [
        { q: 'Which MP looks after a local area?', options: ['A list MP', 'An electorate MP', 'The Speaker'], answer: 1, explain: 'Electorate MPs represent a local area.' },
        { q: 'How many kinds of MPs are there?', options: ['Two', 'Five', 'Ten'], answer: 0, explain: 'Two — electorate MPs and list MPs.' },
        { q: 'How many votes do you get?', options: ['One', 'Two', 'Three'], answer: 1, explain: 'You get two votes.' },
      ],
    },
    beginner: {
      intro: [
        { body: 'An electorate MP wins the most votes in a local area (an electorate). A list MP gets in from their party’s ranked list, to top the party up to its fair share of seats.' },
        { heading: 'Your two votes choose both', body: 'Your electorate vote picks your local MP. Your party vote decides how many seats each party gets overall.' },
        { heading: 'Equal MPs', body: 'List MPs and electorate MPs have exactly the same status and powers. Try the ballot below.' },
      ],
      quiz: [
        { q: 'Your electorate vote chooses…', options: ['the Prime Minister', 'your local MP', 'the whole government'], answer: 1, explain: 'It elects your single local MP.' },
        { q: 'How does a list MP get into Parliament?', options: ['By winning an electorate', 'From their party’s list', 'By appointment'], answer: 1, explain: 'List MPs enter from their party’s ranked list.' },
        { q: 'Do list MPs and electorate MPs have equal status?', options: ['Yes', 'No, list MPs have less power', 'No, electorate MPs vote twice'], answer: 0, explain: 'They have exactly the same status.' },
      ],
    },
    intermediate: {
      intro: [
        { body: 'In the 2023 election there were 72 electorate seats (65 general + 7 Māori electorates). The remaining seats — around 48 — are list seats that top each party up to its proportional share.' },
        { heading: 'Electorate first, then list', body: 'A party’s party-vote share sets its total number of seats. It fills its electorate wins first, then tops up from its list to reach that total.' },
        { heading: 'The Māori electorates', body: 'Voters of Māori descent can choose to be on the Māori roll and elect MPs in dedicated Māori electorates. The number of Māori seats depends on Māori-roll enrolment.' },
      ],
      quiz: [
        { q: 'How many electorate seats were there in the 2023 election?', options: ['48', '72', '120'], answer: 1, explain: '72 — 65 general plus 7 Māori electorates.' },
        { q: 'Which seats does a party fill first?', options: ['List seats', 'Electorate seats, then list top-up', 'Neither — it’s random'], answer: 1, explain: 'Electorate wins first, then list top-up to the proportional total.' },
        { q: 'What determines the number of Māori electorate seats?', options: ['The Prime Minister', 'Māori-roll enrolment', 'A fixed number in the constitution'], answer: 1, explain: 'It depends on how many people are on the Māori roll.' },
      ],
    },
    expert: {
      intro: [
        { body: 'Parties submit closed, ranked party lists before the election. Candidates may stand in both an electorate and on the list (dual candidacy).' },
        { heading: 'List top-up mechanics', body: 'After electorate results, list seats are allocated so each qualifying party reaches its Sainte-Laguë entitlement. A candidate who loses their electorate can still enter Parliament from the list.' },
        { heading: 'Vacancies', body: 'An electorate vacancy triggers a by-election. A list vacancy is filled by the next available candidate on that party’s list — no by-election needed.' },
        { heading: 'The Māori roll', body: 'The number of Māori electorates is recalculated using the Māori Electoral Option and census data; voters can now switch rolls at most times. Try the ballot below.' },
      ],
      quiz: [
        { q: 'Can a candidate stand in both an electorate and on the list?', options: ['Yes (dual candidacy)', 'No', 'Only party leaders'], answer: 0, explain: 'Dual candidacy is allowed.' },
        { q: 'How is a list vacancy filled?', options: ['A by-election', 'The next candidate on the party’s list', 'The Speaker decides'], answer: 1, explain: 'The next available list candidate fills it — no by-election.' },
        { q: 'What triggers a by-election?', options: ['A list vacancy', 'An electorate vacancy', 'A change of government'], answer: 1, explain: 'Only electorate vacancies trigger by-elections.' },
      ],
    },
  },
}

// ─── Select committees ───────────────────────────────────────────────────────

const COMMITTEES: LearnModule = {
  id: 'select-committees',
  title: 'Select committees',
  subtitle: 'How the public has its say',
  icon: 'MessagesSquare',
  interactives: ['committee-steps'],
  status: 'live',
  tiers: {
    kids: {
      intro: [
        { body: 'A select committee is a small team of MPs who look closely at a new rule before it’s finished.' },
        { heading: 'They ask YOU!', body: 'The best part: they ask the public what they think. Anyone can send in their ideas — even kids!' },
        { heading: 'The steps', body: 'Tap through the cards below to see how it works.' },
      ],
      quiz: [
        { q: 'What is a select committee?', options: ['A sports team', 'A small group of MPs who study a rule', 'A type of vote'], answer: 1, explain: 'It’s a small group of MPs who study bills closely.' },
        { q: 'Who can send in ideas to a committee?', options: ['Only the Prime Minister', 'Anyone', 'Only judges'], answer: 1, explain: 'Anyone can make a submission!' },
        { q: 'What do committees look at?', options: ['New rules (bills)', 'The weather', 'Sports scores'], answer: 0, explain: 'They study bills in detail.' },
      ],
    },
    beginner: {
      intro: [
        { body: 'Select committees are small groups of MPs from different parties who study bills closely after their first reading.' },
        { heading: 'Public submissions', body: 'They invite the public to make submissions — anyone can have their say in writing, and ask to speak to the committee in person.' },
        { heading: 'Reporting back', body: 'The committee suggests changes and reports back to Parliament. Committees also keep an eye on what the government is doing. Step through the process below.' },
      ],
      quiz: [
        { q: 'What can the public make to a select committee?', options: ['A submission', 'A law', 'A budget'], answer: 0, explain: 'Anyone can make a submission.' },
        { q: 'When does a bill usually go to a committee?', options: ['After the first reading', 'After it becomes law', 'Never'], answer: 0, explain: 'Usually after the first reading.' },
        { q: 'What do committees do after studying a bill?', options: ['Suggest changes and report back', 'Delete the bill', 'Nothing'], answer: 0, explain: 'They recommend changes and report to the House.' },
      ],
    },
    intermediate: {
      intro: [
        { body: 'After a bill’s first reading it is usually referred to a subject select committee. The committee calls for public submissions, hears from submitters, officials and experts, and works through the bill in detail.' },
        { heading: 'Reporting back', body: 'It reports to the House — normally within six months — with recommended amendments, before the second reading.' },
        { heading: 'Beyond bills', body: 'Committees also scrutinise government spending through the Estimates and annual reviews, run inquiries into matters of public interest, and consider petitions. Step through the process below.' },
      ],
      quiz: [
        { q: 'Roughly how long does a committee usually have to report back?', options: ['One week', 'Six months', 'Five years'], answer: 1, explain: 'The standard period is about six months.' },
        { q: 'Which of these is a committee scrutiny role?', options: ['Estimates of government spending', 'Appointing the PM', 'Royal assent'], answer: 0, explain: 'Committees scrutinise spending via the Estimates and annual reviews.' },
        { q: 'Where do most bills go after the first reading?', options: ['Straight to Royal assent', 'A subject select committee', 'The courts'], answer: 1, explain: 'They’re referred to a subject select committee.' },
      ],
    },
    expert: {
      intro: [
        { body: 'Select committees operate under the Standing Orders. Membership is broadly proportional to party strength in the House, and a minister does not usually chair a subject committee scrutinising their own area.' },
        { heading: 'Powers', body: 'Committees can summon witnesses and call for papers (“send for persons, papers and records”). The government is required to respond to committee reports, including recommendations from inquiries.' },
        { heading: 'Financial scrutiny', body: 'The Estimates (forward spending) and annual review (past performance) are core committee functions, supported by the Finance and Expenditure Committee and the Office of the Auditor-General.' },
        { heading: 'Other functions', body: 'Committees examine international treaties, petitions, and subordinate legislation. Step through the public-submission process below.' },
      ],
      quiz: [
        { q: 'How is select committee membership determined?', options: ['By the Speaker alone', 'Proportional to party strength', 'By public vote'], answer: 1, explain: 'Membership is broadly proportional to party strength.' },
        { q: 'What power lets committees compel evidence?', options: ['Send for persons, papers and records', 'Royal prerogative', 'The financial veto'], answer: 0, explain: 'They can summon witnesses and call for papers.' },
        { q: 'Which is a core financial-scrutiny function of committees?', options: ['The Estimates and annual review', 'Royal assent', 'Dissolving Parliament'], answer: 0, explain: 'The Estimates and annual review are core committee functions.' },
      ],
    },
  },
}

// ─── Who does what ───────────────────────────────────────────────────────────

const ROLES_MOD: LearnModule = {
  id: 'roles',
  title: 'Who does what',
  subtitle: 'PM, Cabinet, Opposition & the Speaker',
  icon: 'UserCog',
  interactives: ['roles-grid'],
  status: 'live',
  tiers: {
    kids: {
      intro: [
        { body: 'Lots of people have different jobs in Parliament. The Prime Minister is the leader of the team that runs the country.' },
        { heading: 'Ministers', body: 'Ministers each look after one big topic — like health, or schools.' },
        { heading: 'The Speaker', body: 'The Speaker makes sure everyone takes turns and follows the rules. Tap the cards below to meet everyone.' },
      ],
      quiz: [
        { q: 'Who is the leader of the government?', options: ['The Speaker', 'The Prime Minister', 'A judge'], answer: 1, explain: 'The Prime Minister leads the government.' },
        { q: 'Who makes sure everyone takes turns in debates?', options: ['The Speaker', 'The King', 'A minister'], answer: 0, explain: 'The Speaker keeps order in the House.' },
        { q: 'What does a minister look after?', options: ['One big topic', 'The whole world', 'Nothing'], answer: 0, explain: 'Each minister runs one area, like health.' },
      ],
    },
    beginner: {
      intro: [
        { body: 'The Prime Minister leads the government. Ministers each run an area (a “portfolio”) like health or education, and together they form Cabinet.' },
        { heading: 'The Opposition', body: 'The parties not in government make up the Opposition. They challenge the government and offer alternatives, with “shadow” spokespeople.' },
        { heading: 'The Speaker & backbenchers', body: 'The Speaker runs debates fairly. Most MPs are backbenchers who represent their voters and sit on committees. Tap the cards below.' },
      ],
      quiz: [
        { q: 'What is a minister’s area of responsibility called?', options: ['A portfolio', 'A briefcase', 'A ballot'], answer: 0, explain: 'It’s called a portfolio.' },
        { q: 'What does the Opposition do?', options: ['Runs the courts', 'Challenges and scrutinises the government', 'Signs laws'], answer: 1, explain: 'It holds the government to account and offers alternatives.' },
        { q: 'What is an MP without a ministerial job called?', options: ['A backbencher', 'A judge', 'A whip'], answer: 0, explain: 'They’re called backbenchers.' },
      ],
    },
    intermediate: {
      intro: [
        { body: 'The Prime Minister commands the confidence of the House and chairs Cabinet. Cabinet makes collective decisions that all ministers must publicly support — “collective responsibility”.' },
        { heading: 'Accountability', body: 'Ministers are individually accountable to the House for their portfolios. The Opposition’s shadow ministers scrutinise their government counterparts.' },
        { heading: 'Keeping order', body: 'The Speaker, elected by MPs, presides impartially. Whips manage their party’s voting and attendance. Explore the roles below.' },
      ],
      quiz: [
        { q: 'What principle binds all ministers to support Cabinet decisions?', options: ['Collective responsibility', 'Parliamentary privilege', 'Royal assent'], answer: 0, explain: 'Collective responsibility binds ministers to Cabinet decisions.' },
        { q: 'Who presides impartially over the House?', options: ['The Prime Minister', 'The Speaker', 'The Governor-General'], answer: 1, explain: 'The Speaker, elected by MPs, presides impartially.' },
        { q: 'What do party whips manage?', options: ['Voting and attendance', 'Royal assent', 'The courts'], answer: 0, explain: 'Whips manage their party’s voting and attendance.' },
      ],
    },
    expert: {
      intro: [
        { body: 'New Zealand observes both collective Cabinet responsibility and individual ministerial responsibility. Ministers may sit inside or outside Cabinet, and support-party ministers may hold portfolios under confidence-and-supply arrangements.' },
        { heading: 'The Executive Council', body: 'The Executive Council — all ministers plus the Governor-General — gives legal effect to government decisions through Orders in Council.' },
        { heading: 'Managing the House', body: 'The Leader of the House arranges government business and the order paper. The Speaker holds a casting vote only where procedure requires and oversees Officers of Parliament.' },
        { heading: 'Support arrangements', body: 'Confidence-and-supply agreements set out how support parties will vote on confidence and the Budget, often in exchange for policy and portfolios. Explore the roles below.' },
      ],
      quiz: [
        { q: 'What body gives legal effect to government decisions via Orders in Council?', options: ['The Executive Council', 'The Supreme Court', 'The select committees'], answer: 0, explain: 'The Executive Council (ministers + Governor-General).' },
        { q: 'Who arranges the government’s business in the House?', options: ['The Leader of the House', 'The Auditor-General', 'The Clerk'], answer: 0, explain: 'The Leader of the House manages government business.' },
        { q: 'What do confidence-and-supply agreements primarily secure?', options: ['Support on confidence votes and the Budget', 'Royal assent', 'Judicial appointments'], answer: 0, explain: 'They secure support on confidence and supply (the Budget).' },
      ],
    },
  },
}

// ─── Module registry ──────────────────────────────────────────────────────────

export const LEARN_MODULES: LearnModule[] = [
  MMP,
  HOW_TO_VOTE,
  ELEC_LIST,
  GOVERNMENT_FORMATION,
  WHAT_IS,
  ROLES_MOD,
  BILL,
  COMMITTEES,
  HAVE_YOUR_SAY,
  POLICY_TOPICS_MOD,
]

export function getModule(id: string): LearnModule | undefined {
  return LEARN_MODULES.find((m) => m.id === id)
}

export const LEARN_MODULE_IDS = LEARN_MODULES.filter((m) => m.status === 'live').map((m) => m.id)
