/**
 * Arapono — Homepage
 *
 * Ordered as a beginner → intermediate → expert reading ladder, so a first-timer
 * only meets the essentials before building confidence, and the horse-race,
 * tracking and battlegrounds depth sits below for the engaged reader. Every
 * reader still gets the whole page; this only controls what hits them first.
 *
 *  BEGINNER      hero · start here · party tiles · get ready to vote ·
 *                explore by issue · find your electorate · credibility
 *  — go deeper —
 *  INTERMEDIATE  state of the race (explained) · track what matters · news
 *  EXPERT        battlegrounds
 *  (gated)       parliament snapshot · premium
 */

import { CinematicHeroBurnt as CinematicHero } from '@/components/homepage/cinematic-hero-burnt'
import { PartyCycleProvider } from '@/components/homepage/party-cycle'
import { StartHereCta } from '@/components/homepage/start-here-cta'
import { CornerCompass } from '@/components/homepage/corner-compass'
import { PartyTilesSection } from '@/components/homepage/party-tiles-section'
import { GetReadyToVote } from '@/components/homepage/get-ready-to-vote'
import { PolicyHubGrid } from '@/components/homepage/policy-hub-grid'
import { HomeMap } from '@/components/homepage/home-map'
import { CredibilityStrip } from '@/components/homepage/credibility-strip'
import { GoDeeperDivider } from '@/components/homepage/go-deeper-divider'
import { ElectionAnchor } from '@/components/homepage/election-anchor'
import { TrackCta } from '@/components/homepage/track-cta'
import { HomeNews } from '@/components/homepage/home-news'
import { BattlegroundsTeaser } from '@/components/homepage/battlegrounds-teaser'
import { ParliamentSnapshot } from '@/components/parliament/parliament-snapshot'
import { PremiumCta } from '@/components/homepage/premium-cta'
import { isEnabled } from '@/constants/features'

export default function HomePage() {
  return (
    <PartyCycleProvider>

      {/* ═══════════════════════ BEGINNER ═══════════════════════
          The essentials, in the order a first-timer actually needs them:
          you belong here → start here → understand the parties → learn to
          vote and find your issues → find your local area → you can trust it. */}
      <CinematicHero />
      <StartHereCta />
      <CornerCompass />
      <PartyTilesSection />
      <GetReadyToVote />
      <PolicyHubGrid />
      <HomeMap />
      <CredibilityStrip />

      {/* ── Signpost: essentials done, deeper sections below when you want them ── */}
      <GoDeeperDivider />

      {/* ═══════════════════════ INTERMEDIATE ═══════════════════════
          For the reader following the race: where things stand (with the poll
          numbers explained in plain language), what to keep tabs on, the news. */}
      <ElectionAnchor />
      <TrackCta />
      {isEnabled('news') && <HomeNews />}

      {/* ═══════════════════════ EXPERT ═══════════════════════
          The strategic detail — the marginal seats that decide the election. */}
      <BattlegroundsTeaser />

      {/* ── Gated (Phase 2) — hidden until the phase flips ── */}
      {isEnabled('parliament') && <ParliamentSnapshot />}
      {isEnabled('premium') && <PremiumCta />}

    </PartyCycleProvider>
  )
}
