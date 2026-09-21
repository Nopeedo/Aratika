/**
 * position-text.mjs — fetching and normalising the party pages positions are
 * drafted from, shared by the drafter and the publisher.
 *
 * These used to live inside draft-positions.mjs, and the (since retired)
 * catch-up script carried a copy "identical to" them. The first quote verifier
 * written against that copy reported six false failures because it did not fold
 * smart quotes the way normText does — nearly "fixing" working positions. One
 * implementation, imported everywhere, is the only way two scripts can agree on
 * what verbatim means.
 */

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { parse } from 'node-html-parser'
import { PDFParse } from 'pdf-parse'
import { readFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'

/** An HTTP response that is not a page. `.status` is the code; `.gone` is true
 *  for 404/410, which mean the page no longer exists rather than "try later". */
export class HttpError extends Error {
  constructor(url, status) {
    super(`HTTP ${status} for ${url}`)
    this.status = status
    this.gone = status === 404 || status === 410
  }
}

/**
 * Fetch a URL's body, or throw.
 *
 * Status-aware, which the old `curl -s -L` was not: a Cloudflare 403 or a 404
 * template came back as a body of a few hundred characters and was hashed as
 * if it were the page — so a blocked fetch on the GitHub runner read as "the
 * party changed its policy". Now a non-2xx is an error the caller classifies.
 */
export function curlHtml(url) {
  const tmp = join(tmpdir(), `politika-fetch-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  try {
    const code = execFileSync('curl', ['-s', '-L', '--max-time', '30', '-A', UA, '-o', tmp, '-w', '%{http_code}', url], { encoding: 'utf8', maxBuffer: 1024 * 1024 }).trim()
    const status = Number(code)
    if (!(status >= 200 && status < 300)) throw new HttpError(url, status || 0)
    return readFileSync(tmp, 'utf8')
  } finally {
    try { unlinkSync(tmp) } catch { /* ignore */ }
  }
}
export function fetchText(url) {
  const root = parse(curlHtml(url))
  root.querySelectorAll('script,style,noscript,svg,header,footer,nav,form').forEach((e) => e.remove())
  return root.text.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}
export async function fetchPdfText(url) {
  const tmp = join(tmpdir(), `politika-manifesto-${Date.now()}.pdf`)
  const code = execFileSync('curl', ['-s', '-L', '--max-time', '60', '-A', UA, url, '-o', tmp, '-w', '%{http_code}'], { encoding: 'utf8', maxBuffer: 1024 * 1024 }).trim()
  try {
    const status = Number(code)
    if (!(status >= 200 && status < 300)) throw new HttpError(url, status || 0)
    const parser = new PDFParse({ data: new Uint8Array(readFileSync(tmp)) })
    const res = await parser.getText()
    return (res.text || '').replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  } finally {
    try { unlinkSync(tmp) } catch { /* ignore */ }
  }
}
export async function fetchSource(url) {
  return /\.pdf($|\?)/i.test(url) ? fetchPdfText(url) : fetchText(url)
}

/**
 * Fetch every source, labelled by URL.
 *
 * Three outcomes per page, and the difference matters to the drift check:
 *   parts   — fetched. Short bodies are kept: a JS-rendered shell is short every
 *             day and hashes the same every day, which is correct.
 *   failed  — could not be read (timeout, connection, 403, 5xx). UNKNOWN. Never
 *             a change and never a removal; one 403 on the GitHub runner used to
 *             move the fingerprint of the whole set.
 *   gone    — 404 or 410. The page no longer exists, which IS a change.
 */
export async function fetchAllSources(urls) {
  const parts = []
  const failed = []
  const gone = []
  for (const u of urls) {
    try {
      const t = await fetchSource(u)
      parts.push({ url: u, text: t || '' })
    } catch (e) {
      if (e instanceof HttpError && e.gone) { gone.push(u); console.warn(`    ✗ source is gone (HTTP ${e.status}): ${u}`) }
      else { failed.push(u); console.warn(`    ✗ source fetch failed: ${u} (${String(e?.message || e).split('\n')[0]})`) }
    }
  }
  return { text: parts.map((p) => `### SOURCE: ${p.url}\n${p.text}`).join('\n\n'), parts, failed, gone }
}

// ── Verbatim guardrail ────────────────────────────────────────────────────────
// The model is told to copy quotes exactly, but LLMs drift — an audit (Jul 2026)
// found paraphrases, stitched sentences and altered wording presented inside
// quotation marks. This deterministically drops any excerpt/quote that is not an
// actual substring of the scraped source, so a fabricated quote can never ship.
export function normText(s) {
  return String(s)
    .toLowerCase()
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}
export function isVerbatim(source, s) {
  // Strip wrapping quotes / ellipsis so a legitimately trimmed excerpt still matches.
  const q = normText(s).replace(/^["'….\s]+|["'….\s]+$/g, '')
  if (q.length < 12) return false
  return normText(source).includes(q)
}
/** Which fetched page a verbatim excerpt actually came from, or null. */
export function excerptSource(parts, excerpt) {
  const hit = parts.find((p) => isVerbatim(p.text, excerpt))
  return hit ? hit.url : null
}

/**
 * Fingerprint of ONE page's text.
 *
 * Whitespace-normalised so a reflow does not read as a policy change. Not
 * truncated: the old combined fingerprint cut the concatenation of every source
 * at 40,000 characters, so whether a change was even visible depended on which
 * page happened to come first.
 */
export const pageHash = (text) =>
  createHash('sha256').update(normText(text)).digest('hex').slice(0, 32)

/** The legacy fingerprint of the whole concatenation — kept only so rows written
 *  before per-page hashes existed can be bridged on their first run. */
export const sourceFingerprint = (text) =>
  createHash('sha256').update(String(text || '').replace(/\s+/g, ' ').trim().slice(0, 40000)).digest('hex').slice(0, 32)

/**
 * What changed between the pages a position was drafted from and the pages
 * fetched now. A page that failed to fetch is neither changed nor removed; a
 * page that is gone (404) is removed.
 */
export function diffSources(prior, current, failed = []) {
  const failedSet = new Set(failed)
  const added = Object.keys(current).filter((u) => !(u in prior))
  const changed = Object.keys(current).filter((u) => u in prior && prior[u] !== current[u])
  const removed = Object.keys(prior).filter((u) => !(u in current) && !failedSet.has(u))
  const unknown = Object.keys(prior).filter((u) => failedSet.has(u))
  return { added, changed, removed, unknown }
}

/**
 * The hashes to record after a run: today's for every page read, and the
 * PRIOR hash for any page that failed to fetch. Dropping a failed page's hash
 * made it come back as "added" the next day it fetched — which re-proposed a
 * change an editor had just rejected.
 */
export function mergeHashes(prior, current, failed = []) {
  const out = { ...current }
  for (const u of failed) if (prior && u in prior) out[u] = prior[u]
  return out
}
