'use client'

/**
 * CommandCentre — the signed-in user's tracked things, grouped by kind.
 * Server-rendered initial list (passed in), with client-side removal so the
 * page stays live without a full reload. Free feature; the centrepiece of the
 * dashboard. Empty state nudges the user toward the things worth tracking.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Users, Landmark, MapPin, Scale, Gavel, X, ArrowRight, Map as MapIcon, PenLine, ExternalLink, Swords } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { BILLS_54, type Bill54 } from '@/constants/bills-54'
import { PARTY_COLORS } from '@/constants/parties'
import DEFINING_BILL_MAP from '@/constants/defining-bill-map.json'
import type { PartySlug } from '@/types'
import type { Bookmark } from '@/hooks/use-bookmarks'
import { TileUpdates, type TileUpdate } from '@/components/bookmarks/tile-updates'
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
  if (pc) return { wash: pc.light, edge: pc.bg }
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
  const mix = (c: number) => Math.round(c + (255 - c) * 0.92)
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

export function CommandCentre({ initial, updates: initialUpdates = {} }: {
  initial: TrackedItem[]
  /** Unread notifications keyed `kind:ref`, from notification_queue (0014). */
  updates?: Record<string, TileUpdate[]>
}) {
  // Local so marking read clears the badge immediately rather than on reload.
  const [updates, setUpdates] = useState(initialUpdates)
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

  // "New since your last visit": compare each item's newest activity against the
  // timestamp we stored last time. Read the OLD value, light up the badges, then
  // stamp now — so the badge clears on the next visit. Runs once (a ref guards
  // against React 18 StrictMode's double-effect, which would otherwise stamp now
  // and wipe the badges immediately). First-ever visit falls back to 3 days.
  const [seenSince, setSeenSince] = useState<number | null>(null)
  const stamped = useRef(false)
  useEffect(() => {
    if (stamped.current) return
    stamped.current = true
    const KEY = 'cc_last_seen_v1'
    let raw: string | null = null
    try { raw = localStorage.getItem(KEY) } catch { /* private mode */ }
    const since = raw ? Number(raw) : Date.now() - 3 * 86_400_000
    setSeenSince(Number.isFinite(since) ? since : 0)
    try { localStorage.setItem(KEY, String(Date.now())) } catch { /* private mode */ }
  }, [])
  const isUpdated = (b: TrackedItem) => seenSince != null && !!b.lastActivity && b.lastActivity > seenSince

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
        <div style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 6 }}>Your command centre is empty</div>
        <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, maxWidth: 460, margin: '0 auto 16px' }}>
          Track the MPs, parties, electorates and policy topics that matter to you, and they’ll all live here in one place — ready for the decision ahead.
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
        const group = items.filter((b) => b.kind === kind)
        if (group.length === 0) return null
        const ks = KIND_STYLE[kind]
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))', gap: 10 }}>
              {group.map((b) => {
                const sub = b.role || b.sublabel
                const open = openBill(b)
                const { wash, edge } = tileColours(b)
                return (
                  // Pale wash behind a border in the same colour — the treatment
                  // /parties, the MP directory and the battleground cards all
                  // use. The old 4px left stripe is gone: with the colour in the
                  // border it was saying the same thing twice.
                  // A bill open for submissions keeps its blue over the top,
                  // because that state matters more than the tile's identity.
                  <div key={b.id} className="party-card" style={{ position: 'relative', border: `3px solid ${open ? '#bfd4fe' : edge}`, borderRadius: 14, background: open ? '#eef4ff' : wash, overflow: 'hidden', boxShadow: CARD_SHADOW }}>
                    {/* A count of what actually moved, not a dot. The dot came
                        from a localStorage "since your last visit" guess: it
                        could not say what had changed, could not link to it, and
                        cleared itself on render. These are real unread rows
                        attributed to this tracked item. */}
                    <TileUpdates
                      label={b.label}
                      updates={updates[`${b.kind}:${b.ref_id}`] ?? []}
                      onRead={markRead}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                    <Link href={hrefFor(b)} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}>
                      {/* Only kinds with something genuinely per-item get a tile:
                          an MP has their face, a party its own mark. Bills,
                          policies and electorates were all showing the SAME kind
                          icon on every card — three identical pins in a row under
                          a heading that already says "Tracked electorates". The
                          heading names the kind; the card names the thing. */}
                      {b.kind === 'mp' ? (
                        <Avatar name={b.label} party={b.party as PartySlug | undefined} src={b.photo} size="md" />
                      ) : b.kind === 'party' ? (
                        // Initials in ink on white, ringed in the party colour,
                        // rather than white on the colour itself. Solid fills
                        // forced the text to flip between near-black on ACT's
                        // yellow and white on National's blue; several palettes
                        // are too light to carry white at all. Keeping the
                        // colour in the ring is the same fix the party tiles
                        // and their share chips already use.
                        <span style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: '#fff', border: `2px solid ${edge}`, color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, fontFamily: MANROPE }}>{initials(b.label)}</span>
                      ) : null}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.label}</div>
                        {sub && <div style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
                      </div>
                    </Link>
                    <button
                      onClick={() => remove(b)}
                      aria-label={`Stop tracking ${b.label}`}
                      style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: TERTIARY, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X style={{ width: 14, height: 14 }} />
                    </button>
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
          </div>
        )
      })}
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
