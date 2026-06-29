'use client'

/**
 * PlanView — the persistent "Your Plan" checklist. Regenerated from the saved
 * survey answers (no need to retake it), with steps that tick off automatically
 * as the user visits each page, plus manual tick/untick. This is the home base
 * people return to, so they never have to find /start again.
 */

import Link from 'next/link'
import { Check, Compass, ArrowRight, Crown, RefreshCw, Sparkles } from 'lucide-react'
import { usePreferences } from '@/hooks/use-preferences'
import { usePlanProgress } from '@/hooks/use-plan-progress'
import { buildPlan } from '@/lib/onboarding/recommendations'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import { BILLS_54_TOPIC_COUNTS } from '@/constants/bills-54-summary'
import { REC_ICONS } from '@/components/onboarding/rec-icons'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function PlanView() {
  const { prefs, loaded } = usePreferences()
  const { isDone, toggle, loaded: progLoaded } = usePlanProgress()

  if (!loaded || !progLoaded) {
    return <div style={{ minHeight: 240 }} />
  }

  // Not done the survey yet → invite them in.
  if (!prefs.completed) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <Compass style={{ width: 28, height: 28, color: JADE }} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 10px' }}>You don’t have a plan yet</h1>
        <p style={{ fontSize: 15.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 22px' }}>
          Take the quick walkthrough and Aratika will build you a personalised, tick-as-you-go plan — the issues you care
          about and the parts of the site that help you most.
        </p>
        <Link href="/start" style={primaryLink}><Compass style={ic} /> Take the walkthrough <ArrowRight style={ic} /></Link>
      </div>
    )
  }

  const plan = buildPlan(prefs)
  const doneCount = plan.filter((r) => isDone(r.href)).length
  const pct = plan.length ? Math.round((doneCount / plan.length) * 100) : 0
  const allDone = doneCount === plan.length && plan.length > 0

  const orderedIssues = [...prefs.topIssues, ...prefs.issues.filter((i) => !prefs.topIssues.includes(i))]

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* header + progress */}
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 6px' }}>Your plan</h1>
      <p style={{ fontSize: 15.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 20px', lineHeight: 1.55 }}>
        Built from your answers. Steps tick off as you go — pick up wherever you left off.
      </p>

      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '18px 20px', marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE }}>
            {allDone ? '🎉 You’ve done it all' : `${doneCount} of ${plan.length} done`}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: JADE, fontFamily: MANROPE }}>{pct}%</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: '#eceae5', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: JADE, borderRadius: 4, transition: 'width .4s' }} />
        </div>
      </div>

      {/* checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {plan.map((r) => {
          const Icon = REC_ICONS[r.icon] || Compass
          const done = isDone(r.href)
          return (
            <div key={r.href} style={{
              display: 'flex', alignItems: 'stretch', gap: 0, borderRadius: 14,
              border: `1px solid ${done ? '#cfe9d8' : BORDER}`, background: done ? '#f6fdf9' : '#fff', overflow: 'hidden',
            }}>
              {/* tick toggle */}
              <button onClick={() => toggle(r.href)} aria-label={done ? 'Mark not done' : 'Mark done'} style={{
                flexShrink: 0, width: 52, border: 'none', borderRight: `1px solid ${done ? '#cfe9d8' : BORDER}`,
                background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? JADE : '#fff', border: `2px solid ${done ? JADE : '#cbd1d9'}`,
                }}>
                  {done && <Check style={{ width: 14, height: 14, color: '#fff' }} />}
                </span>
              </button>
              {/* body — links to the page */}
              <Link href={r.href} style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px' }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: done ? '#e3f6ea' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 18, height: 18, color: JADE }} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 800, color: INK, fontFamily: MANROPE, textDecoration: done ? 'line-through' : 'none', textDecorationColor: '#9bc4ab' }}>{r.title}</span>
                      {r.premium && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 800, color: '#9a7a00', background: '#fdf6dc', border: '1px solid #f1e3a8', borderRadius: 999, padding: '2px 7px', fontFamily: MANROPE }}><Crown style={{ width: 10, height: 10 }} /> Premium</span>}
                    </div>
                    <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.45, margin: '2px 0 0' }}>{r.reason}</p>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 800, color: done ? TERTIARY : JADE, fontFamily: MANROPE, flexShrink: 0 }}>
                    {done ? 'Revisit' : 'Open'} <ArrowRight style={{ width: 13, height: 13 }} />
                  </span>
                </div>
              </Link>
            </div>
          )
        })}
      </div>

      {/* their issues */}
      {orderedIssues.length > 0 && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 18px', marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 11 }}>Where parties stand on your issues</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {orderedIssues.map((key, i) => {
              const t = POLICY_TOPICS[key]
              const ranked = i < prefs.topIssues.length
              return (
                <Link key={key} href={`/policies/${key}`} style={{ textDecoration: 'none' }}>
                  <span className="party-card" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 999, border: `1px solid ${ranked ? '#bbf0d0' : BORDER}`, background: ranked ? '#f6fdf9' : '#fff', fontSize: 13, fontWeight: 700, color: INK, fontFamily: MANROPE }}>
                    {ranked && <span style={{ fontSize: 11, fontWeight: 800, color: JADE }}>#{i + 1}</span>}
                    {t.label}
                    <ArrowRight style={{ width: 12, height: 12, color: TERTIARY }} />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* what's been legislated on your issues */}
      {orderedIssues.length > 0 && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 18px', marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 11 }}>What’s been legislated on your issues</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {orderedIssues.slice(0, 3).map((key) => {
              const t = POLICY_TOPICS[key]; const c = BILLS_54_TOPIC_COUNTS[key]
              if (!t || !c) return null
              return (
                <Link key={key} href={`/policies/${key}`} style={{ textDecoration: 'none' }}>
                  <div className="party-card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10 }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: INK, fontFamily: MANROPE }}>{t.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, whiteSpace: 'nowrap' }}>
                      <b style={{ color: '#166638' }}>{c.passed}</b> passed · {c.active} in progress
                    </span>
                    <ArrowRight style={{ width: 13, height: 13, color: TERTIARY, flexShrink: 0 }} />
                  </div>
                </Link>
              )
            })}
          </div>
          <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '10px 0 0' }}>
            What this Parliament has actually done on your issues — the record beside the promises.
          </p>
        </div>
      )}

      {/* retake */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 4 }}>
        <Sparkles style={{ width: 14, height: 14, color: TERTIARY }} />
        <span style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE }}>Things changed?</span>
        <Link href="/start" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
          <RefreshCw style={{ width: 13, height: 13 }} /> Retake the walkthrough
        </Link>
      </div>
    </div>
  )
}

const ic: React.CSSProperties = { width: 16, height: 16 }
const primaryLink: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14.5, fontWeight: 800, fontFamily: MANROPE, padding: '12px 22px', borderRadius: 12, background: JADE, color: '#fff', textDecoration: 'none' }
