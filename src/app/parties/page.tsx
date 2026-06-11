import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Users } from 'lucide-react'
import { PARTY_PROFILES, PARTY_DIRECTORY_ORDER } from '@/constants/parties-data'
import { CURRENT_SEATS, TOTAL_SEATS, PARTY_STATUS } from '@/constants/parties'
import { SectionDivider } from '@/components/ui/section-divider'

export const metadata: Metadata = {
  title: 'Political Parties',
  description:
    'All political parties currently represented in New Zealand\'s 54th Parliament — ' +
    'seat counts, leadership, ideology, and policy positions.',
}

const INK      = '#0c0e12'
const SECONDARY = '#6b7078'
const TERTIARY  = '#9aa0aa'
const BORDER    = '#e9e7e2'
const SURFACE   = '#f8fafc'

export default function PartiesPage() {
  const governing   = PARTY_DIRECTORY_ORDER.filter((s) => PARTY_STATUS[s] === 'governing')
  const opposition  = PARTY_DIRECTORY_ORDER.filter((s) => PARTY_STATUS[s] === 'opposition')
  const govtSeats   = governing.reduce((n, s) => n + CURRENT_SEATS[s], 0)

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div
        className="bg-dot-grid"
        style={{ background: '#ffffff', borderBottom: `1px solid ${BORDER}` }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '52px 36px 48px' }}>
          <div style={{ marginBottom: 8 }}>
            <SectionDivider type="official" label="Official Parliament Data" />
          </div>
          <h1 style={{
            fontSize:      40,
            fontWeight:    800,
            letterSpacing: '-.02em',
            color:         INK,
            fontFamily:    'var(--font-manrope), system-ui, sans-serif',
            marginBottom:  10,
          }}>
            Political Parties
          </h1>
          <p style={{
            fontSize:   17,
            fontWeight: 500,
            color:      SECONDARY,
            fontFamily: 'var(--font-manrope), system-ui, sans-serif',
            maxWidth:   560,
            lineHeight: 1.6,
          }}>
            All parties currently represented in New Zealand&apos;s{' '}
            <b style={{ color: INK }}>54th Parliament</b>.
            {' '}Seat counts sourced from the 2023 General Election official results.
          </p>

          {/* Coalition overview bar */}
          <div style={{
            marginTop:    32,
            padding:      '18px 22px',
            background:   '#ffffff',
            border:       `1px solid ${BORDER}`,
            borderRadius: 16,
            boxShadow:    '0 2px 4px rgba(12,14,18,.03)',
            display:      'flex',
            alignItems:   'center',
            gap:          24,
            flexWrap:     'wrap',
          }}>
            <div>
              <div style={{
                fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em',
                textTransform: 'uppercase', color: TERTIARY,
                fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                marginBottom: 4,
              }}>
                54th Parliament — {TOTAL_SEATS} seats total
              </div>
              {/* Seat bar */}
              <div style={{ display: 'flex', gap: 2, height: 10, width: 400, maxWidth: '100%', borderRadius: 999, overflow: 'hidden' }}>
                {PARTY_DIRECTORY_ORDER.map((slug) => (
                  <div
                    key={slug}
                    style={{
                      width:      `${(CURRENT_SEATS[slug] / TOTAL_SEATS) * 100}%`,
                      background: PARTY_PROFILES[slug].color,
                      height:     '100%',
                    }}
                    title={`${PARTY_PROFILES[slug].name}: ${CURRENT_SEATS[slug]} seats`}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: TERTIARY, fontFamily: 'var(--font-manrope), system-ui, sans-serif' }}>
                  Governing coalition
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: INK, fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' }}>
                  {govtSeats}{' '}
                  <span style={{ fontSize: 13, fontWeight: 500, color: TERTIARY, fontFamily: 'var(--font-manrope), system-ui, sans-serif' }}>
                    / {TOTAL_SEATS}
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: TERTIARY, fontFamily: 'var(--font-manrope), system-ui, sans-serif' }}>
                  Majority needed
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: INK, fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' }}>
                  62
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '52px 36px' }}>

        {/* ── Governing coalition ───────────────────────────────────── */}
        <SectionTitle label="Governing Coalition" count={governing.length} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 52 }}>
          {governing.map((slug) => (
            <PartyCard key={slug} slug={slug} />
          ))}
        </div>

        {/* ── Opposition ────────────────────────────────────────────── */}
        <SectionTitle label="Opposition" count={opposition.length} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {opposition.map((slug) => (
            <PartyCard key={slug} slug={slug} />
          ))}
        </div>

      </div>
    </div>
  )
}

// ─── Section title ────────────────────────────────────────────────────────────

