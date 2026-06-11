const fs = require('fs')

// Roster: "Surname, Firstname||party||seat||parliamentSlug"
const ROSTER = `
Abel, Steve||green||list||abel-steve
Andersen, Ginny||labour||list||andersen-ginny
Anderson, Miles||national||Waitaki||anderson-miles
Arbuckle, Jamie||nzfirst||list||arbuckle-jamie
Bates, Carl||national||Whanganui||bates-carl
Bayly, Andrew||national||Port Waikato||bayly-andrew
Belich, Camilla||labour||list||belich-camilla
Bennett, Glen||labour||list||bennett-glen
Bidois, Dan||national||Northcote||bidois-dan
Boyack, Rachel||labour||Nelson||boyack-rachel
Brewer, Cameron||national||Upper Harbour||brewer-cameron
Brooking, Rachel||labour||Dunedin||brooking-rachel
Brownlee, Gerry||national||list||brownlee-gerry
Butterick, Mike||national||Wairarapa||butterick-mike
Cameron, Mark||act||list||cameron-mark
Campbell, Hamish||national||Ilam||campbell-hamish
Carter, Kahurangi||green||list||carter-kahurangi
Cheung, Carlos||national||Mt Roskill||cheung-carlos
Costley, Tim||national||Ōtaki||costley-tim
Court, Simon||act||list||court-simon
Dansey, Georgie||labour||list||dansey-georgie
Davidson, Mike||green||list||davidson-mike
Davidson, Reuben||labour||Christchurch East||davidson-reuben
Edmonds, Barbara||labour||Mana||edmonds-barbara
Ferris, Tākuta||independent||Te Tai Tonga||ferris-tākuta
Fleming, Greg||national||Maungakiekie||fleming-greg
Foster, Andy||nzfirst||list||foster-andy
Garcia, Paulo||national||New Lynn||garcia-paulo
Genter, Julie Anne||green||Rongotai||genter-julie-anne
Halbert, Shanan||labour||list||halbert-shanan
Hamilton, Ryan||national||Hamilton East||hamilton-ryan
Hernandez, Francisco||green||list||hernandez-francisco
Jackson, Willie||labour||list||jackson-willie
Kaipara, Oriini||tpm||Tāmaki Makaurau||kaipara-oriini
Kapa-Kingi, Mariameno||independent||Te Tai Tokerau||kapa-kingi-mariameno
Kirkpatrick, Dana||national||East Coast||kirkpatrick-dana
Kuriger, Barbara||national||Taranaki-King Country||kuriger-barbara
Leary, Ingrid||labour||Taieri||leary-ingrid
Lee, Melissa||national||list||lee-melissa
Lu, Nancy||national||list||lu-nancy
Luxton, Cameron||act||list||luxton-cameron
Luxton, Jo||labour||list||luxton-jo
Lyndon, Hūhana||green||list||lyndon-hūhana
MacLeod, David||national||New Plymouth||macleod-david
Maipi-Clarke, Hana-Rawhiti||tpm||Hauraki-Waikato||maipi-clarke-hana-rawhiti
Marcroft, Jenny||nzfirst||list||marcroft-jenny
McAnulty, Kieran||labour||list||mcanulty-kieran
McCallum, Grant||national||Northland||mccallum-grant
McClure, Laura||act||list||trask-laura
McLellan, Tracey||labour||list||mclellan-tracey
Menéndez March, Ricardo||green||list||menéndez-march-ricardo
Mooney, Joseph||national||Southland||mooney-joseph
Nakhle, Rima||national||Takanini||nakhle-rima
Nimon, Katie||national||Napier||nimon-katie
O'Connor, Damien||labour||list||oconnor-damien
O'Connor, Greg||labour||Ōhāriu||oconnor-greg
Parmar, Parmjeet||act||list||parmar-parmjeet
Paul, Tamatha||green||Wellington Central||paul-tamatha
Pham, Lan||green||list||pham-lan
Prime, Willow-Jean||labour||list||prime-willow-jean
Pugh, Maureen||national||West Coast-Tasman||pugh-maureen
Radhakrishnan, Priyanca||labour||list||radhakrishnan-priyanca
Redmayne, Suze||national||Rangitīkei||redmayne-suze
Rosewarne, Dan||labour||list||rosewarne-dan
Russell, Deborah||labour||list||russell-deborah
Rutherford, Tom||national||Bay of Plenty||rutherford-tom
Salesa, Jenny||labour||Panmure-Ōtāhuhu||salesa-jenny
Smith, Stuart||national||Kaikōura||smith-stuart
Sosene, Lemauga Lydia||labour||Māngere||sosene-lemauga-lydia
Stephenson, Todd||act||list||stephenson-todd
Tangaere-Manuel, Cushla||labour||Ikaroa-Rāwhiti||tangaere-manuel-cushla
Tinetti, Jan||labour||list||tinetti-jan
Tuiono, Teanau||green||list||tuiono-teanau
Twyford, Phil||labour||Te Atatū||twyford-phil
Uffindell, Sam||national||Tauranga||uffindell-sam
Utikere, Tangi||labour||Palmerston North||utikere-tangi
van de Molen, Tim||national||Waikato||van-de-molen-tim
Verrall, Ayesha||labour||list||verrall-ayesha
Wade-Brown, Celia||green||list||wade-brown-celia
Walters, Vanushi||labour||list||walters-vanushi
Webb, Duncan||labour||Christchurch Central||webb-duncan
Wedd, Catherine||national||Tukituki||wedd-catherine
Weenink, Vanessa||national||Banks Peninsula||weenink-vanessa
White, Helen||labour||Mt Albert||white-helen
Williams, Arena||labour||Manurewa||williams-arena
Willis, Scott||green||list||willis-scott
Wilson, David||nzfirst||list||wilson-david
Woods, Megan||labour||Wigram||woods-megan
Xu-Nan, Lawrence||green||list||xu-nan-lawrence
`.trim()

