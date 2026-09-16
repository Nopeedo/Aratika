/**
 * WhatsMoved — the homepage "Latest" section: new candidates and bills that
 * changed stage, each linking to the page where the change lives.
 *
 * Until this existed, the only way to learn something had moved was to follow
 * it and get a notification. A first-time visitor had no way to see that the
 * site is alive — that candidates are still being announced and bills are
 * still moving — without already knowing what to look for.
 *
 * Server component. Candidates come from the database (cached, cookie-free);
 * bill movements from a JSON log the bill detector writes every morning. The
 * two lists are different shapes on purpose: a candidate is a person joining a
 * race, a bill movement is a thing changing state, and forcing them into one
 * feed would flatten both.
 *
 * Windows are deliberately unequal. Candidates arrive in bursts during the
 * campaign, so 30 days keeps the list current. Bills move a few times a month —
 * four stage changes in the whole of August — so the window is 60 days, or the
 * list would be empty more often than not.
 */

import Link from 'next/link'
import { ArrowRight, UserPlus, FileText } from 'lucide-react'
import { getLatestCandidates, getLatestBillMovements } from '@/lib/latest/live'
import { PARTY_COLORS } from '@/constants/parties'
import { BORDER, INK, JADE, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'
import type { PartySlug } from '@/types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** "29 Aug" — a movement date should read like a date, short, no year needed within a campaign. */
function short(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`)
  return isNaN(d.getTime()) ? iso : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

export async function WhatsMoved() {
  const [candidates, bills] = await Promise.all([getLatestCandidates(6, 30), Promise.resolve(getLatestBillMovements(6, 60))])
  // Nothing in either window: render nothing rather than two empty boxes
  // announcing that nothing has happened.
  if (!candidates.length && !bills.length) return null

  return (
    <section style={{ background: 'transparent' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '8px clamp(18px, 5vw, 36px) 56px' }}>
        <div style={{ marginBottom: 6, fontSize: 12.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>
          Latest
        </div>
        <h2 style={{ fontSize: 'clamp(24px,3.6vw,31px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: '0 0 8px' }}>
          What&apos;s moved
        </h2>
        <p style={{ fontSize: 15.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 22px', lineHeight: 1.55, maxWidth: 640 }}>
          New names in the races, and bills that changed stage in Parliament. Tap any of them to see where it sits now.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(330px, 100%), 1fr))', gap: 'clamp(18px, 3vw, 28px)', alignItems: 'start' }}>

          {candidates.length > 0 && (
            <Panel icon={<UserPlus style={{ width: 16, height: 16 }} />} title="New candidates" allHref="/battlegrounds" allLabel="All battlegrounds">
              {candidates.map((c) => {
                const col = c.party && c.party !== 'independent' ? PARTY_COLORS[c.party as PartySlug] : null
                return (
                  <Row key={`${c.electorateSlug}-${c.name}`} href={c.href} date={c.date}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      {/* Party dot, not a party label: the name and the electorate are the
                          news; the party is context and colour is enough of it. */}
                      <span aria-hidden style={{ width: 9, height: 9, borderRadius: 999, flexShrink: 0, background: col ? col.bg : '#9aa0aa' }} />
                      <span style={{ fontWeight: 800, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    </span>
                    <span style={{ color: SECONDARY, fontSize: 13.5 }}>
                      {c.partyName ? `${c.partyName} · ` : ''}{c.electorateName}
                    </span>
                  </Row>
                )
              })}
            </Panel>
          )}

          {bills.length > 0 && (
            <Panel icon={<FileText style={{ width: 16, height: 16 }} />} title="Bills that moved" allHref="/bills" allLabel="Bills tracker">
              {bills.map((b) => (
                <Row key={`${b.slug}-${b.date}`} href={b.href} date={b.date}>
                  <span style={{ fontWeight: 800, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{b.title}</span>
                  <span style={{ color: SECONDARY, fontSize: 13.5 }}>
                    {/* from → to, so the reader sees the movement, not just the destination. */}
                    {b.from} <span aria-hidden style={{ color: TERTIARY }}>→</span> <b style={{ color: JADE, fontWeight: 800 }}>{b.to}</b>
                  </span>
                </Row>
              ))}
            </Panel>
          )}

        </div>
      </div>
      <style>{`.wm-row:hover { background: #f5f7f6; }`}</style>
    </section>
  )
}

function Panel({ icon, title, allHref, allLabel, children }: { icon: React.ReactNode; title: string; allHref: string; allLabel: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 18px 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE }}>
          {icon}{title}
        </div>
        <Link href={allHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 800, color: JADE, textDecoration: 'none', fontFamily: MANROPE, whiteSpace: 'nowrap' }}>
          {allLabel} <ArrowRight style={{ width: 13, height: 13 }} />
        </Link>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>{children}</ul>
    </div>
  )
}

function Row({ href, date, children }: { href: string; date: string; children: React.ReactNode }) {
  return (
    <li style={{ borderTop: `1px solid ${BORDER}` }}>
      <Link href={href} className="wm-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, alignItems: 'center', padding: '11px 6px', margin: '0 -6px', borderRadius: 10, textDecoration: 'none', fontFamily: MANROPE, fontSize: 15 }}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>{children}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: TERTIARY, whiteSpace: 'nowrap' }}>
          {short(date)} <ArrowRight style={{ width: 14, height: 14, color: JADE }} />
        </span>
      </Link>
    </li>
  )
}
