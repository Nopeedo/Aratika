import puppeteer from 'puppeteer'
import fs from 'fs'

const url = process.argv[2]
const label = process.argv[3] || ''
if (!url) { console.error('usage: node screenshot.mjs <url> [label]'); process.exit(1) }

const dir = './temporary screenshots'
fs.mkdirSync(dir, { recursive: true })
let n = 1
const name = () => `${dir}/screenshot-${n}${label ? '-' + label : ''}.png`
while (fs.existsSync(name())) n++

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 1600, deviceScaleFactor: 1 })
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 1800))
await page.screenshot({ path: name(), fullPage: true })
await browser.close()
console.log('saved', name())
