'use client'

/**
 * TwoVotes — the Election Centre's "how your vote works" explainer, replacing the
 * old head-to-head decide tool (that job now lives on /guide and /compare). This
 * is election-specific and strictly non-partisan: it explains the party vote vs
 * the electorate vote under MMP and stops there. Sending an undecided reader
 * somewhere is CompassCta's job, at the foot of the same section.
 *
 * CLOSED ON ARRIVAL. It used to render two always-open explainer cards, a
 * neutral tip box and a hand-off row: 468px of prose that a reader who knows
 * MMP skips in a second, which is the argument upcoming-view.tsx makes for
 * putting this section SECOND and then contradicted by leaving it expanded.
 * Two §2.3 tiles at about 51px each say what the section is; §2.4 panels say
 * the rest once asked (§1.1).
 *
 * WHAT CAME OFF, and where each fact went:
 *
 *  - The "Neutral tip" box. "Most of your influence is in the party vote"
 *    restated the party-vote card 150px above it, a card already carrying a
 *    filled "Does the heavy lifting" badge and the sentence "This is the vote
 *    that shapes who can form a government" (§1.3). The one thing worth
 *    keeping from it was the /learn/mmp link, which the section's (i) carries.
 *  - The "Still deciding who to give them to?" hand-off row. Two filled CTAs
 *    sat ~250px above CompassCta, a full-bleed colour-cycling card whose whole
 *    job is "Find where you stand": three decide-tool calls to action stacked
 *    in one section, against §2.6's one signpost per section at most. The
 *    pronoun had also drifted, "them" being two votes, three paragraphs and two
 *    cards earlier. Its "Compare parties" link pointed at /policies, which
 *    force-dynamic 307s to /policies/[first-topic].
 *
 * NOT to be confused with src/components/learn/two-votes.tsx, which is a
 * different component with a different job (an illustrative ballot a reader
 * fills in) and a different caller. The audit that led to this change recorded
 * /learn as importing THIS file and it does not: the import there is relative
 * and resolves inside components/learn. Checked before cutting anything, which
 * is why the open cards are gone rather than kept behind a flag for a caller
 * that does not exist.
 */

import { useState } from 'react'
import { ChevronDown, Landmark, MapPin, X } from 'lucide-react'
import { BORDER, INK, JADE, MANROPE, SECONDARY } from '@/constants/theme'

// Warm palette, shared with the Election Centre page and the homepage, so the
// explainer doesn't drop cold near-black text and a black CTA into a warm page.

/** The two votes, as data, so the open cards and the closed tiles cannot drift
 *  apart into two different accounts of MMP (§1.3). */
const VOTES = [
  {
    key: 'party',
    title: 'Your party vote',
    badge: 'Does the heavy lifting',
    accent: JADE,
    light: '#ecfdf5',
    /* "120 seats", not "~120". The page says 120 in two other places (the seat
       projection's total and the majority arithmetic under the chamber) and a
       tilde on one of the three invites the "why doesn't National add up to
       48?" question §8 records being asked four times about one block of
       numbers. 2023 returned 122 because of an overhang seat, which is a real
       thing and belongs in the #seats (i), not in a one-line definition. */
    body: (
      <>
        Decides the <b style={{ color: INK }}>share of Parliament&rsquo;s 120 seats</b> each party gets. This is the vote that
        shapes who can form a government. A party needs 5% of the party vote, or to win an electorate, to get in.
      </>
    ),
  },
  {
    key: 'electorate',
    title: 'Your electorate vote',
    badge: null,
    accent: '#2563eb',
    light: '#eff6ff',
    body: (
      <>
        Picks the <b style={{ color: INK }}>one MP who represents your local area</b>, your electorate. There are 72
        electorates, seven of them M&#257;ori electorates.
      </>
    ),
  },
] as const

export function TwoVotes() {
  // Nothing open on arrival (§1.1).
  const [active, setActive] = useState<string | null>(null)

  return (
    <div>
      {/* §2.3's grid, with ONE change from defining-bills.tsx: auto-FIT, not
          auto-fill. The difference only shows when a grid holds fewer tiles
          than its row has room for, which is this grid and not that one.
          auto-fill keeps the empty tracks, so at 928px these two 150px tiles
          sat in the first two of six and left 560px of nothing beside them:
          right on a phone, where two tracks is the whole row, and visibly
          lopsided on a desktop. auto-fit collapses the empties so the two
          share the row at any width.

          The panel opens beneath BOTH tiles now, spanning every column,
          whichever tile was tapped — found broken: with the panel rendered
          as the tapped tile's own next sibling (both in one .map, panel
          right after its button), tapping the FIRST tile put a full-width
          panel between it and the second tile, and CSS Grid auto-placement
          then started the second tile on a new row of its own rather than
          leaving it beside the first — it dropped BELOW the panel instead
          of staying above it with its neighbour. Tapping the second tile
          never showed the bug, because both tiles were already placed
          before its panel existed. Both buttons render first now, in a
          fixed order the active panel can't insert into, and the panel is
          the grid's last child — the row breaks after both tiles, not
          wherever the tapped one happened to be (§2.4). */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 8 }}>
        {VOTES.map((v) => {
          const on = v.key === active
          return (
            <button
              key={v.key}
              onClick={() => setActive(on ? null : v.key)}
              aria-expanded={on}
              style={{
                textAlign: 'left', cursor: 'pointer', position: 'relative',
                background: v.light, borderRadius: 11, padding: '7px 26px 20px 10px',
                borderStyle: 'solid', borderWidth: on ? 3 : 2, borderColor: v.accent,
                transition: 'border-width .2s ease', fontFamily: MANROPE,
              }}
            >
              <span style={{ display: 'block', fontSize: 9.5, fontWeight: 800, color: v.accent, fontFamily: MANROPE, marginBottom: 2 }}>
                {v.badge ?? 'One local MP'}
              </span>
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.25 }}>{v.title}</span>
              <ChevronDown
                style={{
                  position: 'absolute', right: 8, bottom: 7, width: 15, height: 15, color: v.accent,
                  transform: on ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease',
                }}
                strokeWidth={3}
              />
            </button>
          )
        })}

        {(() => {
          const v = VOTES.find((x) => x.key === active)
          if (!v) return null
          return (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{
                background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16,
                padding: 'clamp(14px, 2.5vw, 20px)', marginTop: 2,
                boxShadow: '0 1px 2px rgba(0,0,0,.03), 0 20px 40px -34px rgba(0,0,0,.4)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: v.accent, background: v.light, borderRadius: 999, padding: '4px 11px', fontFamily: MANROPE }}>
                    {v.key === 'party' ? <Landmark style={{ width: 12, height: 12 }} /> : <MapPin style={{ width: 12, height: 12 }} />}
                    {v.badge ?? 'One local MP'}
                  </span>
                  <button type="button" onClick={() => setActive(null)} aria-label={`Close ${v.title}`} style={{ background: 'none', border: 'none', padding: 6, margin: -6, cursor: 'pointer', color: SECONDARY, display: 'inline-flex', flexShrink: 0 }}>
                    <X style={{ width: 17, height: 17 }} />
                  </button>
                </div>
                <h3 style={{ fontSize: 'clamp(17px, 2.6vw, 21px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '11px 0 8px', lineHeight: 1.2 }}>{v.title}</h3>
                <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>{v.body}</p>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