// Scraped: "pslug|honorific|firstElected|committees|spokesperson|portfolios|parlRoles|partyRoles" (CSV fields)
const SCRAPED = `
abel-steve||2023|Māori Affairs,Primary Production|Agriculture,Animal Welfare,Food Safety,Just Transitions,Māori Crown Relations: Te Arawhiti,Racing,Resources,Treaty of Waitangi Negotiations|||
andersen-ginny|Hon|2017|Education and Workforce|Education,Jobs and Incomes,Police,Treaty of Waitangi Negotiations|||
anderson-miles||2023|Primary Production,Regulations Review||||
arbuckle-jamie||2023|Business,Justice,Officers of Parliament,Social Services and Community,Standing Orders||||NZ First Party
bates-carl||2023|Education and Workforce,Justice||||
bayly-andrew|Hon|2014|Justice||||
belich-camilla||2020|Justice|Justice,Public Services|||
bennett-glen||2020|Business,Privileges|Tourism and Hospitality|||Labour Party (Whip (Chief))
bidois-dan||2018|Finance and Expenditure,Transport and Infrastructure||||
boyack-rachel||2020|Primary Production|Animal Welfare,Arts Culture and Heritage,Oceans and Fisheries|||
brewer-cameron|Hon|2023|||Commerce and Consumer Affairs,Small Business and Manufacturing,Immigration||
brooking-rachel|Hon|2020|Environment|Environment,Food Safety,RMA Reform,Space|||
brownlee-gerry|Rt Hon|1996|Business,Officers of Parliament,Standing Orders|||Speaker|
butterick-mike|Hon|2023|||Agriculture,Land Information||
cameron-mark||2020|Primary Production|Agriculture,Defence,Fisheries,Forestry,Hunting and Fishing,Rural Communities,Veterans|||
campbell-hamish|Dr|2023|Economic Development Science and Innovation,Health||||
carter-kahurangi||2023|Social Services and Community|Arts Culture and Heritage,Children,Community and Voluntary Sector,Disability,Women,Zero Waste|||Green Party (Whip (Deputy Musterer))
cheung-carlos|Dr|2023|Health,Transport and Infrastructure||||
costley-tim||2023|Foreign Affairs Defence and Trade,Governance and Administration||||
court-simon||2020|Transport and Infrastructure|Climate Change,Energy and Resources||Parliamentary Under-Secretary|
dansey-georgie||2026|Māori Affairs|Rainbow Issues,Regulation|||
davidson-mike||2025|Governance and Administration||||
davidson-reuben||2023|Economic Development Science and Innovation|Broadcasting Media and Creative Economy,Economic Development,Science Technology and Innovation|||
edmonds-barbara|Hon|2020|Finance and Expenditure|Finance and Economy,Savings and Investment|||
ferris-tākuta||2023|Justice||||
fleming-greg||2023|Māori Affairs,Petitions||||
foster-andy||2023|Governance and Administration,Transport and Infrastructure||||
garcia-paulo||2019|Māori Affairs,Petitions||||
genter-julie-anne|Hon|2011|Environment|Building and Construction,Economic Development,Infrastructure,Transport,Urban Development|||
halbert-shanan||2020|Education and Workforce|Tertiary Education,Whānau Ora|||
hamilton-ryan||2023|Environment,Finance and Expenditure||||
hernandez-francisco||2024|Finance and Expenditure|Emergency Management and Recovery,Regulation,Science Innovation and Technology,Statistics|||
jackson-willie|Hon|1999|Māori Affairs|Health (Māori),Māori-Crown Relations,Māori Development|||
kaipara-oriini||2025|Māori Affairs||||
kapa-kingi-mariameno||2023|Business,Officers of Parliament,Privileges,Standing Orders,Transport and Infrastructure||||
kirkpatrick-dana||2023|Primary Production,Social Services and Community||||National Party (Whip (Third))
kuriger-barbara||2014|Officers of Parliament|||Deputy Speaker|
leary-ingrid||2020|Health|Mental Health,Seniors|||
lee-melissa|Hon|2008|Governance and Administration||||
lu-nancy||2023|Finance and Expenditure,Regulations Review||||
luxton-cameron||2023|Environment,Health|Conservation,Housing Building Construction,Infrastructure,Local Government,Transport|||
luxton-jo|Hon|2017|Primary Production|Agriculture,Biosecurity,Customs|||
lyndon-hūhana||2023|Health|Forestry,Health,Māori Development,Media and Communications,Whānau Ora|||
macleod-david||2023|Māori Affairs,Environment||||
maipi-clarke-hana-rawhiti||2023|||||
marcroft-jenny||2017|Health||Media and Communications,Oceans and Fisheries||
mcanulty-kieran|Hon|2017|Business|Housing,Infrastructure and Public Investment||Shadow Leader of the House|
mccallum-grant||2023|Education and Workforce,Environment||||
mclellan-tracey|Dr|2020|Standing Orders,Transport and Infrastructure|Christchurch Issues,Corrections|||Labour Party (Whip (Junior))
menéndez-march-ricardo||2020|Business,Officers of Parliament,Privileges,Standing Orders|Auckland Issues,Commerce and Consumer Affairs,Immigration,Social Development and Employment|||Green Party (Whip (Musterer))
mooney-joseph||2020|Regulations,Social Services and Community||||
nakhle-rima||2023|Māori Affairs,Justice||||
nimon-katie||2023|Education and Workforce||||
oconnor-damien|Hon|1993|Foreign Affairs Defence and Trade|Defence,Land Information,Regional Development,Trade|||
oconnor-greg||2017|Officers of Parliament,Petitions|Courts,Veterans||Assistant Speaker|
parmar-parmjeet|Dr|2014|Education and Workforce,Privileges|Commerce and Consumer Affairs,Ethnic Communities,Immigration,Research|||
paul-tamatha||2023||Corrections,Housing,Police,Youth|||
pham-lan||2023|Environment|Biosecurity and Customs,Environment,Land Information,Water Services|||
prime-willow-jean|Hon|2017|Social Services and Community|Children,Social Development and Employment|||
pugh-maureen|||Social Services and Community|||Assistant Speaker|
radhakrishnan-priyanca|Hon|2017|Environment,Intelligence and Security|ACC,Conservation,Disability Issues|||
redmayne-suze||2023|Officers of Parliament,Primary Production||||National Party (Whip (Junior))
rosewarne-dan||2022|Justice|Rural Communities,Small Business|||
russell-deborah|Hon Dr|2017|Finance and Expenditure|Climate Change,Finance,Revenue|||
rutherford-tom||2023|Finance and Expenditure,Justice||||
salesa-jenny|Hon|2014|Regulations Review|Ethnic Communities,Pacific Peoples|||
smith-stuart|||Business,Standing Orders||||National Party (Whip (Senior))
sosene-lemauga-lydia||2022|Governance and Administration|Internal Affairs,Statistics|||
stephenson-todd||2023|Business,Finance and Expenditure,Justice,Officers of Parliament,Standing Orders|Corrections,Finance,Health,Justice,Police,Tourism|||ACT Party
tangaere-manuel-cushla||2023|Economic Development Science and Innovation,Officers of Parliament|Emergency Management,Forestry,Māori Economy,Sport and Recreation|||Labour Party (Whip (Assistant))
tinetti-jan|Hon|2017|Governance and Administration|Early Childhood Education,Child Poverty Reduction,Social Investment|||
trask-laura||2023|Foreign Affairs Defence and Trade,Social Services and Community|Education,Mental Health,Small Business|||
tuiono-teanau||2020|Foreign Affairs Defence and Trade,Intelligence and Security|Defence and Disarmament,Pacific Peoples|||
twyford-phil|Hon|2008|Education and Workforce|Disarmament and Arms Control,Foreign Affairs,Immigration|||
uffindell-sam||2022|Health||||
utikere-tangi||2020|Standing Orders,Transport and Infrastructure|Local Government,Racing,Transport||Deputy Shadow Leader of the House|
van-de-molen-tim||2017|Foreign Affairs Defence and Trade||||
verrall-ayesha|Hon Dr|2020|Health|Health,Wellington Issues|||
wade-brown-celia||2024|Petitions,Transport and Infrastructure|Conservation,Democracy and Electoral Reform|||
walters-vanushi||2020|Foreign Affairs Defence and Trade|Foreign Affairs,GCSB,NZSIS||Shadow Attorney-General|
webb-duncan|Hon Dr|2017|Justice,Privileges||||
wedd-catherine||2023|Environment||||
weenink-vanessa|Dr|2023|Economic Development Science and Innovation,Education and Workforce||||
white-helen||2020|Social Services and Community|Community and Voluntary Sector|||
williams-arena||2020|Economic Development Science and Innovation,Regulations Review|Building and Construction,Commerce and Consumer Affairs,Youth|||
willis-scott||2023|Economic Development Science and Innovation|Energy,Hunting and Fishing|||
wilson-david|Dr|2025|Economic Development Science and Innovation,Finance and Expenditure||||
woods-megan|Hon Dr|2011|Finance and Expenditure|Energy and Resources,Finance,Manufacturing and Industry|||
xu-nan-lawrence|Dr|2024|Education and Workforce,Justice|Courts,Education,Ethnic Communities,Justice|||
`.trim()

