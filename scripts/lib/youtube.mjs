/**
 * lib/youtube.mjs — one way to read a channel's uploads, whether or not a
 * YouTube Data API key is configured.
 *
 * Why this exists: the channel RSS feed exposes only the last 15 uploads. That
 * is fine for a party channel posting weekly and useless for an interview
 * podcast — Dave Letele's Chlöe Swarbrick episode is roughly thirty episodes
 * back, so his channel is configured and contributes nothing. Raising
 * PER_CHANNEL cannot help; the entries simply are not in the feed.
 *
 * With YOUTUBE_API_KEY set, every channel's full upload history is reachable and
 * the descriptions come back complete rather than truncated. Without it,
 * everything still works exactly as before on RSS. No key is never an error —
 * it is a smaller window, reported honestly at startup.
 *
 * Quota: the uploads-playlist route costs 1 unit per 50 videos against a
 * 10,000/day default, so reading 20 channels 100-deep costs about 40 units. The
 * expensive call is search.list at 100 units, used only by discovery.
 *
 * Getting a key: console.cloud.google.com -> new project -> enable "YouTube Data
 * API v3" -> Credentials -> Create credentials -> API key. Free, no billing
 * card. Put it in .env.local as YOUTUBE_API_KEY, and in the repo's Actions
 * secrets for the scheduled runs.
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'
const API = 'https://www.googleapis.com/youtube/v3'

export const apiKey = () => process.env.YOUTUBE_API_KEY || ''
export const hasApiKey = () => apiKey().length > 10

let warned = false
/** Say once, clearly, which mode we are in — a silent fallback to a 15-video
 *  window is exactly the kind of quiet degradation that looks like success. */
export function announceMode(label = '') {
  if (warned) return
  warned = true
  console.log(hasApiKey()
    ? `YouTube: Data API key found — full upload history available${label}`
    : `YouTube: no YOUTUBE_API_KEY — falling back to RSS, which exposes only the newest 15 uploads per channel${label}`)
}

/** A channel's uploads playlist is its channel ID with the UC prefix swapped. */
const uploadsPlaylist = (channelId) => 'UU' + channelId.slice(2)

async function json(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } })
  const body = await r.json().catch(() => null)
  if (!r.ok) {
    const reason = body?.error?.errors?.[0]?.reason || body?.error?.message || `HTTP ${r.status}`
    const err = new Error(reason)
    err.reason = reason
    throw err
  }
  return body
}

/** Uploads via the Data API. Paginates 50 at a time. */
async function viaApi(channelId, max) {
  const out = []
  let pageToken = ''
  while (out.length < max) {
    const url = `${API}/playlistItems?part=snippet&maxResults=50&playlistId=${uploadsPlaylist(channelId)}`
      + `&key=${apiKey()}${pageToken ? `&pageToken=${pageToken}` : ''}`
    const body = await json(url)
    for (const it of body.items || []) {
      const s = it.snippet || {}
      const vid = s.resourceId?.videoId
      if (!vid || !s.title) continue
      out.push({ videoId: vid, title: s.title, description: s.description || '', published: s.publishedAt || null })
      if (out.length >= max) break
    }
    pageToken = body.nextPageToken || ''
    if (!pageToken) break
  }
  return out
}

const decode = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#3[49];/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, '&')

/** Uploads via channel RSS. Hard-capped at 15 by YouTube, not by us. */
async function viaRss(channelId, max) {
  const xml = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, { headers: { 'User-Agent': UA } }).then((r) => r.text())
  const out = []
  for (const e of xml.split('<entry>').slice(1, max + 1)) {
    const videoId = (e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1]
    const title = (e.match(/<title>([^<]+)<\/title>/) || [])[1]
    if (!videoId || !title) continue
    out.push({
      videoId,
      title: decode(title),
      description: decode((e.match(/<media:description>([\s\S]*?)<\/media:description>/) || [])[1] || ''),
      published: (e.match(/<published>([^<]+)<\/published>/) || [])[1] || null,
    })
  }
  return out
}

/**
 * Uploads for a channel, newest first. Uses the API when a key is present and
 * falls back to RSS on any API failure — a revoked key or an exhausted quota
 * should degrade the window, never halt the ingest.
 *
 * @returns {Promise<Array<{videoId, title, description, published}>>}
 */
export async function getUploads(channelId, max = 50) {
  if (hasApiKey()) {
    try { return await viaApi(channelId, max) }
    catch (e) { console.warn(`  ⚠ API failed for ${channelId} (${e.reason || e.message}) — falling back to RSS`) }
  }
  try { return await viaRss(channelId, max) }
  catch (e) { console.warn(`  ✗ RSS failed for ${channelId}: ${e.message}`); return [] }
}

/**
 * Durations in seconds, keyed by video id.
 *
 * Needed because reading deeper than RSS drags in the shorts. A channel that
 * posts one interview and fifteen clips from it looks, in a title-only view,
 * like sixteen interviews — Dave Letele's leader-naming uploads are ten
 * 30-second cuts ("GROCERY PRICES", "BECOMING PM") whose titles name nobody and
 * which match only through the description they inherit from the full episode.
 * Staging those buries the actual interview in the review queue.
 *
 * videos.list costs 1 unit per 50 ids, so this is close to free. Returns an
 * empty map without a key, and callers must treat "unknown" as "keep" — a
 * missing duration should never silently drop a real interview.
 */
