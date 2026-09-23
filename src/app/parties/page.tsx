/**
 * /parties — the directory.
 *
 * Redesigned to the front page's rules (docs/DESIGN-SPEC.md). What came off:
 * the "Official Parliament Data" eyebrow, a six line standfirst, three section
 * headings that a row of pills now does, and three paragraphs of provenance
 * that are behind the (i). What replaced them: one row of §2.2 pills over one
 * §2.3 grid.
 */

import type { Metadata } from 'next'
import { PARTY_PROFILES, PARTY_DIRECTORY_ORDER, PROFILED_MINOR_PARTIES } from '@/constants/parties-data'
import { PARTY_COLORS, PARTY_NAMES, CURRENT_SEATS, TOTAL_SEATS, PARTY_STATUS } from '@/constants/parties'
import { MP_PROFILES } from '@/constants/mps-data'
import { InfoButton, InfoHeading, InfoText } from '@/components/ui/info-button'
import { PartyDirectory, type DirectoryParty } from '@/components/parties/party-directory'
import type { PartySlug } from '@/types'
import { INK, JADE, MANROPE, SECONDARY, WOVEN_PAGE } from '@/constants/theme'

export const metadata: Metadata = {
  title: 'Party Profiles',
  description:
    'Every registered party contesting the 2026 New Zealand election, in the 54th ' +
    'Parliament and outside it. Seat counts, leadership, and where each one stands on every issue.',
}

const EC_REGISTER_URL = 'https://elections.nz/democracy-in-nz/political-parties-in-new-zealand/register-of-political-parties'

/** A leader holding a seat has an MP photo; one who does not may still have a
 *  photo on the party record. Undefined renders as initials. */
function photoFor(name: string | undefined, fallback?: string): string | undefined {
  if (!name) return fallback
  return Object.values(MP_PROFILES).find((m) => m.name === name)?.photo ?? fallback
}

/**
 * ONE list, derived. The page used to hold three hand-kept arrays of the same
 * parties: PARTY_DIRECTORY_ORDER, a PROFILED_NON_PARL of eleven slugs, and a
 * REGISTERED_NON_PARLIAMENTARY of eleven names with sites and focus areas. A
 * party added to one and not the others appeared twice or not at all, and the
 * third array had already drifted: it described three parties as "applied and
 * under consideration" that were registered on 5 August 2026 and are on this
 * page with full profiles.
 */
function directoryParties(): DirectoryParty[] {
  return [...PARTY_DIRECTORY_ORDER, ...PROFILED_MINOR_PARTIES]
    .filter((slug) => slug !== 'independent' && PARTY_PROFILES[slug])
    .map((slug) => {
      const profile = PARTY_PROFILES[slug]
      const status = PARTY_STATUS[slug]
      return {
        slug: slug as PartySlug,
        name: PARTY_NAMES[slug]?.short ?? profile.name,
        seats: CURRENT_SEATS[slug] ?? 0,
        group: status === 'governing' || status === 'opposition' ? status : 'none',
        colour: PARTY_COLORS[slug].bg,
        light: PARTY_COLORS[slug].light,
        leader: profile.leader ?? null,
        leaderPhoto: photoFor(profile.leader, profile.leaderPhoto),
        coLeader: profile.coLeader ?? null,
        coLeaderPhoto: photoFor(profile.coLeader),
      }
    })
}

export default function PartiesPage() {
  const parties = directoryParties()
  const governing = parties.filter((p) => p.group === 'governing')
  const govtSeats = governing.reduce((n, p) => n + p.seats, 0)
  const withSeats = parties.filter((p) => p.seats > 0)

  return (
    <div style={WOVEN_PAGE}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '28px clamp(18px, 5vw, 36px) 56px' }}>

        {/* The (i) sits inline with the heading, at 24 rather than 26 because
            it is beside a heading and not a pill (§2.1). */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <h1 style={{ fontSize: 'clamp(26px, 7vw, 40px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.1 }}>
            Party Profiles
          </h1>
          <InfoButton accent={JADE} label="How this list is put together" size={24}>
            <InfoHeading accent={JADE}>Who is on this list</InfoHeading>
            <InfoText>
              Every party registered with the Electoral Commission to contest the 2026 party vote, whether or
              not it holds seats. Inclusion is by registration, never by polling, and the order inside each
              group is fixed rather than ranked. Politika endorses none of them.
            </InfoText>

            <InfoHeading accent={JADE}>Where the seat counts come from</InfoHeading>
            <InfoText>
              The 2023 general election returned 122 seats. A by-election in Port Waikato on 25 November 2023,
              held after a candidate died during the campaign, added one National seat and brought the House to
              123. The counts here are the seats each party holds now, which is why National reads 49 rather
              than the 48 it won on election night.
            </InfoText>

            <InfoHeading accent={JADE}>What it takes to govern</InfoHeading>
            <InfoText>
              62 of the 123 seats. A party or group of parties with 62 can win a vote in the House, which is
              what forming a government means in practice.
            </InfoText>
          </InfoButton>
        </div>

        <p style={{ fontSize: 15, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.5, margin: '0 0 18px', maxWidth: 560 }}>
          Open any party to read where they stand on every issue, in our words with their source.
        </p>

        {/* The House, in one line and one bar. It used to be a white card
            carrying a bar, "Governing coalition 68 / 123" and "Majority needed
            62" in three columns: 62 is a rule of the House rather than a fact
            about a party, so it moved into the (i), and the coalition's share
            is a sentence rather than a figure needing a label. */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 2, height: 8, width: '100%', maxWidth: 420, borderRadius: 999, overflow: 'hidden', marginBottom: 7 }}>
            {withSeats.map((p) => (
              <div key={p.slug} style={{ width: `${(p.seats / TOTAL_SEATS) * 100}%`, background: p.colour, height: '100%' }} title={`${p.name}: ${p.seats} seats`} />
            ))}
          </div>
          <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.45 }}>
            The governing coalition holds <b style={{ color: INK }}>{govtSeats} of {TOTAL_SEATS}</b> seats in this Parliament.
          </p>
        </div>

        <PartyDirectory parties={parties} />

        <p style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.5, margin: '20px 0 0' }}>
          Register checked 23 August 2026.{' '}
          <a href={EC_REGISTER_URL} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 700, textDecoration: 'none' }}>
            Electoral Commission register ↗
          </a>
        </p>
      </div>
    </div>
  )
}
