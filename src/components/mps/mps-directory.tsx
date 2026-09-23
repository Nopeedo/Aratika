'use client'

/**
 * MPsDirectory — every current MP, behind one row of pills.
 *
 * What this replaced, and why (§6.1, §1.3, §2.14):
 *
 * - A segmented All / Electorate / List control sitting BESIDE nine party
 *   chips: two filters in two shapes doing one job, and on a phone 52px of
 *   segmented track plus three rows of 44px-inflated chips before the first
 *   MP. Both are one §2.2 pill row now, in plain words (§2.8): "Won a seat",
 *   not "Electorate".
 * - Party chips filled with the party's own colour, directly above a grid of
 *   cards filled with the same colour. §2.14 is explicit that the pills are
 *   ONE neutral treatment: party colour belongs to parties (§1.6) and it is
 *   live in the grid underneath.
 * - "Showing 122 of 122 current MPs" under the controls. §2.2 puts the total
 *   on the All pill, where it also says what each filter would leave.
 * - All 122 cards rendered on arrival, one per row: 14,748px of grid, which
 *   made /mps the longest page on the site at 19 screens. Now §2.14's grid
 *   (two up on a phone, four at 1080) folded at 20 per §3.6.
 * - A card that navigated away to answer "who is that?". It opens §2.9's
 *   MPPreview over the page instead, which is the same argument the homepage
 *   caucus box made and a stronger one here: a reader scanning 122 names asks
 *   that question repeatedly. The preview carries the way through to the full
 *   profile, and /mps/[slug] is in the sitemap, so nothing is unreachable.
 *
 * The card is the SAME card at every width, at a different scale (§2.14): the
 * grid's track goes 150 to 230 at 768px and everything inside steps up with it,
 * avatar 24 to 32, name 13 to 15, meta 12 to 13, padding 8/10/9 to 11/13/12.
 * Before this it was 338x111 on a phone and 292x109 at 1920 — a phone card
 * getting SMALLER on a desktop, with the page margins doing the rest.
 *
 * auto-FIT, never auto-fill (§5.18): filtered to Te Pāti Māori, auto-fill holds
 * the empty tracks open and six cards sit in half a row at 1920.
 */

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronDown, Search } from 'lucide-react'
import { MP_PROFILES, type MPProfile } from '@/constants/mps-data'
import { PARTY_PROFILES, PARTY_DIRECTORY_ORDER } from '@/constants/parties-data'
import { PARTY_COLORS } from '@/constants/parties'
import { Avatar } from '@/components/ui/avatar'
import { MPPreview } from '@/components/homepage/mp-preview'
import { PartySlug } from '@/types'
import { BORDER, INK, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

const ALL_MPS = Object.values(MP_PROFILES).sort((a, b) => {
  const sa = a.name.split(' ').slice(-1)[0]
  const sb = b.name.split(' ').slice(-1)[0]
  return sa.localeCompare(sb)
})

/** Only parties that actually hold a seat get a pill. TOP is in the directory
 *  order because it contests 2026, and a pill reading "TOP 0" on a page about
 *  sitting members is noise rather than a §1.5 gap statement. Anything in the
 *  roster that is not in the canonical order still gets a pill, at the end, so
 *  no MP can become unreachable by a data change. */
const PARTY_PILLS: PartySlug[] = (() => {
  const present = new Set(ALL_MPS.map((mp) => mp.party))
  const ordered = ([...PARTY_DIRECTORY_ORDER, 'independent'] as PartySlug[]).filter((p) => present.has(p))
  const rest = [...present].filter((p) => !ordered.includes(p))
  return [...ordered, ...rest]
})()

/** Feathers the last visible row out under the "show more" control. Stops are
 *  copied verbatim from defining-bills.tsx (§3.6): they are measured from the
 *  bottom of the PADDED box, and the 34px of collapsed bottom padding below is
 *  the room the control sits in. A 46px fade spent 34 of its 46 pixels on that
 *  padding and looked like no mask at all. */
const FOLD_MASK = 'linear-gradient(to bottom, #000 0%, #000 calc(100% - 86px), rgba(0,0,0,.12) calc(100% - 26px), transparent calc(100% - 10px))'

/** Ten rows of two on a phone, five rows of four at 1080. §3.6. */
const VISIBLE = 20

type Role = 'all' | 'electorate' | 'list'

/**
 * `initialParty` pre-selects a party pill so /mps?party=<slug> lands on that
 * caucus rather than on all 122 MPs — the homepage's "See all N X MPs" link and
 * the same deep-link shape /bills?party= already uses. It seeds state and then
 * stays out of the way: the pills remain fully interactive, so a reader who
 * arrives filtered can widen the list without going back.
 */
export function MPsDirectory() {
  /* ?party= is read HERE, not handed down from the page. Awaiting
     searchParams in the server component made /mps dynamic, so every
     visitor paid a full render to answer a question only this component
     asks. Needs the <Suspense> boundary at the call site. */
  const initialParty = useSearchParams().get('party') ?? undefined
  const [query, setQuery] = useState('')
  const [party, setParty] = useState<PartySlug | 'all'>(
    initialParty && PARTY_PILLS.includes(initialParty as PartySlug) ? (initialParty as PartySlug) : 'all',
  )
  const [role, setRole] = useState<Role>('all')
  const [showAll, setShowAll] = useState(false)
  /** ONE preview for the whole list, not one per card: it locks
   *  `document.body.style.overflow`, and 122 of them would fight over it. */
  const [preview, setPreview] = useState<string | null>(null)

  // Search is applied before any count is taken, so a pill never promises rows
  // the search has already removed.
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_MPS
    return ALL_MPS.filter((mp) => mp.name.toLowerCase().includes(q) || (mp.electorate ?? '').toLowerCase().includes(q))
  }, [query])

  // Each pill counts what TAPPING it would give, so the other dimension's
  // filter is applied first. A party pill reading 0 while "Won a seat" is lit
  // is a fact about that caucus, not a bug (§1.5).
  const byRole = useMemo(() => searched.filter((mp) => role === 'all' || mp.role === role), [searched, role])
  const byParty = useMemo(() => searched.filter((mp) => party === 'all' || mp.party === party), [searched, party])

  const partyCounts = useMemo(() => {
    const out: Record<string, number> = {}
    for (const mp of byRole) out[mp.party] = (out[mp.party] ?? 0) + 1
    return out
  }, [byRole])

  const filtered = useMemo(
    () => searched.filter((mp) => (party === 'all' || mp.party === party) && (role === 'all' || mp.role === role)),
    [searched, party, role],
  )

  const hidden = Math.max(0, filtered.length - VISIBLE)
  const collapsed = !showAll && hidden > 0
  const shown = collapsed ? filtered.slice(0, VISIBLE) : filtered

  /** Any filter change re-folds: a reader who narrows to one caucus has not
   *  asked to stay expanded, and 20 is a whole caucus for most parties. */
  const setPartyAndFold = (p: PartySlug | 'all') => { setParty(p); setShowAll(false) }
  const setRoleAndFold = (r: Role) => { setRole(r); setShowAll(false) }

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: GRID_CSS }} />

      {/* Toolbar. Search stays outside the pills (§2.11): it is the one control
          a reader arrives wanting, and the only one whose state is visible
          without opening anything, because what you typed is sitting in it. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
        <div style={{ maxWidth: 420 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
            <Search style={{ width: 16, height: 16, color: TERTIARY, margin: '0 10px', flexShrink: 0 }} />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowAll(false) }}
              placeholder="Search by name or electorate…"
              aria-label="Search MPs by name or electorate"
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'none', padding: '10px 10px 10px 0', fontSize: 14, fontFamily: 'var(--font-geist-sans), sans-serif', color: INK }}
            />
          </div>
        </div>

        {/* One row, two dimensions. All clears BOTH, which is what a reader who
            has narrowed twice actually wants; each other pill toggles its own.
            Neutral throughout, per §2.14. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <FilterPill
            label="All"
            count={searched.length}
            on={party === 'all' && role === 'all'}
            onClick={() => { setParty('all'); setRole('all'); setShowAll(false) }}
          />
          {PARTY_PILLS.map((p) => (
            <FilterPill
              key={p}
              label={PARTY_PROFILES[p]?.name ?? p}
              count={partyCounts[p] ?? 0}
              on={party === p}
              /* Tapping the lit one clears back to All, per §2.2. */
              onClick={() => setPartyAndFold(party === p ? 'all' : p)}
            />
          ))}
          {/* Plain words, not Parliament's (§1.7, and the §2.8 precedent that
              turned "2 electorate, 9 list" into "2 won a local seat"). */}
          <FilterPill
            label="Won a seat"
            count={byParty.filter((mp) => mp.role === 'electorate').length}
            on={role === 'electorate'}
            onClick={() => setRoleAndFold(role === 'electorate' ? 'all' : 'electorate')}
          />
          <FilterPill
            label="Came off the list"
            count={byParty.filter((mp) => mp.role === 'list').length}
            on={role === 'list'}
            onClick={() => setRoleAndFold(role === 'list' ? 'all' : 'list')}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: '32px 0', color: TERTIARY, fontFamily: MANROPE, fontSize: 13.5 }}>
          No MPs match that search.
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div
            className="mpd-grid"
            style={{
              display: 'grid', alignItems: 'stretch',
              // The extra bottom padding while collapsed is the room the
              // control sits in, and the mask stops are measured against it.
              padding: collapsed ? '2px 0 34px' : '2px 0',
              ...(collapsed ? { WebkitMaskImage: FOLD_MASK, maskImage: FOLD_MASK } : null),
            }}
          >
            {shown.map((mp) => (
              <MPCardTile key={mp.slug} mp={mp} onOpen={() => setPreview(mp.slug)} />
            ))}
          </div>

          {/* On the fade while collapsed, where the fade is already saying
              "this continues", so the affordance and the explanation are one
              place. The number is named: "102 more" is a decision a reader can
              make, "more" is not (§3.6). */}
          {collapsed && (
            <button
              onClick={() => setShowAll(true)}
              aria-expanded={false}
              style={{
                position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)',
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 999,
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: MANROPE, fontSize: 12, fontWeight: 800, color: INK,
              }}
            >
              Show {hidden} more
              <ChevronDown style={{ width: 15, height: 15 }} strokeWidth={3} />
            </button>
          )}
        </div>
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
              fontFamily: MANROPE, fontSize: 12, fontWeight: 800, color: INK,
            }}
          >
            Show fewer
            <ChevronDown style={{ width: 15, height: 15, transform: 'rotate(180deg)' }} strokeWidth={3} />
          </button>
        </div>
      )}

      {preview && <MPPreview slug={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}

/** §3.1: the button is the 44px hit area, the span is the 28px control.
 *  Copied from party-directory.tsx rather than shared, deliberately: lifting it
 *  into ui/ edits a /parties file another session is in. Third copy of the
 *  pattern, recorded in §7. */
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
          background: on ? '#efece5' : '#fff',
          border: `2px solid ${on ? INK : BORDER}`,
          color: INK, fontFamily: MANROPE, fontWeight: 800, whiteSpace: 'nowrap',
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
 * One MP. Light fill and a 2px border, both in the party's own colour — the
 * treatment the /parties tiles and the homepage card already use.
 *
 * What came off the old 338x111 card: the party's NAME, which the fill and the
 * border and the lit pill above all say already, and the ministerial title,
 * which is the first thing the preview shows on tap. Neither leaves the site
 * (§5.17); both stop being repeated 122 times in a grid whose job is to let a
 * reader find a name.
 *
 * The name box is a FIXED two lines and the seat line a fixed one, at both
 * sizes. "Cushla Tangaere-Manuel" wraps where "Jo Luxton" does not, and a card
 * that grows by a line leaves the one beside it short; because grid items
 * stretch to their row, that stagger shows BETWEEN rows and only at some column
 * counts (§2.14).
 */
function MPCardTile({ mp, onOpen }: { mp: MPProfile; onOpen: () => void }) {
  const prof = PARTY_PROFILES[mp.party]
  const col = PARTY_COLORS[mp.party]
  return (
    <button
      type="button"
      onClick={onOpen}
      className="mp-card mpd-card"
      aria-label={`${mp.name}, ${prof?.name ?? mp.party}`}
      style={{
        display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
        background: col?.light ?? '#fff', border: `2px solid ${prof?.color ?? BORDER}`,
        fontFamily: MANROPE,
      }}
    >
      <span className="mpd-id" style={{ display: 'flex', alignItems: 'flex-start' }}>
        <span className="mpd-face" style={{ display: 'flex', flexShrink: 0, paddingTop: 1 }}>
          <Avatar name={mp.name} party={mp.party} src={mp.photo} size="xs" face />
        </span>
        <span className="mpd-name" style={{
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          minWidth: 0, fontWeight: 800, color: INK, lineHeight: 1.2,
        }}>
          {mp.name}
        </span>
      </span>

      <span className="mpd-meta" style={{
        display: 'block', color: SECONDARY, fontWeight: 700,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {mp.role === 'electorate' ? mp.electorate : 'List MP'}
      </span>
    </button>
  )
}

/* Shipped with the component (§3.2): every size on this card is set here rather
   than inline, so the media query below can restate it — and so the phone
   values are not at the mercy of globals.css's inline-style readability floor,
   which rewrites `font-size:11px` to 12.5px and would have moved a height this
   grid depends on.

   THE DESKTOP RULE (§2.14). The card was 338x111 at 375px and 292x109 at 1920:
   the same object at both, so a wide screen got MORE cards rather than BIGGER
   ones. minmax goes 150 to 230 at 768px and everything inside steps up with it.
   It is a SCALE, not a re-layout: avatar over name over seat at both sizes. A
   tile that becomes a row at the breakpoint is two designs and the reader
   meets both.

   Every reserved height is restated, because two lines of 15px is 36px where
   two lines of 13px was 32, and the seat line goes 17 to 19. Measured card:
   165x76 at 375px, 244x90 at 1080 and above. */
const GRID_CSS = `
.mpd-grid { grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr)); gap: 8px; }
.mpd-card { padding: 8px 10px 9px; border-radius: 11px; }
.mpd-id { gap: 7px; }
.mpd-name { height: 32px; font-size: 13px; }
.mpd-meta { height: 17px; line-height: 17px; margin-top: 6px; font-size: 12px; }
@media (min-width: 768px) {
  .mpd-grid { grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 10px; }
  .mpd-card { padding: 11px 13px 12px; border-radius: 13px; }
  .mpd-id { gap: 9px; }
  /* The avatar is sized by a class on the shared component, so it is scaled
     here rather than by a prop: the card cannot know the viewport at render. */
  .mpd-face > div { width: 32px !important; height: 32px !important; }
  .mpd-name { height: 36px; font-size: 15px; }
  .mpd-meta { height: 19px; line-height: 19px; margin-top: 8px; font-size: 13px; }
}
`
