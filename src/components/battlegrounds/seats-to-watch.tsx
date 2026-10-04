/**
 * SeatsToWatch — what /battlegrounds used to be: a marginality-coloured
 * electorate map plus a ranked list of the closest 2023 contests, each linking
 * to its seat page.
 *
 * THIS IS THE PAGE. It was demoted and unrendered while /battlegrounds was
 * (see app/battlegrounds/page.tsx) with this content hidden. Kept whole, per
 * the handoff's "demote, don't delete": the map itself still runs on the
 * Election Centre, and this is one import away from coming back — after
 * election night, say, when the seat-by-seat picture is worth a page again.
 */

import { ExternalLink, Swords } from 'lucide-react'
import { getBattlegrounds, MARGIN_TIERS, UNKNOWN_TIER } from '@/lib/battlegrounds'
import { BattlegroundsMap } from '@/components/battlegrounds/battlegrounds-map'
import { getApprovedCandidatesBySlug } from '@/lib/candidates/live'
import { BattlegroundsList } from '@/components/battlegrounds/battlegrounds-list'
import { InfoButton, InfoHeading, InfoText } from '@/components/ui/info-button'
import { INK, JADE, MANROPE, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

/** The red the hero icon and the closest tier already use. */
const ACCENT = '#dc2626'

export async function SeatsToWatch() {
  const candidatesBySlug = await getApprovedCandidatesBySlug()
  const all = getBattlegrounds()

  return (
    <div style={WOVEN_PAGE}>
      {/*
        The header and the body now sit on ONE pair of vertical lines: both are
        1080 wide with a clamp(18px, 5vw, 36px) gutter. The body used a fixed
        24px, so at 375px every card edge down the page sat 5.25px inside the
        title above it (§5.19, and §8's "see the edges dont align").

        1080 rather than the old 1280, matching /bills, /parties and
        /elections. At 1920 that is a 1008px column, which is four 244px seat
        cards: the same track and the same card size the /mps and /parties
        directories landed on (§2.15), so a reader crossing between them meets
        one object at one size.
      */}
      <div>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '46px clamp(18px, 5vw, 36px) 24px' }}>
          {/* No "Election Battlegrounds" divider badge and no "2026 election →"
              link: the badge was a claim about the page rather than a fact
              about any of its rows (the /bills precedent), and the election
              link is in the nav and at the foot of every seat page. */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(11px, 3vw, 16px)' }}>
            <div style={{ width: 'clamp(40px, 11vw, 54px)', height: 'clamp(40px, 11vw, 54px)', borderRadius: 15, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Swords style={{ width: 'clamp(20px, 5.5vw, 27px)', height: 'clamp(20px, 5.5vw, 27px)', color: ACCENT }} />
            </div>
            {/* The standfirst that stood here is the (i) beside the title
                (§1.2). It was five lines on a phone saying three things a
                reader who has been here before skips: that every seat has a
                page, what makes one worth watching, and what the colours mean.
                The colours are drawn on the map directly below it. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 'clamp(26px, 7vw, 38px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.05 }}>2026 Election map</h1>
              <InfoButton accent={ACCENT} label="What makes a seat one to watch" size={26}>
                <InfoHeading accent={ACCENT}>What makes a seat one to watch</InfoHeading>
                <InfoText>
                  Every electorate has a page of its own, with the sitting MP, their record and
                  who has confirmed they are standing in 2026. The closest 2023 races are the
                  likeliest to change hands, so the list is ranked by the winning margin, closest
                  first.
                </InfoText>
                <InfoHeading accent={ACCENT}>What the colours mean</InfoHeading>
                <InfoText>
                  Hotter colours are tighter 2023 contests. {MARGIN_TIERS.map((t) => `${t.label}: ${t.threshold}`).join('. ')}.
                  {' '}Two seats have no margin on record and show as {UNKNOWN_TIER.label.toLowerCase()}:
                  Port Waikato, where the 2023 election was cancelled after a candidate died, and
                  Tāmaki Makaurau, where a 2025 by-election followed the death of the sitting MP.
                </InfoText>
                <InfoHeading accent={ACCENT}>On election night</InfoHeading>
                <InfoText>
                  Preliminary results appear on this page from 7pm on election day, above the map.
                  The map keeps working underneath.
                </InfoText>
                <InfoHeading accent={ACCENT}>Where the margins come from</InfoHeading>
                <InfoText>
                  The Electoral Commission’s official 2023 general election results. Every row was
                  checked against elections.nz in July 2026. Candidates for 2026 appear on each
                  seat page as parties confirm them during the campaign.
                </InfoText>
              </InfoButton>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '4px clamp(18px, 5vw, 36px) 64px' }}>
        {/* Opens on who is standing, not on 2023 margins: the page is named for
            the current field, and last election's result is the secondary
            view (the map has a toggle). Same default as the Election
            Centre's copy of this map, so the two agree. */}
        <BattlegroundsMap candidatesBySlug={candidatesBySlug} defaultView="candidates" />

        {/* The four margin tiers were stated three times within 200px of
            scroll: this map's legend, an inert row of dot-label-count chips,
            and the tappable filter pills below. The inert row went (§1.3, and
            the same case as the bills stat row that "became inert figures"),
            because it carried the identical dot, label and count as the pills
            and did nothing when tapped. */}

        {/* All electorates, filterable by margin tier */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '26px 0 10px' }}>
          {/* 24px, matching the peer section headings on /bills. At 20px it
              read as a caption on the hero above it (§4). */}
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.025em', color: INK, fontFamily: MANROPE, margin: 0 }}>Every seat, ranked by margin</h2>
          <InfoButton accent={ACCENT} label="How this list is ranked" size={24}>
            <InfoHeading accent={ACCENT}>How this list is ranked</InfoHeading>
            <InfoText>
              Closest 2023 result first. Tap a tier to narrow the list, and tap the lit pill
              again to go back to all 72. Every seat has a page whether the 2023 race was close
              or not.
            </InfoText>
            <InfoHeading accent={ACCENT}>What the margin is</InfoHeading>
            <InfoText>
              The winning margin: how many more electorate votes the winner got than the
              runner-up in 2023. It is not a forecast for 2026, and it says nothing about the
              party vote, which is what decides how many seats each party gets.
            </InfoText>
          </InfoButton>
        </div>
        {/* The line that stood here ("Closest races first. Filter to a tier, or
            browse them all.") explained the pills directly below it, which are
            labelled and carry their own counts (§8). */}
        <BattlegroundsList all={all} tiers={MARGIN_TIERS} />

        {/* One dated source line, in the /bills shape, replacing a grey box
            that held three unrelated things: a source with no date, an
            instruction ("tap any seat") and a roadmap promise. The date was in
            the data all along (electorates-data.ts) and the page had never
            said it (§4). */}
        <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 18 }}>
          Source: Electoral Commission, 2023 general election official results, as at July 2026.{' '}
          <a href="https://www.electionresults.govt.nz/electionresults_2023/" target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 700 }}>
            Official results <ExternalLink style={{ width: 11, height: 11, display: 'inline' }} />
          </a>
        </p>
      </div>
    </div>
  )
}
