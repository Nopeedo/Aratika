/**
 * PartyLeaders — a strip of real, recognisable faces: the leader of every party
 * in Parliament, equal size, in the neutral directory order (no ranking, no
 * favour). Each links to that person's full profile. Photos are licensed
 * (official sources / Wikimedia Commons) with per-profile attribution.
 */

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { PARTY_DIRECTORY_ORDER, PARTY_PROFILES } from '@/constants/parties-data'
import { MP_PROFILES } from '@/constants/mps-data'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

function leaderProfile(name: string) {
  return Object.values(MP_PROFILES).find((mp) => mp.name === name)
}

export function PartyLeaders() {
  const leaders = PARTY_DIRECTORY_ORDER
    .map((slug) => ({ slug, party: PARTY_PROFILES[slug], mp: leaderProfile(PARTY_PROFILES[slug].leader) }))
    .filter((l) => !!l.mp?.photo)

  if (leaders.length === 0) return null

  return (
    <section style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '54px 36px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, marginBottom: 8 }}>
              The people on the ballot
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.12 }}>
              These are the people asking for your vote.
            </h2>
          </div>
          <Link href="/mps" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, color: INK, fontFamily: MANROPE, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            All 123 MPs <ArrowRight style={{ width: 15, height: 15 }} />
          </Link>
        </div>

        {/* Leader cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          {leaders.map(({ slug, party, mp }) => (
            <Link key={slug} href={`/mps/${mp!.slug}`} className="party-card" style={{ textDecoration: 'none', display: 'block', borderRadius: 16, overflow: 'hidden', border: `1px solid ${BORDER}`, background: '#fff' }}>
              {/* party colour bar */}
              <div style={{ height: 5, background: party.color }} />
              {/* real photo */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: '#f1f3f5' }}>
                <Image
                  src={mp!.photo!}
                  alt={`${mp!.name}, ${party.name} leader`}
                  fill
                  sizes="(max-width: 768px) 45vw, 200px"
                  style={{ objectFit: 'cover', objectPosition: 'top center' }}
                />
              </div>
              {/* name + party */}
              <div style={{ padding: '13px 14px 15px' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.2 }}>{mp!.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: party.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: SECONDARY, fontFamily: MANROPE }}>{party.name} leader</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Attribution — credibility */}
        <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '16px 0 0', lineHeight: 1.5 }}>
          Photos from official sources &amp; Wikimedia Commons under open licences — full credit on each{' '}
          <Link href="/mps" style={{ color: SECONDARY, fontWeight: 700 }}>profile</Link>. Parties shown in order of size; Aratika is non-partisan.
        </p>
      </div>
    </section>
  )
}
