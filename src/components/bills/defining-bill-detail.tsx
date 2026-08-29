/**
 * DefiningBillDetail — breakdown page for a "bill that defined this term".
 * Jade theme: dated timeline, Manrope, and the vetted defining-bills.ts content
 * (no fabrication). Richer sections render only where populated, so every bill
 * degrades gracefully.
 */

import Link from 'next/link'
import { ArrowLeft, ArrowRight, ExternalLink, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { BookmarkButton } from '@/components/bookmarks/bookmark-button'
import { DEFINING_BILLS_META, type DefiningBill } from '@/constants/defining-bills'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import { BILLS_54 } from '@/constants/bills-54'
import DEFINING_BILL_MAP from '@/constants/defining-bill-map.json'
import type { PolicyTopic } from '@/types'
import { INK, MANROPE } from '@/constants/theme'

const GROUND = '#f5f8f4', CARD = '#ffffff', SOFT = '#eef3ec', MUTED = '#667066'
const LINE = '#e4ebe2', ACCENT = '#1F8A4C', ACCENT_DK = '#14663a'

const STATUS: Record<DefiningBill['statusKind'], { fg: string; bg: string; icon: React.ElementType }> = {
  law:           { fg: '#166638', bg: '#e0f3e7', icon: CheckCircle2 },
  defeated:      { fg: '#a3251f', bg: '#f8e4e2', icon: XCircle },
  'in-progress': { fg: '#92400e', bg: '#f8ecd4', icon: Clock },
}

/** Today in NZ, resolved once at module scope. This is a server component on a
 *  statically generated route, so it is fixed at build — fine, because the bills
 *  dataset itself is rebuilt daily and the page with it. */
const TODAY_NZ = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })

