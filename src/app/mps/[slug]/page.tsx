/**
 * /mps/[slug] — one MP.
 *
 * Built for transparency: alongside the verified biography, the page shows what
 * each MP has actually done this term — the policy areas they shape, bills
 * they've worked on, their voting record, and their activity. Everything is
 * factual and sourced; we present the public record with fair context (roles
 * differ) and let the voter judge. We never score or label an MP.
 *
 * What this pass changed, and why:
 *
 * - The 519px `MPCard` trading card went (§6.1). Its own docblock called it a
 *   removable trial format, and all six of its fields were stated again in the
 *   sidebar's "At a glance" and a third time in the header badge row (§1.3).
 *   The identity a reader needs is §2.9's header row: a face, the name, one
 *   party-coloured line, and the facts in one list.
 * - The whole right-hand sidebar went. `.detail-two-col` collapses at 760px, so
 *   on a phone it was never a sidebar, it was four more cards after eight. "At a
 *   glance" duplicated the card; "Participation" restated four ImpactTiles from
 *   eighteen hundred pixels above it, two of them with the same "Being added"
 *   tag in both places. Committees moved in beside Roles; the parliament.nz link
 *   is §2.9's quiet foot link, stated once instead of three times.
 * - `ComingNote` (five uses) and three bare intro paragraphs became §2.1 (i)
 *   bubbles in mp-info.tsx. `ComingTag`, a "Being added" pill in a blue that
 *   exists nowhere else in the palette (§1.6), went with them: §1.5 asks for a
 *   gap to be SAID, once, not badged twice.
 * - Figures are the §2.14 card treatment and they GROW on a desktop instead of
 *   multiplying: the impact tile was 139x107 at 375px and 134x101 at 1920, a
 *   phone tile in a row of six. It is 165x79 and 244x92 now (see MP_CSS).
 * - The body column is 1080 and single, so every block on the page starts and
 *   ends on the same two vertical lines at 1920 (§5.19).
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowRight, ArrowUpRight, MapPin, Landmark, FileText, Vote, Users,
  ScrollText, ExternalLink, Mail, Globe, PenLine, Activity, Scale, Receipt, BadgeCheck,
} from 'lucide-react'
import { MP_INTERESTS } from '@/constants/mps-interests'
import { MP_EXPENSES } from '@/constants/mps-expenses'
import { MP_MEMBERS_BILLS } from '@/constants/mps-members-bills'
import { MP_PASSED_BILLS, MP_GOV_BILLS, BILL_ACTIVITY_META } from '@/constants/mps-bill-activity'
import { MP_PROFILES, MP_SLUGS } from '@/constants/mps-data'
import { PARTY_PROFILES } from '@/constants/parties-data'
import { PARTY_COLORS } from '@/constants/parties'
import { CURRENT_TERM } from '@/constants/term'
import { policiesForMP } from '@/lib/mps/policy-links'
import { getApprovedBills } from '@/lib/bills/live'
import { resolveBillLink, normBillTitle, type BillLink } from '@/lib/bills/bill-links'
import { Avatar } from '@/components/ui/avatar'
import { SignShape } from '@/components/ui/sign-link'
import { TrackWithAccount } from '@/components/bookmarks/track-with-account'
import { MpCoverage } from '@/components/mps/mp-coverage'
import { MpChanges, type StatChange } from '@/components/mps/mp-changes'
import {
  ProfileSourcesInfo, ImpactInfo, PoliciesInfo, BillsInfo, VotesInfo,
  InterestsInfo, ExpensesInfo, CoverageInfo, GapLine, QuietChip,
} from '@/components/mps/mp-info'
import MP_STAT_CHANGES from '@/constants/mp-stat-changes.json'
import { getNewsForMp } from '@/lib/news/live'
import { getVideosForMp } from '@/lib/news/videos'
import { formatNumber } from '@/lib/utils/format'
import { BackLink } from '@/components/ui/back-link'
import { BORDER, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

const billGroupLabel: React.CSSProperties = { fontSize: 11.5, fontWeight: 800, letterSpacing: '.02em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, margin: '0 0 7px' }

/**
 * "Spokesperson — Agriculture" becomes "Spokesperson: Agriculture" (§4: colon
 * for a short label). Done at RENDER, not in the data: there are 143 of these
 * in mps-detail-generated.ts, which is exactly the class of file §4's paid-for
 * warning is about, and src/lib/mps/policy-links.ts matches the same strings by
 * keyword, so changing the delimiter in place is a behaviour change.
 */
