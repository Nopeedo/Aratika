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
  ArrowUpRight, Landmark,
  ScrollText, Star, Globe, CheckCircle2,
} from 'lucide-react'
import { PARTY_PROFILES, PARTY_DIRECTORY_ORDER, PROFILED_MINOR_PARTIES, leadershipLabel } from '@/constants/parties-data'
import { CURRENT_SEATS, TOTAL_SEATS, PARTY_STATUS } from '@/constants/parties'
import { MP_PROFILES } from '@/constants/mps-data'
import { POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import { PartySlug } from '@/types'
import { readableOnWhite } from '@/lib/color'
import { PartyCoverage } from '@/components/parties/party-coverage'
import { Avatar } from '@/components/ui/avatar'
import { TrackWithAccount } from '@/components/bookmarks/track-with-account'
import { PartyLegislativeRecord } from '@/components/parties/legislative-record'
import { PartyPolicyExplorer } from '@/components/parties/party-policy-explorer'
import { SeatsInfo, PositionsInfo } from '@/components/parties/party-profile-info'
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
  // `parliamentUrl` is a parliament.nz party page for the six parties that hold
  // seats and the party's own website for the eleven that do not, so nothing
  // may call it parliament.nz without checking.
  const onParliamentSite = party.parliamentUrl.includes('parliament.nz')

  // Live positions for this party. Current policy only — a 2023 manifesto entry
  // exists for the then-and-now comparison and would misrepresent the party if
  // shown as what they say today.
  const allPositions = await getAllApprovedPositions()
  const partyPositions = allPositions.filter((p) => p.party === slug && p.period !== '2023')
  const diveTopics = [...new Set(allDeepDivePaths().filter((d) => d.party === slug).map((d) => d.topic))]
  // Counted here as well as in the explorer so the "Where they stand" (i) can
  // state it. The standfirst that used to carry it is gone (§1.2): it was three
  // lines of instruction above a row of chips that explains itself.
  const coveredTopics = POLICY_TOPIC_ORDER.filter((t) => partyPositions.some((p) => p.topic === t)).length

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
      <style dangerouslySetInnerHTML={{ __html: PROFILE_CSS }} />

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
                {/* §2.13, not BookmarkButton's pill variant. Two track
                    controls existed on one site: this page used a raw <button>
                    at 16px type and 9px 16px padding, which renders ~39px and
                    is then silently inflated to 44px by globals.css's minimum
                    (§3.1's symptom exactly), while every redesigned page uses
                    the 12.5px control with the padding/negative-margin hit area
                    already built in. Import-only change: neither shared
                    component is touched, and bookmark-button.tsx is still what
                    four other pages call. */}
                <TrackWithAccount
                  entity={{
                    kind: 'party', refId: slug, label: party.name,
                    sublabel: 'Political party', href: `/parties/${slug}`, accent: party.color,
                  }}
                  label={`Track ${party.name}`}
                  savedLabel="Tracking"
                  accent={party.color}
                />
              </div>
              <div className="pp-fullname" style={{ fontSize: 15, fontWeight: 500, color: TERTIARY, fontFamily: MANROPE, marginBottom: 16 }}>
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
                {/* "No seats yet", not "Not in Parliament". It is the phrasing
                    §2.14 settled on for the directory this page replaced, and
                    it is the kinder and the truer of the two for a party
                    contesting 2026. One wording, not two a tap apart. */}
                <span className="pp-chip" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 700,
                  background: tint(party.color, 0.12), color: readableOnWhite(party.color),
                  border: `1px solid ${tint(party.color, 0.35)}`,
                  borderRadius: 999, padding: '3px 11px', fontFamily: MANROPE,
                }}>
                  {status === 'governing' ? 'Governing' : status === 'opposition' ? 'Opposition' : 'No seats yet'}
                </span>
                {party.coalitionRole && (
                  <span className="pp-chip" style={{
                    display: 'inline-flex', alignItems: 'center',
                    fontSize: 12, fontWeight: 600, color: SECONDARY,
                    border: `1px solid ${BORDER}`, borderRadius: 999, padding: '3px 11px', fontFamily: MANROPE,
                  }}>
                    {party.coalitionRole}
                  </span>
                )}
                {/* The "Founded {year}" chip came off. The year was on this page
                    four times: here, in a row of the glance table, in the
                    italic founded_note under History, and in the first sentence
                    of every party.history string (§1.3). The History panel keeps
                    it, in the sentence that says what actually happened. */}
              </div>

              {/* Leadership — faces up front.
                  The sidebar's "Leadership" card is gone (it restated these
                  faces, names and titles about 4,800px further down a phone,
                  §1.3), so the one thing it carried that this block did not —
                  the way through to the leader's MP profile — comes here
                  rather than going with it (§5.17). The whole block is the
                  link when a profile exists; a bare name that is sometimes a
                  link and sometimes not is worse than either. */}
              <div className="pp-leader" style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 18 }}>
                <div className="pp-faces" style={{ display: 'flex' }}>
                  {leaderSlug ? (
                    <Link href={`/mps/${leaderSlug}`} aria-label={`${party.leader}'s profile`} style={{ display: 'flex', textDecoration: 'none' }}>
                      <Avatar name={party.leader} party={slug as PartySlug} src={MP_PROFILES[leaderSlug].photo} size="lg" face />
                    </Link>
                  ) : (
                    <Avatar name={party.leader} party={slug as PartySlug} src={party.leaderPhoto} size="lg" face />
                  )}
                  {party.coLeader && (
                    <div className="pp-face-2" style={{ marginLeft: -16, borderRadius: '50%', boxShadow: '0 0 0 3px #fff' }}>
                      {coLeaderSlug ? (
                        <Link href={`/mps/${coLeaderSlug}`} aria-label={`${party.coLeader}'s profile`} style={{ display: 'flex', textDecoration: 'none' }}>
                          <Avatar name={party.coLeader} party={slug as PartySlug} src={MP_PROFILES[coLeaderSlug].photo} size="lg" face />
                        </Link>
                      ) : (
                        <Avatar name={party.coLeader} party={slug as PartySlug} size="lg" face />
                      )}
                    </div>
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="pp-leader-title" style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>
                    {leadershipLabel(party.leaderTitle, party.coLeader ? party.coLeaderTitle : undefined)}
                  </div>
                  <div className="pp-leader-name" style={{ fontSize: 15.5, fontWeight: 800, color: INK, fontFamily: MANROPE, marginTop: 2, lineHeight: 1.25 }}>
                    {leaderSlug ? (
                      <Link href={`/mps/${leaderSlug}`} style={{ color: INK, textDecoration: 'none' }}>{party.leader}</Link>
                    ) : party.leader}
                    {party.coLeader ? ' & ' : ''}
                    {party.coLeader && (coLeaderSlug
                      ? <Link href={`/mps/${coLeaderSlug}`} style={{ color: INK, textDecoration: 'none' }}>{party.coLeader}</Link>
                      : party.coLeader)}
                  </div>
                </div>
              </div>

              <p className="pp-tagline" style={{ fontSize: 15, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, maxWidth: 520, margin: '0 0 18px' }}>
                {party.tagline}
              </p>

              {/* Links */}
              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                {/* The party's own colour, not the site's jade — a green
                    primary button on a page washed in Labour red read as
                    something borrowed from another site. Light party colours
                    (ACT's yellow, TOP's teal) take ink rather than white, or
                    the label disappears into the fill. */}
                <a href={party.website} target="_blank" rel="noopener noreferrer" className="pp-btn"
                  style={{ ...btnBase, background: party.color, color: isLightHex(party.color) ? INK : '#ffffff' }}>
                  <Globe style={{ width: 15, height: 15 }} /> Official website
                </a>
                {/* Only where it actually goes to parliament.nz. For the
                    eleven parties without seats this field holds their OWN
                    website, so the button sat beside "Official website"
                    pointing at the same place under a label that named a
                    different one (§1.3, §1.8). */}
                {onParliamentSite && (
                  <a href={party.parliamentUrl} target="_blank" rel="noopener noreferrer" className="pp-btn" style={btnSecondary}>
                    parliament.nz <ArrowUpRight style={{ width: 14, height: 14 }} />
                  </a>
                )}
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
      {/* 12px at the foot, not 64: the coverage band that follows carries its
          own top padding, and the two stacked left the page's last rectangle
          floating clear of everything. */}
      <div className="ap-col" style={{ maxWidth: 1080, margin: '0 auto', padding: '20px clamp(18px, 5vw, 36px) 12px' }}>

        {/* ── Main column ── */}
        {/* 10px between the rectangles, not 20: closed, they are rows of one
            list rather than five separate cards, and at 20 the column read as
            things that had drifted apart. */}
        <div className="pp-col" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Overview, History and Core values are closed rectangles now:
              five open cards put two and a half phone screens of prose in
              front of "Where they stand", which is what a reader came for.
              Closed, they are a menu of what this party's page holds. */}
          <CollapsibleCard title="Overview" icon={<Landmark style={{ width: 15, height: 15 }} />} accent={party.color} defaultOpen>
            <p className="pp-prose" style={{ fontSize: 14.5, color: '#3b3229', fontFamily: MANROPE, lineHeight: 1.7, margin: 0, maxWidth: '72ch' }}>
              {party.overview}
            </p>
          </CollapsibleCard>

          {/* History */}
          <CollapsibleCard title="History" icon={<ScrollText style={{ width: 15, height: 15 }} />} accent={party.color}>
            <p className="pp-prose" style={{ fontSize: 14.5, color: '#3b3229', fontFamily: MANROPE, lineHeight: 1.7, margin: 0, maxWidth: '72ch' }}>
              {party.history}
            </p>
            {/* The founding note, in from the header's "Founded {year}" chip.
                It is a footnote to the paragraph above it, so it belongs to
                that paragraph rather than to the first screen. */}
            <div className="pp-note" style={{ marginTop: 14, fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, fontStyle: 'italic', maxWidth: '72ch' }}>
              {party.founded_note}
            </div>
          </CollapsibleCard>

          {/* Core values */}
          {/* auto-FIT, not auto-fill (§5.18): at one column on a phone the two
              are identical, and at 1008px a party with three values would sit
              in a half-empty row of tracks with everything jammed left. */}
          <CollapsibleCard title="Core values" icon={<CheckCircle2 style={{ width: 15, height: 15 }} />} accent={party.color}>
            {/* 320px, so 968px of card gives TWO columns and not three: at
                three the longest value ran to five lines against the shortest
                one's two. */}
            <div className="pp-values" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 10 }}>
              {party.coreValues.map((v) => (
                <div key={v} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span className="pp-value-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: party.color, flexShrink: 0, marginTop: 7 }} />
                  <span className="pp-value" style={{ fontSize: 14, color: '#3b3229', fontFamily: MANROPE, lineHeight: 1.5 }}>{v}</span>
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
            id={PARTY_POLICY_ANCHOR} style={{ scrollMarginTop: 84 }}
            info={<PositionsInfo accent={party.color} partyName={party.name} covered={coveredTopics} total={POLICY_TOPIC_ORDER.length} />}>
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
              /* One figure, and everything that used to restate it is behind
                 the (i) beside it.

                 What came out, and where each fact went (§5.17, checked field
                 by field before anything was deleted):
                 - the stacked electorate/list bar, its legend, and the
                   "Electorate seats" / "List seats" rows: three statements of
                   one split inside one card. It reads "30 won a local seat, 19
                   came off the party list" in the (i) now, which is §2.8's
                   plain wording and the answer to §8's "2 electorate 9 list I
                   don't get this".
                 - "Total seats" and "Share of House" rows: the figure and the
                   share directly above them, twice.
                 - the Leadership block: the same leader, photo and title as the
                   header faces. Its one unique affordance, the link through to
                   the MP profile, is on those faces now.
                 On the eleven parties with no seats the four rows rendered
                 "Total seats 0 / Electorate seats 0 / List seats 0 / Share of
                 House 0.0%", four true zeros that read as a broken record
                 (§1.5). They say "No seats yet" once instead, the directory's
                 own wording. */
              <div style={{ marginBottom: 18 }}>
                <div className="pp-seatbox" style={{
                  display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap',
                  background: tint(party.color, 0.10), border: `1px solid ${tint(party.color, 0.45)}`,
                  borderRadius: 12, padding: '12px 14px',
                }}>
                  {seats > 0 ? (
                    <>
                      <span className="pp-figure" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: DISPLAY, lineHeight: 1 }}>
                        {seats}
                      </span>
                      <span className="pp-figure-label" style={{ fontSize: 13, fontWeight: 700, color: INK, fontFamily: MANROPE }}>
                        {seats === 1 ? 'seat' : 'seats'} won
                      </span>
                      <span className="pp-figure-sub" style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE }}>
                        · {seatShare}% of {TOTAL_SEATS}
                      </span>
                    </>
                  ) : (
                    <span className="pp-figure-label" style={{ fontSize: 13, fontWeight: 700, color: INK, fontFamily: MANROPE }}>
                      No seats yet
                    </span>
                  )}
                  <span style={{ marginLeft: 'auto', alignSelf: 'center' }}>
                    <SeatsInfo
                      accent={party.color}
                      partyName={party.name}
                      seats={seats}
                      electorateSeats={party.electorateSeats}
                      listSeats={party.listSeats}
                    />
                  </span>
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
      <PartyCoverage slug={slug} colour={party.color} partyName={party.name} />

      {/* ═══════════════ Source attribution ═══════════════ */}
      <div style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE }}>
        {/* The "Official Data" SectionDivider badge came off. It was a
            Tailwind-classed badge on an otherwise inline-styled page, and it
            made a claim about the paragraph rather than stating a fact about
            any source in it — the same badge family that came off /bills. The
            sourcing sentence itself stays, and it is the sentence that carries
            the evidence. */}
        <div className="ap-col" style={{ maxWidth: 1080, margin: '0 auto', padding: '20px clamp(18px, 5vw, 36px)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Two sentences, branched, because one of them was false on eleven
              of the seventeen pages it rendered on (§1.8). `parliamentUrl` is
              a parliament.nz page only for the six parties that hold seats;
              for the rest the field holds the party's OWN website, so "party
              background from parliament.nz" linked to the party itself, and
              "leadership verified against the parliament.nz member roster"
              claimed a check against a roster none of their leaders is on. */}
          <p className="pp-sources" style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, margin: 0, maxWidth: '86ch' }}>
            Seat counts are the 2023 general election result (Electoral Commission).{' '}
            {onParliamentSite ? (
              <>
                Party background from{' '}
                <a href={party.parliamentUrl} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 600 }}>
                  parliament.nz <ArrowUpRight style={{ width: 11, height: 11, display: 'inline' }} />
                </a>{' '}and official party records, with leadership checked against the parliament.nz member roster.
              </>
            ) : (
              <>
                Party background and leadership from{' '}
                <a href={party.website} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 600 }}>
                  the party&rsquo;s own site <ArrowUpRight style={{ width: 11, height: 11, display: 'inline' }} />
                </a>{' '}and the Electoral Commission&rsquo;s register of political parties. {party.name} holds no seats,
                so there is no parliament.nz page or member roster to check against.
              </>
            )}
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

