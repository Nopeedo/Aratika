/**
 * /mps/[slug] — Individual MP profile
 *
 * Template for all ~123 MP profiles. Currently populated with one example
 * (Christopher Luxon). Verified biographical facts are shown normally;
 * dynamic data (bills, votes, committees, interests) sits under a visible
 * "example data" banner until the Parliament API integration replaces it.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, ArrowUpRight, MapPin, Calendar, Briefcase,
  Landmark, FileText, Vote, Users, ScrollText, ExternalLink,
  Bookmark, Lock, ShieldCheck, Mail, Globe, PenLine,
} from 'lucide-react'
import { MP_PROFILES, MP_SLUGS } from '@/constants/mps-data'
import { PARTY_PROFILES } from '@/constants/parties-data'
import { StatusBadge } from '@/components/ui/badge'
import { MPCard } from '@/components/mp/mp-card'
import { SectionDivider } from '@/components/ui/section-divider'
import { formatDateShort, formatNumber } from '@/lib/utils/format'

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
  return MP_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const mp = MP_PROFILES[slug]
  if (!mp) return { title: 'MP not found' }
  const party = PARTY_PROFILES[mp.party]
  return {
    title: `${mp.name} — ${mp.title ?? `MP for ${mp.electorate}`}`,
    description: `${mp.name}, ${party.name} ${mp.role === 'electorate' ? `MP for ${mp.electorate}` : 'list MP'}.${mp.bio ? ` ${mp.bio.slice(0, 140)}…` : ''}`,
  }
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function ExampleTag() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase',
      background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA',
      borderRadius: 999, padding: '2px 8px', fontFamily: MANROPE,
      verticalAlign: 'middle',
    }}>
      Example data
    </span>
  )
}

function SectionHeading({ icon: Icon, title, example }: { icon: React.ElementType; title: string; example?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
      <Icon style={{ width: 17, height: 17, color: JADE }} />
      <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>
        {title}
      </h2>
      {example && <ExampleTag />}
    </div>
  )
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MPProfilePage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const mp = MP_PROFILES[slug]
  if (!mp) notFound()

  const party = PARTY_PROFILES[mp.party]

  // "Rich" profiles (currently Luxon) have detailed sections; basic profiles
  // show a clean "detail being added" notice instead of empty/placeholder cards.
  const hasDetail = !!(
    mp.bio ||
    (mp.portfolios && mp.portfolios.length) ||
    (mp.sponsoredBills && mp.sponsoredBills.length) ||
    (mp.recentVotes && mp.recentVotes.length)
  )

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>

      {/* ═══════════════ Header band ═══════════════ */}
      <div className="bg-dot-grid" style={{ background: '#ffffff', borderBottom: `1px solid ${BORDER}` }}>
        {/* Party colour strip */}
        <div style={{ height: 5, background: party.color }} />

        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 36px 36px' }}>

          {/* Back link */}
          <Link href="/mps" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 13, fontWeight: 600, color: SECONDARY, textDecoration: 'none',
            fontFamily: MANROPE, marginBottom: 24,
          }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> All MPs
          </Link>

          {/* Identity row — FUT-style card + actions (trial format) */}
          <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <MPCard mp={mp} party={party} />

            <div style={{ flex: 1, minWidth: 240, paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {mp.fullName !== mp.name && (
                <div style={{ fontSize: 14, fontWeight: 500, color: TERTIARY, fontFamily: MANROPE }}>
                  Full name: {mp.fullName}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <StatusBadge status={mp.status} />
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 600, color: SECONDARY,
                  border: `1px solid ${BORDER}`, borderRadius: 999, padding: '3px 11px', fontFamily: MANROPE,
                }}>
                  {mp.role === 'electorate'
                    ? <><MapPin style={{ width: 12, height: 12 }} /> {mp.electorate} electorate</>
                    : <><Landmark style={{ width: 12, height: 12 }} /> List MP</>}
                </span>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                {mp.status === 'active' && (() => {
                  const isMinister = !!mp.title && /minister/i.test(mp.title)
                  return (
                    <Link
                      href={`/take-action/${isMinister ? 'minister' : 'mp'}?to=${mp.slug}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, fontFamily: MANROPE, padding: '9px 15px', borderRadius: 11, background: '#1F8A4C', color: '#fff', textDecoration: 'none' }}
                    >
                      <PenLine style={{ width: 15, height: 15 }} /> Write to this {isMinister ? 'Minister' : 'MP'}
                    </Link>
                  )
                })()}
                <Link href={`/parties/${mp.party}`} style={btnPrimary}>
                  View {party.name} party <ArrowRight style={{ width: 15, height: 15 }} />
                </Link>
                {mp.role === 'electorate' && mp.electorate && (
                  <Link href={`/map?search=${encodeURIComponent(mp.electorate)}`} style={btnSecondary}>
                    <MapPin style={{ width: 15, height: 15 }} /> View on map
                  </Link>
                )}
                <span style={{ ...btnSecondary, color: TERTIARY, cursor: 'default' }} title="Bookmarking is a Premium feature">
                  <Lock style={{ width: 13, height: 13 }} />
                  <Bookmark style={{ width: 15, height: 15 }} /> Bookmark
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ Status notice (basic profiles only) ═══════════════ */}
      {!hasDetail && (
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '20px 36px 0' }}>
          <div style={{
            borderRadius: 12, padding: '12px 16px',
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: '#eff6ff', border: '1px solid #bfdbfe',
          }}>
            <FileText style={{ width: 16, height: 16, color: '#1e40af', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12.5, color: '#1e3a8a', fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>
              <b>Verified summary profile.</b> Core details (name, party, electorate) are confirmed from
              official sources. This MP&apos;s full biography, roles and committees are being added —
              see their official page on parliament.nz in the meantime.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════ Body ═══════════════ */}
      <div style={{
        maxWidth: 1080, margin: '0 auto', padding: '28px 36px 64px',
        display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 28, alignItems: 'start',
      }}>

        {/* ── Main column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Biography */}
          {mp.bio && (
          <Card>
            <SectionHeading icon={ScrollText} title="Biography" />
            <p style={{ fontSize: 14.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.7, margin: 0 }}>
              {mp.bio}
            </p>
            {mp.priorCareer && (
              <div style={{ marginTop: 16, padding: '12px 14px', background: SURFACE, borderRadius: 10, border: `1px solid ${BORDER}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                  <Briefcase style={{ width: 13, height: 13, color: TERTIARY }} />
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>
                    Before Parliament
                  </span>
                </div>
                <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>
                  {mp.priorCareer}
                </p>
              </div>
            )}
          </Card>
          )}

          {/* Portfolios */}
          {mp.portfolios && mp.portfolios.length > 0 && (
          <Card>
            <SectionHeading icon={Landmark} title="Roles & responsibilities" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mp.portfolios.map((p) => (
                <div key={p} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', background: SURFACE, borderRadius: 10, border: `1px solid ${BORDER}`,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: party.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: INK, fontFamily: MANROPE }}>{p}</span>
                </div>
              ))}
            </div>
          </Card>
          )}

          {/* Sponsored bills */}
          {mp.sponsoredBills && mp.sponsoredBills.length > 0 && (
          <Card>
            <SectionHeading icon={FileText} title="Sponsored bills" example />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {mp.sponsoredBills.map((bill, i) => (
                <div key={bill.title} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                  padding: '12px 0', borderTop: i === 0 ? 'none' : `1px solid ${BORDER}`,
                }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: INK, fontFamily: MANROPE, lineHeight: 1.4 }}>
                      {bill.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 2 }}>
                      {formatDateShort(bill.date)}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                    background: bill.stage === 'Royal Assent' ? '#e6f4ec' : '#eef2ff',
                    color: bill.stage === 'Royal Assent' ? '#166638' : '#3730a3',
                    borderRadius: 999, padding: '3px 10px', fontFamily: MANROPE,
                  }}>
                    {bill.stage}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          )}

          {/* Recent voting record */}
          {mp.recentVotes && mp.recentVotes.length > 0 && (
          <Card>
            <SectionHeading icon={Vote} title="Recent voting record" example />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {mp.recentVotes.map((v, i) => (
                <div key={v.bill} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                  padding: '11px 0', borderTop: i === 0 ? 'none' : `1px solid ${BORDER}`,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: INK, fontFamily: MANROPE, lineHeight: 1.4 }}>
                      {v.bill}
                    </div>
                    <div style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 2 }}>
                      {formatDateShort(v.date)} · {v.result}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap',
                    background: v.vote === 'Aye' ? '#e6f4ec' : v.vote === 'No' ? '#fdeaea' : '#f1efeb',
                    color: v.vote === 'Aye' ? '#166638' : v.vote === 'No' ? '#b42318' : SECONDARY,
                    borderRadius: 8, padding: '4px 12px', fontFamily: MANROPE,
                  }}>
                    {v.vote}
                  </span>
                </div>
              ))}
            </div>
            {/* Premium upsell for full record */}
            <div style={{
              marginTop: 16, padding: '12px 14px', borderRadius: 10,
              background: 'linear-gradient(145deg,#fff9e6,#fffdf5)', border: '1px solid #fde68a',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Lock style={{ width: 15, height: 15, color: '#b45309', flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: '#92400e', fontFamily: MANROPE, lineHeight: 1.5 }}>
                <b>Premium:</b> see this MP&apos;s complete voting record on every bill, filterable
                by topic and date. <Link href="/subscription" style={{ color: '#b45309', fontWeight: 700 }}>Upgrade →</Link>
              </span>
            </div>
          </Card>
          )}

          {/* Fallback for basic profiles */}
          {!hasDetail && (
          <Card>
            <SectionHeading icon={ScrollText} title="About this MP" />
            <p style={{ fontSize: 14, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.7, margin: 0 }}>
              {`A full biography, ministerial portfolios, sponsored bills and voting record for ${mp.name} are being compiled. In the meantime, view this MP's official record on parliament.nz.`}
            </p>
            <a href={mp.parliamentUrl} target="_blank" rel="noopener noreferrer" style={{ ...btnPrimary, marginTop: 16, display: 'inline-flex' }}>
              Official profile <ArrowUpRight style={{ width: 15, height: 15 }} />
            </a>
          </Card>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* At a glance */}
          <Card style={{ padding: '20px 22px' }}>
            <div style={{
              fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase',
              color: TERTIARY, fontFamily: MANROPE, marginBottom: 14,
            }}>
              At a glance
            </div>
            <Stat icon={MapPin}    label="Electorate"          value={mp.role === 'electorate' ? (mp.electorate ?? '—') : 'List MP'} />
            <Stat icon={Landmark}  label="Role"                value={mp.role === 'electorate' ? 'Electorate MP' : 'List MP'} />
            {mp.enteredParliament && (
              <Stat icon={Calendar} label="Entered Parliament" value={String(mp.enteredParliament)} />
            )}
            {mp.bornYear && (
              <Stat icon={Users} label="Born" value={`${mp.bornYear}${mp.bornPlace ? `, ${mp.bornPlace}` : ''}`} />
            )}
            {typeof mp.electorateMajority === 'number' && (
              <Stat icon={Vote} label="2023 majority" value={formatNumber(mp.electorateMajority)} />
            )}
          </Card>

          {/* Committees */}
          {mp.committees && (
          <Card style={{ padding: '20px 22px' }}>
            <SectionHeading icon={Users} title="Committees" />
            {mp.committees.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {mp.committees.map((c) => (
                  <span key={c} style={{
                    fontSize: 12, fontWeight: 600, color: SECONDARY,
                    background: SURFACE, border: `1px solid ${BORDER}`,
                    borderRadius: 999, padding: '4px 11px', fontFamily: MANROPE,
                  }}>
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: TERTIARY, fontFamily: MANROPE, margin: 0 }}>No current committee memberships.</p>
            )}
          </Card>
          )}

          {/* Declared interests */}
          {mp.declaredInterests && mp.declaredInterests.length > 0 && (
          <Card style={{ padding: '20px 22px' }}>
            <SectionHeading icon={ScrollText} title="Declared interests" example />
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mp.declaredInterests.map((d) => (
                <li key={d} style={{ display: 'flex', gap: 8, fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.4 }}>
                  <span style={{ color: TERTIARY }}>•</span> {d}
                </li>
              ))}
            </ul>
          </Card>
          )}

          {/* Contact & links */}
          <Card style={{ padding: '20px 22px' }}>
            <div style={{
              fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase',
              color: TERTIARY, fontFamily: MANROPE, marginBottom: 14,
            }}>
              Official links
            </div>
            <LinkRow icon={ExternalLink} label="Profile on parliament.nz" href={mp.parliamentUrl} />
            {mp.website && <LinkRow icon={Globe} label="Party website" href={mp.website} />}
            {mp.email   && <LinkRow icon={Mail}  label={mp.email} href={`mailto:${mp.email}`} />}
          </Card>
        </div>
      </div>

      {/* ═══════════════ Source attribution ═══════════════ */}
      <div style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '20px 36px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <SectionDivider type="official" label="Sources" />
          <p style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>
            Biographical details sourced from{' '}
            <a href={mp.parliamentUrl} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 600 }}>
              parliament.nz <ArrowUpRight style={{ width: 11, height: 11, display: 'inline' }} />
            </a>{' '}
            and public record. Voting records and sponsored bills will follow with the Parliament API integration.
            {mp.photo && mp.photoCredit && (
              <>
                {' '}Photo: {mp.photoCredit}
                {mp.photoLicense ? `, ${mp.photoLicense}` : ''}
                {mp.photoSourceUrl && (
                  <>
                    {' '}
                    <a href={mp.photoSourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 600 }}>
                      (source <ArrowUpRight style={{ width: 10, height: 10, display: 'inline' }} />)
                    </a>
                  </>
                )}.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar stat row ─────────────────────────────────────────────────────────

function Stat({ icon: Icon, label, value, example }: { icon: React.ElementType; label: string; value: string; example?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
      <Icon style={{ width: 15, height: 15, color: TERTIARY, flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: TERTIARY, fontFamily: MANROPE }}>
          {label}{example && <> <ExampleTag /></>}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: INK, fontFamily: MANROPE, marginTop: 1 }}>{value}</div>
      </div>
    </div>
  )
}

function LinkRow({ icon: Icon, label, href }: { icon: React.ElementType; label: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0',
      fontSize: 13, fontWeight: 600, color: INK, textDecoration: 'none', fontFamily: MANROPE,
    }}>
      <Icon style={{ width: 14, height: 14, color: JADE, flexShrink: 0 }} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <ArrowUpRight style={{ width: 13, height: 13, color: TERTIARY }} />
    </a>
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
