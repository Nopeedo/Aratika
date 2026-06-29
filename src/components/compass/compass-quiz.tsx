'use client'

/**
 * CompassQuiz — Aratika's personal compass. ~12 questions:
 *   Part 1 (about you):  goal · voting status · knowledge level · learning style
 *   Part 2 (where you stand): 8 neutral policy statements, rated on a 5-point scale
 *
 * The result does two things:
 *   1. Routes you to the TOOLS that help most (reuses buildPlan).
 *   2. Shows WHERE YOU OVERLAP with every party — factual, sourced, in a fixed
 *      neutral order, NO winner declared. It is not voting advice.
 *
 * Non-partisan by design. Statements are neutral; party stances are sourced
 * (see compass-stances.ts); the overlap view never ranks or recommends.
 */

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, ArrowLeft, Check, Compass, Sparkles, Vote, BookOpen, Eye, Baby,
  CircleDashed, CalendarClock, CheckCircle2, Sprout, TrendingUp, Award, Zap,
  Layers, Shapes, Clock, ExternalLink, X, Minus,
} from 'lucide-react'
import { usePreferences, type Goal, type VotingStatus, type ComfortLevel, type LearnStyle } from '@/hooks/use-preferences'
import { buildPlan } from '@/lib/onboarding/recommendations'
import { REC_ICONS } from '@/components/onboarding/rec-icons'
import { COMPASS_STATEMENTS, LIKERT_SCALE, type LikertValue } from '@/constants/compass'
import { computeOverlap, engagedTopics } from '@/lib/compass/overlap'
import { PARTY_PROFILES } from '@/constants/parties-data'
import { PARTY_COLORS } from '@/constants/parties'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import type { PolicyTopic } from '@/types'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

// ─── Part-1 option data ───────────────────────────────────────────────────────
type Opt<T> = { key: T; label: string; blurb?: string; Icon: React.ElementType }
const GOALS: Opt<Goal>[] = [
  { key: 'decide-vote',    label: 'Figure out who to vote for', blurb: 'Work out who actually represents me.', Icon: Vote },
  { key: 'understand',     label: 'Understand how it works',    blurb: 'The system, the parties, the jargon.', Icon: BookOpen },
  { key: 'accountability', label: 'Keep politicians honest',    blurb: 'Watch what they actually do.', Icon: Eye },
  { key: 'help-others',    label: 'Help someone else learn',    blurb: 'Family, kids, or friends.', Icon: Baby },
  { key: 'curious',        label: 'Just curious',               blurb: 'Having a look around.', Icon: Sparkles },
]
const VOTING: Opt<VotingStatus>[] = [
  { key: 'never',      label: 'I haven’t voted before', Icon: CircleDashed },
  { key: 'first-2026', label: '2026 will be my first',  Icon: Sparkles },
  { key: 'sometimes',  label: 'I vote sometimes',       Icon: CalendarClock },
  { key: 'always',     label: 'I always vote',          Icon: CheckCircle2 },
]
const LEVELS: Opt<ComfortLevel>[] = [
  { key: 'beginner',     label: 'New to this',     blurb: 'Keep it simple — explain the basics.', Icon: Sprout },
  { key: 'intermediate', label: 'I follow a bit',  blurb: 'I know the basics, want more.', Icon: TrendingUp },
  { key: 'expert',       label: 'Pretty clued up', blurb: 'Give me the detail.', Icon: Award },
]
const STYLES: Opt<LearnStyle>[] = [
  { key: 'quick',    label: 'Quick facts',          blurb: 'Short summaries I can scan.', Icon: Zap },
  { key: 'deep',     label: 'Deep dives',           blurb: 'Give me the full picture.', Icon: Layers },
  { key: 'visual',   label: 'Visual & interactive', blurb: 'Maps, charts, things to play with.', Icon: Shapes },
  { key: 'bitesize', label: 'Bite-sized over time', blurb: 'A little at a time.', Icon: Clock },
]

const FIRST_STMT = 4                    // steps 4..11 are the 8 statements
const LAST = FIRST_STMT + COMPASS_STATEMENTS.length // step 12 = learning style
const RESULT = LAST + 1                  // step 13

