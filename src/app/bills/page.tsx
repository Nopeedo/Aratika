/**
 * /bills — Bills tracker.
 * Top: Aratika's plain-language, editor-reviewed breakdowns (the immersive
 * reader entry points), pulled live from approved content_items. Below: the
 * full current-bills snapshot.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink, ArrowRight, Sparkles, FileText } from 'lucide-react'
import { SectionDivider } from '@/components/ui/section-divider'
import { BillsTracker54 } from '@/components/bills/bills-tracker-54'
import { DefiningBills } from '@/components/bills/defining-bills'
import { BILLS_54_META } from '@/constants/bills-54'
import { getApprovedBills } from '@/lib/bills/live'
import { memberPartyMap } from '@/lib/bills/member-party'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import type { PolicyTopic } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Bills Tracker',
  description:
    'Track bills currently before the New Zealand House of Representatives — ' +
    'their type, stage, and progress, with plain-language breakdowns.',
}

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', SURFACE = '#f8fafc', BORDER = '#e9e7e2'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const JADE = '#1F8A4C'

// Bill stage (kebab value from the pipeline) → human label + colour, matching the
// tracker's scheme (green = law, blue = select committee, amber = in progress).
const STAGE_META: Record<string, { label: string; fg: string; bg: string }> = {
  'introduced': { label: 'Introduced', fg: '#92400e', bg: '#fff7e6' },
  'first-reading': { label: 'First reading', fg: '#92400e', bg: '#fff7e6' },
  'select-committee': { label: 'Select committee', fg: '#1e40af', bg: '#eef4ff' },
  'second-reading': { label: 'Second reading', fg: '#92400e', bg: '#fff7e6' },
  'committee-of-whole-house': { label: 'Committee of the whole House', fg: '#92400e', bg: '#fff7e6' },
  'third-reading': { label: 'Third reading', fg: '#92400e', bg: '#fff7e6' },
  'royal-assent': { label: 'Passed into law', fg: '#065f46', bg: '#d1fae5' },
}
function stageMeta(stage: string | null): { label: string; fg: string; bg: string } | null {
  if (!stage) return null
  return STAGE_META[stage] ?? { label: stage.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), fg: '#92400e', bg: '#fff7e6' }
}

export default async function BillsPage({ searchParams }: { searchParams: Promise<{ party?: string }> }) {
  const { party: initialParty } = await searchParams
  const readable = await getApprovedBills()
  // Map each bill title → its reader slug, so the full tracker can link rows that
  // have a published breakdown through to /legislation/[slug].
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const readerSlugs: Record<string, string> = {}
  for (const b of readable) readerSlugs[norm(b.title)] = b.slug

  // Member name → party, so the tracker can filter bills by the party of the
  // MP/minister in charge (deep-linkable via /bills?party=<slug>). Built server
  // side so the large MP dataset stays out of the client bundle.
  const memberParty = memberPartyMap()

  return (
    <div style={{ background: '#f5f8f4', minHeight: '100vh' }}>

      {/* Header */}
      <div className="bg-dot-grid" style={{ background: '#f5f8f4', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '48px 36px 40px' }}>
          <div style={{ marginBottom: 8 }}>
            <SectionDivider type="official" label="Official Parliament Data" />
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, marginBottom: 10 }}>
            Bills Tracker
          </h1>
          <p style={{ fontSize: 17, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, maxWidth: 620, lineHeight: 1.6, margin: 0 }}>
            Bills before the <b style={{ color: INK }}>House of Representatives</b> — what they propose, their
            type, and how far they&apos;ve progressed. Read plain-language breakdowns of the ones we&apos;ve explained.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 36px 64px' }}>

        {/* ── Bills shaping the election (curated) ── */}
        <DefiningBills />

        {/* ── Readable breakdowns (immersive reader entry points) ── */}
        {readable.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                  <Sparkles style={{ width: 16, height: 16, color: JADE }} />
                  <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE }}>Explained by Aratika</span>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>Bills, in plain language</h2>
                <p style={{ fontSize: 14.5, color: SECONDARY, fontFamily: MANROPE, margin: '6px 0 0', maxWidth: 560, lineHeight: 1.55 }}>
                  Neutral, editor-reviewed breakdowns — what each bill does and the policy areas it affects. Free to read.
                </p>
              </div>
              <Link href="/legislation" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                See all breakdowns <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {readable.slice(0, 6).map((b) => (
                <Link key={b.id} href={`/legislation/${b.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="party-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18, padding: '20px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: JADE, background: '#ecfdf5', border: '1px solid #cfe9d8', borderRadius: 999, padding: '2px 9px', fontFamily: MANROPE, textTransform: 'capitalize' }}>
                        <FileText style={{ width: 11, height: 11 }} /> {b.docType}
                      </span>
                      {(() => { const sm = stageMeta(b.stage); return sm ? <span style={{ fontSize: 11, fontWeight: 800, color: sm.fg, background: sm.bg, borderRadius: 999, padding: '2px 9px', fontFamily: MANROPE }}>{sm.label}</span> : null })()}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.3, marginBottom: 8 }}>{b.title}</div>
                    <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55, margin: '0 0 14px', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.summary}</p>
                    {b.policyLinks.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                        {b.policyLinks.slice(0, 4).map((p) => {
                          const meta = POLICY_TOPICS[p.topic as PolicyTopic]
                          return meta ? <span key={p.topic} style={{ fontSize: 11, fontWeight: 700, color: SECONDARY, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '3px 9px', fontFamily: MANROPE }}>{meta.label}</span> : null
                        })}
                      </div>
                    )}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE }}>Read the breakdown <ArrowRight style={{ width: 14, height: 14 }} /></span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Full bills tracker (54th Parliament) ── */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>All bills before Parliament</h2>
          <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>
            Every bill of this Parliament — filter by policy area, type or stage. {BILLS_54_META.passed} have passed into law.
          </p>
        </div>

        <BillsTracker54 readerSlugs={readerSlugs} memberParty={memberParty} initialParty={initialParty} />

        <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 18 }}>
          Source: {BILLS_54_META.sourceLabel}, 54th Parliament, as at {BILLS_54_META.asOf}.{' '}
          <a href={BILLS_54_META.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 700 }}>
            Official register <ExternalLink style={{ width: 11, height: 11, display: 'inline' }} />
          </a>
        </p>
      </div>
    </div>
  )
}
