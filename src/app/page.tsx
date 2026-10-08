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
import { PledgeCounter } from '@/components/pledge/pledge-counter'
import { PLEDGE_ENABLED } from '@/constants/features'
import { PolicyHubGrid } from '@/components/homepage/policy-hub-grid'
import { CompassCta } from '@/components/compass/compass-cta'
// import { ThisTerm } from '@/components/homepage/this-term' // hidden — see below
// import { WhatsMoved } from '@/components/homepage/whats-moved' // hidden — see below
// import { CredibilityStrip } from '@/components/homepage/credibility-strip' // hidden — see below
import { ParliamentNow } from '@/components/homepage/parliament-now'
import { EmailUpdates } from '@/components/homepage/email-updates'
import { InstallButton } from '@/components/notifications/install-button'
import { ExploreCarousel } from '@/components/homepage/explore-carousel'
// import { AlertsBanner } from '@/components/notifications/alerts-banner' // hidden — see below
// import { OpenLinksInNewTab } from '@/components/homepage/open-links-in-new-tab' // see note below

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
        {/* OpenLinksInNewTab was here. It opened every content link in a new
            tab so that following one "shouldn't lose the reader's place" in the
            homepage. It achieved the opposite.

            A new tab starts with a history length of 1, so there is nothing to
            go back to: the browser's back button is dead, and BackLink's
            router.back() is unavailable, which is why back-link.tsx already
            carries a note about readers tapping an MP from the homepage and
            being posted to the MPs directory, a page they had never seen.

            Same-tab navigation gives the reader's place back for real — the
            browser restores the homepage scroll position on back, which is the
            thing the new tab was trying to approximate. The component is intact
            at components/homepage/open-links-in-new-tab.tsx; restore the import
            and this line to bring it back. */}

        {/* ── The choice: guided help, or explore ── */}
        <CinematicHero />

        {/* Anchor for the hero's "I'll look around myself" jump. Kept as a
            zero-height marker (NOT a wrapper) so it doesn't become the sticky
            tile row's containing block — the tiles must stay a direct child of
            the page wrapper to ride the whole page (see party-tiles.tsx). */}
        <div id="parties" aria-hidden style={{ scrollMarginTop: 72 }} />

        {/* ═══ CORE 1 — the parties (sticky tile row rides the page) ═══ */}
        <PartyTilesSection />

        {/* ── The pledge ──
            Between the party tiles and the issues, by request.

            It used to sit directly under the hero, which put it above the fold
            but pushed the sticky tile row down with it — and the tiles are the
            first thing on this page that MOVES, so they are what makes the
            homepage feel alive rather than read. Here the reader meets the
            tiles first, taps a party, sees it respond, and is asked to pledge
            having just done something.

            A sibling section, never a wrapper: the tile row above is sticky and
            rides the whole page, and anything that became its containing block
            would pin it (see party-tiles.tsx). */}
        {PLEDGE_ENABLED && <PledgeCounter />}

        {/* ═══ CORE 2 — explore by issue ═══ */}
        <PolicyHubGrid />

        {/* "Summary of Party Stance" disabled on the front page — component
            is intact (party-tiles-section.tsx / party-tiles.tsx PanelStance),
            uncomment to bring it back. */}
        {/* <PartyStanceSection /> */}

        {/* The compass, back on the homepage, by request — and restyled into
            the current theme on the way in (it used to cycle through six party
            colours, which §1.6 gives to parties and §1.3 already spends on the
            hero).

            It sits after the issue sections deliberately: it asks the reader
            for twelve answers, which is a fair thing to ask only once they have
            seen what the site does with them.

            Note on the comments this replaces: this one said the card "still
            rides the Election Centre", and the Election Centre's said "the
            homepage still carries it". Each pointed at the other and it
            rendered in neither — CompassCta had no importers at all, so /start
            was reachable only from the footer. */}
        <CompassCta />

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

        {/* ── The mailing list ──
            Under the 2023-term section on purpose: by here a reader has seen
            what the site holds, which is the only honest moment to ask for
            their address. Signing up for mail, not for an account. */}
        {/* Directly above the newsletter, by request. The two are the same
            ask at different weights — install for alerts, subscribe for the
            weekly — so they belong together rather than scattered.

            It renders NOTHING when the app is already installed or the browser
            cannot install it, so this is not a permanent fixture for anyone who
            has already done it. That check lives inside the component, which is
            why this is a variant rather than a separate homepage section
            wrapping it: a section would have shown its heading over an empty
            space. */}
        <InstallButton variant="hero" />

        <EmailUpdates />

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

        {/* ── The on-ramps ──
            Trimmed from the full rail by request. It used to list the whole
            toolkit, but ten of the eleven destinations in the navbar were in
            it, so the bottom of this page was the main menu a second time with
            the footer's links stacked under that. Now it carries only what the
            menu does not: the ways in for someone who has read this far and
            still does not know what to do.

            Every other page still gets the full rail through SiteTail, where
            it is the only signposting and earns its place. */}
        <ExploreCarousel variant="onramps" />

        {/* (The compass card used to be described here as "gone from here
            entirely". It is back, above, after the issue sections.) */}

        {/* "Find your MP" is off the front page by request. The lookup is
            untouched at /map, and the menu links to it (Electorate map); this
            was a door to it, not the thing itself. */}

      </HomeBackground>
    </PartyCycleProvider>
  )
}
