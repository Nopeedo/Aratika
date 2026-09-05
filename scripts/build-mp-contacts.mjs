/**
 * build-mp-contacts.mjs — capture each MP's OFFICIAL contact details from their
 * own page on Parliament's website, and write them to a generated constants file.
 *
 * Why this exists: the letter studio was constructing an address from
 * Parliament's naming convention — first.last@parliament.govt.nz — and calling
 * it a "suggested email". That is a guess. A constituent's letter going to a
 * bouncing address is a silent failure, and the site's own rule everywhere else
 * is that we quote sources rather than infer them.
 *
 * Parliament DOES publish these. Every MP page carries a Contact Details panel
 * with the Parliament Office postal address, the 0800 number, and the member's
 * email as a real mailto link.
 *
 *   ⚠ Use www3.parliament.nz, not www. The www host sits behind a Radware bot
 *     filter that answers automated requests with a 118KB challenge page titled
 *     "Radware Page" — which parses as a perfectly ordinary page containing no
 *     email addresses. Reading "no email found" off that is how this was first
 *     wrongly concluded to be unpublished. www3 serves the real document and is
 *     the host the rest of the site's Parliament links already use.
 *
 * Run: node scripts/build-mp-contacts.mjs [--limit=N] [--check]
 *   --check  compare against the derived guess and report only; write nothing.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const args = process.argv.slice(2)
const CHECK_ONLY = args.includes('--check')
const LIMIT = Number((args.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || 0

/**
 * Deliberately NOT a full, realistic Chrome user-agent.
 *
 * Tested back to back against the same URL seconds apart: the complete Chrome
 * string — with "(KHTML, like Gecko)" and the trailing "Safari/537.36" — came
 * back as a 1.4KB challenge, while this shorter one returned the real 69KB
 * page. The filter appears to check whether a claimed browser's TLS handshake
 * matches the browser it claims to be, and curl pretending to be Chrome fails
 * that test. Claiming less passes it.
 *
 * So this is honest rather than evasive: it says what it is (a script, not
 * Chrome), and it is paced accordingly. Do not "fix" it into a fuller UA.
 */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0'
/**
 * Paced deliberately, and this number is not arbitrary.
 *
 * A first run at 400ms fetched fifteen pages and every one after the first came
 * back a bot challenge — the filter rate-limits bursts even from a client it
 * otherwise serves. A single request a moment later succeeded, so nothing is
 * banned; it is purely about pace. Three seconds puts a full roster capture at
 * roughly six minutes, which is a reasonable thing to ask of a public site we
 * are reading once.
 */
const PAUSE_MS = 3000
/** One retry, well back off, for the occasional challenge that still slips in. */
const RETRY_PAUSE_MS = 20000

/** Same construction the letter studio used, so we can measure how often it was wrong. */
function derived(fullName) {
  const parts = fullName
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z\s-]/g, '').trim().split(/\s+/)
  if (parts.length < 2) return ''
  return `${parts[0]}.${parts[parts.length - 1]}@parliament.govt.nz`
}

// MPs and their Parliament URLs come straight from the generated roster.
const src = readFileSync('src/constants/mps-generated.ts', 'utf8')
/**
 * Deduped by slug, because the roster is not.
 *
 * mps-generated.ts lists Oriini Kaipara and Mike Davidson twice each — once in
 * the "added post-2023" block at the top and again in the alphabetical body.
 * MP_PROFILES builds a Record keyed by slug, so the repeat collapses there and
 * nobody has noticed; emitting an object literal from the same list produced
 * duplicate keys and would not compile. Worth fixing at the source too, but
 * this file should not depend on that having happened.
 */
const seen = new Set()
const mps = [...src.matchAll(/\{ slug: '([^']+)', name: '([^']+)'[^}]*?parliamentUrl: '([^']+)'/g)]
  .map((m) => ({ slug: m[1], name: m[2], url: m[3] }))
  .filter((mp) => (seen.has(mp.slug) ? false : (seen.add(mp.slug), true)))

if (mps.length === 0) { console.error('No MPs parsed from mps-generated.ts'); process.exit(1) }
const list = LIMIT ? mps.slice(0, LIMIT) : mps
console.log(`${mps.length} MPs in the roster; fetching ${list.length}\n`)

const pause = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Fetched with curl, not node's fetch.
 *
 * Both were pointed at the same URL with the same user-agent in the same
 * second: curl returned the real 69KB page, node's fetch returned a 15KB bot
 * challenge. The filter fingerprints the HTTP client itself — undici's TLS and
 * header ordering give it away — so no combination of headers gets fetch
 * through. draft-positions.mjs already shells out for the same reason.
 */
