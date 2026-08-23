/**
 * /battlegrounds/[electorate] — a single seat's battle.
 * The 2023 result + incumbent now; confirmed 2026 candidates fill in during
 * the campaign (from candidates-2026.ts).
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, MapPin, Landmark, Info, UserRound, Vote, FileText, Megaphone, Users2, ScrollText, ArrowUpRight, Newspaper, PlayCircle } from 'lucide-react'
import { ELECTORATE_SLUGS, getElectorateBySlug, classifyMargin } from '@/lib/battlegrounds'
import { getCandidates } from '@/constants/candidates-2026'
import { getApprovedCandidates } from '@/lib/candidates/live'
import { getCoverageForCandidates } from '@/lib/candidates/coverage'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import { PARTY_PROFILES } from '@/constants/parties-data'
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
import { BORDER, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Deterministic UTC date label — no clock read during render, which is how this
 *  codebase has produced hydration mismatches before. */
function fmtShort(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`
}

/** "8 October 2026" — a withdrawal date should read like a date. Parsed from an
 *  ISO string with no clock read, so it stays deterministic through SSR. */
function fmtLongDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return (m >= 1 && m <= 12 && d) ? `${d} ${MONTHS[m - 1]} ${y}` : iso
}

/** Show a citation as its outlet's domain, so the reader can see who recorded
 *  the candidate before deciding whether to follow it. */
function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return 'source' }
}

// Warm palette carried over from the homepage / Election Centre.

export function generateStaticParams() {
  return ELECTORATE_SLUGS.map((electorate) => ({ electorate }))
}

export async function generateMetadata({ params }: { params: Promise<{ electorate: string }> }): Promise<Metadata> {
  const { electorate } = await params
  const info = getElectorateBySlug(electorate)
  if (!info) return { title: 'Electorate not found' }
  return { title: `${info.name} battleground`, description: `The contest for ${info.name}: the 2023 result, the incumbent, and the 2026 candidates as they're confirmed.` }
}

