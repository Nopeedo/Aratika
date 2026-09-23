'use client'

/**
 * BudgetThemes — the eight things Budget 2026 says it does, folded at five.
 *
 * WHAT THIS REPLACED. Eight full-width cards, each with a numbered 24px jade
 * square: 813px on a phone, and the numbers implied a Treasury ranking that
 * does not exist. There is no first thing and no eighth thing; there are eight
 * statements. A theme is one sentence, so there is nothing to open onto and
 * these are §2.12 ROWS rather than §2.3 tiles, the same deliberate divergence
 * the ballot list records.
 *
 * Whose words these are is in the (i) beside the heading, not in the list
 * (§1.8): these are the Government's own account of its Budget, and this was
 * the one block on the page where framing could be read as fact.
 */

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { BUDGET_THEMES } from '@/constants/budget-2026'
import { BORDER, JADE_DARK, MANROPE } from '@/constants/theme'

/** §3.6. Five, then name the number that is left: "3 more" is a decision a
 *  reader can make, "more" is not. */
const VISIBLE = 5

/* §3.6's measured stops, not new ones. The list carries 34px of bottom padding
   while collapsed, which is the room the control sits in, so the stops are
   measured from the bottom of the PADDED box: a 46px fade spent 34 of its 46px
   on empty space and the rows still cut off square. */
const FOLD_MASK =
  'linear-gradient(to bottom, #000 0%, #000 calc(100% - 86px), rgba(0,0,0,.12) calc(100% - 26px), transparent calc(100% - 10px))'

export function BudgetThemes() {
  const [showAll, setShowAll] = useState(false)
  const hidden = Math.max(0, BUDGET_THEMES.length - VISIBLE)
  const collapsed = !showAll && hidden > 0
  const shown = collapsed ? BUDGET_THEMES.slice(0, VISIBLE) : BUDGET_THEMES

  return (
    <div style={{ position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: THEMES_CSS }} />

      <ul
        className="bt-list"
        style={{
          listStyle: 'none', margin: 0, display: 'grid',
          padding: collapsed ? '0 0 34px' : '0 0 2px',
          ...(collapsed ? { WebkitMaskImage: FOLD_MASK, maskImage: FOLD_MASK } : null),
        }}
      >
        {shown.map((t) => (
          <li key={t} className="bt-row" style={{ border: `1px solid ${BORDER}`, background: '#fff', color: '#3f444c', fontFamily: MANROPE }}>
            {t}
          </li>
        ))}
      </ul>

      {/* While collapsed the control sits ON the fade, where the fade is
          already saying "this continues", so the affordance and the
          explanation are one place rather than two. */}
      {hidden > 0 && collapsed && (
        <button
          onClick={() => setShowAll(true)}
          aria-expanded={false}
          style={{
            position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)',
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 999,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: MANROPE, fontSize: 12, fontWeight: 800, color: JADE_DARK,
          }}
        >
          Show {hidden} more
          <ChevronDown style={{ width: 15, height: 15 }} strokeWidth={3} />
        </button>
      )}

      {hidden > 0 && !collapsed && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <button
            onClick={() => setShowAll(false)}
            aria-expanded
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '8px 12px', margin: '-4px 0',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: MANROPE, fontSize: 12, fontWeight: 800, color: JADE_DARK,
            }}
          >
            Show fewer
            <ChevronDown style={{ width: 15, height: 15, transform: 'rotate(180deg)' }} strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  )
}

/* One column on a phone, two from 768px, and the ROW grows with the column
   rather than the list multiplying: 337x60 at 375px, 499x68 at 1920 (§2.14).
   Two columns rather than one because a 70-character sentence set across a
   1008px column is half an empty line, and rather than three because these are
   sentences, not labels.

   auto-fit, never auto-fill (§5.18): with five rows visible the last row holds
   one item, and auto-fill would keep the empty track open beside it. */
const THEMES_CSS = `
.bt-list { grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr)); gap: 8px; }
.bt-row {
  border-radius: 11px;
  padding: 11px 13px;
  font-size: 13.5px;
  line-height: 1.5;
}
@media (min-width: 768px) {
  .bt-list { grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 10px; }
  .bt-row { border-radius: 13px; padding: 14px 16px; font-size: 15px; line-height: 1.55; }
}
`