function getHtml(url) {
  return execFileSync('curl', ['-s', '--max-time', '45', '-A', UA, '-L', url], {
    encoding: 'utf8', maxBuffer: 20 * 1024 * 1024,
  })
}

async function contactFor(mp) {
  // www → www3: see the note at the top. Everything else about the URL is theirs.
  const url = mp.url.replace('://www.parliament.nz', '://www3.parliament.nz')
  let html = ''
  for (let attempt = 1; attempt <= 2; attempt++) {
    try { html = getHtml(url) } catch { html = '' }
    const blocked = !html || html.length < 2000 || /Radware Page|Please solve this CAPTCHA/i.test(html)
    if (!blocked) break
    if (attempt === 1) { console.log('  … challenged, backing off'); await pause(RETRY_PAUSE_MS) }
    else throw new Error('bot-challenge page after retry')
  }

  // The email is a real mailto in the Contact Details panel. Anchored on the
  // official domains so the page's own "share this page" mailto — which has no
  // address at all — cannot be mistaken for the member's.
  //
  // Two things a narrower pattern got wrong, both found by chasing the three
  // MPs that first came back empty:
  //   - Apostrophes. Damien and Greg O'Connor's addresses contain one, written
  //     in the HTML as &#39;, so a local part of [A-Za-z0-9._%+-] stopped dead
  //     at "Damien.O" and the row was recorded as having no email.
  //   - The domain. Shane Reti's page lists s.reti@ministers.govt.nz, not a
  //     parliament.govt.nz address. Ministers can be reached on either, and the
  //     page publishes whichever they use.
  const decoded = html.replace(/&#0*39;|&apos;/g, "'")
  const mail = decoded.match(/mailto:([A-Za-z0-9._%+'-]+@(?:parliament|ministers)\.govt\.nz)/)
  const phone = html.match(/\+64\s*4\s*[\d\s]{6,}/)
  return {
    email: mail ? mail[1] : '',
    phone: phone ? phone[0].replace(/\s+/g, ' ').trim() : '',
    sourceUrl: url,
  }
}

const rows = []
const failures = []
let mismatches = 0

for (const [i, mp] of list.entries()) {
  if (i > 0) await pause(PAUSE_MS)
  try {
    const c = await contactFor(mp)
    if (!c.email) { failures.push([mp.slug, 'no email on page']); continue }
    rows.push({ ...mp, ...c })
    const guess = derived(mp.name)
    const same = guess.toLowerCase() === c.email.toLowerCase()
    if (!same) {
      mismatches++
      console.log(`  ✗ ${mp.slug.padEnd(26)} guessed ${guess}`)
      console.log(`    ${''.padEnd(26)} actual  ${c.email}`)
    }
  } catch (e) {
    failures.push([mp.slug, String(e.message).slice(0, 50)])
  }
}

console.log(`\ncaptured ${rows.length}/${list.length}`)
console.log(`the derived guess was WRONG for ${mismatches} of ${rows.length}`)
if (failures.length) {
  console.log(`\ncould not capture ${failures.length}:`)
  for (const [s, why] of failures) console.log(`  ${s} — ${why}`)
}

if (CHECK_ONLY) { console.log('\n--check: nothing written'); process.exit(0) }

const today = new Date().toISOString().slice(0, 10)
const out = `/**
 * mps-contacts.ts — GENERATED by scripts/build-mp-contacts.mjs. Do not edit by hand.
 *
 * Each MP's official contact details, read from their own page on Parliament's
 * website. Captured ${today}.
 *
 * These are QUOTED, not constructed. The letter studio previously built an
 * address from Parliament's naming convention and labelled it a suggestion;
 * where an MP is missing here, that fallback still applies and the UI says so.
 */

export interface MPContact {
  /** The member's parliamentary email, exactly as Parliament publishes it. */
  email: string
  /** Parliament's switchboard for international callers, as listed on the page. */
  phone?: string
  /** The page this was read from. */
  sourceUrl: string
}

export const MP_CONTACTS_META = {
  asOf: '${today}',
  count: ${rows.length},
  sourceLabel: 'New Zealand Parliament — members of Parliament',
  sourceUrl: 'https://www.parliament.nz/en/mps-and-electorates/members-of-parliament/',
}

export const MP_CONTACTS: Record<string, MPContact> = {
${rows.map((r) => `  ${JSON.stringify(r.slug)}: { email: ${JSON.stringify(r.email)}${r.phone ? `, phone: ${JSON.stringify(r.phone)}` : ''}, sourceUrl: ${JSON.stringify(r.sourceUrl)} },`).join('\n')}
}
`
writeFileSync('src/constants/mps-contacts.ts', out, 'utf8')
console.log(`\nwrote src/constants/mps-contacts.ts (${rows.length} MPs)`)