function toSlug(str) {
  return str.toLowerCase()
    .replace(/[āàáâ]/g,'a').replace(/[ēèéê]/g,'e').replace(/[īìíî]/g,'i')
    .replace(/[ōòóô]/g,'o').replace(/[ūùúû]/g,'u')
    .replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').trim()
}
const PARTY = { national:'National', labour:'Labour', green:'Green', act:'ACT', nzfirst:'New Zealand First', tpm:'Te Pāti Māori', independent:'Independent' }

// Build roster map keyed by normalised parliament slug
const norm = s => s.toLowerCase()
  .replace(/[āàáâ]/g,'a').replace(/[ēèéê]/g,'e').replace(/[īìíî]/g,'i').replace(/[ōòóô]/g,'o').replace(/[ūùúû]/g,'u')
const roster = {}
for (const line of ROSTER.split('\n')) {
  const [nameRaw, party, seat, pslug] = line.split('||')
  const [surname, ...given] = nameRaw.split(', ')
  const name = `${given.join(', ')} ${surname}`.trim()
  roster[norm(pslug)] = { name, party, role: seat === 'list' ? 'list' : 'electorate', electorate: seat === 'list' ? null : seat, slug: toSlug(name) }
}

const splitList = (s) => (s || '').split(',').map(x => x.trim()).filter(Boolean)
const joinList = (a) => a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")

