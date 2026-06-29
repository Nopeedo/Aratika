/**
 * /record — PRIVATE accountability hub ("view all this data" in one place).
 * Login-gated + noindex; not linked in nav. At-a-glance scorecard, a raw
 * economic data table, and a link through to the full National record.
 * Built to hold more parties later.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShieldAlert, ArrowRight, Target, FileText, TrendingUp, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { GOVERNMENT, PROMISES, BILLS, promiseTally } from '@/constants/record-national'
import { ECONOMIC_DATA } from '@/constants/economic-data'

export const metadata: Metadata = {
  title: 'Accountability data (private)',
  robots: { index: false, follow: false },
}

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const DISPLAY = 'var(--font-space-grotesk), system-ui, sans-serif'

export default async function RecordHubPage() {
  const supabase = await createClient()
  let user = null
  try { const { data } = await supabase.auth.getUser(); user = data.user } catch { /* stale cookie */ }
  if (!user) redirect('/login?next=/record')

  const tally = promiseTally()
  const deliveredPct = Math.round((tally.delivered / tally.total) * 100)
  const enacted = BILLS.filter((b) => b.status === 'enacted').length

  // Union of all years across the economic series, for the data table.
  const years = Array.from(new Set(ECONOMIC_DATA.series.flatMap((s) => s.points.map((p) => p.year)))).sort((a, b) => a - b)
  const valueAt = (sid: string, year: number) => {
    const s = ECONOMIC_DATA.series.find((x) => x.id === sid)
    const p = s?.points.find((pt) => pt.year === year)
    return p ? p.value.toFixed(1) : '—'
  }

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#0c0e12', color: '#fff' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '38px 36px 30px' }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#36e08a', fontFamily: MANROPE, marginBottom: 10 }}>
            Accountability data · Private
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-.02em', fontFamily: MANROPE, margin: '0 0 8px', lineHeight: 1.1 }}>
            All your accountability data
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.7)', fontFamily: MANROPE, lineHeight: 1.6, margin: 0, maxWidth: 620 }}>
            One place to review the record of the {GOVERNMENT.parliament}. Compiled from the public record with sources; figures verifiable at each link.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 36px 72px' }}>
        {/* Caveat */}
        <div style={{ display: 'flex', gap: 12, padding: '14px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, marginBottom: 28 }}>
          <ShieldAlert style={{ width: 18, height: 18, color: '#1e40af', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12.5, color: '#1e3a8a', fontFamily: MANROPE, margin: 0, lineHeight: 1.6 }}>
            <b>Private view.</b> Statuses assessed to a January 2026 knowledge cutoff. Economic figures are official annual
            data (World Bank, compiling IMF/ILO/national sources) — context only, never attributed to a single policy.
          </p>
        </div>

        {/* National card */}
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 18, overflow: 'hidden', marginBottom: 30 }}>
          <div style={{ height: 5, background: '#00529F' }} />
          <div style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE }}>The {GOVERNMENT.party}-led Government</div>
                <div style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, marginTop: 2 }}>{GOVERNMENT.party} · {GOVERNMENT.partners.join(' & ')} · formed {GOVERNMENT.formed}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link href="/record/national" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: JADE, color: '#fff', fontSize: 13.5, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  View full record <ArrowRight style={{ width: 15, height: 15 }} />
                </Link>
                <Link href="/record/analysis" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: '#fff', border: `1px solid ${BORDER}`, color: INK, fontSize: 13.5, fontWeight: 700, fontFamily: MANROPE, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  Policy deep dives <ArrowRight style={{ width: 15, height: 15 }} />
                </Link>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 18 }}>
              <Stat icon={Target} value={`${deliveredPct}%`} label="of commitments delivered" />
              <Stat value={tally.total} label="commitments tracked" />
              <Stat value={`${tally.delivered}/${tally.in_progress}/${tally.changed}`} label="delivered / underway / changed" />
              <Stat icon={FileText} value={enacted} label="key Acts enacted" />
            </div>
          </div>
        </div>

        {/* Economic data table */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
          <TrendingUp style={{ width: 19, height: 19, color: JADE }} />
          <h2 style={{ fontSize: 20, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>Economic data</h2>
        </div>
        <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 14px' }}>
          Annual official series. Retrieved {ECONOMIC_DATA.generatedAt} — CPI from OECD (sourced from Stats NZ); GDP, unemployment &amp; debt from World Bank Open Data.
        </p>

        <div style={{ overflowX: 'auto', border: `1px solid ${BORDER}`, borderRadius: 14 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 560, fontFamily: MANROPE }}>
            <thead>
              <tr style={{ background: SURFACE }}>
                <th style={thLeft}>Indicator</th>
                {years.map((y) => <th key={y} style={th}>{y}</th>)}
                <th style={th}>Source</th>
              </tr>
            </thead>
            <tbody>
              {ECONOMIC_DATA.series.map((s) => (
                <tr key={s.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td style={tdLeft}>
                    <div style={{ fontWeight: 800, color: INK, fontSize: 13.5 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: TERTIARY }}>{s.unit}</div>
                  </td>
                  {years.map((y) => {
                    const v = valueAt(s.id, y)
                    return <td key={y} style={{ ...td, color: v === '—' ? '#cbd0d6' : INK, fontWeight: v === '—' ? 400 : 700, fontFamily: DISPLAY }}>{v}</td>
                  })}
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    <a href={s.primaryUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, color: JADE, textDecoration: 'none' }}>
                      {s.primaryLabel.split(' — ')[0]} <ExternalLink style={{ width: 11, height: 11 }} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 12, lineHeight: 1.5 }}>
          “—” = year not in the source range (annual figures can lag ~a year). The Official Cash Rate isn’t in this feed —
          see the full record for the live RBNZ link. Charts and the full breakdown are on the{' '}
          <Link href="/record/national" style={{ color: JADE, fontWeight: 700 }}>National record</Link>.
        </p>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, value, label }: { icon?: React.ElementType; value: string | number; label: string }) {
  return (
    <div style={{ flex: '1 1 150px', minWidth: 140, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '13px 15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {Icon && <Icon style={{ width: 15, height: 15, color: JADE }} />}
        <span style={{ fontSize: 24, fontWeight: 800, color: INK, fontFamily: DISPLAY, lineHeight: 1 }}>{value}</span>
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: TERTIARY, fontFamily: MANROPE, marginTop: 6 }}>{label}</div>
    </div>
  )
}

const th: React.CSSProperties = { padding: '10px 12px', fontSize: 12, fontWeight: 800, color: SECONDARY, textAlign: 'center', whiteSpace: 'nowrap' }
const thLeft: React.CSSProperties = { ...th, textAlign: 'left' }
const td: React.CSSProperties = { padding: '11px 12px', fontSize: 13.5, color: INK, textAlign: 'center' }
const tdLeft: React.CSSProperties = { ...td, textAlign: 'left' }
