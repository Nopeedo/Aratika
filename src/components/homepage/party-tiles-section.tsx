/**
 * PartyTilesSection — server component. Assembles the data for <PartyTiles> from
 * LOCAL sources only (no scraping): approved positions from our DB, party facts
 * from PARTY_PROFILES, leader photos from MP_PROFILES. Keeps the big datasets on
 * the server; passes a lean array to the client tile UI.
 */

import { cache } from 'react'
import { getAllApprovedPositions } from '@/lib/positions/live'
import { PARTY_PROFILES } from '@/constants/parties-data'
import { PARTY_COLORS } from '@/constants/parties'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import { MP_PROFILES } from '@/constants/mps-data'
import { trackerBills } from '@/lib/bills/member-party'
import { getNewsForParty } from '@/lib/news/live'
import { getVideosForParty } from '@/lib/news/videos'
import { PartyTiles, PartyStanceSummary, PartyNewsSummary, type TileParty, type TilePosition } from '@/components/homepage/party-tiles'
import type { PartySlug, PolicyTopic } from '@/types'

// The six parties in Parliament, in current-seat order (TOP is extra-parliamentary).
const TILE_ORDER: PartySlug[] = ['national', 'labour', 'green', 'act', 'nzfirst', 'tpm']
// Topics the comparison pipeline covers.
const ACTIVE_TOPICS = ['economy', 'health', 'housing', 'education', 'climate', 'crime-justice']

// Where a sourced position isn't in the DB yet, fall back to the party's stated
// priority from its profile (coreValues) — matched to a topic by keyword. This is
// a general, profile-stated value (shown as "stated priority", NOT a sourced
// position), so it only fills a gap when the profile clearly speaks to that topic.
const TOPIC_MATCH: Record<string, RegExp> = {
  economy: /(econom|\btax|\bwage|business|cost of living|fiscal|\bgdp\b)/i,
  health: /(health|hospital|mental health|medic)/i,
  housing: /(housing|\brent|tenan)/i,
  education: /(education|school|student|teacher|curriculum)/i,
  climate: /(climate|emission|net.?zero|carbon|clean energy)/i,
  'crime-justice': /(law and order|law.?and.?order|crime|justice|police|sentenc|prison|community safety)/i,
}
function profilePriority(coreValues: string[], topic: string): string | null {
  const re = TOPIC_MATCH[topic]
  return (re && coreValues.find((v) => re.test(v))) || null
}

function mpSlugForName(name: string): string | null {
  const entry = Object.entries(MP_PROFILES).find(([, mp]) => mp.name === name)
  return entry ? entry[0] : null
}

