import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { PARTY_PROFILES, PARTY_DIRECTORY_ORDER } from '@/constants/parties-data'
import { CURRENT_SEATS, TOTAL_SEATS, PARTY_STATUS } from '@/constants/parties'
import { SectionDivider } from '@/components/ui/section-divider'
import { PartyTileGrid, PlainPartyTile } from '@/components/parties/party-tile'
import { BORDER, INK, JADE, SECONDARY, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

export const metadata: Metadata = {
  title: 'Political Parties',
  description:
    'Every registered party contesting the 2026 New Zealand election, in the 54th ' +
    'Parliament and outside it. Seat counts, leadership, and where each one stands on every issue.',
}

// Warm woven palette — shared with the homepage, Election Centre and the party
// profiles this page leads into.

// Registered with the Electoral Commission to contest the 2026 party vote, but holding no
// seats in the current (54th) Parliament. Listed EQUALLY and alphabetically — Arapono ranks
// or endorses none. Party names from the EC register (re-checked 23 August 2026, when
// four parties registered on 5 August were added); official websites
// and policy-focus areas taken from each party's own site.
const REGISTERED_NON_PARLIAMENTARY: { name: string; site: string; focus: string[]; profile?: string }[] = [
  { name: 'Alliance Party of Aotearoa New Zealand', site: 'https://allianceparty.nz/', focus: ['Economy', 'Health', 'Housing'], profile: '/parties/alliance' },
  { name: 'Animal Justice Party Aotearoa New Zealand', site: 'https://animaljustice.org.nz/', focus: ['Animal welfare', 'Environment', 'Climate'], profile: '/parties/animal-justice' },
  { name: 'Aotearoa Legalise Cannabis Party', site: 'https://alcp.org.nz/', focus: ['Cannabis law reform', 'Health', 'Justice'], profile: '/parties/alcp' },
  { name: 'Conservative Party NZ', site: 'https://www.conservatives.nz/', focus: ['Economy', 'Housing', 'Law & order'], profile: '/parties/conservative' },
  { name: 'Free Palestine', site: 'https://palfree.nz/', focus: ['Foreign policy'], profile: '/parties/free-palestine' },
  { name: 'New Zealand Loyal', site: 'https://nzloyal.com/', focus: ['Democracy & government'], profile: '/parties/nz-loyal' },
  { name: 'NZ Outdoors & Freedom Party', site: 'http://outdoorsparty.co.nz/', focus: ['Environment', 'Outdoors & freedom'], profile: '/parties/nz-outdoors' },
  { name: 'Te Tai Tokerau Party', site: 'https://tetaitokerauparty.org.nz/', focus: ['Treaty & Māori affairs'], profile: '/parties/te-tai-tokerau-party' },
  { name: 'The Opportunity Party (TOP)', site: 'https://www.opportunity.org.nz/', focus: ['Economy', 'Climate', 'Housing'], profile: '/parties/top' },
  { name: 'Vision New Zealand', site: 'https://www.vision.org.nz/', focus: ['Economy', 'Māori affairs', 'Social values'], profile: '/parties/vision-nz' },
  { name: 'Women’s Rights Party', site: 'https://womensrightsparty.nz/', focus: ['Women’s rights', 'Education', 'Health'], profile: '/parties/womens-rights' },
]
const EC_REGISTER_URL = 'https://elections.nz/democracy-in-nz/political-parties-in-new-zealand/register-of-political-parties'

// Non-parliamentary parties that already have a full profile — shown as the
// same tile as the parties in Parliament, not as neutral list rows.
const PROFILED_NON_PARL: (keyof typeof PARTY_PROFILES)[] = [
  'alliance', 'animal-justice', 'alcp', 'conservative', 'free-palestine', 'nz-loyal',
  'nz-outdoors', 'te-tai-tokerau-party', 'top', 'vision-nz', 'womens-rights',
]

export default function PartiesPage() {
  const governing   = PARTY_DIRECTORY_ORDER.filter((s) => PARTY_STATUS[s] === 'governing')
  const opposition  = PARTY_DIRECTORY_ORDER.filter((s) => PARTY_STATUS[s] === 'opposition')
  const others      = PARTY_DIRECTORY_ORDER.filter((s) => PARTY_STATUS[s] !== 'governing' && PARTY_STATUS[s] !== 'opposition')
  const govtSeats   = governing.reduce((n, s) => n + CURRENT_SEATS[s], 0)

  return (
    // Woven ground, not flat white — the party profiles this page leads into
    // already sit on it, and the two should feel like one place.
    <div style={WOVEN_PAGE}>

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '52px 36px 48px' }}>
          <div style={{ marginBottom: 8 }}>
            <SectionDivider type="official" label="Official Parliament Data" />
          </div>
          <h1 style={{
            fontSize:      40,
            fontWeight:    800,
            letterSpacing: '-.02em',
            color:         INK,
            fontFamily:    'var(--font-manrope), system-ui, sans-serif',
            marginBottom:  10,
          }}>
            Political Parties
          </h1>
          <p style={{
            fontSize:   17,
            fontWeight: 500,
            color:      SECONDARY,
            fontFamily: 'var(--font-manrope), system-ui, sans-serif',
            maxWidth:   560,
            lineHeight: 1.6,
          }}>
            Every <b style={{ color: INK }}>registered party contesting 2026</b>, in the
            54th Parliament and outside it. Open any party to read where they stand on
            every issue, in our words with their source.
            {' '}Seat counts sourced from the 2023 General Election official results.
          </p>

          {/* Coalition overview bar */}
          <div style={{
            marginTop:    32,
            padding:      '18px 22px',
            background:   '#ffffff',
            border:       `1px solid ${BORDER}`,
            borderRadius: 16,
            boxShadow:    '0 1px 2px rgba(42,18,6,.04), 0 8px 20px -12px rgba(42,18,6,.14)',
            display:      'flex',
            alignItems:   'center',
            gap:          24,
            flexWrap:     'wrap',
          }}>
            <div style={{ flex: '1 1 240px', minWidth: 0 }}>
              <div style={{
                fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em',
                textTransform: 'uppercase', color: TERTIARY,
                fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                marginBottom: 4,
              }}>
                54th Parliament — {TOTAL_SEATS} seats total
              </div>
              {/* Seat bar — fills the column up to 400px, shrinks on narrow screens */}
              <div style={{ display: 'flex', gap: 2, height: 10, width: '100%', maxWidth: 400, borderRadius: 999, overflow: 'hidden' }}>
                {PARTY_DIRECTORY_ORDER.map((slug) => (
                  <div
                    key={slug}
                    style={{
                      width:      `${(CURRENT_SEATS[slug] / TOTAL_SEATS) * 100}%`,
                      background: PARTY_PROFILES[slug].color,
                      height:     '100%',
                    }}
                    title={`${PARTY_PROFILES[slug].name}: ${CURRENT_SEATS[slug]} seats`}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: TERTIARY, fontFamily: 'var(--font-manrope), system-ui, sans-serif' }}>
                  Governing coalition
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: INK, fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' }}>
                  {govtSeats}{' '}
                  <span style={{ fontSize: 13, fontWeight: 500, color: TERTIARY, fontFamily: 'var(--font-manrope), system-ui, sans-serif' }}>
                    / {TOTAL_SEATS}
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: TERTIARY, fontFamily: 'var(--font-manrope), system-ui, sans-serif' }}>
                  Majority needed
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: INK, fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' }}>
                  62
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '52px 36px' }}>

        {/* No PartySwitcher here, though it is still the top layer of every
            /parties/[slug] page. There it earns its place: that page has no
            other index, so without it comparing two parties means coming back
            here first. On THIS page the tiles below are already a complete,
            clickable index of the same thirteen parties, so the switcher put
            every party on screen twice, a few centimetres apart.

            The trade is real and worth naming: the pill row was the only place
            a reader saw all thirteen without scrolling, so on a phone the
            parties without seats now sit below six full-height tiles. They are
            still listed in full, equally and alphabetically, in their own
            section — the inclusion rule is about presence and equal treatment,
            not about being first. Keeping a pill row for the smaller parties
            alone would have broken that rule rather than served it. */}

        {/* Solid party-colour tiles, the same format as the Election Centre's
            contesting grid — the coloured-edge-on-white cards didn't read as
            the party at a glance. Here the gauge fills to seats, not polling. */}

        {/* ── Governing coalition ───────────────────────────────────── */}
        <SectionTitle label="Governing Coalition" count={governing.length} />
        <div style={{ marginBottom: 44 }}>
          <PartyTileGrid slugs={governing} />
        </div>

        {/* ── Opposition ────────────────────────────────────────────── */}
        <SectionTitle label="Opposition" count={opposition.length} />
        <div style={{ marginBottom: others.length ? 44 : 0 }}>
          <PartyTileGrid slugs={opposition} />
        </div>

        {/* ── Registered but not in Parliament — the parties fighting to get in ── */}
        <SectionTitle label="Also contesting 2026, without seats in Parliament" count={REGISTERED_NON_PARLIAMENTARY.length} />
        <OtherRegisteredParties />

      </div>
    </div>
  )
}

