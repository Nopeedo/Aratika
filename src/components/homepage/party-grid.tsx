/**
 * PartyGrid — the homepage's primary interactive block. Six large, photo-led
 * party widgets: the leader's face dominates, party colour frames it, seats +
 * role at a glance. Each clicks through to the party's full page (and, soon, the
 * detailed comparison). Equal size, neutral directory order — non-partisan.
 */

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { PARTY_DIRECTORY_ORDER, PARTY_PROFILES } from '@/constants/parties-data'
import { CURRENT_SEATS, PARTY_STATUS } from '@/constants/parties'
import { MP_PROFILES } from '@/constants/mps-data'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const DISPLAY = 'var(--font-space-grotesk), system-ui, sans-serif'

function leaderProfile(name: string) {
  return Object.values(MP_PROFILES).find((mp) => mp.name === name)
}

const STATUS_LABEL: Record<string, string> = {
  governing: 'In government', opposition: 'Opposition', support: 'In government', none: 'Not in Parliament',
}

export function PartyGrid() {
  const parties = PARTY_DIRECTORY_ORDER.map((slug) => {
    const party = PARTY_PROFILES[slug]
    const mp = leaderProfile(party.leader)
    return { slug, party, mp, photo: mp?.photo ?? party.leaderPhoto, seats: CURRENT_SEATS[slug], status: PARTY_STATUS[slug] }
  })

  return (
    <section style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 36px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 26 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, marginBottom: 8 }}>
              The parties
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.4vw, 38px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.1 }}>
              Pick a party. See what they’re really about.
            </h2>
            <p style={{ fontSize: 15.5, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: '8px 0 0', maxWidth: 560, lineHeight: 1.55 }}>
              Tap any party for the full picture — leadership, where they stand, and their record.
            </p>
          </div>
          <Link href="/compare" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 11, background: INK, color: '#fff', fontSize: 13.5, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Compare all parties <ArrowRight style={{ width: 15, height: 15 }} />
          </Link>
        </div>

        {/* Grid */}
        <div className="pw-grid">
          {parties.map(({ slug, party, photo, seats, status }) => (
            <Link key={slug} href={`/parties/${slug}`} className="party-widget" aria-label={`Explore ${party.name}`}>
              {/* colour bar */}
              <div style={{ height: 6, background: party.color, flexShrink: 0 }} />

              {/* photo */}
              <div className="pw-photoWrap">
                {photo ? (
                  <div className="pw-photo">
                    <Image src={photo} alt={`${party.leader}, ${party.name} leader`} fill sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 400px" style={{ objectFit: 'cover', objectPosition: 'top center' }} />
                  </div>
                ) : (
                  <div className="pw-photo" style={{ background: party.color }} />
                )}
                {/* gradient + text overlay */}
                <div className="pw-overlay" />
                <div className="pw-cta" style={{ background: party.color, color: party.textColor }}>
                  Explore <ArrowUpRight style={{ width: 14, height: 14 }} />
                </div>
                <div className="pw-text">
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: MANROPE, lineHeight: 1.1, letterSpacing: '-.01em' }}>{party.name}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,.85)', fontFamily: MANROPE, marginTop: 3 }}>{party.leader}</div>
                </div>
              </div>

              {/* footer stats */}
              <div className="pw-foot">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: INK, fontFamily: DISPLAY, lineHeight: 1 }}>{seats}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: TERTIARY, fontFamily: MANROPE }}>seats</span>
                </div>
                {STATUS_LABEL[status] && (
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: party.color, display: 'inline-block' }} />
                    {STATUS_LABEL[status]}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '16px 0 0', lineHeight: 1.5 }}>
          Photos from official sources &amp; Wikimedia Commons under open licences. Seats in the 54th Parliament. Parties in order of size; Aratika is non-partisan.
        </p>
      </div>

      {/* scoped styles — hover interactivity + responsive grid */}
      <style>{`
        .pw-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        @media (max-width: 900px) { .pw-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .pw-grid { grid-template-columns: 1fr; } }
        .party-widget {
          display: flex; flex-direction: column; text-decoration: none;
          border: 1px solid ${BORDER}; border-radius: 18px; overflow: hidden; background: #fff;
          box-shadow: 0 2px 6px rgba(12,14,18,.04);
          transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
        }
        .party-widget:hover { transform: translateY(-5px); box-shadow: 0 18px 44px rgba(12,14,18,.18); border-color: #d8d5cf; }
        .pw-photoWrap { position: relative; width: 100%; aspect-ratio: 5 / 4; overflow: hidden; background: #eef0f2; }
        .pw-photo { position: absolute; inset: 0; transition: transform .5s ease; }
        .party-widget:hover .pw-photo { transform: scale(1.06); }
        .pw-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(8,10,14,.86) 0%, rgba(8,10,14,.30) 42%, rgba(8,10,14,0) 70%); }
        .pw-text { position: absolute; left: 16px; right: 16px; bottom: 14px; }
        .pw-cta {
          position: absolute; top: 12px; right: 12px;
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 800; font-family: ${MANROPE};
          padding: 6px 11px; border-radius: 999px;
          opacity: 0; transform: translateY(-4px); transition: opacity .2s ease, transform .2s ease;
        }
        .party-widget:hover .pw-cta { opacity: 1; transform: translateY(0); }
        .pw-foot { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px; }
        @media (prefers-reduced-motion: reduce) {
          .party-widget, .pw-photo, .pw-cta { transition: none; }
          .party-widget:hover { transform: none; }
          .party-widget:hover .pw-photo { transform: none; }
        }
      `}</style>
    </section>
  )
}
