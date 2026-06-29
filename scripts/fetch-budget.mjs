// Fetch Treasury "Budget at a Glance" 2026 section pages (static govt.nz HTML),
// extract clean text so we can curate verified figures into budget-2026.ts.
import { execFileSync } from 'node:child_process'
import { parse } from 'node-html-parser'

const BASE = 'https://www.budget.govt.nz/budget/2026/at-a-glance/'
const PAGES = [
  'index', 'health', 'education', 'law-order', 'infrastructure',
  'social-housing-welfare', 'fuel-response', 'energy-security',
  'defence-foreign-affairs', 'revenue', 'public-service', 'other-initiatives',
  'economic-outlook', 'fiscal-outlook',
]

function fetchText(url) {
  const html = execFileSync('curl', ['-s', '-L', '--max-time', '30', '-A',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36', url],
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 })
  const root = parse(html)
  root.querySelectorAll('script,style,nav,header,footer').forEach((n) => n.remove())
  const main = root.querySelector('main') || root.querySelector('#main') || root.querySelector('#content') || root
  return main.text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim()
}

for (const p of PAGES) {
  try {
    const txt = fetchText(BASE + p + '.htm')
    console.log('\n\n========== ' + p.toUpperCase() + ' ==========')
    console.log(txt.slice(0, 2600))
  } catch (e) { console.log('\n========== ' + p + ' FAILED: ' + e.message) }
}
