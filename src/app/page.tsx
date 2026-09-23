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
import { redirect } from 'next/navigation'
import { CinematicHeroBurnt as CinematicHero } from '@/components/homepage/cinematic-hero-burnt'
import { PartyCycleProvider } from '@/components/homepage/party-cycle'
import { HomeBackground } from '@/components/homepage/home-background'
import { PartyTilesSection, PartyNewsSection, PartySeatsSection, PartyBillsSection } from '@/components/homepage/party-tiles-section'
// import { PartyStanceSection } from '@/components/homepage/party-tiles-section' // hidden — see below
import { PolicyHubGrid } from '@/components/homepage/policy-hub-grid'
// import { ThisTerm } from '@/components/homepage/this-term' // hidden — see below
import { CompassCta } from '@/components/compass/compass-cta'
// import { WhatsMoved } from '@/components/homepage/whats-moved' // hidden — see below
// import { CredibilityStrip } from '@/components/homepage/credibility-strip' // hidden — see below
import { ParliamentNow } from '@/components/homepage/parliament-now'
import { ExploreCarousel } from '@/components/homepage/explore-carousel'
// import { AlertsBanner } from '@/components/notifications/alerts-banner' // hidden — see below
import { OpenLinksInNewTab } from '@/components/homepage/open-links-in-new-tab'
import { createClient } from '@/lib/supabase/server'

// The navbar logo and the hub both link to /?full=1, which serves the same
// content as / to anyone signed out (crawlers included) — canonical stops it
// competing with the homepage in the sitemap.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ full?: string }> }) {
  /**
   * SIGNED-IN visitors go straight to /hub; everyone else gets the landing.
   *
   * This used to key on an politika_seen cookie set on first view, which sent
   * every repeat visitor to the hub whether or not they had an account — so an
   * anonymous reader's second visit opened on "Your Command Centre" with
   * nothing in it, a returning-user page for someone the site does not know.
   * The hub is built around an account's tracked items; the landing is built
   * to explain the site. Which one a person should get is a fact about their
   * ACCOUNT, not their browser history.
   *
   * getSession, not getUser: this is a routing decision, not an auth boundary.
   * getSession reads the local cookie with no network round trip, which
   * matters on the page campaign traffic lands on; the worst a forged cookie
   * earns is a redirect to a page that then renders empty. Every real auth
   * check stays getUser.
   *
   * `?full=1` — used by the hub's "view the full homepage" link — still always
   * shows the landing.
   */
  const { full } = await searchParams
  if (!full) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session) redirect('/hub')
  }

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

        {/* The compass. It has moved three times by request — mid, top, last,
            and now second-to-last — and this is still a defensible home: the
            reader who gets this far has seen the parties, the policies and the
            map, and "find where you stand" is the natural next step for exactly
            that person. It still rides the Election Centre's how-your-vote-works
            section for everyone else. */}
        <CompassCta />

        {/* "Find your MP" is off the front page by request. The lookup is
            untouched at /map, and the menu links to it (Electorate map); this
            was a door to it, not the thing itself. */}

      </HomeBackground>
    </PartyCycleProvider>
  )
}
