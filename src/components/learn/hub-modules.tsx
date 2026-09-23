'use client'

/**
 * HubModules — everything on /learn below the title: the reader's progress, one
 * row of filter pills, and the grid of modules.
 *
 * It replaces an inline grid in learn/page.tsx of ten 16px-radius cards, each
 * carrying a 38px white icon box, a title, a two-to-three-line subtitle and a
 * "Start learning" footer row. Three things were wrong with it:
 *
 * - The card was already a <Link> AND carried a "Start learning" call to
 *   action with a rule above it. Two affordances for one destination is §1.3,
 *   and §2.3 tiles carry a chevron, not a second invitation.
 * - Ten subtitles at roughly 45px of prose apiece restated titles that already
 *   said it ("MMP & your two votes" / "How New Zealanders choose their
 *   Parliament"). §4, one line of detail, not three. The subtitle is still the
 *   module page's own standfirst, so the fact moves rather than vanishing
 *   (§1.5).
 * - Ten cards in one undifferentiated grid gave the reader no way to narrow,
 *   which is exactly what §2.14 answered on /parties: a filter you operate by
 *   scrolling.
 *
 * So: §2.2 pills over a §2.3 grid, which is the §2.14 arrangement, and a card
 * of FIXED height. §2.14's 83px lesson is the reason for the fixed height and
 * not the number: "Having your say between elections" wraps where "Who does
 * what" does not, and a card that grows by a line leaves the one beside it
 * short and staggers the grid down the page. This card measures 75px: 2px
 * border top and bottom, 8px and 9px of padding, a 32px two-line title box, 6px
 * and a 16px status line.
 *
 * Progress sits on the cards as well as in the banner above them. The question
 * a reader brings to this page is which module to do next, and that is a
 * per-module fact; the banner keeps the roll-up, the way /bills states "152 now
 * law" above a list whose tiles each carry their own status.
 *
 * Client because the pills hold state and progress comes from localStorage and
 * Supabase. The modules arrive as slim props from the server page rather than
 * importing LEARN_MODULES here, which is party-directory.tsx's arrangement.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Vote, Landmark, Users, FileText, MessagesSquare, UserCog, Lock,
  ClipboardCheck, Handshake, Megaphone, Scale,
} from 'lucide-react'
import { LEARN_GROUPS, type LearnGroup } from '@/constants/learn-data'
import { useLearnProgress } from '@/hooks/use-learn-progress'
import { computeStats } from '@/lib/learn/xp'
import { LearnProgressBanner } from '@/components/learn/learn-progress-banner'
import { BORDER, INK, MANROPE, SECONDARY, SURFACE, TERTIARY } from '@/constants/theme'

const ICONS: Record<string, React.ElementType> = {
  Vote, Landmark, Users, FileText, MessagesSquare, UserCog,
  ClipboardCheck, Handshake, Megaphone, Scale,
}

/** What the grid needs to draw a module. Deliberately not LearnModule: that
 *  carries four tiers of lesson text per module, and none of it is read here. */
export interface HubModule {
  id: string
  title: string
  /** lucide icon name, as on LearnModule. */
  icon: string
  status: 'live' | 'coming-soon'
  group: LearnGroup | null
  /** Pale card fill and deep hue, from learn-theme.ts. */
  tint: string
  ink: string
}

/**
 * Shipped with the component (§3.2): a component styled inline cannot be made
 * responsive from globals.css, and this file is the only caller of these rules.
 *
 * The grid is §2.14's exactly, minmax(min(150px, 100%), 1fr) at gap 8, which is
 * two columns on a 375px phone. Above the breakpoint the track widens: a 150px
 * track is right for a phone and wrong for a desktop, where it produced five
 * thin columns.
 *
 * The hover is local rather than the shared .party-card rule on purpose. That
 * rule rewrites border-color to the site jade, and these ten borders each carry
 * their module's own hue (§1.6, colour carries one meaning at a time), so the
 * shared hover would say "jade" about ten different subjects. Lift and shadow
 * only; the colour stays the module's.
 */
const HUB_CSS = `
.learn-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(150px, 100%), 1fr));
  gap: 8px;
}
@media (min-width: 700px) {
  .learn-grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
}
.learn-card { transition: box-shadow .15s, transform .15s; }
.learn-card:hover { box-shadow: 0 6px 20px rgba(42,18,6,.13); transform: translateY(-2px); }
@media (prefers-reduced-motion: reduce) {
  .learn-card:hover { transform: none; }
}
`