export function CompassQuiz() {
  const { save } = usePreferences()
  const [step, setStep] = useState(0)
  const [goals, setGoals] = useState<Goal[]>([])
  const [voting, setVoting] = useState<VotingStatus | null>(null)
  const [level, setLevel] = useState<ComfortLevel | null>(null)
  const [styles, setStyles] = useState<LearnStyle[]>([])
  const [stances, setStances] = useState<Record<string, LikertValue>>({})

  const toggle = <T,>(arr: T[], set: (v: T[]) => void, v: T) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

  const stmtIndex = step - FIRST_STMT
  const onStatement = step >= FIRST_STMT && step < LAST
  const curStmt = onStatement ? COMPASS_STATEMENTS[stmtIndex] : null

  const finish = () => {
    const { issues, topIssues } = engagedTopics(stances)
    save({ goals, mood: null, votingStatus: voting, issues: issues as PolicyTopic[], topIssues: topIssues as PolicyTopic[], level, learnStyles: styles, compass: stances, completed: true })
    setStep(RESULT)
  }
  const next = () => (step === LAST ? finish() : setStep(step + 1))
  const back = () => setStep(step - 1)

  const canContinue =
    step === 1 ? goals.length > 0 :
    step === 2 ? !!voting :
    step === 3 ? !!level :
    onStatement ? stances[curStmt!.id] !== undefined :
    step === LAST ? styles.length > 0 : true

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {step >= 1 && step <= LAST && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>Question {step} of {LAST}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: TERTIARY, fontFamily: MANROPE }}>{Math.round((step / LAST) * 100)}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: '#eceae5', overflow: 'hidden' }}>
            <motion.div initial={false} animate={{ width: `${(step / LAST) * 100}%` }} transition={{ duration: 0.35 }} style={{ height: '100%', background: JADE, borderRadius: 3 }} />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 0 && (
          <Slide k="intro">
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}><Compass style={{ width: 28, height: 28, color: JADE }} /></div>
              <h1 style={{ fontSize: 'clamp(26px, 6vw, 32px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 10px' }}>Your political compass</h1>
              <p style={{ fontSize: 16, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: '0 auto 22px', maxWidth: 520 }}>
                About 12 quick questions. We’ll point you to the tools that help most — and show where you overlap with each party on the issues, sourced and side by side.
                <b style={{ color: INK }}> It’s not voting advice.</b>
              </p>
              <button onClick={() => setStep(1)} style={primaryBtn}>Start <ArrowRight style={ic} /></button>
              <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 14 }}>No account needed. Nothing is shared.</p>
            </div>
          </Slide>
        )}

        {step === 1 && (
          <Slide k="goal"><Head title="What brings you to Aratika?" sub="Pick whatever fits — more than one is fine." />
            <Grid>{GOALS.map((o) => <Choice key={o.key} Icon={o.Icon} label={o.label} blurb={o.blurb} selected={goals.includes(o.key)} onClick={() => toggle(goals, setGoals, o.key)} />)}</Grid>
          </Slide>
        )}
        {step === 2 && (
          <Slide k="voting"><Head title="Where are you with voting?" sub="No judgement — lots of people haven’t voted. That’s exactly who this is for." />
            <Col>{VOTING.map((o) => <Choice key={o.key} Icon={o.Icon} label={o.label} blurb={o.blurb} selected={voting === o.key} onClick={() => setVoting(o.key)} />)}</Col>
          </Slide>
        )}
        {step === 3 && (
          <Slide k="level"><Head title="How well do you know politics?" sub="No wrong answer — we’ll match explanations to it." />
            <Col>{LEVELS.map((o) => <Choice key={o.key} Icon={o.Icon} label={o.label} blurb={o.blurb} selected={level === o.key} onClick={() => setLevel(o.key)} />)}</Col>
          </Slide>
        )}

        {onStatement && curStmt && (
          <Slide k={curStmt.id}>
            <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE }}>{curStmt.label}</div>
            <Head title={curStmt.text} sub="How much do you agree? There’s no right answer — be honest." />
            <Col>
              {LIKERT_SCALE.map((o) => (
                <Choice key={o.value} label={o.label} Icon={Check} selected={stances[curStmt.id] === o.value} hideIcon onClick={() => setStances((s) => ({ ...s, [curStmt.id]: o.value }))} />
              ))}
            </Col>
          </Slide>
        )}

        {step === LAST && (
          <Slide k="style"><Head title="How do you like to learn?" sub="Pick whatever suits — we’ll lean that way." />
            <Grid>{STYLES.map((o) => <Choice key={o.key} Icon={o.Icon} label={o.label} blurb={o.blurb} selected={styles.includes(o.key)} onClick={() => toggle(styles, setStyles, o.key)} />)}</Grid>
          </Slide>
        )}

        {step === RESULT && (
          <Result
            goals={goals} voting={voting} level={level} styles={styles} stances={stances}
            onRestart={() => { setGoals([]); setVoting(null); setLevel(null); setStyles([]); setStances({}); setStep(0) }}
          />
        )}
      </AnimatePresence>

      {step >= 1 && step <= LAST && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 22 }}>
          <button onClick={back} style={ghostBtn}><ArrowLeft style={ic} /> Back</button>
          <button onClick={next} disabled={!canContinue} style={{ ...primaryBtn, opacity: canContinue ? 1 : 0.5, cursor: canContinue ? 'pointer' : 'default' }}>
            {step === LAST ? 'See my results' : 'Continue'} <ArrowRight style={ic} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Result ───────────────────────────────────────────────────────────────────
