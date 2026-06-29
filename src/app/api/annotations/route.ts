/**
 * /api/annotations
 *  GET  ?bill=<contentItemId>  → the signed-in user's highlights for that bill
 *  POST { contentItemId, billSlug, billTitle, paragraphIndex, quote, note }
 *       → create a highlight (login + Premium required)
 *
 * RLS guarantees users only ever see/touch their own rows.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PREMIUM_ENABLED } from '@/constants/features'

export const runtime = 'nodejs'

const ACTIVE = ['active', 'trialing']

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ annotations: [] })

  const bill = new URL(req.url).searchParams.get('bill')
  let q = supabase.from('bill_annotations').select('id, paragraph_index, quote, note, created_at').order('paragraph_index').order('created_at')
  if (bill) q = q.eq('content_item_id', bill)
  const { data } = await q
  return NextResponse.json({ annotations: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'auth', message: 'Sign in to save highlights.' }, { status: 401 })

  // Premium gate (skipped while the paid tier is off — highlights are free)
  if (PREMIUM_ENABLED) {
    const { data: sub } = await supabase.from('subscriptions').select('status').eq('user_id', user.id).maybeSingle()
    if (!sub || !ACTIVE.includes(sub.status as string)) {
      return NextResponse.json({ error: 'premium', message: 'Highlights & notes are a Premium feature.' }, { status: 403 })
    }
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }

  const contentItemId = typeof body.contentItemId === 'string' ? body.contentItemId : null
  const quote = typeof body.quote === 'string' ? body.quote.trim().slice(0, 2000) : ''
  if (!contentItemId || !quote) return NextResponse.json({ error: 'bad_request', message: 'Nothing to highlight.' }, { status: 400 })

  const row = {
    user_id: user.id,
    content_item_id: contentItemId,
    bill_slug: typeof body.billSlug === 'string' ? body.billSlug : null,
    bill_title: typeof body.billTitle === 'string' ? body.billTitle.slice(0, 300) : null,
    paragraph_index: Number.isFinite(body.paragraphIndex) ? Math.max(0, Math.floor(body.paragraphIndex as number)) : 0,
    quote,
    note: typeof body.note === 'string' ? body.note.slice(0, 4000) : null,
  }
  const { data, error } = await supabase.from('bill_annotations').insert(row).select('id, paragraph_index, quote, note, created_at').single()
  if (error) return NextResponse.json({ error: 'insert_failed', message: error.message }, { status: 500 })
  return NextResponse.json({ annotation: data })
}
