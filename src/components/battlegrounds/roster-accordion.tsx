'use client'

/**
 * RosterAccordion — who is standing here: the sitting MP and each confirmed
 * candidate, as a row you tap to open their full record. Keeps the page short
 * while all the real, sourced depth (bio, record, questions, policies) stays
 * one tap away.
 *
 * NOTHING IS OPEN ON ARRIVAL (§1.1), which is the largest single change on this
 * page. The sitting MP's record — bio, portfolios, committees, three bill
 * lists, a written-questions count, four minister bars and a nested list of
 * recent questions and replies — used to be expanded before the reader had
 * chosen anything, which is §1.1's debated-bills case at several times the
 * height, and it also made every candidate below it read as a footnote to the
 * incumbent. The scroll anchor below is still right when a tall open row
 * CLOSES; it is simply no longer load-bearing.
 *
 * The poll bar went with it (§1.8). A percentage beside a named candidate's
 * photograph, with a filled bar in their party's colour, is a claim about a
 * real person, and the page's own standfirst called it "illustrative only. No
 * verified electorate-level polling exists". A disclaimer forty words above
 * does not undo a bar.
 */

import { useLayoutEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import type { PartySlug } from '@/types'
import { BORDER, INK, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

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
  /**
   * A qualifying fact about the row that belongs beside the subtitle rather
   * than inside the dossier — currently only used where a sitting MP has
   * changed party since the election, which makes "Defending" true of a
   * different party than the majority beneath it was won for.
   */
  note?: string
  body: React.ReactNode
}

export function RosterAccordion({ items, defaultOpenKey }: { items: RosterItem[]; defaultOpenKey?: string }) {
  // Closed unless the CALLER names a row (§1.1). It used to fall back to
  // `items[0]`, the sitting MP, whose record is the tallest thing on the page.
  const [openKey, setOpenKey] = useState<string | null>(defaultOpenKey ?? null)

  // Keep the row you tapped where it is on screen.
  //
  // Opening one row closes the previous one, so tapping a row below an open one
  // deletes a screen or more of content ABOVE the tap. The browser holds
  // scrollTop while the document shrinks under it, which throws the page down
  // and, near the end, clamps it to the new bottom: you land past the row you
  // opened and have to scroll back up to read it. Worst on a phone, where an
  // open record is tallest relative to the viewport.
  //
  // Measure the tapped header before the state change, then put it back at the
  // same offset after layout. useLayoutEffect, not useEffect: this has to run
  // before paint or the jump is visible as a flash.
  const rows = useRef<Record<string, HTMLDivElement | null>>({})
  const anchor = useRef<{ key: string; top: number } | null>(null)

  function toggle(key: string, isOpen: boolean) {
    const el = rows.current[key]
    anchor.current = el ? { key, top: el.getBoundingClientRect().top } : null
    setOpenKey(isOpen ? null : key)
  }

  useLayoutEffect(() => {
    const a = anchor.current
    if (!a) return
    anchor.current = null
    const el = rows.current[a.key]
    if (!el) return
    const drift = el.getBoundingClientRect().top - a.top
    // Two-arg scrollBy is always instant, so the correction never animates
    // against the user's own scrolling.
    if (drift) window.scrollBy(0, drift)
  }, [openKey])

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
          <div key={item.key} ref={(el) => { rows.current[item.key] = el }} style={{ background: '#fff', border: `2px solid ${item.light ? item.color : BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
            <button
              onClick={() => toggle(item.key, open)}
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
                {item.note && (
                  <div style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 3, lineHeight: 1.4 }}>{item.note}</div>
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
