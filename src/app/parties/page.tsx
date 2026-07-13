import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Users } from 'lucide-react'
import { PARTY_PROFILES, PARTY_DIRECTORY_ORDER } from '@/constants/parties-data'
import { CURRENT_SEATS, TOTAL_SEATS, PARTY_STATUS } from '@/constants/parties'
import { MP_PROFILES } from '@/constants/mps-data'
import { Avatar } from '@/components/ui/avatar'
import { SectionDivider } from '@/components/ui/section-divider'

// Resolve a leader's photo: MP photo if they're an MP, else the party's own leaderPhoto.
function mpSlugForName(name: string): string | null {
  const entry = Object.values(MP_PROFILES).find((mp) => mp.name === name)
  return entry ? entry.slug : null
}

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
const JADE      = '#1F8A4C'

// Registered with the Electoral Commission to contest the 2026 party vote, but holding no
// seats in the current (54th) Parliament. Listed EQUALLY and alphabetically — Arapono ranks
// or endorses none. Party names from the EC register (as at 1 July 2026); official websites
// and policy-focus areas taken from each party's own site.
const REGISTERED_NON_PARLIAMENTARY: { name: string; site: string; focus: string[]; profile?: string }[] = [
  { name: 'Animal Justice Party Aotearoa New Zealand', site: 'https://animaljustice.org.nz/', focus: ['Animal welfare', 'Environment', 'Climate'], profile: '/parties/animal-justice' },
  { name: 'Aotearoa Legalise Cannabis Party', site: 'https://alcp.org.nz/', focus: ['Cannabis law reform', 'Health', 'Justice'], profile: '/parties/alcp' },
  { name: 'Conservative Party NZ', site: 'https://www.conservatives.nz/', focus: ['Economy', 'Housing', 'Law & order'], profile: '/parties/conservative' },
  { name: 'NZ Outdoors & Freedom Party', site: 'https://outdoorsparty.co.nz/', focus: ['Environment', 'Outdoors & freedom'], profile: '/parties/nz-outdoors' },
  { name: 'The Opportunity Party (TOP)', site: 'https://www.opportunity.org.nz/', focus: ['Economy', 'Climate', 'Housing'], profile: '/parties/top' },
  { name: 'Vision New Zealand', site: 'https://www.vision.org.nz/', focus: ['Economy', 'Māori affairs', 'Social values'], profile: '/parties/vision-nz' },
  { name: 'Women’s Rights Party', site: 'https://womensrightsparty.nz/', focus: ['Women’s rights', 'Education', 'Health'], profile: '/parties/womens-rights' },
]
const EC_REGISTER_URL = 'https://elections.nz/democracy-in-nz/political-parties-in-new-zealand/register-of-political-parties'

// Non-parliamentary parties that already have a full profile — shown as full
// PartyCards (identical theme to the six), not neutral list rows.
const PROFILED_NON_PARL: (keyof typeof PARTY_PROFILES)[] = [
  'animal-justice', 'alcp', 'conservative', 'nz-outdoors', 'top', 'vision-nz', 'womens-rights',
]

