/**
 * /battlegrounds/[electorate] — a single seat's battle.
 * The 2023 result + incumbent now; confirmed 2026 candidates fill in during
 * the campaign (from candidates-2026.ts).
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, MapPin, Landmark, Info, UserRound, Vote, FileText, Megaphone, Users2 } from 'lucide-react'
import { ELECTORATE_SLUGS, getElectorateBySlug, classifyMargin } from '@/lib/battlegrounds'
import { getCandidates } from '@/constants/candidates-2026'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import { MP_PROFILES } from '@/constants/mps-data'
import { Avatar } from '@/components/ui/avatar'
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

        {/* 2023 result + incumbent — both specific to the sitting MP, so both carry their party-colour strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {/* 2023 result */}
          <IncumbentCard color={incumbentColor}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 12 }}>2023 result</div>
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
          </IncumbentCard>

          {/* Incumbent */}
          <IncumbentCard color={incumbentColor}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 12 }}>The incumbent</div>
            {mp ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <Avatar name={mp.name} party={info.party ?? undefined} src={mp.photo} size="lg" face />
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{mp.name}</div>
                    <div style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE }}>
                      {mp.title || `MP for ${info.name}`}{mp.enteredParliament ? ` · in Parliament since ${mp.enteredParliament}` : ''}
                    </div>
                  </div>
                </div>
                {mp.bio && <p style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 12px' }}>{mp.bio}</p>}
                <Link href={`/mps/${resolvedSlug}`} style={cta}>Full MP profile <ArrowRight style={ic} /></Link>
              </>
            ) : (
              <div style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE }}>{info.mpName ?? 'The current MP holds this seat.'}</div>
            )}
          </IncumbentCard>
        </div>

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
              {candidates.map((c) => (
                <div key={c.name} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderLeft: `4px solid ${c.party === 'independent' ? TERTIARY : PARTY_COLORS[c.party].bg}`, borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Avatar
                      name={c.name}
                      party={c.party === 'independent' ? undefined : c.party}
                      src={c.mpSlug ? MP_PROFILES[c.mpSlug]?.photo : undefined}
                      size="sm"
                      face
                    />
                    <span style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{c.name}</span>
                    {c.incumbent && <span style={{ fontSize: 10.5, fontWeight: 800, color: '#065f46', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 999, padding: '2px 8px', fontFamily: MANROPE }}>Incumbent</span>}
                    <span style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE }}>{c.party === 'independent' ? 'Independent' : PARTY_NAMES[c.party].short}</span>
                  </div>
                  {c.bio && <p style={{ fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 10px' }}>{c.bio}</p>}
                  {c.priorities && c.priorities.length > 0 && <CandidateList icon={Vote} title="What matters to them" items={c.priorities} />}
                  {c.keyPolicies && c.keyPolicies.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <Label icon={Landmark} text="Key policies" />
                      {c.keyPolicies.map((p) => (
                        <div key={p.title} style={{ marginTop: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: INK, fontFamily: MANROPE }}>{p.title}: </span>
                          <span style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE }}>{p.detail}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {c.bills && c.bills.length > 0 && <CandidateList icon={FileText} title="Legislation they want" items={c.bills} />}
                  {c.mpSlug && <Link href={`/mps/${c.mpSlug}`} style={{ ...cta, marginTop: 12 }}>Full profile <ArrowRight style={ic} /></Link>}
                </div>
              ))}
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
function CandidateList({ icon, title, items }: { icon: React.ElementType; title: string; items: string[] }) {
  return (
    <div style={{ marginTop: 10 }}>
      <Label icon={icon} text={title} />
      <ul style={{ margin: '5px 0 0', paddingLeft: 18 }}>
        {items.map((it) => <li key={it} style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.5 }}>{it}</li>)}
      </ul>
    </div>
  )
}
