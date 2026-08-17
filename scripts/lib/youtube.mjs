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