function Result({ goals, voting, level, styles, stances, onRestart }: {
  goals: Goal[]; voting: VotingStatus | null; level: ComfortLevel | null; styles: LearnStyle[]
  stances: Record<string, LikertValue>; onRestart: () => void
}) {
  const { issues, topIssues } = engagedTopics(stances)
  const plan = buildPlan({ goals, mood: null, votingStatus: voting, issues: issues as PolicyTopic[], topIssues: topIssues as PolicyTopic[], level, learnStyles: styles, compass: stances, completed: true })
  const [hero, ...rest] = plan
  const more = rest.slice(0, 3)
  const overlap = computeOverlap(stances)
  const answeredAny = Object.values(stances).some((v) => v !== 0)
  const HeroIcon = hero ? (REC_ICONS[hero.icon] || Compass) : Compass
  const showEnrol = voting === 'never' || voting === 'first-2026'

  return (
    <Slide k="result">
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><Sparkles style={{ width: 26, height: 26, color: JADE }} /></div>
        <h2 style={{ fontSize: 'clamp(22px, 5.5vw, 28px)', fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>Your compass</h2>
      </div>

      {/* hero tool recommendation */}
      {hero && (
        <Link href={hero.href} style={{ textDecoration: 'none', display: 'block', marginBottom: 14 }}>
          <div className="party-card" style={{ background: 'linear-gradient(150deg,#0f9152,#0c0e12)', borderRadius: 18, padding: '20px 20px' }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#36e08a', fontFamily: MANROPE }}>Start here</span>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, marginTop: 10 }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><HeroIcon style={{ width: 22, height: 22, color: '#fff' }} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: MANROPE, marginBottom: 4 }}>{hero.title}</div>
                <p style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.5, margin: 0, color: 'rgba(255,255,255,.82)', fontFamily: MANROPE }}>{hero.reason}</p>
              </div>
            </div>
          </div>
        </Link>
      )}
      {more.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
          {more.map((r) => {
            const Icon = REC_ICONS[r.icon] || Compass
            return (
              <Link key={r.href} href={r.href} style={{ textDecoration: 'none' }}>
                <div className="party-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', border: `1px solid ${BORDER}`, borderRadius: 14, background: '#fff' }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon style={{ width: 18, height: 18, color: JADE }} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{r.title}</div>
                    <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.45, margin: 0 }}>{r.reason}</p>
                  </div>
                  <ArrowRight style={{ width: 15, height: 15, color: TERTIARY, flexShrink: 0 }} />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* ── Where you overlap — non-partisan, neutral order, no winner ── */}
      {answeredAny && (
        <div style={{ marginBottom: 18 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>Where you line up</h3>
          <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 12px', lineHeight: 1.5 }}>
            How your answers overlap with each party’s <b style={{ color: INK }}>sourced</b> position — shown in seat order, not ranked.
            <b style={{ color: INK }}> This isn’t voting advice.</b>
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginBottom: 12 }}>
            <Legend kind="agree" text="Same side" />
            <Legend kind="disagree" text="Different" />
            <Legend kind="partial" text="Party mixed" />
            <Legend kind="na" text="No answer / no position" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {overlap.map((po) => {
              const prof = PARTY_PROFILES[po.party]
              const col = PARTY_COLORS[po.party]
              return (
                <div key={po.party} style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: '12px 14px', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9, flexWrap: 'wrap' }}>
                    <span style={{ width: 12, height: 12, borderRadius: 4, background: col.bg, flexShrink: 0 }} />
                    <span style={{ fontSize: 14.5, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{prof.name}</span>
                    <span style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, marginLeft: 'auto' }}>
                      {po.counted > 0 ? <>same side on <b style={{ color: INK }}>{po.sameSide}</b> of {po.counted}</> : 'no comparable positions yet'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {po.statements.map((st) => {
                      const dot = <Indicator kind={st.kind} />
                      const tip = `${st.label}: ${st.quote ? `“${st.quote}”` : (st.summary ?? '')}${st.sourceUrl ? ' — source ↗' : ''}`
                      return st.sourceUrl ? (
                        <a key={st.id} href={st.sourceUrl} target="_blank" rel="noopener noreferrer" title={tip} style={{ textDecoration: 'none' }}>{dot}</a>
                      ) : <span key={st.id} title={`${st.label}: position not yet captured`}>{dot}</span>
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '10px 0 0', lineHeight: 1.5 }}>
            Tap a square to read that party’s position at its source. Want the full picture?{' '}
            <Link href="/compare" style={{ color: SECONDARY, fontWeight: 700 }}>Compare every party side by side →</Link>
          </p>
        </div>
      )}

      {/* where parties stand on your issues */}
      {issues.length > 0 && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 10 }}>Dig into your issues</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {[...new Set(issues)].map((key) => {
              const t = POLICY_TOPICS[key as PolicyTopic]
              return (
                <Link key={key} href={`/policies/${key}`} style={{ textDecoration: 'none' }}>
                  <span className="party-card" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 999, border: `1px solid ${BORDER}`, background: '#fff', fontSize: 13, fontWeight: 700, color: INK, fontFamily: MANROPE }}>{t.label} <ArrowRight style={{ width: 12, height: 12, color: TERTIARY }} /></span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {showEnrol && (
        <div style={{ display: 'flex', gap: 10, padding: '13px 15px', background: '#ecfdf5', border: '1px solid #bbf0d0', borderRadius: 12, marginBottom: 16 }}>
          <Vote style={{ width: 18, height: 18, color: '#136a3a', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: '#136a3a', fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
            Not enrolled yet? Check or enrol in a few minutes at{' '}
            <a href="https://vote.nz" target="_blank" rel="noopener noreferrer" style={{ color: '#0d5a30', fontWeight: 800, textDecoration: 'underline' }}>vote.nz <ExternalLink style={{ width: 12, height: 12, display: 'inline', verticalAlign: '-1px' }} /></a> — the official Electoral Commission site.
          </p>
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 6 }}>
        <button onClick={onRestart} style={{ background: 'none', border: 'none', color: SECONDARY, textDecoration: 'underline', cursor: 'pointer', fontFamily: MANROPE, fontSize: 12.5 }}>Start over</button>
      </p>
    </Slide>
  )
}

// ─── small bits ───────────────────────────────────────────────────────────────
function Indicator({ kind }: { kind: 'agree' | 'disagree' | 'partial' | 'na' }) {
  const map = {
    agree:    { bg: '#ecfdf5', fg: JADE,      Icon: Check },
    disagree: { bg: '#fdecec', fg: '#c0392b', Icon: X },
    partial:  { bg: '#fdf6dc', fg: '#9a7a00', Icon: Minus },
    na:       { bg: '#f1f0ec', fg: '#b9b4ab', Icon: Minus },
  }[kind]
  const I = map.Icon
  return <span style={{ width: 26, height: 26, borderRadius: 7, background: map.bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><I style={{ width: 15, height: 15, color: map.fg }} /></span>
}
function Legend({ kind, text }: { kind: 'agree' | 'disagree' | 'partial' | 'na'; text: string }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: SECONDARY, fontFamily: MANROPE }}><Indicator kind={kind} />{text}</span>
}

function Choice({ Icon, label, blurb, selected, hideIcon, onClick }: { Icon: React.ElementType; label: string; blurb?: string; selected: boolean; hideIcon?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: blurb ? 'flex-start' : 'center', gap: 12, textAlign: 'left', cursor: 'pointer', fontFamily: MANROPE, width: '100%', padding: '13px 15px', borderRadius: 14, border: `1.5px solid ${selected ? JADE : BORDER}`, background: selected ? '#ecfdf5' : '#fff', transition: 'all .15s' }}>
      <span style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: selected ? JADE : SURFACE }}>
        {selected ? <Check style={{ width: 18, height: 18, color: '#fff' }} /> : hideIcon ? <span style={{ width: 10, height: 10, borderRadius: '50%', border: `2px solid ${TERTIARY}` }} /> : <Icon style={{ width: 18, height: 18, color: SECONDARY }} />}
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: INK }}>{label}</span>
        {blurb && <span style={{ display: 'block', fontSize: 12.5, color: SECONDARY, lineHeight: 1.45, marginTop: 1 }}>{blurb}</span>}
      </span>
    </button>
  )
}
function Grid({ children }: { children: React.ReactNode }) { return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: 10 }}>{children}</div> }
function Col({ children }: { children: React.ReactNode }) { return <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>{children}</div> }
function Slide({ children, k }: { children: React.ReactNode; k: string }) { return <motion.div key={k} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.25 }}>{children}</motion.div> }
function Head({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 'clamp(20px, 5vw, 25px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: '0 0 5px', lineHeight: 1.2 }}>{title}</h2>
      <p style={{ fontSize: 14, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>{sub}</p>
    </div>
  )
}
const ic: React.CSSProperties = { width: 16, height: 16 }
const primaryBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14.5, fontWeight: 800, fontFamily: MANROPE, padding: '12px 22px', borderRadius: 12, border: 'none', background: INK, color: '#fff', cursor: 'pointer' }
const ghostBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, fontFamily: MANROPE, padding: '10px 16px', borderRadius: 11, border: `1px solid ${BORDER}`, background: '#fff', color: SECONDARY, cursor: 'pointer' }
