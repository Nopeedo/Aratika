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
import { PartyTilesSection } from '@/components/homepage/party-tiles-section'
import { PolicyHubGrid } from '@/components/homepage/policy-hub-grid'
import { HomeMap } from '@/components/homepage/home-map'
import { CredibilityStrip } from '@/components/homepage/credibility-strip'
import { ExploreCarousel } from '@/components/homepage/explore-carousel'

export default function HomePage() {
  return (
    <PartyCycleProvider>
      {/* One continuous weave texture behind the whole homepage; sections are
          transparent so it shows through. */}
      <div className="bg-weave" style={{ backgroundColor: '#f8fafc' }}>

        {/* ── The choice: guided help, or explore ── */}
        <CinematicHero />

        {/* ═══ CORE 1 — the parties (also the target of the hero's "look around" jump) ═══ */}
        <div id="parties" style={{ scrollMarginTop: 72 }}>
          <PartyTilesSection />
        </div>

        {/* ═══ CORE 2 — explore by issue ═══ */}
        <PolicyHubGrid />

        {/* ═══ CORE 3 — your electorate ═══ */}
        <HomeMap />

        {/* ── Why you can trust it (slim) ── */}
        <CredibilityStrip />

        {/* ── Everything else, in one carousel of links ── */}
        <ExploreCarousel />

      </div>
    </PartyCycleProvider>
  )
}
