'use client'

/**
 * OnboardingQuiz — a thoughtful 7-question walkthrough.
 *
 *   1. What brings you here?        (goal — multi)
 *   2. How do you feel about it?    (mood — single)
 *   3. Where are you with voting?   (status — single)
 *   4. What matters to you?         (issues — multi)
 *   5. What matters most?           (rank top 3 — ordered)
 *   6. How well do you know it?     (level — single)
 *   7. How do you like to learn?    (style — multi)
 *
 * Plain-language, no-jargon, no judgement. Every answer personalises the
 * *experience* — it never produces a voting recommendation. Non-partisan.
 */

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, ArrowLeft, Check, Sparkles, Compass, GraduationCap, Scale,
  BookOpen, Vote, Eye, Baby, Frown, HelpCircle, Lightbulb, Flame, CircleDashed,
  CalendarClock, CheckCircle2, Zap, Layers, Shapes, Clock, Sprout, TrendingUp,
  Award, ExternalLink, Crown, Home, Heart, Leaf, Globe, Landmark, Wind, Users,
} from 'lucide-react'
import { POLICY_TOPICS, POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import type { PolicyTopic } from '@/types'
import {
  usePreferences, type Preferences, type Goal, type Mood, type VotingStatus,
  type ComfortLevel, type LearnStyle,
} from '@/hooks/use-preferences'
import { buildPlan } from '@/lib/onboarding/recommendations'
import { REC_ICONS } from '@/components/onboarding/rec-icons'

// ─── tokens ───────────────────────────────────────────────────────────────────
const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const TOPIC_ICONS: Record<string, React.ElementType> = { Home, Heart, TrendingUp, Leaf, GraduationCap, Scale, Globe, Landmark, Wind, Users }

// ─── option data ────────────────────────────────────────────────────────────
type Opt<T> = { key: T; label: string; blurb?: string; Icon: React.ElementType }

const GOALS: Opt<Goal>[] = [
  { key: 'decide-vote',    label: 'Figure out who to vote for', blurb: 'Work out who actually represents me.', Icon: Vote },
  { key: 'understand',     label: 'Understand how it all works', blurb: 'The system, the parties, the jargon.', Icon: BookOpen },
  { key: 'accountability', label: 'Keep politicians honest',     blurb: 'Watch what they actually do.', Icon: Eye },
  { key: 'help-others',    label: 'Help someone else learn',     blurb: 'Family, kids, or friends.', Icon: Baby },
  { key: 'curious',        label: 'Just curious',                blurb: 'Having a look around.', Icon: Sparkles },
]

const MOODS: Opt<Mood>[] = [
  { key: 'overwhelmed', label: 'Overwhelmed', blurb: 'It all feels like a lot.', Icon: Frown },
  { key: 'sceptical',   label: 'Sceptical',   blurb: 'I don’t trust what I’m told.', Icon: HelpCircle },
  { key: 'curious',     label: 'Curious',     blurb: 'Keen to understand more.', Icon: Lightbulb },
  { key: 'engaged',     label: 'Engaged',     blurb: 'I follow it pretty closely.', Icon: Flame },
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
  { key: 'visual',   label: 'Visual & interactive', blurb: 'Maps, charts, things I can play with.', Icon: Shapes },
  { key: 'bitesize', label: 'Bite-sized over time', blurb: 'A little at a time.', Icon: Clock },
]

const MOOD_LINE: Record<Mood, string> = {
  overwhelmed: 'Politics can feel like a lot — we’ll keep it plain and judgement-free.',
  sceptical:   'Healthy scepticism is a strength. Everything here is sourced, so you can check it yourself.',
  curious:     'Love the curiosity — let’s turn it into understanding.',
  engaged:     'You’re already in the game. Let’s go deeper.',
}

// ─── reusable choice row ──────────────────────────────────────────────────────
function Choice({ Icon, label, blurb, selected, badge, onClick }: {
  Icon: React.ElementType; label: string; blurb?: string; selected: boolean; badge?: number; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: blurb ? 'flex-start' : 'center', gap: 12, textAlign: 'left',
      cursor: 'pointer', fontFamily: MANROPE, width: '100%',
      padding: '14px 15px', borderRadius: 14, border: `1.5px solid ${selected ? JADE : BORDER}`,
      background: selected ? '#ecfdf5' : '#fff', transition: 'all .15s',
    }}>
      <span style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: selected ? JADE : SURFACE,
      }}>
        {badge != null ? <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', fontFamily: MANROPE }}>{badge}</span>
          : selected ? <Check style={{ width: 19, height: 19, color: '#fff' }} />
          : <Icon style={{ width: 19, height: 19, color: SECONDARY }} />}
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: INK }}>{label}</span>
        {blurb && <span style={{ display: 'block', fontSize: 12.5, color: SECONDARY, lineHeight: 1.45, marginTop: 1 }}>{blurb}</span>}
      </span>
    </button>
  )
}

