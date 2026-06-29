'use client'

/**
 * HomePlanBanner — shown on the homepage once someone has done the walkthrough.
 * Greets them with their progress and the next step, so they pick up where they
 * left off without hunting for it. Renders nothing for first-time visitors (the
 * "Where do you want to start?" doors handle those).
 */

import Link from 'next/link'
import { Compass, ArrowRight, Check } from 'lucide-react'
import { usePreferences } from '@/hooks/use-preferences'
import { usePlanProgress } from '@/hooks/use-plan-progress'
import { buildPlan } from '@/lib/onboarding/recommendations'
import { REC_ICONS } from '@/components/onboarding/rec-icons'

const INK = '#0c0e12', SECONDARY = '#6b7078', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function HomePlanBanner() {
  const { prefs, loaded } = usePreferences()
  const { isDone, loaded: progLoaded } = usePlanProgress()

  if (!loaded || !progLoaded || !prefs.completed) return null

  const plan = buildPlan(prefs)
  if (plan.length === 0) return null
  const doneCount = plan.filter((r) => isDone(r.href)).length
  const pct = Math.round((doneCount / plan.length) * 100)
  const next = plan.find((r) => !isDone(r.href)) ?? null
  const allDone = !next
  const NextIcon = next ? (REC_ICONS[next.icon] || Compass) : Check

  return (
    <section style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 36px' }}>
        <div className="party-card" style={{ background: 'linear-gradient(150deg,#0f9152,#0c0e12)', borderRadius: 20, padding: '24px 26px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Compass style={{ width: 15, height: 15, color: '#36e08a' }} />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#36e08a', fontFamily: MANROPE }}>Your plan</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: MANROPE, marginBottom: 10 }}>
              {allDone ? 'You’ve worked through your whole plan 🎉' : next?.title}
            </div>
            {!allDone && next && (
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.8)', fontFamily: MANROPE, lineHeight: 1.5, margin: '0 0 14px', maxWidth: 540 }}>{next.reason}</p>
            )}
            {/* progress */}
            <div style={{ maxWidth: 320 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.7)', fontFamily: MANROPE }}>{doneCount} of {plan.length} done</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#36e08a', fontFamily: MANROPE }}>{pct}%</span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,.15)', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: '#36e08a', borderRadius: 4, transition: 'width .4s' }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
            {!allDone && next && (
              <Link href={next.href} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 20px', borderRadius: 11, background: '#fff', color: INK, fontSize: 14, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none' }}>
                <NextIcon style={{ width: 16, height: 16 }} /> Continue <ArrowRight style={{ width: 15, height: 15 }} />
              </Link>
            )}
            <Link href="/plan" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 20px', borderRadius: 11, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.16)', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: MANROPE, textDecoration: 'none' }}>
              View full plan
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
