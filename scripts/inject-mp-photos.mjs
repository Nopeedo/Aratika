/**
 * inject-mp-photos.mjs — for every MP that now has a downloaded portrait in
 * public/mps but isn't yet in mp-photos.ts, re-read its Wikimedia attribution
 * (licence + author + source), clean up the credit text, and insert a properly
 * attributed entry into src/constants/mp-photos.ts.
 *
 * Run after fetch-mp-photos.mjs: node scripts/inject-mp-photos.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const UA = 'AratikaCivicSite/1.0 (https://aratika.vercel.app; contact@aratika.nz)'
const API = 'https://en.wikipedia.org/w/api.php'

const photosFile = join(root, 'src/constants/mp-photos.ts')
const photosSrc = readFileSync(photosFile, 'utf8')
const have = new Set([...photosSrc.matchAll(/^\s*'([a-z0-9-]+)':\s*\{/gm)].map((m) => m[1]))
const gen = readFileSync(join(root, 'src/constants/mps-generated.ts'), 'utf8')
const mps = [...gen.matchAll(/slug:\s*'([a-z0-9-]+)'[^\n]*?name:\s*'((?:[^'\\]|\\.)*)'/g)].map((m) => ({ slug: m[1], name: m[2].replace(/\\'/g, "'") }))
const bySlug = new Map(); for (const m of mps) if (!bySlug.has(m.slug)) bySlug.set(m.slug, m)

const extOf = (slug) => ['png', 'jpg', 'jpeg'].find((e) => existsSync(join(root, 'public/mps', `${slug}.${e}`)))
const targets = [...bySlug.values()].filter((m) => !have.has(m.slug) && extOf(m.slug))

const j = async (params) => {
  const res = await fetch(`${API}?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`, { headers: { 'User-Agent': UA } })
  return res.json()
}
const stripHtml = (s) => (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
function cleanCredit(c) {
  c = stripHtml(c)
  const half = c.slice(0, Math.floor(c.length / 2))       // collapse "XXXX" duplication
  if (c.length && c === half + half) c = half.trim()
  if (/unknown author/i.test(c) || !c) return 'Unknown (Wikimedia Commons)'
  if (/green party/i.test(c)) return 'Green Party'
  if (/office of the clerk/i.test(c)) return 'Office of the Clerk, NZ House of Representatives'
  return c
}

const entries = []
for (const mp of targets) {
  try {
    const search = await j({ action: 'query', list: 'search', srsearch: `${mp.name} New Zealand politician`, srlimit: '1' })
    const title = search?.query?.search?.[0]?.title
    if (!title) { console.log(`? ${mp.name}: no page (kept file, add credit manually)`); continue }
    const page = await j({ action: 'query', titles: title, prop: 'pageimages', piprop: 'name', redirects: '1' })
    const fileName = Object.values(page?.query?.pages || {})[0]?.pageimage
    const info = await j({ action: 'query', titles: `File:${fileName}`, prop: 'imageinfo', iiprop: 'extmetadata', iiextmetadatafilter: 'LicenseShortName|Artist|LicenseUrl|DescriptionUrl' })
    const em = Object.values(info?.query?.pages || {})[0]?.imageinfo?.[0]?.extmetadata || {}
    const licence = stripHtml(em.LicenseShortName?.value) || 'CC (see source)'
    const credit = cleanCredit(em.Artist?.value)
    const src = em.LicenseUrl?.value || em.DescriptionUrl?.value || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName || '')}`
    entries.push(`  '${mp.slug}': { photo: '/mps/${mp.slug}.${extOf(mp.slug)}', credit: ${JSON.stringify(credit)}, license: ${JSON.stringify(licence)}, sourceUrl: ${JSON.stringify(src)} },`)
    console.log(`✓ ${mp.name} — ${licence} — ${credit}`)
  } catch (e) { console.log(`✗ ${mp.name}: ${e.message}`) }
  await sleep(300)
}

if (entries.length) {
  const marker = '\nexport const MP_PHOTOS'
  const idx = photosSrc.lastIndexOf('}')                  // last line of the object literal
  const injected = photosSrc.slice(0, idx) + entries.join('\n') + '\n' + photosSrc.slice(idx)
  writeFileSync(photosFile, injected)
  console.log(`\nInjected ${entries.length} entries into mp-photos.ts`)
} else console.log('nothing to inject')
