'use client'

/**
 * CommandCentre — the signed-in user's tracked things, grouped by kind.
 * Server-rendered initial list (passed in), with client-side removal so the
 * page stays live without a full reload. Free feature; the centrepiece of the
 * dashboard. Empty state nudges the user toward the things worth tracking.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Users, Landmark, MapPin, Scale, Gavel, X, ArrowRight, Map as MapIcon, PenLine, ExternalLink, Swords, ChevronDown, ChevronUp, Pencil, Check } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { BILLS_54, type Bill54 } from '@/constants/bills-54'
import { PARTY_COLORS } from '@/constants/parties'
import DEFINING_BILL_MAP from '@/constants/defining-bill-map.json'
import type { PartySlug } from '@/types'
import type { Bookmark } from '@/hooks/use-bookmarks'
import { TileFocus, type TileUpdate } from '@/components/bookmarks/tile-focus'
import { stillCounts } from '@/lib/notifications/rules'
import { BORDER, CARD_SHADOW, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY } from '@/constants/theme'

const normTitle = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/** "13 August 2026" — a deadline should read like a date, not an ISO string. */
function fmtDate(iso?: string | null) {
  if (!iso) return 'soon'
  const d = new Date(`${iso}T00:00:00Z`)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

// Server enriches MP/party bookmarks with display details (photo, party, leader).
// `lastActivity` = ms timestamp of the newest news tagged to this item, if any —
// drives the "new since your last visit" badge.
export type TrackedItem = Bookmark & { photo?: string; party?: string; role?: string; leader?: string; lastActivity?: number }
const initials = (s: string) => s.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()

/** How many tiles a group shows before it collapses.
 *
 *  This is the part that makes the section scale. Denser rows only slow the
 *  growth down — track sixty things and a twice-as-dense list is still three
 *  screens. With a cap, six groups can never exceed twenty-four tiles no matter
 *  how much someone follows, so the dashboard stops growing with use.
 *
 *  Four is two rows of the two-column grid, so every group has the same visual
 *  weight regardless of how much sits behind it. */
const GROUP_CAP = 4

const GROUPS: { kind: Bookmark['kind']; label: string; icon: React.ElementType }[] = [
  { kind: 'mp', label: 'Tracked MPs', icon: Users },
  { kind: 'party', label: 'Tracked parties', icon: Landmark },
  { kind: 'policy', label: 'Tracked policy topics', icon: Scale },
  { kind: 'bill', label: 'Tracked bills', icon: Gavel },
  { kind: 'electorate', label: 'Tracked electorates', icon: MapPin },
  // Separate from electorates on purpose: "my seat, who represents me" and
  // "this contest is worth watching" are different questions, and they used to
  // collide on the same row because both maps saved kind='electorate'.
  { kind: 'battleground', label: 'Tracked battlegrounds', icon: Swords },
]

// Each section gets its own colour identity — light tint + deep 700-level ink —
// the same treatment the homepage topic chips / hub tiles use.
const KIND_STYLE: Record<Bookmark['kind'], { tint: string; ink: string }> = {
  mp:         { tint: '#eff4ff', ink: '#1d4ed8' },
  party:      { tint: '#f5f3ff', ink: '#6d28d9' },
  policy:     { tint: '#f0fdfa', ink: '#0f766e' },
  bill:       { tint: '#fdf3ff', ink: '#a21caf' },
  electorate:   { tint: '#fef1f2', ink: '#be123c' },
  battleground: { tint: '#fff7ed', ink: '#c2410c' },
}

/** The card's ground and edge.
 *
 *  Where a party stands behind the item — a party itself, or an MP who sits for
 *  one — this returns that party's canonical pale wash and full colour, which is
 *  exactly what /parties, the MP directory and the battleground cards use. These
 *  tiles were the last place still on the old treatment: a white card with a 4px
 *  stripe down the side, which read as a different species of object from the
 *  same party's tile two pages away.
 *
 *  Everything else falls back to its kind's tint, keeping the saved accent on
 *  the edge where there is one — a tracked electorate carries its incumbent's
 *  colour, and that is worth keeping. */
function tileColours(b: TrackedItem): { wash: string; edge: string } {
  const slug = b.kind === 'party' ? b.ref_id : b.kind === 'mp' ? b.party : undefined
  const pc = slug ? PARTY_COLORS[slug as PartySlug] : undefined
  // washFrom rather than the designed `light`: those palettes were drawn for
  // full-bleed party pages and several are almost white at tile size, which is
  // what made an outline-only card look bland. Deriving from `bg` gives every
  // party the same fill strength.
  if (pc) return { wash: washFrom(pc.bg), edge: pc.bg }
  // Saved accent but no party record — a tracked electorate carries its
  // incumbent's colour. The ground is derived from that same colour rather than
  // taken from the kind: pairing a National-blue border with the electorate
  // group's pink tint put two colour systems on one card, and Coromandel came
  // out blue-on-pink.
  if (b.accent) return { wash: washFrom(b.accent), edge: b.accent }
  const ks = KIND_STYLE[b.kind]
  return { wash: ks.tint, edge: ks.ink }
}

/** Lighten a hex most of the way to white — a pale ground for any accent,
 *  standing in for the designed `light` that only profiled parties have. */
function washFrom(hex: string): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  if (Number.isNaN(n)) return '#fff'
  // 0.86 = a 14% wash. Enough fill that the tile reads as the party's without
  // the label losing contrast on the dark palettes (Labour, NZ First).
  const mix = (c: number) => Math.round(c + (255 - c) * 0.86)
  return `rgb(${mix((n >> 16) & 255)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`
}

