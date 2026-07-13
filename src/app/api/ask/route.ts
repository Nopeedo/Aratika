/**
 * POST /api/ask — the "Ask Arapono" companion endpoint.
 *
 * - Requires a signed-in user (login-gated, per product decision).
 * - Enforces a per-user daily limit (free vs premium).
 * - Grounds every answer in Arapono's own data (retrieval + current page),
 *   and instructs the model to answer only from that, cite it, and never give
 *   voting recommendations.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAnthropic, COMPANION_MODEL } from '@/lib/companion/anthropic'
import { retrieve, formatContext, KNOWLEDGE, type KnowledgeItem } from '@/lib/companion/knowledge'
import { buildSystemPrompt } from '@/lib/companion/prompt'

export const runtime = 'nodejs'
export const maxDuration = 30

const FREE_DAILY = 15
const PREMIUM_DAILY = 100
const ACTIVE = ['active', 'trialing']

function nzDay(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

interface ChatMsg { role: 'user' | 'assistant'; content: string }

export async function POST(req: Request) {
  // ── auth ──
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'auth', message: 'Please sign in to use Ask Arapono.' }, { status: 401 })
  }

  // ── parse ──
  let body: { messages?: unknown; pathname?: unknown; level?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }

  const rawMessages = Array.isArray(body.messages) ? body.messages : []
  const messages: ChatMsg[] = rawMessages
    .filter((m): m is ChatMsg => !!m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))
  while (messages.length && messages[0].role !== 'user') messages.shift()

  const pathname = typeof body.pathname === 'string' ? body.pathname : null
  const level = typeof body.level === 'string' ? body.level : null
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content.trim() ?? ''
  if (!lastUser) return NextResponse.json({ error: 'empty', message: 'Ask me a question to get started.' }, { status: 400 })

  // ── rate limit ──
  const admin = createAdminClient()
  const { data: sub } = await admin.from('subscriptions').select('status').eq('user_id', user.id).maybeSingle()
  const isPremium = !!sub && ACTIVE.includes(sub.status as string)
  const limit = isPremium ? PREMIUM_DAILY : FREE_DAILY
  const day = nzDay()
  const { data: usage } = await admin.from('companion_usage').select('count').eq('user_id', user.id).eq('day', day).maybeSingle()
  const used = (usage?.count as number) ?? 0
  if (used >= limit) {
    return NextResponse.json({
      error: 'limit', remaining: 0,
      message: `You've reached today's limit of ${limit} questions — it resets tomorrow.${isPremium ? '' : ' Premium members get more.'}`,
    }, { status: 429 })
  }

  // ── grounding ──
  const pageItem = pathname ? KNOWLEDGE.find((i) => i.href === pathname) ?? null : null
  const retrieved = retrieve(lastUser, 8)
  const merged: KnowledgeItem[] = []
  const seen = new Set<string>()
  for (const it of [...(pageItem ? [pageItem] : []), ...retrieved]) {
    if (!seen.has(it.id)) { seen.add(it.id); merged.push(it) }
  }
  const grounded = merged.slice(0, 8)
  const system = buildSystemPrompt({ level, pageLabel: pageItem?.title ?? null, context: formatContext(grounded) })

  // ── model call ──
  let answer = ''
  try {
    const resp = await getAnthropic().messages.create({
      model: COMPANION_MODEL,
      max_tokens: 600,
      system,
      messages: messages.length ? messages : [{ role: 'user', content: lastUser }],
    })
    answer = resp.content.map((b) => (b.type === 'text' ? b.text : '')).join('\n').trim()
  } catch (e) {
    console.error('[ask] model error', e)
    const message = e instanceof Error && /ANTHROPIC_API_KEY/.test(e.message)
      ? 'Ask Arapono isn’t configured yet (missing API key).'
      : 'Sorry — I had trouble answering just then. Please try again in a moment.'
    return NextResponse.json({ error: 'model', message }, { status: 502 })
  }
  if (!answer) answer = 'I’m not sure about that one. Try rephrasing it, or have a look around the site — I can only answer from Arapono’s own information.'

  // ── count it (after a successful answer) ──
  let remaining = Math.max(0, limit - used - 1)
  try {
    const { data: nc } = await admin.rpc('increment_companion_usage', { p_user: user.id, p_day: day })
    if (typeof nc === 'number') remaining = Math.max(0, limit - nc)
  } catch { /* non-fatal */ }

  const sources = grounded.slice(0, 4).map((it) => ({ title: it.title, href: it.href }))
  return NextResponse.json({ answer, sources, remaining })
}
