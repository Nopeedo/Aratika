/**
 * /editor/analytics — the admin's own site analytics. Gated to the editorial
 * team, like the rest of /editor.
 *
 * Three counts, named for what they measure:
 *   Visits      one sitting on the site, however many pages (a session id)
 *   Visitors    distinct browsers (a random id kept in localStorage)
 *   Page views  every page opened, which is also the per-page count
 * All of it comes from /api/track via migration 0019, counted in the database
 * by its page_view_* functions, so this page never pulls raw rows. Days are
 * New Zealand days.
 */

import Link from 'next/link'
import { Lock, ArrowLeft } from 'lucide-react'
import { getEditor } from '@/lib/editor/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { BORDER, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

export const dynamic = 'force-dynamic'

const RANGES = [
  { key: 'today', label: 'Today', days: 1 },
  { key: '7d', label: '7 days', days: 7 },
  { key: '30d', label: '30 days', days: 30 },
  { key: 'all', label: 'All time', days: null },
] as const
type RangeKey = (typeof RANGES)[number]['key']

type Totals = { views: number; visitors: number; visits: number }
type PathRow = { path: string; views: number; visitors: number }
type DayRow = { day: string; views: number; visitors: number; visits: number }
type RefRow = { referrer_host: string; visits: number }

export default async function EditorAnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { user, isEditor } = await getEditor()
  const { range: rawRange } = await searchParams
  const range = RANGES.find((r) => r.key === rawRange) ?? RANGES[2]

  return (
    <div style={WOVEN_PAGE}>
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '44px clamp(18px, 5vw, 36px) 30px' }}>
          <Link href="/editor" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none', marginBottom: 14 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> Editorial review
          </Link>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 8px' }}>Site analytics</h1>
          <p style={{ fontSize: 15, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
            Visits to every page on the site. No IP addresses, accounts or cookies are recorded; editor pages and bots
            aren&rsquo;t counted.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px clamp(18px, 5vw, 36px) 64px' }}>
        {!user ? (
          <Gate title="Sign in required" body="Site analytics are for the Politika editorial team.">
            <Link href="/login" style={btn}>Log in</Link>
          </Gate>
        ) : !isEditor ? (
          <Gate title="Editors only" body="Your account isn’t on the editorial team. If you should have access, ask an admin to add you.">
            <Link href="/" style={btn}>Back to site</Link>
          </Gate>
        ) : (
          <Report rangeKey={range.key} days={range.days} />
        )}
      </div>
    </div>
  )
}