export function HubModules({ modules, tiers }: {
  modules: HubModule[]
  /** How many difficulty levels a module has, from TIERS. Passed rather than
   *  imported so the number lives in learn-data.ts only. */
  tiers: number
}) {
  const [group, setGroup] = useState<LearnGroup | 'all'>('all')
  const { progress, loaded, isSynced } = useLearnProgress()
  const stats = useMemo(() => computeStats(progress), [progress])

  // Counted from the modules actually passed in, never written down: a count
  // typed into a label is one more list that stops matching the thing it
  // describes, which is the reason the old file header gave for having no
  // count on this page at all.
  const counts = useMemo(() => {
    const out: Record<string, number> = { all: modules.length }
    for (const g of LEARN_GROUPS) out[g.key] = modules.filter((m) => m.group === g.key).length
    return out
  }, [modules])

  const shown = group === 'all' ? modules : modules.filter((m) => m.group === group)

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: HUB_CSS }} />

      {/* Only once there is something to report. Its empty state was a 42px
          tile, "Start learning to earn XP and badges" and a three-line sub,
          sitting above the modules and describing a scoring system to a reader
          who had not yet met the thing being scored (§1.1, §6.1). */}
      <LearnProgressBanner
        done={stats.tiersCompleted}
        total={stats.tiersTotal}
        badges={stats.badges}
        loaded={loaded}
        isSynced={isSynced}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        <FilterPill
          label="All"
          count={counts.all}
          on={group === 'all'}
          onClick={() => setGroup('all')}
        />
        {LEARN_GROUPS.map((g) => (
          <FilterPill
            key={g.key}
            label={g.label}
            count={counts[g.key]}
            on={group === g.key}
            /* Tapping the lit one clears back to All, per §2.2. */
            onClick={() => setGroup(group === g.key ? 'all' : g.key)}
          />
        ))}
      </div>

      <div className="learn-grid">
        {shown.map((m) => (
          <ModuleCard
            key={m.id}
            module={m}
            tiers={tiers}
            done={Object.values(progress[m.id] || {}).filter((r) => r?.completed).length}
          />
        ))}
      </div>
    </div>
  )
}

/** §3.1: the button is the 44px hit area, the span is the 28px control.
 *  Lifted from party-directory.tsx unchanged, because §2.2 is one control and
 *  a second set of numbers for it is how the two rows drift apart. */
function FilterPill({ label, count, on, onClick }: {
  label: string
  count: number
  on: boolean
  onClick: () => void
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
          // One neutral treatment, not a colour per group (§2.14): module
          // colour belongs to the modules and it is live in the grid directly
          // underneath.
          background: on ? '#efece5' : '#fff',
          border: `2px solid ${on ? INK : BORDER}`,
          color: INK, fontFamily: MANROPE, fontWeight: 800,
          whiteSpace: 'nowrap',
          transition: 'background-color .2s ease, border-color .2s ease',
        }}
      >
        {label}
        <span style={{ fontWeight: 700, opacity: .75 }}>{count}</span>
      </span>
    </button>
  )
}

/**
 * One module. Light fill and 2px border, both in the module's own hue, which is
 * the treatment §2.14 gives a party and §2.3 gives a bill.
 *
 * What came off the old card: the 38px white icon box (it took 45px off the
 * title's line, and at this width "Having your say between elections" needs the
 * full 140px to reach the second line rather than the third), the subtitle, and
 * the "Start learning" row.
 */
function ModuleCard({ module: m, done, tiers }: { module: HubModule; done: number; tiers: number }) {
  const Icon = ICONS[m.icon] || Vote
  const live = m.status === 'live'

  // One object, used by both branches: the coming-soon card has to be the same
  // box as the live one or the grid staggers on status rather than on content.
  const card: React.CSSProperties = {
    display: 'block', textDecoration: 'none', borderRadius: 11,
    background: live ? m.tint : SURFACE,
    border: `2px solid ${live ? m.ink : BORDER}`,
    padding: '8px 10px 9px',
    opacity: live ? 1 : .75,
  }

  const body = (
    <>
      {/* A FIXED two lines (§2.14). "Having your say between elections" wraps
          where "Who does what" does not, and a card that grows by a line leaves
          the one beside it 16px short, staggered all the way down the grid. */}
      <span style={{
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        height: 32, fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.2,
      }}>
        {m.title}
      </span>

      {/* The one line, and it says the same thing whether the answer is four
          levels or none. Before load this reads "Not started" for everyone,
          which is the honest value and the same height as every other state,
          so nothing moves under the reader when progress arrives. */}
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, height: 16, marginTop: 6 }}>
        {live ? (
          <>
            <Icon style={{ width: 13, height: 13, color: m.ink, flexShrink: 0, opacity: done > 0 ? 1 : .6 }} />
            <span style={{
              fontSize: 11, fontWeight: done > 0 ? 800 : 700, fontFamily: MANROPE,
              color: done > 0 ? m.ink : SECONDARY, whiteSpace: 'nowrap',
            }}>
              {done === 0 ? 'Not started' : done === tiers ? `All ${tiers} levels` : `${done} of ${tiers} levels`}
            </span>
          </>
        ) : (
          <>
            <Lock style={{ width: 12, height: 12, color: TERTIARY, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: TERTIARY, fontFamily: MANROPE }}>Coming soon</span>
          </>
        )}
      </span>
    </>
  )

  return live
    ? <Link href={`/learn/${m.id}`} className="learn-card" style={card}>{body}</Link>
    : <div style={card}>{body}</div>
}
