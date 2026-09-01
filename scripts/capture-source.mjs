/**
 * capture-source.mjs — read a party's policy page through a real browser and
 * save the text where draft-positions.mjs will find it.
 *
 * draft-positions fetches with curl, which is right for almost every party
 * site. It is not enough for the ones behind a Cloudflare bot challenge: curl
 * gets back "Just a moment..." — 31 characters of interstitial — and the
 * drafter correctly rejects it as "source text too thin". NZ Loyal publishes
 * fifteen policy pages and had exactly one position on the site for that
 * reason, and the failure read as a bad URL rather than a blocked fetch.
 *
 * The drafter already prefers scripts/.cache/<party>-<topic>.txt over fetching.
 * This fills that cache. Chrome clears the challenge the way a reader's browser
 * does, so what lands in the cache is the page a person actually sees.
 *
 * The cache is a capture, not a source of truth: draft-positions still records
 * the real URL as the citation, and fingerprints this text, so --if-changed
 * keeps working. Re-run this before re-drafting a cached party, or the drafter
 * summarises a stale copy.
 *
 * Run:
 *   node scripts/capture-source.mjs --party=nz-loyal --topic=health --url=https://nzloyal.com/health
 *   node scripts/capture-source.mjs --party=nz-loyal --all      (every mapped topic)
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const CACHE = join(here, '.cache')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'

const arg = (f) => (process.argv.find((a) => a.startsWith(`--${f}=`)) || '').split('=')[1]
const party = arg('party')
const all = process.argv.includes('--all')

/** Pages that sit behind a challenge, per party. Extend as more are found. */
const MAPS = {
  'nz-loyal': {
    economy: 'https://nzloyal.com/economics',
    housing: 'https://nzloyal.com/housing',
    health: 'https://nzloyal.com/health',
    education: 'https://nzloyal.com/education',
    environment: 'https://nzloyal.com/environment',
    'crime-justice': 'https://nzloyal.com/justice',
    'treaty-maori-affairs': 'https://nzloyal.com/treaty-of-waitangi',
    immigration: 'https://nzloyal.com/immigration',
    'foreign-policy': 'https://nzloyal.com/foreign-affairs',
  },
}

const jobs = all
  ? Object.entries(MAPS[party] || {}).map(([topic, url]) => ({ topic, url }))
  : [{ topic: arg('topic'), url: arg('url') }]

if (!party || jobs.length === 0 || jobs.some((j) => !j.topic || !j.url)) {
  console.error('usage: --party=<slug> (--all | --topic=<t> --url=<u>)')
  process.exit(1)
}

// Cloudflare rate-limits a burst. Nine pages back to back returned one 200 and
// eight 403 "Performing security verification" pages, which look exactly like a
// thin page unless you read the status. Pace the requests and retry once — a
// browser that behaves like a reader gets served like one.
const PAUSE_MS = 7000
const pause = (ms) => new Promise((r) => setTimeout(r, ms))
const BLOCKED = /Just a moment|security verification|Performing security/i

mkdirSync(CACHE, { recursive: true })
const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')

async function grab(url) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 })
    // The challenge clears a beat after load; without this wait the capture is
    // the interstitial, which is the thing this script exists to avoid.
    await pause(3500)
    const text = await page.evaluate(() => document.body.innerText.trim())
    const blocked = res.status() === 403 || BLOCKED.test(text)
    if (!blocked) return { status: res.status(), text }
    if (attempt === 1) {
      console.log(`  … challenged, backing off`)
      await pause(PAUSE_MS * 2)
    }
  }
  return { status: 403, text: '' }
}

let written = 0
for (const [i, { topic, url }] of jobs.entries()) {
  if (i > 0) await pause(PAUSE_MS)
  try {
    const { status, text } = await grab(url)
    if (text.length < 400) {
      console.error(`✗ ${party}/${topic}: blocked or too thin (${text.length} chars, HTTP ${status}) — not caching`)
      continue
    }
    writeFileSync(join(CACHE, `${party}-${topic}.txt`), text, 'utf8')
    written++
    console.log(`✓ ${party}/${topic}: ${text.length} chars [${status}]  ${url}`)
  } catch (e) {
    console.error(`✗ ${party}/${topic}: ${String(e.message).slice(0, 70)}`)
  }
}
await browser.close()
console.log(`\nCached ${written}/${jobs.length}. Now run draft-positions for this party.`)