/* LeaderRow and GlanceRow lived here. Both were sidebar helpers and the
   sidebar has been gone for a while; the glance table they drew restated the
   seat figure four times and the leader twice (§1.3), and what is left of it
   is one figure plus an (i). */

// ─── Desktop scale ────────────────────────────────────────────────────────────

/* The whole page was composed at 375px and then rendered unchanged at 1920:
   a 10.5px eyebrow, a 12px chip and a 14.5px paragraph, laid out across 1008px
   of column. §5.19 is the rule it broke ("a page composed at 375px has to be
   looked at at 1920") and §2.14 is the fix: the same page, at a larger scale.

   Nothing here re-lays anything out. Every rule below restates one number from
   the phone composition at its desktop size, in the same order and the same
   proportions, which is the difference §2.14 spends a paragraph on: a tile that
   becomes a row at the breakpoint is two designs and the reader crossing 768px
   meets both.

   768px, matching §2.14's directory, so crossing from /parties to a party page
   is one change of scale and not two.

   Shipped with the page rather than added to globals.css (§3.2): these are all
   inline-styled elements, an inline style outranks a stylesheet rule, and three
   other pages are being edited in this tree right now. !important throughout
   for the first of those reasons. */
const PROFILE_CSS = `
@media (min-width: 768px) {
  /* Identity block. The avatar is sized by a Tailwind class on a shared
     component, so it is scaled from here rather than by a prop: the page
     cannot know the viewport at render time. */
  .pp-fullname { font-size: 16.5px !important; margin-bottom: 18px !important; }
  .pp-chip { font-size: 13px !important; padding: 4px 13px !important; }
  .pp-leader { gap: 16px !important; margin-bottom: 20px !important; }
  .pp-faces .size-14 { width: 68px !important; height: 68px !important; }
  .pp-face-2 { margin-left: -20px !important; }
  .pp-leader-title { font-size: 11.5px !important; }
  .pp-leader-name { font-size: 19px !important; }
  .pp-tagline { font-size: 17px !important; max-width: 640px !important; }
  .pp-btn { font-size: 15px !important; padding: 11px 20px !important; border-radius: 12px !important; }
  .pp-btn svg { width: 17px !important; height: 17px !important; }

  /* Body. 10px between five closed rectangles reads as one list on a phone;
     at 19px titles they need the extra 4. */
  .pp-col { gap: 14px !important; }
  /* The measure is capped in ch, not px: a 1008px line of 16.5px type is about
     120 characters, roughly twice a comfortable measure. */
  .pp-prose { font-size: 16.5px !important; }
  .pp-note { font-size: 13.5px !important; }
  .pp-value { font-size: 15.5px !important; }
  .pp-value-dot { width: 8px !important; height: 8px !important; margin-top: 8px !important; }

  /* The seat figure, at §2.14's desktop step: the directory tile one tap away
     goes 20px to 24px, and this one is the headline of its card rather than a
     line on a tile, so it goes 28 to 40. */
  .pp-seatbox { padding: 16px 20px !important; border-radius: 14px !important; }
  .pp-figure { font-size: 40px !important; }
  .pp-figure-label { font-size: 15px !important; }
  .pp-figure-sub { font-size: 14px !important; }

  .pp-sources { font-size: 13.5px !important; }
}
`

// ─── Button styles ────────────────────────────────────────────────────────────

const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '9px 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 700,
  fontFamily: MANROPE, textDecoration: 'none', whiteSpace: 'nowrap',
}
const btnSecondary: React.CSSProperties = { ...btnBase, background: '#ffffff', border: `1px solid ${BORDER}`, color: INK }
