/**
 * HomeNews — the "follow the news" + "what matters to you" two-column block.
 * Intermediate tier: a reader following the race can jump to sourced reporting
 * or into the issue-finder. We only ever link out to real, sourced outlets —
 * never invented headlines.
 */

import Link from 'next/link'
import { Newspaper, ArrowRight, ArrowUpRight, Sparkles, Compass } from 'lucide-react'
import { SectionDivider } from '@/components/ui/section-divider'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const NEWS_SOURCES = [
  { name: 'RNZ — Politics', url: 'https://www.rnz.co.nz/news/political', desc: 'NZ’s public broadcaster — independent political coverage.' },
  { name: 'The Beehive', url: 'https://www.beehive.govt.nz', desc: 'Official Government press releases and ministerial statements.' },
  { name: 'NZ Parliament', url: 'https://www.parliament.nz/en/get-involved/news-and-media/', desc: 'Official news — bills, debates and proceedings.' },
]

function NewsSourceCard({ item }: { item: typeof NEWS_SOURCES[number] }) {
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
      <div style={{ padding: '14px 0', borderBottom: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', gap: 5, cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Newspaper style={{ width: 14, height: 14, color: JADE }} />
          <span style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{item.name}</span>
          <ArrowUpRight style={{ width: 13, height: 13, color: TERTIARY, marginLeft: 'auto' }} />
        </div>
        <p style={{ fontSize: 15, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
      </div>
    </a>
  )
}

export function HomeNews() {
  return (
    <section style={{ background: '#ffffff', borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px clamp(18px, 5vw, 36px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 48, alignItems: 'start' }}>

          {/* ── Latest news ── */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontSize: 23, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>Follow the news</h2>
                <SectionDivider type="official" label="At the source" />
              </div>
              <Link href="/news" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE, textDecoration: 'none' }}>
                All news <ArrowRight style={{ width: 13, height: 13 }} />
              </Link>
            </div>
            <p style={{ fontSize: 14, color: TERTIARY, fontFamily: MANROPE, marginBottom: 4, marginTop: 0 }}>
              A curated live feed is on the way. Until then — and always — we only ever surface real,
              sourced reporting, never invented headlines. Here&apos;s where to follow it directly.
            </p>
            {NEWS_SOURCES.map((item) => (
              <NewsSourceCard key={item.name} item={item} />
            ))}
          </div>

          {/* ── What matters to you? ── */}
          <div>
            <div style={{ marginBottom: 16 }}>
              <SectionDivider type="sentiment" label="Make it yours" />
              <h2 style={{ fontSize: 23, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '10px 0 4px' }}>What matters most to you?</h2>
              <p style={{ fontSize: 14, color: TERTIARY, fontFamily: MANROPE, margin: 0 }}>Answer a few quick questions — we&apos;ll show you where parties stand on it.</p>
            </div>
            <div style={{ background: 'linear-gradient(155deg,#0f9152,#0c0e12)', borderRadius: 20, padding: '24px 22px', boxShadow: '0 6px 24px rgba(12,14,18,.10)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 16, background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles style={{ width: 22, height: 22, color: '#fff' }} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: MANROPE, marginBottom: 8 }}>Find your issues</div>
              <p style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.55, margin: '0 0 18px', color: 'rgba(255,255,255,.8)', fontFamily: MANROPE }}>
                Pick what you care about and how much you already know — and Aratika will pitch everything at your level. No account needed.
              </p>
              <Link href="/start" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 0', borderRadius: 11, background: '#fff', color: '#0c0e12', fontSize: 16, fontWeight: 800, textDecoration: 'none', fontFamily: MANROPE }}>
                <Compass style={{ width: 16, height: 16 }} /> Start the walkthrough
              </Link>
            </div>
            <p style={{ marginTop: 12, fontSize: 13, color: TERTIARY, fontFamily: MANROPE }}>
              Community polls are coming soon — see <Link href="/polls" style={{ color: SECONDARY, fontWeight: 700 }}>polls</Link>.
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}
