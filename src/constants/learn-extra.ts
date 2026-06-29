/**
 * Additional Learn modules (civic-participation set):
 *  - how-to-vote          How to enrol & vote
 *  - government-formation How a government is formed
 *  - have-your-say        How to have your say between elections
 *  - policy-topics        How policies work
 *
 * Same 4-tier (kids/beginner/intermediate/expert) shape as the core modules.
 * Factual & non-partisan. Reuses existing interactive widgets where they fit.
 */

import type { LearnModule } from './learn-data'

export const HOW_TO_VOTE: LearnModule = {
  id: 'how-to-vote',
  title: 'How to enrol & vote',
  subtitle: 'From signing up to casting your two ticks',
  icon: 'ClipboardCheck',
  interactives: ['two-votes'],
  status: 'live',
  tiers: {
    kids: {
      intro: [
        { body: 'Voting is how grown-ups in New Zealand help choose who makes the rules. When you turn 18, you get to vote too!' },
        { heading: 'Getting ready', body: 'Before you can vote, you put your name on a special list called the roll — so everyone knows you’re ready to have your say.' },
        { heading: 'Making your choice', body: 'On voting day you go to a voting place, get a special paper, and tick the boxes for who you want. Then you pop it in a box. No one else gets to see your ticks — it’s a secret!' },
      ],
      quiz: [
        { q: 'How old do you have to be to vote?', options: ['5', '18', '100'], answer: 1, explain: 'You can vote once you turn 18.' },
        { q: 'What is the list you sign up on called?', options: ['The roll', 'The scroll', 'The menu'], answer: 0, explain: 'It’s called the electoral roll.' },
        { q: 'Can other people see who you ticked?', options: ['Yes, everyone', 'No, it’s secret', 'Only your teacher'], answer: 1, explain: 'Your vote is completely secret.' },
      ],
    },
    beginner: {
      intro: [
        { body: 'Voting in New Zealand is free, secret, and only takes a few minutes. Here’s how it works from start to finish.' },
        { heading: '1. Check you can vote', body: 'You can vote if you’re 18 or over and a New Zealand citizen or permanent resident who has lived here at some point for more than a year.' },
        { heading: '2. Enrol', body: 'You need to be on the electoral roll. Enrolling is free at vote.nz — and you can now enrol right up to and including election day.' },
        { heading: '3. Vote', body: 'You can vote early (advance voting opens about two weeks before) or on election day. Go to any voting place, give your name, and you’ll get your voting paper. Then make your two ticks — try the demo below.' },
      ],
      quiz: [
        { q: 'Where can you enrol to vote?', options: ['vote.nz', 'Only at a bank', 'You’re added automatically'], answer: 0, explain: 'Enrol free at vote.nz (or by phone/paper).' },
        { q: 'When can you enrol by?', options: ['A month before, no later', 'Right up to and including election day', 'Only on your birthday'], answer: 1, explain: 'You can enrol up to and on election day.' },
        { q: 'How much does voting cost?', options: ['It’s free', '$5', '$20'], answer: 0, explain: 'Voting and enrolling are free.' },
        { q: 'What two choices do you make?', options: ['Party vote and electorate vote', 'PM and Deputy PM', 'Two parties'], answer: 0, explain: 'A party vote and an electorate vote.' },
      ],
    },
    intermediate: {
      intro: [
        { body: 'To vote in a general election you must be enrolled. Enrolment is open continuously and can be done online, by phone, or on paper — including on election day itself.' },
        { heading: 'Eligibility', body: 'You can enrol and vote if you are 18+ and a NZ citizen or permanent resident who has, at some time, lived in New Zealand continuously for 12 months or more.' },
        { heading: 'General or Māori roll', body: 'If you are of Māori descent, when you enrol you can choose the Māori roll or the general roll. Your choice decides whether you vote in a Māori or a general electorate.' },
        { heading: 'Ways to vote', body: 'Advance voting runs for roughly two weeks before election day; you can also vote on the day. If you’re away or overseas, you can cast a special vote.' },
        { heading: 'The ballot', body: 'You get one voting paper with two parts: the party vote and the electorate vote. Tick one party and one local candidate.' },
      ],
      quiz: [
        { q: 'Who can choose between the Māori and general rolls?', options: ['Anyone', 'People of Māori descent', 'Only candidates'], answer: 1, explain: 'People of Māori descent choose their roll when they enrol.' },
        { q: 'How long before election day does advance voting usually open?', options: ['About 2 weeks', 'The day before', '3 months'], answer: 0, explain: 'Advance voting runs for roughly two weeks.' },
        { q: 'Overseas on election day? You can…', options: ['Not vote', 'Cast a special vote', 'Vote twice next time'], answer: 1, explain: 'Away/overseas voters cast a special vote.' },
        { q: 'What’s on the voting paper?', options: ['One vote only', 'A party vote and an electorate vote', 'A list of every MP'], answer: 1, explain: 'Two votes: party and electorate.' },
      ],
    },
    expert: {
      intro: [
        { body: 'Enrolment and voting are administered by the independent Electoral Commission under the Electoral Act 1993. Enrolment is a legal requirement for eligible electors; voting itself is not compulsory.' },
        { heading: 'Same-day enrolment', body: 'Since 2023, electors can enrol or update details during advance voting and on election day, voting at the same time. These are processed as special votes.' },
        { heading: 'Special votes', body: 'Special votes cover electors not on a printed electorate roll — same-day enrolments, overseas voters, and others. They are counted in the official count, which is why results can shift after election night.' },
        { heading: 'Integrity', body: 'The ballot is secret, voting places are staffed and may be scrutineered, and the count is conducted with provision for recounts — designed to be both trustworthy and auditable.' },
      ],
      quiz: [
        { q: 'Is voting compulsory in New Zealand?', options: ['Yes', 'No, but enrolment is required', 'Both optional'], answer: 1, explain: 'Enrolment is legally required; voting is not compulsory.' },
        { q: 'How are same-day enrolment votes processed?', options: ['As ordinary votes', 'As special votes, counted later', 'They’re rejected'], answer: 1, explain: 'They are special votes, counted in the official count.' },
        { q: 'Why can final results differ from election night?', options: ['Party votes are recounted', 'Special votes are counted afterwards', 'MPs switch parties'], answer: 1, explain: 'Special votes (overseas, same-day) are counted after election night.' },
        { q: 'Who administers elections?', options: ['The governing party', 'The Electoral Commission', 'The Governor-General'], answer: 1, explain: 'The independent Electoral Commission.' },
      ],
    },
  },
}

