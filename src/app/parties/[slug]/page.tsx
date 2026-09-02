/**
 * /parties/[slug] — Individual party profile
 *
 * Template for all party pages, driven by parties-data.ts. Overview, history,
 * core values and key policy areas are sourced content. No caucus list: for
 * National it ran to 49 rows and stretched the page well past everything that
 * actually distinguishes one party from another. The MPs live at /mps.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowRight, ArrowUpRight, Calendar, Landmark,
  ScrollText, Star, ExternalLink, Globe, CheckCircle2,
} from 'lucide-react'
import { PARTY_PROFILES, PARTY_DIRECTORY_ORDER, PROFILED_MINOR_PARTIES } from '@/constants/parties-data'
import { CURRENT_SEATS, TOTAL_SEATS, PARTY_STATUS } from '@/constants/parties'
import { MP_PROFILES } from '@/constants/mps-data'
import { PartySlug } from '@/types'
import { PartyCoverage } from '@/components/parties/party-coverage'
import { BackLink } from '@/components/ui/back-link'
import { Avatar } from '@/components/ui/avatar'
import { SectionDivider } from '@/components/ui/section-divider'
import { BookmarkButton } from '@/components/bookmarks/bookmark-button'
import { PartyLegislativeRecord } from '@/components/parties/legislative-record'
import { PartyPolicyExplorer } from '@/components/parties/party-policy-explorer'
import { PARTY_POLICY_ANCHOR } from '@/components/policy/back-to-party'
import { PartySwitcher } from '@/components/parties/party-switcher'
import { isLightHex } from '@/components/homepage/battleground-card'
import { getAllApprovedPositions } from '@/lib/positions/live'
import { allDeepDivePaths } from '@/constants/policy-deep-dives'
import { BORDER, DISPLAY, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

// ─── Design tokens ────────────────────────────────────────────────────────────

// The warm woven palette shared with the homepage and Election Centre — the
// party pages were still on cool grey over flat white, which is what made them
// read as a different site.

/** Party colour at low alpha, for tints that stay readable behind text. */
function tint(hex: string, a: number) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

// ─── Static generation ────────────────────────────────────────────────────────

// Revalidated, not force-dynamic.
//
// The worry that made this dynamic was real but the remedy was too strong: a
// page baked at BUILD time shows whatever was approved on the day we deployed,
// which is days stale. Sixty seconds is not. Meanwhile force-dynamic meant a
// server render plus a Supabase round trip on every party switch — measured at
// 1.7-2.4s per click on production, which is why switching party read as a full
// page reload rather than a change of view.
//
// The positions read is cookie-free and cached now (see lib/positions/live.ts),
// so this route can be cached at all. With generateStaticParams below, each
// party is prerendered and Link prefetch makes the switch immediate.
export const revalidate = 60

