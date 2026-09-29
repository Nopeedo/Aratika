/**
 * /api/newsletter/subscribe — take an email from someone with no account.
 *
 * The rest of the newsletter plumbing assumes a session: /prefs reads
 * auth.getUser() and 401s without one, and email_alerts references auth.users.
 * That is right for a reader who signed up, and it leaves nowhere to put the
 * address of someone who only wants the email. This writes to
 * newsletter_signups (migration 0018), which is keyed on the address itself.
 *
 * Service role, not the browser's client: the table has RLS on with no policy,
 * so nothing reaches it except through here.
 *
 * NOT a send list yet. Rows land with confirmed_at null on purpose — this
 * records that someone asked, not that the address is theirs. Anything that
 * sends must filter on confirmed_at, and a confirmation step has to exist
 * before it can be non-empty. A typo here is a stranger's inbox, and the
 * Unsolicited Electronic Messages Act 2007 wants consent and a live
 * unsubscribe, which is what token is minted for.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/** Deliberately loose. Anything stricter rejects real addresses (plus signs,
 *  long TLDs, unicode domains) and still cannot tell a live inbox from a dead
 *  one — that is what confirmation is for. This only catches the obviously
 *  wrong, so the table does not fill with "hello" and " ". */
const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/

export async function POST(req: Request) {
  let body: { email?: unknown; source?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || email.length > 320 || !LOOKS_LIKE_EMAIL.test(email)) {
    return NextResponse.json({ error: 'bad_email' }, { status: 400 })
  }
  const source = typeof body.source === 'string' ? body.source.slice(0, 64) : null

  // onConflict on the primary key: asking twice is not an error to show
  // anyone, and the second ask must not reset an unsubscribe.
  const { error } = await createAdminClient()
    .from('newsletter_signups')
    .upsert({ email, source }, { onConflict: 'email', ignoreDuplicates: true })

  if (error) {
    console.error('[newsletter/subscribe]', error.message)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
