import { synopsis } from './lib/youtube.mjs'

const CASES = [
  ['Friday Fry Up (all boilerplate)',
    'The Friday Fry Up is brought to you by Beard Brothers, crafted the old school way.\n\nWatch The Platform live on YouTube — only $34.99/month!\nJoin now → https://www.youtube.com/@theplatformnz/join\n\nMichael Laws: 10am - 1pm',
    ''],
  ['Herald policy clip (real synopsis)',
    'Associate Education Minister David Seymour and Green co-leader Marama Davidson on health guidelines for school children following a winter illness spike. \n\nVideo / Ryan Bridge TODAY\n\nSubscribe and be notified of breaking news: https://goo.gl/LP45jX',
    'Associate Education Minister David Seymour and Green co-leader Marama Davidson on health guidelines for school children following a winter illness spike. Video / Ryan Bridge TODAY'],
  ['MetService (title echo only)',
    'MetService morning weather update: August 19, 2026. Video / MetService\n\nSubscribe and be notified of breaking news: https://goo.gl/LP45jX',
    'MetService morning weather update: August 19, 2026. Video / MetService'],
  ['Platform roster line alone',
    'Sean Plunket: 7am - 10am\nMichael Laws: 10am - 1pm',
    ''],
  ['empty / missing', '', ''],
]

let pass = 0
for (const [name, input, expected] of CASES) {
  const got = synopsis(input)
  const ok = got === expected
  if (ok) pass++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
  if (!ok) {
    console.log(`        expected: ${JSON.stringify(expected)}`)
    console.log(`        got     : ${JSON.stringify(got)}`)
  }
}
console.log(`\n${pass}/${CASES.length} passed`)

// The point of all this: what the tagger now reads for the noise clips.
console.log('\nWhat the tagger sees for the Friday Fry Up:')
console.log('  before:', JSON.stringify(('Who Is The Banger Of The Week In The Friday Fry Up? ' + CASES[0][1]).replace(/\s+/g, ' ').slice(0, 150) + '…'))
console.log('  after :', JSON.stringify('Who Is The Banger Of The Week In The Friday Fry Up? ' + synopsis(CASES[0][1])))
process.exit(pass === CASES.length ? 0 : 1)