export async function getDurations(videoIds) {
  const out = new Map()
  if (!hasApiKey() || videoIds.length === 0) return out
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50)
    try {
      const body = await json(`${API}/videos?part=contentDetails&id=${batch.join(',')}&key=${apiKey()}`)
      for (const it of body.items || []) {
        const d = it.contentDetails?.duration || ''
        const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(d)
        if (!m) continue
        out.set(it.id, (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0))
      }
    } catch (e) {
      console.warn(`  ⚠ duration lookup failed (${e.reason || e.message}) — those clips keep their place`)
    }
  }
  return out
}

/**
 * Titles + descriptions for videos we have already stored. Needed to re-tag rows
 * that were staged before a tagging fix: we keep the videoId but not the source
 * text, so the text has to be fetched again. 1 quota unit per 50 ids, same as
 * getDurations. Returns a Map keyed by videoId; ids YouTube no longer serves
 * (deleted or made private) are simply absent, which the caller should treat as
 * "leave that row alone" rather than "it has no tags".
 */
export async function getSnippets(videoIds) {
  const out = new Map()
  if (!hasApiKey() || videoIds.length === 0) return out
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50)
    try {
      const body = await json(`${API}/videos?part=snippet&id=${batch.join(',')}&key=${apiKey()}`)
      for (const it of body.items || []) {
        out.set(it.id, { title: it.snippet?.title || '', description: it.snippet?.description || '' })
      }
    } catch (e) {
      console.warn(`  ⚠ snippet lookup failed (${e.reason || e.message}) — those rows are left untouched`)
    }
  }
  return out
}

/**
 * Search, for discovery. Region-locked to NZ and English so a query like
 * "Chris Hipkins interview" is not answered with unrelated results from
 * elsewhere — something the HTML-scraping fallback cannot express at all.
 *
 * 100 quota units per call, so callers should keep the query list short.
 * Returns null when there is no key, so the caller can choose its own fallback.
 */
export async function searchVideos(query, { max = 25, publishedAfter } = {}) {
  if (!hasApiKey()) return null
  const url = `${API}/search?part=snippet&type=video&maxResults=${Math.min(max, 50)}`
    + `&regionCode=NZ&relevanceLanguage=en&order=relevance`
    + (publishedAfter ? `&publishedAfter=${publishedAfter}` : '')
    + `&q=${encodeURIComponent(query)}&key=${apiKey()}`
  try {
    const body = await json(url)
    return (body.items || []).map((it) => ({
      videoId: it.id?.videoId,
      title: it.snippet?.title || '',
      description: it.snippet?.description || '',
      channelId: it.snippet?.channelId,
      channelTitle: it.snippet?.channelTitle || '',
      published: it.snippet?.publishedAt || null,
    })).filter((r) => r.videoId && r.channelId)
  } catch (e) {
    console.warn(`  ⚠ search failed for "${query}" (${e.reason || e.message}) — falling back to HTML`)
    return null
  }
}

/**
 * A YouTube description is two documents glued together: a short synopsis whoever
 * uploaded it actually wrote, and a block of promo boilerplate the channel appends
 * to every single upload — subscribe links, app downloads, socials, sponsor copy,
 * the on-air roster.
 *
 * Tagging read the whole thing, so the boilerplate became content:
 *   • The Platform's host schedule line "Michael Laws: 10am - 1pm" tagged EVERY
 *     one of its uploads as a candidate for Waitaki.
 *   • A sponsor's "crafted the old school way" tagged them "education".
 *   • NZ Herald's standard footer put its whole show rundown on unrelated clips.
 *
 * Reading the description is still right — "The Hui Episode 02:11" names nobody in
 * its title — so the fix is to stop at the boilerplate rather than ignore the text.
 * Keep everything up to the first line that is unmistakably channel furniture.
 * Where a description is nothing BUT furniture (the Friday Fry Up), that correctly
 * yields an empty synopsis and the clip is judged on its title alone.
 */
// Regex literals, not strings: '\b' inside a quoted string is a BACKSPACE
// character, not a word boundary, so a string-built version of this silently
// matched nothing at all.
const BOILERPLATE = [
  /https?:\/\//i, /www\./i,                          // any link block
  /^\s*#/,                                           // hashtag footer
  /\bsubscribe\b/i, /\bfollow us\b/i, /\bsign up\b/i, /\bjoin now\b/i,
  /\bbrought to you by\b/i, /\bsponsored by\b/i,     // sponsor copy
  /\bwatch\b.{0,24}\blive\b/i, /\bdownload\b.{0,16}\bapp\b/i,
  /\bapp store\b/i, /\bgoogle play\b/i, /\bpatreon\b/i, /\bmerch\b/i,
  /\bcheck out our\b/i, /\bstandard sms\b/i, /\btext us\b/i, /\bcall 0800\b/i,
  /\blisten to\b.{0,40}\b(hosts?|weekday)\b/i,       // station roster intro
  /^\s*[a-z .'-]{3,28}:\s*\d{1,2}\s*(am|pm)\b/i,     // "Michael Laws: 10am - 1pm"
]
const isBoilerplate = (line) => BOILERPLATE.some((re) => re.test(line))

export function synopsis(description, { maxChars = 600 } = {}) {
  if (!description) return ''
  const kept = []
  for (const line of String(description).split(/\r?\n/)) {
    if (isBoilerplate(line)) break
    kept.push(line)
    if (kept.join(' ').length >= maxChars) break
  }
  return kept.join(' ').replace(/\s+/g, ' ').slice(0, maxChars).trim()
}
