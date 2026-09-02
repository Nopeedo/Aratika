/**
 * Arapono — Homepage
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
import { PartyTilesSection, PartyNewsSection } from '@/components/homepage/party-tiles-section'
// import { PartyStanceSection } from '@/components/homepage/party-tiles-section' // hidden — see below
import { PolicyHubGrid } from '@/components/homepage/policy-hub-grid'
import { ThisTerm } from '@/components/homepage/this-term'
import { FindMyMpButton } from '@/components/homepage/find-my-mp-button'
import { CompassCta } from '@/components/compass/compass-cta'
import { CredibilityStrip } from '@/components/homepage/credibility-strip'
import { ExploreCarousel } from '@/components/homepage/explore-carousel'
import { AlertsBanner } from '@/components/notifications/alerts-banner'
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
   * This used to key on an arapono_seen cookie set on first view, which sent
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

        {/* ═══ CORE 3 — what is already settled ═══
            The tiles say who is standing, the issues say what they claim, and
            this says where things actually stand before any of it changes. It
            reads the same party selection the tiles set, so tapping a party up
            there lights their electorates down here. */}
        <ThisTerm />

        {/* ── In the news — follows the tile selection ──
            Its own section rather than a row inside the tile panel: the panel
            was getting long, and coverage is a different kind of thing from the
            party's own facts. Sits here, after what is settled, because a
            headline is worth more once the reader knows the seats and the
            bills it is talking about. */}
        <PartyNewsSection />

        {/* "Find your MP" demoted to a single button.
            It was CORE 3 — a full section with a live map — but it is a SEARCH,
            not a comparison: you already know your address, and the answer is
            one lookup rather than something to read. It was taking a screen of
            the homepage to ask a question most readers answer once. The full
            map is untouched at /map; this is the door to it. */}
        <FindMyMpButton />

        {/* ── Why you can trust it (slim) ── */}
        <CredibilityStrip />

        {/* Alerts / install prompt — down here, after the content has made its
            case, not under the hero where it used to sit. Asking someone to
            install on their first screen is asking before the site has shown
            them anything; by the credibility strip they have scrolled the
            tiles, the policy grid and the map, which is exactly the reader an
            install is worth something to. Moving it is safe for the Android
            install path: `beforeinstallprompt` needs its LISTENER mounted with
            the page, and a component mounts on initial render wherever it sits
            in the DOM — position was never the constraint. It still hides
            itself when there is nothing to offer and remembers a dismissal,
            and it stays reachable any time from Settings → Notifications. */}
        <AlertsBanner />

        {/* ── Everything else, in one carousel of links ── */}
        <ExploreCarousel />

        {/* The compass closes the page. It has moved twice by request — mid,
            top, now last — and last is a defensible home, not a burial: the
            reader who reaches the bottom has seen the parties, the policies
            and the map, and "find where you stand" is the natural next step
            for exactly that person. It still rides the Election Centre's
            how-your-vote-works section for everyone else. */}
        <CompassCta />

      </HomeBackground>
    </PartyCycleProvider>
  )
}
