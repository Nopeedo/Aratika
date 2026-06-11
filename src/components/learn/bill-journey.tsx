'use client'

/**
 * Bill Journey — an animated stepper that walks a bill through the stages of
 * Parliament. The bill token slides between stages (shared-layout animation);
 * each stage shows a plain-language explanation.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, ScrollText, CheckCircle2, Stamp } from 'lucide-react'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

interface Stage { label: string; detail: string }

const STAGES: Stage[] = [
  { label: 'First Reading',          detail: 'The bill is introduced and MPs debate its general principles. A vote decides whether it proceeds.' },
  { label: 'Select Committee',       detail: 'A select committee studies the bill in detail and invites public submissions, then reports back with recommended changes.' },
  { label: 'Second Reading',         detail: 'MPs debate the bill and the committee’s recommendations. This is a key vote on the bill’s principles.' },
  { label: 'Committee of the House', detail: 'The whole House examines the bill part by part and can make detailed amendments.' },
  { label: 'Third Reading',          detail: 'The final debate and vote on the bill in its final form.' },
  { label: 'Royal Assent',           detail: 'The Governor-General signs the bill into law. It is now an Act of Parliament — the law of New Zealand.' },
]

export function BillJourney() {
  const [active, setActive] = useState(0)
  const atEnd = active === STAGES.length - 1
  const pct = (active / (STAGES.length - 1)) * 100

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden', background: '#fff' }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE }}>A Bill’s Journey</div>
        <div style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE }}>Step through each stage — click a stage or use the buttons.</div>
      </div>

      <div style={{ padding: '26px 18px 20px' }}>
        {/* Track */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', marginBottom: 22 }}>
          {/* base line */}
          <div style={{ position: 'absolute', top: 17, left: 16, right: 16, height: 3, background: '#eceae5', borderRadius: 2 }} />
          {/* progress line */}
          <motion.div
            animate={{ width: `calc(${pct}% - ${(pct / 100) * 32}px)` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            style={{ position: 'absolute', top: 17, left: 16, height: 3, background: JADE, borderRadius: 2 }}
          />
          {STAGES.map((s, i) => {
            const done = i < active
            const current = i === active
            return (
              <button key={i} onClick={() => setActive(i)}
                style={{ position: 'relative', zIndex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: `${100 / STAGES.length}%`, padding: 0 }}>
                <div style={{ position: 'relative' }}>
                  {current && (
                    <motion.div layoutId="bill-token"
                      style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', background: INK, borderRadius: 8, padding: '3px 5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ScrollText style={{ width: 13, height: 13, color: '#fff' }} />
                    </motion.div>
                  )}
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? JADE : current ? INK : '#fff',
                    border: `2px solid ${done ? JADE : current ? INK : '#d8d6d0'}`,
                    color: done || current ? '#fff' : TERTIARY, fontWeight: 800, fontSize: 13, fontFamily: MANROPE,
                    transition: 'all .2s',
                  }}>
                    {done ? <CheckCircle2 style={{ width: 16, height: 16 }} /> : i === 5 ? <Stamp style={{ width: 15, height: 15 }} /> : i + 1}
                  </div>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: current ? 800 : 600, color: current ? INK : TERTIARY, fontFamily: MANROPE, textAlign: 'center', lineHeight: 1.25, maxWidth: 78 }}>
                  {s.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Detail */}
        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
            style={{ background: atEnd ? '#ecfdf5' : SURFACE, border: `1px solid ${atEnd ? '#a7f3d0' : BORDER}`, borderRadius: 14, padding: '16px 18px', minHeight: 90 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: atEnd ? JADE : SECONDARY, fontFamily: MANROPE }}>
                Stage {active + 1} of {STAGES.length}
              </span>
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: atEnd ? '#065f46' : INK, fontFamily: MANROPE, margin: '0 0 5px' }}>{STAGES[active].label}</h3>
            <p style={{ fontSize: 14, color: atEnd ? '#047857' : '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>{STAGES[active].detail}</p>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
          <button onClick={() => setActive((a) => Math.max(0, a - 1))} disabled={active === 0}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, fontFamily: MANROPE, padding: '9px 14px', borderRadius: 11, border: `1px solid ${BORDER}`, background: '#fff', color: active === 0 ? TERTIARY : SECONDARY, cursor: active === 0 ? 'default' : 'pointer', opacity: active === 0 ? 0.5 : 1 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> Back
          </button>
          <button onClick={() => setActive((a) => Math.min(STAGES.length - 1, a + 1))} disabled={atEnd}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, fontFamily: MANROPE, padding: '9px 16px', borderRadius: 11, border: 'none', background: atEnd ? '#d8d6d0' : INK, color: '#fff', cursor: atEnd ? 'default' : 'pointer' }}>
            {atEnd ? 'It’s now law!' : 'Next stage'} {!atEnd && <ArrowRight style={{ width: 14, height: 14 }} />}
          </button>
        </div>
      </div>
    </div>
  )
}