// ─── Section title ────────────────────────────────────────────────────────────

function SectionTitle({ label, count }: { label: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <h2 style={{
        fontSize:     18,
        fontWeight:   800,
        color:        INK,
        fontFamily:   'var(--font-manrope), system-ui, sans-serif',
        margin:       0,
      }}>
        {label}
      </h2>
      <span style={{
        fontSize: 12, fontWeight: 700,
        background: '#f1efeb', color: SECONDARY,
        borderRadius: 999, padding: '2px 9px',
        fontFamily: 'var(--font-manrope), system-ui, sans-serif',
      }}>
        {count} {count === 1 ? 'party' : 'parties'}
      </span>
    </div>
  )
}

// ─── Registered parties not in Parliament — neutral, equal, sourced ─────────────

function OtherRegisteredParties() {
  return (
    <div>
      <p style={{ fontSize: 14, color: SECONDARY, fontFamily: 'var(--font-manrope), system-ui, sans-serif', lineHeight: 1.6, margin: '0 0 18px', maxWidth: 720 }}>
        Eleven parties are registered with the Electoral Commission to contest the 2026 party vote but hold no seats in the current Parliament (register checked 23 August 2026). They’re listed <b style={{ color: INK }}>equally and alphabetically</b>. Arapono doesn’t rank or endorse any party.
      </p>

      {/* Ones we've fully profiled — same tile as the parties in Parliament,
          hatched rather than filled because they hold no seats. */}
      {PROFILED_NON_PARL.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <PartyTileGrid slugs={PROFILED_NON_PARL} />
        </div>
      )}

      {/* The rest — neutral rows with official site + policy focus, until they're profiled too */}
      {REGISTERED_NON_PARLIAMENTARY.some((p) => !p.profile) && (
      <p style={{ fontSize: 13, fontWeight: 600, color: SECONDARY, fontFamily: 'var(--font-manrope), system-ui, sans-serif', margin: '0 0 12px' }}>
        Full profiles for the remaining registered parties are on the way — for now, their official site and policy focus:
      </p>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {REGISTERED_NON_PARLIAMENTARY.filter((p) => !p.profile).map((p) => (
          <div key={p.name} style={{ flex: '1 1 236px', maxWidth: 340, minWidth: 0 }}>
            <PlainPartyTile name={p.name} focus={p.focus} site={p.site} />
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: 'var(--font-manrope), system-ui, sans-serif', lineHeight: 1.6, margin: '16px 0 0', maxWidth: 760 }}>
        Party names from the Electoral Commission’s register of registered political parties (as at 1 July 2026); official websites and policy-focus areas are taken from each party’s own site. Further registered parties will appear here as we verify them; three more — the Alliance Party, New Zealand Loyal and Te Tai Tokerau Party — have applied and are under consideration ahead of the 6 August 2026 registration deadline.{' '}
        <a href={EC_REGISTER_URL} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 700, textDecoration: 'none' }}>See the full register ↗</a>
      </p>
    </div>
  )
}
