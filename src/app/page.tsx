/**
 * Aratika — Homepage
 *
 * Hybrid layout (Options 1 + 2):
 *  1. Hero      — Election urgency + personal MP finder search
 *  2. Parliament — Chamber hemicycle snapshot (already built)
 *  3. Policies  — Prominent issue-led grid with party colour indicators
 *  4. Map       — Condensed CTA banner
 *  5. News      — Two-column: news items + live poll
 *  6. Premium   — Upgrade CTA
 */

import Link from 'next/link'
import {
  Map, ShieldCheck, Crown, ArrowRight,
  Compass, Scale, Vote, Newspaper, ArrowUpRight, Sparkles,
  Users, Bookmark, Gavel,
} from 'lucide-react'
import { SectionDivider }      from '@/components/ui/section-divider'
import { ParliamentSnapshot }  from '@/components/parliament/parliament-snapshot'
import { CinematicHeroBurnt as CinematicHero } from '@/components/homepage/cinematic-hero-burnt'
import { PartyCycleProvider } from '@/components/homepage/party-cycle'
import { PartyTilesSection } from '@/components/homepage/party-tiles-section'
import { ElectionCountdown }   from '@/components/homepage/election-countdown'
import { HomeMapFeature }      from '@/components/homepage/home-map-feature'
import { PolicyCard }          from '@/components/homepage/policy-card'
import { Reveal }              from '@/components/ui/reveal'
import { SITE }                from '@/constants/site'
import { PARTY_COLORS }        from '@/constants/parties'
import { POLICY_TOPIC_ORDER }  from '@/constants/policy-topics'
import { HomePlanBanner }      from '@/components/onboarding/home-plan-banner'
import { isEnabled }          from '@/constants/features'

// ─── Design tokens (matching the Chamber design system) ───────────────────────

const INK       = '#0c0e12'
const SECONDARY = '#6b7078'
const TERTIARY  = '#9aa0aa'
const JADE      = '#1F8A4C'
const BORDER    = '#e9e7e2'
const SURFACE   = '#f8fafc'

// All 6 parties in spectrum order — used for the party legend below the policy grid
const PARTY_DOT_ORDER = [
  'green', 'labour', 'tpm', 'nzfirst', 'national', 'act',
] as const

// ─── News sources (real, official/public-interest — no fabricated headlines) ──
// A curated live RSS feed is on the roadmap; until then we point to the source,
// never invent headlines. Mirrors /news.

const NEWS_SOURCES = [
  { name: 'RNZ — Politics', url: 'https://www.rnz.co.nz/news/political', desc: 'NZ’s public broadcaster — independent political coverage.' },
  { name: 'The Beehive', url: 'https://www.beehive.govt.nz', desc: 'Official Government press releases and ministerial statements.' },
  { name: 'NZ Parliament', url: 'https://www.parliament.nz/en/get-involved/news-and-media/', desc: 'Official news — bills, debates and proceedings.' },
]

// ─── Stat tiles data ──────────────────────────────────────────────────────────

const STATS = [
  { value: '2026',  label: 'General Election', sublabel: '~Oct 2026' },
  { value: '72',    label: 'Electorates',      sublabel: 'General & Māori' },
  { value: '6',     label: 'Parties',          sublabel: 'In Parliament' },
  { value: '123',   label: 'MPs',              sublabel: 'You can look up' },
]

// ─── Components ───────────────────────────────────────────────────────────────

