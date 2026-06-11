'use client'

/**
 * Quiz — one question at a time, instant feedback + explanation, score at the end.
 * Calls onComplete(score, total) when finished.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, ArrowRight, RotateCcw, Trophy } from 'lucide-react'
import type { QuizQuestion } from '@/constants/learn-data'
import { Confetti } from './confetti'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C', RED = '#dc2626'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function Quiz({
  questions, accent, onComplete, playful = false,
}: {
  questions: QuizQuestion[]
  accent: string
  onComplete: (score: number, total: number) => void
  playful?: boolean
}) {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const q = questions[i]
  const answered = picked !== null

  const choose = (idx: number) => {
    if (answered) return
    setPicked(idx)
    if (idx === q.answer) setScore((s) => s + 1)
  }
  const next = () => {
    if (i + 1 < questions.length) {
      setI(i + 1); setPicked(null)
    } else {
      setDone(true); onComplete(score, questions.length)
    }
  }
  const restart = () => { setI(0); setPicked(null); setScore(0); setDone(false) }

  if (done) {
    const pct = Math.round((score / questions.length) * 100)
    const great = pct >= 67
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        style={{ border: `1px solid ${BORDER}`, borderRadius: 20, padding: '34px 24px', textAlign: 'center', background: '#fff' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: great ? '#ecfdf5' : SURFACE, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <Trophy style={{ width: 26, height: 26, color: great ? JADE : TERTIARY }} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{score} / {questions.length}</div>
        <div style={{ fontSize: 14, color: SECONDARY, fontFamily: MANROPE, marginTop: 4 }}>
          {great ? 'Nicely done — you’ve got this!' : 'Good effort — review and try again to ace it.'}
        </div>
        {playful && great && (
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.15 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 14, fontSize: 14, fontWeight: 800, color: '#9a3412', background: '#fff7ed', border: '2px solid #fdba74', borderRadius: 999, padding: '7px 16px', fontFamily: MANROPE }}>
            <span style={{ fontSize: 20 }}>🌟</span> You earned a sticker!
          </motion.div>
        )}
        <button onClick={restart} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 18, fontSize: 13, fontWeight: 700, color: SECONDARY, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontFamily: MANROPE }}>
          <RotateCcw style={{ width: 13, height: 13 }} /> Try again
        </button>
      </motion.div>
    )
  }

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: accent, fontFamily: MANROPE }}>Quick check</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: TERTIARY, fontFamily: MANROPE }}>Question {i + 1} of {questions.length}</span>
      </div>

      <div style={{ padding: 20, position: 'relative' }}>
        {playful && answered && picked === q.answer && <Confetti key={`confetti-${i}`} />}
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 16px', lineHeight: 1.4 }}>{q.q}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {q.options.map((opt, idx) => {
                const isAnswer = idx === q.answer
                const isPicked = idx === picked
                let bg = '#fff', border = BORDER, color = INK, icon = null
                if (answered) {
                  if (isAnswer) { bg = '#ecfdf5'; border = JADE; color = '#065f46'; icon = <Check style={{ width: 16, height: 16, color: JADE }} /> }
                  else if (isPicked) { bg = '#fef2f2'; border = RED; color = '#991b1b'; icon = <X style={{ width: 16, height: 16, color: RED }} /> }
                }
                return (
                  <button key={idx} onClick={() => choose(idx)} disabled={answered}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                      padding: playful ? '16px 18px' : '13px 15px', borderRadius: playful ? 14 : 12,
                      border: `1.5px solid ${border}`, background: bg,
                      cursor: answered ? 'default' : 'pointer', textAlign: 'left', fontFamily: MANROPE,
                      fontSize: playful ? 16 : 14.5, fontWeight: 600, color, transition: 'all .15s',
                    }}>
                    <span>{opt}</span>{icon}
                  </button>
                )
              })}
            </div>

            <AnimatePresence>
              {answered && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}>
                  <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, background: SURFACE, border: `1px solid ${BORDER}`, fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.55 }}>
                    {picked === q.answer ? '✓ ' : ''}{q.explain}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                    <button onClick={next} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, color: '#fff', background: INK, border: 'none', borderRadius: 11, padding: '10px 16px', cursor: 'pointer', fontFamily: MANROPE }}>
                      {i + 1 < questions.length ? 'Next question' : 'See results'} <ArrowRight style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
