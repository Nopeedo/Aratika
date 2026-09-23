'use client'

/**
 * BallotBills — the members' bills lodged in the ballot and waiting on a draw.
 *
 * These are NOT in the tracker above, and deliberately so. A proposed members'
 * bill has never been introduced: it has no stage, no bill number and no page
 * on parliament.nz, so it cannot carry the stage filter, would make "of 285
 * bills" wrong, and is not "before the House" in Parliament's own sense of the
 * phrase. It is also not "not passed" — it is not yet drawn, which is neither.
 *
 * Worth a section of its own because it is the other half of what a party's
 * backbenchers are doing: Labour has 23 waiting against 14 introduced.
 *
 * The data is title + MP only (see mps-members-bills.ts), so these are rows
 * rather than tiles: there is no stage to show, nothing to expand into, and
 * nowhere on parliament.nz to link a single proposed bill to.
 */

import { useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { MEMBERS_BILLS_META, MP_MEMBERS_BILLS } from '@/constants/mps-members-bills'
import { MP_PROFILES } from '@/constants/mps-data'
import { PARTY_COLORS, PARTY_NAMES } from '@/constants/parties'
import { InfoButton, InfoHeading, InfoText } from '@/components/ui/info-button'
import type { PartySlug } from '@/types'
import { BORDER, INK, JADE, MANROPE, SECONDARY } from '@/constants/theme'

const ACCENT = '#1F8A4C'
/** Rows shown before the rest are folded away. */
const VISIBLE = 8

interface Row { title: string; mp: string; mpSlug: string; party: PartySlug | null }

export function BallotBills() {
  const [party, setParty] = useState<PartySlug | null>(null)
  const [showAll, setShowAll] = useState(false)

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = []
    for (const [slug, bills] of Object.entries(MP_MEMBERS_BILLS)) {
      const mp = MP_PROFILES[slug]
      for (const b of bills) {
        out.push({ title: b.title, mp: mp?.name ?? slug, mpSlug: slug, party: mp?.party ?? null })
      }
    }
    // By party, then by MP, so a reader scanning for one party finds them together.
    return out.sort((a, b) => (a.party ?? '').localeCompare(b.party ?? '') || a.mp.localeCompare(b.mp))
  }, [])

  const parties = useMemo(() => {
    const counts = new Map<PartySlug, number>()
    for (const r of rows) if (r.party) counts.set(r.party, (counts.get(r.party) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [rows])

  const matching = party ? rows.filter((r) => r.party === party) : rows
  const hidden = Math.max(0, matching.length - VISIBLE)
  const collapsed = !showAll && hidden > 0
  const shown = collapsed ? matching.slice(0, VISIBLE) : matching

  return (
    <section style={{ marginTop: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.025em', color: INK, fontFamily: MANROPE, margin: 0 }}>
          Waiting in the ballot
        </h2>
        <InfoButton accent={ACCENT} label="How the members' ballot works" size={24}>
          <InfoHeading accent={ACCENT}>What these are</InfoHeading>
          <InfoText>
            Bills written by MPs who are not Ministers, lodged and waiting to be
            drawn. They have not been introduced, so they are not in the tracker
            above and have no stage yet.
          </InfoText>

          <InfoHeading accent={ACCENT}>How the ballot works</InfoHeading>
          <InfoText>
            Each MP may have one bill in the ballot at a time. When there is room
            on the order paper the Clerk draws bills at random, and a drawn bill
            is then introduced and follows the ordinary stages.
          </InfoText>
          <InfoText>
            The draw is luck, not support: a bill with the numbers behind it can
            sit here for a whole term and never be drawn, and a drawn bill can
            still be voted down at its first reading.
          </InfoText>
        </InfoButton>
      </div>

      <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: '6px 0 0' }}>
        {rows.length} bills lodged by MPs, waiting on a draw.
      </p>

      {/* Party only: there is no stage or topic on a proposed bill to filter by. */}
      <div className="bills-status-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 14 }}>
        <BallotPill label="All" count={rows.length} on={party === null} colour={ACCENT} onClick={() => { setParty(null); setShowAll(false) }} />
        {parties.map(([slug, n]) => (
          <BallotPill
            key={slug}
            label={PARTY_NAMES[slug]?.short ?? slug}
            count={n}
            on={party === slug}
            colour={PARTY_COLORS[slug]?.bg ?? ACCENT}
            onClick={() => { setParty(party === slug ? null : slug); setShowAll(false) }}
          />
        ))}
      </div>

      <ol style={{ listStyle: 'none', margin: '14px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {shown.map((r, i) => (
          <li
            key={`${r.mpSlug}-${i}`}
            style={{
              position: 'relative', border: `1px solid ${BORDER}`, background: '#fff',
              borderRadius: 11, padding: '8px 82px 9px 10px',
            }}
          >
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.3 }}>{r.title}</span>
            <span style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: SECONDARY, fontFamily: MANROPE, marginTop: 2 }}>{r.mp}</span>
            {r.party && (
              <span style={{
                position: 'absolute', top: 8, right: 8,
                display: 'inline-flex', alignItems: 'center', flexShrink: 0,
                fontSize: 9, fontWeight: 800, color: PARTY_COLORS[r.party]?.text ?? INK,
                background: PARTY_COLORS[r.party]?.bg ?? 'transparent',
                borderRadius: 999, padding: '2px 6px', fontFamily: MANROPE, whiteSpace: 'nowrap',
              }}>{PARTY_NAMES[r.party]?.short ?? r.party}</span>
            )}
          </li>
        ))}
      </ol>

      {hidden > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
          <button
            onClick={() => setShowAll((v) => !v)}
            aria-expanded={!collapsed}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '8px 12px', margin: '-4px 0',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: MANROPE, fontSize: 12, fontWeight: 800, color: ACCENT,
            }}
          >
            {collapsed ? `Show ${hidden} more` : 'Show fewer'}
          </button>
        </div>
      )}

      {/* Dated, because a ballot list goes out of date the moment a draw is
          held: bills leave it and new ones are lodged. */}
      <p style={{ fontSize: 11.5, color: '#8a8f86', fontFamily: MANROPE, margin: '14px 0 0', lineHeight: 1.5 }}>
        {MEMBERS_BILLS_META.sourceLabel}, as at {MEMBERS_BILLS_META.asOf}. Bills are drawn
        and lodged between captures, so check the official list for today&rsquo;s.{' '}
        <a href={MEMBERS_BILLS_META.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: JADE, fontWeight: 700, textDecoration: 'none' }}>
          The ballot list <ExternalLink style={{ width: 11, height: 11 }} />
        </a>
      </p>
    </section>
  )
}

function BallotPill({ label, count, on, colour, onClick }: {
  label: string; count: number; on: boolean; colour: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      style={{ display: 'inline-flex', padding: '8px 0', margin: '-8px 0', background: 'none', border: 'none', cursor: 'pointer' }}
    >
      <span
        className="status-pill"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999,
          background: on ? colour : '#fff',
          border: `2px solid ${colour}`,
          color: INK, fontFamily: MANROPE, fontWeight: 800,
        }}
      >
        {label}
        <span style={{ fontWeight: 700, opacity: .75 }}>{count}</span>
      </span>
    </button>
  )
}