const plain = (s: string) => s.replace(/\s—\s/g, ': ')

export function generateStaticParams() {
  return MP_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const mp = MP_PROFILES[slug]
  if (!mp) return { title: 'MP not found' }
  const party = PARTY_PROFILES[mp.party]
  return {
    title: `${mp.name}, ${mp.title ?? (mp.role === 'electorate' ? `MP for ${mp.electorate}` : 'List MP')}`,
    description: `${mp.name}, ${party.name} ${mp.role === 'electorate' ? `MP for ${mp.electorate}` : 'list MP'}. Roles, bills, voting record and impact this term.`,
  }
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────

/** §4: headings match their peers. These were 16px against /bills's 24px, and
 *  the coverage sub-heads were 12.5px against these. */
function SectionHeading({ icon: Icon, title, info }: { icon: React.ElementType; title: string; info?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
      <Icon style={{ width: 19, height: 19, color: JADE, flexShrink: 0 }} />
      <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.025em', color: INK, fontFamily: MANROPE, margin: 0 }}>{title}</h2>
      {info}
    </div>
  )
}

/** §2.4's container: radius 16, 1px BORDER, the warm shadow. It was radius 18
 *  with a COOL `rgba(12,14,18,.03)`, which theme.ts says in terms reads as
 *  grubby against the woven ground. */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mp-card-box" style={{
      background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16,
      boxShadow: '0 1px 2px rgba(0,0,0,.03), 0 20px 40px -34px rgba(0,0,0,.4)',
    }}>
      {children}
    </div>
  )
}

/** One figure, in the §2.14 card treatment: the party's own light fill and a
 *  2px border in its colour, because this block is about one MP of one party
 *  (§1.6). Every size steps up at 768px — see MP_CSS. */