function hrefFor(b: Bookmark): string {
  if (b.href) return b.href
  switch (b.kind) {
    case 'mp': return `/mps/${b.ref_id}`
    case 'party': return `/parties/${b.ref_id}`
    case 'policy': return `/policies/${b.ref_id}`
    case 'bill': return `/bills/${b.ref_id}`
    case 'electorate': return `/map?search=${encodeURIComponent(b.ref_id)}`
    default: return '/'
  }
}

/**
 * The avatar + name + sublabel, shared by both tile forms — a tile with updates
 * is a button that opens the focused view, one without is a plain link.
 *
 * Only kinds with something genuinely per-item get a face: an MP has their
 * photo, a party its own mark. Bills, policies and electorates were all showing
 * the SAME kind icon on every card — three identical pins in a row under a
 * heading that already says "Tracked electorates". The heading names the kind;
 * the card names the thing.
 */
function TileFace({ b, sub, edge }: { b: TrackedItem; sub?: string | null; edge: string }) {
  return (
    <>
      {b.kind === 'mp' ? (
        <Avatar name={b.label} party={b.party as PartySlug | undefined} src={b.photo} size="xs" />
      ) : b.kind === 'party' ? (
        // Initials in ink on white, ringed in the party colour, rather than
        // white on the colour itself: solid fills forced the text to flip
        // between near-black on ACT's yellow and white on National's blue, and
        // several palettes are too light to carry white at all.
        <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: '#fff', border: `2px solid ${edge}`, color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 800, fontFamily: MANROPE }}>{initials(b.label)}</span>
      ) : null}
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.label}</span>
        {sub && <span style={{ display: 'block', fontSize: 12, color: TERTIARY, fontFamily: MANROPE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</span>}
      </span>
    </>
  )
}