// Shared by the section components so each builds the identical parties array
// from one place, instead of duplicating this assembly logic — they just render
// different pieces of UI from the same data.
//
// cache() dedupes it per request. Three sections on the homepage call this, and
// it now costs the positions query plus twelve coverage queries; without this
// that whole cost multiplied by the number of sections rendering, for data that
// is identical every time.
const buildTileParties = cache(async function buildTileParties(): Promise<TileParty[]> {
  const all = await getAllApprovedPositions()
  const BILLS = trackerBills()

  // Coverage for all six, fetched here rather than in the tile.
  //
  // The tile panel is a client component and the selection changes instantly,
  // so the feed for every party has to be on the page before the first tap.
  // Each call filters on data->parties in the query — the pattern that replaced
  // "fetch the newest N and filter in memory", which hid everything about a
  // party that had not been in the news that week (see getNewsForParty).
  //
  // Trimmed to the fields the tile draws. NewsItem and VideoItem carry tag
  // arrays, snippets and portrait fallbacks that nothing here reads, and all of
  // it would otherwise be serialised into the page for six parties at once.
  const coverage = Object.fromEntries(
    await Promise.all(TILE_ORDER.map(async (slug) => {
      const [news, videos] = await Promise.all([getNewsForParty(slug, 3), getVideosForParty(slug, 2)])
      return [slug, {
        news: news.map((n) => ({ id: n.id, title: n.title, outlet: n.outlet, kind: n.kind, link: n.link, pubDate: n.pubDate })),
        videos: videos.map((v) => ({ id: v.id, title: v.title, videoId: v.videoId, source: v.source, thumbnail: v.thumbnail, pubDate: v.pubDate })),
      }] as const
    })),
  )

  return TILE_ORDER.map((slug) => {
    const prof = PARTY_PROFILES[slug]
    const col = PARTY_COLORS[slug]

    // Verified positions for this party: dedupe by topic (prefer current 2026), keep active topics, order them.
    const byTopic: Record<string, (typeof all)[number]> = {}
    for (const pos of all) {
      if (pos.party !== slug || !ACTIVE_TOPICS.includes(pos.topic)) continue
      if (!byTopic[pos.topic] || pos.period === '2026') byTopic[pos.topic] = pos
    }
    const positions: TilePosition[] = ACTIVE_TOPICS.map((t): TilePosition | null => {
      const label = POLICY_TOPICS[t as PolicyTopic].label
      // Prefer a sourced DB position.
      if (byTopic[t]) {
        return { topic: t, label, stance: byTopic[t].stance, sourceUrl: byTopic[t].sourceUrl, href: `/policies/${t}` }
      }
      // Otherwise fall back to the party's stated priority from its profile, if it speaks to this topic.
      const priority = profilePriority(prof.coreValues, t)
      if (priority) {
        return { topic: t, label, stance: priority, sourceUrl: null, href: `/parties/${slug}`, fromProfile: true }
      }
      return null
    }).filter((p): p is TilePosition => p !== null)

    const leaderSlug = mpSlugForName(prof.leader)
    const coLeaderSlug = prof.coLeader ? mpSlugForName(prof.coLeader) : null

    return {
      slug,
      name: prof.name,
      color: col.bg,
      light: col.light,
      textColor: col.text,
      leader: prof.leader,
      leaderTitle: prof.leaderTitle,
      leaderPhoto: leaderSlug ? MP_PROFILES[leaderSlug].photo : prof.leaderPhoto,
      leaderHref: leaderSlug ? `/mps/${leaderSlug}` : null,
      coLeader: prof.coLeader,
      coLeaderPhoto: coLeaderSlug ? MP_PROFILES[coLeaderSlug].photo : undefined,
      coLeaderHref: coLeaderSlug ? `/mps/${coLeaderSlug}` : null,
      role: prof.status === 'governing' ? 'In government' : 'In opposition',
      governing: prof.status === 'governing',
      // Counted here on the server, from the same BILLS_54 the tracker filters,
      // so the figure on the tile matches the list it links to.
      bills: BILLS[slug] ?? { total: 0, government: 0, members: 0, other: 0, passed: 0 },
      news: coverage[slug]?.news ?? [],
      videos: coverage[slug]?.videos ?? [],
      seats: prof.seats,
      electorateSeats: prof.electorateSeats,
      listSeats: prof.listSeats,
      founded: prof.founded,
      website: prof.website,
      profileHref: `/parties/${slug}`,
      positions,
      topicsTotal: ACTIVE_TOPICS.length,
    }
  })
})

export async function PartyTilesSection() {
  const parties = await buildTileParties()
  return <PartyTiles parties={parties} />
}

/** News and video naming the selected party, as its own homepage section,
 *  placed between "This term" and the find-your-MP button. Follows the tile
 *  selection through the shared party cycle. */
export async function PartyNewsSection() {
  const parties = await buildTileParties()
  return <PartyNewsSummary parties={parties} />
}

/** Renders just the "Summary of Party Stance" card, using the same party data —
 *  placed lower on the homepage (after "Where do the parties stand?") instead of
 *  directly under the tiles. Stays in sync via the shared party-cycle selection. */
export async function PartyStanceSection() {
  const parties = await buildTileParties()
  return <PartyStanceSummary parties={parties} />
}