function Figure({ value, label, colour, light }: { value: string; label: string; colour: string; light: string }) {
  return (
    <div className="mp-fig" style={{ background: light, border: `2px solid ${colour}`, minWidth: 0 }}>
      <div className="mp-fig-n" style={{ fontWeight: 800, color: INK, fontFamily: MANROPE, letterSpacing: '-.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div className="mp-fig-l" style={{ fontWeight: 700, color: SECONDARY, fontFamily: MANROPE }}>{label}</div>
    </div>
  )
}

/** §2.9's fact row: a fixed label column against a bold value. */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="mp-fact" style={{ display: 'flex', gap: 10, borderTop: `1px solid ${BORDER}` }}>
      <span className="mp-fact-l" style={{ flexShrink: 0, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>{label}</span>
      <span className="mp-fact-v" style={{ flex: 1, minWidth: 0, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.35 }}>{value}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function MPProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const mp = MP_PROFILES[slug]
  if (!mp) notFound()

  const party = PARTY_PROFILES[mp.party]
  const colours = PARTY_COLORS[mp.party]
  const light = colours?.light ?? SURFACE
  const isActive = mp.status === 'active'
  const isMinister = !!mp.title && /minister/i.test(mp.title)
  const policies = policiesForMP(mp)

  // Anything on this MP's record that moved, from the dated changelog the daily
  // refresh writes. Filtered here so the client only receives this MP's entries.
  const statChanges = (MP_STAT_CHANGES.changes as StatChange[]).filter((c) => c.mp === slug)

  // Coverage tagged to this MP. Server-side so the profile renders complete.
  const [mpNews, mpVideos] = await Promise.all([
    getNewsForMp(slug, 5),
    getVideosForMp(slug, 3),
  ])

  // 54th-Parliament bill activity from the official bills API + the members'
  // bill ballot.
  const passedBills = MP_PASSED_BILLS[mp.slug] ?? []          // members' bills now law
  const govBills = MP_GOV_BILLS[mp.slug] ?? []                // government bills in charge (Ministers)
  const proposedBills = MP_MEMBERS_BILLS[mp.slug] ?? []       // members' bill in the ballot
  const ballotBills = (mp.membersBills && mp.membersBills.length)
    ? mp.membersBills.map((b) => ({ title: b.title, status: b.status }))
    : proposedBills.map((b) => ({ title: b.title, status: 'In ballot' }))
  const hasBills = passedBills.length > 0 || govBills.length > 0 || ballotBills.length > 0
  const notableVotes = mp.notableVotes ?? []

  // Resolve each listed bill to a page: an internal plain-language reader when
  // one is published, else the official parliament.nz page.
  const readable = await getApprovedBills()
  const readerSlugs: Record<string, string> = {}
  for (const b of readable) readerSlugs[normBillTitle(b.title)] = b.slug
  const billLink = (title: string): BillLink | null => resolveBillLink(title, readerSlugs)

  const portfolios = mp.portfolios ?? []
  const committees = mp.committees ?? []
  const seatLine = mp.role === 'electorate' ? `MP for ${mp.electorate}` : 'List MP'

  return (
    <div style={WOVEN_PAGE}>
      <style dangerouslySetInnerHTML={{ __html: MP_CSS }} />

      {/* ═══════════════ Header ═══════════════ */}
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ height: 5, background: party.color }} />
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '18px clamp(18px, 5vw, 36px) 24px' }}>
          <BackLink fallbackHref="/mps" label="All MPs" style={{ fontSize: 13, fontWeight: 600, color: SECONDARY, fontFamily: MANROPE, marginBottom: 16 }} />

          {/* §2.9's identity row: a face, the name, one party-coloured line.
              It replaced a 320px card carrying a 30px role abbreviation, a
              party crest, a 150px photo and the name in uppercase display
              type, none of which said anything the line below does not. */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span className="mp-face" style={{ display: 'flex', flexShrink: 0 }}>
              <Avatar name={mp.name} party={mp.party} src={mp.photo} size="lg" face />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 'clamp(24px, 6vw, 34px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.1 }}>
                  {mp.name}
                </h1>
                {/* The page's provenance, beside the name, the way
                    AboutBillsTracker sits beside the /bills h1. It was 188px
                    of footer before. */}
                <ProfileSourcesInfo accent={party.color} parliamentUrl={mp.parliamentUrl} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, marginTop: 4 }}>
                {party.name} · {seatLine}
              </div>
              {mp.title && (
                <span style={{ display: 'inline-block', marginTop: 7, padding: '3px 10px', borderRadius: 999, background: party.color, color: party.textColor, fontSize: 12, fontWeight: 800, fontFamily: MANROPE }}>
                  {plain(mp.title)}
                </span>
              )}
              {/* Said only when it is true of this record. A badge reading
                  "Active" on all 122 profiles is not a fact, it is furniture. */}
              {!isActive && (
                <span style={{ display: 'inline-block', marginTop: 7, marginLeft: 6, padding: '3px 10px', borderRadius: 999, background: SURFACE, border: `1px solid ${BORDER}`, color: SECONDARY, fontSize: 12, fontWeight: 800, fontFamily: MANROPE }}>
                  Former MP
                </span>
              )}
            </div>
          </div>

          {/* The facts, once. Two columns from 768px, because one column of
              five rows under a 1008px header is a phone layout with the page's
              margins doing the rest. */}
          <div className="mp-facts" style={{ marginTop: 16 }}>
            {mp.role === 'electorate' && mp.electorate && <Fact label="Electorate" value={mp.electorate} />}
            {mp.role !== 'electorate' && <Fact label="How elected" value="Came off the party list" />}
            {typeof mp.electorateMajority === 'number' && <Fact label="2023 majority" value={`${formatNumber(mp.electorateMajority)} votes`} />}
            {mp.enteredParliament && <Fact label="In Parliament since" value={String(mp.enteredParliament)} />}
            {mp.bornYear && <Fact label="Born" value={`${mp.bornYear}${mp.bornPlace ? `, ${mp.bornPlace}` : ''}`} />}
            {mp.fullName !== mp.name && <Fact label="Full name" value={mp.fullName} />}
          </div>

          {/* ONE signpost out of this block (§2.6), and it is the one thing a
              reader can actually DO here. The other three were a jade button,
              an outlined button and a 16px bookmark pill, four controls on a
              ragged row that wrapped to three lines at 375px. */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 18 }}>
            {isActive && (
              <SignShape
                href={`/take-action/${isMinister ? 'minister' : 'mp'}?to=${mp.slug}`}
                color={JADE}
                fg="#fff"
                icon={<PenLine style={{ width: 16, height: 16 }} />}
              >
                Write to this {isMinister ? 'Minister' : 'MP'}
              </SignShape>
            )}
            {/* §2.13's canonical control: quiet at rest, and it raises the
                account dialog on the page rather than saving nothing. */}
            <TrackWithAccount
              entity={{
                kind: 'mp', refId: mp.slug, label: mp.name,
                sublabel: mp.role === 'electorate' ? `MP for ${mp.electorate}` : `${party.name} list MP`,
                href: `/mps/${mp.slug}`, accent: party.color,
              }}
              label="Track"
              savedLabel="Tracking"
              accent={party.color}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
            <QuietChip href={`/parties/${mp.party}`}>All of {party.name} <ArrowRight style={{ width: 12, height: 12 }} /></QuietChip>
            {mp.role === 'electorate' && mp.electorate && (
              <QuietChip href={`/map?search=${encodeURIComponent(mp.electorate)}`}><MapPin style={{ width: 12, height: 12 }} /> See the electorate</QuietChip>
            )}
            {mp.website && <QuietChip href={mp.website} external><Globe style={{ width: 12, height: 12 }} /> Party website</QuietChip>}
            {mp.email && <QuietChip href={`mailto:${mp.email}`} external><Mail style={{ width: 12, height: 12 }} /> {mp.email}</QuietChip>}
          </div>

          {/* §2.9's quiet foot link. It was stated three times: a sidebar
              "Official links" row, the sources footer, and a third in the
              basic-profile branch. */}
          <a href={mp.parliamentUrl} target="_blank" rel="noopener noreferrer"
             style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 12, fontSize: 12.5, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, textDecoration: 'none' }}>
            Their page on parliament.nz <ExternalLink style={{ width: 11, height: 11 }} />
          </a>
        </div>
      </div>

      {/* ═══════════════ Body ═══════════════ */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px clamp(18px, 5vw, 36px) 56px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Open on arrival, deliberately: §1.1 is about contents the reader has
            not asked for, and this is the one block that is new to THIS reader
            since their last visit. */}
        <MpChanges slug={slug} changes={statChanges} />

        {/* Impact this term */}
        {isActive && (
          <Card>
            <SectionHeading icon={Activity} title="Impact this term" info={<ImpactInfo accent={party.color} isMinister={isMinister} />} />
            <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, margin: '-4px 0 12px' }}>{CURRENT_TERM.label} · {CURRENT_TERM.sinceLabel}</p>
            <div className="mp-figs">
              <Figure value={String(portfolios.length)} label="Roles and spokesperson areas" colour={party.color} light={light} />
              <Figure value={String(committees.length)} label="Committees they sit on" colour={party.color} light={light} />
              {govBills.length > 0 && <Figure value={String(govBills.length)} label="Government bills they are in charge of" colour={party.color} light={light} />}
              {passedBills.length > 0 && <Figure value={String(passedBills.length)} label="Their own bills now law" colour={party.color} light={light} />}
              <Figure value={String(ballotBills.length)} label="Bills lodged, waiting to be drawn" colour={party.color} light={light} />
              {typeof mp.writtenQuestions === 'number' && (
                <Figure value={formatNumber(mp.writtenQuestions)} label="Written questions to ministers" colour={party.color} light={light} />
              )}
            </div>
          </Card>
        )}

        {/* Biography */}
        {mp.bio && (
          <Card>
            <SectionHeading icon={ScrollText} title="Biography" />
            <p className="mp-prose" style={{ fontSize: 14.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.7, margin: 0 }}>{mp.bio}</p>
            {mp.bioSourceUrl && (
              <a href={mp.bioSourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, color: TERTIARY, fontFamily: MANROPE, textDecoration: 'none', marginTop: 8 }}>
                Source: Wikipedia <ArrowUpRight style={{ width: 11, height: 11 }} />
              </a>
            )}
            {mp.priorCareer && (
              <div style={{ marginTop: 14, padding: '12px 14px', background: SURFACE, borderRadius: 10, border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 5 }}>Before Parliament</div>
                <p className="mp-prose" style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>{mp.priorCareer}</p>
              </div>
            )}
          </Card>
        )}

        {/* Policies they shape */}
        {isActive && (
          <Card>
            <SectionHeading icon={Scale} title="Policies they shape" info={<PoliciesInfo accent={party.color} />} />
            {policies.length > 0 ? (
              <div className="mp-rows">
                {policies.map((p) => (
                  <Link key={p.topic} href={`/policies/${p.topic}`} style={{ textDecoration: 'none' }}>
                    <div className="party-card stack-row" style={{ padding: '12px 14px', border: `1px solid ${BORDER}`, borderRadius: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{p.label}</div>
                        <div style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.45, marginTop: 1 }}>{plain(p.reason)}</div>
                      </div>
                      <span className="stack-tail" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 800, color: JADE, fontFamily: MANROPE, whiteSpace: 'nowrap' }}>Where parties stand <ArrowRight style={{ width: 13, height: 13 }} /></span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <GapLine>
                No portfolios, spokesperson roles or committees are on record for {mp.name} yet, so we have nothing
                to map. See where {party.name} stands across every area on the{' '}
                <Link href={`/parties/${mp.party}`} style={{ color: JADE, fontWeight: 700 }}>party page</Link>.
              </GapLine>
            )}
          </Card>
        )}

        {/* Bills they've worked on */}
        {isActive && (
          <Card>
            <SectionHeading icon={FileText} title="Bills they’ve worked on" info={<BillsInfo accent={party.color} />} />
            {hasBills ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {passedBills.length > 0 && (
                  <div style={{ background: '#e0f3e7', border: '2px solid #166638', borderRadius: 11, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                      <BadgeCheck style={{ width: 16, height: 16, color: '#166638' }} />
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: '#166638', fontFamily: MANROPE }}>
                        Bill{passedBills.length > 1 ? 's' : ''} of their own now law
                      </span>
                    </div>
                    {passedBills.map((b) => {
                      const l = billLink(b.title)
                      const label = <>{b.title} <span style={{ fontSize: 11, fontWeight: 700, color: '#166638' }}>· now an Act</span></>
                      return (
                        <div key={b.title} style={{ fontSize: 13.5, fontWeight: 600, color: INK, fontFamily: MANROPE, lineHeight: 1.45, paddingLeft: 23 }}>
                          {l ? (
                            l.external
                              ? <a href={l.href} target="_blank" rel="noopener noreferrer" style={{ color: INK, textDecoration: 'none' }} className="bill-link">{label}</a>
                              : <Link href={l.href} style={{ color: INK, textDecoration: 'none' }} className="bill-link">{label}</Link>
                          ) : label}
                        </div>
                      )
                    })}
                  </div>
                )}

                {govBills.length > 0 && (
                  <div>
                    {/* §1.7: "Government bills: member in charge" is Parliament's
                        phrase for a job that has a plain name. */}
                    <div style={billGroupLabel}>Government bills {mp.name.split(' ')[0]} is responsible for ({govBills.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {govBills.slice(0, 8).map((b, i) => {
                        const l = billLink(b.title)
                        return <BillRow key={`g-${b.title}`} title={b.title} tag={b.status ?? 'In progress'} tagColor="#92400e" tagBg="#f8ecd4" href={l?.href} external={l?.external} first={i === 0} />
                      })}
                    </div>
                    {govBills.length > 8 && (
                      <div style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE, marginTop: 8 }}>
                        +{govBills.length - 8} more, see <Link href="/bills" style={{ color: JADE, fontWeight: 700 }}>every bill this term</Link>
                      </div>
                    )}
                  </div>
                )}

                {ballotBills.length > 0 && (
                  <div>
                    <div style={billGroupLabel}>Bills {mp.name.split(' ')[0]} has lodged, waiting to be drawn</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {ballotBills.map((b, i) => {
                        const l = billLink(b.title)
                        return <BillRow key={`m-${b.title}`} title={b.title} tag={b.status} tagColor="#166638" tagBg="#e0f3e7" href={l?.href} external={l?.external} first={i === 0} />
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <GapLine>
                {isMinister
                  ? `As a minister, ${mp.name} leads government bills in their portfolio rather than bills of their own.`
                  : `${mp.name} has no bill in the ballot at the moment.`}{' '}
                <Link href="/bills" style={{ color: JADE, fontWeight: 700 }}>Every bill this term</Link>.
              </GapLine>
            )}
            <a href={BILL_ACTIVITY_META.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none', marginTop: 14 }}>
              {BILL_ACTIVITY_META.sourceLabel} · as at {BILL_ACTIVITY_META.asOf} <ArrowUpRight style={{ width: 12, height: 12 }} />
            </a>
          </Card>
        )}

        {/* Voting record */}
        {isActive && (
          <Card>
            {/* §1.7 and the §2.8 precedent: lead with what it is, not with
                Parliament's word for it. The party-vote mechanism was ~8 lines
                of explanation above a list that for most MPs is empty. */}
            <SectionHeading icon={Vote} title="Votes cast on their own" info={<VotesInfo accent={party.color} party={party.name} />} />
            {notableVotes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {notableVotes.map((v, i) => (
                  <div key={v.title} className="mp-vote-row" style={{ padding: '11px 82px 11px 0', borderTop: i === 0 ? 'none' : `1px solid ${BORDER}`, position: 'relative' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: INK, fontFamily: MANROPE, lineHeight: 1.4 }}>{v.title}</div>
                    {v.conscience && <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: SECONDARY, fontFamily: MANROPE }}>Voted on their own</span>}
                    {/* Absolutely placed, not a nowrap chip in a flex row:
                        globals.css records that exact squeeze leaving 49px for
                        a title and seven lines of one word each. */}
                    <span style={{
                      position: 'absolute', top: 11, right: 0,
                      fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap',
                      background: v.vote === 'For' ? '#e0f3e7' : v.vote === 'Against' ? '#f8e4e2' : SURFACE,
                      color: v.vote === 'For' ? '#166638' : v.vote === 'Against' ? '#a3251f' : SECONDARY,
                      borderRadius: 999, padding: '4px 12px', fontFamily: MANROPE,
                    }}>{v.vote}</span>
                  </div>
                ))}
              </div>
            ) : (
              <GapLine>No votes cast on their own are recorded for {mp.name} this term.</GapLine>
            )}
          </Card>
        )}

        {/* Declared interests — official register */}
        {isActive && MP_INTERESTS[mp.slug] && (
          <Card>
            <SectionHeading icon={Landmark} title="Declared interests" info={<InterestsInfo accent={party.color} />} />
            <p className="mp-prose" style={{ fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.7, margin: 0 }}>{MP_INTERESTS[mp.slug].interests}</p>
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
              <SectionHeading icon={Receipt} title="Taxpayer-funded expenses" info={<ExpensesInfo accent={party.color} />} />
              <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, margin: '-4px 0 12px' }}>{e.period}</p>
              <div className="mp-figs">
                <Figure value={money(e.total)} label="Total this quarter" colour={party.color} light={light} />
                <Figure value={money(e.accommodation)} label="Accommodation" colour={party.color} light={light} />
                <Figure value={money(e.travel)} label="Travel" colour={party.color} light={light} />
              </div>
              <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none', marginTop: 12 }}>
                {e.sourceLabel} <ArrowUpRight style={{ width: 12, height: 12 }} />
              </a>
            </Card>
          )
        })()}

        {/* Roles and committees. One card and one name: the tile above counted
            "Roles & spokesperson areas" and this card listed "Roles &
            responsibilities", two names for one thing reading the same field. */}
        {(portfolios.length > 0 || committees.length > 0) && (
          <Card>
            <SectionHeading icon={Users} title="Roles and committees" />
            {portfolios.length > 0 && (
              <div className="mp-rows">
                {portfolios.map((p) => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: SURFACE, borderRadius: 10, border: `1px solid ${BORDER}` }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: party.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: INK, fontFamily: MANROPE }}>{plain(p)}</span>
                  </div>
                ))}
              </div>
            )}
            {committees.length > 0 ? (
              <>
                <div style={{ ...billGroupLabel, marginTop: portfolios.length > 0 ? 16 : 0 }}>Committees they sit on</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {committees.map((c) => (
                    <span key={c} style={{ fontSize: 12, fontWeight: 700, color: SECONDARY, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '4px 11px', fontFamily: MANROPE }}>{c}</span>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ marginTop: portfolios.length > 0 ? 14 : 0 }}>
                <GapLine>No select committee membership is on record for {mp.name}.</GapLine>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* ═══════════════ Latest coverage ═══════════════ */}
      {/* Below the record, because the page leads with what this MP has
          actually done and then shows what is being reported about them. */}
      <div style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="ap-col" style={{ maxWidth: 1080, margin: '0 auto', padding: '24px clamp(18px, 5vw, 36px) 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.025em', color: INK, fontFamily: MANROPE, margin: 0 }}>
              Latest coverage
            </h2>
            <CoverageInfo accent={party.color} />
          </div>
          <MpCoverage slug={slug} name={mp.name} accent={party.color} news={mpNews} videos={mpVideos} />
        </div>
      </div>

      {/* Photo credit only. The rest of that footer was the page's provenance,
          which is the (i) beside the name now; this is an attribution
          requirement and belongs with the photo (§5.17: a cut removes a
          duplicate, and this was not one). */}
      {mp.photo && mp.photoCredit && (
        <div style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', padding: '14px clamp(18px, 5vw, 36px)' }}>
            <p style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE, margin: 0 }}>
              Photo: {mp.photoCredit}{mp.photoLicense ? `, ${mp.photoLicense}` : ''}
              {mp.photoSourceUrl && (<>{' '}<a href={mp.photoSourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 600 }}>(source <ArrowUpRight style={{ width: 10, height: 10, display: 'inline' }} />)</a></>)}.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Bill row ─────────────────────────────────────────────────────────────────
/**
 * §2.12's row, not §2.3's tile: a bill listed on a profile has a title, a
 * status and nothing else, so a tile that opened would open onto one fact.
 *
 * The tag is ABSOLUTE and the row reserves 82px for it. It was a `nowrap` chip
 * beside flexible text in a flex row, which globals.css already records as a
 * squeeze rather than a layout: "Committee of whole House" measured 178px of a
 * 288px row at 375px, leaving 49px for the title and seven lines of one word
 * each. `.bft-row` got the fix; this never did.
 */
function BillRow({ title, tag, tagColor, tagBg, href, external, first }: { title: string; tag: string; tagColor: string; tagBg: string; href?: string; external?: boolean; first: boolean }) {
  const inner = (
    <div style={{ position: 'relative', padding: '11px 92px 11px 0', borderTop: first ? 'none' : `1px solid ${BORDER}` }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: INK, fontFamily: MANROPE, lineHeight: 1.4 }}>{title}</span>
        {href && (external
          ? <ArrowUpRight className="bill-row-caret" style={{ width: 13, height: 13, flexShrink: 0 }} />
          : <ArrowRight className="bill-row-caret" style={{ width: 13, height: 13, flexShrink: 0 }} />)}
      </span>
      <span style={{ position: 'absolute', top: 11, right: 0, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', background: tagBg, color: tagColor, borderRadius: 999, padding: '3px 10px', fontFamily: MANROPE }}>{tag}</span>
    </div>
  )
  if (!href) return inner
  return external
    ? <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }} className="bill-link">{inner}</a>
    : <Link href={href} style={{ textDecoration: 'none', display: 'block' }} className="bill-link">{inner}</Link>
}

