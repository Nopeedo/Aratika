'use client'

/**
 * BillStages — the teaching wrapper around the §2.5 journey strip.
 *
 * It replaces src/components/learn/bill-journey.tsx, which was a SECOND
 * implementation of that strip: beads on a rail that fills, 34px circles
 * against 24px beads, a framer-motion spring against one eased progress, and a
 * different rule for deciding when a bead was lit (`i < active` against
 * `p >= i / (n - 1)`). §2.5 records that exact story once already, on /bills,
 * and ends "this is the one that stayed". On Learn there were two again, and
 * the version that had lost the argument was the one shipping.
 *
 * So the strip is now `Journey` from '@/components/bills/bill-journey', driven
 * through its `progress` prop. Everything this widget has that /bills does not
 * — the stage descriptions, the Back and Next controls, jumping to a stage — is
 * a WRAPPER around the strip rather than a different strip, which is §1.4's
 * "extra data is allowed, extra design is not".
 *
 * Renamed rather than edited in place: two files called bill-journey.tsx in one
 * tree is how the duplicate happened, and §7 records the same trap for the
 * orphaned party-tile.tsx.
 *
 * LABELS. The old strip carried "First Reading", "Select Committee", "Second
 * Reading", "Committee of the House", "Third Reading", "Royal Assent" — which
 * §2.5 names, word for word, as the version that wrapped two lines each and
 * made the strip run deeper than the text above it. At 375px each of six
 * labels gets about 50px, so "Committee of the House" came out three lines
 * deep. The bead now carries the short label and the panel heading carries the
 * full name, so nothing is taught less and nothing wraps.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Journey, type JourneyNode } from '@/components/bills/bill-journey'
import { InfoHeading, InfoText } from '@/components/ui/info-button'
import { WidgetHeader } from './module-widget-header'
import { BORDER, INK, JADE, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

interface Stage {
  /** On the bead. §2.5: short, max-width 8ch on a phone. */
  short: string
  /** In the panel heading, where there is a line to hold it. */
  name: string
  detail: string
}

const STAGES: Stage[] = [
  { short: '1st',       name: 'First reading',                 detail: 'The bill is introduced and MPs debate its general principles. A vote decides whether it proceeds.' },
  { short: 'Committee', name: 'Select committee',              detail: 'A select committee studies the bill in detail and invites public submissions, then reports back with recommended changes.' },
  { short: '2nd',       name: 'Second reading',                detail: 'MPs debate the bill and the committee’s recommendations. This is a key vote on the bill’s principles.' },
  { short: 'Detail',    name: 'Committee of the whole House',  detail: 'The whole House examines the bill part by part and can make detailed amendments.' },
  { short: '3rd',       name: 'Third reading',                 detail: 'The final debate and vote on the bill in its final form.' },
  // "Royal assent", not "Royal Assent": the lesson text beside it spells it
  // lower case, and one term in two spellings on one page is §1.3 in miniature.
  { short: 'Signed',    name: 'Royal assent',                  detail: 'The Governor-General signs the bill into law. It is now an Act of Parliament, and the law of New Zealand.' },
]

const LAST = STAGES.length - 1