export const GOVERNMENT_FORMATION: LearnModule = {
  id: 'government-formation',
  title: 'How a government is formed',
  subtitle: 'What happens after you vote',
  icon: 'Handshake',
  interactives: ['seat-allocator', 'build-government'],
  status: 'live',
  tiers: {
    kids: {
      intro: [
        { body: 'After everyone votes, we count the votes to see how many seats each team (party) gets in Parliament.' },
        { heading: 'Sharing the seats', body: 'There are about 120 seats. To be in charge, a team needs more than half. But usually no team gets that many on its own!' },
        { heading: 'Teaming up', body: 'So teams that agree on lots of things join together to make a bigger group with enough seats. That group gets to run the country. Try joining teams in the game below!' },
      ],
      quiz: [
        { q: 'What do we do after everyone votes?', options: ['Count the votes', 'Have a party', 'Start again'], answer: 0, explain: 'We count the votes to share out the seats.' },
        { q: 'To be in charge, a team needs…', options: ['More than half the seats', 'Just one seat', 'The most fans'], answer: 0, explain: 'More than half — at least 61 of 120.' },
        { q: 'What if no team has enough seats?', options: ['They give up', 'They join together', 'They flip a coin'], answer: 1, explain: 'They team up to reach more than half.' },
      ],
    },
    beginner: {
      intro: [
        { body: 'Winning the most votes doesn’t automatically make you the government. What matters is who can get the support of more than half of Parliament — at least 61 of the 120 seats.' },
        { heading: 'Why coalitions happen', body: 'Under MMP, one party rarely wins 61 seats alone. So after the election, parties talk and team up to reach a majority together. This is a coalition.' },
        { heading: 'The agreements', body: 'Parties write down what they’ve agreed — which policies they’ll support and which ministers each party gets. A smaller party might sign a “confidence and supply” deal to support the bigger party without fully joining.' },
        { heading: 'Forming the government', body: 'Once a group can show it has 61+ seats, the Governor-General appoints its leader as Prime Minister. Use the tools below to combine parties into a majority.' },
      ],
      quiz: [
        { q: 'How many seats are needed to govern?', options: ['The most votes', 'At least 61', 'Exactly 50'], answer: 1, explain: 'A majority — at least 61 of 120.' },
        { q: 'Why do parties form coalitions?', options: ['It’s the law', 'One party rarely wins 61 alone', 'To save money'], answer: 1, explain: 'MMP makes single-party majorities rare.' },
        { q: 'Who appoints the Prime Minister?', options: ['The Governor-General', 'The public directly', 'The media'], answer: 0, explain: 'The Governor-General appoints whoever can command a majority.' },
        { q: 'A confidence and supply agreement is…', options: ['A party fully joining government', 'A smaller party supporting the government on key votes', 'A new election'], answer: 1, explain: 'Support on confidence and the Budget, without fully joining.' },
      ],
    },
    intermediate: {
      intro: [
        { body: 'After an election, government formation hinges on which group of parties can command the confidence of the House — a majority willing to support the government on confidence votes and the Budget (supply).' },
        { heading: 'Types of agreement', body: 'Arrangements range from full coalitions (parties share Cabinet) to confidence-and-supply deals and looser cooperation agreements. Each sets out policy commitments and ministerial roles.' },
        { heading: 'Negotiation period', body: 'Because counting (including special votes) and negotiations take time, weeks can pass between election day and a new government. The previous government stays on in a “caretaker” role until then.' },
        { heading: 'Appointment', body: 'The Governor-General appoints as Prime Minister the person who can demonstrate the confidence of the House. Model this with the seat allocator and Build-a-Government below.' },
      ],
      quiz: [
        { q: 'What must a government be able to command?', options: ['The most TV coverage', 'The confidence of the House', 'Every electorate seat'], answer: 1, explain: 'It needs the confidence of a majority of MPs.' },
        { q: 'Between the election and a new government…', options: ['No one is in charge', 'The previous government continues in caretaker mode', 'Parliament is dissolved'], answer: 1, explain: 'A caretaker government operates until a new one forms.' },
        { q: 'A full coalition means…', options: ['Parties share Cabinet positions', 'One party governs alone', 'A second election'], answer: 0, explain: 'Coalition partners share ministerial roles.' },
        { q: 'Why can forming a government take weeks?', options: ['Special votes + negotiations take time', 'MPs must move house', 'The law requires a delay'], answer: 0, explain: 'Counting special votes and negotiating agreements takes time.' },
      ],
    },
    expert: {
      intro: [
        { body: 'Government formation is governed by constitutional convention rather than a single statute: the Governor-General appoints a Prime Minister able to command the confidence of the House of Representatives.' },
        { heading: 'Confidence and supply', body: '“Confidence” refers to votes testing whether the government retains the House’s support; “supply” refers to the Budget. A government must be able to win both to remain in office.' },
        { heading: 'The caretaker convention', body: 'Until a new administration is formed (or an incumbent confirms it retains confidence), the outgoing government observes the caretaker convention — limiting itself to routine, non-controversial decisions.' },
        { heading: '2023 example', body: 'The 2023 election produced a three-party arrangement: a National–ACT–New Zealand First coalition, set out in published agreements specifying portfolios and policy commitments.' },
      ],
      quiz: [
        { q: 'Government formation in NZ is primarily governed by…', options: ['A written constitution', 'Constitutional convention', 'The Electoral Act alone'], answer: 1, explain: 'Largely by convention — the confidence-of-the-House test.' },
        { q: 'What does “supply” refer to?', options: ['Military supplies', 'The Budget', 'Party funding'], answer: 1, explain: 'Supply = the Budget/appropriations.' },
        { q: 'Under the caretaker convention, the outgoing government…', options: ['Makes any decisions it likes', 'Limits itself to routine matters', 'Cannot act at all'], answer: 1, explain: 'It restricts itself to routine decisions until a government forms.' },
        { q: 'The 2023 government was formed by…', options: ['National alone', 'National–ACT–NZ First', 'Labour–Green'], answer: 1, explain: 'A National–ACT–NZ First coalition.' },
      ],
    },
  },
}

