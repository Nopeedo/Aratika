'use client'

/**
 * BillFullText — embedded, readable full bill text with:
 *  - a side table-of-contents (jump to any Part/Subpart/Schedule)
 *  - policy passages highlighted + jump-to
 *  - (Premium, logged-in) select text → highlight + note, saved to the dashboard
 * Reading is free. Residual page-chrome is filtered out defensively.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown, ChevronUp, FileText, Scale, Highlighter, Trash2, List,
  Home, Heart, TrendingUp, Leaf, GraduationCap, Globe, Landmark, Wind, Users, X,
} from 'lucide-react'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import type { PolicyTopic } from '@/types'
import type { PolicyLink } from '@/components/bills/bill-breakdown'
import { useUser } from '@/hooks/use-user'
import { PREMIUM_ENABLED } from '@/constants/features'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const HL = '#fff3bf', HL_BORDER = '#ffe08a'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const ICONS: Record<string, React.ElementType> = { Home, Heart, TrendingUp, Leaf, GraduationCap, Scale, Globe, Landmark, Wind, Users }

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9āēīōū ]+/g, ' ').replace(/\s+/g, ' ').trim()
const isHeading = (p: string) => /^(part|subpart|schedule|new part|new schedule)\b/i.test(p.trim()) && p.length < 100

// page-chrome that should never appear in the bill body
const BOILER = [/^<!doctype/i, /\|\s*new zealand legislation/i, /^skip to /i, /^download\b/i, /^loading\.{0,3}$/i, /^checking for related/i, /^hide\/?show/i, /^repealed sections and history notes$/i, /^search content$/i, /^learn more about web feeds$/i, /^bill current latest version/i, /^print$/i, /^quick search/i, /^previous (section|hit)/i, /^next (section|hit)/i]
const isBoiler = (s: string) => { const t = s.trim(); return !t || BOILER.some((r) => r.test(t)) }

interface Annotation { id: string; paragraph_index: number; quote: string; note: string | null }
interface Para { text: string; topics: string[]; id: string; head: boolean }

export function BillFullText({ fullText, policyLinks, docType = 'bill', contentItemId, billSlug, billTitle }: {
  fullText: string | null; policyLinks: PolicyLink[]; docType?: string
  contentItemId?: string; billSlug?: string; billTitle?: string
}) {
  const { user, isPremium } = useUser()
  const canAnnotate = !!user && isPremium
  const [open, setOpen] = useState(false)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [sel, setSel] = useState<{ top: number; left: number; paragraphIndex: number; quote: string } | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [activeNote, setActiveNote] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user || !contentItemId) return
    fetch(`/api/annotations?bill=${contentItemId}`).then((r) => r.json()).then((d) => setAnnotations(d.annotations ?? [])).catch(() => {})
  }, [user, contentItemId])

  const { paras, topicFirstId, topicsPresent, toc } = useMemo(() => {
    if (!fullText) return { paras: [] as Para[], topicFirstId: {} as Record<string, string>, topicsPresent: [] as string[], toc: [] as { id: string; label: string; sub: boolean }[] }
    const probes = policyLinks.filter((p) => POLICY_TOPICS[p.topic as PolicyTopic]).map((p) => ({ topic: p.topic, list: (p.excerpts || []).map((e) => norm(e).slice(0, 60)).filter((e) => e.length >= 15) }))
    const seen: Record<string, string> = {}
    const present = new Set<string>()
    const toc: { id: string; label: string; sub: boolean }[] = []
    const paras: Para[] = fullText.split(/\n{2,}/).map((t) => t.trim()).filter((t) => !isBoiler(t)).map((text, i) => {
      const id = `blk-${i}`
      const head = isHeading(text)
      if (head) toc.push({ id, label: text, sub: /^subpart/i.test(text) })
      const np = norm(text)
      const topics = probes.filter((pr) => pr.list.some((probe) => np.includes(probe))).map((pr) => pr.topic)
      for (const tp of topics) { present.add(tp); if (!seen[tp]) seen[tp] = id }
      return { text, topics, id, head }
    })
    return { paras, topicFirstId: seen, topicsPresent: [...present], toc }
  }, [fullText, policyLinks])

  if (!fullText) return null

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  function onMouseUp() {
    const s = window.getSelection()
    if (!s || s.isCollapsed) { setSel(null); return }
    const quote = s.toString().trim()
    if (quote.length < 4) { setSel(null); return }
    const el = (n: Node | null) => (n && n.nodeType === 3 ? n.parentElement : (n as Element | null))
    const a = el(s.anchorNode)?.closest('[data-pidx]'); const f = el(s.focusNode)?.closest('[data-pidx]')
    if (!a || a !== f) { setSel(null); return }
    const pidx = parseInt(a.getAttribute('data-pidx') || '0', 10)
    const r = s.getRangeAt(0).getBoundingClientRect()
    setNoteDraft(''); setSel({ top: r.bottom + 6, left: Math.max(12, r.left), paragraphIndex: pidx, quote })
  }

  async function save() {
    if (!sel || !contentItemId) return
    setSaving(true)
    try {
      const res = await fetch('/api/annotations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contentItemId, billSlug, billTitle, paragraphIndex: sel.paragraphIndex, quote: sel.quote, note: noteDraft }) })
      const d = await res.json()
      if (res.ok && d.annotation) { setAnnotations((a) => [...a, d.annotation]); setSel(null); window.getSelection()?.removeAllRanges() }
    } finally { setSaving(false) }
  }

  async function remove(id: string) {
    await fetch(`/api/annotations/${id}`, { method: 'DELETE' }).catch(() => {})
    setAnnotations((a) => a.filter((x) => x.id !== id)); setActiveNote(null)
  }

  function renderBody(text: string, pidx: number) {
    const anns = annotations.filter((a) => a.paragraph_index === pidx)
    if (!anns.length) return text
    const ranges = anns.map((a) => ({ a, start: text.indexOf(a.quote), len: a.quote.length })).filter((r) => r.start >= 0).sort((x, y) => x.start - y.start)
    const out: React.ReactNode[] = []; let cur = 0
    ranges.forEach((r, i) => {
      if (r.start < cur) return
      if (r.start > cur) out.push(text.slice(cur, r.start))
      out.push(<mark key={i} onClick={() => setActiveNote(activeNote === r.a.id ? null : r.a.id)} title={r.a.note || 'Highlight'} style={{ background: HL, borderBottom: `2px solid ${HL_BORDER}`, borderRadius: 2, cursor: 'pointer', padding: '0 1px' }}>{text.slice(r.start, r.start + r.len)}</mark>)
      cur = r.start + r.len
    })
    out.push(text.slice(cur)); return out
  }

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 18, overflow: 'hidden', marginBottom: 22, background: '#fff', width: open ? 'min(1180px, 96vw)' : '100%', marginLeft: open ? '50%' : 0, transform: open ? 'translateX(-50%)' : 'none', transition: 'width .2s' }}>
      <button onClick={() => setOpen((o) => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '18px 22px', background: '#fff', border: 'none', cursor: 'pointer', fontFamily: MANROPE, textAlign: 'left' }}>
        <FileText style={{ width: 18, height: 18, color: JADE, flexShrink: 0 }} />
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontSize: 16, fontWeight: 800, color: INK }}>Read the full {docType} text</span>
          <span style={{ display: 'block', fontSize: 12.5, color: SECONDARY, marginTop: 1 }}>{canAnnotate ? 'Select any passage to highlight it and add a note.' : 'The official text, in full — with key sections highlighted.'}</span>
        </span>
        {open ? <ChevronUp style={{ width: 18, height: 18, color: TERTIARY }} /> : <ChevronDown style={{ width: 18, height: 18, color: TERTIARY }} />}
      </button>

      {open && (
        <div style={{ borderTop: `1px solid ${BORDER}` }}>
          {/* policy jump + annotate hint */}
          {topicsPresent.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '12px 22px', background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>Policy sections:</span>
              {topicsPresent.map((t) => { const meta = POLICY_TOPICS[t as PolicyTopic]; const Icon = ICONS[meta.icon] || Scale; return <button key={t} onClick={() => scrollTo(topicFirstId[t])} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: MANROPE, fontSize: 12.5, fontWeight: 700, padding: '6px 12px', borderRadius: 999, border: `1px solid ${BORDER}`, background: '#fff', color: INK }}><Icon style={{ width: 13, height: 13, color: JADE }} /> {meta.label}</button> })}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', background: '#fffdf5', borderBottom: `1px solid ${BORDER}`, fontSize: 12, color: '#92400e', fontFamily: MANROPE }}>
            <Highlighter style={{ width: 14, height: 14, color: '#b45309' }} />
            {canAnnotate ? <span>Select any text to <b>highlight it and add a note</b> — saved to your dashboard.</span>
              : user && PREMIUM_ENABLED ? <span>Highlighting &amp; notes are a Premium feature. <Link href="/subscription" style={{ color: '#b45309', fontWeight: 800 }}>Upgrade →</Link></span>
                : <span><Link href="/login" style={{ color: '#b45309', fontWeight: 800 }}>Sign in</Link>{PREMIUM_ENABLED ? ' (Premium)' : ''} to highlight passages and keep notes.</span>}
          </div>

          {/* TOC sidebar + text */}
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            {toc.length >= 3 && (
              <nav style={{ width: 248, flexShrink: 0, borderRight: `1px solid ${BORDER}`, background: '#fcfbf9', maxHeight: 680, overflowY: 'auto', padding: '14px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, padding: '0 8px 10px' }}><List style={{ width: 13, height: 13 }} /> Contents</div>
                {toc.map((h) => (
                  <button key={h.id} onClick={() => scrollTo(h.id)} title={h.label} style={{ display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: MANROPE, fontSize: 12.5, fontWeight: h.sub ? 500 : 700, color: h.sub ? SECONDARY : INK, background: 'none', border: 'none', borderRadius: 8, padding: h.sub ? '6px 8px 6px 20px' : '6px 8px', lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.label}</button>
                ))}
              </nav>
            )}
            <div ref={textRef} onMouseUp={canAnnotate ? onMouseUp : undefined} style={{ flex: 1, minWidth: 0, maxHeight: 680, overflowY: 'auto', padding: '20px 24px 28px', scrollBehavior: 'smooth' }}>
              {paras.map((p, i) => {
                if (p.head) return <div key={i} data-pidx={i} id={p.id} style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '22px 0 8px', scrollMarginTop: 12 }}>{p.text}</div>
                const relevant = p.topics.length > 0
                const noteHere = annotations.find((a) => a.paragraph_index === i && a.id === activeNote)
                return (
                  <div key={i} id={p.id} style={{ padding: relevant ? '10px 14px' : '0', margin: relevant ? '10px 0' : '0 0 12px', borderRadius: relevant ? 10 : 0, background: relevant ? '#f3fbf6' : 'transparent', borderLeft: relevant ? `3px solid ${JADE}` : 'none', scrollMarginTop: 12 }}>
                    {relevant && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>{p.topics.map((t) => { const meta = POLICY_TOPICS[t as PolicyTopic]; return meta ? <span key={t} style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: JADE, background: '#ecfdf5', border: '1px solid #cfe9d8', borderRadius: 999, padding: '1px 8px', fontFamily: MANROPE }}>{meta.label}</span> : null })}</div>}
                    <p data-pidx={i} style={{ fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.7, margin: 0 }}>{renderBody(p.text, i)}</p>
                    {noteHere && (
                      <div style={{ marginTop: 8, padding: '10px 12px', background: '#fffbeb', border: `1px solid ${HL_BORDER}`, borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: '#a16207', fontFamily: MANROPE, marginBottom: 3 }}>Your note</div>
                          <p style={{ fontSize: 13, color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>{noteHere.note || <span style={{ color: TERTIARY, fontStyle: 'italic' }}>(highlight, no note)</span>}</p>
                        </div>
                        <button onClick={() => remove(noteHere.id)} title="Delete highlight" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b42318', display: 'flex', padding: 2 }}><Trash2 style={{ width: 15, height: 15 }} /></button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {sel && canAnnotate && (
        <div style={{ position: 'fixed', top: sel.top, left: sel.left, zIndex: 80, width: 280, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, boxShadow: '0 10px 32px rgba(12,14,18,.18)', padding: 12, fontFamily: MANROPE }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: INK }}><Highlighter style={{ width: 14, height: 14, color: '#b45309' }} /> Highlight</span>
            <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TERTIARY, display: 'flex' }}><X style={{ width: 14, height: 14 }} /></button>
          </div>
          <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} rows={2} placeholder="Add a note (optional)…" style={{ width: '100%', resize: 'vertical', fontFamily: MANROPE, fontSize: 12.5, color: INK, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 9px', outline: 'none', lineHeight: 1.4 }} />
          <button onClick={save} disabled={saving} style={{ marginTop: 8, width: '100%', padding: '8px 0', borderRadius: 9, border: 'none', background: JADE, color: '#fff', fontSize: 13, fontWeight: 800, fontFamily: MANROPE, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Save highlight'}</button>
        </div>
      )}
    </div>
  )
}