export default async function BattlePage({ params }: { params: Promise<{ electorate: string }> }) {
  const { electorate } = await params
  const info = getElectorateBySlug(electorate)
  if (!info) notFound()

  const tier = classifyMargin(info.majority)
  // Curated profiles first (richer), then editor-approved announced candidates
  // from the weekly ingest — deduped by name, incumbent excluded (they render
  // separately as "the defender").
  const curated = getCandidates(electorate)
  const live = await getApprovedCandidates(electorate, { excludeName: info.mpName })
  const curatedNames = new Set(curated.map((c) => c.name.toLowerCase()))
  const candidates = [...curated, ...live.filter((c) => !curatedNames.has(c.name.toLowerCase()))]
  // Withdrawn candidates stay on the page but leave the race. Anything that
  // answers "who is standing here" — the hero's lead challenger, the count, the
  // empty state — reads `standing`; the roster below still lists both, so a
  // reader who saw someone here last week learns what happened rather than
  // finding them quietly gone.
  const standing = candidates.filter((c) => !c.withdrawn)
  const withdrawn = candidates.filter((c) => c.withdrawn)
  // Withdrawn drop to the bottom of the roster.
  const rostered = [...standing, ...withdrawn]
  // Coverage naming each candidate by name, joined through the data.candidates
  // tag. Most challengers have no curated profile at all, so this is often the
  // only substantive thing a reader can learn about them here.
  const coverage = await getCoverageForCandidates(candidates.map((c) => c.key).filter((k): k is string => !!k))
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
            Won {info.name} by a majority of <b style={{ color: INK }}>{info.majority.toLocaleString('en-NZ')}</b> in 2023, making it a <b style={{ color: tier.color }}>{tier.label.toLowerCase()}</b> seat.
          </div>
        )}
        {mp?.bio && <p style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 10px' }}>{mp.bio}</p>}
        {resolvedSlug && mp && <Link href={`/mps/${resolvedSlug}`} style={cta}>Full MP profile <ArrowRight style={ic} /></Link>}
      </div>

      {mp && ((mp.portfolios && mp.portfolios.length > 0) || (mp.committees && mp.committees.length > 0)) && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 4 }}>What {firstName} has prioritised this term</div>
          <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, margin: '0 0 14px' }}>Official roles, sourced from parliament.nz.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 16 }}>
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
              No government bill in charge, members' bill passed, or members' bill currently in the ballot for {firstName} this term. We checked that against the official record, so it isn't a gap in our data.
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

            {/* Collapsed by default: on a phone this explainer + the Q&A list pushed
                the challengers ~3,700px down the page — the contest a first-time
                visitor came for was buried under the incumbent's paperwork. */}
            <details style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, marginBottom: 16, padding: '11px 13px' }}>
              <summary style={{ fontSize: 12.5, fontWeight: 700, color: INK, fontFamily: MANROPE, cursor: 'pointer' }}>
                What is this, and why does it matter to you?
              </summary>
              <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: '8px 0 0', lineHeight: 1.55 }}>
                Any MP can put a written question to a Minister, demanding information on the record. The Minister must reply, usually within days. It costs nothing and needs no debate, which makes it the main day-to-day tool MPs use to hold the government to account between bills. It matters most for opposition MPs, who can't pass laws but can still force information into the open. Which Ministers an MP questions most, below, is a numbers-based picture of what they watch on your behalf, and it's worth comparing against what they say they prioritise.
              </p>
            </details>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
              <span style={{ fontSize: 30, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1 }}>{wq.count.toLocaleString('en-NZ')}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: SECONDARY, fontFamily: MANROPE }}>written questions asked since the 2023 election</span>
            </div>

            {topMinisters.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <Label icon={Landmark} text="Where it's gone, by Minister" />
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

            <details>
              <summary style={{ cursor: 'pointer', listStyle: 'none' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800, color: JADE, fontFamily: MANROPE }}>
                  <ScrollText style={{ width: 14, height: 14 }} /> Read {wq.recent.length} recent questions &amp; replies, in {firstName}&rsquo;s and the Minister&rsquo;s own words
                </span>
              </summary>
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
            </details>

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
  const leadChallenger = standing.length > 0
    ? [...standing].sort((a, b) => (b.pollPct ?? 0) - (a.pollPct ?? 0))[0]
    : undefined
  const challengerColor = leadChallenger
    ? (leadChallenger.party === 'independent' ? '#6B7280' : PARTY_COLORS[leadChallenger.party].bg)
    : TERTIARY
  const hasPollData = candidates.some((c) => c.pollPct != null)
  const defenderPollPct = hasPollData
    ? Math.max(0, 100 - candidates.reduce((n, c) => n + (c.pollPct ?? 0), 0))
    : undefined

  // A challenger's party may be one this site profiles but that PARTY_COLORS
  // and PARTY_NAMES do not carry — those two maps hold only the six in
  // Parliament plus TOP. Falling through to PARTY_PROFILES is what lets an
  // Animal Justice or NZ Outdoors candidate render at all; before this they
  // were dropped upstream and 23 of 72 seats showed an incomplete field.
  // PARTY_PROFILES is typed Record<PartySlug, …> and a candidate's party arrives
  // as a plain string from the ingest, so it is read through one narrow accessor
  // rather than casting at four call sites.
  const profileOf = (slug: string) =>
    (PARTY_PROFILES as Record<string, { name?: string; fullName?: string; color?: string } | undefined>)[slug]

  const partyColour = (slug: string): string =>
    slug === 'independent' ? '#6B7280'
      : PARTY_COLORS[slug as PartySlug]?.bg ?? profileOf(slug)?.color ?? '#6B7280'
  const partyLight = (slug: string): string | undefined =>
    PARTY_COLORS[slug as PartySlug]?.light
  const partyLabel = (slug: string): string =>
    slug === 'independent' ? 'Independent'
      : PARTY_NAMES[slug as PartySlug]?.full ?? profileOf(slug)?.fullName ?? profileOf(slug)?.name ?? slug
  /** Only parties with a profile have somewhere to send a reader. */
  const partyHasProfile = (slug: string): boolean => slug !== 'independent' && !!profileOf(slug)

  const rosterItems: RosterItem[] = [
    {
      key: 'defender',
      color: incumbentColor,
      light: info.party ? PARTY_COLORS[info.party].light : undefined,
      avatarName: mp?.name ?? info.mpName ?? '?',
      avatarParty: info.party ?? undefined,
      avatarPhoto: mp?.photo,
      title: mp?.name ?? info.mpName ?? 'Result pending',
      subtitle: `${info.party ? PARTY_NAMES[info.party].full : 'Unverified'} · Defending`,
      badge: 'Incumbent',
      pollPct: defenderPollPct,
      body: defenderBody,
    },
    ...(standing.length === 0
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
      : rostered.map((c): RosterItem => {
          const color = partyColour(c.party)
          const isOut = !!c.withdrawn
          return {
            key: c.name,
            color,
            light: isOut ? undefined : partyLight(c.party),
            avatarName: c.name,
            avatarParty: c.party === 'independent' ? undefined : c.party,
            avatarPhoto: c.mpSlug ? MP_PROFILES[c.mpSlug]?.photo : undefined,
            title: c.name,
            subtitle: `${partyLabel(c.party)} · ${isOut ? 'Withdrew' : 'Challenging'}`,
            badge: isOut ? 'Withdrew' : c.incumbent ? 'Incumbent' : undefined,
            pollPct: c.pollPct,
            body: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16 }}>
                {/* Leads the panel when they are out. Everything below it — the
                    party's positions, what is still to come — is written for
                    someone still in the race, so the reader needs this first or
                    the rest misleads them. */}
                {c.withdrawn && (
                  <div style={{ display: 'flex', gap: 9, padding: '11px 13px', background: '#fff7e6', border: '1px solid #f0d9a8', borderRadius: 10 }}>
                    <Info style={{ width: 15, height: 15, color: '#92400e', flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 12.5, color: '#7c4a12', fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
                      <b>{c.name.split(' ')[0]} is no longer standing in {info.name}.</b> Withdrew {fmtLongDate(c.withdrawn.date)}.
                      Kept here rather than deleted, so the record of who was in this race stays straight.{' '}
                      <a href={c.withdrawn.source} target="_blank" rel="noopener noreferrer" style={{ color: '#7c4a12', textDecoration: 'underline' }}>
                        {hostOf(c.withdrawn.source)}
                      </a>
                    </p>
                  </div>
                )}
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
                {/* Sourced background from the candidate ingest. Not written by
                    us — it comes from the announcement they were recorded from. */}
                {c.notes && (
                  <div>
                    <Label icon={Info} text="Background" />
                    <p style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: '6px 0 0' }}>{c.notes}</p>
                  </div>
                )}

                {/* Where the coverage block used to be.
                    It was an empty state on almost every challenger: 218 of the
                    321 approved candidates have no sourced note at all, only two
                    are sitting MPs, and none has a curated bio. So the panel
                    promised a dossier and delivered "nothing names them yet".

                    What replaces it is real and already ours: the party's own
                    sourced, editor-checked positions. It is clearly THEIR PARTY'S
                    position, not this candidate's — a first-time candidate has no
                    published record of their own, and inventing one would be the
                    dishonest option. But someone weighing up this seat can act on
                    what the party they would sit with stands for. */}
                {partyHasProfile(c.party) && (
                  <div>
                    <Label icon={Landmark} text={`What ${profileOf(c.party)?.name ?? partyLabel(c.party)} stands for`} />
                    <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: '6px 0 8px' }}>
                      {c.name.split(' ')[0]} hasn&apos;t published a personal platform we can source yet. These are their party&apos;s
                      positions, summarised from its own policy documents and editor-checked.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      <Link href={`/parties/${c.party}`} style={pill(false)}>
                        Party profile <ArrowRight style={ic} />
                      </Link>
                      <Link href="/policies" style={pill(false)}>
                        Where they stand on the issues <ArrowRight style={ic} />
                      </Link>
                    </div>
                  </div>
                )}

                {/* The gap, stated rather than left to be felt. Nominations close
                    8 October 2026 (Electoral Commission timetable), which is when
                    the official candidate list lands and there is something worth
                    building a page around. */}
                <div style={{ display: 'flex', gap: 9, padding: '10px 12px', background: SURFACE, border: `1px dashed ${TERTIARY}`, borderRadius: 10 }}>
                  <Info style={{ width: 14, height: 14, color: SECONDARY, flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
                    Still to come: a background, priorities and the policies {c.name.split(' ')[0]} campaigns on. Nominations close
                    on <b>8 October</b>, and candidate detail fills in as parties and the Electoral Commission publish it.
                  </p>
                </div>

                {c.citations && c.citations.length > 0 && (
                  <div style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.6 }}>
                    Recorded from{' '}
                    {c.citations.map((u, i) => (
                      <span key={u}>
                        {i > 0 && ', '}
                        <a href={u} target="_blank" rel="noopener noreferrer" style={{ color: SECONDARY, textDecoration: 'underline' }}>
                          {hostOf(u)}
                        </a>
                      </span>
                    ))}
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
    // One continuous woven texture behind hero and body, painted once here so the
    // tiling doesn't restart and leave a seam under the hero.
    <div style={WOVEN_PAGE}>
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
        /* Track sits in the hero's title row, not floating above the content.
           Follows this seat into the Command Centre alongside tracked MPs,
           parties and bills. */
        action={<BookmarkButton entity={{
          // 'battleground', not 'electorate'. Both maps used to save the same
          // kind with the same ref_id, and the table is unique on
          // (user_id, kind, ref_id) — so following your seat on the map and
          // following a race here were one row overwriting the other.
          kind: 'battleground',
          refId: info.name,
          label: info.name,
          sublabel: `${tier.label} battleground${info.party ? ` · ${mp?.name ?? info.mpName}` : ''}`,
          href: `/battlegrounds/${electorate}`,
          accent: incumbentColor,
        }} />}
      />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 36px 64px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* In the news — real coverage naming this seat or its MP, from the same feed as /news */}
        <section style={sectionCard}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>In the news</h2>
          <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 14px' }}>Coverage naming {info.name} or {firstName}, from our tracked feeds.</p>
          <ElectorateNews electorateName={info.name} />
        </section>

        {/* The roster — tap a combatant to expand their full dossier */}
        <section style={sectionCard}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>The roster</h2>
          <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 14px' }}>
            The defender's record, and who's confirmed to challenge them in 2026.
            {hasPollData && <> Poll standing shown is illustrative only. No verified electorate-level polling exists for this preview.</>}
          </p>
          <RosterAccordion items={rosterItems} />
        </section>

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

/* Each major block gets its own bordered card. These sections used to be bare
   divs on the page's woven texture, so a heading was the only thing separating
   "In the news" from "The roster" and the page read as one long scroll.

   The ground is SURFACE rather than white on purpose: the cards inside — news
   items, and roster rows now washed in a party colour — need to sit ON
   something. A white section behind white cards would have flattened both. */
const sectionCard: React.CSSProperties = {
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  padding: 'clamp(16px, 3.5vw, 24px)',
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
