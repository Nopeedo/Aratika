/**
 * Politika — Homepage
 *
 * Shrunk to the core purpose: help someone figure out who to vote for and where
 * they vote. The page is built around three things and nothing more —
 *   1. the party tiles  (who stands for what)
 *   2. the policy topics (explore by issue)
 *   3. the map           (your electorate)
 * — bookended by the hero's one clear choice (guided vs. explore) and a slim
 * trust strip. Every OTHER feature (the race, news, battlegrounds, bills,
 * budget, tracking, learn) is demoted to a single carousel at the end, each a
 * card that links out to its full page. Those sections/components still exist
 * and their pages are untouched — they're just no longer stacked on the home.
 */

import type { Metadata } from 'next'
import { CinematicHeroBurnt as CinematicHero } from '@/components/homepage/cinematic-hero-burnt'
import { PartyCycleProvider } from '@/components/homepage/party-cycle'
import { HomeBackground } from '@/components/homepage/home-background'
import { PartyTilesSection, PartyNewsSection, PartySeatsSection, PartyBillsSection } from '@/components/homepage/party-tiles-section'
// import { PartyStanceSection } from '@/components/homepage/party-tiles-section' // hidden — see below
import { PolicyHubGrid } from '@/components/homepage/policy-hub-grid'
// import { ThisTerm } from '@/components/homepage/this-term' // hidden — see below
// import { WhatsMoved } from '@/components/homepage/whats-moved' // hidden — see below
// import { CredibilityStrip } from '@/components/homepage/credibility-strip' // hidden — see below
import { ParliamentNow } from '@/components/homepage/parliament-now'
import { ExploreCarousel } from '@/components/homepage/explore-carousel'
// import { AlertsBanner } from '@/components/notifications/alerts-banner' // hidden — see below
import { OpenLinksInNewTab } from '@/components/homepage/open-links-in-new-tab'

// The navbar logo and the hub both link to /?full=1, which serves the same
// content as / to anyone signed out (crawlers included) — canonical stops it
// competing with the homepage in the sitemap.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

/**
 * SIGNED-IN visitors go to /hub. That redirect lives in src/middleware.ts now,
 * not here.
 *
 * It used to be a getSession() call in this component. Reading cookies in a
 * server component opts the route out of static rendering, so every visitor to
 * the landing page — the page campaign traffic arrives on — paid a per-request
 * render so that the minority with an account could be sent elsewhere. The
 * check is a cookie lookup at the edge now and this page is prerendered.
 *
 * ?full=1 (the hub's "view the full homepage" link) is handled there too.
 * Nothing in this component reads the request any more, which is the point:
 * the moment it does, the page goes dynamic again.
 */
export default function HomePage() {
  return (
    <PartyCycleProvider>
      {/* One continuous weave texture behind the whole homepage, tinted with the
          current party's accent colour; sections are transparent so it shows
          through. */}
      <HomeBackground>
        {/* Every link in the page content opens a new tab. Renders nothing —
            deliberately NOT a wrapper, since a wrapper div would become the
            sticky tile row's containing block (see party-tiles.tsx). */}
        <OpenLinksInNewTab />

        {/* ── The choice: guided help, or explore ── */}
        <CinematicHero />

        {/* Anchor for the hero's "I'll look around myself" jump. Kept as a
            zero-height marker (NOT a wrapper) so it doesn't become the sticky
            tile row's containing block — the tiles must stay a direct child of
            the page wrapper to ride the whole page (see party-tiles.tsx). */}
        <div id="parties" aria-hidden style={{ scrollMarginTop: 72 }} />

        {/* ═══ CORE 1 — the parties (sticky tile row rides the page) ═══ */}
        <PartyTilesSection />

        {/* ═══ CORE 2 — explore by issue ═══ */}
        <PolicyHubGrid />

        {/* "Summary of Party Stance" disabled on the front page — component
            is intact (party-tiles-section.tsx / party-tiles.tsx PanelStance),
            uncomment to bring it back. */}
        {/* <PartyStanceSection /> */}

        {/* The compass, back on the homepage. It was built as a homepage entry
            card and then rendered nowhere — orphaned in the first-impression
            diet. It sits after the issue sections deliberately: it asks the
            reader for twelve answers, which is a fair thing to ask only once
            they have seen what the site does with them. Its results now link
            to our own sourced positions for all seven parties. */}

        {/* "Who's in Parliament right now" — the electorate map — was here.
            Removed from the front page by request. The component is intact
            (this-term.tsx) and the full map still lives at /map; uncomment
            the import and this line to bring it back. */}
        {/* <ThisTerm /> */}

        {/* ── In the news — follows the tile selection ──
            Its own section rather than a row inside the tile panel: the panel
            was getting long, and coverage is a different kind of thing from the
            party's own facts. Sits here, after what is settled, because a
            headline is worth more once the reader knows the seats and the
            bills it is talking about. */}
        <PartyNewsSection />

        {/* ── The Parliament you're voting to change ──
            The 2023 chamber and seat table, same chart as the Election Centre
            (which keeps its own copy, with the polls and build-a-majority
            tabs). Sits just before the stat tiles: the seats ARE the biggest
            of those numbers, drawn. Sits directly under the coverage: a
            headline about a party reads better once you know how many seats
            they hold and which side of the House they are on. */}
        <ParliamentNow seats={<PartySeatsSection />} bills={<PartyBillsSection />} />

        {/* "What's moved" — new candidates and bill stage changes — was
            here. Removed from the front page by request. The component is
            intact (whats-moved.tsx); uncomment the import and this line to
            bring it back. */}
        {/* <WhatsMoved /> */}

        {/* "The election at a glance" — the four stat tiles — was here.
            Removed from the front page by request. The component is intact
            (credibility-strip.tsx); uncomment the import and this line to
            bring it back. */}
        {/* <CredibilityStrip /> */}

        {/* The alerts / install pill was here — it offered "Add Politika to
            your Home Screen" (and "Install Politika" on Android). Removed from
            the front page by request. The component is intact
            (notifications/alerts-banner.tsx) and alerts are still reachable
            from Settings → Notifications; uncomment the import and this line
            to bring the pill back. */}
        {/* <AlertsBanner /> */}

        {/* ── Everything else, in one carousel of links ── */}
        <ExploreCarousel />

        {/* The compass card is off the front page by request — it moved four
            times before this and is now gone from here entirely. The card
            itself is untouched and still rides the Election Centre's
            how-your-vote-works section, and /start is still linked from the
            footer. */}

        {/* "Find your MP" is off the front page by request. The lookup is
            untouched at /map, and the menu links to it (Electorate map); this
            was a door to it, not the thing itself. */}

      </HomeBackground>
    </PartyCycleProvider>
  )
}