/** "13 August 2026" — a deadline should read like a date. */
function fmtDate(iso?: string | null) {
  if (!iso) return null
  const d = new Date(`${iso}T00:00:00Z`)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** The real bills behind an editorial grouping.
 *
 *  These pages carry a name the public uses — "Replacing the Resource Management
 *  Act" — while Parliament is actually moving three separately-titled bills. The
 *  mapping already existed for matching bookmarks and submission alerts, but the
 *  page never showed it, so a reader who tracked the topic had no way to reach
 *  the legislation itself or see how far along any of it was.
 *
 *  Linking out to Parliament rather than to /bills/<slug>: only the ten curated
 *  bills in bills-data have pages here. These live in the 270-bill snapshot,
 *  which the tracker renders but which has no individual routes — an internal
 *  link would 404. */
function coveredBills(slug: string) {
  const mapped = (DEFINING_BILL_MAP as Record<string, string[] | string>)[slug]
  if (!Array.isArray(mapped)) return []
  return mapped.map((s) => BILLS_54.find((b) => b.slug === s)).filter((b): b is (typeof BILLS_54)[number] => !!b)
}

export function DefiningBillDetail({ bill }: { bill: DefiningBill }) {
  const st = STATUS[bill.statusKind]
  const StatusIcon = st.icon
  const topic = bill.topic ? POLICY_TOPICS[bill.topic as PolicyTopic] : null
  const dotColor = bill.statusKind === 'defeated' ? '#c23b3b' : bill.statusKind === 'in-progress' ? '#c07a12' : ACCENT
  const covered = coveredBills(bill.slug)

  return (
    <div style={{ background: GROUND, minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '30px 24px 72px' }}>

        <Link href="/bills" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: MUTED, fontFamily: MANROPE, textDecoration: 'none', marginBottom: 20 }}>
          <ArrowLeft style={{ width: 15, height: 15 }} /> All bills
        </Link>

        <div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: st.fg, background: st.bg, borderRadius: 999, padding: '4px 12px', fontFamily: MANROPE }}>
            <StatusIcon style={{ width: 13, height: 13 }} /> {bill.status}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', margin: '14px 0 16px' }}>
          <h1 style={{ fontSize: 'clamp(28px, 5.2vw, 38px)', fontWeight: 800, letterSpacing: '-.028em', color: INK, fontFamily: MANROPE, lineHeight: 1.07, margin: 0, flex: 1, minWidth: 240 }}>{bill.title}</h1>
          <BookmarkButton entity={{ kind: 'bill', refId: bill.slug, label: bill.title, sublabel: 'Bill', href: `/bills/${bill.slug}`, accent: ACCENT }} variant="pill" />
        </div>

        <p style={{ fontSize: 17, color: '#2b332c', fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 8px' }}>{bill.overview ?? bill.what}</p>

        {bill.timeline && bill.timeline.length > 0 && (
          <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 16, padding: '22px 24px 8px', margin: '26px 0 24px', boxShadow: '0 1px 2px rgba(0,0,0,.03), 0 24px 50px -44px rgba(0,0,0,.35)' }}>
            <p style={labelStyle}>Its journey through Parliament</p>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {bill.timeline.map((t, i) => {
                const last = i === bill.timeline!.length - 1
                return (
                  <div key={i} style={{ display: 'flex', gap: 13 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: last ? dotColor : ACCENT, marginTop: 6, flexShrink: 0 }} />
                      {!last && <span style={{ width: 2, flex: 1, minHeight: 22, background: LINE }} />}
                    </div>
                    <div style={{ paddingBottom: last ? 14 : 16 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{t.date}</div>
                      <div style={{ fontSize: 14, color: MUTED, fontFamily: MANROPE, lineHeight: 1.5 }}>{t.event}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {bill.keyProvisions && bill.keyProvisions.length > 0 && (
          <Section label="What it does">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bill.keyProvisions.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 11 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: ACCENT, flexShrink: 0, marginTop: 9 }} />
                  <span style={{ fontSize: 15.5, color: '#2b332c', fontFamily: MANROPE, lineHeight: 1.55 }}>{p}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section label="Why it defined this election"><p style={pStyle}>{bill.why}</p></Section>
        {bill.publicResponse && <Section label="Public response"><p style={pStyle}>{bill.publicResponse}</p></Section>}
        <Section label="Who championed it"><p style={pStyle}>{bill.champion}</p></Section>
        {bill.outcome && <Section label="Where it landed"><p style={pStyle}>{bill.outcome}</p></Section>}

        {covered.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <h2 style={labelStyle}>{covered.length === 1 ? 'The bill itself' : `The ${covered.length} bills this covers`}</h2>
            <p style={{ fontSize: 13.5, color: MUTED, fontFamily: MANROPE, lineHeight: 1.55, margin: '0 0 12px' }}>
              {covered.length === 1
                ? 'The legislation behind this, with where it has got to.'
                : `“${bill.title}” is how this is talked about; Parliament is moving ${covered.length} separately-titled bills to do it. Here they are, with where each has got to.`}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {covered.map((b) => {
                const closes = fmtDate(b.submissionsClose)
                // submissionsCalled alone only says a window existed, not that
                // it is still open — one of these bills has been law since
                // February. Comparing against the date makes the difference
                // between something a reader can act on and a date that has
                // long passed, and the second must never be dressed as the
                // first. Resolved at build; the bills dataset rebuilds daily.
                const stillOpen = !!(b.submissionsCalled && b.submissionsClose && b.submissionsClose >= TODAY_NZ)
                const closed = !!(b.submissionsCalled && closes && !stillOpen)
                const open = stillOpen
                // Anchored so a notification about ONE of these bills can land
                // on its card rather than the top of the umbrella page —
                // "Natural Environment Bill advanced" used to drop the reader
                // at the RMA explainer's headline and leave them to find the
                // bill themselves. The detectors link #bill-<register-slug>.
                return (
                  <div key={b.slug} id={`bill-${b.slug}`} style={{ background: CARD, border: `1px solid ${open ? '#bfd4fe' : LINE}`, borderRadius: 12, padding: '12px 14px', scrollMarginTop: 84 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.35 }}>{b.title}</div>
                    <div style={{ fontSize: 12.5, color: MUTED, fontFamily: MANROPE, marginTop: 3 }}>{b.status}</div>
                    {/* The one thing on this page a reader can act on, so it is
                        called out rather than left as another status line. */}
                    {open && (
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: '#1e3a8a', fontFamily: MANROPE, marginTop: 6 }}>
                        Open for public submissions until {closes}
                      </div>
                    )}
                    {closed && (
                      <div style={{ fontSize: 12.5, color: MUTED, fontFamily: MANROPE, marginTop: 6 }}>
                        Submissions closed {closes}
                      </div>
                    )}
                    {b.officialUrl && (
                      <a href={b.officialUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: ACCENT_DK, fontFamily: MANROPE, textDecoration: 'none', marginTop: 7 }}>
                        Read it on parliament.nz <ExternalLink style={{ width: 12, height: 12 }} />
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28, paddingTop: 22, borderTop: `1px solid ${LINE}` }}>
          {topic && bill.topic && (
            <Link href={`/policies/${bill.topic}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14.5, fontWeight: 800, color: ACCENT_DK, fontFamily: MANROPE, textDecoration: 'none' }}>
              Where the parties stand on {topic.label.toLowerCase()} <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
          )}
          <a href={bill.source.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: MUTED, fontFamily: MANROPE, textDecoration: 'none' }}>
            Verify at the official source — {bill.source.label} <ExternalLink style={{ width: 13, height: 13 }} />
          </a>
        </div>

        {bill.sources && bill.sources.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h2 style={labelStyle}>Sources</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bill.sources.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600, color: ACCENT_DK, fontFamily: MANROPE, textDecoration: 'none' }}>
                  {s.label} <ExternalLink style={{ width: 12, height: 12 }} />
                </a>
              ))}
            </div>
          </div>
        )}

        <p style={{ fontSize: 12, color: '#8a8f86', fontFamily: MANROPE, lineHeight: 1.55, margin: '26px 0 0', background: SOFT, border: `1px solid ${LINE}`, borderRadius: 12, padding: '12px 15px' }}>
          Neutral summary, {DEFINING_BILLS_META.asOf} knowledge cut-off — confirm any later changes at the official source. Arapono does not take a side.
        </p>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: ACCENT_DK, fontFamily: MANROPE, margin: '0 0 10px' }
const pStyle: React.CSSProperties = { fontSize: 16, color: '#2b332c', fontFamily: MANROPE, lineHeight: 1.62, margin: 0 }

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={labelStyle}>{label}</h2>
      {children}
    </div>
  )
}
