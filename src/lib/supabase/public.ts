/**
 * A Supabase client for reading PUBLIC content, with no cookies attached.
 *
 * The server client in ./server.ts reads and writes the auth session through
 * next/headers cookies. Touching cookies opts a route out of static rendering
 * entirely, so any page that read published news, video or positions through it
 * became dynamic — a server render and a database round trip on every single
 * navigation. On /parties/[slug] that measured 1.7-2.4 seconds per party switch,
 * which is why changing party felt like a page reload rather than a change of
 * view.
 *
 * None of those reads depend on who is asking. They select status='approved'
 * rows, which is exactly what the site shows everyone, and row-level security
 * refuses anon anything else — verified against the live database: anon sees 116
 * approved positions and 0 pending. So the cookie was buying nothing and costing
 * every consuming route its ability to be cached.
 *
 * Use this for published content a signed-out visitor could see. Anything that
 * depends on the current user — bookmarks, the dashboard, the editor queue —
 * must keep using ./server.ts.
 */
import { createClient } from '@supabase/supabase-js'

export function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
}
