'use client'

/**
 * RevealCards — the parts of Parliament, the steps of a select committee, who
 * does what: a set of things to be looked at one at a time.
 *
 * It replaces src/components/learn/reveal-cards.tsx, which was a stack of
 * full-width rows with `useState(0)` — the FIRST ROW ALREADY OPEN on arrival.
 * §1.1's own worked example is this exact bug: "the debated-bills list used to
 * open with one bill's full detail already showing", which also made the
 * others read as footnotes to it. Here it was worse than on /bills, because
 * the four parts of Parliament are peers and opening one of them ranks it.
 *
 * So: §2.3 tiles in a grid, closed, and a §2.4 panel that opens directly
 * beneath the tile that was tapped, spanning every column so the row breaks
 * there rather than at the foot of the grid.
 *
 * The "Tap each part to learn what it does." line under the old title is gone
 * rather than folded into an (i): the chevron on every tile is the affordance,
 * and an instruction to tap a thing that visibly opens is what §1.2 means by a
 * line a returning reader skips.
 *
 * Two divergences from §2.3/§2.4, recorded rather than fudged:
 * - No status label and no party tag on the tile, and no status badge in the
 *   panel. These items have no status. A lesson card is not a bill.
 * - The tiles take one colour, the module's, rather than a colour each. §1.6:
 *   a block takes the colour of what it is about, and all of these are about
 *   the same subject.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronDown, X, Crown, Users, Briefcase, Scale, FileInput, Megaphone, Ear,
  FileCheck, Search, Star, Swords, Gavel,
} from 'lucide-react'
import type { RevealItem } from '@/constants/learn-interactives'
import { WidgetHeader } from './module-widget-header'
import { BORDER, INK, MANROPE, SECONDARY, tint } from '@/constants/theme'

const ICONS: Record<string, React.ElementType> = {
  Crown, Users, Briefcase, Scale, FileInput, Megaphone, Ear, FileCheck, Search, Star, Swords, Gavel,
}

export function RevealCards({ title, items, accent }: {
  title: string
  items: RevealItem[]
  accent: string
}) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 20, background: '#fff' }}>
      <WidgetHeader title={title} accent={accent} />

      {/* Padding 12, not 14, and measured: the §2.3 track
          `minmax(min(150px, 100%), 1fr)` at gap 8 needs 308px for two columns,
          and a 375px phone leaves 333.5px inside this card's border. At 14 it
          came to 305.5px and the grid silently dropped to ONE column, which is
          the same 8px miss that put build-government's party toggles into six
          full-width rows. */}
      <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(150px, 100%), 1fr))', gap: 8 }}>
        {items.map((item, i) => {
          const isOpen = open === i
          const Icon = ICONS[item.icon] || Users
          return (
            <Tile
              key={item.label}
              item={item}
              Icon={Icon}
              accent={accent}
              isOpen={isOpen}
              onToggle={() => setOpen(isOpen ? null : i)}
              onClose={() => setOpen(null)}
            />
          )
        })}
      </div>
    </div>
  )
}

/**
 * One §2.3 tile, and the §2.4 panel that belongs under it.
 *
 * The panel is its own grid cell at `gridColumn: 1 / -1`, which is what makes
 * the row break at THIS tile instead of at the bottom of the grid. It is
 * rendered only while open: an empty full-width cell left in place would break
 * the row anyway, and the grid would come out one tile per row with a 0px gap
 * between each pair.
 *
 * The chevron is absolutely positioned bottom-right for §2.3's reason: in the
 * flex row it never reached the corner it is meant to occupy.
 */
function Tile({ item, Icon, accent, isOpen, onToggle, onClose }: {
  item: RevealItem
  Icon: React.ElementType
  accent: string
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}) {
  return (
    <>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          position: 'relative', textAlign: 'left', cursor: 'pointer', fontFamily: MANROPE,
          borderRadius: 11, padding: '8px 10px 22px',
          background: tint(accent, isOpen ? 0.12 : 0.06),
          border: `${isOpen ? 3 : 2}px solid ${tint(accent, isOpen ? 1 : 0.55)}`,
          transition: 'background-color .15s ease, border-color .15s ease',
        }}
      >
        <Icon style={{ width: 15, height: 15, color: accent, display: 'block', marginBottom: 3 }} />
        {/* A FIXED two lines, per §2.14 and §2.8: "The House of Representatives"
            wraps where "The Courts" does not, and one short card staggers every
            card beside it down the grid. ~81px every tile. */}
        <span style={{
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          height: 32, fontSize: 12.5, fontWeight: 800, color: INK, lineHeight: 1.25,
        }}>{item.label}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', bottom: 6, right: 7, display: 'flex' }}>
          <ChevronDown style={{ width: 15, height: 15, color: accent }} />
        </motion.span>
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          style={{
            gridColumn: '1 / -1', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16,
            padding: 'clamp(14px, 2.5vw, 20px)',
            boxShadow: '0 1px 2px rgba(0,0,0,.03), 0 20px 40px -34px rgba(0,0,0,.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <h3 style={{ fontSize: 'clamp(17px, 2.6vw, 21px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.2 }}>{item.label}</h3>
            <button onClick={onClose} aria-label={`Close ${item.label}`} style={{ background: 'none', border: 'none', padding: 4, margin: -4, cursor: 'pointer', color: SECONDARY, display: 'inline-flex', flexShrink: 0 }}>
              <X style={{ width: 17, height: 17 }} />
            </button>
          </div>
          <p style={{ fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: '8px 0 0' }}>{item.body}</p>
        </motion.div>
      )}
    </>
  )
}
