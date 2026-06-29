/**
 * /mps/[slug] — Individual MP profile.
 *
 * Built for transparency: alongside the verified biography, the page shows what
 * each MP has actually done this term — the policy areas they shape, bills they've
 * worked on, their voting record, and participation. Everything is factual and
 * sourced; we present the public record with fair context (roles differ) and let
 * the voter judge — we never score or label an MP. Activity data that we haven't
 * ingested yet is shown as "being added", never as a fabricated zero.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, ArrowUpRight, MapPin, Calendar, Briefcase,
  Landmark, FileText, Vote, Users, ScrollText, ExternalLink,
  Lock, Mail, Globe, PenLine, Activity, Scale, Info, MessageSquare, Receipt, BadgeCheck,
} from 'lucide-react'
import { BookmarkButton } from '@/components/bookmarks/bookmark-button'
import { PREMIUM_ENABLED } from '@/constants/features'
import { MP_INTERESTS } from '@/constants/mps-interests'
import { MP_EXPENSES } from '@/constants/mps-expenses'
import { MP_MEMBERS_BILLS } from '@/constants/mps-members-bills'
import { MP_PASSED_BILLS, MP_GOV_BILLS, BILL_ACTIVITY_META } from '@/constants/mps-bill-activity'
import { MP_PROFILES, MP_SLUGS } from '@/constants/mps-data'
import { PARTY_PROFILES } from '@/constants/parties-data'
import { CURRENT_TERM } from '@/constants/term'
import { policiesForMP } from '@/lib/mps/policy-links'
import { StatusBadge } from '@/components/ui/badge'
import { MPCard } from '@/components/mp/mp-card'
import { SectionDivider } from '@/components/ui/section-divider'
import { formatNumber } from '@/lib/utils/format'

// ─── Design tokens ────────────────────────────────────────────────────────────
const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const DISPLAY = 'var(--font-space-grotesk), system-ui, sans-serif'
const billGroupLabel: React.CSSProperties = { fontSize: 11.5, fontWeight: 800, letterSpacing: '.02em', textTransform: 'uppercase', color: '#9aa0aa', fontFamily: MANROPE, margin: '0 0 7px' }

export function generateStaticParams() {
  return MP_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const mp = MP_PROFILES[slug]
  if (!mp) return { title: 'MP not found' }
  const party = PARTY_PROFILES[mp.party]
  return {
    title: `${mp.name} — ${mp.title ?? (mp.role === 'electorate' ? `MP for ${mp.electorate}` : 'List MP')}`,
    description: `${mp.name}, ${party.name} ${mp.role === 'electorate' ? `MP for ${mp.electorate}` : 'list MP'} — roles, bills, voting record and impact this term.`,
  }
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────
function ComingTag() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: 999, padding: '2px 7px', fontFamily: MANROPE, verticalAlign: 'middle' }}>
      Being added
    </span>
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

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18, padding: '22px 24px', boxShadow: '0 2px 4px rgba(12,14,18,.03)', ...style }}>{children}</div>
}

function ComingNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 9, padding: '12px 14px', background: SURFACE, border: `1px dashed ${TERTIARY}`, borderRadius: 11 }}>
      <Info style={{ width: 15, height: 15, color: SECONDARY, flexShrink: 0, marginTop: 1 }} />
      <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>{children}</p>
    </div>
  )
}

function ImpactTile({ label, value }: { label: string; value: number | null }) {
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 14px', minWidth: 0 }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: value === null ? TERTIARY : INK, fontFamily: DISPLAY, lineHeight: 1 }}>
        {value === null ? '—' : value}
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: SECONDARY, fontFamily: MANROPE, marginTop: 6, lineHeight: 1.3 }}>{label}</div>
      {value === null && <div style={{ marginTop: 5 }}><ComingTag /></div>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function MPProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const mp = MP_PROFILES[slug]
  if (!mp) notFound()

  const party = PARTY_PROFILES[mp.party]
  const isActive = mp.status === 'active'
  const isMinister = !!mp.title && /minister/i.test(mp.title)
  const policies = policiesForMP(mp)

  // 54th-Parliament bill activity from the official bills API (mps-bill-activity.ts)
  // + the members' bill ballot (mps-members-bills.ts).
  const passedBills = MP_PASSED_BILLS[mp.slug] ?? []          // members' bills now law
  const govBills = MP_GOV_BILLS[mp.slug] ?? []                // government bills in charge (Ministers)
  const proposedBills = MP_MEMBERS_BILLS[mp.slug] ?? []       // members' bill in the ballot
  const ballotBills = (mp.membersBills && mp.membersBills.length)
    ? mp.membersBills.map((b) => ({ title: b.title, status: b.status }))
    : proposedBills.map((b) => ({ title: b.title, status: 'In ballot' }))
  const hasBills = passedBills.length > 0 || govBills.length > 0 || ballotBills.length > 0
  const notableVotes = mp.notableVotes ?? []

  const hasAnyDetail = !!(mp.bio || mp.portfolios?.length || mp.committees?.length)

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>

      {/* ═══════════════ Header band ═══════════════ */}
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ height: 5, background: party.color }} />
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 36px 36px' }}>
          <Link href="/mps" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: SECONDARY, textDecoration: 'none', fontFamily: MANROPE, marginBottom: 24 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> All MPs
          </Link>

          <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <MPCard mp={mp} party={party} />
            <div style={{ flex: 1, minWidth: 240, paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {mp.fullName !== mp.name && (
                <div style={{ fontSize: 14, fontWeight: 500, color: TERTIARY, fontFamily: MANROPE }}>Full name: {mp.fullName}</div>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <StatusBadge status={mp.status} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: SECONDARY, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '3px 11px', fontFamily: MANROPE }}>
                  {mp.role === 'electorate'
                    ? <><MapPin style={{ width: 12, height: 12 }} /> {mp.electorate} electorate</>
                    : <><Landmark style={{ width: 12, height: 12 }} /> List MP</>}
                </span>
                {mp.title && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: party.color, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '3px 11px', fontFamily: MANROPE }}>{mp.title}</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                {isActive && (
                  <Link href={`/take-action/${isMinister ? 'minister' : 'mp'}?to=${mp.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, fontFamily: MANROPE, padding: '9px 15px', borderRadius: 11, background: JADE, color: '#fff', textDecoration: 'none' }}>
                    <PenLine style={{ width: 15, height: 15 }} /> Write to this {isMinister ? 'Minister' : 'MP'}
                  </Link>
                )}
                <Link href={`/parties/${mp.party}`} style={btnPrimary}>View {party.name} party <ArrowRight style={{ width: 15, height: 15 }} /></Link>
                {mp.role === 'electorate' && mp.electorate && (
                  <Link href={`/map?search=${encodeURIComponent(mp.electorate)}`} style={btnSecondary}><MapPin style={{ width: 15, height: 15 }} /> View on map</Link>
                )}
                <BookmarkButton entity={{
                  kind: 'mp', refId: mp.slug, label: mp.name,
                  sublabel: mp.role === 'electorate' ? `MP for ${mp.electorate}` : `${party.name} list MP`,
                  href: `/mps/${mp.slug}`, accent: party.color,
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ Body ═══════════════ */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 36px 64px', display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 28, alignItems: 'start' }}>

        {/* ── Main column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Biography */}
          {mp.bio && (
            <Card>
              <SectionHeading icon={ScrollText} title="Biography" />
              <p style={{ fontSize: 14.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.7, margin: 0 }}>{mp.bio}</p>
              {mp.bioSourceUrl && (
                <a href={mp.bioSourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, color: TERTIARY, fontFamily: MANROPE, textDecoration: 'none', marginTop: 8 }}>
                  Source: Wikipedia <ArrowUpRight style={{ width: 11, height: 11 }} />
                </a>
              )}
              {mp.priorCareer && (
                <div style={{ marginTop: 16, padding: '12px 14px', background: SURFACE, borderRadius: 10, border: `1px solid ${BORDER}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                    <Briefcase style={{ width: 13, height: 13, color: TERTIARY }} />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>Before Parliament</span>
                  </div>
                  <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>{mp.priorCareer}</p>
                </div>
              )}
            </Card>
          )}

          {/* Impact this term */}
          {isActive && (
            <Card>
              <SectionHeading icon={Activity} title="Impact this term" />
              <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, margin: '-6px 0 14px' }}>{CURRENT_TERM.label} · {CURRENT_TERM.sinceLabel}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                <ImpactTile label="Roles & spokesperson areas" value={mp.portfolios?.length ?? 0} />
                <ImpactTile label="Select committees" value={mp.committees?.length ?? 0} />
                {govBills.length > 0 && <ImpactTile label="Government bills in charge" value={govBills.length} />}
                {passedBills.length > 0 && <ImpactTile label="Members’ bills passed into law" value={passedBills.length} />}
                <ImpactTile label="Members’ bills in the ballot" value={ballotBills.length} />
                <ImpactTile label="Written questions" value={typeof mp.writtenQuestions === 'number' ? mp.writtenQuestions : null} />
                <ImpactTile label="Speeches in the House" value={typeof mp.speeches === 'number' ? mp.speeches : null} />
              </div>
              <div style={{ marginTop: 14 }}>
                <ComingNote>
                  These are factual counts from the public record — not a score. MPs do different jobs: {isMinister ? 'ministers run portfolios rather than sponsoring members’ bills' : 'list and electorate MPs, ministers and backbenchers all contribute differently'}, and MPs first elected in 2023 have a shorter record. We show the facts so <b>you</b> can decide what counts as doing enough.
                </ComingNote>
              </div>
            </Card>
          )}

          {/* Policies they shape & why */}
          {isActive && (
            <Card>
              <SectionHeading icon={Scale} title="Policies they shape — and why" />
              {policies.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {policies.map((p) => (
                    <Link key={p.topic} href={`/policies/${p.topic}`} style={{ textDecoration: 'none' }}>
                      <div className="party-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1px solid ${BORDER}`, borderRadius: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{p.label}</div>
                          <div style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.45, marginTop: 1 }}>{p.reason}</div>
                        </div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 800, color: JADE, fontFamily: MANROPE, whiteSpace: 'nowrap' }}>Where parties stand <ArrowRight style={{ width: 13, height: 13 }} /></span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <ComingNote>
                  We map the policy areas an MP shapes from their portfolios, spokesperson roles and committees. None are on record for {mp.name} yet. See where {party.name} stands across every area on the <Link href={`/parties/${mp.party}`} style={{ color: JADE, fontWeight: 700 }}>party page</Link>.
                </ComingNote>
              )}
            </Card>
          )}

          {/* Bills they've worked on */}
          {isActive && (
            <Card>
              <SectionHeading icon={FileText} title="Bills they’ve worked on" />
              {hasBills ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* Passed into law — a real, verified achievement */}
                  {passedBills.length > 0 && (
                    <div style={{ background: '#f1f9f4', border: '1px solid #c9e6d4', borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                        <BadgeCheck style={{ width: 16, height: 16, color: '#166638' }} />
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: '#166638', fontFamily: MANROPE }}>
                          Members’ bill{passedBills.length > 1 ? 's' : ''} passed into law
                        </span>
                      </div>
                      {passedBills.map((b) => (
                        <div key={b.title} style={{ fontSize: 13.5, fontWeight: 600, color: INK, fontFamily: MANROPE, lineHeight: 1.45, paddingLeft: 23 }}>{b.title} <span style={{ fontSize: 11, fontWeight: 700, color: '#166638' }}>· now an Act</span></div>
                      ))}
                    </div>
                  )}

                  {/* Government bills the MP is in charge of (Ministers) */}
                  {govBills.length > 0 && (
                    <div>
                      <div style={billGroupLabel}>Government bills — member in charge ({govBills.length})</div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {govBills.slice(0, 8).map((b, i) => (
                          <BillRow key={`g-${b.title}`} title={b.title} tag={b.status ?? 'In progress'} tagColor="#3730a3" tagBg="#eef2ff" first={i === 0} />
                        ))}
                      </div>
                      {govBills.length > 8 && (
                        <div style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE, marginTop: 8 }}>
                          +{govBills.length - 8} more — see the <Link href="/bills" style={{ color: JADE, fontWeight: 700 }}>Bills tracker</Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Members' bill in the ballot */}
                  {ballotBills.length > 0 && (
                    <div>
                      <div style={billGroupLabel}>Members’ bill in the ballot (awaiting a first-reading draw)</div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {ballotBills.map((b, i) => (
                          <BillRow key={`m-${b.title}`} title={b.title} tag={b.status} tagColor="#166638" tagBg="#e6f4ec" first={i === 0} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <ComingNote>
                  {isMinister
                    ? `As a minister, ${mp.name} leads government bills in their portfolio rather than members’ bills.`
                    : `${mp.name} doesn’t currently have a members’ bill in the ballot.`} Browse all bills before the House on the <Link href="/bills" style={{ color: JADE, fontWeight: 700 }}>Bills tracker</Link>.
                </ComingNote>
              )}
              <a href={BILL_ACTIVITY_META.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none', marginTop: 14 }}>
                {BILL_ACTIVITY_META.sourceLabel} · as at {BILL_ACTIVITY_META.asOf} <ArrowUpRight style={{ width: 12, height: 12 }} />
              </a>
            </Card>
          )}

          {/* Voting record */}
          {isActive && (
            <Card>
              <SectionHeading icon={Vote} title="Voting record" />
              <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 14px' }}>
                Most votes in Parliament are <b>party votes</b> — MPs vote as a block with their party, so on the large majority of votes {mp.name} voted the same way as {party.name}. The votes that reveal an MP’s own view are <b>conscience (personal) votes</b>, where MPs vote individually.
              </p>
              {notableVotes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {notableVotes.map((v, i) => (
                    <div key={v.title} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '11px 0', borderTop: i === 0 ? 'none' : `1px solid ${BORDER}` }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: INK, fontFamily: MANROPE, lineHeight: 1.4 }}>{v.title}</div>
                        {v.conscience && <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: '#7c3aed', fontFamily: MANROPE }}>Conscience vote</span>}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', background: v.vote === 'For' ? '#e6f4ec' : v.vote === 'Against' ? '#fdeaea' : '#f1efeb', color: v.vote === 'For' ? '#166638' : v.vote === 'Against' ? '#b42318' : SECONDARY, borderRadius: 8, padding: '4px 12px', fontFamily: MANROPE }}>{v.vote}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <ComingNote>{mp.name}’s conscience votes and key divisions this term are being added from the official record (Hansard / parliamentary divisions).</ComingNote>
              )}
              {PREMIUM_ENABLED && (
                <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 10, background: 'linear-gradient(145deg,#fff9e6,#fffdf5)', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Lock style={{ width: 15, height: 15, color: '#b45309', flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: '#92400e', fontFamily: MANROPE, lineHeight: 1.5 }}>
                    <b>Premium:</b> the complete voting record on every division, filterable by topic and date. <Link href="/subscription" style={{ color: '#b45309', fontWeight: 700 }}>Upgrade →</Link>
                  </span>
                </div>
              )}
            </Card>
          )}

          {/* Declared interests — official register */}
          {isActive && MP_INTERESTS[mp.slug] && (
            <Card>
              <SectionHeading icon={Landmark} title="Declared interests" />
              <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, margin: '-6px 0 12px' }}>
                What {mp.name} has declared in the official register — directorships, property, trusts, debts and gifts. Registers actual and potential conflicts of interest; it is not a measure of wealth.
              </p>
              <p style={{ fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.7, margin: 0 }}>{MP_INTERESTS[mp.slug].interests}</p>
              <a href={MP_INTERESTS[mp.slug].sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none', marginTop: 12 }}>
                {MP_INTERESTS[mp.slug].sourceLabel} · as at {MP_INTERESTS[mp.slug].asOf} <ArrowUpRight style={{ width: 12, height: 12 }} />
              </a>
            </Card>
          )}

          {/* Taxpayer-funded expenses — official quarterly disclosure */}
          {isActive && MP_EXPENSES[mp.slug] && (() => {
            const e = MP_EXPENSES[mp.slug]
            const money = (n: number) => `$${Math.round(n).toLocaleString('en-NZ')}`
            return (
              <Card>
                <SectionHeading icon={Receipt} title="Taxpayer-funded expenses" />
                <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, margin: '-6px 0 14px' }}>
                  Travel and accommodation paid by Parliamentary Service for {e.period}. Ministers’ expenses are disclosed separately.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                  {[{ l: 'Total this quarter', v: e.total, big: true }, { l: 'Accommodation', v: e.accommodation }, { l: 'Travel', v: e.travel }].map((t) => (
                    <div key={t.l} style={{ background: t.big ? '#f1f7f3' : SURFACE, border: `1px solid ${t.big ? '#c9e6d4' : BORDER}`, borderRadius: 12, padding: '12px 14px', minWidth: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: INK, fontFamily: DISPLAY, lineHeight: 1 }}>{money(t.v)}</div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: SECONDARY, fontFamily: MANROPE, marginTop: 6 }}>{t.l}</div>
                    </div>
                  ))}
                </div>
                <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none', marginTop: 12 }}>
                  {e.sourceLabel} <ArrowUpRight style={{ width: 12, height: 12 }} />
                </a>
              </Card>
            )
          })()}

          {/* Roles & responsibilities */}
          {mp.portfolios && mp.portfolios.length > 0 && (
            <Card>
              <SectionHeading icon={Landmark} title="Roles & responsibilities" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {mp.portfolios.map((p) => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: SURFACE, borderRadius: 10, border: `1px solid ${BORDER}` }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: party.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: INK, fontFamily: MANROPE }}>{p}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Basic-profile notice */}
          {!hasAnyDetail && (
            <Card>
              <SectionHeading icon={ScrollText} title="About this MP" />
              <p style={{ fontSize: 14, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.7, margin: 0 }}>
                {`A full biography, roles and committees for ${mp.name} are being compiled from the official record. In the meantime, view this MP's official profile on parliament.nz.`}
              </p>
              <a href={mp.parliamentUrl} target="_blank" rel="noopener noreferrer" style={{ ...btnPrimary, marginTop: 16, display: 'inline-flex' }}>
                Official profile <ArrowUpRight style={{ width: 15, height: 15 }} />
              </a>
            </Card>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card style={{ padding: '20px 22px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 14 }}>At a glance</div>
            <Stat icon={MapPin} label="Electorate" value={mp.role === 'electorate' ? (mp.electorate ?? '—') : 'List MP'} />
            <Stat icon={Landmark} label="Role" value={mp.role === 'electorate' ? 'Electorate MP' : 'List MP'} />
            {mp.title && <Stat icon={Briefcase} label="Title" value={mp.title} />}
            {mp.enteredParliament && <Stat icon={Calendar} label="Entered Parliament" value={String(mp.enteredParliament)} />}
            {mp.bornYear && <Stat icon={Users} label="Born" value={`${mp.bornYear}${mp.bornPlace ? `, ${mp.bornPlace}` : ''}`} />}
            {typeof mp.electorateMajority === 'number' && <Stat icon={Vote} label="2023 majority" value={formatNumber(mp.electorateMajority)} />}
          </Card>

          {mp.committees && (
            <Card style={{ padding: '20px 22px' }}>
              <SectionHeading icon={Users} title="Committees" />
              {mp.committees.length ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {mp.committees.map((c) => (
                    <span key={c} style={{ fontSize: 12, fontWeight: 600, color: SECONDARY, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '4px 11px', fontFamily: MANROPE }}>{c}</span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: TERTIARY, fontFamily: MANROPE, margin: 0 }}>No current committee memberships.</p>
              )}
            </Card>
          )}

          {/* Participation snapshot */}
          {isActive && (
            <Card style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <MessageSquare style={{ width: 15, height: 15, color: JADE }} />
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>Participation</span>
              </div>
              {govBills.length > 0 && <Stat icon={FileText} label="Govt bills in charge" value={String(govBills.length)} />}
              <Stat icon={FileText} label="Members’ bills (ballot)" value={String(ballotBills.length)} />
              <Stat icon={MessageSquare} label="Written questions" value={typeof mp.writtenQuestions === 'number' ? String(mp.writtenQuestions) : '—'} coming={typeof mp.writtenQuestions !== 'number'} />
              <Stat icon={Vote} label="Speeches" value={typeof mp.speeches === 'number' ? String(mp.speeches) : '—'} coming={typeof mp.speeches !== 'number'} />
            </Card>
          )}

          <Card style={{ padding: '20px 22px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 14 }}>Official links</div>
            <LinkRow icon={ExternalLink} label="Profile on parliament.nz" href={mp.parliamentUrl} />
            {mp.website && <LinkRow icon={Globe} label="Party website" href={mp.website} />}
            {mp.email && <LinkRow icon={Mail} label={mp.email} href={`mailto:${mp.email}`} />}
          </Card>
        </div>
      </div>

      {/* ═══════════════ Source attribution ═══════════════ */}
      <div style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '20px 36px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <SectionDivider type="official" label="Sources" />
          <p style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>
            Details sourced from{' '}
            <a href={mp.parliamentUrl} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 600 }}>parliament.nz <ArrowUpRight style={{ width: 11, height: 11, display: 'inline' }} /></a>{' '}
            and the public record. Bills, written questions, speeches and voting records are being added from Parliament’s official register and Hansard.
            {mp.photo && mp.photoCredit && (
              <>{' '}Photo: {mp.photoCredit}{mp.photoLicense ? `, ${mp.photoLicense}` : ''}{mp.photoSourceUrl && (<>{' '}<a href={mp.photoSourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 600 }}>(source <ArrowUpRight style={{ width: 10, height: 10, display: 'inline' }} />)</a></>)}.</>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Bill row ─────────────────────────────────────────────────────────────────
function BillRow({ title, tag, tagColor, tagBg, href, first }: { title: string; tag: string; tagColor: string; tagBg: string; href?: string; first: boolean }) {
  const inner = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: first ? 'none' : `1px solid ${BORDER}` }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: INK, fontFamily: MANROPE, lineHeight: 1.4 }}>{title}</div>
      <span style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', background: tagBg, color: tagColor, borderRadius: 999, padding: '3px 10px', fontFamily: MANROPE }}>{tag}</span>
    </div>
  )
  return href ? <Link href={href} style={{ textDecoration: 'none' }} className="party-card">{inner}</Link> : inner
}

// ─── Sidebar stat row ─────────────────────────────────────────────────────────
function Stat({ icon: Icon, label, value, coming }: { icon: React.ElementType; label: string; value: string; coming?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
      <Icon style={{ width: 15, height: 15, color: TERTIARY, flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: TERTIARY, fontFamily: MANROPE }}>{label}{coming && <> <ComingTag /></>}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: coming ? TERTIARY : INK, fontFamily: MANROPE, marginTop: 1 }}>{value}</div>
      </div>
    </div>
  )
}

function LinkRow({ icon: Icon, label, href }: { icon: React.ElementType; label: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', fontSize: 13, fontWeight: 600, color: INK, textDecoration: 'none', fontFamily: MANROPE }}>
      <Icon style={{ width: 14, height: 14, color: JADE, flexShrink: 0 }} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <ArrowUpRight style={{ width: 13, height: 13, color: TERTIARY }} />
    </a>
  )
}

// ─── Button styles ────────────────────────────────────────────────────────────
const btnBase: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 700, fontFamily: MANROPE, textDecoration: 'none', whiteSpace: 'nowrap' }
const btnPrimary: React.CSSProperties = { ...btnBase, background: JADE, color: '#fff' }
const btnSecondary: React.CSSProperties = { ...btnBase, background: '#fff', border: `1px solid ${BORDER}`, color: INK }
