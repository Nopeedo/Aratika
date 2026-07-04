'use client'

/**
 * TrackShowcase — an auto-advancing "how tracking works" review for the homepage
 * Command Centre section. Cycles through each trackable type (MPs, parties,
 * policies, bills, news, video) with a mini preview, where to tap Track, and how
 * it impacts the user. Tabs let you jump/pause; respects reduced-motion. Purely
 * illustrative previews — no live data. Plain styling; aesthetics pass later.
 */

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Users, Landmark, Scale, Gavel, Newspaper, Video, Bookmark, Play, Check } from 'lucide-react'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const DURATION = 5000

type Key = 'mp' | 'party' | 'policy' | 'bill' | 'news' | 'video'

const SLIDES: { key: Key; tab: string; icon: React.ElementType; title: string; what: string; impact: string; where: string }[] = [
  { key: 'mp', tab: 'MPs', icon: Users, title: 'Follow an MP', what: 'Their votes, the bills they put up, and the news that names them — in one place.', impact: 'See how the person representing you actually acts, not just what they say.', where: 'Tap Track on any MP’s profile.' },
  { key: 'party', tab: 'Parties', icon: Landmark, title: 'Follow a party', what: 'Policy announcements, their news and video, and how they’re polling.', impact: 'Keep tabs on the team you’re weighing up — without visiting five sites.', where: 'Tap Track on any party page.' },
  { key: 'policy', tab: 'Policies', icon: Scale, title: 'Follow an issue', what: 'The bills on it, and where every party stands.', impact: 'Cut through to the one or two issues that decide your vote.', where: 'Tap Track on any policy topic.' },
  { key: 'bill', tab: 'Bills', icon: Gavel, title: 'Follow a bill', what: 'Every stage from first reading to law — and how MPs voted.', impact: 'Catch the vote that matters before it’s law, not after.', where: 'Tap Track on any bill.' },
  { key: 'news', tab: 'News', icon: Newspaper, title: 'News comes to you', what: 'Headlines tagged to what you follow, from credible outlets — you don’t chase it.', impact: 'One feed, only your things, always current.', where: 'Automatic — it flows from what you track.' },
  { key: 'video', tab: 'Video', icon: Video, title: 'Video comes to you', what: 'Leaders, debates and the press — clipped to the people and issues you follow.', impact: 'See it happen, don’t just read about it.', where: 'Automatic — it flows from what you track.' },
]

function TrackPill() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 800, fontFamily: MANROPE, background: '#ecfdf5', border: '1px solid #a7f3d0', color: JADE, boxShadow: '0 0 0 4px rgba(31,138,76,.16)' }}>
      <Bookmark style={{ width: 15, height: 15 }} /> Track
    </span>
  )
}

function InFeedBadge() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: JADE, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 999, padding: '3px 9px', fontFamily: MANROPE }}>
      <Check style={{ width: 12, height: 12 }} /> In your feed
    </span>
  )
}

