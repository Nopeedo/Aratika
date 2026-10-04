/**
 * CompassCta — the homepage entry card for the personal compass.
 *
 * It shows a real question instead of describing the survey. Every other
 * section on this page tells you what it is; this one lets you read the actual
 * thing you are being asked, which is the question people want answered before
 * they start a survey ("what am I signing up for"). It also fixes a §1.5 gap
 * the earlier card had: it promised "see where you line up" without ever
 * showing what that meant.
 *
 * The statement and the scale are READ FROM THE DATA, not retyped. Reword a
 * statement in compass.ts and this card follows; retyping it here would give us
 * two copies of one fact to drift apart (§1.3).
 *
 * Two things deliberately not done:
 *
 * No "Question 1 of 12". The statements are not first — compass-quiz.tsx runs
 * intro, goals, voting, level, THEN the eight statements, then learning style,
 * so this one is question four. Numbering it 1 would be false, and §1.8 applies
 * to the furniture as much as to the figures.
 *
 * No pre-selected answer. The mock highlighted "Strongly agree" because it
 * looked better, but a highlighted option on "taxes should be lower" reads as
 * the site's own position on tax. On a non-partisan site that is the single
 * worst thing this card could accidentally say, so every option is neutral.
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { COMPASS_STATEMENTS, LIKERT_SCALE } from '@/constants/compass'
import { BORDER, CARD_SHADOW, INK, JADE, MANROPE, PAPER, SECONDARY, SURFACE } from '@/constants/theme'

export function CompassCta() {
  const sample = COMPASS_STATEMENTS[0]
  // Total answer steps: goals, voting, level, the statements, learning style.
  const steps = 3 + COMPASS_STATEMENTS.length + 1
  const remaining = steps - 1

  return (
    // Transparent, like every homepage section: HomeBackground paints one
    // continuous weave and a section that fills its own white cuts a band
    // through it. Same convention as PolicyHubGrid.
    <section style={{ background: 'transparent', overflowX: 'hidden' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '8px clamp(18px, 5vw, 36px) 56px' }}>
        <div
          style={{
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 20,
            boxShadow: CARD_SHADOW,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: 'clamp(24px, 5vw, 32px) clamp(20px, 5vw, 32px) clamp(20px, 4vw, 24px)' }}>
            <span
              style={{
                fontSize: 13, fontWeight: 800, letterSpacing: '.14em',
                color: JADE, fontFamily: MANROPE,
              }}
            >
              ONE OF THE TWELVE
            </span>

            <p
              style={{
                fontSize: 'clamp(18px, 3.2vw, 22px)', fontWeight: 800, color: INK,
                fontFamily: MANROPE, lineHeight: 1.35, margin: '12px 0 0', maxWidth: 600,
              }}
            >
              {sample.text}
            </p>

            {/* The real scale, every option equal. No selected state — see the
                note at the top of this file. */}
            <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
              {LIKERT_SCALE.map((o) => (
                <span
                  key={o.value}
                  style={{
                    padding: '9px 15px', borderRadius: 999, border: `1px solid ${BORDER}`,
                    background: '#fff', color: SECONDARY, fontSize: 13.5, fontWeight: 700,
                    fontFamily: MANROPE, whiteSpace: 'nowrap',
                  }}
                >
                  {o.short}
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              background: PAPER, borderTop: `1px solid ${BORDER}`,
              padding: 'clamp(16px, 3vw, 18px) clamp(20px, 5vw, 32px)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 16, flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 14.5, fontWeight: 600, color: SECONDARY, fontFamily: MANROPE }}>
              {remaining} more, then see where you line up. No score, no winner.
            </span>
            <Link
              href="/start"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44,
                padding: '12px 22px', borderRadius: 13, background: JADE, color: '#fff',
                fontSize: 15.5, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none',
              }}
            >
              Take the survey <ArrowRight style={{ width: 17, height: 17 }} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