const entries = []
for (const line of SCRAPED.split('\n')) {
  const [pslug, ho, fe, comStr, spkStr, , parlStr, partyStr] = line.split('|')
  const r = roster[norm(pslug)]
  if (!r) { console.log('NO ROSTER for', pslug); continue }
  const committees = splitList(comStr)
  const spokes = splitList(spkStr).slice(0, 4)
  const parlRoles = splitList(parlStr)
  const isOpp = ['labour', 'green', 'tpm', 'independent'].includes(r.party)
  const pname = PARTY[r.party]

  // roles list
  const roles = []
  parlRoles.forEach(x => roles.push(x))
  spokes.forEach(x => roles.push(`Spokesperson — ${x}`))
  if (/whip/i.test(partyStr || '')) roles.push(`${pname} Whip`)

  // title from parliamentary role
  const title = parlRoles[0] || null

  // bio
  let bio = r.role === 'electorate'
    ? (r.party === 'independent'
        ? `${r.name} is the independent Member of Parliament for ${r.electorate}.`
        : `${r.name} is the Member of Parliament for ${r.electorate}, representing ${pname}.`)
    : `${r.name} is a ${pname} list MP.`
  if (fe) bio += ` First elected in ${fe},`
  const clauses = []
  if (title) clauses.push(`serves as ${title}`)
  if (committees.length) clauses.push(`sits on the ${joinList(committees)} select committee${committees.length > 1 ? 's' : ''}`)
  if (isOpp && spokes.length) clauses.push(`is ${pname}'s spokesperson for ${joinList(spokes)}`)
  if (clauses.length) {
    bio += (fe ? ' they ' : ' They ') + joinList(clauses) + '.'
  } else if (fe) {
    bio = bio.replace(/,$/, '.')
  }

  const parts = [`enteredParliament: ${fe || 'undefined'}`]
  const o = []
  if (title) o.push(`title: '${esc(title)}'`)
  if (fe) o.push(`enteredParliament: ${fe}`)
  o.push(`bio: '${esc(bio)}'`)
  if (roles.length) o.push(`portfolios: [${roles.map(x => `'${esc(x)}'`).join(', ')}]`)
  if (committees.length) o.push(`committees: [${committees.map(x => `'${esc(x)}'`).join(', ')}]`)
  entries.push(`  '${r.slug}': { ${o.join(', ')} },`)
}

const out = `/**
 * AUTO-GENERATED backbench/opposition MP detail (parliament.nz, ${'2026-06'}).
 * Factual bios composed from each MP's official role data. Regenerate: node gen-detail.cjs
 */
import type { MPProfile } from './mps-data'

export const GENERATED_DETAIL: Record<string, Partial<MPProfile>> = {
${entries.join('\n')}
}
`
fs.writeFileSync('src/constants/mps-detail-generated.ts', out)
console.log('Wrote', entries.length, 'generated detail entries.')
