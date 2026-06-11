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
  Map, Users, ShieldCheck, Crown, ArrowRight, ChevronRight, ExternalLink,
} from 'lucide-react'
import { SectionDivider }      from '@/components/ui/section-divider'
import { ParliamentSnapshot }  from '@/components/parliament/parliament-snapshot'
import { ElectionCountdown }   from '@/components/homepage/election-countdown'
import { MPFinderSearch }      from '@/components/homepage/mp-finder-search'
import { PolicyCard }          from '@/components/homepage/policy-card'
import { SITE }                from '@/constants/site'
import { PARTY_COLORS }        from '@/constants/parties'
import { POLICY_TOPIC_ORDER }  from '@/constants/policy-topics'

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

// ─── Mock news (placeholder until RSS integration in Week 2) ──────────────────

const MOCK_NEWS = [
  {
    id: '1',
    title: 'Parliament sits for final session before winter recess',
    source: 'RNZ',
    publishedAt: '2026-06-04',
    url: 'https://www.rnz.co.nz',
    category: 'Parliament',
  },
  {
    id: '2',
    title: 'Fast-track consenting bill passes third reading',
    source: 'Beehive',
    publishedAt: '2026-06-03',
    url: 'https://www.beehive.govt.nz',
    category: 'Legislation',
  },
  {
    id: '3',
    title: 'Labour outlines economic alternative ahead of 2026 election',
    source: 'RNZ',
    publishedAt: '2026-06-03',
    url: 'https://www.rnz.co.nz',
    category: 'Election 2026',
  },
]

// ─── Stat tiles data ──────────────────────────────────────────────────────────

