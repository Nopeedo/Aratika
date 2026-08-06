/**
 * /api/newsletter/unsubscribe?token=… — one-click unsubscribe from the weekly
 * email. Clicked from an email (no session), so it validates the per-user token
 * with the service role and flips email_digest_enabled off. Returns a small
 * confirmation page. Push notifications are unaffected.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

function page(heading: string, message: string, ok: boolean) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading} — Arapono</title></head>
<body style="margin:0;background:#f4f2ec;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#2A1206">
  <div style="max-width:440px;margin:0 auto;padding:64px 24px;text-align:center">
    <div style="width:48px;height:48px;border-radius:12px;background:${ok ? '#1F8A4C' : '#b45309'};margin:0 auto 20px"></div>
    <h1 style="font-size:24px;font-weight:800;margin:0 0 10px">${heading}</h1>
    <p style="font-size:15px;line-height:1.6;color:#5b3d2a;margin:0 0 22px">${message}</p>
    <a href="https://arapono.org.nz" style="display:inline-block;background:#1F8A4C;color:#fff;font-weight:800;font-size:14px;padding:11px 20px;border-radius:11px;text-decoration:none">Back to Arapono</a>
  </div>
</body></html>`
  return new NextResponse(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token || token === 'DRYRUN') return page('Invalid link', 'That unsubscribe link isn’t valid. If you keep getting emails, reply and we’ll sort it.', false)

  const sb = createAdminClient()
  const { data, error } = await sb
    .from('notification_prefs')
    .update({ email_digest_enabled: false, updated_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)
    .select('user_id')

  if (error || !data || data.length === 0) {
    return page('Link expired', 'We couldn’t match that link to a subscription — it may have already been used.', false)
  }
  return page('You’re unsubscribed', 'You won’t get the weekly Arapono email anymore. Your account and any push notifications are unchanged — you can re-enable the email anytime in your command centre.', true)
}
