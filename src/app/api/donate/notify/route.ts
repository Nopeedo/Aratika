/**
 * POST /api/donate/notify — Onebyone Project telling Politika a donation was
 * paid. Sent by Onebyone's Stripe webhook (app/api/v1/webhooks/handlers.py,
 * _handle_politika_donation), signed with the shared secret.
 *
 * Stores the donation in public.donations (migration 0020), where the receipt
 * job picks it up, and adds the donor to the newsletter list when they ticked
 * "Get email updates" (unconfirmed, same rule as every other sign-up).
 * Idempotent on the Stripe session id, so a redelivered note does nothing.
 */

import { verify } from '@/lib/donate/sign'
import { createAdminClient } from '@/lib/supabase/admin'

type Note = {
  session_id?: unknown; reference?: unknown; amount_cents?: unknown; currency?: unknown
  donor_email?: unknown; donor_name?: unknown; email_updates?: unknown; cover_fee?: unknown; paid_at?: unknown
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/

export async function POST(request: Request) {
  const raw = await request.text()
  if (!verify(raw, request.headers.get('x-politika-timestamp'), request.headers.get('x-politika-signature'))) {
    return Response.json({ error: 'Bad signature' }, { status: 401 })
  }

  let note: Note
  try {
    note = JSON.parse(raw)
  } catch {
    return Response.json({ error: 'Bad request' }, { status: 400 })
  }

  const sessionId = str(note.session_id, 200)
  const amount = typeof note.amount_cents === 'number' ? Math.round(note.amount_cents) : 0
  if (!sessionId || amount <= 0) return Response.json({ error: 'Bad request' }, { status: 400 })

  const email = str(note.donor_email, 320).toLowerCase()
  const validEmail = LOOKS_LIKE_EMAIL.test(email) ? email : null
  const paidAt = str(note.paid_at, 40)

  const supabase = createAdminClient()
  const { error } = await supabase.from('donations').upsert({
    stripe_session_id: sessionId,
    reference: str(note.reference, 40) || `POL-${sessionId.slice(-8).toUpperCase()}`,
    amount_cents: amount,
    currency: str(note.currency, 3).toLowerCase() || 'nzd',
    donor_email: validEmail,
    donor_name: str(note.donor_name, 120) || null,
    email_updates: note.email_updates === true,
    cover_fee: note.cover_fee === true,
    paid_at: paidAt && !isNaN(Date.parse(paidAt)) ? paidAt : null,
  }, { onConflict: 'stripe_session_id', ignoreDuplicates: true })

  if (error) {
    // 500 so Onebyone leaves politika_notified_at null and it can be re-sent.
    console.error('[donate/notify]', error.message)
    return Response.json({ error: 'Not stored' }, { status: 500 })
  }

  if (note.email_updates === true && validEmail) {
    const { error: nlError } = await supabase
      .from('newsletter_signups')
      .upsert({ email: validEmail, source: 'donate' }, { onConflict: 'email', ignoreDuplicates: true })
    if (nlError) console.error('[donate/notify] newsletter', nlError.message)
  }

  return Response.json({ ok: true })
}
