'use client'

/**
 * PlanWidget — the floating mini-checklist. A progress button docked bottom-right
 * that expands into the user's personalised plan. Steps tick off live as they
 * browse (via PlanTracker), and they can tick/untick manually here too. Follows
 * them on every page so they always know what's next.
 *
 * Hidden until the walkthrough is done, and on /start and /plan (where the full
 * experience already lives).
 */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Compass, ArrowRight, ChevronDown, Crown, PartyPopper } from 'lucide-react'
import { usePreferences } from '@/hooks/use-preferences'
import { usePlanProgress } from '@/hooks/use-plan-progress'
import { buildPlan } from '@/lib/onboarding/recommendations'
import { REC_ICONS } from '@/components/onboarding/rec-icons'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function PlanWidget() {
  const pathname = usePathname()
  const { prefs, loaded } = usePreferences()
  const { isDone, toggle, loaded: progLoaded } = usePlanProgress()
  const [open, setOpen] = useState(false)

  if (!loaded || !progLoaded || !prefs.completed) return null
  if (pathname === '/start' || pathname === '/plan') return null

  const plan = buildPlan(prefs)
  if (plan.length === 0) return null
  const doneCount = plan.filter((r) => isDone(r.href)).length
  const total = plan.length
  const pct = Math.round((doneCount / total) * 100)
  const allDone = doneCount === total
  const next = plan.find((r) => !isDone(r.href)) ?? null

  // progress ring geometry
  const R = 15, C = 2 * Math.PI * R

  return (
    <div style={{ position: 'fixed', left: 20, bottom: 20, zIndex: 60, fontFamily: MANROPE }}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute', bottom: 70, left: 0, width: 360, maxWidth: 'calc(100vw - 40px)',
              background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18,
              boxShadow: '0 16px 48px rgba(12,14,18,.18)', overflow: 'hidden',
            }}
          >
            {/* header */}
            <div style={{ background: 'linear-gradient(150deg,#0f9152,#0c0e12)', padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Compass style={{ width: 15, height: 15, color: '#36e08a' }} />
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#36e08a' }}>Your plan</span>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: 'rgba(255,255,255,.12)', border: 'none', borderRadius: 8, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <ChevronDown style={{ width: 16, height: 16, color: '#fff' }} />
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{allDone ? 'All done 🎉' : `${doneCount} of ${total} done`}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#36e08a' }}>{pct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,.16)', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: '#36e08a', borderRadius: 3, transition: 'width .4s' }} />
              </div>
            </div>

            {/* steps */}
            <div style={{ maxHeight: 320, overflowY: 'auto', padding: '8px' }}>
              {allDone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 10px 12px', color: SECONDARY, fontSize: 12.5, lineHeight: 1.5 }}>
                  <PartyPopper style={{ width: 16, height: 16, color: JADE, flexShrink: 0 }} />
                  You’ve worked through your whole plan. Explore anything again, or retake the walkthrough to refresh it.
                </div>
              )}
              {plan.map((r) => {
                const Icon = REC_ICONS[r.icon] || Compass
                const done = isDone(r.href)
                const isNext = !done && next?.href === r.href
                return (
                  <div key={r.href} style={{
                    display: 'flex', alignItems: 'center', gap: 8, borderRadius: 11, padding: '4px',
                    background: isNext ? '#f6fdf9' : 'transparent', border: `1px solid ${isNext ? '#cfe9d8' : 'transparent'}`, marginBottom: 2,
                  }}>
                    <button onClick={() => toggle(r.href)} aria-label={done ? 'Mark not done' : 'Mark done'} style={{ flexShrink: 0, width: 34, height: 34, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? JADE : '#fff', border: `2px solid ${done ? JADE : '#cbd1d9'}` }}>
                        {done && <Check style={{ width: 13, height: 13, color: '#fff' }} />}
                      </span>
                    </button>
                    <Link href={r.href} onClick={() => setOpen(false)} style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px' }}>
                        <span style={{ width: 28, height: 28, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon style={{ width: 15, height: 15, color: JADE }} />
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: INK, textDecoration: done ? 'line-through' : 'none', textDecorationColor: '#9bc4ab', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</span>
                            {r.premium && <Crown style={{ width: 11, height: 11, color: '#b8901a', flexShrink: 0 }} />}
                          </div>
                          {isNext && <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: JADE }}>Up next</span>}
                        </div>
                        <ArrowRight style={{ width: 14, height: 14, color: TERTIARY, flexShrink: 0 }} />
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>

            {/* footer */}
            <div style={{ borderTop: `1px solid ${BORDER}`, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link href="/plan" onClick={() => setOpen(false)} style={{ fontSize: 12.5, fontWeight: 800, color: JADE, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                View full plan <ArrowRight style={{ width: 13, height: 13 }} />
              </Link>
              <Link href="/start" onClick={() => setOpen(false)} style={{ fontSize: 12, fontWeight: 600, color: TERTIARY, textDecoration: 'none' }}>Retake</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the FAB */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Your plan"
        style={{
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          background: INK, color: '#fff', border: 'none', borderRadius: 999,
          padding: '8px 16px 8px 9px', boxShadow: '0 8px 24px rgba(12,14,18,.22)',
        }}
      >
        <span style={{ position: 'relative', width: 38, height: 38, flexShrink: 0 }}>
          <svg width={38} height={38} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={19} cy={19} r={R} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={4} />
            <circle cx={19} cy={19} r={R} fill="none" stroke="#36e08a" strokeWidth={4} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} style={{ transition: 'stroke-dashoffset .4s' }} />
          </svg>
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {allDone ? <Check style={{ width: 17, height: 17, color: '#36e08a' }} /> : <Compass style={{ width: 16, height: 16, color: '#fff' }} />}
          </span>
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15, paddingRight: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 800 }}>Your plan</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.65)' }}>{allDone ? 'All done' : `${doneCount}/${total} · next step`}</span>
        </span>
      </button>
    </div>
  )
}
