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
import { readableOnWhite } from '@/lib/color'
import { PartyCoverage } from '@/components/parties/party-coverage'
import { Avatar } from '@/components/ui/avatar'
import { SectionDivider } from '@/components/ui/section-divider'
import { BookmarkButton } from '@/components/bookmarks/bookmark-button'
import { PartyLegislativeRecord } from '@/components/parties/legislative-record'
import { PartyPolicyExplorer } from '@/components/parties/party-policy-explorer'
import { PARTY_POLICY_ANCHOR } from '@/components/policy/back-to-party'
import { PartySwitcher } from '@/components/parties/party-switcher'
import { CollapsibleCard } from '@/components/parties/collapsible-card'
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
/* Card lived here: the white, party-bordered frame every section used. They
   are all CollapsibleCards now, which draw the same frame themselves. */

/* SectionHeading lived here. Every section that used it is a
   CollapsibleCard now, which draws its own header row: same icon chip, same
   16px title, plus the chevron. */

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
        {/* A 6px bar of the party's colour ran here, directly under the
            navbar. It read as a rule across the top of the site rather than
            as part of this page, and the page wash already carries the
            party's colour. */}

        {/* 18px under the header, not 36: the band used to end on a
            150px-tall seat card, which needed the air. It ends on a one-line
            pill now, and 36 over the body's own 36 read as the page pausing. */}
        <div className="ap-col" style={{ maxWidth: 1080, margin: '0 auto', padding: '24px clamp(18px, 5vw, 36px) 18px' }}>

          {/* The back link is gone. It said "All parties" and pointed at
              /parties, which redirects back to this page, and "Home" in its
              place was a second route to something the navbar already owns.
              The title leads the page instead. */}

          {/* The page title, carried over from the directory this page
              replaced. It is the h1 now and the party name below is an h2:
              the page is Party Profiles, and National is the profile open
              inside it. Same size as it had on the page it replaced, the
              directory's own title, clamp(26px, 7vw, 40px), which is also
              what the party name below uses. */}
          <h1 style={{
            fontSize: 'clamp(26px, 7vw, 40px)', fontWeight: 800, letterSpacing: '-.02em',
            color: INK, fontFamily: MANROPE, lineHeight: 1.1, margin: '0 0 14px',
          }}>
            Party Profiles
          </h1>

          {/* The top layer: change party without going back to the index.
              Sits above the identity block so the reader can see, before
              anything else, that every registered party has a page here. */}
          <div style={{ marginBottom: 24 }}>
            <PartySwitcher current={slug} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 28, flexWrap: 'wrap' }}>
            {/* Left: identity */}
            <div style={{ flex: 1, minWidth: 280 }}>
              {/* The party as a pill, the same object the issue is on
                  /policies/[topic]: white ground, a thick border of its own
                  colour, a dot instead of that page's topic icon, and the
                  name set in the colour rather than INK so Green reads as
                  green. The switcher above picked it in a small pill; this is
                  the large clone that says "this one", the same language the
                  comparison page uses.

                  Long names take a smaller size so the pill stays on one
                  line at 375px instead of breaking in two: "Democracy &
                  Government" set the 16-character threshold over there, and
                  "Te Pāti Māori" and "Outdoors & Freedom" are why it is
                  needed here. */}
              {/* Track sits beside the name, not down in the link row: it
                  acts on the party, which is what the pill names, and three
                  buttons below made it the third of three unrelated things
                  (their site, parliament.nz, and following them here).
                  wrap so it drops under the pill rather than squeezing it on
                  a narrow phone. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <h2 style={{
                display: 'inline-flex', alignItems: 'center', gap: 12,
                padding: '8px 20px 8px 17px', borderRadius: 999,
                border: `3px solid ${tint(party.color, 0.55)}`,
                background: '#fff',
                fontSize: party.name.length > 16 ? 'clamp(17px, 4.9vw, 30px)' : 'clamp(24px, 6.5vw, 34px)',
                fontWeight: 800, letterSpacing: '-.02em',
                color: readableOnWhite(party.color),
                fontFamily: MANROPE, lineHeight: 1.15, margin: 0,
                maxWidth: '100%', whiteSpace: 'nowrap',
              }}>
                <span aria-hidden style={{
                  width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                  background: party.color,
                }} />
                {party.name}
              </h2>
                <BookmarkButton entity={{
                  kind: 'party', refId: slug, label: party.name,
                  sublabel: 'Political party', href: `/parties/${slug}`, accent: party.color,
                }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, color: TERTIARY, fontFamily: MANROPE, marginBottom: 16 }}>
                {party.fullName}
              </div>

              {/* Status chips */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                {/* Tinted, not solid. A filled block of the party's colour
                    beside a heading in the same colour made the chip compete
                    with the name for the eye, and "Opposition" is a fact
                    about the party, not the headline. Same treatment as the
                    two chips beside it: light ground, coloured text, hairline
                    border. */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 700,
                  background: tint(party.color, 0.12), color: readableOnWhite(party.color),
                  border: `1px solid ${tint(party.color, 0.35)}`,
                  borderRadius: 999, padding: '3px 11px', fontFamily: MANROPE,
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
                {/* Track moved up beside the name. */}
              </div>
            </div>

            {/* The seat count was a pill here. It is the headline stat of the
                2023 election section now, which is where the rest of the seat
                numbers live; in the header it was a fact with no company. */}
          </div>
        </div>
      </div>

      {/* ═══════════════ Body ═══════════════ */}
      <div className="ap-col" style={{ maxWidth: 1080, margin: '0 auto', padding: '20px clamp(18px, 5vw, 36px) 64px' }}>

        {/* ── Main column ── */}
        {/* 10px between the rectangles, not 20: closed, they are rows of one
            list rather than five separate cards, and at 20 the column read as
            things that had drifted apart. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Overview, History and Core values are closed rectangles now:
              five open cards put two and a half phone screens of prose in
              front of "Where they stand", which is what a reader came for.
              Closed, they are a menu of what this party's page holds. */}
          <CollapsibleCard title="Overview" icon={<Landmark style={{ width: 15, height: 15 }} />} accent={party.color} defaultOpen>
            <p style={{ fontSize: 14.5, color: '#3b3229', fontFamily: MANROPE, lineHeight: 1.7, margin: 0 }}>
              {party.overview}
            </p>
          </CollapsibleCard>

          {/* History */}
          <CollapsibleCard title="History" icon={<ScrollText style={{ width: 15, height: 15 }} />} accent={party.color}>
            <p style={{ fontSize: 14.5, color: '#3b3229', fontFamily: MANROPE, lineHeight: 1.7, margin: 0 }}>
              {party.history}
            </p>
            <div style={{ marginTop: 14, fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, fontStyle: 'italic' }}>
              {party.founded_note}
            </div>
          </CollapsibleCard>

          {/* Core values */}
          <CollapsibleCard title="Core values" icon={<CheckCircle2 style={{ width: 15, height: 15 }} />} accent={party.color}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {party.coreValues.map((v) => (
                <div key={v} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: party.color, flexShrink: 0, marginTop: 7 }} />
                  <span style={{ fontSize: 14, color: '#3b3229', fontFamily: MANROPE, lineHeight: 1.5 }}>{v}</span>
                </div>
              ))}
            </div>
          </CollapsibleCard>

          {/* Key policy areas */}
          {/* Where /compare's job now lives. The old card listed this party's
              "key policy areas" and sent you to a grid of every party — out of
              the party you came to read. This answers the question you actually
              asked, on every topic, without a navigation. */}
          {/* Anchor for the return trip from the policy hub — see BackToParty.
              scrollMarginTop clears the sticky navbar, so landing here shows the
              heading rather than putting it behind the bar. */}
          <CollapsibleCard title="Where they stand" icon={<Star style={{ width: 15, height: 15 }} />} accent={party.color}
            id={PARTY_POLICY_ANCHOR} style={{ scrollMarginTop: 84 }}>
            <PartyPolicyExplorer
              partySlug={slug}
              partyName={party.name}
              accent={party.color}
              positions={partyPositions}
              deepDiveTopics={diveTopics}
            />
          </CollapsibleCard>

          {/* The 2023 election: how the seats were won, then what the party
              has done with them. "At a glance" used to be a sidebar card of
              its own, five rows and a bar; it is the same numbers, in the
              section that is about the term those numbers bought. Founded is
              gone from it, the one row that had nothing to do with 2023. */}
          <PartyLegislativeRecord
            party={slug as PartySlug}
            partyName={party.name}
            glance={
              <div style={{ marginBottom: 18 }}>
                {/* The headline: what the election gave them, in one figure,
                    the way the record's own stats below read. */}
                <div style={{
                  display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap',
                  background: tint(party.color, 0.10), border: `1px solid ${tint(party.color, 0.45)}`,
                  borderRadius: 12, padding: '12px 14px', marginBottom: 14,
                }}>
                  <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: DISPLAY, lineHeight: 1 }}>
                    {seats}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: INK, fontFamily: MANROPE }}>
                    {seats === 1 ? 'seat' : 'seats'} won
                  </span>
                  <span style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE }}>
                    · {seatShare}% of {TOTAL_SEATS}
                  </span>
                </div>
                {/* How the seats were won, before the numbers that describe
                    them — electorate vs list is the one thing about a party's
                    seats that a row of digits doesn't show. */}
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
                <GlanceRow label="Total seats"      value={String(seats)} />
                <GlanceRow label="Electorate seats" value={String(party.electorateSeats)} />
                <GlanceRow label="List seats"       value={String(party.listSeats)} />
                <GlanceRow label="Share of House"   value={`${seatShare}%`} last />

                {/* Leadership, in from the sidebar. Who leads the party is
                    read alongside how many seats they lead, not in a column
                    beside it that a phone drops to the bottom of the page
                    anyway. */}
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 14 }}>
                    Leadership
                  </div>
                  <LeaderRow name={party.leader} title={party.leaderTitle} party={slug as PartySlug} photo={leaderSlug ? MP_PROFILES[leaderSlug].photo : party.leaderPhoto} href={leaderSlug ? `/mps/${leaderSlug}` : null} />
                  {party.coLeader && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                      <LeaderRow name={party.coLeader} title={party.coLeaderTitle ?? 'Co-leader'} party={slug as PartySlug} photo={coLeaderSlug ? MP_PROFILES[coLeaderSlug].photo : undefined} href={coLeaderSlug ? `/mps/${coLeaderSlug}` : null} />
                    </div>
                  )}
                </div>
              </div>
            }
          />
        </div>

        {/* The sidebar is gone. It held "At a glance" and Leadership, both of
            which are now inside the 2023 election section; on a phone the
            column dropped to the bottom of the page anyway, so its contents
            were read last rather than beside anything. */}
      </div>

      {/* ═══════════════ Latest coverage ═══════════════ */}
      {/* Sits below the party's own material on purpose: the page leads with
          what the party says, then shows what is being reported about it. */}
      <PartyCoverage slug={slug} colour={party.color} />

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
