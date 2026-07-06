/**
 * /battlegrounds/[electorate] — a single seat's battle.
 * The 2023 result + incumbent now; confirmed 2026 candidates fill in during
 * the campaign (from candidates-2026.ts).
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, MapPin, Landmark, Info, UserRound, Vote, FileText, Megaphone, Users2, ScrollText, ArrowUpRight } from 'lucide-react'
import { ELECTORATE_SLUGS, getElectorateBySlug, classifyMargin } from '@/lib/battlegrounds'
import { getCandidates } from '@/constants/candidates-2026'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import { MP_PROFILES } from '@/constants/mps-data'
import { MP_MEMBERS_BILLS } from '@/constants/mps-members-bills'
import { MP_PASSED_BILLS, MP_GOV_BILLS, BILL_ACTIVITY_META } from '@/constants/mps-bill-activity'
import { MP_WRITTEN_QUESTIONS, WRITTEN_QUESTIONS_META } from '@/constants/mps-written-questions'
import { Avatar } from '@/components/ui/avatar'
import { isLightHex } from '@/components/homepage/battleground-card'
import { SectionDivider } from '@/components/ui/section-divider'
import type { PartySlug } from '@/types'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function generateStaticParams() {
  return ELECTORATE_SLUGS.map((electorate) => ({ electorate }))
}

export async function generateMetadata({ params }: { params: Promise<{ electorate: string }> }): Promise<Metadata> {
  const { electorate } = await params
  const info = getElectorateBySlug(electorate)
  if (!info) return { title: 'Electorate not found' }
  return { title: `${info.name} — Battleground`, description: `The contest for ${info.name}: the 2023 result, the incumbent, and the 2026 candidates as they're confirmed.` }
}

export default async function BattlePage({ params }: { params: Promise<{ electorate: string }> }) {
  const { electorate } = await params
  const info = getElectorateBySlug(electorate)
  if (!info) notFound()

  const tier = classifyMargin(info.majority)
  const candidates = getCandidates(electorate)
  // Resolve the incumbent's profile slug (stored, or derived from their name to
  // match the /mps profile slug convention).
  const resolvedSlug = info.mpSlug ?? (info.mpName ? mpSlugFromName(info.mpName) : undefined)
  const mp = resolvedSlug ? MP_PROFILES[resolvedSlug] : undefined
  // The incumbent's party colour — used as a strip on every section specific to them,
  // so it's visually obvious at a glance whose seat this currently is.
  const incumbentColor = info.party ? PARTY_COLORS[info.party].bg : TERTIARY

  // Real legislative activity this term, sourced from Parliament's official bills data
  // (same feed already used on the full MP profile page) — what they've actually done,
  // not just what they say. Empty is a genuine, checked "nothing before the House".
  const passedBills = resolvedSlug ? (MP_PASSED_BILLS[resolvedSlug] ?? []) : []
  const govBills = resolvedSlug ? (MP_GOV_BILLS[resolvedSlug] ?? []) : []
  const proposedBills = resolvedSlug ? (MP_MEMBERS_BILLS[resolvedSlug] ?? []) : []
  const hasBillActivity = passedBills.length > 0 || govBills.length > 0 || proposedBills.length > 0

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Header */}
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 36px 32px' }}>
          <Link href="/battlegrounds" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: SECONDARY, textDecoration: 'none', fontFamily: MANROPE, marginBottom: 18 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> All battlegrounds
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <SectionDivider type="official" label="Battleground" />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: tier.color, borderRadius: 999, padding: '3px 10px', fontFamily: MANROPE }}>{tier.label}</span>
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 6px', lineHeight: 1.05 }}>{info.name}</h1>
          <p style={{ fontSize: 16, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>
            {info.type === 'maori' ? 'Māori electorate' : 'General electorate'}{info.region ? ` · ${info.region}` : ''}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '30px 36px 64px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* 2023 result + incumbent, combined — one seat, one MP, one card */}
        <IncumbentCard color={incumbentColor}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 12 }}>2023 result &amp; incumbent</div>
          {mp ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Avatar name={mp.name} party={info.party ?? undefined} src={mp.photo} size="lg" face />
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{mp.name}</div>
                  <div style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE }}>
                    {info.party ? PARTY_NAMES[info.party].full : ''}{mp.enteredParliament ? ` · in Parliament since ${mp.enteredParliament}` : ''}
                  </div>
                </div>
              </div>
              {info.majority != null && (
                <div style={{ fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, marginBottom: 12 }}>
                  Won {info.name} by a majority of <b style={{ color: INK }}>{info.majority.toLocaleString('en-NZ')}</b> in 2023 — a <b style={{ color: tier.color }}>{tier.label.toLowerCase()}</b> seat.
                </div>
              )}
              {mp.bio && <p style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 12px' }}>{mp.bio}</p>}
              <Link href={`/mps/${resolvedSlug}`} style={cta}>Full MP profile <ArrowRight style={ic} /></Link>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                {info.party && <span style={{ width: 14, height: 14, borderRadius: '50%', background: PARTY_COLORS[info.party].bg }} />}
                <div style={{ fontFamily: MANROPE }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: INK }}>{info.mpName ?? 'Result pending'}</div>
                  <div style={{ fontSize: 13, color: SECONDARY }}>{info.party ? PARTY_NAMES[info.party].full : ''}</div>
                </div>
              </div>
              {info.majority != null && (
                <div style={{ fontSize: 13.5, color: '#33373f', fontFamily: MANROPE }}>
                  Won by a majority of <b style={{ color: INK }}>{info.majority.toLocaleString('en-NZ')}</b> — a <b style={{ color: tier.color }}>{tier.label.toLowerCase()}</b> seat.
                </div>
              )}
            </>
          )}
        </IncumbentCard>

        {/* What they've prioritised + where they focus — sourced from parliament.nz roles */}
        {mp && ((mp.portfolios && mp.portfolios.length > 0) || (mp.committees && mp.committees.length > 0)) && (
          <IncumbentCard color={incumbentColor}>
            <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 4 }}>What {mp.name.split(' ')[0]} has prioritised this term</div>
            <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, margin: '0 0 16px' }}>Official roles, sourced from parliament.nz.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {mp.portfolios && mp.portfolios.length > 0 && (
                <div>
                  <Label icon={Megaphone} text="Spokesperson roles" />
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                    {mp.portfolios.map((p) => <li key={p} style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6 }}>{p.replace(/^Spokesperson — /, '')}</li>)}
                  </ul>
                </div>
              )}
              {mp.committees && mp.committees.length > 0 && (
                <div>
                  <Label icon={Users2} text="Select committees" />
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                    {mp.committees.map((c) => <li key={c} style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6 }}>{c}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </IncumbentCard>
        )}

        {/* Legislative activity this term — what they've actually done, sourced from Parliament's bills data */}
        {mp && (
          <IncumbentCard color={incumbentColor}>
            <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 4 }}>Legislative activity this term</div>
            <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, margin: '0 0 16px' }}>From Parliament's official bills record, as at {BILL_ACTIVITY_META.asOf}.</p>
            {hasBillActivity ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {govBills.length > 0 && (
                  <div>
                    <Label icon={FileText} text={`Government bills in charge (${govBills.length})`} />
                    <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                      {govBills.slice(0, 6).map((b) => <li key={b.title} style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6 }}>{b.title}</li>)}
                    </ul>
                  </div>
                )}
                {passedBills.length > 0 && (
                  <div>
                    <Label icon={ScrollText} text={`Members’ bills passed into law (${passedBills.length})`} />
                    <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                      {passedBills.map((b) => <li key={b.title} style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6 }}>{b.title}</li>)}
                    </ul>
                  </div>
                )}
                {proposedBills.length > 0 && (
                  <div>
                    <Label icon={Vote} text={`Members’ bill in the ballot (${proposedBills.length})`} />
                    <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                      {proposedBills.map((b) => <li key={b.title} style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6 }}>{b.title}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.6 }}>
                No government bill in charge, members’ bill passed, or members’ bill currently in the ballot for {mp.name.split(' ')[0]} this term — checked against the official record, not a gap in our data.
              </p>
            )}
          </IncumbentCard>
        )}

        {/* Written parliamentary questions this term — explained, broken down, and shown in full */}
        {resolvedSlug && MP_WRITTEN_QUESTIONS[resolvedSlug] && (() => {
          const wq = MP_WRITTEN_QUESTIONS[resolvedSlug]
          const firstName = mp?.name.split(' ')[0] ?? 'This MP'
          const topMinisters = wq.byMinister.slice(0, 4)
          const otherCount = wq.byMinister.slice(4).reduce((n, m) => n + m.count, 0)
          const maxM = topMinisters[0]?.count ?? 1
          return (
            <IncumbentCard color={incumbentColor}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 10 }}>Written questions to Ministers this term</div>

              {/* Evergreen, non-partisan explainer — same wording for every MP */}
              <div style={{ display: 'flex', gap: 9, padding: '11px 13px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, marginBottom: 16 }}>
                <Info style={{ width: 15, height: 15, color: SECONDARY, flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
                  <b style={{ color: INK }}>What is this, and why does it matter to you?</b> Any MP can put a written question to a Minister to formally demand information on the record — the Minister must reply, usually within days. It costs nothing and needs no debate, which makes it the main day-to-day tool MPs use to hold the government accountable between bills — especially for opposition MPs, who can’t pass laws but can still force information into the open. Which Ministers an MP questions most, below, is a real, numbers-based picture of what they’re actually watching on your behalf — worth comparing against what they say they prioritise.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1 }}>{wq.count.toLocaleString('en-NZ')}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: SECONDARY, fontFamily: MANROPE }}>written questions asked since the 2023 election</span>
              </div>

              {/* Real, computed breakdown — where the scrutiny has actually gone */}
              {topMinisters.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <Label icon={Landmark} text="Where it’s gone — by Minister" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 9 }}>
                    {topMinisters.map((m) => (
                      <div key={m.minister} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ flex: '0 0 42%', fontSize: 12, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.35 }}>{m.minister}</span>
                        <div style={{ flex: 1, height: 12, background: SURFACE, borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(m.count / maxM) * 100}%`, background: incumbentColor, borderRadius: 4 }} />
                        </div>
                        <span style={{ width: 30, textAlign: 'right', fontSize: 12, fontWeight: 700, color: INK, fontFamily: MANROPE, flexShrink: 0 }}>{m.count}</span>
                      </div>
                    ))}
                    {otherCount > 0 && (
                      <div style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 2 }}>+ {otherCount} more across other Ministers.</div>
                    )}
                  </div>
                </div>
              )}

              {/* The actual questions and replies, in full — not just who they went to */}
              <Label icon={ScrollText} text={`Recent questions and replies, in ${firstName}’s and the Minister’s own words`} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
                {wq.recent.map((q, i) => (
                  <div key={i} style={{ paddingBottom: 12, borderBottom: i < wq.recent.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: TERTIARY, fontFamily: MANROPE, textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: 4 }}>
                      To the {q.minister} · {q.date}
                    </div>
                    <p style={{ fontSize: 13, color: INK, fontFamily: MANROPE, lineHeight: 1.55, margin: '0 0 6px', fontStyle: 'italic' }}>
                      “{q.question}”
                    </p>
                    {q.reply ? (
                      <p style={{ fontSize: 12.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.55, margin: 0, paddingLeft: 10, borderLeft: `3px solid ${BORDER}` }}>
                        <b style={{ color: SECONDARY }}>Reply: </b>{q.reply}
                      </p>
                    ) : (
                      <p style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE, fontStyle: 'italic', margin: 0 }}>Reply not yet due or not yet published.</p>
                    )}
                  </div>
                ))}
              </div>

              <a href={WRITTEN_QUESTIONS_META.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none', marginTop: 14 }}>
                {WRITTEN_QUESTIONS_META.sourceLabel} <ArrowUpRight style={{ width: 12, height: 12 }} />
              </a>
            </IncumbentCard>
          )
        })()}

        {/* The 2026 contest */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>The 2026 contest</h2>
          <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 14px' }}>Who’s standing in {info.name}, what they stand for, and what they want to change.</p>

          {candidates.length === 0 ? (
            <div style={{ display: 'flex', gap: 12, padding: '18px 20px', background: SURFACE, border: `1px dashed ${TERTIARY}`, borderRadius: 16 }}>
              <UserRound style={{ width: 20, height: 20, color: SECONDARY, flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontFamily: MANROPE }}>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: INK }}>Candidates confirmed during the campaign</div>
                <p style={{ fontSize: 13, color: SECONDARY, lineHeight: 1.6, margin: '4px 0 0' }}>
                  Parties select their {info.name} candidates in the lead-up to the election, and nominations close about a month before
                  election day. As each candidate is confirmed, their profile — background, priorities, the policies that matter to
                  them, and the legislation they want to champion — will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {candidates.map((c) => {
                const color = c.party === 'independent' ? '#6B7280' : PARTY_COLORS[c.party].bg
                const light = isLightHex(color)
                const txt = light ? '#1c1605' : '#fff'
                const sub = light ? 'rgba(28,22,5,.72)' : 'rgba(255,255,255,.8)'
                const chipBg = light ? 'rgba(28,22,5,.12)' : 'rgba(255,255,255,.18)'
                const lineBg = light ? 'rgba(28,22,5,.14)' : 'rgba(255,255,255,.22)'
                return (
                  <div key={c.name} style={{ background: color, color: txt, borderRadius: 16, padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                      <Avatar
                        name={c.name}
                        party={c.party === 'independent' ? undefined : c.party}
                        src={c.mpSlug ? MP_PROFILES[c.mpSlug]?.photo : undefined}
                        size="sm"
                        face
                      />
                      <span style={{ fontSize: 16, fontWeight: 800, fontFamily: MANROPE, color: txt }}>{c.name}</span>
                      {c.incumbent && <span style={{ fontSize: 10.5, fontWeight: 800, color: txt, background: chipBg, borderRadius: 999, padding: '2px 9px', fontFamily: MANROPE }}>Incumbent</span>}
                      <span style={{ fontSize: 12.5, color: sub, fontFamily: MANROPE }}>{c.party === 'independent' ? 'Independent' : PARTY_NAMES[c.party].short}</span>
                    </div>
                    {c.bio && <p style={{ fontSize: 13.5, color: txt, fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 12px' }}>{c.bio}</p>}
                    {c.priorities && c.priorities.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: sub, fontFamily: MANROPE, marginBottom: 6 }}>What matters to them</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {c.priorities.map((p) => <li key={p} style={{ fontSize: 13, color: txt, fontFamily: MANROPE, lineHeight: 1.6 }}>{p}</li>)}
                        </ul>
                      </div>
                    )}
                    {c.keyPolicies && c.keyPolicies.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: sub, fontFamily: MANROPE, marginBottom: 6 }}>Key policies</div>
                        {c.keyPolicies.map((p) => (
                          <div key={p.title} style={{ marginTop: 5 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: txt, fontFamily: MANROPE }}>{p.title}: </span>
                            <span style={{ fontSize: 13, color: sub, fontFamily: MANROPE }}>{p.detail}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {c.bills && c.bills.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: sub, fontFamily: MANROPE, marginBottom: 6 }}>Legislation they want</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {c.bills.map((b) => <li key={b} style={{ fontSize: 13, color: txt, fontFamily: MANROPE, lineHeight: 1.6 }}>{b}</li>)}
                        </ul>
                      </div>
                    )}
                    {c.mpSlug && (
                      <Link href={`/mps/${c.mpSlug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: txt, fontFamily: MANROPE, textDecoration: 'none', borderBottom: `1px solid ${lineBg}`, paddingBottom: 2, marginTop: 4 }}>
                        Full profile <ArrowRight style={ic} />
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Links + source */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/battlegrounds" style={pill(true)}><MapPin style={ic} /> Battlegrounds map</Link>
          <Link href="/elections/2026" style={pill(false)}>2026 election <ArrowRight style={ic} /></Link>
        </div>
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Info style={{ width: 15, height: 15, color: TERTIARY, flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>
            2023 result and margin: Electoral Commission. 2026 candidates are added only once officially confirmed — never assumed.
          </p>
        </div>
      </div>
    </div>
  )
}

/** A card carrying the incumbent's party-colour strip along its top — used for every
 *  section that's specific to them (2023 result, incumbent bio, what they've prioritised),
 *  so it's visually obvious at a glance whose seat this currently is. */
function IncumbentCard({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ height: 4, background: color }} />
      <div style={{ padding: '18px 22px 20px' }}>{children}</div>
    </div>
  )
}

/** Slug an MP's name to match the /mps profile slug convention (lowercase, macrons stripped). */
function mpSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const ic: React.CSSProperties = { width: 14, height: 14 }
const cta: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }
function pill(primary: boolean): React.CSSProperties {
  return { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, fontFamily: MANROPE, padding: '9px 15px', borderRadius: 11, textDecoration: 'none', background: primary ? JADE : '#fff', color: primary ? '#fff' : INK, border: primary ? 'none' : `1px solid ${BORDER}` }
}

function Label({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>
      <Icon style={{ width: 13, height: 13 }} /> {text}
    </div>
  )
}
