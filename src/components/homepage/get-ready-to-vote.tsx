/**
 * GetReadyToVote — the beginner tier's confidence spine: enrol, learn how voting
 * actually works (in plain language), then find what matters to you. Moved high
 * up the homepage (right after the party tiles) because this is exactly what a
 * first-timer who "doesn't know who to vote for" needs before anything else.
 */

import Link from 'next/link'
import { Vote, Compass, Sparkles, ArrowRight, ArrowUpRight } from 'lucide-react'
import { Term } from '@/components/glossary/term'

const INK = '#0c0e12', SECONDARY = '#6b7078', BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function GetReadyToVote() {
  return (
    <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px clamp(18px, 5vw, 36px)' }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: '0 0 6px' }}>Get ready to vote</h2>
        <p style={{ fontSize: 15, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 24px' }}>Three quick steps to feel confident heading into 2026.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {/* enrol — official */}
          <a href="https://vote.nz" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div className="party-card" style={{ height: '100%', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18, padding: '22px 22px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><Vote style={{ width: 20, height: 20, color: JADE }} /></div>
              <div style={{ fontSize: 16.5, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 5 }}>1. Enrol or check your details</div>
              <p style={{ fontSize: 13.5, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55, margin: '0 0 14px' }}>Free, takes a couple of minutes — at vote.nz, the official Electoral Commission site.</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE }}>Go to vote.nz <ArrowUpRight style={{ width: 14, height: 14 }} /></span>
            </div>
          </a>
          {/* learn how to vote */}
          <Link href="/learn/how-to-vote" style={{ textDecoration: 'none' }}>
            <div className="party-card" style={{ height: '100%', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18, padding: '22px 22px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><Compass style={{ width: 20, height: 20, color: JADE }} /></div>
              <div style={{ fontSize: 16.5, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 5 }}>2. Learn how voting works</div>
              <p style={{ fontSize: 13.5, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55, margin: '0 0 14px' }}><Term name="MMP">MMP</Term>, your two votes, and how to actually cast them — in plain language.</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE }}>Start learning <ArrowRight style={{ width: 14, height: 14 }} /></span>
            </div>
          </Link>
          {/* find what matters */}
          <Link href="/start" style={{ textDecoration: 'none' }}>
            <div className="party-card" style={{ height: '100%', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18, padding: '22px 22px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><Sparkles style={{ width: 20, height: 20, color: JADE }} /></div>
              <div style={{ fontSize: 16.5, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 5 }}>3. Find what matters to you</div>
              <p style={{ fontSize: 13.5, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55, margin: '0 0 14px' }}>A 3-minute walkthrough that shows where the parties stand on your issues.</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE }}>Take the walkthrough <ArrowRight style={{ width: 14, height: 14 }} /></span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}
