/**
 * fetch-economic-data.mjs
 *
 * Pulls real New Zealand macro series from World Bank Open Data (which compiles
 * official IMF/ILO/national figures), and writes a typed data module the private
 * accountability page renders as charts.
 *
 * Why World Bank: free, no API key, stable JSON, and it cites its primary
 * sources. We attribute it AND link the NZ primary source (Stats NZ / Treasury)
 * on the page. Re-run this any time to refresh:  node scripts/fetch-economic-data.mjs
 *
 * Credibility: nothing here is hand-typed — every value comes from the API, with
 * the retrieval date recorded. We never invent figures.
 */

import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'src', 'constants', 'economic-data.ts')

const FROM_YEAR = 2019
const EXPECTED = ['cpi', 'gdp', 'unemployment', 'debt']

// Some hosts (OECD) reject Node's fetch (undici) headers with a 500 but serve
// curl fine — so fetch JSON via curl, which is available in this environment.
function curlJson(url) {
  const out = execFileSync('curl', ['-s', '--max-time', '30', '-A', 'Mozilla/5.0', url], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return JSON.parse(out)
}

// Read the previously-generated file so a transient failure never drops data.
function readExisting() {
  try {
    if (!existsSync(OUT)) return {}
    const txt = readFileSync(OUT, 'utf8')
    const m = txt.match(/ECONOMIC_DATA: EconomicData = (\{[\s\S]*\})\s*$/)
    if (!m) return {}
    const obj = JSON.parse(m[1])
    return Object.fromEntries((obj.series ?? []).map((s) => [s.id, s]))
  } catch { return {} }
}

// id, World Bank indicator code, and dual attribution (feed + NZ primary source).
const INDICATORS = [
  {
    id: 'gdp', wbCode: 'NY.GDP.MKTP.KD.ZG', name: 'GDP growth', unit: '%',
    measures: 'Annual change in real GDP.',
    feedLabel: 'World Bank Open Data', feedUrl: 'https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG?locations=NZ',
    primaryLabel: 'Stats NZ — GDP', primaryUrl: 'https://www.stats.govt.nz/indicators/gross-domestic-product-gdp/',
  },
  {
    id: 'unemployment', wbCode: 'SL.UEM.TOTL.ZS', name: 'Unemployment', unit: '%',
    measures: 'Share of the labour force unemployed (ILO-modelled estimate).',
    feedLabel: 'World Bank Open Data', feedUrl: 'https://data.worldbank.org/indicator/SL.UEM.TOTL.ZS?locations=NZ',
    primaryLabel: 'Stats NZ — Labour market', primaryUrl: 'https://www.stats.govt.nz/topics/unemployment/',
  },
  {
    id: 'debt', wbCode: 'GC.DOD.TOTL.GD.ZS', name: 'Government debt', unit: '% of GDP',
    measures: 'Central government debt as a share of GDP.',
    feedLabel: 'World Bank Open Data', feedUrl: 'https://data.worldbank.org/indicator/GC.DOD.TOTL.GD.ZS?locations=NZ',
    primaryLabel: 'Treasury — Financial statements', primaryUrl: 'https://www.treasury.govt.nz/',
  },
]

async function fetchSeries(code) {
  const url = `https://api.worldbank.org/v2/country/NZL/indicator/${code}?format=json&date=${FROM_YEAR}:2026&per_page=80`
  let json = null
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url)
    if (res.ok) { json = await res.json(); break }
    if (attempt === 2) throw new Error(`HTTP ${res.status} for ${code}`)
    await new Promise((r) => setTimeout(r, 1500))
  }
  if (!Array.isArray(json) || json.length < 2 || !json[1]) throw new Error(`No data for ${code}`)
  const meta = json[0]
  const points = json[1]
    .filter((o) => o.value !== null && o.value !== undefined)
    .map((o) => ({ year: Number(o.date), value: Number(o.value) }))
    .sort((a, b) => a.year - b.year)
  return { points, wbLastUpdated: meta.lastupdated ?? null }
}

