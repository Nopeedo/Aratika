'use client'

/**
 * QuickGuide — the skippable "help me get started" on-ramp for people who don't
 * usually vote. Three low-text, tap-driven questions (issues → vote-readiness →
 * depth) that end in a calm, concrete starting point: where parties stand on the
 * issues you picked, whether you're enrolled, and your local seat. It never
 * declares a "winner" — it points, it doesn't advise. The deep 12-question
 * compass at /start remains for people who want to go further.
 */

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Check, Vote, MapPin, Scale, Compass, RotateCcw } from 'lucide-react'
import { POLICY_TOPICS, POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import type { PolicyTopic } from '@/types'
import { BORDER, INK, JADE, JADE_DARK, MANROPE, SURFACE, TERTIARY } from '@/constants/theme'

const SUB = '#5b6067'

const ENROL_URL = 'https://vote.nz/enrolling/enrol-or-update/'
const MAX_ISSUES = 4
const STORAGE_KEY = 'arapono.guide.v1'

type Readiness = 'enrolled' | 'not-yet' | 'unsure'
type Depth = 'basics' | 'compare'

export function QuickGuide() {
  const router = useRouter()
  const [step, setStep] = React.useState(0) // 0..2 questions, 3 = result
  const [issues, setIssues] = React.useState<PolicyTopic[]>([])
  const [readiness, setReadiness] = React.useState<Readiness | null>(null)
  const [depth, setDepth] = React.useState<Depth | null>(null)

  // Restore a previous run so returning visitors don't start from scratch.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const s = JSON.parse(raw)
      if (Array.isArray(s.issues)) setIssues(s.issues.filter((i: string) => i in POLICY_TOPICS))
      if (s.readiness) setReadiness(s.readiness)
      if (s.depth) setDepth(s.depth)
    } catch { /* ignore malformed state */ }
  }, [])

  // Persist on the result screen so the homepage can pick this up later.
  React.useEffect(() => {
    if (step !== 3) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ issues, readiness, depth })) } catch { /* quota / private mode */ }
  }, [step, issues, readiness, depth])

  const toggleIssue = (t: PolicyTopic) =>
    setIssues((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : cur.length >= MAX_ISSUES ? cur : [...cur, t]))

  const canNext = step === 0 ? issues.length > 0 : step === 1 ? readiness !== null : depth !== null
  const next = () => setStep((s) => Math.min(3, s + 1))
  const back = () => setStep((s) => Math.max(0, s - 1))
  const restart = () => { setStep(0); setIssues([]); setReadiness(null); setDepth(null) }

  return (
    <div style={{ fontFamily: MANROPE, color: INK }}>
      {/* Progress / skip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 9, background: JADE }}>
            <Compass style={{ width: 17, height: 17, color: '#fff' }} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: SUB }}>
            {step < 3 ? `Question ${step + 1} of 3` : 'Your starting point'}
          </span>
        </div>
        {step < 3 && (
          <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: TERTIARY, textDecoration: 'none' }}>
            Skip — I&rsquo;ll look around myself
          </Link>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ height: 5, borderRadius: 999, background: SURFACE, border: `1px solid ${BORDER}`, marginBottom: 30, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${((Math.min(step, 3)) / 3) * 100}%`, background: JADE, borderRadius: 999, transition: 'width .3s ease' }} />
      </div>

      {/* ── Step 0 — issues ── */}
      {step === 0 && (
        <div>
          <h1 style={{ fontSize: 'clamp(24px,4vw,30px)', fontWeight: 800, letterSpacing: '-.02em', margin: '0 0 6px' }}>What&rsquo;s on your mind?</h1>
          <p style={{ fontSize: 15.5, color: SUB, lineHeight: 1.5, margin: '0 0 22px' }}>
            Pick a few things you care about. We&rsquo;ll show you where the parties actually stand — no jargon, no spin.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(150px, 100%), 1fr))', gap: 10 }}>
            {POLICY_TOPIC_ORDER.map((t) => {
              const on = issues.includes(t)
              const disabled = !on && issues.length >= MAX_ISSUES
              return (
                <button key={t} onClick={() => toggleIssue(t)} disabled={disabled}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', cursor: disabled ? 'not-allowed' : 'pointer',
                    padding: '13px 14px', borderRadius: 12, fontFamily: MANROPE,
                    border: `1.5px solid ${on ? JADE : BORDER}`, background: on ? JADE : '#fff',
                    color: on ? '#fff' : disabled ? TERTIARY : INK, opacity: disabled ? 0.55 : 1, transition: 'all .15s ease',
                  }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: `1.5px solid ${on ? '#fff' : BORDER}`, background: on ? 'rgba(255,255,255,.2)' : '#fff' }}>
                    {on && <Check style={{ width: 13, height: 13, color: '#fff' }} />}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{POLICY_TOPICS[t].label}</span>
                </button>
              )
            })}
          </div>
          <p style={{ fontSize: 12.5, color: TERTIARY, margin: '14px 0 0' }}>
            {issues.length}/{MAX_ISSUES} picked{issues.length >= MAX_ISSUES ? ' — that&rsquo;s plenty to start' : ''}
          </p>
        </div>
      )}

      {/* ── Step 1 — readiness ── */}
      {step === 1 && (
        <div>
          <h1 style={{ fontSize: 'clamp(24px,4vw,30px)', fontWeight: 800, letterSpacing: '-.02em', margin: '0 0 6px' }}>Are you enrolled to vote?</h1>
          <p style={{ fontSize: 15.5, color: SUB, lineHeight: 1.5, margin: '0 0 22px' }}>
            No wrong answer — this just tells us whether to help you sort that out first.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {([['enrolled', 'Yes, I’m enrolled'], ['not-yet', 'Not yet'], ['unsure', 'I’m not sure']] as [Readiness, string][]).map(([val, label]) => {
              const on = readiness === val
              return (
                <button key={val} onClick={() => setReadiness(val)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', padding: '15px 16px', borderRadius: 12, fontFamily: MANROPE, border: `1.5px solid ${on ? JADE : BORDER}`, background: on ? '#f2fbf6' : '#fff', color: INK, transition: 'all .15s ease' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', flexShrink: 0, border: `2px solid ${on ? JADE : BORDER}`, background: on ? JADE : '#fff' }}>
                    {on && <Check style={{ width: 13, height: 13, color: '#fff' }} />}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Step 2 — depth ── */}
      {step === 2 && (
        <div>
          <h1 style={{ fontSize: 'clamp(24px,4vw,30px)', fontWeight: 800, letterSpacing: '-.02em', margin: '0 0 6px' }}>How deep do you want to go?</h1>
          <p style={{ fontSize: 15.5, color: SUB, lineHeight: 1.5, margin: '0 0 22px' }}>
            You can change your mind any time — this just sets where we point you next.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {([['basics', 'Just the basics', 'A quick starting point I can act on today.'], ['compare', 'I want to compare properly', 'Take me deeper — the full picture across every party.']] as [Depth, string, string][]).map(([val, label, desc]) => {
              const on = depth === val
              return (
                <button key={val} onClick={() => setDepth(val)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left', cursor: 'pointer', padding: '15px 16px', borderRadius: 12, fontFamily: MANROPE, border: `1.5px solid ${on ? JADE : BORDER}`, background: on ? '#f2fbf6' : '#fff', color: INK, transition: 'all .15s ease' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1, border: `2px solid ${on ? JADE : BORDER}`, background: on ? JADE : '#fff' }}>
                    {on && <Check style={{ width: 13, height: 13, color: '#fff' }} />}
                  </span>
                  <span>
                    <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{label}</span>
                    <span style={{ display: 'block', fontSize: 13, color: SUB, marginTop: 2 }}>{desc}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Step 3 — result ── */}
      {step === 3 && (
        <Result issues={issues} readiness={readiness} depth={depth} onRestart={restart} />
      )}

      {/* Nav buttons (hidden on result) */}
      {step < 3 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 30 }}>
          <button onClick={back} disabled={step === 0}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: step === 0 ? 'default' : 'pointer', fontFamily: MANROPE, fontSize: 14, fontWeight: 700, color: step === 0 ? 'transparent' : SUB }}>
            <ArrowLeft style={{ width: 15, height: 15 }} /> Back
          </button>
          <button onClick={next} disabled={!canNext}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '12px 22px', borderRadius: 12, border: 'none', cursor: canNext ? 'pointer' : 'not-allowed', fontFamily: MANROPE, fontSize: 15, fontWeight: 800, color: '#fff', background: canNext ? INK : '#c9ccd1', transition: 'background .15s ease' }}>
            {step === 2 ? 'See my starting point' : 'Next'} <ArrowRight style={{ width: 16, height: 16 }} />
          </button>
        </div>
      )}
    </div>
  )
}

function Result({ issues, readiness, depth, onRestart }: { issues: PolicyTopic[]; readiness: Readiness | null; depth: Depth | null; onRestart: () => void }) {
  return (
    <div>
      <h1 style={{ fontSize: 'clamp(25px,4.4vw,32px)', fontWeight: 800, letterSpacing: '-.02em', margin: '0 0 6px' }}>Here&rsquo;s your starting point</h1>
      <p style={{ fontSize: 15.5, color: SUB, lineHeight: 1.5, margin: '0 0 24px' }}>
        Three quick things, built from your answers. Take them one at a time — no rush.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* 1 — issues */}
        <Card icon={<Scale style={{ width: 18, height: 18, color: JADE }} />} title="Where parties stand on what you care about">
          {issues.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {issues.map((t) => (
                <Link key={t} href={`/policies/${t}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: INK, textDecoration: 'none', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '6px 12px' }}>
                  {POLICY_TOPICS[t].label} <ArrowRight style={{ width: 12, height: 12, color: TERTIARY }} />
                </Link>
              ))}
            </div>
          )}
          <PrimaryLink href="/compare">Compare the parties on these issues</PrimaryLink>
        </Card>

        {/* 2 — readiness */}
        <Card icon={<Vote style={{ width: 18, height: 18, color: JADE }} />} title="Getting ready to vote">
          {readiness === 'enrolled' ? (
            <p style={{ fontSize: 14, color: SUB, lineHeight: 1.55, margin: '0 0 12px' }}>
              You&rsquo;re enrolled — nice. Nothing to do here except decide. When you&rsquo;re ready, we&rsquo;ll help you find your candidates.
            </p>
          ) : (
            <p style={{ fontSize: 14, color: SUB, lineHeight: 1.55, margin: '0 0 12px' }}>
              {readiness === 'unsure' ? 'Not sure? You can check and enrol in the same place — it takes about two minutes.' : 'Enrolling takes about two minutes and you can do it online.'}
            </p>
          )}
          {readiness === 'enrolled' ? (
            <PrimaryLink href="/map">Find your electorate &amp; candidates</PrimaryLink>
          ) : (
            <a href={ENROL_URL} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 11, background: INK, color: '#fff', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
              {readiness === 'unsure' ? 'Check or enrol at vote.nz' : 'Enrol at vote.nz'} <ArrowRight style={{ width: 15, height: 15 }} />
            </a>
          )}
          <p style={{ fontSize: 11.5, color: TERTIARY, margin: '10px 0 0' }}>Enrolment is run by the Electoral Commission (vote.nz), not Arapono.</p>
        </Card>

        {/* 3 — local */}
        <Card icon={<MapPin style={{ width: 18, height: 18, color: JADE }} />} title="Your local area">
          <p style={{ fontSize: 14, color: SUB, lineHeight: 1.55, margin: '0 0 12px' }}>
            See who represents you now, and the seats being contested near you in 2026.
          </p>
          <PrimaryLink href="/map">Find your electorate &amp; MP</PrimaryLink>
        </Card>

        {/* Go deeper — only if they asked for it */}
        {depth === 'compare' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px', borderRadius: 14, background: '#f2fbf6', border: `1px solid ${JADE}33` }}>
            <Compass style={{ width: 20, height: 20, color: JADE, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800 }}>Want the full picture?</div>
              <div style={{ fontSize: 13, color: SUB }}>The 12-question compass maps where you overlap with every party.</div>
            </div>
            <Link href="/start" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 11, background: JADE, color: '#fff', fontSize: 13.5, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Take it <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 26, paddingTop: 20, borderTop: `1px solid ${BORDER}` }}>
        <button onClick={onRestart} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: MANROPE, fontSize: 13.5, fontWeight: 700, color: SUB }}>
          <RotateCcw style={{ width: 14, height: 14 }} /> Start over
        </button>
        <Link href="/" style={{ fontSize: 13.5, fontWeight: 700, color: TERTIARY, textDecoration: 'none' }}>Explore the full site →</Link>
      </div>
    </div>
  )
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, padding: '18px 18px 20px', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, background: '#f2fbf6', flexShrink: 0 }}>{icon}</span>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, lineHeight: 1.25 }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 11, background: INK, color: '#fff', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
      {children} <ArrowRight style={{ width: 15, height: 15 }} />
    </Link>
  )
}
