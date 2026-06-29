/**
 * /record/national — PRIVATE accountability view (personal research tool).
 *
 * Login-gated and noindex; not linked anywhere in the site. Compiled from the
 * public record to a Jan 2026 knowledge cutoff, with a source on every item and
 * verify flags. Economic indicators are context only (no causation). See
 * src/constants/record-national.ts for the data + credibility notes.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ShieldAlert, CheckCircle2, Clock, RefreshCw, XCircle, ArrowUpRight,
  TrendingUp, Activity, FileText, Target, ExternalLink, Wallet, Banknote,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import {
  GOVERNMENT, PROMISES, BILLS, PRIORITIES, promiseTally,
  type PromiseStatus,
} from '@/constants/record-national'
import { BUDGET_LINKS, FUND_RELATION, FUNDED_PROMISE_IDS, BUDGET_BASELINE } from '@/constants/budget-links'
import { BUDGET_META } from '@/constants/budget-2026'
import { ECONOMIC_DATA, type EconSeries } from '@/constants/economic-data'
import { IndicatorChart } from '@/components/record/indicator-chart'

export const metadata: Metadata = {
  title: 'National — Accountability Record (private)',
  robots: { index: false, follow: false },
}

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const DISPLAY = 'var(--font-space-grotesk), system-ui, sans-serif'

const STATUS: Record<PromiseStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  delivered:   { label: 'Delivered',   color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0', icon: CheckCircle2 },
  in_progress: { label: 'In progress', color: '#92400e', bg: '#fff9e6', border: '#fde68a', icon: Clock },
  changed:     { label: 'Changed / dropped', color: '#3730a3', bg: '#eef2ff', border: '#c7d2fe', icon: RefreshCw },
  not_done:    { label: 'Not done',    color: '#991b1b', bg: '#fef2f2', border: '#fecaca', icon: XCircle },
}

export default async function NationalRecordPage() {
  // Private — require a signed-in user.
  const supabase = await createClient()
  let user = null
  try { const { data } = await supabase.auth.getUser(); user = data.user } catch { /* stale cookie → treat as logged out */ }
  if (!user) redirect('/login?next=/record/national')

  const tally = promiseTally()
  const deliveredPct = Math.round((tally.delivered / tally.total) * 100)

  // Group promises by category, preserving order of first appearance.
  const categories: string[] = []
  for (const p of PROMISES) if (!categories.includes(p.category)) categories.push(p.category)

  // Lookup for linking Budget 2026 lines back to the commitment they fund.
  const promiseById = new Map(PROMISES.map((p) => [p.id, p]))

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#0c0e12', color: '#fff' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 36px 34px' }}>
          <Link href="/record" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.6)', fontFamily: MANROPE, textDecoration: 'none', marginBottom: 14 }}>
            ← All accountability data
          </Link>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#36e08a', fontFamily: MANROPE, marginBottom: 10 }}>
            Accountability Record · Private
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-.02em', fontFamily: MANROPE, margin: '0 0 10px', lineHeight: 1.1 }}>
            The {GOVERNMENT.party}-led Government
          </h1>
          <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,.72)', fontFamily: MANROPE, lineHeight: 1.6, margin: 0, maxWidth: 640 }}>
            {GOVERNMENT.parliament} · formed {GOVERNMENT.formed} · {GOVERNMENT.party} with {GOVERNMENT.partners.join(' & ')} · PM {GOVERNMENT.pm}.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 36px 72px' }}>

        {/* Credibility caveat */}
        <div style={{ display: 'flex', gap: 12, padding: '15px 17px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, marginBottom: 30 }}>
          <ShieldAlert style={{ width: 18, height: 18, color: '#1e40af', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12.5, color: '#1e3a8a', fontFamily: MANROPE, margin: 0, lineHeight: 1.6 }}>
            <b>Personal research view.</b> Compiled from the public record — the coalition agreements, the government’s
            100-day plan, and enacted Acts — with a source on each item. Statuses are assessed to a <b>January 2026</b>{' '}
            knowledge cutoff; confirm anything dated later against the linked source. Economic indicators are shown as{' '}
            <b>context only</b> — they reflect global and domestic factors and are not attributed to any single policy.
          </p>
        </div>

        {/* ── Scorecard ── */}
        <SectionTitle icon={Target} title="Promise scorecard" sub={`${tally.total} key commitments tracked`} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <ScoreTile big value={`${deliveredPct}%`} label="Delivered" color={JADE} />
          <ScoreTile value={tally.delivered} label="Delivered" color="#065f46" />
          <ScoreTile value={tally.in_progress} label="In progress" color="#92400e" />
          <ScoreTile value={tally.changed} label="Changed / dropped" color="#3730a3" />
          <ScoreTile value={tally.not_done} label="Not done" color="#991b1b" />
        </div>
        {/* Stacked bar */}
        <div style={{ display: 'flex', height: 12, borderRadius: 999, overflow: 'hidden', marginBottom: 30, border: `1px solid ${BORDER}` }}>
          {(['delivered', 'in_progress', 'changed', 'not_done'] as PromiseStatus[]).map((s) => {
            const n = tally[s]; if (!n) return null
            return <div key={s} title={`${STATUS[s].label}: ${n}`} style={{ width: `${(n / tally.total) * 100}%`, background: STATUS[s].border }} />
          })}
        </div>

        {/* Deep-dive cross-link */}
        <Link href="/record/analysis" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderRadius: 12, border: `1px solid ${BORDER}`, background: SURFACE, textDecoration: 'none', marginBottom: 26 }}>
          <Target style={{ width: 17, height: 17, color: JADE, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: INK, fontFamily: MANROPE }}>
            Flagship policy deep dives — arguments for &amp; against, who’s most affected, official analysis
          </span>
          <ArrowUpRight style={{ width: 16, height: 16, color: TERTIARY }} />
        </Link>

        {/* Promises by category */}
        {categories.map((cat) => (
          <div key={cat} style={{ marginBottom: 22 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.02em', color: TERTIARY, textTransform: 'uppercase', fontFamily: MANROPE, margin: '0 0 10px' }}>{cat}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PROMISES.filter((p) => p.category === cat).map((p) => {
                const st = STATUS[p.status]; const Icon = st.icon
                return (
                  <div key={p.id} style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <p style={{ flex: 1, minWidth: 240, fontSize: 14.5, fontWeight: 700, color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.45 }}>“{p.text}”</p>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: st.color, background: st.bg, border: `1px solid ${st.border}`, borderRadius: 999, padding: '5px 11px', fontFamily: MANROPE, whiteSpace: 'nowrap' }}>
                        <Icon style={{ width: 13, height: 13 }} /> {st.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55, margin: '8px 0 0' }}>{p.evidence}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 9 }}>
                      {FUNDED_PROMISE_IDS.has(p.id) && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 800, color: '#1e40af', background: '#eef4ff', border: '1px solid #bfdbfe', borderRadius: 999, padding: '3px 9px', fontFamily: MANROPE }}>
                          <Banknote style={{ width: 12, height: 12 }} /> Funded in Budget 2026
                        </span>
                      )}
                      {p.source && (
                        <a href={p.source.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
                          {p.source.label} <ExternalLink style={{ width: 12, height: 12 }} />
                        </a>
                      )}
                      {p.asOf && <span style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE }}>· {p.asOf}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* ── Budget 2026: funding the agenda ── */}
        <div style={{ marginTop: 38 }}>
          <SectionTitle icon={Wallet} title="Budget 2026 — funding the agenda" sub="Where the latest Budget puts money behind the commitments — and what’s new" />

          {/* What this is / isn't */}
          <div style={{ display: 'flex', gap: 10, padding: '13px 15px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, marginBottom: 14 }}>
            <ShieldAlert style={{ width: 16, height: 16, color: '#1e40af', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12.5, color: '#1e3a8a', fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
              A factual cross-reference, <b>not a verdict</b>. A Budget allocation shows money has been committed to an
              area — it doesn’t prove an outcome was achieved. Promise statuses above are unchanged. Figures from{' '}
              {BUDGET_META.sourceLabel}, {BUDGET_META.title} ({BUDGET_META.deliveredOn}).
            </p>
          </div>

          {/* What's already in place (baseline) */}
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 16px', marginBottom: 16, background: SURFACE }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 7 }}>What’s already in place (for context)</div>
            <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {BUDGET_BASELINE.points.map((pt, i) => (
                <li key={i} style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.5 }}>{pt}</li>
              ))}
            </ul>
            <a href={BUDGET_BASELINE.source.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none', marginTop: 9 }}>
              {BUDGET_BASELINE.source.label} <ExternalLink style={{ width: 12, height: 12 }} />
            </a>
          </div>

          {/* Funding links */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {BUDGET_LINKS.map((link, i) => {
              const rel = FUND_RELATION[link.relation]
              const pr = link.promiseId ? promiseById.get(link.promiseId) : undefined
              const prSt = pr ? STATUS[pr.status] : undefined
              return (
                <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 7 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.03em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>{link.area}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: rel.color, background: rel.bg, border: `1px solid ${rel.border}`, borderRadius: 999, padding: '3px 9px', fontFamily: MANROPE, whiteSpace: 'nowrap' }}>{rel.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                    <Banknote style={{ width: 15, height: 15, color: JADE, flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.35 }}>{link.item}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.5, margin: 0 }}>{link.note}</p>
                  {pr && prSt && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE }}>Commitment:</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: INK, fontFamily: MANROPE, flex: 1, minWidth: 140, lineHeight: 1.4 }}>“{pr.text}”</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: prSt.color, background: prSt.bg, border: `1px solid ${prSt.border}`, borderRadius: 999, padding: '3px 9px', fontFamily: MANROPE, whiteSpace: 'nowrap' }}>{prSt.label}</span>
                    </div>
                  )}
                  {!pr && link.priority && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${BORDER}`, fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE }}>
                      Priority: <span style={{ fontWeight: 700, color: SECONDARY }}>{link.priority}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <Link href="/budget" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 16, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
            Full Budget 2026 breakdown <ArrowUpRight style={{ width: 15, height: 15 }} />
          </Link>
        </div>

        {/* ── Priorities ── */}
        <div style={{ marginTop: 38 }}>
          <SectionTitle icon={Activity} title="Priorities through the term" sub="Where effort and legislation concentrated" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {PRIORITIES.map((pr) => (
              <div key={pr.theme} style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: '15px 17px', background: SURFACE }}>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 5 }}>{pr.theme}</div>
                <div style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55 }}>{pr.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bills ── */}
        <div style={{ marginTop: 38 }}>
          <SectionTitle icon={FileText} title="Key bills & Acts" sub="What they do, and where they got to" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {BILLS.map((b) => (
              <div key={b.title} style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{b.title}</div>
                    <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55, margin: '5px 0 0' }}>{b.does}</p>
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: b.status === 'defeated' ? '#991b1b' : b.status === 'enacted' ? '#065f46' : '#92400e', background: b.status === 'defeated' ? '#fef2f2' : b.status === 'enacted' ? '#ecfdf5' : '#fff9e6', border: `1px solid ${b.status === 'defeated' ? '#fecaca' : b.status === 'enacted' ? '#a7f3d0' : '#fde68a'}`, borderRadius: 999, padding: '4px 11px', fontFamily: MANROPE, whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{b.status}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 9 }}>
                  {b.source && (
                    <a href={b.source.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
                      {b.source.label} <ExternalLink style={{ width: 12, height: 12 }} />
                    </a>
                  )}
                  {b.when && <span style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE }}>· {b.when}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Economic context ── */}
        <div style={{ marginTop: 38 }}>
          <SectionTitle icon={TrendingUp} title="The economy this term" sub="Official indicators — context, not causation" />
          <div style={{ display: 'flex', gap: 10, padding: '13px 15px', background: '#fff9e6', border: '1px solid #fde68a', borderRadius: 12, marginBottom: 16 }}>
            <ShieldAlert style={{ width: 16, height: 16, color: '#b45309', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12.5, color: '#92400e', fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
              These series move with global conditions, migration, weather, the business cycle and many policies at once.
              They show <b>what happened during</b> the term — not what any single policy caused. Figures reflect the
              public record to ~early 2026; confirm the latest at each source.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {ECONOMIC_DATA.series.map((s) => <EconCard key={s.id} series={s} />)}
            <OcrCard />
          </div>
          <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 14, lineHeight: 1.5 }}>
            Charted data retrieved {ECONOMIC_DATA.generatedAt}: CPI from OECD (NZ figures sourced from Stats NZ);
            GDP, unemployment and Crown debt from World Bank Open Data (compiling official IMF / ILO / national figures).
            Annual figures can lag about a year — each card also links its NZ primary source (Stats NZ / Treasury).
            Re-run the fetch script to refresh.
          </p>
        </div>

      </div>
    </div>
  )
}

// ─── Small components ────────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <Icon style={{ width: 19, height: 19, color: JADE }} />
        <h2 style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: 0 }}>{title}</h2>
      </div>
      <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: '4px 0 0 28px' }}>{sub}</p>
    </div>
  )
}

function ScoreTile({ value, label, color, big }: { value: string | number; label: string; color: string; big?: boolean }) {
  return (
    <div style={{ flex: big ? '0 0 auto' : '1 1 120px', minWidth: big ? 140 : 110, border: `1px solid ${BORDER}`, borderRadius: 14, padding: big ? '16px 22px' : '14px 16px', background: big ? '#0c0e12' : '#fff' }}>
      <div style={{ fontSize: big ? 38 : 26, fontWeight: 800, color: big ? '#36e08a' : color, fontFamily: DISPLAY, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: big ? 'rgba(255,255,255,.7)' : TERTIARY, fontFamily: MANROPE, marginTop: 6 }}>{label}</div>
    </div>
  )
}

function EconCard({ series }: { series: EconSeries }) {
  const last = series.points[series.points.length - 1]
  const suffix = series.unit === '%' ? '%' : ''
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 17px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{series.name}</div>
        {last && (
          <div style={{ fontSize: 13, fontWeight: 800, color: INK, fontFamily: DISPLAY }}>
            {last.value.toFixed(1)}{suffix} <span style={{ fontSize: 11, fontWeight: 600, color: TERTIARY, fontFamily: MANROPE }}>{last.year}</span>
          </div>
        )}
      </div>
      <div style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '3px 0 10px' }}>{series.measures} <span style={{ color: '#bcc1c8' }}>· {series.unit}</span></div>

      <IndicatorChart series={series} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
        <a href={series.feedUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
          {series.feedLabel} <ArrowUpRight style={{ width: 12, height: 12 }} />
        </a>
        <a href={series.primaryUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, textDecoration: 'none' }}>
          {series.primaryLabel} <ArrowUpRight style={{ width: 12, height: 12 }} />
        </a>
      </div>
    </div>
  )
}

// OCR isn't in the auto-fed dataset (World Bank has no NZ policy rate); link the
// live RBNZ source rather than hand-typing figures.
function OcrCard() {
  return (
    <div style={{ border: `1px dashed ${TERTIARY}`, borderRadius: 14, padding: '16px 17px', background: SURFACE }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 3 }}>Official Cash Rate (OCR)</div>
      <div style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, marginBottom: 10 }}>The Reserve Bank’s policy interest rate.</div>
      <p style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.55, margin: '0 0 10px' }}>
        Held at 5.5% into 2024, then cut progressively from August 2024 as inflation eased. The OCR isn’t in the charted
        feed — check the live decision history at the source.
      </p>
      <a href="https://www.rbnz.govt.nz/monetary-policy/official-cash-rate-decisions" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
        RBNZ — OCR decisions <ArrowUpRight style={{ width: 12, height: 12 }} />
      </a>
    </div>
  )
}
