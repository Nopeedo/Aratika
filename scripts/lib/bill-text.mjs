/**
 * Fetch a bill's text from legislation.govt.nz and clean it.
 * Uses a real HTML parser: takes only <main id="main-content">, removes the
 * navigation/TOC/sidebar/scripts, then extracts text. This avoids the junk
 * (mobile-nav anchors, the duplicated clause table-of-contents) that a naive
 * tag-strip let through.
 *
 *   preserveBreaks=true  → structured text with paragraph breaks (embedded reader)
 *   preserveBreaks=false → one collapsed stream (AI grounding)
 */

import { parse } from 'node-html-parser'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

// nav / chrome we never want in the bill text
const DROP = 'script, style, nav, aside, header, footer, button, form, noscript, .legislation-nav, .legislation-mobile-navigation, .list-group, .skip-link, .breadcrumb, .skip-to, [role="navigation"], [aria-hidden="true"]'

/** Stored links often pin a version ("…/0138/28.0/contents.html"). Once a bill
 *  moves on, that exact version 404s while /latest/ still resolves — so a link
 *  that worked when it was saved silently rots. Returns null when there's no
 *  version segment to swap. */
function latestVersionUrl(url) {
  const swapped = url.replace(/\/\d+\.\d+\//, '/latest/')
  return swapped === url ? null : swapped
}

export async function fetchBillText(url, { preserveBreaks = false } = {}) {
  let res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' })
  if (res.status === 404) {
    const fallback = latestVersionUrl(url)
    if (fallback) res = await fetch(fallback, { headers: { 'User-Agent': UA }, redirect: 'follow' })
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
  const html = await res.text()

  const root = parse(html)
  // #legislation is the actual document (explanatory note + provisions); fall
  // back through other content containers, then the whole page.
  const main = root.querySelector('#legislation') || root.querySelector('.body') || root.querySelector('#main-content') || root.querySelector('main') || root
  main.querySelectorAll(DROP).forEach((n) => n.remove())

  if (!preserveBreaks) {
    return main.text.replace(/\s+/g, ' ').trim()
  }

  // structuredText puts newlines between block elements → good paragraph signal.
  let text = main.structuredText || main.text
  text = text
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l && !/^legislationMobileNavigation/i.test(l) && l !== '"')
    .join('\n')

  // join an orphan clause-number line ("259") onto the heading that follows it
  const lines = text.split('\n')
  const out = []
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (/^\d+[A-Z]?$/.test(l) && lines[i + 1] && !/^\d/.test(lines[i + 1])) {
      out.push(`${l} ${lines[i + 1]}`); i++
    } else {
      out.push(l)
    }
  }
  return out.join('\n\n').replace(/\n{3,}/g, '\n\n').trim()
}
