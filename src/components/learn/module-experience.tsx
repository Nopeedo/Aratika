'use client'

/**
 * The learn module experience: level → explanation → interactive widgets →
 * quiz. Progress saved to localStorage.
 *
 * Three things changed here, and the reasons are worth keeping:
 *
 * 1. ONE ACCENT (§1.6). The page used to run two colour systems at once: the
 *    module's own hue (learn-theme) on the bar beside the title, and
 *    TIER_ACCENT (pink/green/blue/purple by difficulty) on everything below
 *    it. A block takes the colour of what it is ABOUT, and this page is about
 *    MMP, not about being a beginner. TIER_ACCENT now colours the four tier
 *    pills and nothing else, where the hue is identifying the levels
 *    themselves.
 * 2. THE LEVELS ARE §2.2 PILLS. They were four 13px-radius cards with a title
 *    and a blurb, the blurbs telling the reader what a level meant before they
 *    had met one. One row of the shared `.status-pill`, the blurbs in the (i).
 * 3. NOTHING ARRIVES EXPANDED (§1.1). The lesson opened with every block of
 *    prose already showing, 598px of it at Beginner and around 800px at
 *    Expert, before the reader had scrolled once. The opening block stays
 *    open; every block with a heading of its own arrives closed.
 *
 * Gone with them: the completion banner. It announced a tier as finished at
 * the moment the tier pill above it had already grown its tick and the quiz
 * card was showing the score, which is one fact in three places (§1.3).
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, CheckCircle2, ChevronDown, Hand } from 'lucide-react'
import type { ContentBlock, LearnModule, LearnTier } from '@/constants/learn-data'
import { TIERS } from '@/constants/learn-data'
import { learnTheme } from '@/constants/learn-theme'
import { useLearnProgress } from '@/hooks/use-learn-progress'
import { InfoButton, InfoHeading, InfoText } from '@/components/ui/info-button'
import { SeatAllocator } from './seat-allocator'
import { BuildGovernment } from './build-government'
import { BillStages } from './module-bill-stages'
import { TwoVotes } from './two-votes'
import { RevealCards } from './module-reveal-cards'
import { KiwiMascot } from './kiwi-mascot'
import { Quiz } from './quiz'
import { PARLIAMENT_PARTS, COMMITTEE_STEPS, ROLES } from '@/constants/learn-interactives'
import { BORDER, INK, JADE, MANROPE, tint, TERTIARY } from '@/constants/theme'

/** The four levels, and the only place difficulty carries a colour (§1.6). */
const TIER_ACCENT: Record<LearnTier, string> = {
  kids: '#e0529c', beginner: '#1F8A4C', intermediate: '#2563eb', expert: '#7c3aed',
}

/** §4: headings match their peers. "Choose your level" was a 12px uppercase
 *  label and the two below it were 18px h2s, so one flow read as three
 *  different kinds of thing. All three are the site's 24px section heading now,
 *  the size /bills uses for "All bills this term". */
const SECTION_HEADING = {
  fontSize: 24, fontWeight: 800, letterSpacing: '-.025em' as const,
  color: INK, fontFamily: MANROPE, margin: 0,
}

export function ModuleExperience({ module }: { module: LearnModule }) {
  const [tier, setTier] = useState<LearnTier>('beginner')
  const { record, progress } = useLearnProgress()

  const content = module.tiers[tier]
  const theme = learnTheme(module.id)
  const kids = tier === 'kids'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Levels */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
          <h2 style={SECTION_HEADING}>Choose your level</h2>
          <InfoButton accent={theme.ink} label="What the four levels are" size={24}>
            <InfoHeading accent={theme.ink}>Four depths, one subject</InfoHeading>
            <InfoText>
              Every module is written four times over. The facts do not change between
              levels, the amount of detail does. Switching level swaps the lesson and the
              questions, and keeps whatever you have already finished.
            </InfoText>
            {TIERS.map((t) => (
              <div key={t.key}>
                <InfoHeading accent={theme.ink}>{t.label}</InfoHeading>
                <InfoText>{t.blurb}</InfoText>
              </div>
            ))}
          </InfoButton>
        </div>
        {/* §2.2, with one deliberate divergence recorded: no "All" pill, and
            tapping the lit one does NOT clear it. A level is an exclusive
            choice of which lesson to read, not a filter over a list. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TIERS.map((t) => (
            <TierPill
              key={t.key}
              label={t.label}
              colour={TIER_ACCENT[t.key]}
              on={t.key === tier}
              done={!!progress[module.id]?.[t.key]?.completed}
              onClick={() => setTier(t.key)}
            />
          ))}
        </div>
      </div>

      {/* Explanation. Keyed on the tier so the blocks re-close when the level
          changes: the reader has asked for a different lesson, not for this
          one at a different depth with the same paragraph open. */}
      <AnimatePresence mode="wait">
        <motion.div key={tier} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
          style={{ display: 'flex', flexDirection: 'column', gap: kids ? 14 : 12 }}>
          {kids && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff7fb', border: '1px solid #f6d4e6', borderRadius: 16, padding: '14px 16px' }}>
              <KiwiMascot size={64} />
              <div style={{ fontFamily: MANROPE }}>
                <div style={{ fontSize: 15.5, fontWeight: 800, color: INK }}>Kia ora! I’m Kiri the Kiwi.</div>
                <div style={{ fontSize: 14, color: '#33373f', lineHeight: 1.5 }}>Let’s learn how it all works together. Tap, slide and have a go, then try the questions.</div>
              </div>
            </div>
          )}
          <IntroBlocks blocks={content.intro} accent={theme.ink} kids={kids} />
        </motion.div>
      </AnimatePresence>

      {/* Interactives */}
      {module.interactives.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Hand style={{ width: 19, height: 19, color: theme.ink }} />
            <h2 style={SECTION_HEADING}>Try it yourself</h2>
          </div>
          {module.interactives.includes('seat-allocator') && <SeatAllocator accent={theme.ink} />}
          {module.interactives.includes('build-government') && <BuildGovernment accent={theme.ink} />}
          {module.interactives.includes('bill-journey') && <BillStages accent={theme.ink} />}
          {module.interactives.includes('two-votes') && <TwoVotes accent={theme.ink} />}
          {module.interactives.includes('parliament-parts') && (
            <RevealCards title="How power is organised" items={PARLIAMENT_PARTS} accent={theme.ink} />
          )}
          {module.interactives.includes('committee-steps') && (
            <RevealCards title="The public-submission process" items={COMMITTEE_STEPS} accent={theme.ink} />
          )}
          {module.interactives.includes('roles-grid') && (
            <RevealCards title="The key roles" items={ROLES} accent={theme.ink} />
          )}
        </div>
      )}

      {/* Quiz */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles style={{ width: 19, height: 19, color: theme.ink }} />
          <h2 style={SECTION_HEADING}>Test what you learned</h2>
        </div>
        <Quiz
          key={tier}
          questions={content.quiz}
          accent={theme.ink}
          playful={kids}
          onComplete={(score, total) => record(module.id, tier, score, total)}
        />
      </div>
    </div>
  )
}

