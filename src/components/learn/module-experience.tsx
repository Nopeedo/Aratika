'use client'

/**
 * The learn module experience: difficulty filter → explanation → interactive
 * widgets → quiz → reward. Progress saved to localStorage.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, CheckCircle2, Hand } from 'lucide-react'
import type { LearnModule, LearnTier } from '@/constants/learn-data'
import { TIERS } from '@/constants/learn-data'
import { useLearnProgress } from '@/hooks/use-learn-progress'
import { SeatAllocator } from './seat-allocator'
import { BuildGovernment } from './build-government'
import { BillJourney } from './bill-journey'
import { TwoVotes } from './two-votes'
import { RevealCards } from './reveal-cards'
import { KiwiMascot } from './kiwi-mascot'
import { Quiz } from './quiz'
import { PARLIAMENT_PARTS, COMMITTEE_STEPS, ROLES } from '@/constants/learn-interactives'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const TIER_ACCENT: Record<LearnTier, string> = {
  kids: '#e0529c', beginner: '#1F8A4C', intermediate: '#2563eb', expert: '#7c3aed',
}

export function ModuleExperience({ module }: { module: LearnModule }) {
  const [tier, setTier] = useState<LearnTier>('beginner')
  const { record, progress } = useLearnProgress()

  const content = module.tiers[tier]
  const accent = TIER_ACCENT[tier]
  const kids = tier === 'kids'
  const tierDone = progress[module.id]?.[tier]?.completed

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Tier filter */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 9 }}>
          Choose your level
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
          {TIERS.map((t) => {
            const on = t.key === tier
            const a = TIER_ACCENT[t.key]
            const completed = progress[module.id]?.[t.key]?.completed
            return (
              <button key={t.key} onClick={() => setTier(t.key)}
                style={{
                  position: 'relative', textAlign: 'left', cursor: 'pointer', fontFamily: MANROPE,
                  padding: '11px 14px', borderRadius: 13,
                  border: `1.5px solid ${on ? a : BORDER}`, background: on ? `${a}10` : '#fff',
                  transition: 'all .15s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: on ? a : INK }}>{t.label}</span>
                  {completed && <CheckCircle2 style={{ width: 14, height: 14, color: JADE }} />}
                </div>
                <div style={{ fontSize: 11, color: SECONDARY, marginTop: 1 }}>{t.blurb}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Explanation */}
      <AnimatePresence mode="wait">
        <motion.div key={tier} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
          style={{ display: 'flex', flexDirection: 'column', gap: kids ? 16 : 14 }}>
          {kids && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff7fb', border: '1px solid #f6d4e6', borderRadius: 16, padding: '14px 16px' }}>
              <KiwiMascot size={64} />
              <div style={{ fontFamily: MANROPE }}>
                <div style={{ fontSize: 15.5, fontWeight: 800, color: INK }}>Kia ora! I’m Kiri the Kiwi.</div>
                <div style={{ fontSize: 14, color: '#33373f', lineHeight: 1.5 }}>Let’s learn how it all works together. Tap, slide and have a go — then try the questions!</div>
              </div>
            </div>
          )}
          {content.intro.map((block, i) => (
            <div key={i} style={{
              background: '#fff', border: `1px solid ${BORDER}`, borderLeft: `3px solid ${accent}`,
              borderRadius: 14, padding: kids ? '18px 20px' : '16px 18px',
            }}>
              {block.heading && (
                <h3 style={{ fontSize: kids ? 18 : 15.5, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 6px' }}>{block.heading}</h3>
              )}
              <p style={{ fontSize: kids ? 17 : 15, color: '#33373f', fontFamily: MANROPE, lineHeight: kids ? 1.7 : 1.65, margin: 0 }}>{block.body}</p>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Interactives */}
      {module.interactives.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Hand style={{ width: 17, height: 17, color: accent }} />
            <h2 style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>Try it yourself</h2>
          </div>
          {module.interactives.includes('seat-allocator') && <SeatAllocator />}
          {module.interactives.includes('build-government') && <BuildGovernment />}
          {module.interactives.includes('bill-journey') && <BillJourney />}
          {module.interactives.includes('two-votes') && <TwoVotes />}
          {module.interactives.includes('parliament-parts') && (
            <RevealCards title="How power is organised" subtitle="Tap each part to learn what it does." items={PARLIAMENT_PARTS} accent={accent} />
          )}
          {module.interactives.includes('committee-steps') && (
            <RevealCards title="The public-submission process" subtitle="Tap each step to follow how it works." items={COMMITTEE_STEPS} accent={accent} />
          )}
          {module.interactives.includes('roles-grid') && (
            <RevealCards title="The key roles" subtitle="Tap each role to see what they do." items={ROLES} accent={accent} />
          )}
        </div>
      )}

      {/* Quiz */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles style={{ width: 17, height: 17, color: accent }} />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>Test what you learned</h2>
        </div>
        <Quiz
          key={tier}
          questions={content.quiz}
          accent={accent}
          playful={kids}
          onComplete={(score, total) => record(module.id, tier, score, total)}
        />
      </div>

      {/* Completion */}
      <AnimatePresence>
        {tierDone && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderRadius: 14, background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
            <CheckCircle2 style={{ width: 22, height: 22, color: JADE, flexShrink: 0 }} />
            <div style={{ fontFamily: MANROPE }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#065f46' }}>{TIERS.find((t) => t.key === tier)!.label} level complete!</div>
              <div style={{ fontSize: 12.5, color: '#047857' }}>Try another level, or head back to explore more modules.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