function SectionTitle({ label, count }: { label: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <h2 style={{
        fontSize:     18,
        fontWeight:   800,
        color:        '#0c0e12',
        fontFamily:   'var(--font-manrope), system-ui, sans-serif',
        margin:       0,
      }}>
        {label}
      </h2>
      <span style={{
        fontSize: 12, fontWeight: 700,
        background: '#f1efeb', color: '#6b7078',
        borderRadius: 999, padding: '2px 9px',
        fontFamily: 'var(--font-manrope), system-ui, sans-serif',
      }}>
        {count} {count === 1 ? 'party' : 'parties'}
      </span>
    </div>
  )
}

// ─── Party card ───────────────────────────────────────────────────────────────

function PartyCard({ slug }: { slug: keyof typeof PARTY_PROFILES }) {
  const party  = PARTY_PROFILES[slug]
  const seats  = CURRENT_SEATS[slug]
  const status = PARTY_STATUS[slug]

  return (
    <Link href={`/parties/${slug}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background:   '#ffffff',
        border:       `1px solid ${BORDER}`,
        borderRadius: 20,
        overflow:     'hidden',
        boxShadow:    '0 2px 4px rgba(12,14,18,.03)',
        transition:   'box-shadow 0.15s, border-color 0.15s',
        height:       '100%',
        display:      'flex',
        flexDirection:'column',
      }}
        className="party-card"
      >
        {/* Colour strip */}
        <div style={{ height: 6, background: party.color, flexShrink: 0 }} />

        <div style={{ padding: '20px 22px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{
                fontSize: 19, fontWeight: 800, letterSpacing: '-.01em', color: INK,
                fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                lineHeight: 1.1,
              }}>
                {party.name}
              </div>
              <div style={{
                fontSize: 12, fontWeight: 500, color: TERTIARY,
                fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                marginTop: 3,
              }}>
                {party.fullName}
              </div>
            </div>

            {/* Seat badge */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{
                fontSize: 28, fontWeight: 700, letterSpacing: '-.02em', color: INK,
                fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
                lineHeight: 1,
              }}>
                {seats}
              </div>
              <div style={{
                fontSize: 10.5, fontWeight: 600, color: TERTIARY,
                fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                marginTop: 2,
              }}>
                seats
              </div>
            </div>
          </div>

          {/* Status + coalition role */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 700,
              borderRadius: 999, padding: '3px 10px',
              background: party.color, color: party.textColor,
              fontFamily: 'var(--font-manrope), system-ui, sans-serif',
            }}>
              {status === 'governing' ? 'Governing' : 'Opposition'}
            </span>
            {party.coalitionRole && (
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                fontSize: 11, fontWeight: 600,
                border: `1px solid ${BORDER}`, borderRadius: 999, padding: '3px 10px',
                color: SECONDARY,
                fontFamily: 'var(--font-manrope), system-ui, sans-serif',
              }}>
                {party.coalitionRole}
              </span>
            )}
          </div>

          {/* Leader */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px',
            background: SURFACE, borderRadius: 10,
            border: `1px solid ${BORDER}`,
          }}>
            {/* Avatar placeholder */}
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: party.color, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: party.textColor,
              fontFamily: 'var(--font-manrope), system-ui, sans-serif',
            }}>
              {party.leader.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <div style={{
                fontSize: 13, fontWeight: 700, color: INK,
                fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                lineHeight: 1.2,
              }}>
                {party.leader}
                {party.coLeader && ` & ${party.coLeader}`}
              </div>
              <div style={{
                fontSize: 11, fontWeight: 500, color: TERTIARY,
                fontFamily: 'var(--font-manrope), system-ui, sans-serif',
              }}>
                {party.leaderTitle}
              </div>
            </div>
          </div>

          {/* Tagline */}
          <p style={{
            fontSize: 13, fontWeight: 500, color: SECONDARY,
            fontFamily: 'var(--font-manrope), system-ui, sans-serif',
            lineHeight: 1.5, margin: 0, flex: 1,
          }}>
            {party.tagline}
          </p>

          {/* Ideology tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {party.ideology.slice(0, 3).map((tag) => (
              <span key={tag} style={{
                fontSize: 10.5, fontWeight: 600,
                background: '#f1efeb', color: SECONDARY,
                borderRadius: 999, padding: '2px 8px',
                fontFamily: 'var(--font-manrope), system-ui, sans-serif',
              }}>
                {tag}
              </span>
            ))}
          </div>

          {/* Footer link */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: 12, borderTop: `1px solid ${BORDER}`,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 11, color: TERTIARY,
              fontFamily: 'var(--font-manrope), system-ui, sans-serif',
            }}>
              <Users style={{ width: 12, height: 12 }} />
              Founded {party.founded}
            </div>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 800, color: INK,
              fontFamily: 'var(--font-manrope), system-ui, sans-serif',
            }}>
              View profile <ArrowRight style={{ width: 13, height: 13 }} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
