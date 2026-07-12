/**
 * fetch-mp-photos.mjs — fill gaps in MP portraits from Wikimedia (Commons via the
 * Wikipedia API). For every current MP without a photo we:
 *   1. find their Wikipedia page,
 *   2. verify it's the right person (NZ + politician/MP/their party in the intro),
 *   3. read the lead image's licence, and only accept a genuinely FREE one
 *      (CC BY / CC BY-SA / CC0 / public domain) — never fair-use/all-rights-reserved,
 *   4. download it to public/mps/<slug>.<ext> and record attribution.
 * Everything unverified is skipped and reported, never guessed.
 *
 * Run: node scripts/fetch-mp-photos.mjs
 * Output: downloads + scripts/mp-photos-found.json + a ready-to-paste snippet.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const UA = 'AratikaCivicSite/1.0 (https://aratika.vercel.app; contact@aratika.nz) MP-portrait-gap-fill'
const API = 'https://en.wikipedia.org/w/api.php'
const FREE = /(cc[ -]?by|cc0|public domain|no restrictions|attribution)/i
const NONFREE = /(fair use|non-free|all rights reserved|copyright)/i

// ── Who's missing a photo ─────────────────────────────────────────────────────
const photoSlugs = new Set([...readFileSync(join(root, 'src/constants/mp-photos.ts'), 'utf8').matchAll(/^\s*'([a-z0-9-]+)':\s*\{/gm)].map((m) => m[1]))
const gen = readFileSync(join(root, 'src/constants/mps-generated.ts'), 'utf8')
const mps = [...gen.matchAll(/slug:\s*'([a-z0-9-]+)'[^\n]*?name:\s*'((?:[^'\\]|\\.)*)'[^\n]*?party:\s*'([a-z]+)'/g)]
  .map((m) => ({ slug: m[1], name: m[2].replace(/\\'/g, "'"), party: m[3] }))
const byMp = new Map(); for (const m of mps) if (!byMp.has(m.slug)) byMp.set(m.slug, m) // dedupe by slug
const PARTY_HINT = { national: 'national', labour: 'labour', green: 'green', act: 'act', nzfirst: 'first', tpm: 'māori|maori|te pāti', independent: 'independent' }
const missing = [...byMp.values()].filter((m) => !photoSlugs.has(m.slug))
  .filter((m) => !['jpg', 'jpeg', 'png'].some((e) => existsSync(join(root, 'public/mps', `${m.slug}.${e}`)))) // skip ones already downloaded this session

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const j = async (params) => {
  const url = `${API}?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
const stripHtml = (s) => (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

const outDir = join(root, 'public/mps')
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

const found = [], skipped = []

for (const mp of missing) {
  try {
    // 1) best Wikipedia page for this MP
    const search = await j({ action: 'query', list: 'search', srsearch: `${mp.name} New Zealand politician`, srlimit: '1' })
    const hit = search?.query?.search?.[0]
    if (!hit) { skipped.push({ ...mp, reason: 'no wikipedia page' }); await sleep(300); continue }
    const title = hit.title

    // 2) page intro + lead image
    const page = await j({ action: 'query', titles: title, prop: 'extracts|pageimages', exintro: '1', explaintext: '1', piprop: 'original|name', redirects: '1' })
    const pobj = Object.values(page?.query?.pages || {})[0] || {}
    const intro = (pobj.extract || '').toLowerCase()
    const okPerson = intro.includes('new zealand') && /(politician|member of parliament|\bmp\b|minister)/.test(intro) && new RegExp(PARTY_HINT[mp.party] || mp.party).test(intro)
    if (!okPerson) { skipped.push({ ...mp, reason: `page "${title}" not confidently this MP` }); await sleep(300); continue }
    const fileName = pobj.pageimage
    const original = pobj.original?.source
    if (!fileName || !original) { skipped.push({ ...mp, reason: 'no lead image' }); await sleep(300); continue }

    // 3) licence + author from Commons
    const info = await j({ action: 'query', titles: `File:${fileName}`, prop: 'imageinfo', iiprop: 'extmetadata|url', iiextmetadatafilter: 'LicenseShortName|Artist|LicenseUrl|DescriptionUrl' })
    const iobj = Object.values(info?.query?.pages || {})[0]?.imageinfo?.[0]?.extmetadata || {}
    const licence = stripHtml(iobj.LicenseShortName?.value) || '(unknown)'
    const author = stripHtml(iobj.Artist?.value) || 'Unknown'
    const licenceUrl = iobj.LicenseUrl?.value || iobj.DescriptionUrl?.value || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName)}`
    if (!FREE.test(licence) || NONFREE.test(licence)) { skipped.push({ ...mp, reason: `licence not free: "${licence}"` }); await sleep(300); continue }

    // 4) download
    const ext = (original.match(/\.(jpg|jpeg|png)(\?|$)/i)?.[1] || 'jpg').toLowerCase()
    const img = await fetch(original, { headers: { 'User-Agent': UA } })
    const buf = Buffer.from(await img.arrayBuffer())
    if (buf.length < 3000) { skipped.push({ ...mp, reason: 'image too small / failed' }); await sleep(300); continue }
    writeFileSync(join(outDir, `${mp.slug}.${ext}`), buf)
    found.push({ ...mp, photo: `/mps/${mp.slug}.${ext}`, credit: author, license: licence, sourceUrl: licenceUrl, sizeKB: Math.round(buf.length / 1024) })
    console.log(`✓ ${mp.name} — ${licence} — ${author} (${Math.round(buf.length / 1024)}KB)`)
  } catch (e) {
    skipped.push({ ...mp, reason: 'error: ' + e.message })
  }
  await sleep(350)
}

writeFileSync(join(here, 'mp-photos-found.json'), JSON.stringify({ found, skipped }, null, 2))
console.log(`\n── Done: ${found.length} portraits downloaded, ${skipped.length} skipped ──`)
console.log('\nReady-to-paste mp-photos.ts entries:')
for (const f of found) {
  console.log(`  '${f.slug}': { photo: '${f.photo}', credit: ${JSON.stringify(f.credit)}, license: ${JSON.stringify(f.license)}, sourceUrl: '${f.sourceUrl}' },`)
}
console.log('\nSkipped (need a manual/free source or stay as initials):')
for (const s of skipped) console.log(`  ✗ ${s.name} (${s.party}) — ${s.reason}`)