export function generateStaticParams() {
  return [...PARTY_DIRECTORY_ORDER, ...PROFILED_MINOR_PARTIES].map((slug) => ({ slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const party = PARTY_PROFILES[slug as PartySlug]
  if (!party || slug === 'independent') return { title: 'Party not found' }
  return {
    title: `${party.name}: ${party.fullName}`,
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

/** Outlined in the party's own colour. A neutral 1px hairline on a textured
 *  background reads as no edge at all — the cards dissolved into the weave. */
function Card({ children, accent, style, className, id }: { children: React.ReactNode; accent?: string; style?: React.CSSProperties; className?: string; id?: string }) {
  return (
    <div id={id} className={className} style={{
      background: '#ffffff', border: `2px solid ${accent ? tint(accent, 0.45) : BORDER}`, borderRadius: 18,
      padding: '22px 24px', boxShadow: '0 1px 2px rgba(42,18,6,.04), 0 8px 20px -12px rgba(42,18,6,.14)', ...style,
    }}>
      {children}
    </div>
  )
}

/** The heading icon carries the party's colour in a soft chip — the one visual
 *  thread that makes each party's page feel like that party's, rather than the
 *  same jade template with a different name at the top. */
function SectionHeading({ icon: Icon, title, accent = JADE }: { icon: React.ElementType; title: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <span style={{ width: 28, height: 28, borderRadius: 9, background: tint(accent, 0.12), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 15, height: 15, color: accent }} />
      </span>
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

  // Live positions for this party. Current policy only — a 2023 manifesto entry
  // exists for the then-and-now comparison and would misrepresent the party if
  // shown as what they say today.
  const allPositions = await getAllApprovedPositions()
  const partyPositions = allPositions.filter((p) => p.party === slug && p.period !== '2023')
  const diveTopics = [...new Set(allDeepDivePaths().filter((d) => d.party === slug).map((d) => d.topic))]

  return (
    // Same woven ground as the homepage and Election Centre, so a party page
    // stops looking like a page from another site.
    //
    // key={slug} + .party-swap cross-fades the whole page when you switch party
    // in the switcher. Keyed on the slug so React remounts the subtree and the
    // entry animation replays on every switch rather than only on first paint.
    // Worth nothing until the switch was fast: at the 1.9s this used to take, a
    // fade would only have drawn attention to the wait.
    <div key={slug} className="party-swap" style={{
      ...WOVEN_PAGE,
      // The party wash runs the FULL height of the page rather than fading out
      // below the header. It was a 180deg gradient that reached transparent at
      // 60% of the header band, so the page changed identity halfway down the
      // first screen — party-coloured at the top, generic paper from there on.
      // A two-stop gradient of one colour is a flat layer: it tints the whole
      // page evenly and keeps the woven texture underneath it.
      backgroundImage: `linear-gradient(${tint(party.color, 0.12)}, ${tint(party.color, 0.12)}), url(/back2.jpg)`,
    }}>

      {/* ═══════════════ Header band ═══════════════ */}
      {/* No background of its own — it sits on the page wash above, so there is
          no seam where the header ends. */}
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ height: 6, background: party.color }} />

        <div className="ap-col" style={{ maxWidth: 1080, margin: '0 auto', padding: '24px clamp(18px, 5vw, 36px) 36px' }}>

          <BackLink fallbackHref="/parties" label="All parties" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 13, fontWeight: 600, color: SECONDARY, textDecoration: 'none',
            fontFamily: MANROPE, marginBottom: 16,
          }} />

          {/* The top layer: change party without going back to the index.
              Sits above the identity block so the reader can see, before
              anything else, that every registered party has a page here. */}
          <div style={{ marginBottom: 24 }}>
            <PartySwitcher current={slug} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 28, flexWrap: 'wrap' }}>
            {/* Left: identity */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <h1 style={{
                fontSize: 'clamp(26px, 7vw, 40px)', fontWeight: 800, letterSpacing: '-.02em', color: INK,
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

              {/* Leadership — faces up front */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 18 }}>
                <div style={{ display: 'flex' }}>
                  <Avatar name={party.leader} party={slug as PartySlug} src={leaderSlug ? MP_PROFILES[leaderSlug].photo : party.leaderPhoto} size="lg" face />
                  {party.coLeader && (
                    <div style={{ marginLeft: -16, borderRadius: '50%', boxShadow: '0 0 0 3px #fff' }}>
                      <Avatar name={party.coLeader} party={slug as PartySlug} src={coLeaderSlug ? MP_PROFILES[coLeaderSlug].photo : undefined} size="lg" face />
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>
                    {party.coLeader ? 'Co-leaders' : party.leaderTitle}
                  </div>
                  <div style={{ fontSize: 15.5, fontWeight: 800, color: INK, fontFamily: MANROPE, marginTop: 2, lineHeight: 1.25 }}>
                    {party.leader}{party.coLeader ? ` & ${party.coLeader}` : ''}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 15, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, maxWidth: 520, margin: '0 0 18px' }}>
                {party.tagline}
              </p>

              {/* Links */}
              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                {/* The party's own colour, not the site's jade — a green
                    primary button on a page washed in Labour red read as
                    something borrowed from another site. Light party colours
                    (ACT's yellow, TOP's teal) take ink rather than white, or
                    the label disappears into the fill. */}
                <a href={party.website} target="_blank" rel="noopener noreferrer"
                  style={{ ...btnBase, background: party.color, color: isLightHex(party.color) ? INK : '#ffffff' }}>
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

            {/* Right: seat figure — the party's colour all the way round and a
                wash of it inside, rather than a white card with a coloured lid. */}
            <div style={{
              background: tint(party.color, 0.10), border: `2px solid ${party.color}`, borderRadius: 18,
              padding: '20px 26px', boxShadow: '0 1px 2px rgba(42,18,6,.04), 0 8px 20px -12px rgba(42,18,6,.14)',
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
      <div className="detail-two-col ap-col" style={{ maxWidth: 1080, margin: '0 auto', padding: '36px clamp(18px, 5vw, 36px) 64px' }}>

        {/* ── Main column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Overview */}
          <Card accent={party.color}>
            <SectionHeading icon={Landmark} title="Overview" accent={party.color} />
            <p style={{ fontSize: 14.5, color: '#3b3229', fontFamily: MANROPE, lineHeight: 1.7, margin: 0 }}>
              {party.overview}
            </p>
          </Card>

          {/* History */}
          <Card accent={party.color}>
            <SectionHeading icon={ScrollText} title="History" accent={party.color} />
            <p style={{ fontSize: 14.5, color: '#3b3229', fontFamily: MANROPE, lineHeight: 1.7, margin: 0 }}>
              {party.history}
            </p>
            <div style={{ marginTop: 14, fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, fontStyle: 'italic' }}>
              {party.founded_note}
            </div>
          </Card>

          {/* Core values */}
          <Card accent={party.color}>
            <SectionHeading icon={CheckCircle2} title="Core values" accent={party.color} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {party.coreValues.map((v) => (
                <div key={v} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: party.color, flexShrink: 0, marginTop: 7 }} />
                  <span style={{ fontSize: 14, color: '#3b3229', fontFamily: MANROPE, lineHeight: 1.5 }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Key policy areas */}
          {/* Where /compare's job now lives. The old card listed this party's
              "key policy areas" and sent you to a grid of every party — out of
              the party you came to read. This answers the question you actually
              asked, on every topic, without a navigation. */}
          {/* Anchor for the return trip from the policy hub — see BackToParty.
              scrollMarginTop clears the sticky navbar, so landing here shows the
              heading rather than putting it behind the bar. */}
          <Card accent={party.color} className="ap-stand" id={PARTY_POLICY_ANCHOR} style={{ scrollMarginTop: 84 }}>
            <SectionHeading icon={Star} title="Where they stand" accent={party.color} />
            <PartyPolicyExplorer
              partySlug={slug}
              partyName={party.name}
              accent={party.color}
              positions={partyPositions}
              deepDiveTopics={diveTopics}
            />
          </Card>

          {/* Legislative record this term */}
          <PartyLegislativeRecord party={slug as PartySlug} partyName={party.name} />
        </div>

        {/* ── Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Leadership */}
          <Card accent={party.color} style={{ padding: '20px 22px' }}>
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
          <Card accent={party.color} style={{ padding: '20px 22px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 8 }}>
              At a glance
            </div>
            {/* How the seats were won, before the numbers that describe them —
                electorate vs list is the one thing about a party's seats that a
                row of digits doesn't show. */}
            {seats > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: tint(party.color, 0.12), marginBottom: 8 }}>
                  {party.electorateSeats > 0 && <div style={{ width: `${(party.electorateSeats / seats) * 100}%`, background: party.color }} />}
                  {party.listSeats > 0 && <div style={{ width: `${(party.listSeats / seats) * 100}%`, background: tint(party.color, 0.42) }} />}
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 11.5, color: SECONDARY, fontFamily: MANROPE }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: party.color }} /> {party.electorateSeats} electorate
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: tint(party.color, 0.42) }} /> {party.listSeats} list
                  </span>
                </div>
              </div>
            )}
            <GlanceRow label="Total seats"     value={String(seats)} />
            <GlanceRow label="Electorate seats" value={String(party.electorateSeats)} />
            <GlanceRow label="List seats"       value={String(party.listSeats)} />
            <GlanceRow label="Share of House"   value={`${seatShare}%`} />
            <GlanceRow label="Founded"          value={String(party.founded)} last />
          </Card>

        </div>
      </div>

      {/* ═══════════════ Latest coverage ═══════════════ */}
      {/* Sits below the party's own material on purpose: the page leads with
          what the party says, then shows what is being reported about it. */}
      <PartyCoverage slug={slug} name={party.name} colour={party.color} />

      {/* ═══════════════ Source attribution ═══════════════ */}
      <div style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '20px clamp(18px, 5vw, 36px)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <SectionDivider type="official" label="Sources" />
          <p style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>
            Seat counts from the 2023 General Election (Electoral Commission). Party background from{' '}
            <a href={party.parliamentUrl} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 600 }}>
              parliament.nz <ArrowUpRight style={{ width: 11, height: 11, display: 'inline' }} />
            </a>{' '}and official party records. Leadership verified against the parliament.nz member roster.
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
const btnSecondary: React.CSSProperties = { ...btnBase, background: '#ffffff', border: `1px solid ${BORDER}`, color: INK }