function Preview({ k }: { k: Key }) {
  const card: React.CSSProperties = { background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 16px', boxShadow: '0 6px 20px rgba(12,14,18,.06)' }
  if (k === 'mp') {
    return (
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <span style={{ width: 46, height: 46, borderRadius: '50%', background: '#e7ecf3', flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Casey Ihaka</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: TERTIARY, fontFamily: MANROPE }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1F8A4C' }} /> MP for Rongotai</span>
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><TrackPill /></div>
      </div>
    )
  }
  if (k === 'party') {
    return (
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ height: 5, background: '#1F8A4C' }} />
        <div style={{ padding: '16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <span style={{ width: 44, height: 44, borderRadius: '50%', background: '#1F8A4C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, fontFamily: MANROPE, flexShrink: 0 }}>G</span>
            <span><span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Green Party</span><span style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE }}>15 seats · in opposition</span></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><TrackPill /></div>
        </div>
      </div>
    )
  }
  if (k === 'policy') {
    return (
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <span style={{ width: 44, height: 44, borderRadius: 12, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Scale style={{ width: 21, height: 21, color: JADE }} /></span>
          <span><span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Housing</span><span style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE }}>Where every party stands</span></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><TrackPill /></div>
      </div>
    )
  }
  if (k === 'bill') {
    const stages = ['1st', 'Select', '2nd', '3rd']
    return (
      <div style={card}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 800, color: '#1e40af', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 999, padding: '2px 9px', fontFamily: MANROPE, marginBottom: 8 }}>Government Bill</span>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 12, lineHeight: 1.3 }}>Fair Trading Amendment Bill</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          {stages.map((s, i) => (
            <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0, background: i <= 1 ? JADE : '#fff', border: `2px solid ${i <= 1 ? JADE : '#cbd0d6'}` }} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: i === 1 ? INK : TERTIARY, fontFamily: MANROPE }}>{s}</span>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><TrackPill /></div>
      </div>
    )
  }
  if (k === 'news') {
    return (
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: TERTIARY, fontFamily: MANROPE }}>RNZ · 2h ago</span>
          <InFeedBadge />
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.4, marginBottom: 10 }}>Parties clash over housing plan as election nears</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: SECONDARY, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '2px 9px', fontFamily: MANROPE }}>Housing</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: SECONDARY, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '2px 9px', fontFamily: MANROPE }}>Labour</span>
        </div>
      </div>
    )
  }
  // video
  return (
    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
      <div style={{ position: 'relative', aspectRatio: '16 / 9', background: 'linear-gradient(135deg,#1b2430,#0c0e12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,255,255,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Play style={{ width: 20, height: 20, color: '#0c0e12', marginLeft: 2 }} /></span>
        <span style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,.6)', borderRadius: 5, padding: '2px 6px', fontFamily: MANROPE }}>12:04</span>
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.35 }}>Leaders’ debate — full</span>
        <InFeedBadge />
      </div>
    </div>
  )
}

export function TrackShowcase() {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const slide = SLIDES[i]

  useEffect(() => {
    if (reduce || paused) return
    const t = setTimeout(() => setI((x) => (x + 1) % SLIDES.length), DURATION)
    return () => clearTimeout(t)
  }, [i, paused, reduce])

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden', marginTop: 14 }}
    >
      <style>{`@keyframes pe-track-prog { from { transform: scaleX(0) } to { transform: scaleX(1) } }`}</style>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 12px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {SLIDES.map((s, idx) => {
          const on = idx === i
          const Icon = s.icon
          return (
            <button
              key={s.key}
              onClick={() => setI(idx)}
              aria-pressed={on}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer', fontSize: 13, fontWeight: 800, fontFamily: MANROPE, padding: '8px 13px', borderRadius: 10, border: `1px solid ${on ? INK : BORDER}`, background: on ? INK : '#fff', color: on ? '#fff' : SECONDARY }}
            >
              <Icon style={{ width: 15, height: 15 }} /> {s.tab}
            </button>
          )
        })}
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: SURFACE, margin: '12px 0 0' }}>
        <div key={i} style={{ height: '100%', background: JADE, transformOrigin: 'left', transform: reduce || paused ? 'scaleX(1)' : 'scaleX(0)', animation: reduce || paused ? 'none' : `pe-track-prog ${DURATION}ms linear forwards` }} />
      </div>

      {/* Body */}
      <div key={slide.key} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 22, padding: 'clamp(20px, 4vw, 30px)', alignItems: 'center', animation: reduce ? 'none' : 'pe-fade .4s ease' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, marginBottom: 12 }}>
            <slide.icon style={{ width: 15, height: 15 }} /> {slide.tab}
          </div>
          <h3 style={{ fontSize: 'clamp(20px, 3.5vw, 24px)', fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 10px', letterSpacing: '-.01em' }}>{slide.title}</h3>
          <p style={{ fontSize: 15, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 14px', lineHeight: 1.6 }}>{slide.what}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              <Check style={{ width: 16, height: 16, color: JADE, flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 13.5, color: INK, fontWeight: 600, fontFamily: MANROPE, lineHeight: 1.5 }}>{slide.impact}</span>
            </div>
            <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              <Bookmark style={{ width: 15, height: 15, color: TERTIARY, flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.5 }}>{slide.where}</span>
            </div>
          </div>
        </div>
        <div><Preview k={slide.key} /></div>
      </div>
      <style>{`@keyframes pe-fade { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  )
}
