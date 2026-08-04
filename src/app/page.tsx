/**
 * Arapono — Homepage
 *
 * "Default to less." A first-timer meets only FOUR things before the "go deeper"
 * divider — a single clear choice (guided vs. explore), the parties, how to vote,
 * and why to trust us. Everything else (explore-by-issue, the map, the horse-race,
 * tracking, news, battlegrounds) sits BELOW the divider for people who want it.
 * Nothing is deleted — only demoted. The competing "start" prompts (floating
 * compass, a separate "Start here" line) were removed in favour of the hero's one
 * "Help me get started" action, which opens the skippable guide at /guide.
 *
 *  ESSENTIALS    hero (guide vs. explore) · party tiles · get ready to vote · credibility
 *  — go deeper —
 *  EXPLORE       by issue · find your electorate
 *  THE RACE      state of the race (explained) · track what matters · news
 *  EXPERT        battlegrounds
 *  (gated)       parliament snapshot · premium
 */

import { CinematicHeroBurnt as CinematicHero } from '@/components/homepage/cinematic-hero-burnt'
import { PartyCycleProvider } from '@/components/homepage/party-cycle'
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

      {/* ═══════════════════════ ESSENTIALS ═══════════════════════
          The four things a first-timer needs, and no more: one clear choice
          (guided help vs. explore) → the parties → how to actually vote →
          why you can trust it. The deeper surfaces wait below the divider. */}
      <CinematicHero />
      {/* #parties — target of the hero's "I'll look around myself" jump. */}
      <div id="parties" style={{ scrollMarginTop: 72 }}>
        <PartyTilesSection />
      </div>
      <GetReadyToVote />
      <CredibilityStrip />

      {/* ── Signpost: essentials done, deeper sections below when you want them ── */}
      <GoDeeperDivider />

      {/* ═══════════════════════ EXPLORE ═══════════════════════
          Self-directed depth for the reader who chose to look around: browse
          the issues, then find their own electorate. */}
      <PolicyHubGrid />
      <HomeMap />

      {/* ═══════════════════════ THE RACE ═══════════════════════
          For the reader following the contest: where things stand (with the poll
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
