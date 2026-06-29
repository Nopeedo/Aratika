/**
 * /parties/[slug] — Individual party profile
 *
 * Template for all party pages, driven by parties-data.ts. Overview, history,
 * core values, and key policy areas are sourced content; the caucus/MP list is
 * a placeholder pending the Parliament API (only MPs with full profiles link out).
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Users, Calendar, Landmark,
  ScrollText, Star, ExternalLink, Globe, CheckCircle2,
} from 'lucide-react'
import { PARTY_PROFILES, PARTY_DIRECTORY_ORDER } from '@/constants/parties-data'
import { CURRENT_SEATS, TOTAL_SEATS, PARTY_STATUS } from '@/constants/parties'
import { MP_PROFILES } from '@/constants/mps-data'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import { PartySlug, PolicyTopic } from '@/types'
import { Avatar } from '@/components/ui/avatar'
import { SectionDivider } from '@/components/ui/section-divider'
import { BookmarkButton } from '@/components/bookmarks/bookmark-button'
import { PartyLegislativeRecord } from '@/components/parties/legislative-record'

// ─── Design tokens ────────────────────────────────────────────────────────────

const INK       = '#0c0e12'
const SECONDARY = '#6b7078'
const TERTIARY  = '#9aa0aa'
const BORDER    = '#e9e7e2'
const SURFACE   = '#f8fafc'
const JADE      = '#1F8A4C'
const MANROPE   = 'var(--font-manrope), system-ui, sans-serif'
const DISPLAY   = 'var(--font-space-grotesk), system-ui, sans-serif'

// ─── Static generation ────────────────────────────────────────────────────────

export function generateStaticParams() {
  return PARTY_DIRECTORY_ORDER.map((slug) => ({ slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const party = PARTY_PROFILES[slug as PartySlug]
  if (!party || slug === 'independent') return { title: 'Party not found' }
  return {
    title: `${party.name} — ${party.fullName}`,
    description: party.tagline,
  }
}

// Find the MP profile slug for a given person name (so the leader links out
// only when a full profile actually exists).
function mpSlugForName(name: string): string | null {
  const entry = Object.values(MP_PROFILES).find((mp) => mp.name === name)
  return entry ? entry.slug : null
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#ffffff', border: `1px solid ${BORDER}`, borderRadius: 18,
      padding: '22px 24px', boxShadow: '0 2px 4px rgba(12,14,18,.03)', ...style,
    }}>
      {children}
    </div>
  )
}

function SectionHeading({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
      <Icon style={{ width: 17, height: 17, color: JADE }} />
      <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>{title}</h2>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PartyProfilePage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const party = PARTY_PROFILES[slug as PartySlug]
  if (!party || slug === 'independent') notFound()

  const seats        = CURRENT_SEATS[slug as PartySlug]
  const status       = PARTY_STATUS[slug as PartySlug]
  const seatShare    = ((seats / TOTAL_SEATS) * 100).toFixed(1)
  const leaderSlug   = mpSlugForName(party.leader)
  const coLeaderSlug = party.coLeader ? mpSlugForName(party.coLeader) : null

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>

      {/* ═══════════════ Header band ═══════════════ */}
      <div className="bg-dot-grid" style={{ background: '#ffffff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ height: 6, background: party.color }} />

        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 36px 36px' }}>

          <Link href="/parties" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 13, fontWeight: 600, color: SECONDARY, textDecoration: 'none',
            fontFamily: MANROPE, marginBottom: 24,
          }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> All parties
          </Link>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 28, flexWrap: 'wrap' }}>
            {/* Left: identity */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <h1 style={{
                fontSize: 40, fontWeight: 800, letterSpacing: '-.02em', color: INK,
                fontFamily: MANROPE, lineHeight: 1.05, margin: '0 0 4px',
              }}>
                {party.name}
              </h1>
              <div style={{ fontSize: 15, fontWeight: 500, color: TERTIARY, fontFamily: MANROPE, marginBottom: 16 }}>
                {party.fullName}
              </div>

              {/* Status chips */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 700,
                  background: party.color, color: party.textColor,
                  borderRadius: 999, padding: '4px 12px', fontFamily: MANROPE,
                }}>
                  {status === 'governing' ? 'Governing' : status === 'opposition' ? 'Opposition' : 'Not in Parliament'}
                </span>
                {party.coalitionRole && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    fontSize: 12, fontWeight: 600, color: SECONDARY,
                    border: `1px solid ${BORDER}`, borderRadius: 999, padding: '3px 11px', fontFamily: MANROPE,
                  }}>
                    {party.coalitionRole}
                  </span>
                )}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 600, color: SECONDARY,
                  border: `1px solid ${BORDER}`, borderRadius: 999, padding: '3px 11px', fontFamily: MANROPE,
                }}>
                  <Calendar style={{ width: 12, height: 12 }} /> Founded {party.founded}
                </span>
              </div>

              <p style={{ fontSize: 15, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, maxWidth: 520, margin: '0 0 18px' }}>
                {party.tagline}
              </p>

              {/* Links */}
              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                <a href={party.website} target="_blank" rel="noopener noreferrer" style={btnPrimary}>
                  <Globe style={{ width: 15, height: 15 }} /> Official website
                </a>
                <a href={party.parliamentUrl} target="_blank" rel="noopener noreferrer" style={btnSecondary}>
                  parliament.nz <ArrowUpRight style={{ width: 14, height: 14 }} />
                </a>
                <BookmarkButton entity={{
                  kind: 'party', refId: slug, label: party.name,
                  sublabel: 'Political party', href: `/parties/${slug}`, accent: party.color,
                }} />
              </div>
            </div>

            {/* Right: seat figure */}
            <div style={{
              background: '#ffffff', border: `1px solid ${BORDER}`, borderRadius: 18,
              padding: '20px 26px', boxShadow: '0 2px 4px rgba(12,14,18,.03)',
              textAlign: 'center', alignSelf: 'flex-start', minWidth: 150,
            }}>
              <div style={{ fontSize: 54, fontWeight: 700, letterSpacing: '-.03em', color: INK, fontFamily: DISPLAY, lineHeight: 1 }}>
                {seats}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginTop: 4 }}>
                Seats
              </div>
              <div style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
                {seatShare}% of {TOTAL_SEATS}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ Body ═══════════════ */}
      <div style={{
        maxWidth: 1080, margin: '0 auto', padding: '36px 36px 64px',
        display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 28, alignItems: 'start',
      }}>

        {/* ── Main column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Overview */}
          <Card>
            <SectionHeading icon={Landmark} title="Overview" />
            <p style={{ fontSize: 14.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.7, margin: 0 }}>
              {party.overview}
            </p>
          </Card>

          {/* History */}
          <Card>
            <SectionHeading icon={ScrollText} title="History" />
            <p style={{ fontSize: 14.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.7, margin: 0 }}>
              {party.history}
            </p>
            <div style={{ marginTop: 14, fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, fontStyle: 'italic' }}>
              {party.founded_note}
            </div>
          </Card>

          {/* Core values */}
          <Card>
            <SectionHeading icon={CheckCircle2} title="Core values" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {party.coreValues.map((v) => (
                <div key={v} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: party.color, flexShrink: 0, marginTop: 7 }} />
                  <span style={{ fontSize: 14, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.5 }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Key policy areas */}
          <Card>
            <SectionHeading icon={Star} title="Key policy areas" />
            <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 14px', lineHeight: 1.5 }}>
              Policy topics most associated with {party.name}. Tap any topic to compare every party&apos;s position side by side.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {party.keyPolicyAreas.map((topicKey) => {
                const topic = POLICY_TOPICS[topicKey as PolicyTopic]
                if (!topic) return null
                return (
                  <Link key={topicKey} href={`/policies/${topicKey}`} style={{ textDecoration: 'none' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: 13, fontWeight: 600, color: INK,
                      background: SURFACE, border: `1px solid ${BORDER}`,
                      borderRadius: 999, padding: '6px 14px', fontFamily: MANROPE,
                    }}>
                      {topic.label}
                      <ArrowRight style={{ width: 13, height: 13, color: TERTIARY }} />
                    </span>
                  </Link>
                )
              })}
            </div>
          </Card>

          {/* Legislative record this term */}
          <PartyLegislativeRecord party={slug as PartySlug} partyName={party.name} />
        </div>

        {/* ── Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Leadership */}
          <Card style={{ padding: '20px 22px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 14 }}>
              Leadership
            </div>
            <LeaderRow name={party.leader} title={party.leaderTitle} party={slug as PartySlug} photo={leaderSlug ? MP_PROFILES[leaderSlug].photo : party.leaderPhoto} href={leaderSlug ? `/mps/${leaderSlug}` : null} />
            {party.coLeader && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                <LeaderRow name={party.coLeader} title={party.coLeaderTitle ?? 'Co-leader'} party={slug as PartySlug} photo={coLeaderSlug ? MP_PROFILES[coLeaderSlug].photo : undefined} href={coLeaderSlug ? `/mps/${coLeaderSlug}` : null} />
              </div>
            )}
          </Card>

          {/* At a glance */}
          <Card style={{ padding: '20px 22px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 8 }}>
              At a glance
            </div>
            <GlanceRow label="Total seats"     value={String(seats)} />
            <GlanceRow label="Electorate seats" value={String(party.electorateSeats)} />
            <GlanceRow label="List seats"       value={String(party.listSeats)} />
            <GlanceRow label="Share of House"   value={`${seatShare}%`} />
            <GlanceRow label="Founded"          value={String(party.founded)} last />
          </Card>

          {/* Caucus (placeholder) */}
          <Card style={{ padding: '20px 22px' }}>
            <SectionHeading icon={Users} title="Caucus" />
            <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.5, margin: '0 0 12px' }}>
              {party.name} holds <b style={{ color: INK }}>{seats}</b> seats in the 54th Parliament.
            </p>
            {leaderSlug ? (
              <Link href={`/mps/${leaderSlug}`} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, textDecoration: 'none',
              }}>
                <Avatar name={party.leader} party={slug as PartySlug} src={leaderSlug ? MP_PROFILES[leaderSlug].photo : undefined} size="sm" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: INK, fontFamily: MANROPE }}>{party.leader}</div>
                  <div style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE }}>View profile</div>
                </div>
                <ArrowRight style={{ width: 14, height: 14, color: TERTIARY }} />
              </Link>
            ) : null}
            <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.5, margin: '12px 0 0', fontStyle: 'italic' }}>
              Full caucus list will appear here once the Parliament API integration is complete.
            </p>
          </Card>
        </div>
      </div>

      {/* ═══════════════ Source attribution ═══════════════ */}
      <div style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '20px 36px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <SectionDivider type="official" label="Sources" />
          <p style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>
            Seat counts from the 2023 General Election (Electoral Commission). Party background from{' '}
            <a href={party.parliamentUrl} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 600 }}>
              parliament.nz <ArrowUpRight style={{ width: 11, height: 11, display: 'inline' }} />
            </a>{' '}and official party records. Leadership details pending Parliament API verification.
            {party.leaderPhoto && party.leaderPhotoCredit && (
              <>{' '}Leader photo: {party.leaderPhotoCredit}{party.leaderPhotoLicense ? `, ${party.leaderPhotoLicense}` : ''}
                {party.leaderPhotoSourceUrl && (<>{' '}<a href={party.leaderPhotoSourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 600 }}>(source <ArrowUpRight style={{ width: 10, height: 10, display: 'inline' }} />)</a></>)}.</>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar helpers ──────────────────────────────────────────────────────────

function LeaderRow({ name, title, party, photo, href }: {
  name: string; title: string; party: PartySlug; photo?: string; href: string | null
}) {
  const inner = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <Avatar name={name} party={party} src={photo} size="md" />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.2 }}>{name}</div>
        <div style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 2 }}>{title}</div>
      </div>
      {href && <ArrowRight style={{ width: 14, height: 14, color: TERTIARY }} />}
    </div>
  )
  return href
    ? <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>
    : inner
}

function GlanceRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '9px 0', borderBottom: last ? 'none' : `1px solid ${BORDER}`,
    }}>
      <span style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: INK, fontFamily: DISPLAY }}>{value}</span>
    </div>
  )
}

// ─── Button styles ────────────────────────────────────────────────────────────

const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '9px 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 700,
  fontFamily: MANROPE, textDecoration: 'none', whiteSpace: 'nowrap',
}
const btnPrimary: React.CSSProperties = { ...btnBase, background: JADE, color: '#ffffff' }
const btnSecondary: React.CSSProperties = { ...btnBase, background: '#ffffff', border: `1px solid ${BORDER}`, color: INK }