/**
 * §3.1: the button is the 44px hit area, the span is the ~28px control.
 * Without the padding/margin pair globals.css inflates every pill on this row
 * to finger height and the row stops looking like a row of pills.
 *
 * §2.2 colours: lit = the level's own light tint with a full-strength border;
 * unlit = white with the same hue at 34%.
 */
function TierPill({ label, colour, on, done, onClick }: {
  label: string
  colour: string
  on: boolean
  done: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      style={{ display: 'inline-flex', padding: '8px 0', margin: '-8px 0', background: 'none', border: 'none', cursor: 'pointer' }}
    >
      <span
        className="status-pill"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999,
          background: on ? tint(colour, 0.1) : '#fff',
          border: `2px solid ${on ? colour : tint(colour, 0.34)}`,
          color: on ? colour : INK, fontFamily: MANROPE, fontWeight: 800,
          whiteSpace: 'nowrap',
          transition: 'background-color .2s ease, border-color .2s ease, color .2s ease',
        }}
      >
        {label}
        {/* The one tick. It used to be here AND in a banner at the foot of the
            page (§1.3); this is the copy that stays, because it is where a
            reader looks to see which levels are left. */}
        {done && <CheckCircle2 aria-label="completed" style={{ width: 13, height: 13, color: JADE }} />}
      </span>
    </button>
  )
}

/**
 * The lesson itself, one block per idea.
 *
 * Not an (i): this text informs, it does not explain how to read the page. But
 * §1.1 still applies to the amount of it that arrives at once, so only the
 * opening block is open. A block with no heading has nothing to be closed
 * behind and is the lesson's first sentence, so it stays open — the deliberate
 * divergence, recorded rather than fudged. Every authored block after the first
 * carries a heading, which is what makes this work: the closed state is a
 * contents list of the lesson.
 *
 * One at a time, like the bills list: opening the third closes the second, so
 * the section cannot grow back into the wall of text it was.
 */
function IntroBlocks({ blocks, accent, kids }: {
  blocks: ContentBlock[]
  accent: string
  kids: boolean
}) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: kids ? 12 : 10 }}>
      {blocks.map((block, i) => {
        const shell = {
          background: '#fff', border: `1px solid ${BORDER}`, borderLeft: `3px solid ${accent}`,
          borderRadius: 14, overflow: 'hidden' as const,
        }

        if (!block.heading) {
          return (
            <div key={i} style={{ ...shell, padding: kids ? '18px 20px' : '16px 18px' }}>
              <p style={{ fontSize: kids ? 17 : 15, color: '#33373f', fontFamily: MANROPE, lineHeight: kids ? 1.7 : 1.65, margin: 0 }}>{block.body}</p>
            </div>
          )
        }

        const isOpen = open === i
        return (
          <div key={i} style={shell}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: kids ? '14px 18px' : '12px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: MANROPE }}
            >
              <span style={{ fontSize: kids ? 18 : 15.5, fontWeight: 800, color: INK }}>{block.heading}</span>
              <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex', flexShrink: 0 }}>
                <ChevronDown style={{ width: 18, height: 18, color: TERTIARY }} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
                  <p style={{ fontSize: kids ? 17 : 15, color: '#33373f', fontFamily: MANROPE, lineHeight: kids ? 1.7 : 1.65, margin: 0, padding: kids ? '0 20px 16px' : '0 18px 14px' }}>{block.body}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