async function Report({ rangeKey, days }: { rangeKey: RangeKey; days: number | null }) {
  const supabase = createAdminClient()
  // The daily chart shows at most 90 bars; "All time" totals still count everything.
  const chartDays = days ?? 90
  const [totals, allTime, paths, daily, refs] = await Promise.all([
    supabase.rpc('page_view_totals', { days }),
    supabase.rpc('page_view_totals', { days: null }),
    supabase.rpc('page_view_by_path', { days, max_rows: 500 }),
    supabase.rpc('page_view_daily', { days: chartDays }),
    supabase.rpc('page_view_referrers', { days, max_rows: 15 }),
  ])

  if (totals.error || paths.error) {
    return (
      <Notice title="Analytics aren’t switched on yet">
        The page-view table doesn&rsquo;t exist in the database. Run{' '}
        <code style={code}>supabase/migrations/0019_page_views.sql</code> in the Supabase SQL editor, then reload.
        Visits are recorded from that moment on.
      </Notice>
    )
  }

  const t = num((totals.data as Totals[] | null)?.[0])
  const all = num((allTime.data as Totals[] | null)?.[0])
  const pathRows = ((paths.data as PathRow[] | null) ?? []).map((r) => ({ ...r, views: Number(r.views), visitors: Number(r.visitors) }))
  const dayRows = fillDays(((daily.data as DayRow[] | null) ?? []), chartDays)
  const refRows = ((refs.data as RefRow[] | null) ?? []).map((r) => ({ ...r, visits: Number(r.visits) }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
      {/* Range */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {RANGES.map((r) => {
          const on = r.key === rangeKey
          return (
            <Link key={r.key} href={`/editor/analytics?range=${r.key}`} style={{
              padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none',
              border: `1px solid ${on ? JADE : BORDER}`, background: on ? JADE : '#fff', color: on ? '#fff' : INK,
            }}>{r.label}</Link>
          )
        })}
      </div>

      {/* Totals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 10 }}>
        <Tile label="Site visits" value={t.visits} note="Sittings on the site" />
        <Tile label="Visitors" value={t.visitors} note="Different browsers" />
        <Tile label="Page views" value={t.views} note={t.visits ? `${(t.views / t.visits).toFixed(1)} pages per visit` : 'Every page opened'} />
      </div>
      <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, margin: '-14px 0 0' }}>
        All time: {all.visits.toLocaleString('en-NZ')} visits, {all.visitors.toLocaleString('en-NZ')} visitors,{' '}
        {all.views.toLocaleString('en-NZ')} page views.
      </p>

      {/* Daily */}
      {chartDays > 1 && (
        <Section title="By day" note={days ? undefined : 'Last 90 days'}>
          <DailyBars rows={dayRows} />
        </Section>
      )}

      {/* Every page */}
      <Section title="Every page" note={`${pathRows.length} page${pathRows.length === 1 ? '' : 's'} visited`}>
        {pathRows.length === 0 ? (
          <Empty>No page views in this period yet.</Empty>
        ) : (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, background: '#fff', overflow: 'hidden' }}>
            <div style={{ ...rowGrid, background: SURFACE, borderBottom: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: TERTIARY }}>
              <span>Page</span><span style={{ textAlign: 'right' }}>Views</span><span style={{ textAlign: 'right' }}>Visitors</span>
            </div>
            {pathRows.map((r, i) => (
              <div key={r.path} style={{ ...rowGrid, borderTop: i ? `1px solid ${BORDER}` : 'none', position: 'relative' }}>
                {/* Share of the top page's views, as a faint bar behind the row. */}
                <span aria-hidden style={{ position: 'absolute', inset: 0, width: `${(r.views / pathRows[0].views) * 100}%`, background: '#1F8A4C0d' }} />
                <a href={r.path} target="_blank" rel="noopener noreferrer" style={{ position: 'relative', color: INK, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{r.path}</a>
                <span style={{ position: 'relative', textAlign: 'right', fontWeight: 800, color: INK }}>{r.views.toLocaleString('en-NZ')}</span>
                <span style={{ position: 'relative', textAlign: 'right', color: SECONDARY }}>{r.visitors.toLocaleString('en-NZ')}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Referrers */}
      <Section title="Where visits came from" note="Other sites, on a visit's first page. Visits typed in or from apps show no source.">
        {refRows.length === 0 ? (
          <Empty>No visits from other sites in this period yet.</Empty>
        ) : (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, background: '#fff', overflow: 'hidden' }}>
            {refRows.map((r, i) => (
              <div key={r.referrer_host} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 14px', borderTop: i ? `1px solid ${BORDER}` : 'none', fontSize: 13.5, fontFamily: MANROPE }}>
                <span style={{ color: INK }}>{r.referrer_host}</span>
                <span style={{ fontWeight: 800, color: INK }}>{r.visits.toLocaleString('en-NZ')}</span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

/** Every day in the window, with zero-view days filled in so gaps show. */
function fillDays(rows: DayRow[], days: number): DayRow[] {
  const byDay = new Map(rows.map((r) => [String(r.day), r]))
  const out: DayRow[] = []
  // Today in New Zealand, as YYYY-MM-DD.
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland' }).format(new Date())
  const base = new Date(`${today}T00:00:00Z`)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(base.getTime() - i * 86400000).toISOString().slice(0, 10)
    const r = byDay.get(d)
    out.push({ day: d, views: Number(r?.views ?? 0), visitors: Number(r?.visitors ?? 0), visits: Number(r?.visits ?? 0) })
  }
  return out
}

function DailyBars({ rows }: { rows: DayRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.visits))
  const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, background: '#fff', padding: '14px 14px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: rows.length > 40 ? 1 : 3, height: 120 }}>
        {rows.map((r) => (
          <div key={r.day} title={`${fmt(r.day)}: ${r.visits} visits, ${r.visitors} visitors, ${r.views} page views`}
            style={{ flex: 1, minWidth: 0, height: `${Math.max(r.visits ? 3 : 1, (r.visits / max) * 100)}%`, background: r.visits ? JADE : BORDER, borderRadius: 2 }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: TERTIARY, fontFamily: MANROPE }}>
        <span>{fmt(rows[0].day)}</span>
        <span>Visits per day, busiest {max.toLocaleString('en-NZ')}</span>
        <span>{fmt(rows[rows.length - 1].day)}</span>
      </div>
    </div>
  )
}

function num(t?: Partial<Totals> | null): Totals {
  return { views: Number(t?.views ?? 0), visitors: Number(t?.visitors ?? 0), visits: Number(t?.visits ?? 0) }
}

function Tile({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, background: '#fff', padding: '14px 16px', fontFamily: MANROPE }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: SECONDARY }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: INK, letterSpacing: '-.02em', lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{value.toLocaleString('en-NZ')}</div>
      <div style={{ fontSize: 11.5, color: TERTIARY }}>{note}</div>
    </div>
  )
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>{title}</h2>
      {note && <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, margin: '0 0 10px' }}>{note}</p>}
      {!note && <div style={{ height: 8 }} />}
      {children}
    </section>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>{children}</p>
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, background: '#fff', padding: '18px 20px', fontFamily: MANROPE }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: INK, marginBottom: 6 }}>{title}</div>
      <p style={{ fontSize: 13.5, color: SECONDARY, lineHeight: 1.6, margin: 0 }}>{children}</p>
    </div>
  )
}

function Gate({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: '50px 0', maxWidth: 440, margin: '0 auto' }}>
      <div style={{ width: 50, height: 50, borderRadius: 13, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Lock style={{ width: 23, height: 23, color: JADE }} /></div>
      <div style={{ fontSize: 19, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 8 }}>{title}</div>
      <p style={{ fontSize: 14, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55, margin: '0 0 18px' }}>{body}</p>
      {children}
    </div>
  )
}

const rowGrid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 64px 72px', gap: 10, alignItems: 'center',
  padding: '9px 14px', fontSize: 13.5, fontFamily: MANROPE,
}
const code: React.CSSProperties = { fontSize: 12.5, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '1px 5px' }
const btn: React.CSSProperties = { display: 'inline-flex', padding: '10px 18px', borderRadius: 10, background: JADE, color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none' }