/* Shipped with the page (§3.2): every inline style on this profile was
   unreachable by a media query, and the one <style> block it had carried hover
   rules only.

   THE DESKTOP RULE (§2.14). The figure tile was 139x107 at 375px and 134x101 at
   1920 — it got SMALLER on a wide screen, because minmax(120px) against a
   1008px column gives eight tracks and the page's margins do the rest. The
   track goes 150 to 230 at 768px and every size inside steps up with it:
   figure 20 to 24, label 12 to 13, padding 8/10/9 to 11/13/12, radius 11 to 13.
   Measured: 165x79 at 375px, 244x92 at 1080 and above. Same tile, larger.

   The label box is a FIXED two lines at both sizes, restated because two lines
   of 13px is 34px where two lines of 12px was 32. "Government bills they are in
   charge of" wraps where "Accommodation" does not, and because grid items
   stretch to their row, the difference shows BETWEEN rows (§2.14). */
const MP_CSS = `
.bill-row-caret { color: #c2c6cd; transition: transform .15s ease, color .15s ease; }
.bill-link:hover .bill-row-caret { color: ${JADE}; transform: translateX(2px); }
.bill-link:hover { background: ${SURFACE}; border-radius: 8px; }

.mp-card-box { padding: 16px; }
.mp-rows { display: flex; flex-direction: column; gap: 8px; }
/* A 1008px line of 14.5px type is about 150 characters, which is twice a
   comfortable measure. The CARD still runs the full column, so every block
   starts and ends on the same two vertical lines (§5.19); only the prose
   inside it stops. */
.mp-prose { max-width: 68ch; }

.mp-facts { display: grid; grid-template-columns: 1fr; }
.mp-fact { padding: 7px 0; }
.mp-fact-l { width: 96px; font-size: 12px; }
.mp-fact-v { font-size: 13.5px; }

.mp-figs { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr)); gap: 8px; }
.mp-fig { border-radius: 11px; padding: 8px 10px 9px; }
.mp-fig-n { font-size: 20px; }
.mp-fig-l { font-size: 12px; line-height: 1.3; height: 32px; margin-top: 6px; overflow: hidden; }

@media (min-width: 768px) {
  .mp-card-box { padding: 20px 22px; }
  /* The face steps up with everything else: the avatar is sized by a class on
     the shared component, so it is scaled here rather than by a prop. */
  .mp-face > div { width: 80px !important; height: 80px !important; }
  /* Two columns of facts. One column of five rows under a 1008px header is a
     phone layout with the page margins doing the rest. */
  .mp-facts { grid-template-columns: 1fr 1fr; column-gap: 32px; }
  .mp-fact-l { width: 110px; font-size: 12.5px; }
  .mp-fact-v { font-size: 15px; }

  .mp-figs { grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 10px; }
  .mp-fig { border-radius: 13px; padding: 11px 13px 12px; }
  .mp-fig-n { font-size: 24px; }
  .mp-fig-l { font-size: 13px; height: 34px; margin-top: 7px; }
}
`