const gridCols = (min = 240): React.CSSProperties => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`, gap: 10 })

// ─── component ────────────────────────────────────────────────────────────────
const LAST = 7 // last question step (8 = result)

export function OnboardingQuiz() {
  const { save } = usePreferences()
  const [step, setStep] = useState(0)

  const [goals, setGoals] = useState<Goal[]>([])
  const [mood, setMood] = useState<Mood | null>(null)
  const [voting, setVoting] = useState<VotingStatus | null>(null)
  const [issues, setIssues] = useState<PolicyTopic[]>([])
  const [topIssues, setTopIssues] = useState<PolicyTopic[]>([])
  const [level, setLevel] = useState<ComfortLevel | null>(null)
  const [styles, setStyles] = useState<LearnStyle[]>([])

  function toggle<T>(arr: T[], set: (v: T[]) => void, v: T) {
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  }

  const toggleTop = (t: PolicyTopic) =>
    setTopIssues((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : prev.length < 3 ? [...prev, t] : prev)

  // navigation with the rank step skipped when there's nothing to rank
  const skipRank = issues.length <= 1
  const next = () => {
    if (step === 4 && skipRank) { setTopIssues([...issues]); setStep(6) }
    else if (step === LAST) finish()
    else setStep(step + 1)
  }
  const back = () => {
    if (step === 6 && skipRank) setStep(4)
    else setStep(step - 1)
  }

  const finish = () => {
    save({ goals, mood, votingStatus: voting, issues, topIssues: skipRank ? [...issues] : topIssues, level, learnStyles: styles, completed: true })
    setStep(8)
  }

  // continue-enabled gate per step
  const canContinue =
    step === 1 ? goals.length > 0 :
    step === 2 ? !!mood :
    step === 3 ? !!voting :
    step === 4 ? issues.length > 0 :
    step === 5 ? topIssues.length > 0 :
    step === 6 ? !!level :
    step === 7 ? styles.length > 0 : true

  const orderedIssues = [...topIssues, ...issues.filter((i) => !topIssues.includes(i))]

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* progress */}
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
        {/* ── Intro ── */}
        {step === 0 && (
          <Slide key="intro" k="intro">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <Compass style={{ width: 28, height: 28, color: JADE }} />
              </div>
              <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 10px' }}>Let’s find what matters to you</h1>
              <p style={{ fontSize: 16.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: '0 auto 24px', maxWidth: 500 }}>
                Seven quick questions, about three minutes. No jargon, no judgement, no wrong answers — just an honest look at what
                you care about, so Aratika can meet you where you are.
              </p>
              <button onClick={() => setStep(1)} style={primaryBtn}>Get started <ArrowRight style={ic} /></button>
              <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 14 }}>No account needed. Nothing is shared.</p>
            </div>
          </Slide>
        )}

        {/* ── Q1 goal ── */}
        {step === 1 && (
          <Slide key="goal" k="goal">
            <Head title="What brings you to Aratika?" sub="Pick whatever fits — you can choose more than one." />
            <div style={gridCols()}>
              {GOALS.map((o) => <Choice key={o.key} Icon={o.Icon} label={o.label} blurb={o.blurb} selected={goals.includes(o.key)} onClick={() => toggle(goals, setGoals, o.key)} />)}
            </div>
          </Slide>
        )}

        {/* ── Q2 mood ── */}
        {step === 2 && (
          <Slide key="mood" k="mood">
            <Head title="How do you feel about politics right now?" sub="Be honest — this just helps us pitch things right." />
            <div style={gridCols()}>
              {MOODS.map((o) => <Choice key={o.key} Icon={o.Icon} label={o.label} blurb={o.blurb} selected={mood === o.key} onClick={() => setMood(o.key)} />)}
            </div>
          </Slide>
        )}

        {/* ── Q3 voting ── */}
        {step === 3 && (
          <Slide key="voting" k="voting">
            <Head title="Where are you with voting?" sub="No judgement — loads of people haven’t voted. That’s exactly who Aratika is for." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {VOTING.map((o) => <Choice key={o.key} Icon={o.Icon} label={o.label} selected={voting === o.key} onClick={() => setVoting(o.key)} />)}
            </div>
          </Slide>
        )}

        {/* ── Q4 issues ── */}
        {step === 4 && (
          <Slide key="issues" k="issues">
            <Head title="What matters to you?" sub="Tap the issues you care about — pick as many as you like." />
            <div style={gridCols(220)}>
              {POLICY_TOPIC_ORDER.map((key) => {
                const t = POLICY_TOPICS[key]
                return <Choice key={key} Icon={TOPIC_ICONS[t.icon] || Scale} label={t.label} blurb={t.description} selected={issues.includes(key)} onClick={() => toggle(issues, setIssues, key)} />
              })}
            </div>
          </Slide>
        )}

        {/* ── Q5 rank ── */}
        {step === 5 && (
          <Slide key="rank" k="rank">
            <Head title="Of those, what matters most?" sub={`Tap up to three in order — your most important first. (${topIssues.length}/3)`} />
            <div style={gridCols(220)}>
              {issues.map((key) => {
                const t = POLICY_TOPICS[key]
                const rank = topIssues.indexOf(key)
                return <Choice key={key} Icon={TOPIC_ICONS[t.icon] || Scale} label={t.label} selected={rank >= 0} badge={rank >= 0 ? rank + 1 : undefined} onClick={() => toggleTop(key)} />
              })}
            </div>
          </Slide>
        )}

        {/* ── Q6 level ── */}
        {step === 6 && (
          <Slide key="level" k="level">
            <Head title="How well do you know politics?" sub="There’s no wrong answer — we’ll set explanations to match (change it anytime)." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LEVELS.map((o) => <Choice key={o.key} Icon={o.Icon} label={o.label} blurb={o.blurb} selected={level === o.key} onClick={() => setLevel(o.key)} />)}
            </div>
          </Slide>
        )}

        {/* ── Q7 style ── */}
        {step === 7 && (
          <Slide key="style" k="style">
            <Head title="How do you like to learn?" sub="Pick whatever suits you — we’ll lean that way." />
            <div style={gridCols()}>
              {STYLES.map((o) => <Choice key={o.key} Icon={o.Icon} label={o.label} blurb={o.blurb} selected={styles.includes(o.key)} onClick={() => toggle(styles, setStyles, o.key)} />)}
            </div>
          </Slide>
        )}

        {/* ── Result ── */}
        {step === 8 && (
          <Result
            prefs={{ goals, mood, votingStatus: voting, issues, topIssues: skipRank ? [...issues] : topIssues, level, learnStyles: styles, completed: true }}
            onRestart={() => { setGoals([]); setMood(null); setVoting(null); setIssues([]); setTopIssues([]); setLevel(null); setStyles([]); setStep(0) }}
          />
        )}
      </AnimatePresence>

      {/* nav */}
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

// ─── result screen — a reactive, personalised "how Aratika helps YOU" plan ─────
function Result({ prefs, onRestart }: { prefs: Preferences; onRestart: () => void }) {
  const plan = buildPlan(prefs)
  const [hero, ...rest] = plan
  const more = rest.slice(0, 4)

  const orderedIssues = [...prefs.topIssues, ...prefs.issues.filter((i) => !prefs.topIssues.includes(i))]
  const topCount = prefs.topIssues.length
  const levelLabel = LEVELS.find((l) => l.key === prefs.level)?.label.toLowerCase()
  const styleLabels = STYLES.filter((s) => prefs.learnStyles.includes(s.key)).map((s) => s.label.toLowerCase())
  const showEnrol = prefs.votingStatus === 'never' || prefs.votingStatus === 'first-2026'
  const HeroIcon = hero ? (REC_ICONS[hero.icon] || Compass) : Compass

  return (
    <Slide k="result">
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <Sparkles style={{ width: 26, height: 26, color: JADE }} />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 8px' }}>Here’s how Aratika helps you</h2>
        {prefs.mood && <p style={{ fontSize: 15.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 auto', maxWidth: 500, lineHeight: 1.55 }}>{MOOD_LINE[prefs.mood]}</p>}
      </div>

      {/* hero recommendation — the single best thing for them */}
      {hero && (
        <Link href={hero.href} style={{ textDecoration: 'none', display: 'block', marginBottom: 16 }}>
          <div className="party-card" style={{ background: 'linear-gradient(150deg,#0f9152,#0c0e12)', borderRadius: 18, padding: '22px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#36e08a', fontFamily: MANROPE }}>Start here</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <HeroIcon style={{ width: 23, height: 23, color: '#fff' }} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', fontFamily: MANROPE, marginBottom: 5 }}>{hero.title}</div>
                <p style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.55, margin: 0, color: 'rgba(255,255,255,.82)', fontFamily: MANROPE }}>{hero.reason}</p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14, fontSize: 13.5, fontWeight: 800, color: '#fff', fontFamily: MANROPE }}>
                  Take me there <ArrowRight style={{ width: 15, height: 15 }} />
                </span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* the rest of the personalised plan */}
      {more.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, margin: '6px 0 10px' }}>Your next steps</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 20 }}>
            {more.map((r) => {
              const Icon = REC_ICONS[r.icon] || Compass
              return (
                <Link key={r.href} href={r.href} style={{ textDecoration: 'none' }}>
                  <div className="party-card" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 15px', border: `1px solid ${BORDER}`, borderRadius: 14, background: '#fff' }}>
                    <span style={{ width: 38, height: 38, borderRadius: 10, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon style={{ width: 19, height: 19, color: JADE }} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{r.title}</span>
                        {r.premium && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 800, color: '#9a7a00', background: '#fdf6dc', border: '1px solid #f1e3a8', borderRadius: 999, padding: '2px 7px', fontFamily: MANROPE }}><Crown style={{ width: 10, height: 10 }} /> Premium</span>}
                      </div>
                      <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.5, margin: 0 }}>{r.reason}</p>
                    </div>
                    <ArrowRight style={{ width: 16, height: 16, color: TERTIARY, flexShrink: 0, marginTop: 9 }} />
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}

      {/* where parties stand on every issue they chose (their priorities, in order) */}
      {orderedIssues.length > 0 && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 18px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 11 }}>Where parties stand on your issues</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {orderedIssues.map((key, i) => {
              const t = POLICY_TOPICS[key]
              const ranked = i < topCount
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

      {/* enrol nudge */}
      {showEnrol && (
        <div style={{ display: 'flex', gap: 10, padding: '13px 15px', background: '#ecfdf5', border: '1px solid #bbf0d0', borderRadius: 12, marginBottom: 16 }}>
          <Vote style={{ width: 18, height: 18, color: '#136a3a', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: '#136a3a', fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
            Not enrolled yet? You can check or enrol in a few minutes at{' '}
            <a href="https://vote.nz" target="_blank" rel="noopener noreferrer" style={{ color: '#0d5a30', fontWeight: 800, textDecoration: 'underline' }}>
              vote.nz <ExternalLink style={{ width: 12, height: 12, display: 'inline', verticalAlign: '-1px' }} />
            </a>{' '}— the official Electoral Commission site.
          </p>
        </div>
      )}

      {/* footer: what we tuned + restart */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 4 }}>
        {levelLabel && <Pill>Explanations set to <b style={{ color: INK }}>&nbsp;{levelLabel}</b></Pill>}
        {styleLabels.length > 0 && <Pill>You like <b style={{ color: INK }}>&nbsp;{styleLabels.join(', ')}</b></Pill>}
      </div>
      <p style={{ textAlign: 'center', marginTop: 14 }}>
        <button onClick={onRestart} style={{ background: 'none', border: 'none', color: SECONDARY, textDecoration: 'underline', cursor: 'pointer', fontFamily: MANROPE, fontSize: 12.5 }}>Start over</button>
      </p>
    </Slide>
  )
}

// ─── small bits ───────────────────────────────────────────────────────────────
function Slide({ children, k }: { children: React.ReactNode; k: string }) {
  return (
    <motion.div key={k} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.25 }}>
      {children}
    </motion.div>
  )
}

function Head({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={{ fontSize: 25, fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: '0 0 5px' }}>{title}</h2>
      <p style={{ fontSize: 14.5, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>{sub}</p>
    </div>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '6px 13px' }}>
      {children}
    </span>
  )
}

const ic: React.CSSProperties = { width: 16, height: 16 }
const primaryBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14.5, fontWeight: 800, fontFamily: MANROPE, padding: '12px 22px', borderRadius: 12, border: 'none', background: INK, color: '#fff', cursor: 'pointer' }
const ghostBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, fontFamily: MANROPE, padding: '10px 16px', borderRadius: 11, border: `1px solid ${BORDER}`, background: '#fff', color: SECONDARY, cursor: 'pointer' }
const primaryLink: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, fontFamily: MANROPE, padding: '11px 18px', borderRadius: 11, background: JADE, color: '#fff', textDecoration: 'none' }
const ghostLink: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, fontFamily: MANROPE, padding: '11px 18px', borderRadius: 11, background: '#fff', border: `1px solid ${BORDER}`, color: INK, textDecoration: 'none' }