export default function PartiesPage() {
  const governing   = PARTY_DIRECTORY_ORDER.filter((s) => PARTY_STATUS[s] === 'governing')
  const opposition  = PARTY_DIRECTORY_ORDER.filter((s) => PARTY_STATUS[s] === 'opposition')
  const others      = PARTY_DIRECTORY_ORDER.filter((s) => PARTY_STATUS[s] !== 'governing' && PARTY_STATUS[s] !== 'opposition')
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
            <div style={{ flex: '1 1 240px', minWidth: 0 }}>
              <div style={{
                fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em',
                textTransform: 'uppercase', color: TERTIARY,
                fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                marginBottom: 4,
              }}>
                54th Parliament — {TOTAL_SEATS} seats total
              </div>
              {/* Seat bar — fills the column up to 400px, shrinks on narrow screens */}
              <div style={{ display: 'flex', gap: 2, height: 10, width: '100%', maxWidth: 400, borderRadius: 999, overflow: 'hidden' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: others.length ? 52 : 0 }}>
          {opposition.map((slug) => (
            <PartyCard key={slug} slug={slug} />
          ))}
        </div>

        {/* ── Registered but not in Parliament — the parties fighting to get in ── */}
        <SectionTitle label="Contesting 2026 — not currently in Parliament" count={REGISTERED_NON_PARLIAMENTARY.length} />
        <OtherRegisteredParties />

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
  const leaderSlug   = mpSlugForName(party.leader)
  const leaderPhoto  = leaderSlug ? MP_PROFILES[leaderSlug].photo : party.leaderPhoto
  const coLeaderSlug = party.coLeader ? mpSlugForName(party.coLeader) : null
  const coLeaderPhoto = coLeaderSlug ? MP_PROFILES[coLeaderSlug].photo : undefined

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
              {status === 'governing' ? 'Governing' : status === 'opposition' ? 'Opposition' : 'Not in Parliament'}
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
            {/* Leader face — falls back to coloured initials when we have no photo */}
            <div style={{ display: 'flex', flexShrink: 0 }}>
              <Avatar name={party.leader} party={slug} src={leaderPhoto} size="md" face />
              {party.coLeader && (
                <div style={{ marginLeft: -12, borderRadius: '50%', boxShadow: `0 0 0 2.5px ${SURFACE}` }}>
                  <Avatar name={party.coLeader} party={slug} src={coLeaderPhoto} size="md" face />
                </div>
              )}
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

// ─── Registered parties not in Parliament — neutral, equal, sourced ─────────────

function OtherRegisteredParties() {
  return (
    <div>
      <p style={{ fontSize: 14, color: SECONDARY, fontFamily: 'var(--font-manrope), system-ui, sans-serif', lineHeight: 1.6, margin: '0 0 18px', maxWidth: 720 }}>
        About ten parties are registered with the Electoral Commission to contest the 2026 party vote but hold no seats in the current Parliament. They’re listed here <b style={{ color: INK }}>equally and alphabetically</b> — Arapono doesn’t rank or endorse any party.
      </p>

      {/* Ones we've fully profiled — same card as the parties in Parliament */}
      {PROFILED_NON_PARL.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 24 }}>
          {PROFILED_NON_PARL.map((slug) => (
            <PartyCard key={slug} slug={slug} />
          ))}
        </div>
      )}

      {/* The rest — neutral rows with official site + policy focus, until they're profiled too */}
      {REGISTERED_NON_PARLIAMENTARY.some((p) => !p.profile) && (
      <p style={{ fontSize: 13, fontWeight: 600, color: SECONDARY, fontFamily: 'var(--font-manrope), system-ui, sans-serif', margin: '0 0 12px' }}>
        Full profiles for the remaining registered parties are on the way — for now, their official site and policy focus:
      </p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 268px), 1fr))', gap: 12 }}>
        {REGISTERED_NON_PARLIAMENTARY.filter((p) => !p.profile).map((p) => (
          <div key={p.name} style={{ display: 'flex', flexDirection: 'column', gap: 11, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: '#d8d5cf', flexShrink: 0, marginTop: 5 }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: INK, fontFamily: 'var(--font-manrope), system-ui, sans-serif', lineHeight: 1.3 }}>{p.name}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: TERTIARY, fontFamily: 'var(--font-manrope), system-ui, sans-serif', marginTop: 2 }}>Registered party · no current seats</span>
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {p.focus.map((f) => (
                <span key={f} style={{ fontSize: 10.5, fontWeight: 600, background: '#f1efeb', color: SECONDARY, borderRadius: 999, padding: '2px 9px', fontFamily: 'var(--font-manrope), system-ui, sans-serif' }}>{f}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              {p.profile && (
                <Link href={p.profile} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 800, color: INK, fontFamily: 'var(--font-manrope), system-ui, sans-serif', textDecoration: 'none' }}>
                  View profile <ArrowRight style={{ width: 13, height: 13 }} />
                </Link>
              )}
              <a href={p.site} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: JADE, fontFamily: 'var(--font-manrope), system-ui, sans-serif', textDecoration: 'none' }}>
                Official website <ArrowUpRight style={{ width: 13, height: 13 }} />
              </a>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: 'var(--font-manrope), system-ui, sans-serif', lineHeight: 1.6, margin: '16px 0 0', maxWidth: 760 }}>
        Party names from the Electoral Commission’s register of registered political parties (as at 1 July 2026); official websites and policy-focus areas are taken from each party’s own site. Further registered parties will appear here as we verify them; three more — the Alliance Party, New Zealand Loyal and Te Tai Tokerau Party — have applied and are under consideration ahead of the 6 August 2026 registration deadline.{' '}
        <a href={EC_REGISTER_URL} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 700, textDecoration: 'none' }}>See the full register ↗</a>
      </p>
    </div>
  )
}