export function BillStages({ accent }: { accent: string }) {
  const [active, setActive] = useState(0)
  const atEnd = active === LAST

  // The caller owns the number, so the rail and the beads cannot disagree:
  // the shared strip derives a lit bead from the same progress that fills the
  // rail (§2.5). Stepping to stage 3 of 6 fills exactly three fifths of it.
  const progress = active / LAST
  const nodes: JourneyNode[] = STAGES.map((s) => ({ label: s.short, state: 'done' }))

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 20, background: '#fff' }}>
      <WidgetHeader title="A bill’s journey" accent={accent} infoLabel="How a bill moves through Parliament">
        <InfoHeading accent={accent}>What you are looking at</InfoHeading>
        <InfoText>
          The six stages every public bill passes through, in order. Tap a stage, or step
          through them with Back and Next.
        </InfoText>
        <InfoHeading accent={accent}>Not every bill finishes</InfoHeading>
        <InfoText>
          The House votes at the first, second and third readings. A bill that loses one of
          those votes goes no further, so most of these stages are a decision rather than a
          formality.
        </InfoText>
        <InfoHeading accent={accent}>Where this comes from</InfoHeading>
        <InfoText>
          Parliament’s own description of how a bill becomes law (parliament.nz). The same
          six stages drive the strip on Politika’s bills tracker.
        </InfoText>
      </WidgetHeader>

      <div style={{ padding: 'clamp(14px, 2.5vw, 20px) clamp(14px, 2.5vw, 18px) 16px' }}>
        {/* §2.4's label, ahead of §2.4's strip. */}
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 12 }}>
          Its journey through Parliament
        </div>

        {/* The shared strip, with a row of transparent hit areas laid over it.
            `Journey` draws the beads; it does not select one, and it is not
            this page's file to change. The overlay mirrors its layout exactly
            (flex, gap 4, flex: 1 per node), so each button sits over its own
            bead and label. A hit area, not a second control (§1.3). */}
        <div style={{ position: 'relative' }}>
          <Journey nodes={nodes} progress={progress} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', gap: 4, zIndex: 3 }}>
            {STAGES.map((s, i) => (
              <button
                key={s.short}
                onClick={() => setActive(i)}
                aria-label={`Stage ${i + 1}, ${s.name}`}
                aria-current={i === active ? 'step' : undefined}
                style={{ flex: 1, height: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              />
            ))}
          </div>
        </div>

        {/* The stage the reader chose, in §2.4's panel: the container, the
            radius, the shadow, and the order badge → title → explanation.
            It sits BELOW the strip for §2.4's own reason — the panel opens
            directly beneath the thing that was tapped. No close ×: on /bills
            the × returns the reader to the closed grid, and there is no closed
            state here. A stage is always showing. */}
        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
            style={{
              marginTop: 18, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16,
              padding: 'clamp(14px, 2.5vw, 20px)',
              boxShadow: '0 1px 2px rgba(0,0,0,.03), 0 20px 40px -34px rgba(0,0,0,.4)',
            }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '3px 9px', fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: MANROPE, color: atEnd ? JADE : SECONDARY, background: atEnd ? '#ecfdf5' : '#f4f2ec' }}>
              Stage {active + 1} of {STAGES.length}
            </span>
            <h3 style={{ fontSize: 'clamp(17px, 2.6vw, 21px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '9px 0 7px', lineHeight: 1.2 }}>
              {STAGES[active].name}
            </h3>
            <p style={{ fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>{STAGES[active].detail}</p>
          </motion.div>
        </AnimatePresence>

        {/* Left at finger height on purpose. §3.1's pattern is for a quiet
            control that came out 44px by accident; these two are the widget's
            primary controls and 44 is the right size for them. */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 14 }}>
          <button onClick={() => setActive((a) => Math.max(0, a - 1))} disabled={active === 0}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, fontFamily: MANROPE, padding: '9px 14px', borderRadius: 11, border: `1px solid ${BORDER}`, background: '#fff', color: active === 0 ? TERTIARY : SECONDARY, cursor: active === 0 ? 'default' : 'pointer', opacity: active === 0 ? 0.5 : 1 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> Back
          </button>
          <button onClick={() => setActive((a) => Math.min(LAST, a + 1))} disabled={atEnd}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, fontFamily: MANROPE, padding: '9px 16px', borderRadius: 11, border: 'none', background: atEnd ? '#d8d6d0' : INK, color: '#fff', cursor: atEnd ? 'default' : 'pointer' }}>
            {atEnd ? 'It’s now law' : 'Next stage'} {!atEnd && <ArrowRight style={{ width: 14, height: 14 }} />}
          </button>
        </div>
      </div>
    </div>
  )
}
