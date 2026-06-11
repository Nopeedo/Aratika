'use client'

/**
 * RevealCards — a grid of clickable cards that expand to reveal an explanation.
 * Reused across modules (parts of Parliament, committee steps, who-does-what).
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, Crown, Users, Briefcase, Scale, FileInput, Megaphone, Ear,
  FileCheck, Search, Star, Swords, Gavel,
} from 'lucide-react'
import type { RevealItem } from '@/constants/learn-interactives'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const ICONS: Record<string, React.ElementType> = {
  Crown, Users, Briefcase, Scale, FileInput, Megaphone, Ear, FileCheck, Search, Star, Swords, Gavel,
}

export function RevealCards({ title, subtitle, items, accent }: {
  title: string
  subtitle: string
  items: RevealItem[]
  accent: string
}) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden', background: '#fff' }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{title}</div>
        <div style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE }}>{subtitle}</div>
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => {
          const isOpen = open === i
          const Icon = ICONS[item.icon] || Users
          return (
            <div key={i} style={{ border: `1.5px solid ${isOpen ? accent : BORDER}`, borderRadius: 13, overflow: 'hidden', background: isOpen ? `${accent}08` : '#fff', transition: 'border-color .15s, background .15s' }}>
              <button onClick={() => setOpen(isOpen ? null : i)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: MANROPE }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: isOpen ? accent : '#f1efea', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}>
                  <Icon style={{ width: 17, height: 17, color: isOpen ? '#fff' : SECONDARY }} />
                </span>
                <span style={{ flex: 1, fontSize: 14.5, fontWeight: 800, color: INK }}>{item.label}</span>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex' }}>
                  <ChevronDown style={{ width: 17, height: 17, color: TERTIARY }} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
                    <p style={{ fontSize: 14, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: 0, padding: '0 16px 15px 61px' }}>{item.body}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