export function CommandCentre({ initial, updates: initialUpdates = {} }: {
  initial: TrackedItem[]
  /** Unread notifications keyed `kind:ref`, from notification_queue (0014). */
  updates?: Record<string, TileUpdate[]>
}) {
  // Local so marking read clears the badge immediately rather than on reload.
  const [updates, setUpdates] = useState(initialUpdates)
  const [focused, setFocused] = useState<string | null>(null)
  // Which groups have been expanded past the cap, and whether the remove
  // buttons are showing.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [editing, setEditing] = useState(false)

  // Routine coverage older than three days stops contributing to the count. It
  // is not deleted or marked read — it stays in full on the tracked item's own
  // page. See lib/notifications/rules.ts for why.
  const visibleFor = useCallback(
    (b: TrackedItem) => (updates[`${b.kind}:${b.ref_id}`] ?? []).filter((u) => stillCounts(u)),
    [updates],
  )
  const tileCount = useCallback((b: TrackedItem) => visibleFor(b).length, [visibleFor])

  const markRead = useCallback(async (ids: string[]) => {
    const gone = new Set(ids)
    setUpdates((u) => Object.fromEntries(
      Object.entries(u).map(([k, list]) => [k, list.filter((i) => !gone.has(i.id))]),
    ))
    try {
      await fetch('/api/notifications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
    } catch { /* offline — the optimistic clear stands until a reload */ }
  }, [])

  const [items, setItems] = useState<TrackedItem[]>(initial)

  // Resolved after mount, never in render: server and browser can straddle
  // midnight, and a date computed during render is a hydration mismatch.
  const [today, setToday] = useState<string | null>(null)
  useEffect(() => { setToday(new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })) }, [])

  // The "new since your last visit" machinery was removed here. It stamped a
  // localStorage timestamp on every dashboard load to light up a per-tile
  // badge — and nothing had rendered that badge since the unread COUNTS
  // replaced it, so the whole thing was dead: a read, a write and a state
  // update per visit, feeding a value no JSX referenced. A count of what is
  // genuinely unread is a better answer to the same question anyway, because
  // it survives opening the page and forgetting about it.

  // Match a tracked bill to the dataset by slug, falling back to its title.
  // Bill bookmarks are saved from pages backed by different datasets, so slugs
  // don't always line up: measured against bills-data.ts, slug matches 8/10 but
  // title matches 10/10 — the fallback is what actually carries it.
  //
  // Bills tracked from the "defining bills" pages use editorial names ("Local
  // Water Done Well") that match on neither, so they resolve through the
  // hand-written defining-bill-map (editorial slug → real Parliament slug(s)).
  // An editorial topic can span several bills — prefer whichever is currently
  // open for submissions, since that's the one the reader can act on.
  const billIndex = useMemo(() => {
    const bySlug = new Map<string, Bill54>(), byTitle = new Map<string, Bill54>()
    for (const b of BILLS_54) { bySlug.set(b.slug, b); byTitle.set(normTitle(b.title), b) }
    return { bySlug, byTitle }
  }, [])
  const billFor = (b: TrackedItem): Bill54 | undefined => {
    if (b.kind !== 'bill') return undefined
    const direct = billIndex.bySlug.get(b.ref_id) || billIndex.byTitle.get(normTitle(b.label))
    if (direct) return direct
    // `string | string[]` because the JSON carries a _comment key; Array.isArray narrows.
    const mapped = (DEFINING_BILL_MAP as Record<string, string[] | string>)[b.ref_id]
    if (!Array.isArray(mapped)) return undefined
    const bills = mapped.map((s) => billIndex.bySlug.get(s)).filter((x): x is Bill54 => !!x)
    const open = bills.find((x) => today && x.submissionsCalled && x.submissionsClose && x.submissionsClose >= today)
    return open ?? bills[0]
  }

  /** Open only while submissions were called AND the deadline hasn't passed. */
  const openBill = (b: TrackedItem): Bill54 | undefined => {
    const bill = billFor(b)
    return bill && today && bill.submissionsCalled && bill.submissionsClose && bill.submissionsClose >= today ? bill : undefined
  }
  const openTracked = items.filter((b) => openBill(b))

  async function remove(b: TrackedItem) {
    setItems((prev) => prev.filter((x) => !(x.kind === b.kind && x.ref_id === b.ref_id)))
    try {
      await fetch(`/api/bookmarks?kind=${encodeURIComponent(b.kind)}&ref=${encodeURIComponent(b.ref_id)}`, { method: 'DELETE' })
    } catch {
      setItems((prev) => [b, ...prev]) // restore on failure
    }
  }

  if (items.length === 0) {
    return (
      <div style={{ border: `1px dashed ${TERTIARY}`, borderRadius: 16, padding: '28px 24px', background: SURFACE, textAlign: 'center' }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <MapIcon style={{ width: 22, height: 22, color: JADE }} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 6 }}>Nothing tracked yet</div>
        <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, maxWidth: 460, margin: '0 auto 16px' }}>
          Track an MP, a party, an electorate or an issue and it shows up here.
        </p>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/map" style={cta(true)}><MapIcon style={{ width: 15, height: 15 }} /> Find your electorate</Link>
          <Link href="/mps" style={cta(false)}>Browse MPs <ArrowRight style={{ width: 15, height: 15 }} /></Link>
          <Link href="/policies" style={cta(false)}>Compare parties <ArrowRight style={{ width: 15, height: 15 }} /></Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Edit rather than a permanent X on every tile. Untracking is rare and
          deliberate; a count is what someone came to read, and at two tiles per
          row there is only space for one of them. */}
      {items.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -6 }}>
          <button
            onClick={() => setEditing((v) => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
              background: editing ? INK : 'none', border: editing ? 'none' : `1px solid ${BORDER}`,
              borderRadius: 999, padding: '4px 11px',
              fontSize: 11.5, fontWeight: 800, color: editing ? '#fff' : SECONDARY, fontFamily: MANROPE,
            }}
          >
            {editing ? <><Check style={{ width: 12, height: 12 }} /> Done</> : <><Pencil style={{ width: 12, height: 12 }} /> Edit</>}
          </button>
        </div>
      )}

      {/* The point of tracking a bill is to know when you can act on it. Select
          committee is that moment, and it passes on a deadline — so lead with it
          rather than letting someone discover it after the window shut. */}
      {openTracked.length > 0 && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#eef4ff', border: '1px solid #bfd4fe', borderRadius: 14, padding: '14px 16px' }}>
          <PenLine style={{ width: 18, height: 18, color: '#1e40af', flexShrink: 0, marginTop: 2 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1e3a8a', fontFamily: MANROPE, marginBottom: 3 }}>
              You can have your say on {openTracked.length} {openTracked.length === 1 ? 'bill you’re tracking' : 'bills you’re tracking'}
            </div>
            <p style={{ fontSize: 13, color: '#1e40af', fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
              {openTracked.map((b) => b.label).join(' · ')} {openTracked.length === 1 ? 'is' : 'are'} open for public submissions.
              Anyone can tell the select committee what they think — you don’t need to be an expert.
            </p>
          </div>
        </div>
      )}

      {GROUPS.map(({ kind, label, icon: Icon }) => {
        const all = items.filter((b) => b.kind === kind)
        if (all.length === 0) return null
        const ks = KIND_STYLE[kind]
        // Anything with something new comes first. At a cap, what gets hidden
        // must be the quiet items — never one asking for attention. A bill open
        // for submissions outranks everything, because it has a deadline.
        const sorted = [...all].sort((a, b) => {
          const ao = openBill(a) ? 1 : 0, bo = openBill(b) ? 1 : 0
          if (ao !== bo) return bo - ao
          return tileCount(b) - tileCount(a)
        })
        const isOpen = expanded[kind]
        const group = isOpen ? sorted : sorted.slice(0, GROUP_CAP)
        const hidden = all.length - group.length
        return (
          <div key={kind}>
            {/* A label, not an object. This was a pill in the group's tint with
                a 1.5px border in the group's ink — exactly the treatment the
                cards below it use, so a heading and a tracked item read as the
                same kind of thing at different sizes. Now it's a rule-style
                header: no fill, no outline, and the colour survives only in the
                icon and the count. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
              <Icon style={{ width: 15, height: 15, color: ks.ink, flexShrink: 0 }} />
              <h3 style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: SECONDARY, fontFamily: MANROPE, margin: 0, whiteSpace: 'nowrap' }}>{label}</h3>
              <span style={{ fontSize: 11, fontWeight: 800, color: ks.ink, background: ks.tint, borderRadius: 999, padding: '1px 7px', fontFamily: MANROPE, flexShrink: 0 }}>{group.length}</span>
              <span aria-hidden style={{ flex: 1, height: 1, background: BORDER }} />
            </div>
            {/* 154px, not 168. Two tiles plus the 8px gap have to fit the 339px
                a 375px phone leaves after page padding: at 168 that needs 344 and
                silently fell back to ONE column, losing the biggest saving here
                while looking like it had worked. Wider screens simply fit more. */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(154px, 100%), 1fr))', gap: 8 }}>
              {group.map((b) => {
                // No sublabel in the dense tile. "NZ First list MP" is useful but
                // it doubles the row height, and the name plus the party colour
                // already identify the thing. The full detail is one tap away.
                const sub = undefined
                const open = openBill(b)
                const { wash, edge } = tileColours(b)
                return (
                  // Pale wash behind a border in the same colour — the treatment
                  // /parties, the MP directory and the battleground cards all
                  // use. The old 4px left stripe is gone: with the colour in the
                  // border it was saying the same thing twice.
                  // A bill open for submissions keeps its blue over the top,
                  // because that state matters more than the tile's identity.
                  // A bill open for submissions takes the full row. It carries a
                  // deadline and a band of text underneath, and neither fits a
                  // half-width tile — the one item worth more space gets it.
                  <div key={b.id} className="party-card" style={{ position: 'relative', border: `2px solid ${open ? '#bfd4fe' : edge}`, borderRadius: 12, background: open ? '#eef4ff' : wash, overflow: 'hidden', boxShadow: CARD_SHADOW, gridColumn: open ? '1 / -1' : undefined }}>
                    {/* The count sits inside the tile row below, not pinned over
                        the border. Clicking anywhere on a tile with updates
                        opens the focused view rather than expanding in place:
                        an inline expand pushes every tile beneath it down, which
                        is the reflow that made the old inbox feel like it kept
                        growing the page. */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 7px' }}>
                    {/* Whole tile opens the focused view when there is something
                        to show; otherwise it stays a plain link to the item. */}
                    {tileCount(b) > 0 ? (
                      <button
                        onClick={() => setFocused(`${b.kind}:${b.ref_id}`)}
                        aria-label={`${tileCount(b)} update${tileCount(b) === 1 ? '' : 's'} on ${b.label}`}
                        style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                      >
                        <TileFace b={b} sub={sub} edge={edge} />
                      </button>
                    ) : (
                    <Link href={hrefFor(b)} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                      <TileFace b={b} sub={sub} edge={edge} />
                    </Link>
                    )}
                    {/* Ink, not the site's jade. JADE is byte-identical to the
                        Green Party's colour, and a green count sitting on a
                        National or ACT tile reads as a party mark rather than a
                        number. Ink is the same espresso every heading uses, so
                        the badge belongs to the site and to nobody's party. */}
                    {/* The count and the remove button share one slot rather than
                        both being permanently present. At two tiles per row a
                        26px avatar, a badge AND an X left about 78px for the
                        name, which truncated "Chlöe Swarbrick" to nothing
                        useful. Removing is rare and deliberate; a count is what
                        you came to read. */}
                    {editing ? (
                      <button
                        onClick={() => remove(b)}
                        aria-label={`Stop tracking ${b.label}`}
                        style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 7, border: `1px solid ${BORDER}`, background: '#fff', color: '#b42318', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X style={{ width: 13, height: 13 }} />
                      </button>
                    ) : tileCount(b) > 0 ? (
                      <span aria-hidden style={{
                        flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999,
                        background: INK, color: '#fff', fontSize: 10.5, fontWeight: 800, fontFamily: MANROPE, lineHeight: 1,
                      }}>{tileCount(b)}</span>
                    ) : null}
                    </div>

                    {open && (
                      <div style={{ borderTop: '1px solid #bfd4fe', background: '#eef4ff', padding: '9px 14px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#1e3a8a', fontFamily: MANROPE }}>
                          <PenLine style={{ width: 13, height: 13 }} /> Open for your submission
                        </div>
                        <div style={{ fontSize: 11.5, color: '#1e40af', fontFamily: MANROPE, marginTop: 3 }}>
                          Closes {fmtDate(open.submissionsClose)}
                        </div>
                        <a href={open.officialUrl} target="_blank" rel="noopener noreferrer"
                           style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 12, fontWeight: 800, color: '#1e3a8a', fontFamily: MANROPE, textDecoration: 'none' }}>
                          How to make a submission <ExternalLink style={{ width: 11, height: 11 }} />
                        </a>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {hidden > 0 && (
              <button
                onClick={() => setExpanded((e) => ({ ...e, [kind]: true }))}
                style={{
                  marginTop: 7, display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
                  background: 'none', border: 'none', padding: 0,
                  fontSize: 11.5, fontWeight: 800, color: TERTIARY, fontFamily: MANROPE,
                }}
              >
                <ChevronDown style={{ width: 12, height: 12 }} /> {hidden} more
              </button>
            )}
            {isOpen && all.length > GROUP_CAP && (
              <button
                onClick={() => setExpanded((e) => ({ ...e, [kind]: false }))}
                style={{
                  marginTop: 7, display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
                  background: 'none', border: 'none', padding: 0,
                  fontSize: 11.5, fontWeight: 800, color: TERTIARY, fontFamily: MANROPE,
                }}
              >
                <ChevronUp style={{ width: 12, height: 12 }} /> Show fewer
              </button>
            )}
          </div>
        )
      })}

      {/* One overlay for whichever tile is focused. Rendered here rather than
          inside the tile so the grid keeps its layout and nothing reflows. */}
      {focused && (() => {
        const b = initial.find((x) => `${x.kind}:${x.ref_id}` === focused)
        if (!b) return null
        return (
          <TileFocus
            label={b.label}
            sublabel={b.sublabel ?? undefined}
            href={`/dashboard/tracked/${b.kind}/${encodeURIComponent(b.ref_id)}`}
            updates={visibleFor(b)}
            onClose={() => setFocused(null)}
            onRead={markRead}
          />
        )
      })()}
    </div>
  )
}

function cta(primary: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10,
    fontSize: 13.5, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none',
    background: primary ? JADE : '#fff', color: primary ? '#fff' : INK,
    border: primary ? 'none' : `1px solid ${BORDER}`,
  }
}
