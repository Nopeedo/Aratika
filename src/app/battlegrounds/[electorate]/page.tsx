/**
 * /battlegrounds/[electorate] — a single seat's battle.
 * The 2023 result + incumbent now; confirmed 2026 candidates fill in during
 * the campaign (from candidates-2026.ts).
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, MapPin, Landmark, Info, UserRound, Vote, FileText, Megaphone, Users2, ScrollText, ArrowUpRight } from 'lucide-react'
import { ELECTORATE_SLUGS, getElectorateBySlug, classifyMargin } from '@/lib/battlegrounds'
import { getCandidates } from '@/constants/candidates-2026'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import { MP_PROFILES } from '@/constants/mps-data'
import { MP_MEMBERS_BILLS } from '@/constants/mps-members-bills'
import { MP_PASSED_BILLS, MP_GOV_BILLS, BILL_ACTIVITY_META } from '@/constants/mps-bill-activity'
import { MP_WRITTEN_QUESTIONS, WRITTEN_QUESTIONS_META } from '@/constants/mps-written-questions'
import { Avatar } from '@/components/ui/avatar'
import { BookmarkButton } from '@/components/bookmarks/bookmark-button'
import { WarRoomHero } from '@/components/battlegrounds/war-room-hero'
import { RosterAccordion, type RosterItem } from '@/components/battlegrounds/roster-accordion'
import { ElectorateNews } from '@/components/battlegrounds/electorate-news'
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
  const firstName = mp?.name.split(' ')[0] ?? (info.mpName ? info.mpName.split(' ')[0] : 'The incumbent')

  // The defender's full dossier — everything specific to the sitting MP, shown
  // when their roster row is expanded.
  const defenderBody = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 16 }}>
      <div>
        {info.majority != null && (
          <div style={{ fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, marginBottom: 10 }}>
            Won {info.name} by a majority of <b style={{ color: INK }}>{info.majority.toLocaleString('en-NZ')}</b> in 2023 — a <b style={{ color: tier.color }}>{tier.label.toLowerCase()}</b> seat.
          </div>
        )}
        {mp?.bio && <p style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 10px' }}>{mp.bio}</p>}
        {resolvedSlug && mp && <Link href={`/mps/${resolvedSlug}`} style={cta}>Full MP profile <ArrowRight style={ic} /></Link>}
      </div>

      {mp && ((mp.portfolios && mp.portfolios.length > 0) || (mp.committees && mp.committees.length > 0)) && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 4 }}>What {firstName} has prioritised this term</div>
          <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, margin: '0 0 14px' }}>Official roles, sourced from parliament.nz.</p>
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
        </div>
      )}

      {mp && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 4 }}>Legislative activity this term</div>
          <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, margin: '0 0 14px' }}>From Parliament's official bills record, as at {BILL_ACTIVITY_META.asOf}.</p>
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
                  <Label icon={ScrollText} text={`Members' bills passed into law (${passedBills.length})`} />
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                    {passedBills.map((b) => <li key={b.title} style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6 }}>{b.title}</li>)}
                  </ul>
                </div>
              )}
              {proposedBills.length > 0 && (
                <div>
                  <Label icon={Vote} text={`Members' bill in the ballot (${proposedBills.length})`} />
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                    {proposedBills.map((b) => <li key={b.title} style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6 }}>{b.title}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.6 }}>
              No government bill in charge, members' bill passed, or members' bill currently in the ballot for {firstName} this term — checked against the official record, not a gap in our data.
            </p>
          )}
        </div>
      )}

      {resolvedSlug && MP_WRITTEN_QUESTIONS[resolvedSlug] && (() => {
        const wq = MP_WRITTEN_QUESTIONS[resolvedSlug]
        const topMinisters = wq.byMinister.slice(0, 4)
        const otherCount = wq.byMinister.slice(4).reduce((n, m) => n + m.count, 0)
        const maxM = topMinisters[0]?.count ?? 1
        return (
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 10 }}>Written questions to Ministers this term</div>

            <div style={{ display: 'flex', gap: 9, padding: '11px 13px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, marginBottom: 16 }}>
              <Info style={{ width: 15, height: 15, color: SECONDARY, flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
                <b style={{ color: INK }}>What is this, and why does it matter to you?</b> Any MP can put a written question to a Minister to formally demand information on the record — the Minister must reply, usually within days. It costs nothing and needs no debate, which makes it the main day-to-day tool MPs use to hold the government accountable between bills — especially for opposition MPs, who can't pass laws but can still force information into the open. Which Ministers an MP questions most, below, is a real, numbers-based picture of what they're actually watching on your behalf — worth comparing against what they say they prioritise.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
              <span style={{ fontSize: 30, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1 }}>{wq.count.toLocaleString('en-NZ')}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: SECONDARY, fontFamily: MANROPE }}>written questions asked since the 2023 election</span>
            </div>

            {topMinisters.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <Label icon={Landmark} text="Where it's gone — by Minister" />
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

            <Label icon={ScrollText} text={`Recent questions and replies, in ${firstName}'s and the Minister's own words`} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
              {wq.recent.map((q, i) => (
                <div key={i} style={{ paddingBottom: 12, borderBottom: i < wq.recent.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: TERTIARY, fontFamily: MANROPE, textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: 4 }}>
                    To the {q.minister} · {q.date}
                  </div>
                  <p style={{ fontSize: 13, color: INK, fontFamily: MANROPE, lineHeight: 1.55, margin: '0 0 6px', fontStyle: 'italic' }}>
                    "{q.question}"
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
          </div>
        )
      })()}
    </div>
  )

  // Each confirmed challenger's dossier, in the same roster shape as the defender.
  // The candidate with the highest illustrative poll standing (or simply the first
  // listed, if none has one) is treated as "the" rival shown in the hero gauge.
  const leadChallenger = candidates.length > 0
    ? [...candidates].sort((a, b) => (b.pollPct ?? 0) - (a.pollPct ?? 0))[0]
    : undefined
  const challengerColor = leadChallenger
    ? (leadChallenger.party === 'independent' ? '#6B7280' : PARTY_COLORS[leadChallenger.party].bg)
    : TERTIARY
  const hasPollData = candidates.some((c) => c.pollPct != null)
  const defenderPollPct = hasPollData
    ? Math.max(0, 100 - candidates.reduce((n, c) => n + (c.pollPct ?? 0), 0))
    : undefined

  const rosterItems: RosterItem[] = [
    {
      key: 'defender',
      color: incumbentColor,
      avatarName: mp?.name ?? info.mpName ?? '?',
      avatarParty: info.party ?? undefined,
      avatarPhoto: mp?.photo,
      title: mp?.name ?? info.mpName ?? 'Result pending',
      subtitle: `${info.party ? PARTY_NAMES[info.party].full : 'Unverified'} · Defending`,
      badge: 'Incumbent',
      pollPct: defenderPollPct,
      body: defenderBody,
    },
    ...(candidates.length === 0
      ? [{
          key: 'challengers-empty',
          color: TERTIARY,
          avatarName: '?',
          title: 'The challengers',
          subtitle: 'Confirmed once nominations close',
          body: (
            <div style={{ display: 'flex', gap: 12, paddingTop: 16 }}>
              <UserRound style={{ width: 20, height: 20, color: SECONDARY, flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>
                Parties select their {info.name} candidates in the lead-up to the election, and nominations close about a month before
                election day. As each candidate is confirmed, their profile — background, priorities, the policies that matter to
                them, and the legislation they want to champion — will appear here.
              </p>
            </div>
          ),
        } satisfies RosterItem]
      : candidates.map((c): RosterItem => {
          const color = c.party === 'independent' ? '#6B7280' : PARTY_COLORS[c.party].bg
          return {
            key: c.name,
            color,
            avatarName: c.name,
            avatarParty: c.party === 'independent' ? undefined : c.party,
            avatarPhoto: c.mpSlug ? MP_PROFILES[c.mpSlug]?.photo : undefined,
            title: c.name,
            subtitle: `${c.party === 'independent' ? 'Independent' : PARTY_NAMES[c.party].full} · Challenging`,
            badge: c.incumbent ? 'Incumbent' : undefined,
            pollPct: c.pollPct,
            body: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16 }}>
                {c.bio && <p style={{ fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>{c.bio}</p>}
                {c.priorities && c.priorities.length > 0 && (
                  <div>
                    <Label icon={Megaphone} text="What matters to them" />
                    <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                      {c.priorities.map((p) => <li key={p} style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6 }}>{p}</li>)}
                    </ul>
                  </div>
                )}
                {c.keyPolicies && c.keyPolicies.length > 0 && (
                  <div>
                    <Label icon={FileText} text="Key policies" />
                    <div style={{ marginTop: 6 }}>
                      {c.keyPolicies.map((p) => (
                        <div key={p.title} style={{ marginTop: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: INK, fontFamily: MANROPE }}>{p.title}: </span>
                          <span style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE }}>{p.detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {c.bills && c.bills.length > 0 && (
                  <div>
                    <Label icon={ScrollText} text="Legislation they want" />
                    <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                      {c.bills.map((b) => <li key={b} style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6 }}>{b}</li>)}
                    </ul>
                  </div>
                )}
                {c.mpSlug && (
                  <Link href={`/mps/${c.mpSlug}`} style={cta}>Full profile <ArrowRight style={ic} /></Link>
                )}
              </div>
            ),
          }
        })),
  ]

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <WarRoomHero
        electorateName={info.name}
        regionLine={`${info.type === 'maori' ? 'Māori electorate' : 'General electorate'}${info.region ? ` · ${info.region}` : ''}`}
        tierKey={tier.key}
        tierLabel={tier.label}
        tierColor={tier.color}
        majority={info.majority}
        incumbentColor={incumbentColor}
        incumbentName={mp?.name ?? info.mpName ?? 'the incumbent'}
        incumbentSub={info.party ? PARTY_NAMES[info.party].short : 'Unverified'}
        incumbentParty={info.party ?? undefined}
        incumbentPhoto={mp?.photo}
        challengerLabel={leadChallenger ? (leadChallenger.party === 'independent' ? 'an independent' : PARTY_NAMES[leadChallenger.party].short) : 'a challenger'}
        challengerColor={challengerColor}
        challengerName={leadChallenger?.name}
        challengerParty={leadChallenger && leadChallenger.party !== 'independent' ? leadChallenger.party : undefined}
        challengerPhoto={leadChallenger?.mpSlug ? MP_PROFILES[leadChallenger.mpSlug]?.photo : undefined}
      />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 36px 64px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Track this battleground — follows it into the Command Centre, alongside tracked MPs, parties and bills */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <BookmarkButton entity={{
            kind: 'electorate',
            refId: info.name,
            label: info.name,
            sublabel: `${tier.label} battleground${info.party ? ` · ${mp?.name ?? info.mpName}` : ''}`,
            href: `/battlegrounds/${electorate}`,
            accent: incumbentColor,
          }} />
        </div>

        {/* In the news — real coverage naming this seat or its MP, from the same feed as /news */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>In the news</h2>
          <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 14px' }}>Coverage naming {info.name} or {firstName}, from our tracked feeds.</p>
          <ElectorateNews electorateName={info.name} />
        </div>

        {/* The roster — tap a combatant to expand their full dossier */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>The roster</h2>
          <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 14px' }}>
            The defender's record, and who's confirmed to challenge them in 2026.
            {hasPollData && <> Poll standing shown is illustrative only — no verified electorate-level polling exists for this preview.</>}
          </p>
          <RosterAccordion items={rosterItems} />
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
