/**
 * POST /api/track — records one page view for /editor/analytics.
 *
 * Sent by components/analytics/page-view-tracker.tsx with sendBeacon on every
 * route change. Always answers 204, including when it drops the view or the
 * insert fails: nothing a reader does should ever wait on, or see, analytics.
 *
 * Stored: the path (no query string), the browser's random visitor and
 * session ids, the other site's host on a visit's first page, and a device
 * class. Not stored: IP, user agent, account. See migration 0019.
 */

import { createAdminClient } from '@/lib/supabase/admin'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Crawlers, link unfurlers, uptime checks and headless browsers. Counting them
// would make "visitors" mean "machines that fetched a page".
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|embedly|quora link preview|whatsapp|telegram|discord|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|go-http/i

// Pages whose views are the team's, not readers'.
const SKIP = [/^\/api(\/|$)/, /^\/editor(\/|$)/, /^\/_next(\/|$)/, /^\/auth\//]

function deviceOf(ua: string): string {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return 'tablet'
  if (/mobi|iphone|ipod|android/i.test(ua)) return 'mobile'
  return 'desktop'
}

const none = () => new Response(null, { status: 204 })

export async function POST(request: Request) {
  const ua = request.headers.get('user-agent') ?? ''
  if (!ua || BOT.test(ua)) return none()

  let body: { path?: unknown; vid?: unknown; sid?: unknown; ref?: unknown }
  try {
    body = await request.json()
  } catch {
    return none()
  }

  // Path only: the query string and hash come off here even if the client sent
  // them, because some carry tokens (reset-password, email confirm links).
  const raw = typeof body.path === 'string' ? body.path : ''
  const path = raw.split(/[?#]/)[0].slice(0, 300)
  if (!path.startsWith('/') || SKIP.some((re) => re.test(path))) return none()

  const vid = typeof body.vid === 'string' && UUID.test(body.vid) ? body.vid : null
  const sid = typeof body.sid === 'string' && UUID.test(body.sid) ? body.sid : null

  // The other site's host only, and never our own.
  let referrerHost: string | null = null
  if (typeof body.ref === 'string' && body.ref) {
    try {
      const host = new URL(body.ref).hostname.replace(/^www\./, '').slice(0, 120)
      const self = new URL(request.url).hostname.replace(/^www\./, '')
      if (host && host !== self && host !== 'politika.nz' && !host.endsWith('.vercel.app')) referrerHost = host
    } catch { /* not a URL: leave it null */ }
  }

  try {
    const supabase = createAdminClient()
    await supabase.from('page_views').insert({
      path,
      visitor_id: vid,
      session_id: sid,
      referrer_host: referrerHost,
      device: deviceOf(ua),
    })
  } catch {
    // Missing env or table (migration 0019 not applied yet): drop the view.
  }
  return none()
}
