/**
 * TwoVotes — the Election Centre's "how your vote works" explainer, replacing the
 * old head-to-head decide tool (that job now lives on /guide and /compare). This
 * is election-specific and strictly non-partisan: it explains the party vote vs
 * the electorate vote under MMP, then hands undecided readers off to the guide
 * or the comparison rather than steering them toward any party.
 */

import Link from 'next/link'
import { ArrowRight, Landmark, MapPin, Info } from 'lucide-react'
import { BORDER, INK, JADE, SECONDARY, TERTIARY } from '@/constants/theme'

// Warm palette, shared with the Election Centre page and the homepage, so the
// explainer doesn't drop cold near-black text and a black CTA into a warm page.
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function TwoVotes() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        {/* Party vote — the important one */}
        <div style={{ position: 'relative', border: `1.5px solid ${JADE}`, borderRadius: 16, background: '#fff', padding: '20px 20px 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
          <span style={{ position: 'absolute', top: 14, right: 14, fontSize: 10.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#fff', background: JADE, borderRadius: 999, padding: '3px 9px', fontFamily: MANROPE }}>Does the heavy lifting</span>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Landmark style={{ width: 21, height: 21, color: JADE }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Your party vote</div>
          <p style={{ fontSize: 14, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>
            Decides the <b style={{ color: INK }}>share of Parliament’s ~120 seats</b> each party gets — the vote that shapes who can form a government. A party needs 5% of the party vote, or to win an electorate, to get in.
          </p>
        </div>

        {/* Electorate vote */}
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, background: '#fff', padding: '20px 20px 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin style={{ width: 21, height: 21, color: '#2563eb' }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Your electorate vote</div>
          <p style={{ fontSize: 14, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>
            Picks the <b style={{ color: INK }}>one MP to represent your local area</b> — your electorate. There are 72 electorates, seven of them Māori electorates.
          </p>
        </div>
      </div>

      {/* Neutral tip */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 14, padding: '12px 15px', background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: 12 }}>
        <Info style={{ width: 16, height: 16, color: JADE, flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
          <b style={{ color: INK }}>Most of your influence is in the party vote</b> — it sets the overall balance of Parliament.{' '}
          <Link href="/learn/mmp" style={{ color: JADE, fontWeight: 700, textDecoration: 'none' }}>How MMP works in full →</Link>
        </p>
      </div>

      {/* Hand-off to the decide tools (no party steering here) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: INK, fontFamily: MANROPE }}>Still deciding who to give them to?</span>
        <Link href="/guide" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 11, background: JADE, color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none' }}>
          Guide me <ArrowRight style={{ width: 15, height: 15 }} />
        </Link>
        <Link href="/compare" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 11, background: '#fff', color: INK, border: `1px solid ${BORDER}`, fontSize: 14, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none' }}>
          Compare parties <ArrowRight style={{ width: 15, height: 15 }} />
        </Link>
      </div>
    </div>
  )
}