// OECD all-items CPI INDEX → year-on-year %. The OECD's pre-computed annual %
// series lags, but the index is current; deriving YoY from it matches World Bank
// on the overlap and extends to the latest year. OECD sources NZ CPI from Stats NZ.
async function fetchOecdCpiYoY() {
  const url = 'https://sdmx.oecd.org/public/rest/data/OECD.SDD.TPS,DSD_PRICES@DF_PRICES_ALL,1.0/NZL.A.N.CPI.IX._T.N._Z?startPeriod=2018&format=jsondata'
  const j = curlJson(url)
  const d = j.data
  const periods = d.structures[0].dimensions.observation[0].values.map((v) => v.id)
  const series = d.dataSets[0].series
  const key = Object.keys(series)[0]
  if (!key) throw new Error('no series')
  const idx = Object.entries(series[key].observations)
    .map(([t, arr]) => ({ year: Number(periods[Number(t)]), idx: arr[0] }))
    .sort((a, b) => a.year - b.year)
  const points = []
  for (let i = 1; i < idx.length; i++) {
    if (idx[i].year < 2019) continue
    points.push({ year: idx[i].year, value: Math.round((idx[i].idx / idx[i - 1].idx - 1) * 1000) / 10 })
  }
  return points
}

async function main() {
  const series = []

  // CPI first, from OECD (current to the latest year).
  try {
    const points = await fetchOecdCpiYoY()
    series.push({
      id: 'cpi', name: 'Inflation (CPI)', unit: '%',
      measures: 'Annual change in consumer prices (year-on-year, from the all-items index).',
      feedLabel: 'OECD Data Explorer', feedUrl: 'https://data-explorer.oecd.org/',
      primaryLabel: 'Stats NZ — CPI', primaryUrl: 'https://www.stats.govt.nz/indicators/consumers-price-index-cpi/',
      wbLastUpdated: null, points,
    })
    const last = points[points.length - 1]
    console.log(`✓ ${'cpi'.padEnd(13)} ${points.length} pts (OECD), latest ${last.year}: ${last.value.toFixed(2)}%`)
  } catch (err) {
    console.warn(`✗ cpi (OECD): ${err.message}`)
  }
  for (const ind of INDICATORS) {
    try {
      const { points, wbLastUpdated } = await fetchSeries(ind.wbCode)
      series.push({
        id: ind.id, name: ind.name, unit: ind.unit, measures: ind.measures,
        feedLabel: ind.feedLabel, feedUrl: ind.feedUrl,
        primaryLabel: ind.primaryLabel, primaryUrl: ind.primaryUrl,
        wbLastUpdated, points,
      })
      const last = points[points.length - 1]
      console.log(`✓ ${ind.id.padEnd(13)} ${points.length} pts, latest ${last.year}: ${last.value.toFixed(2)}${ind.unit === '%' ? '%' : ''}`)
    } catch (err) {
      console.warn(`✗ ${ind.id}: ${err.message}`)
    }
  }

  // Never lose data on a transient failure: fill any missing series from the
  // previously-generated file, and emit in a stable order.
  const existing = readExisting()
  const byId = Object.fromEntries(series.map((s) => [s.id, s]))
  for (const id of EXPECTED) {
    if (!byId[id] && existing[id]) {
      byId[id] = existing[id]
      console.log(`↺ ${id.padEnd(13)} kept previous (fetch failed this run)`)
    }
  }
  const finalSeries = EXPECTED.map((id) => byId[id]).filter(Boolean)
  if (finalSeries.length === 0) { console.error('No series available — aborting (leaving existing file).'); process.exit(1) }
  const series2 = finalSeries

  const generatedAt = new Date().toISOString().slice(0, 10)
  const banner = `// AUTO-GENERATED by scripts/fetch-economic-data.mjs on ${generatedAt}. Do not edit by hand.
// Sources: CPI from OECD (NZ data sourced from Stats NZ); GDP/unemployment/debt
// from World Bank Open Data (compiling official IMF/ILO/national figures).
// Re-run:  node scripts/fetch-economic-data.mjs\n`
  const types = `export interface EconPoint { year: number; value: number }
export interface EconSeries {
  id: string; name: string; unit: string; measures: string
  feedLabel: string; feedUrl: string
  primaryLabel: string; primaryUrl: string
  wbLastUpdated: string | null
  points: EconPoint[]
}
export interface EconomicData { generatedAt: string; series: EconSeries[] }\n`
  const body = `export const ECONOMIC_DATA: EconomicData = ${JSON.stringify({ generatedAt, series: series2 }, null, 2)}\n`

  writeFileSync(OUT, `${banner}\n${types}\n${body}`, 'utf8')
  console.log(`\nWrote ${series2.length} series → ${OUT} (generatedAt ${generatedAt})`)
}

main().catch((e) => { console.error(e); process.exit(1) })