export const HAVE_YOUR_SAY: LearnModule = {
  id: 'have-your-say',
  title: 'Having your say between elections',
  subtitle: 'You don’t have to wait three years',
  icon: 'Megaphone',
  interactives: [],
  status: 'live',
  tiers: {
    kids: {
      intro: [
        { body: 'You don’t have to wait for voting day to have your say! There are lots of ways to tell the people in charge what you think.' },
        { heading: 'Speak up', body: 'You can write a letter, sign a petition (a list of people who all want the same thing), or tell the MP for your area your ideas.' },
        { heading: 'Every voice counts', body: 'When lots of people share what they think, it helps the grown-ups in Parliament make better choices for everyone.' },
      ],
      quiz: [
        { q: 'Do you have to wait for voting day to have your say?', options: ['Yes', 'No, there are lots of ways', 'Only on your birthday'], answer: 1, explain: 'You can speak up any time!' },
        { q: 'A petition is…', options: ['A type of pet', 'A list of people who want the same thing', 'A game'], answer: 1, explain: 'A petition shows lots of people agree on something.' },
        { q: 'Who can you tell your ideas to?', options: ['The MP for your area', 'No one', 'Only the King'], answer: 0, explain: 'Your local MP represents you.' },
      ],
    },
    beginner: {
      intro: [
        { body: 'Voting every three years isn’t the only way to be heard. Between elections, there are real, free ways to influence decisions.' },
        { heading: 'Make a submission', body: 'When a bill is being examined by a select committee, anyone can send a submission saying what they think — for, against, or suggesting changes. You can even speak to the committee.' },
        { heading: 'Petitions & your MP', body: 'You can start or sign a petition to Parliament, and you can write to or meet your local MP at their electorate clinic.' },
        { heading: 'Ask for information (OIA)', body: 'Under the Official Information Act, anyone can ask a government department for information, and they must usually reply within 20 working days.' },
        { heading: 'Aratika can help', body: 'Aratika’s Take Action studio helps you draft a submission, a letter to your MP, or an OIA request.' },
      ],
      quiz: [
        { q: 'Who can make a submission on a bill?', options: ['Only experts', 'Anyone', 'Only MPs'], answer: 1, explain: 'Anyone can make a submission to a select committee.' },
        { q: 'What does the OIA let you do?', options: ['Ask government for information', 'Change a law yourself', 'Become an MP'], answer: 0, explain: 'It lets anyone request official information.' },
        { q: 'How long does a department usually have to answer an OIA?', options: ['20 working days', '5 years', 'Never'], answer: 0, explain: 'Usually within 20 working days.' },
        { q: 'Where can you meet your local MP?', options: ['Their electorate clinic', 'Only on TV', 'You can’t'], answer: 0, explain: 'MPs hold local clinics for constituents.' },
      ],
    },
    intermediate: {
      intro: [
        { body: 'New Zealand’s system gives the public several formal channels to participate between elections — not just at the ballot box.' },
        { heading: 'Select committee submissions', body: 'Most bills are referred to a select committee that calls for public submissions. Submissions can be written and, if you wish, presented orally. Committees report back with recommended changes.' },
        { heading: 'Petitions', body: 'Any person can present a petition to the House asking it to take action. A petition with enough support can prompt a committee inquiry.' },
        { heading: 'Official information', body: 'The Official Information Act 1982 (central government) and LGOIMA (local government) let you request information, subject to limited withholding grounds.' },
        { heading: 'Local government', body: 'Councils consult on long-term plans, annual plans, and bylaws — you can submit on these too.' },
      ],
      quiz: [
        { q: 'What usually happens to most bills after the first reading?', options: ['They become law immediately', 'They’re referred to a select committee for submissions', 'They’re deleted'], answer: 1, explain: 'Select committees call for public submissions.' },
        { q: 'A petition to the House can…', options: ['Force a new election', 'Prompt a committee inquiry', 'Replace a minister'], answer: 1, explain: 'Petitions can lead to inquiries and action.' },
        { q: 'The OIA applies to…', options: ['Only the Prime Minister', 'Central (and via LGOIMA, local) government', 'Private companies'], answer: 1, explain: 'Central government (OIA) and local government (LGOIMA).' },
        { q: 'Councils consult the public on…', options: ['Long-term & annual plans and bylaws', 'Nothing', 'Only rates'], answer: 0, explain: 'You can submit on council plans and bylaws.' },
      ],
    },
    expert: {
      intro: [
        { body: 'Beyond triennial elections, participation rights are embedded across several statutes and Parliament’s Standing Orders, making New Zealand’s legislative process unusually open to public input.' },
        { heading: 'Submissions and Standing Orders', body: 'Standing Orders require most bills to be referred to a select committee that invites submissions and hears evidence; committees may recommend amendments before the second reading.' },
        { heading: 'Official information regime', body: 'The OIA 1982 (central) and LGOIMA 1987 (local) establish a principle of availability — information must be released unless a specified withholding ground applies, with Ombudsman review of refusals.' },
        { heading: 'Practical leverage', body: 'Coordinated, specific, evidence-based submissions are more influential than volume alone; committees weigh substance. Aratika’s Take Action tools help structure these.' },
      ],
      quiz: [
        { q: 'What governs referral of bills to select committees?', options: ['The Constitution Act', 'Parliament’s Standing Orders', 'The Electoral Act'], answer: 1, explain: 'Standing Orders set the committee process.' },
        { q: 'The OIA operates on a principle of…', options: ['Secrecy by default', 'Availability unless a withholding ground applies', 'Ministerial discretion only'], answer: 1, explain: 'Availability is the guiding principle; refusals are reviewable.' },
        { q: 'Who reviews an OIA refusal?', options: ['The Police', 'The Ombudsman', 'The Governor-General'], answer: 1, explain: 'The Ombudsman reviews refusals.' },
        { q: 'What makes a submission more influential?', options: ['Length alone', 'Specific, evidence-based argument', 'Submitting many copies'], answer: 1, explain: 'Committees weigh substance over volume.' },
      ],
    },
  },
}

