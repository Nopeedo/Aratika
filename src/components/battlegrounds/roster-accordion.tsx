'use client'

/**
 * RosterAccordion — the "war room" roster: each combatant (the defending MP,
 * each confirmed challenger) is a collapsed dossier row you tap to expand into
 * their full profile. Keeps the page short by default while all the real,
 * sourced depth (bio, record, questions, policies) stays one tap away.
 */

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import type { PartySlug } from '@/types'
import { BORDER, INK, MANROPE, SECONDARY } from '@/constants/theme'

export interface RosterItem {
  key: string
  color: string
  /** Pale wash of `color`, from PARTY_COLORS[...].light. Omitted for rows with
   *  no party of their own (the "no challengers yet" placeholder), which stay
   *  white rather than borrowing someone else's colour. */
  light?: string
  avatarName: string
  avatarParty?: PartySlug
  avatarPhoto?: string
  title: string
  subtitle: string
  badge?: string
  /** Illustrative-only poll standing (0-100) — see Candidate2026.pollPct. Omit unless mock/sourced. */
  pollPct?: number
  body: React.ReactNode
}

export function RosterAccordion({ items, defaultOpenKey }: { items: RosterItem[]; defaultOpenKey?: string }) {
  const [openKey, setOpenKey] = useState<string | null>(defaultOpenKey ?? items[0]?.key ?? null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item) => {
        const open = openKey === item.key
        return (
          // Party colour on the border and the header row — the same treatment
          // as the party tiles, MP directory and bill cards. The 4px left edge
          // is gone with it: the border carries the party now, so keeping both
          // was a second reading of the same thing.
          //
          // The wash stops at the header. Expanded, these rows hold a full
          // dossier — committees, bills, a written-questions chart, cream inset
          // panels — and running the tint behind all of that both buried the
          // content and clashed with the insets. The list reads by party; the
          // dossier reads on a neutral ground.
          <div key={item.key} style={{ background: '#fff', border: `2px solid ${item.light ? item.color : BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
            <button
              onClick={() => setOpenKey(open ? null : item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                padding: '13px 16px', background: item.light ?? 'none', border: 'none', cursor: 'pointer',
              }}
            >
              <Avatar name={item.avatarName} party={item.avatarParty} src={item.avatarPhoto} size="sm" face />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14.5, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{item.title}</span>
                  {/* White ring, so "Incumbent" doesn't vanish into a card now
                      washed in that same party colour. */}
                  {item.badge && (
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: item.color, borderRadius: 999, padding: '2px 8px', fontFamily: MANROPE, boxShadow: item.light ? '0 0 0 2px rgba(255,255,255,.95)' : 'none' }}>{item.badge}</span>
                  )}
                </div>
                <div style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, marginTop: 1 }}>{item.subtitle}</div>
                {item.pollPct != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, maxWidth: 220 }}>
                    <div style={{ flex: 1, height: 5, background: '#e9e7e2', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${item.pollPct}%`, background: item.color, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: INK, fontFamily: MANROPE, flexShrink: 0 }}>{item.pollPct}%</span>
                  </div>
                )}
              </div>
              <ChevronDown style={{ width: 17, height: 17, color: SECONDARY, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
            </button>
            {open && (
              <div style={{ padding: '4px 20px 20px', borderTop: `1px solid ${BORDER}` }}>
                {item.body}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