function StatTile({ value, label, sublabel }: { value: string; label: string; sublabel: string }) {
  return (
    <div style={{
      background:   '#ffffff',
      border:       `1px solid ${BORDER}`,
      borderRadius: 16,
      padding:      '14px 18px',
      boxShadow:    '0 2px 4px rgba(12,14,18,.03)',
      minWidth:     0,
    }}>
      <div style={{
        fontSize:          28,
        fontWeight:        700,
        letterSpacing:     '-.02em',
        color:             INK,
        lineHeight:        1,
        fontFamily:        'var(--font-space-grotesk), system-ui, sans-serif',
        fontVariantNumeric:'tabular-nums',
      }}>
        {value}
      </div>
      <div style={{
        fontSize:   13,
        fontWeight: 700,
        color:      INK,
        marginTop:  4,
        fontFamily: 'var(--font-manrope), system-ui, sans-serif',
      }}>
        {label}
      </div>
      <div style={{
        fontSize:   11,
        fontWeight: 500,
        color:      TERTIARY,
        marginTop:  2,
        fontFamily: 'var(--font-manrope), system-ui, sans-serif',
      }}>
        {sublabel}
      </div>
    </div>
  )
}

// PolicyCard — client component, imported from @/components/homepage/policy-card

// News source card — links to the source; we never invent headlines
function NewsSourceCard({ item }: { item: typeof NEWS_SOURCES[number] }) {
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
      <div style={{
        padding:      '14px 0',
        borderBottom: `1px solid ${BORDER}`,
        display:      'flex',
        flexDirection:'column',
        gap:          5,
        cursor:       'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Newspaper style={{ width: 14, height: 14, color: JADE }} />
          <span style={{
            fontSize:   14,
            fontWeight: 800,
            color:      INK,
            fontFamily: 'var(--font-manrope), system-ui, sans-serif',
          }}>
            {item.name}
          </span>
          <ArrowUpRight style={{ width: 13, height: 13, color: TERTIARY, marginLeft: 'auto' }} />
        </div>
        <p style={{
          fontSize:   13,
          fontWeight: 500,
          color:      SECONDARY,
          fontFamily: 'var(--font-manrope), system-ui, sans-serif',
          lineHeight: 1.5,
          margin:     0,
        }}>
          {item.desc}
        </p>
      </div>
    </a>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>

      {/* ═══════════════════════════════════════════════════════════════════
          1. HERO — Election urgency + personal MP finder
      ═══════════════════════════════════════════════════════════════════ */}
      {/* Hero + party tiles share one PartyCycle clock so the title colour and the open tile stay in sync */}
      <PartyCycleProvider>
        <CinematicHero />

        {/* ── Party tiles — tap a colour for an at-a-glance snapshot ── */}
        <section style={{ background: '#fff' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '7px clamp(18px, 5vw, 36px) 40px' }}>
            <PartyTilesSection />
          </div>
        </section>
      </PartyCycleProvider>

      {/* ── REDESIGN CANVAS — intentional white space below the tiles for new content ── */}
      <section aria-hidden style={{ background: '#fff', minHeight: 480, borderBottom: `1px solid ${BORDER}` }} />

      {/* ── Credibility strip ── */}
      <section style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '26px clamp(18px, 5vw, 36px)', display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(116px, 1fr))', gap: 12, flex: 1, minWidth: 0, maxWidth: 560 }}>
            {STATS.map((s) => (
              <StatTile key={s.label} {...s} />
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px' }}>
            {['NZ Parliament', 'Electoral Commission', 'Stats NZ', 'Non-partisan & independent'].map((label) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: TERTIARY, fontFamily: 'var(--font-manrope), system-ui, sans-serif' }}>
                <ShieldCheck style={{ width: 13, height: 13, color: JADE, flexShrink: 0 }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════════
          1b. YOUR PLAN — returning visitors pick up where they left off
      ═══════════════════════════════════════════════════════════════════ */}
      <HomePlanBanner />


      {/* ═══════════════════════════════════════════════════════════════════
          1b. START-HERE DOORS — meet each visitor where they are
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px clamp(18px, 5vw, 36px) 44px' }}>
          <div style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: 'var(--font-manrope), system-ui, sans-serif', margin: '0 0 6px' }}>Your arsenal</h2>
            <p style={{ fontSize: 15, fontWeight: 500, color: SECONDARY, fontFamily: 'var(--font-manrope), system-ui, sans-serif', margin: 0 }}>Everything you need to walk in ready for the decision.</p>
          </div>
          <Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {([
              { href: '/start', icon: Compass, accent: true, title: 'Start with you', body: 'Tell us the issues you care about — we’ll point you to what matters for your vote.', cta: 'Find what matters' },
              { href: '/compare', icon: Scale, accent: false, title: 'Line up the parties', body: 'Every party, side by side, on the issues that matter most to you.', cta: 'Compare parties' },
              { href: '/map', icon: Map, accent: false, title: 'Know the ground', body: 'Find your electorate and see who represents it — and who’s standing in 2026.', cta: 'Open the map' },
              { href: '/bills', icon: Gavel, accent: false, title: 'See the record', body: 'What this Parliament has actually passed — bills, budget and the promises behind them.', cta: 'Open the record' },
            ] as const).map((d) => {
              const Icon = d.icon
              return (
                <Link key={d.href} href={d.href} style={{ textDecoration: 'none' }}>
                  <div className="party-card" style={{
                    height: '100%', display: 'flex', flexDirection: 'column',
                    background: d.accent ? 'linear-gradient(150deg,#0f9152,#0c0e12)' : '#fff',
                    border: `1px solid ${d.accent ? 'transparent' : BORDER}`,
                    borderRadius: 18, padding: '22px 22px',
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 11, marginBottom: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: d.accent ? 'rgba(255,255,255,.16)' : '#ecfdf5',
                    }}>
                      <Icon style={{ width: 20, height: 20, color: d.accent ? '#fff' : JADE }} />
                    </div>
                    <div style={{
                      fontSize: 18, fontWeight: 800, color: d.accent ? '#fff' : INK,
                      fontFamily: 'var(--font-manrope), system-ui, sans-serif', marginBottom: 6,
                    }}>{d.title}</div>
                    <p style={{
                      fontSize: 13.5, fontWeight: 500, lineHeight: 1.55, margin: '0 0 16px',
                      color: d.accent ? 'rgba(255,255,255,.78)' : SECONDARY,
                      fontFamily: 'var(--font-manrope), system-ui, sans-serif', flex: 1,
                    }}>{d.body}</p>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: 13.5, fontWeight: 800,
                      color: d.accent ? '#36e08a' : JADE,
                      fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                    }}>
                      {d.cta} <ArrowRight style={{ width: 15, height: 15 }} />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
          </Reveal>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════════
          2. ELECTIONS 2026 — Phase-1 spotlight
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#0c0e12' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px clamp(18px, 5vw, 36px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'center' }}>
            <div>
              <div className="live-dot" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(54,224,138,.12)', color: '#36e08a', border: '1px solid rgba(54,224,138,.25)', borderRadius: 999, padding: '6px 13px', fontSize: 12.5, fontWeight: 800, fontFamily: 'var(--font-manrope), system-ui, sans-serif', marginBottom: 18 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#36e08a', display: 'inline-block' }} />
                <ElectionCountdown />
              </div>
              <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, letterSpacing: '-.02em', color: '#fff', fontFamily: 'var(--font-manrope), system-ui, sans-serif', margin: '0 0 12px', lineHeight: 1.12 }}>The 2026 election — let’s get you ready</h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,.72)', fontFamily: 'var(--font-manrope), system-ui, sans-serif', lineHeight: 1.6, maxWidth: 520, margin: '0 0 24px' }}>
                Compare the upcoming race with the 2023 result, explore every electorate, and follow who’s standing where — all from official data, no spin.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link href="/elections" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 20px', borderRadius: 11, background: JADE, color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-manrope), system-ui, sans-serif', textDecoration: 'none' }}><Vote style={{ width: 16, height: 16 }} /> Explore Elections 2026</Link>
                <Link href="/battlegrounds" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 20px', borderRadius: 11, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-manrope), system-ui, sans-serif', textDecoration: 'none' }}><Map style={{ width: 16, height: 16 }} /> See the battlegrounds</Link>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {([
                { href: '/elections', icon: Vote, t: '2026 vs 2023', d: 'The upcoming race, beside the last result' },
                { href: '/battlegrounds', icon: Map, t: 'Electorate battlegrounds', d: 'Which seats are on a knife-edge' },
                { href: '/policies', icon: Scale, t: 'Where parties stand', d: 'Compare positions on the issues you care about' },
              ] as const).map((c) => {
                const Icon = c.icon
                return (
                  <Link key={c.href} href={c.href} style={{ textDecoration: 'none' }}>
                    <div className="party-card" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 17px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 14 }}>
                      <span style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(54,224,138,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon style={{ width: 19, height: 19, color: '#36e08a' }} /></span>
                      <span style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-manrope), system-ui, sans-serif' }}>{c.t}</span>
                        <span style={{ display: 'block', fontSize: 12.5, color: 'rgba(255,255,255,.6)', fontFamily: 'var(--font-manrope), system-ui, sans-serif', marginTop: 1 }}>{c.d}</span>
                      </span>
                      <ArrowRight style={{ width: 16, height: 16, color: 'rgba(255,255,255,.5)' }} />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════════
          2a. ELECTORATE MAP — dedicated, interactive feature section
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px clamp(18px, 5vw, 36px)' }}>
          <Reveal>
            <div style={{ display: 'flex', gap: 44, alignItems: 'center', flexWrap: 'wrap' }}>

              {/* Copy + actions */}
              <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: JADE, fontFamily: 'var(--font-manrope), system-ui, sans-serif', marginBottom: 12 }}>
                  <Map style={{ width: 15, height: 15 }} /> The Electorate Map
                </div>
                <h2 style={{ fontSize: 'clamp(26px, 3.4vw, 38px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: 'var(--font-manrope), system-ui, sans-serif', lineHeight: 1.12, margin: '0 0 14px' }}>
                  Start where you live.
                </h2>
                <p style={{ fontSize: 16.5, fontWeight: 500, color: SECONDARY, fontFamily: 'var(--font-manrope), system-ui, sans-serif', lineHeight: 1.6, maxWidth: 460, margin: '0 0 22px' }}>
                  Every vote is cast in an electorate. Click your patch on the live map to see who
                  represents it, which party holds it, and how the 2023 race played out — then go deeper.
                </p>

                {/* Trust bullets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 26 }}>
                  {[
                    { icon: ShieldCheck, t: 'Official Stats NZ 2020 boundaries — never placeholder geometry' },
                    { icon: Users, t: 'All 72 electorates, coloured by the party that holds them' },
                    { icon: Scale, t: 'General and Māori electorate layers' },
                  ].map((b) => {
                    const Icon = b.icon
                    return (
                      <div key={b.t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 28, height: 28, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon style={{ width: 15, height: 15, color: JADE }} /></span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#33373f', fontFamily: 'var(--font-manrope), system-ui, sans-serif' }}>{b.t}</span>
                      </div>
                    )
                  })}
                </div>

                <div style={{ display: 'flex', gap: 11, flexWrap: 'wrap' }}>
                  <Link href="/map" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '12px 22px', borderRadius: 12, background: JADE, color: '#fff', fontSize: 14.5, fontWeight: 800, fontFamily: 'var(--font-manrope), system-ui, sans-serif', textDecoration: 'none' }}>
                    <Map style={{ width: 16, height: 16 }} /> Open the full map
                  </Link>
                  <Link href="/learn/electorate-vs-list" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '12px 22px', borderRadius: 12, background: '#fff', border: `1px solid ${BORDER}`, color: INK, fontSize: 14.5, fontWeight: 700, fontFamily: 'var(--font-manrope), system-ui, sans-serif', textDecoration: 'none' }}>
                    <Compass style={{ width: 16, height: 16, color: JADE }} /> Learn more
                  </Link>
                </div>
              </div>

              {/* Live interactive map */}
              <div style={{ flex: '1.4 1 420px', minWidth: 0, alignSelf: 'stretch', display: 'flex' }}>
                <div style={{ flex: 1 }}>
                  <HomeMapFeature />
                </div>
              </div>

            </div>
          </Reveal>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════════
          2b. PARLIAMENT SNAPSHOT — gated (Phase 2)
      ═══════════════════════════════════════════════════════════════════ */}
      {isEnabled('parliament') && <ParliamentSnapshot />}


      {/* ═══════════════════════════════════════════════════════════════════
          3. POLICY HUB — Prominent issue grid with party indicators
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px clamp(18px, 5vw, 36px)' }}>

          {/* Section header */}
          <div style={{
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'flex-end',
            marginBottom:   32,
            flexWrap:       'wrap',
            gap:            12,
          }}>
            <div>
              <div style={{
                fontSize:      12,
                fontWeight:    800,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                color:         JADE,
                fontFamily:    'var(--font-manrope), system-ui, sans-serif',
                marginBottom:  8,
              }}>
                Policy Comparison
              </div>
              <h2 style={{
                fontSize:     28,
                fontWeight:   800,
                letterSpacing:'-.01em',
                color:        INK,
                fontFamily:   'var(--font-manrope), system-ui, sans-serif',
                margin:       0,
              }}>
                Where do the parties stand?
              </h2>
              <p style={{
                fontSize:   15,
                fontWeight: 500,
                color:      SECONDARY,
                fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                marginTop:  8,
                marginBottom:0,
              }}>
                See every party&apos;s position on the issues that matter to New Zealanders.
                All sourced from official party documents.
              </p>
            </div>

            <Link
              href="/policies"
              style={{
                display:    'inline-flex',
                alignItems: 'center',
                gap:        5,
                fontSize:   13,
                fontWeight: 800,
                color:      INK,
                fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              All policy comparisons
              <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>

          {/* 10-topic grid */}
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap:                 14,
          }}>
            {POLICY_TOPIC_ORDER.map((key) => (
              <PolicyCard key={key} topicKey={key} />
            ))}
          </div>

          {/* Party dot legend */}
          <div style={{
            display:     'flex',
            flexWrap:    'wrap',
            gap:         '6px 16px',
            marginTop:   20,
            paddingTop:  16,
            borderTop:   `1px solid ${BORDER}`,
          }}>
            <span style={{
              fontSize: 11, fontWeight: 600, color: TERTIARY,
              fontFamily: 'var(--font-manrope), system-ui, sans-serif',
              alignSelf: 'center',
              marginRight: 4,
            }}>
              Party positions shown for:
            </span>
            {PARTY_DOT_ORDER.map((slug) => (
              <div
                key={slug}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 11, fontWeight: 600, color: SECONDARY,
                  fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                }}
              >
                <span style={{
                  width: 9, height: 9,
                  borderRadius: '50%',
                  background: PARTY_COLORS[slug].bg,
                  display: 'inline-block',
                  flexShrink: 0,
                }} />
                {slug === 'tpm' ? 'Te Pāti Māori'
                  : slug === 'nzfirst' ? 'NZ First'
                  : slug.charAt(0).toUpperCase() + slug.slice(1)}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════════
          4b. GET READY TO VOTE — election readiness strip
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px clamp(18px, 5vw, 36px)' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: 'var(--font-manrope), system-ui, sans-serif', margin: '0 0 6px' }}>Get ready to vote</h2>
          <p style={{ fontSize: 15, fontWeight: 500, color: SECONDARY, fontFamily: 'var(--font-manrope), system-ui, sans-serif', margin: '0 0 24px' }}>Three quick steps to feel confident heading into 2026.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {/* enrol — official */}
            <a href="https://vote.nz" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div className="party-card" style={{ height: '100%', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18, padding: '22px 22px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><Vote style={{ width: 20, height: 20, color: JADE }} /></div>
                <div style={{ fontSize: 16.5, fontWeight: 800, color: INK, fontFamily: 'var(--font-manrope), system-ui, sans-serif', marginBottom: 5 }}>1. Enrol or check your details</div>
                <p style={{ fontSize: 13.5, fontWeight: 500, color: SECONDARY, fontFamily: 'var(--font-manrope), system-ui, sans-serif', lineHeight: 1.55, margin: '0 0 14px' }}>Free, takes a couple of minutes — at vote.nz, the official Electoral Commission site.</p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: 'var(--font-manrope), system-ui, sans-serif' }}>Go to vote.nz <ArrowUpRight style={{ width: 14, height: 14 }} /></span>
              </div>
            </a>
            {/* learn how to vote */}
            <Link href="/learn/how-to-vote" style={{ textDecoration: 'none' }}>
              <div className="party-card" style={{ height: '100%', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18, padding: '22px 22px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><Compass style={{ width: 20, height: 20, color: JADE }} /></div>
                <div style={{ fontSize: 16.5, fontWeight: 800, color: INK, fontFamily: 'var(--font-manrope), system-ui, sans-serif', marginBottom: 5 }}>2. Learn how voting works</div>
                <p style={{ fontSize: 13.5, fontWeight: 500, color: SECONDARY, fontFamily: 'var(--font-manrope), system-ui, sans-serif', lineHeight: 1.55, margin: '0 0 14px' }}>MMP, your two votes, and how to actually cast them — in plain language.</p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: 'var(--font-manrope), system-ui, sans-serif' }}>Start learning <ArrowRight style={{ width: 14, height: 14 }} /></span>
              </div>
            </Link>
            {/* find what matters */}
            <Link href="/start" style={{ textDecoration: 'none' }}>
              <div className="party-card" style={{ height: '100%', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18, padding: '22px 22px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><Sparkles style={{ width: 20, height: 20, color: JADE }} /></div>
                <div style={{ fontSize: 16.5, fontWeight: 800, color: INK, fontFamily: 'var(--font-manrope), system-ui, sans-serif', marginBottom: 5 }}>3. Find what matters to you</div>
                <p style={{ fontSize: 13.5, fontWeight: 500, color: SECONDARY, fontFamily: 'var(--font-manrope), system-ui, sans-serif', lineHeight: 1.55, margin: '0 0 14px' }}>A 3-minute walkthrough that shows where the parties stand on your issues.</p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: 'var(--font-manrope), system-ui, sans-serif' }}>Take the walkthrough <ArrowRight style={{ width: 14, height: 14 }} /></span>
              </div>
            </Link>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════════
          5. NEWS + POLL — Two-column layout (Phase 2)
      ═══════════════════════════════════════════════════════════════════ */}
      {isEnabled('news') && (
      <section style={{ background: '#ffffff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px clamp(18px, 5vw, 36px)' }}>
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap:                 48,
            alignItems:          'start',
          }}>

            {/* ── Latest news ────────────────────────── */}
            <div>
              <div style={{
                display:        'flex',
                justifyContent: 'space-between',
                alignItems:     'center',
                marginBottom:   8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{
                    fontSize:     20,
                    fontWeight:   800,
                    color:        INK,
                    fontFamily:   'var(--font-manrope), system-ui, sans-serif',
                    margin:       0,
                  }}>
                    Follow the news
                  </h2>
                  <SectionDivider type="official" label="At the source" />
                </div>
                <Link
                  href="/news"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 12, fontWeight: 800, color: INK,
                    fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                    textDecoration: 'none',
                  }}
                >
                  All news <ArrowRight style={{ width: 13, height: 13 }} />
                </Link>
              </div>
              <p style={{
                fontSize: 12, color: TERTIARY,
                fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                marginBottom: 4, marginTop: 0,
              }}>
                A curated live feed is on the way. Until then — and always — we only ever surface real,
                sourced reporting, never invented headlines. Here&apos;s where to follow it directly.
              </p>

              {NEWS_SOURCES.map((item) => (
                <NewsSourceCard key={item.name} item={item} />
              ))}
            </div>

            {/* ── What matters to you? — survey invite (real, personalised) ── */}
            <div>
              <div style={{ marginBottom: 16 }}>
                <SectionDivider type="sentiment" label="Make it yours" />
                <h2 style={{
                  fontSize:     20,
                  fontWeight:   800,
                  color:        INK,
                  fontFamily:   'var(--font-manrope), system-ui, sans-serif',
                  margin:       '10px 0 4px',
                }}>
                  What matters most to you?
                </h2>
                <p style={{
                  fontSize:   12,
                  color:      TERTIARY,
                  fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                  margin:     0,
                }}>
                  Answer a few quick questions — we&apos;ll show you where parties stand on it.
                </p>
              </div>

              <div style={{
                background:   'linear-gradient(155deg,#0f9152,#0c0e12)',
                borderRadius: 20,
                padding:      '24px 22px',
                boxShadow:    '0 6px 24px rgba(12,14,18,.10)',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, marginBottom: 16,
                  background: 'rgba(255,255,255,.16)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles style={{ width: 22, height: 22, color: '#fff' }} />
                </div>
                <div style={{
                  fontSize: 17, fontWeight: 800, color: '#fff',
                  fontFamily: 'var(--font-manrope), system-ui, sans-serif', marginBottom: 8,
                }}>
                  Find your issues
                </div>
                <p style={{
                  fontSize: 13.5, fontWeight: 500, lineHeight: 1.55, margin: '0 0 18px',
                  color: 'rgba(255,255,255,.8)',
                  fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                }}>
                  Pick what you care about and how much you already know — and Aratika
                  will pitch everything at your level. No account needed.
                </p>
                <Link
                  href="/start"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '11px 0', borderRadius: 11, background: '#fff', color: '#0c0e12',
                    fontSize: 14, fontWeight: 800, textDecoration: 'none',
                    fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                  }}
                >
                  <Compass style={{ width: 16, height: 16 }} /> Start the walkthrough
                </Link>
              </div>

              <p style={{
                marginTop: 12, fontSize: 11, color: TERTIARY,
                fontFamily: 'var(--font-manrope), system-ui, sans-serif',
              }}>
                Community polls are coming soon — see <Link href="/polls" style={{ color: SECONDARY, fontWeight: 700 }}>polls</Link>.
              </p>
            </div>

          </div>
        </div>
      </section>
      )}


      {/* ═══════════════════════════════════════════════════════════════════
          6. PREMIUM CTA (Phase 2)
      ═══════════════════════════════════════════════════════════════════ */}
      {isEnabled('premium') && (
      <section style={{ background: '#0c0e12' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '72px clamp(18px, 5vw, 36px)' }}>

          <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 48px' }}>
            <div style={{
              display:      'inline-flex',
              alignItems:   'center',
              gap:          6,
              background:   'rgba(245,197,24,0.15)',
              color:        '#F5C518',
              borderRadius: 999,
              padding:      '5px 12px',
              fontSize:     12,
              fontWeight:   700,
              fontFamily:   'var(--font-manrope), system-ui, sans-serif',
              marginBottom: 16,
            }}>
              <Crown style={{ width: 13, height: 13 }} />
              Premium
            </div>
            <h2 style={{
              fontSize:     28,
              fontWeight:   800,
              letterSpacing:'-.01em',
              color:        '#ffffff',
              fontFamily:   'var(--font-manrope), system-ui, sans-serif',
              marginBottom: 12,
            }}>
              Go deeper with Premium
            </h2>
            <p style={{
              fontSize:   15,
              fontWeight: 500,
              color:      '#6b7078',
              fontFamily: 'var(--font-manrope), system-ui, sans-serif',
              lineHeight: 1.6,
            }}>
              Everything in free, plus detailed voting records, live dashboard
              tracking, and alerts — so you never miss what your MP does next.
            </p>
          </div>

          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
            gap:                 16,
            maxWidth:            640,
            margin:              '0 auto',
          }}>

            {/* Free */}
            <div style={{
              background:   'rgba(255,255,255,0.04)',
              border:       '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding:      '24px 22px',
            }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: '#6b7078',
                fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                marginBottom: 6,
              }}>Free</div>
              <div style={{
                fontSize: 32, fontWeight: 700, color: '#ffffff',
                fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
                marginBottom: 20,
              }}>$0</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['All MP profiles', 'Party overviews', 'Policy comparisons', 'Interactive map', 'Bills tracker', 'News feed', 'Public polls'].map((f) => (
                  <li key={f} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 13, fontWeight: 500, color: '#9aa0aa',
                    fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                  }}>
                    <span style={{ color: JADE, fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                style={{
                  display:      'block',
                  textAlign:    'center',
                  padding:      '11px 0',
                  borderRadius: 10,
                  border:       '1px solid rgba(255,255,255,0.12)',
                  color:        '#ffffff',
                  fontSize:     14,
                  fontWeight:   700,
                  fontFamily:   'var(--font-manrope), system-ui, sans-serif',
                  textDecoration:'none',
                }}
              >
                Sign up free
              </Link>
            </div>

            {/* Premium */}
            <div style={{
              background:   'linear-gradient(145deg, rgba(245,197,24,0.12), rgba(245,197,24,0.04))',
              border:       '1px solid rgba(245,197,24,0.25)',
              borderRadius: 20,
              padding:      '24px 22px',
              position:     'relative',
            }}>
              <div style={{
                position:  'absolute',
                top:       -13,
                left:      '50%',
                transform: 'translateX(-50%)',
                background: '#F5C518',
                color:      '#1c1605',
                fontSize:   11,
                fontWeight: 800,
                fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                borderRadius: 999,
                padding:    '4px 12px',
                whiteSpace: 'nowrap',
              }}>
                14-day free trial
              </div>
              <div style={{
                fontSize: 12, fontWeight: 700, color: '#F5C518',
                fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                marginBottom: 6,
              }}>Premium</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{
                  fontSize: 32, fontWeight: 700, color: '#ffffff',
                  fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
                }}>$20</span>
                <span style={{
                  fontSize: 13, color: '#6b7078',
                  fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                }}>/month</span>
              </div>
              <div style={{
                fontSize: 11, color: '#6b7078',
                fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                marginBottom: 20,
              }}>
                or $200/year — save $40
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'Everything in Free',
                  'Detailed voting records',
                  'Bookmark MPs & bills',
                  'Live personal dashboard',
                  'Alerts & notifications',
                  'Advanced comparisons',
                  'Data export (PDF/CSV)',
                ].map((f) => (
                  <li key={f} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 13, fontWeight: 500, color: '#9aa0aa',
                    fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                  }}>
                    <span style={{ color: '#F5C518', fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register?plan=premium"
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent:'center',
                  gap:          6,
                  padding:      '11px 0',
                  borderRadius: 10,
                  background:   '#F5C518',
                  color:        '#1c1605',
                  fontSize:     14,
                  fontWeight:   800,
                  fontFamily:   'var(--font-manrope), system-ui, sans-serif',
                  textDecoration:'none',
                }}
              >
                <Crown style={{ width: 15, height: 15 }} />
                Start free trial
              </Link>
            </div>

          </div>
        </div>
      </section>
      )}

    </>
  )
}
