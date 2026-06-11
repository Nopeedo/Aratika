/**
 * /elections — hub linking to each general election (upcoming + past results).
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Vote } from 'lucide-react'
import { ELECTIONS } from '@/constants/elections-data'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import { SectionDivider } from '@/components/ui/section-divider'

export const metadata: Metadata = {
  title: 'Elections',
  description: 'New Zealand general elections — the upcoming 2026 election and official results from 2023.',
}

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export default function ElectionsHub() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 36px 40px' }}>
          <div style={{ marginBottom: 10 }}><SectionDivider type="official" label="General Elections" /></div>
          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 10px' }}>Elections</h1>
          <p style={{ fontSize: 17, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, maxWidth: 620, lineHeight: 1.6, margin: 0 }}>
            The election that built the current Parliament, and the next one on the horizon — with official results from the
            Electoral Commission.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '36px 36px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
          {ELECTIONS.map((e) => {
            const upcoming = e.status === 'upcoming'
            return (
              <Link key={e.slug} href={`/elections/${e.slug}`} style={{ textDecoration: 'none' }}>
                <div className="policy-card" style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden', height: '100%', boxShadow: '0 2px 4px rgba(12,14,18,.03)' }}>
                  <div style={{ height: 5, background: upcoming ? '#F5C518' : JADE }} />
                  <div style={{ padding: '22px 22px 18px', display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 30, fontWeight: 800, color: INK, fontFamily: MANROPE, letterSpacing: '-.02em' }}>{e.year}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: MANROPE,
                        padding: '3px 10px', borderRadius: 999,
                        color: upcoming ? '#92400e' : '#065f46', background: upcoming ? '#fef3c7' : '#ecfdf5',
                        border: `1px solid ${upcoming ? '#fde68a' : '#a7f3d0'}`,
                      }}>{upcoming ? 'Upcoming' : 'Final result'}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.5 }}>{e.headline}</div>
                      {/* mini seat bar for completed elections */}
                      {e.results && (
                        <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 14 }}>
                          {e.results.map((r) => (
                            <div key={r.party} title={`${PARTY_NAMES[r.party].short}: ${r.seats}`} style={{ width: `${(r.seats / (e.totalSeats || 1)) * 100}%`, background: PARTY_COLORS[r.party].bg }} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: upcoming ? '#b45309' : JADE, fontFamily: MANROPE, paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
                      {upcoming ? 'Get ready to vote' : 'View full results'} <ArrowRight style={{ width: 14, height: 14 }} />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Vote style={{ width: 14, height: 14 }} /> Results sourced from the Electoral Commission. Earlier elections (2020 and before) coming soon.
        </p>
      </div>
    </div>
  )
}
