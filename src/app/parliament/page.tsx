/**
 * /parliament — the full current-Parliament overview.
 * Leads with the seat-distribution snapshot, then the Government (Cabinet),
 * the Opposition, and key parliamentary roles — all derived from MP data.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Crown, Users, Gavel, Landmark, Vote } from 'lucide-react'
import { ParliamentSnapshot } from '@/components/parliament/parliament-snapshot'
import { MP_PROFILES } from '@/constants/mps-data'
import { PARTY_PROFILES } from '@/constants/parties-data'
import { PARTY_NAMES, PARTY_COLORS, PARTY_ORDER } from '@/constants/parties'
import { PartySlug } from '@/types'
import { SectionDivider } from '@/components/ui/section-divider'

export const metadata: Metadata = {
  title: 'Parliament — Current Overview',
  description:
    'The 54th New Zealand Parliament: seat distribution, the governing coalition and Cabinet, the Opposition, and key roles.',
}

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const COALITION: PartySlug[] = ['national', 'act', 'nzfirst']
const OPPOSITION: PartySlug[] = ['labour', 'green', 'tpm']

const mps = Object.values(MP_PROFILES)
// Ministers come only from the governing coalition, with a ministerial title/portfolio.
const isMinister = (p: typeof mps[number]) =>
  p.status === 'active' && COALITION.includes(p.party) &&
  (/minister/i.test(p.title || '') || (p.portfolios || []).some((x) => /minister/i.test(x)))

const ministers = mps.filter(isMinister).sort((a, b) => {
  const pm = (x: typeof a) => (x.title === 'Prime Minister' ? 0 : 1)
  if (pm(a) !== pm(b)) return pm(a) - pm(b)
  const po = (x: typeof a) => PARTY_ORDER.indexOf(x.party)
  if (po(a) !== po(b)) return po(a) - po(b)
  return a.name.localeCompare(b.name)
})

const roleByTitle = (title: string) => mps.find((p) => p.status === 'active' && p.title === title)
const KEY_ROLES = [
  { role: 'Prime Minister', mp: roleByTitle('Prime Minister'), icon: Crown },
  { role: 'Leader of the Opposition', mp: roleByTitle('Leader of the Opposition'), icon: Users },
  { role: 'Speaker of the House', mp: roleByTitle('Speaker'), icon: Gavel },
  { role: 'Leader of the House', mp: roleByTitle('Leader of the House'), icon: Landmark },
].filter((r) => r.mp)

export default function ParliamentPage() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 36px 8px' }}>
          <div style={{ marginBottom: 8 }}><SectionDivider type="official" label="Current Parliament" /></div>
          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 8px' }}>The 54th Parliament</h1>
          <p style={{ fontSize: 17, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, maxWidth: 640, lineHeight: 1.6, margin: 0 }}>
            Who holds power, who opposes it, and how it’s arranged — the make-up of New Zealand’s House of Representatives since the 2023 election.
          </p>
        </div>
      </div>

      {/* Seat distribution snapshot (reused) */}
      <ParliamentSnapshot />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '8px 36px 64px', display: 'flex', flexDirection: 'column', gap: 34 }}>

        {/* How the government formed */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '16px 18px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14 }}>
          <Vote style={{ width: 18, height: 18, color: JADE, flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>
            After the <Link href="/elections/2023" style={lnk}>2023 General Election</Link>, National formed a coalition with ACT and New Zealand First, holding <b>68 of 123 seats</b> (a majority needs 62). See where the next contest will be decided on the <Link href="/battlegrounds" style={lnk}>Battlegrounds map</Link>.
          </p>
        </div>

        {/* The Government — Cabinet */}
        <section>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>The Government</h2>
          <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 16px' }}>
            The Prime Minister and ministers who run the country — {ministers.length} ministers across the coalition.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
            {ministers.map((m) => (
              <Link key={m.slug} href={`/mps/${m.slug}`} style={{ textDecoration: 'none' }}>
                <div className="party-card" style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#fff', border: `1px solid ${BORDER}`, borderLeft: `4px solid ${PARTY_COLORS[m.party].bg}`, borderRadius: 12, padding: '12px 14px', height: '100%' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title || PARTY_NAMES[m.party].short}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* The Opposition */}
        <section>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>The Opposition</h2>
          <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 16px' }}>The parties holding the Government to account.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {OPPOSITION.map((p) => {
              const party = PARTY_PROFILES[p]
              return (
                <Link key={p} href={`/parties/${p}`} style={{ textDecoration: 'none' }}>
                  <div className="party-card" style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden', height: '100%' }}>
                    <div style={{ height: 4, background: party.color }} />
                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{party.name}</span>
                        <span style={{ fontSize: 22, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{party.seats}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, marginTop: 2 }}>{party.leader} · {party.leaderTitle}</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Key roles */}
        {KEY_ROLES.length > 0 && (
          <section>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 16px' }}>Key roles</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
              {KEY_ROLES.map(({ role, mp, icon: Icon }) => (
                <Link key={role} href={`/mps/${mp!.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="party-card" style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px', height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                      <Icon style={{ width: 15, height: 15, color: JADE }} />
                      <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>{role}</span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{mp!.name}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, marginTop: 2 }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: PARTY_COLORS[mp!.party].bg }} />{PARTY_NAMES[mp!.party].short}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Explore */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', borderTop: `1px solid ${BORDER}`, paddingTop: 22 }}>
          <Link href="/mps" style={pill(true)}><Users style={ic} /> All 123 MPs</Link>
          <Link href="/parties" style={pill(false)}>Parties <ArrowRight style={ic} /></Link>
          <Link href="/bills" style={pill(false)}>Bills before the House <ArrowRight style={ic} /></Link>
          <Link href="/map" style={pill(false)}>Find your electorate <ArrowRight style={ic} /></Link>
        </div>
        <p style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowUpRight style={{ width: 12, height: 12 }} /> Seat counts and roles reflect the current 54th Parliament. Source: New Zealand Parliament &amp; Electoral Commission.
        </p>
      </div>
    </div>
  )
}

const ic: React.CSSProperties = { width: 15, height: 15 }
const lnk: React.CSSProperties = { color: JADE, fontWeight: 700, textDecoration: 'none' }
function pill(primary: boolean): React.CSSProperties {
  return { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, fontFamily: MANROPE, padding: '9px 15px', borderRadius: 11, textDecoration: 'none', background: primary ? JADE : '#fff', color: primary ? '#fff' : INK, border: primary ? 'none' : `1px solid ${BORDER}` }
}