const STATS = [
  { value: '123',   label: 'MPs tracked',    sublabel: '54th Parliament' },
  { value: '6',     label: 'Parties',         sublabel: 'All represented' },
  { value: '47+',   label: 'Bills tracked',   sublabel: 'Currently before House' },
  { value: '2026',  label: 'General Election',sublabel: '~Oct 2026' },
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

// News item card
function NewsCard({ item }: { item: typeof MOCK_NEWS[number] }) {
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
      <div style={{
        padding:      '14px 0',
        borderBottom: `1px solid ${BORDER}`,
        display:      'flex',
        flexDirection:'column',
        gap:          6,
        cursor:       'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize:   10.5,
            fontWeight: 800,
            color:      JADE,
            fontFamily: 'var(--font-manrope), system-ui, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '.06em',
          }}>
            {item.source}
          </span>
          <span style={{ color: BORDER, fontSize: 10 }}>·</span>
          <span style={{
            fontSize:   11,
            fontWeight: 500,
            color:      TERTIARY,
            fontFamily: 'var(--font-manrope), system-ui, sans-serif',
          }}>
            {new Date(item.publishedAt).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
          </span>
          <span style={{
            marginLeft:  'auto',
            fontSize:    10.5,
            fontWeight:  700,
            color:       TERTIARY,
            background:  SURFACE,
            border:      `1px solid ${BORDER}`,
            borderRadius:999,
            padding:     '2px 8px',
            fontFamily:  'var(--font-manrope), system-ui, sans-serif',
          }}>
            {item.category}
          </span>
        </div>
        <p style={{
          fontSize:   14,
          fontWeight: 600,
          color:      INK,
          fontFamily: 'var(--font-manrope), system-ui, sans-serif',
          lineHeight: 1.4,
          margin:     0,
        }}>
          {item.title}
        </p>
        <div style={{
          fontSize:   11,
          fontWeight: 700,
          color:      JADE,
          fontFamily: 'var(--font-manrope), system-ui, sans-serif',
          display:    'flex',
          alignItems: 'center',
          gap:        3,
        }}>
          Read at {item.source}
          <ExternalLink style={{ width: 10, height: 10 }} />
        </div>
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
      <section
        className="bg-dot-grid"
        style={{ background: '#ffffff', borderBottom: `1px solid ${BORDER}` }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '72px 36px 80px' }}>

          {/* Election countdown pill */}
          <div
            className="live-dot"
            style={{
              display:      'inline-flex',
              alignItems:   'center',
              gap:          8,
              background:   '#0c0e12',
              color:        '#ffffff',
              borderRadius: 999,
              padding:      '7px 14px 7px 12px',
              fontSize:     12,
              fontWeight:   700,
              fontFamily:   'var(--font-manrope), system-ui, sans-serif',
              marginBottom: 28,
            }}
          >
            <span
              className="live-dot"
              style={{
                width: 7, height: 7,
                borderRadius: '50%',
                background: '#36e08a',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <ElectionCountdown />
          </div>

          {/* Main headline */}
          <h1 style={{
            fontSize:      'clamp(36px, 5vw, 58px)',
            fontWeight:    800,
            letterSpacing: '-.025em',
            lineHeight:    1.08,
            color:         INK,
            fontFamily:    'var(--font-manrope), system-ui, sans-serif',
            maxWidth:      680,
            marginBottom:  18,
          }}>
            Know exactly who you&apos;re
            <br />
            <span style={{ color: JADE }}>voting for</span> — and why.
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize:     18,
            fontWeight:   500,
            color:        SECONDARY,
            fontFamily:   'var(--font-manrope), system-ui, sans-serif',
            lineHeight:   1.6,
            maxWidth:     520,
            marginBottom: 36,
          }}>
            Aratika is New Zealand&apos;s non-partisan guide to every MP, party,
            bill, and policy — sourced exclusively from official data.
          </p>

          {/* MP Finder Search */}
          <MPFinderSearch />

          {/* Stat tiles */}
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap:                 12,
            maxWidth:            560,
            marginTop:           32,
          }}>
            {STATS.map((s) => (
              <StatTile key={s.label} {...s} />
            ))}
          </div>

          {/* Trust indicators */}
          <div style={{
            display:     'flex',
            flexWrap:    'wrap',
            gap:         '8px 20px',
            marginTop:   28,
            paddingTop:  24,
            borderTop:   `1px solid ${BORDER}`,
          }}>
            {[
              'NZ Parliament API',
              'Electoral Commission',
              'Stats NZ',
              'Non-partisan & independent',
            ].map((label) => (
              <div
                key={label}
                style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        6,
                  fontSize:   12,
                  fontWeight: 500,
                  color:      TERTIARY,
                  fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                }}
              >
                <ShieldCheck style={{ width: 13, height: 13, color: JADE, flexShrink: 0 }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════════
          2. PARLIAMENT SNAPSHOT — Chamber hemicycle (unchanged)
      ═══════════════════════════════════════════════════════════════════ */}
      <ParliamentSnapshot />


      {/* ═══════════════════════════════════════════════════════════════════
          3. POLICY HUB — Prominent issue grid with party indicators
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 36px' }}>

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
          4. MAP — Condensed CTA banner (full section moved to /map page)
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#ffffff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 36px' }}>
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            gap:            20,
            padding:        '28px 32px',
            background:     '#0c0e12',
            borderRadius:   20,
            margin:         '40px 0',
            flexWrap:       'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 44, height: 44,
                borderRadius: 12,
                background: 'rgba(31,138,76,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Map style={{ width: 22, height: 22, color: '#36e08a' }} />
              </div>
              <div>
                <div style={{
                  fontSize: 15, fontWeight: 800, color: '#ffffff',
                  fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                }}>
                  Explore the interactive electorate map
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 500, color: '#6b7078',
                  fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                  marginTop: 2,
                }}>
                  Click any part of New Zealand to see who represents that area, their party,
                  and what they stand for.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <Link
                href="/map"
                style={{
                  display:      'inline-flex',
                  alignItems:   'center',
                  gap:          6,
                  padding:      '10px 20px',
                  borderRadius: 10,
                  background:   '#1F8A4C',
                  color:        '#ffffff',
                  fontSize:     14,
                  fontWeight:   700,
                  fontFamily:   'var(--font-manrope), system-ui, sans-serif',
                  textDecoration:'none',
                  whiteSpace:   'nowrap',
                }}
              >
                <Map style={{ width: 16, height: 16 }} />
                Open Map
              </Link>
              <Link
                href="/mps"
                style={{
                  display:      'inline-flex',
                  alignItems:   'center',
                  gap:          6,
                  padding:      '10px 20px',
                  borderRadius: 10,
                  background:   'rgba(255,255,255,0.07)',
                  border:       '1px solid rgba(255,255,255,0.12)',
                  color:        '#ffffff',
                  fontSize:     14,
                  fontWeight:   700,
                  fontFamily:   'var(--font-manrope), system-ui, sans-serif',
                  textDecoration:'none',
                  whiteSpace:   'nowrap',
                }}
              >
                Browse all MPs
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════════
          5. NEWS + POLL — Two-column layout
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#ffffff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 36px' }}>
          <div style={{
            display:             'grid',
            gridTemplateColumns: '1.6fr 1fr',
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
                    Latest News
                  </h2>
                  <SectionDivider type="official" label="Verified Sources" />
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
                Sourced from RNZ and official government channels via RSS.
                Aratika does not publish original news content.
              </p>

              {MOCK_NEWS.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>

            {/* ── Public sentiment poll ──────────────── */}
            <div>
              <div style={{ marginBottom: 16 }}>
                <SectionDivider type="sentiment" label="Public Sentiment" />
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
                  Non-scientific user poll — not representative of NZ population.
                </p>
              </div>

              <div style={{
                background:   '#ffffff',
                border:       `1px solid ${BORDER}`,
                borderRadius: 20,
                padding:      '22px 20px',
                boxShadow:    '0 2px 4px rgba(12,14,18,.03)',
              }}>
                {([
                  ['Housing affordability', 72],
                  ['Cost of living',        58],
                  ['Health system',         45],
                  ['Climate action',        38],
                  ['Law and order',         29],
                ] as [string, number][]).map(([option, pct]) => (
                  <div key={option} style={{ marginBottom: 14 }}>
                    <div style={{
                      display:        'flex',
                      justifyContent: 'space-between',
                      marginBottom:   5,
                    }}>
                      <span style={{
                        fontSize: 13, fontWeight: 700, color: INK,
                        fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                      }}>
                        {option}
                      </span>
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: JADE,
                        fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
                      }}>
                        {pct}%
                      </span>
                    </div>
                    <div style={{
                      height: 7, borderRadius: 999,
                      background: '#f1efeb', overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        background: JADE, borderRadius: 999,
                      }} />
                    </div>
                  </div>
                ))}

                <div style={{
                  paddingTop: 16,
                  marginTop:  4,
                  borderTop:  `1px solid ${BORDER}`,
                  fontSize:   11,
                  color:      TERTIARY,
                  fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                }}>
                  1,247 votes · Sign up to cast your vote
                </div>
              </div>

              <Link
                href="/polls"
                style={{
                  display:    'inline-flex',
                  alignItems: 'center',
                  gap:        4,
                  marginTop:  12,
                  fontSize:   12,
                  fontWeight: 800,
                  color:      INK,
                  fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                  textDecoration: 'none',
                }}
              >
                View all polls <ChevronRight style={{ width: 13, height: 13 }} />
              </Link>
            </div>

          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════════
          6. PREMIUM CTA
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#0c0e12' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '72px 36px' }}>

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
            gridTemplateColumns: '1fr 1fr',
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

    </>
  )
}
