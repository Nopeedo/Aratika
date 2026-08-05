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

import { CinematicHeroBurnt as CinematicHero } from '@/components/homepage/cinematic-hero-burnt'
import { PartyCycleProvider } from '@/components/homepage/party-cycle'
import { HomeBackground } from '@/components/homepage/home-background'
import { PartyTilesSection, PartyStanceSection } from '@/components/homepage/party-tiles-section'
import { PolicyHubGrid } from '@/components/homepage/policy-hub-grid'
import { HomeMap } from '@/components/homepage/home-map'
import { AllPartiesSection } from '@/components/homepage/all-parties-section'
import { CredibilityStrip } from '@/components/homepage/credibility-strip'
import { ExploreCarousel } from '@/components/homepage/explore-carousel'

export default function HomePage() {
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

        {/* Summary of Party Stance — moved below "Where do the parties stand?"
            instead of directly under the tiles. */}
        <PartyStanceSection />

        {/* ═══ CORE 3 — your electorate ═══ */}
        <HomeMap />

        {/* Every party side by side, with its own issue picker. Used to be a
            "Show all parties" toggle buried inside the issue panel above. */}
        <AllPartiesSection />

        {/* ── Why you can trust it (slim) ── */}
        <CredibilityStrip />

        {/* ── Everything else, in one carousel of links ── */}
        <ExploreCarousel />

      </HomeBackground>
    </PartyCycleProvider>
  )
}