export const POLICY_TOPICS_MOD: LearnModule = {
  id: 'how-policies-work',
  title: 'How policies work',
  subtitle: 'From a party’s plan to real change',
  icon: 'Scale',
  interactives: [],
  status: 'live',
  tiers: {
    kids: {
      intro: [
        { body: 'A policy is a plan for fixing a problem or making things better — like a plan for more houses, or cleaner rivers.' },
        { heading: 'Different ideas', body: 'Different teams (parties) have different plans for the same problem. That’s okay — it gives us choices!' },
        { heading: 'Picking what matters', body: 'When you vote, you can think about which problems matter most to you, and which team’s plan you like best.' },
      ],
      quiz: [
        { q: 'A policy is…', options: ['A plan to make things better', 'A type of police', 'A song'], answer: 0, explain: 'A policy is a plan for an issue.' },
        { q: 'Do all parties have the same plans?', options: ['Yes', 'No, they have different ideas', 'Only on Mondays'], answer: 1, explain: 'Different parties have different plans.' },
        { q: 'When voting you can think about…', options: ['Which problems matter to you', 'Your favourite colour only', 'Nothing'], answer: 0, explain: 'Think about the issues that matter to you.' },
      ],
    },
    beginner: {
      intro: [
        { body: 'A “policy” is a party’s plan or position on an issue — like housing, health, or climate. Policies are how parties say what they’d actually do if you vote for them.' },
        { heading: 'From idea to action', body: 'Policies turn into real changes through laws (bills), the Budget (how money is spent), and rules made by government departments.' },
        { heading: 'Aratika’s policy topics', body: 'Aratika sorts the big issues into topics — like housing, health, the economy, education, and climate — so you can compare where each party stands, side by side.' },
        { heading: 'Find what matters to you', body: 'There’s no “right” set of priorities. Use Aratika’s walkthrough to find the issues you care about, then compare the parties’ positions on them.' },
      ],
      quiz: [
        { q: 'A policy is…', options: ['A party’s plan/position on an issue', 'A type of election', 'A government building'], answer: 0, explain: 'A policy is a party’s position on an issue.' },
        { q: 'How do policies become real changes?', options: ['Through laws, the Budget, and rules', 'Automatically', 'Only through protests'], answer: 0, explain: 'Via legislation, spending, and regulation.' },
        { q: 'What does Aratika do with the issues?', options: ['Sorts them into topics to compare parties', 'Hides them', 'Ranks parties best to worst'], answer: 0, explain: 'It groups issues into topics so you can compare positions.' },
        { q: 'Who decides which issues matter most?', options: ['Aratika tells you', 'You do', 'The government'], answer: 1, explain: 'You decide what matters — Aratika just shows the facts.' },
      ],
    },
    intermediate: {
      intro: [
        { body: 'Public policy is a party’s or government’s settled approach to an issue. A position becomes a manifesto commitment, then — if the party is in government — is delivered through legislation, the Budget, or regulation.' },
        { heading: 'Why parties differ', body: 'Parties weigh values (e.g. individual choice vs collective provision) and evidence differently, so they reach different policies on the same issue. Comparing them is how voters judge fit.' },
        { heading: 'Topics on Aratika', body: 'Aratika organises positions into policy topics — housing, health, economy, education, climate, environment, crime & justice, Treaty & Māori affairs, immigration, foreign policy — drawn from official party material.' },
        { heading: 'Using them well', body: 'Identify your priority issues, read each party’s stated position, and check it against their record. Aratika presents positions factually — it does not recommend a vote.' },
      ],
      quiz: [
        { q: 'A manifesto is…', options: ['A party’s set of policy commitments', 'A type of vote', 'A government department'], answer: 0, explain: 'A manifesto sets out a party’s policy commitments.' },
        { q: 'Policies are delivered mainly through…', options: ['Legislation, the Budget, and regulation', 'Press releases only', 'Opinion polls'], answer: 0, explain: 'Laws, spending, and rules.' },
        { q: 'Why do parties reach different policies?', options: ['They weigh values and evidence differently', 'One party is always right', 'Random chance'], answer: 0, explain: 'Different values and readings of evidence.' },
        { q: 'Aratika’s policy pages…', options: ['Tell you who to vote for', 'Show positions factually so you decide', 'Only show one party'], answer: 1, explain: 'Aratika is non-partisan — it shows positions; you decide.' },
      ],
    },
    expert: {
      intro: [
        { body: 'Policy is the link between political values and state action. A position articulated in opposition or a manifesto is converted, in office, into instruments: primary legislation, appropriations, secondary legislation, and administrative practice.' },
        { heading: 'The policy cycle', body: 'Typically: problem definition → options and advice (often from the public service) → decision → implementation → evaluation. Manifesto commitments enter this cycle, shaped by feasibility, cost, and coalition agreements.' },
        { heading: 'Constraints', body: 'Policy is bounded by fiscal limits (the Budget), legal constraints (including the Bill of Rights and Treaty considerations), coalition compromises, and the advice of officials.' },
        { heading: 'Reading positions critically', body: 'Compare a party’s stated position with its revealed preferences — sponsored bills, votes, and spending. Stated and enacted policy can diverge, especially under coalition. Aratika surfaces positions, neutrally.' },
      ],
      quiz: [
        { q: 'Policy converts values into…', options: ['State action (laws, spending, rules)', 'Television ads', 'Election dates'], answer: 0, explain: 'Into legislation, appropriations, and administrative practice.' },
        { q: 'Which is a stage of the policy cycle?', options: ['Problem definition', 'Coin toss', 'Coronation'], answer: 0, explain: 'Problem definition → options → decision → implementation → evaluation.' },
        { q: 'A key constraint on policy is…', options: ['Fiscal and legal limits', 'The weather', 'Party colours'], answer: 0, explain: 'Budgets, law (e.g. NZBORA, Treaty), and coalition compromise.' },
        { q: 'To judge a party’s real position, also look at…', options: ['Its record — bills, votes, spending', 'Only its slogans', 'Its logo'], answer: 0, explain: 'Compare stated positions with revealed preferences.' },
      ],
    },
  },
}
