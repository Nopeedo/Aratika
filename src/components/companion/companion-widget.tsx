'use client'

/**
 * CompanionWidget — "Ask Aratika". A floating chat helper (bottom-right) that
 * answers questions grounded in Aratika's own data, knows which page you're on,
 * and pitches answers at your saved level. Login-gated; shows source links and
 * a clear "can make mistakes" note.
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, ChevronDown, ArrowUpRight, Lock, Loader2, ShieldCheck } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { usePreferences } from '@/hooks/use-preferences'
import { isEnabled } from '@/constants/features'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

interface Source { title: string; href: string }
interface Msg { role: 'user' | 'assistant'; content: string; sources?: Source[] }

const SUGGESTIONS = ['Explain this page', 'What is MMP?', 'How does a bill become law?']

export function CompanionWidget() {
  const pathname = usePathname()
  const { user, loading } = useUser()
  const { prefs } = usePreferences()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([])
  const [sending, setSending] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  // gated until its launch phase; also hidden on auth pages
  if (!isEnabled('companion')) return null
  if (pathname?.startsWith('/login') || pathname?.startsWith('/register')) return null

  async function send(text: string) {
    const q = text.trim()
    if (!q || sending) return
    const next = [...messages, { role: 'user' as const, content: q }]
    setMessages(next)
    setInput('')
    setSending(true)
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })), pathname, level: prefs.level }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessages((m) => [...m, { role: 'assistant', content: data.message || 'Something went wrong. Please try again.' }])
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: data.answer, sources: data.sources }])
        if (typeof data.remaining === 'number') setRemaining(data.remaining)
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'I couldn’t reach the server. Please check your connection and try again.' }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 65, fontFamily: MANROPE }}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.96 }} transition={{ duration: 0.2 }}
            style={{ position: 'absolute', bottom: 70, right: 0, width: 380, maxWidth: 'calc(100vw - 40px)', height: 540, maxHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 20, boxShadow: '0 20px 56px rgba(12,14,18,.22)', overflow: 'hidden' }}
          >
            {/* header */}
            <div style={{ background: 'linear-gradient(150deg,#0f9152,#0c0e12)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles style={{ width: 16, height: 16, color: '#fff' }} /></span>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: '#fff' }}>Ask Aratika</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>Non-partisan · sourced</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: 'rgba(255,255,255,.12)', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronDown style={{ width: 17, height: 17, color: '#fff' }} /></button>
            </div>

            {/* body */}
            {loading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 style={{ width: 22, height: 22, color: TERTIARY }} className="animate-spin" /></div>
            ) : !user ? (
              <SignedOut />
            ) : (
              <>
                <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {messages.length === 0 && (
                    <div>
                      <p style={{ fontSize: 14, color: SECONDARY, lineHeight: 1.55, margin: '0 0 14px' }}>
                        Kia ora 👋 I’m your guide to NZ politics. Ask me anything — what a term means, how something works, or what’s on this page. There are no silly questions.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {SUGGESTIONS.map((s) => (
                          <button key={s} onClick={() => send(s)} style={{ textAlign: 'left', cursor: 'pointer', fontFamily: MANROPE, fontSize: 13, fontWeight: 700, color: INK, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 11, padding: '10px 13px' }}>{s}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map((m, i) => <Bubble key={i} msg={m} />)}
                  {sending && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: TERTIARY, fontSize: 13 }}>
                      <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" /> Thinking…
                    </div>
                  )}
                </div>

                {/* composer */}
                <div style={{ borderTop: `1px solid ${BORDER}`, padding: '10px 12px' }}>
                  <form onSubmit={(e) => { e.preventDefault(); send(input) }} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <textarea
                      value={input} onChange={(e) => setInput(e.target.value)} rows={1} placeholder="Ask a question…"
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
                      style={{ flex: 1, resize: 'none', maxHeight: 90, fontFamily: MANROPE, fontSize: 13.5, color: INK, border: `1px solid ${BORDER}`, borderRadius: 11, padding: '10px 12px', outline: 'none', lineHeight: 1.4 }}
                    />
                    <button type="submit" disabled={!input.trim() || sending} aria-label="Send" style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 11, border: 'none', background: input.trim() && !sending ? JADE : '#cdd2d8', color: '#fff', cursor: input.trim() && !sending ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send style={{ width: 17, height: 17 }} /></button>
                  </form>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 7 }}>
                    <span style={{ fontSize: 10.5, color: TERTIARY, display: 'inline-flex', alignItems: 'center', gap: 4 }}><ShieldCheck style={{ width: 11, height: 11, color: JADE }} /> Sourced from Aratika · can make mistakes — check sources</span>
                    {remaining !== null && <span style={{ fontSize: 10.5, color: TERTIARY }}>{remaining} left today</span>}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <button onClick={() => setOpen((o) => !o)} aria-label="Ask Aratika" style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', background: JADE, color: '#fff', border: 'none', borderRadius: 999, padding: '11px 18px 11px 13px', boxShadow: '0 8px 24px rgba(31,138,76,.4)' }}>
        <Sparkles style={{ width: 19, height: 19 }} />
        <span style={{ fontSize: 14, fontWeight: 800 }}>Ask Aratika</span>
      </button>
    </div>
  )
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{ maxWidth: '88%' }}>
        <div style={{
          fontSize: 13.5, lineHeight: 1.55, whiteSpace: 'pre-wrap', fontFamily: MANROPE,
          padding: '10px 13px', borderRadius: 14,
          background: isUser ? INK : SURFACE, color: isUser ? '#fff' : '#23262c',
          borderBottomRightRadius: isUser ? 4 : 14, borderBottomLeftRadius: isUser ? 14 : 4,
          border: isUser ? 'none' : `1px solid ${BORDER}`,
        }}>
          {msg.content}
        </div>
        {msg.sources && msg.sources.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
            {msg.sources.map((s) => (
              <Link key={s.href} href={s.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, color: JADE, background: '#ecfdf5', border: '1px solid #cfe9d8', borderRadius: 999, padding: '4px 10px', textDecoration: 'none', fontFamily: MANROPE }}>
                {s.title} <ArrowUpRight style={{ width: 11, height: 11 }} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SignedOut() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '28px 26px' }}>
      <div style={{ width: 48, height: 48, borderRadius: 13, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><Lock style={{ width: 22, height: 22, color: JADE }} /></div>
      <div style={{ fontSize: 17, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 7 }}>Sign in to ask Aratika</div>
      <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55, margin: '0 0 18px' }}>
        Your free account unlocks the assistant — ask questions, get guidance, and understand any page, all in plain language.
      </p>
      <div style={{ display: 'flex', gap: 9 }}>
        <Link href="/register" style={{ padding: '10px 18px', borderRadius: 11, background: JADE, color: '#fff', fontSize: 13.5, fontWeight: 800, textDecoration: 'none', fontFamily: MANROPE }}>Sign up free</Link>
        <Link href="/login" style={{ padding: '10px 18px', borderRadius: 11, background: '#fff', border: `1px solid ${BORDER}`, color: INK, fontSize: 13.5, fontWeight: 700, textDecoration: 'none', fontFamily: MANROPE }}>Log in</Link>
      </div>
    </div>
  )
}
