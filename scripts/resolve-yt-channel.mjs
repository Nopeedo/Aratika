/**
 * resolve-yt-channel.mjs — turn a YouTube handle, channel URL or video URL into
 * the canonical channel ID, read from the page's own `externalId`.
 *
 * Every channel in ingest-videos.mjs must be verified this way. A guessed or
 * mistyped ID does not fail loudly — it silently ingests some other entity's
 * videos and, for a party channel, attributes them to that party. That is the
 * worst failure this site can have, so the ID never comes from memory or search
 * results; it comes from the channel itself.
 *
 * Also prints the channel title and the RSS feed's first entry, because an ID
 * that resolves but whose feed is empty or wrong is still unusable.
 *
 * Run: node scripts/resolve-yt-channel.mjs @handle https://youtube.com/watch?v=…
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'

const targets = process.argv.slice(2)
if (targets.length === 0) {
  console.error('Give me handles (@name), channel URLs, or video URLs.')
  process.exit(1)
}

function urlFor(t) {
  if (/^https?:\/\//.test(t)) return t
  if (t.startsWith('@')) return `https://www.youtube.com/${t}`
  if (/^UC[\w-]{22}$/.test(t)) return `https://www.youtube.com/channel/${t}`
  return `https://www.youtube.com/@${t}`
}

async function feedHead(id) {
  try {
    const xml = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`, { headers: { 'User-Agent': UA } }).then((r) => r.text())
    const count = xml.split('<entry>').length - 1
    const first = (xml.match(/<entry>[\s\S]*?<title>([^<]+)<\/title>/) || [])[1]
    const author = (xml.match(/<author>\s*<name>([^<]+)<\/name>/) || [])[1]
    // A channel whose newest upload is years old is dormant — the ID resolves,
    // the feed parses, and it contributes nothing. Worth seeing before adding.
    const published = (xml.match(/<entry>[\s\S]*?<published>([^<]+)<\/published>/) || [])[1]
    return { count, first, author, published }
  } catch (e) { return { count: 0, first: null, author: null, error: e.message } }
}

for (const t of targets) {
  const url = urlFor(t)
  let html
  try { html = await fetch(url, { headers: { 'User-Agent': UA } }).then((r) => r.text()) }
  catch (e) { console.log(`✗ ${t}\n    fetch failed: ${e.message}\n`); continue }

  const id = (html.match(/"externalId":"(UC[\w-]{22})"/) || html.match(/"channelId":"(UC[\w-]{22})"/) || [])[1]
  const title = (html.match(/<meta property="og:title" content="([^"]*)"/) || [])[1]

  if (!id) { console.log(`✗ ${t}\n    no externalId found (page may be a consent wall or the handle is wrong)\n`); continue }

  const f = await feedHead(id)
  console.log(`✓ ${t}`)
  console.log(`    id:      ${id}`)
  console.log(`    page:    ${title || '(no og:title)'}`)
  console.log(`    feed:    ${f.count} entries${f.author ? `, author "${f.author}"` : ''}${f.error ? ` — ${f.error}` : ''}`)
  console.log(`    latest:  ${f.first || '(none)'}${f.published ? `  [${f.published.slice(0, 10)}]` : ''}\n`)
}
process.exit(0)
