/**
 * PartyTilesSection — server component. Assembles the data for <PartyTiles> from
 * LOCAL sources only (no scraping): approved positions from our DB, party facts
 * from PARTY_PROFILES, leader photos from MP_PROFILES. Keeps the big datasets on
 * the server; passes a lean array to the client tile UI.
 */

import { getAllApprovedPositions } from '@/lib/positions/live'
import { PARTY_PROFILES } from '@/constants/parties-data'
import { PARTY_COLORS } from '@/constants/parties'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import { MP_PROFILES } from '@/constants/mps-data'
import { PartyTiles, type TileParty, type TilePosition } from '@/components/homepage/party-tiles'
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

export async function PartyTilesSection() {
  const all = await getAllApprovedPositions()

  const parties: TileParty[] = TILE_ORDER.map((slug) => {
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
      role: prof.status === 'governing' ? 'In government' : 'In opposition',
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

  return <PartyTiles parties={parties} />
}
