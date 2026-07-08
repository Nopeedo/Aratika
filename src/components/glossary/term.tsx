'use client'

/**
 * Term — wraps an essential political word so that, when "Explain the terms" is
 * on, it gets a dotted underline and a plain-language definition on tap. Reuses
 * the existing glossary (constants/glossary.ts) — nothing new to write — and
 * links to the matching Learn module where one exists.
 *
 * When the mode is off, or the word isn't in the glossary, it renders as plain
 * text. Curate usage to genuinely-essential terms, first occurrence per page.
 *
 *   <Term name="MMP">MMP</Term>
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { GLOSSARY } from '@/constants/glossary'
import { useExplainMode } from '@/hooks/use-explain-mode'

const JADE = '#1F8A4C', INK = '#0c0e12', LINE = '#d8d5cf'

function findEntry(name: string) {
  const n = name.trim().toLowerCase()
  return GLOSSARY.find((g) => {
    const t = g.term.toLowerCase()
    return t === n || t.startsWith(n + ' ') || t.replace(/\s*\(.*\)\s*$/, '') === n
  })
}

export function Term({ name, children }: { name: string; children: React.ReactNode }) {
  const { enabled, ready } = useExplainMode()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const entry = findEntry(name)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  // Plain text before hydration, when off, or for an unknown term.
  if (!ready || !enabled || !entry) return <>{children}</>

  const hoverable = () => typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches

  return (
    <span
      ref={ref}
      style={{ position: 'relative', display: 'inline' }}
      onMouseEnter={() => { if (hoverable()) setOpen(true) }}
      onMouseLeave={() => { if (hoverable()) setOpen(false) }}
    >
      <span
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label={`What is ${entry.term}?`}
        // preventDefault stops the term from following a surrounding link (e.g. a
        // Term inside a card that is itself a Link) — it shows the definition instead.
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o) }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => !o) } }}
        style={{ borderBottom: `1.5px dotted ${JADE}`, cursor: 'help', borderRadius: 3, padding: '0 1px', background: open ? 'rgba(31,138,76,.12)' : 'transparent' }}
      >
        {children}
      </span>
      {open && (
        <span
          role="dialog"
          aria-label={`Definition of ${entry.term}`}
          style={{
            position: 'absolute', top: '100%', left: 0, marginTop: 7, zIndex: 60,
            width: 'max-content', maxWidth: 'min(280px, 78vw)',
            background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12,
            boxShadow: '0 6px 20px rgba(12,14,18,.15)', padding: '12px 14px',
            textAlign: 'left', whiteSpace: 'normal', fontWeight: 400,
            fontFamily: 'var(--font-manrope), system-ui, sans-serif',
          }}
        >
          <span style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: JADE, marginBottom: 4 }}>{entry.term}</span>
          <span style={{ display: 'block', fontSize: 13.5, lineHeight: 1.5, color: INK }}>{entry.def}</span>
          {entry.learn && (
            <Link href={entry.learn.href} style={{ display: 'inline-block', marginTop: 9, fontSize: 13, fontWeight: 700, color: JADE, textDecoration: 'none' }}>
              {entry.learn.label} →
            </Link>
          )}
        </span>
      )}
    </span>
  )
}
