'use client'

/**
 * BattlegroundsMap — the electorate map recoloured by 2023 marginality.
 *
 * Māori and general electorates overlap geographically (same land, different
 * roll), so, like the main map, we show ONE roll at a time via <RollPills>.
 * Each seat is coloured by how close its 2023 contest was and links to its
 * seat page.
 *
 * What came out of this file, all of it duplication (§1.3):
 *
 * - The roll toggle, which was byte-identical to map-experience.tsx's. Both are
 *   the shared §2.2 <RollPills> now.
 * - `Row`, byte-identical to the one in map/electorate-tiles.tsx. It is
 *   `MetaRow` in map/map-states.tsx.
 * - `Loading`, identical to map-experience.tsx's but for a 28px spinner against
 *   a 30px one. `MapLoading`, same file.
 * - The empty-state prompt, which this file built as `promptCol` and then
 *   re-inlined a second time 90 lines later for the standalone branch: two
 *   copies to keep in step for one empty state.
 * - The `embedded` prop and its whole branch. The Election Centre used to
 *   render <BattlegroundsMap embedded />; that call site was removed, and
 *   `grep -rn "BattlegroundsMap" src` now finds only /battlegrounds. A second
 *   layout with no caller is a second layout to keep correct.
 * - The `.map-grid` rule, an undeclared GLOBAL class this file wrote three
 *   rules for while map-experience.tsx wrote five. Whichever mounted last won.
 *   Scoped to `.bg-map-grid` here (§3.2, §5.15).
 */

import * as React from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowRight, ChevronDown, MapPin, ShieldCheck } from 'lucide-react'
import type { FeatureCollection } from 'geojson'
import { normalizeElectorateKey, getElectorate, ELECTORATES, type ElectorateInfo } from '@/constants/electorates-data'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import type { Candidate2026 } from '@/constants/candidates-2026'
import { MP_PROFILES } from '@/constants/mps-data'
import { toSlug } from '@/lib/utils/format'
import { MpPhotoTile } from '@/components/map/mp-photo-tile'
import { Avatar } from '@/components/ui/avatar'
import { CandidatePreview } from './candidate-preview'
import { milestone, longDate } from '@/constants/electoral-calendar'
import { RollPills, type Roll } from '@/components/map/roll-pills'
import { MapLoading, MapUnavailable, MetaRow } from '@/components/map/map-states'
import { MARGIN_TIERS, UNKNOWN_TIER, classifyMargin, marginColorByName, type MarginTier } from '@/lib/battlegrounds'
import { MAP_LEGEND_CSS } from '@/components/map/legend-css'
import { BORDER, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY } from '@/constants/theme'

const PATHS: Record<Roll, string> = {
  general: '/data/general-electorates-2020.geojson',
  maori: '/data/maori-electorates-2020.geojson',
}

/** The red the page's hero and its closest tier already use. */
const ACCENT = '#dc2626'

const ElectorateMap = dynamic(() => import('@/components/map/electorate-map'), { ssr: false, loading: () => <MapLoading /> })

/** What the map is coloured by. */
export type MapView = 'candidates' | 'margin'

/**
 * Tiers for the "who's standing" colouring, by how many 2026 candidates have
 * been announced for the seat (withdrawn ones not counted — they aren't
 * standing).
 *
 * Cut points from the real distribution, not picked round: when this was
 * written 361 approved candidates covered 59 of 72 electorates, 2 to 16 a
 * seat, median about 6. Four tiers split that into 13 / 13 / 25 / 21 seats.
 *
 * One hue, light to dark, not a hue per tier: this is a quantity, and
 * light-to-dark reads as "more" without a key. The hue is the logo's own
 * "tika" green (JADE, #1F8A4C), by request — the darkest tier IS that green,
 * the lighter two are tints of it — so the map reads as the site's colour
 * rather than a new one. It was a tan-to-espresso scale first, picked because
 * brown is the one family that isn't a party's; JADE is also the Green
 * Party's colour, so this trades that §1.6 separation for brand consistency.
 *
 * "None announced yet" is a fact about OUR records, not about the seat —
 * nominations are still open — so it wears the same neutral grey the margin
 * view uses for "Result pending", and the legend names it plainly (§1.5).
 */
const COUNT_TIERS: { key: string; label: string; min: number; color: string }[] = [
  // Just the numbers, by request: the key's title ("Number of candidates
  // running") already says what's being counted, and "standing" on every row
  // wrapped "7 or more standing" onto two lines on a phone.
  { key: 'many', label: '7 or more', min: 7, color: '#1F8A4C' },
  { key: 'mid',  label: '5–6',       min: 5, color: '#6fb68a' },
  { key: 'few',  label: '1–4',       min: 1, color: '#bfe0cb' },
]
const NONE_YET = { key: 'none', label: 'None announced yet', color: '#d8d5cf' }

function countTier(n: number) {
  return COUNT_TIERS.find((t) => n >= t.min) ?? NONE_YET
}

export function BattlegroundsMap({ candidatesBySlug, defaultView = 'margin', only2023 = false, defaultSelected = null }: {
  candidatesBySlug?: Record<string, Candidate2026[]>
  /**
   * The 2023 results page's copy of this map, by request: the same map, the
   * same rolls and panel, but about 2023 and nothing else. No toggle to the
   * candidates view, no 2026 candidate list, and the panel shows who won
   * outright instead of behind "Last election".
   */
  only2023?: boolean
  /**
   * An area open on arrival, as its boundary name ('Wellington Central'), so
   * the card under the map shows a real example before anyone taps. Switching
   * roll still clears it, since the other roll's map has no such area.
   */
  defaultSelected?: string | null
  /**
   * Which colouring the map opens on. /battlegrounds keeps 'margin' — that
   * page is about how close 2023 was. The Election Centre opens on
   * 'candidates' by request, with a toggle to switch.
   */
  defaultView?: MapView
} = {}) {
  const [view, setView] = React.useState<MapView>(only2023 ? 'margin' : defaultView)
  const [layer, setLayer] = React.useState<Roll>('general')
  const [sets, setSets] = React.useState<Record<Roll, FeatureCollection | null>>({ general: null, maori: null })
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>('loading')
  const [selected, setSelected] = React.useState<string | null>(defaultSelected)

  /**
   * The active roll first, the other one once it is drawn. This used to
   * Promise.all both files on mount: 463KB before the map could paint, on a
   * page where the general roll alone is 388KB of it and most readers never
   * switch. Both are cached in `sets`, so a switch back is free.
   */
  React.useEffect(() => {
    let cancelled = false
    if (sets[layer]) { setStatus('ready'); return }
    fetch(PATHS[layer])
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((json: FeatureCollection | null) => {
        if (cancelled) return
        setSets((prev) => ({ ...prev, [layer]: json }))
        setStatus(json ? 'ready' : 'error')
      })
    return () => { cancelled = true }
  }, [layer]) // eslint-disable-line react-hooks/exhaustive-deps

  // Prefetch the other roll once the first one has drawn, so a switch is
  // instant without costing the first paint. A plain timer rather than
  // requestIdleCallback: Safari still does not ship it.
  React.useEffect(() => {
    if (status !== 'ready') return
    const other: Roll = layer === 'general' ? 'maori' : 'general'
    if (sets[other]) return
    const id = window.setTimeout(() => {
      fetch(PATHS[other]).then((r) => (r.ok ? r.json() : null)).catch(() => null)
        .then((json: FeatureCollection | null) => { if (json) setSets((prev) => ({ ...prev, [other]: json })) })
    }, 1200)
    return () => window.clearTimeout(id)
  }, [status, layer]) // eslint-disable-line react-hooks/exhaustive-deps

  const data = sets[layer]
  const selectedKey = selected ? normalizeElectorateKey(selected) : null
  const info = selected ? getElectorate(selected) : null
  const tier = info ? classifyMargin(info.majority) : null
  // Resolve the incumbent's profile (and free-licensed photo) the same way the map
  // panel does: prefer an explicit mpSlug, else derive it from the MP's name.
  const mpSlug = info?.mpSlug ?? (info?.mpName ? toSlug(info.mpName) : undefined)
  const mp = mpSlug ? MP_PROFILES[mpSlug] ?? null : null

  const switchLayer = (l: Roll) => { setLayer(l); setSelected(null); setStatus(sets[l] ? 'ready' : 'loading') }

  // Fill by announced-candidate count. Keyed the same way the panel looks
  // candidates up (normalizeElectorateKey), so the colour and the list a tap
  // opens can't disagree about a seat. A boundary with no electorate record
  // returns null and gets the map's neutral fill, as in the margin view.
  const candidateColorByName = React.useCallback((name: string): string | null => {
    const key = normalizeElectorateKey(name)
    if (!ELECTORATES[key]) return null
    const n = (candidatesBySlug?.[key] ?? []).filter((c) => !c.withdrawn).length
    return countTier(n).color
  }, [candidatesBySlug])
  const colorOf = view === 'margin' ? marginColorByName : candidateColorByName

  // No auto-scroll on a tap any more, by request: on a phone the page used to
  // jump down to the panel under the map. The panel just opens in place.
  const panelRef = React.useRef<HTMLDivElement>(null)

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: GRID_CSS }} />

      {/* The caption that stood beside this row ("The two rolls cover the same
          land, so view one at a time") is inside <RollPills>'s own (i), where
          /map gets it too. The same control was explained on one page and left
          bare on the other (§1.2, §1.4). */}
      <div style={{ marginBottom: 14 }}>
        <RollPills value={layer} onChange={switchLayer} accent={ACCENT} />
      </div>

      <div className="bg-map-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'stretch' }}>
        {/* Map. translateZ(0) isolates it on its own GPU layer so Leaflet's off-screen
            zoom-proxy can't smear/ghost adjacent content while the page scrolls. */}
        <div className="bg-map-box" style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', border: `1px solid ${BORDER}`, background: '#eaf2f7', transform: 'translateZ(0)', isolation: 'isolate' }}>
          {status === 'loading' && <MapLoading />}
          {status === 'ready' && data && <ElectorateMap key={layer} data={data} selectedKey={selectedKey} onSelect={setSelected} colorOf={colorOf} colorKey={view} />}
          {status === 'error' && <MapUnavailable message={`${layer === 'maori' ? 'Māori' : 'General'} boundaries could not be loaded.`} />}

          {/* What the map is coloured by — one button ON the map, top-right,
              by request. It was a two-pill row above the map ("Who's
              standing" / "2023 margin"); the default view needs no button to
              reach it, so what's left is one control that names the OTHER
              view. Top-right because Leaflet's zoom sits top-left, the key
              bottom-left and the attribution bottom-right. zIndex 1000, the
              key's own, so Leaflet's panes (400-700) can't cover it. */}
          {/* Top-right row: the view toggle, and the tapped area's name
              beside it as a green pill, by request (the card below still
              leads with the big one). row-reverse so the toggle keeps the
              corner and a long name wraps to a second line under it rather
              than running into Leaflet's zoom buttons on the left (left: 56
              keeps clear of them). pointer-events off on the row itself so
              the empty part of it still drags the map. */}
          {status === 'ready' && data && (!only2023 || selected) && (
            <div style={{
              position: 'absolute', top: 10, right: 10, left: 56, zIndex: 1000, pointerEvents: 'none',
              display: 'flex', flexDirection: 'row-reverse', flexWrap: 'wrap', alignItems: 'center', gap: 6,
            }}>
              {!only2023 && (
                <button
                  type="button"
                  onClick={() => setView((v) => (v === 'candidates' ? 'margin' : 'candidates'))}
                  style={{
                    pointerEvents: 'auto',
                    display: 'inline-flex', padding: '8px 0', margin: '-8px 0', background: 'none', border: 'none', cursor: 'pointer',
                  }}
                >
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '6px 12px',
                    background: 'rgba(255,255,255,.95)', border: `1px solid ${BORDER}`, boxShadow: '0 2px 8px rgba(12,14,18,.12)',
                    color: INK, fontFamily: MANROPE, fontSize: 12.5, fontWeight: 800, whiteSpace: 'nowrap',
                  }}>
                    {view === 'candidates' ? 'View 2023 map' : 'View who’s standing'}
                  </span>
                </button>
              )}
              {selected && (
                <span style={{
                  pointerEvents: 'auto', maxWidth: '100%', boxSizing: 'border-box',
                  display: 'inline-block', borderRadius: 999, padding: '6px 13px',
                  background: JADE, border: `1px solid ${JADE}`, boxShadow: '0 2px 8px rgba(12,14,18,.12)',
                  color: '#fff', fontFamily: MANROPE, fontSize: 13.5, fontWeight: 800,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {selected}
                </span>
              )}
            </div>
          )}

          {/* Legend. left/bottom live in MAP_LEGEND_CSS so the media query can
              clear the Leaflet attribution strip; inline values would beat it. */}
          <style dangerouslySetInnerHTML={{ __html: MAP_LEGEND_CSS }} />
          {/* The key follows the colouring. The "2023 margin" key only shows in
              the margin view now — by request it isn't on the map by default. */}
          {status === 'ready' && data && view === 'candidates' && (
            <div className="map-legend" style={{ position: 'absolute', zIndex: 1000, background: 'rgba(255,255,255,.95)', border: `1px solid ${BORDER}`, borderRadius: 12, boxShadow: '0 2px 8px rgba(12,14,18,.12)' }}>
              <div className="map-legend-title" style={{ fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>Number of candidates running</div>
              <div className="map-legend-items">
                {COUNT_TIERS.map((t) => (
                  <div key={t.key} className="map-legend-row" style={{ display: 'flex', alignItems: 'center', color: SECONDARY, fontFamily: MANROPE }}>
                    <span className="map-legend-dot" style={{ borderRadius: 3, background: t.color, flexShrink: 0 }} />{t.label}
                  </div>
                ))}
                {/* In the grid with the tiers now, by request, with no rule
                    above it: the key is two rows instead of four. */}
                <div className="map-legend-row" style={{ display: 'flex', alignItems: 'center', color: TERTIARY, fontFamily: MANROPE, whiteSpace: 'nowrap' }}>
                  <span className="map-legend-dot" style={{ borderRadius: 3, background: NONE_YET.color, flexShrink: 0 }} />{NONE_YET.label}
                </div>
              </div>
            </div>
          )}
          {status === 'ready' && data && view === 'margin' && (
            <div className="map-legend" style={{ position: 'absolute', zIndex: 1000, background: 'rgba(255,255,255,.95)', border: `1px solid ${BORDER}`, borderRadius: 12, boxShadow: '0 2px 8px rgba(12,14,18,.12)' }}>
              <div className="map-legend-title" style={{ fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>2023 margin</div>
              <div className="map-legend-items">
                {MARGIN_TIERS.map((t) => (
                  <div key={t.key} className="map-legend-row" style={{ display: 'flex', alignItems: 'center', color: SECONDARY, fontFamily: MANROPE }}>
                    <span className="map-legend-dot" style={{ borderRadius: 3, background: t.color, flexShrink: 0 }} />{t.label}
                  </div>
                ))}
                {/* Two seats are drawn in #d8d5cf on this map and the key said
                    nothing about them, while /map's key has had a "Data
                    pending" row all along (§1.4, §1.5). */}
                <div className="map-legend-row" style={{ display: 'flex', alignItems: 'center', color: TERTIARY, fontFamily: MANROPE }}>
                  <span className="map-legend-dot" style={{ borderRadius: 3, background: UNKNOWN_TIER.color, flexShrink: 0 }} />{UNKNOWN_TIER.label}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel. One implementation: the prompt and the selection were built
            twice in this file, once for a branch that no longer exists. */}
        <div ref={panelRef} className="bg-map-panel" style={{ fontFamily: MANROPE, minHeight: 0 }}>
          {!selected ? (
            // Empty state. Hidden on phones by request (.bg-map-prompt-empty in
            // GRID_CSS): there the panel stacks UNDER the map, so this was a
            // 150px box saying "tap a seat" directly below a map whose own
            // description, just above it, already says "Tap an area on the map".
            // Kept beside the map on a desktop, where the column would
            // otherwise be a blank 340px strip.
            <Prompt empty />
          ) : info && tier ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', minHeight: 0 }}>
              {/* key={selected}: the "Last election" reveal closes again when
                  a different seat is tapped, rather than carrying over. */}
              <SeatCard key={selected} name={selected} slug={selectedKey ?? ''} info={info} tier={tier} mp={mp} candidates={selectedKey ? candidatesBySlug?.[selectedKey] : undefined} only2023={only2023} />
            </div>
          ) : (
            /* §1.5, and the true gap named. The old copy said "MP data pending
               … once verified against the Electoral Commission's official 2023
               results", which promises verification work that is already done:
               every row in electorates-data is `verified: true`. This branch
               only fires when a GeoJSON name does not normalise onto a record. */
            <Prompt message="We could not match this boundary to an electorate record." />
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Who is standing in 2026 — the lead of the panel now, by request.
 *
 * It sat UNDER the 2023 result as a plain name list. The panel's job on the
 * Election Centre is "who can I vote for here", so the candidates come first
 * and wear the homepage caucus box's row (party-electorates.tsx): a white
 * card per person, face on the left, name over party, 44px tall, 5px apart,
 * inside one light container with a counted heading and a rule under it.
 * Same object, seen twice, reads as the same tool (§1.4).
 *
 * `candidates` being undefined and being empty mean different things and must
 * not render the same. 361 approved candidates cover 59 of 72 electorates, so
 * for thirteen seats we hold nothing, and a heading over an empty list reads
 * as "nobody is standing", which is false and the worse of the two errors.
 */
function Candidates({ candidates, seatName, seatSlug }: { candidates?: Candidate2026[]; seatName: string; seatSlug: string }) {
  // The candidate whose preview is open, if any. One at a time.
  const [open, setOpen] = React.useState<Candidate2026 | null>(null)
  // Withdrawn candidates stay visible and marked, per the field's note in
  // candidates-2026.ts: quietly dropping one rewrites the record of a contest.
  // They don't count towards the number in the heading, though: that number
  // is who is standing, and it has to match the map's shading.
  const standing = (candidates ?? []).filter((c) => !c.withdrawn).length

  // A plain-words title under the area's name, by request ("seat" read as one
  // of several places up for grabs; one person wins each electorate, and
  // "local MP" is the menu's word), with the count
  // kept as a small line under it (the number has to match the map's shading).
  const heading = (
    <div style={{ borderBottom: `1.5px solid ${BORDER}`, paddingBottom: 8, marginBottom: 10 }}>
      <h4 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, lineHeight: 1.25, margin: 0 }}>
        Who&rsquo;s running to be your local MP
      </h4>
      {candidates?.length ? (
        <div style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 2 }}>{standing} standing in 2026</div>
      ) : null}
    </div>
  )

  if (!candidates?.length) {
    // The date is read from the Commission's timetable, not typed. It was
    // typed, as "16 October", and the timetable says 8 October — a closing
    // date on a candidate list is exactly the fact this site can't get wrong.
    const close = milestone('nominations-close-2026')?.date
    return (
      <div>
        {heading}
        <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>
          None recorded yet.{close ? ` Nominations close ${longDate(close)}.` : ''} We add candidates as they are announced.
        </p>
      </div>
    )
  }

  // No inner box any more, by request: the rows sit straight in the seat
  // card with the count as their heading, rather than a card inside a card.
  return (
    <div>
      {heading}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {candidates.map((c) => {
          const party = c.party !== 'independent' ? c.party : undefined
          const photo = c.mpSlug ? MP_PROFILES[c.mpSlug]?.photo : undefined
          const partyName = c.party === 'independent' ? 'Independent' : PARTY_NAMES[c.party]?.short ?? c.party
          return (
            // A button, not a link, by request: tapping opens a preview over
            // the page rather than leaving it — the caucus box's behaviour.
            <button key={c.key ?? c.name} type="button" onClick={() => setOpen(c)} aria-haspopup="dialog" style={{
              display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, width: '100%', height: 44, boxSizing: 'border-box',
              border: '1px solid #00000014', background: '#fff', borderRadius: 9, padding: '4px 8px 4px 4px',
              opacity: c.withdrawn ? 0.55 : 1, textAlign: 'left', cursor: 'pointer', font: 'inherit',
            }}>
              <Avatar src={photo} name={c.name} party={party} size="xs" face />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.name}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: party ? PARTY_COLORS[party].bg : TERTIARY, flexShrink: 0 }} />
                  {partyName}
                  {c.incumbent ? ' · sitting MP' : ''}
                  {c.withdrawn ? ' · withdrawn' : ''}
                </span>
              </span>
            </button>
          )
        })}
      </div>
      {open && <CandidatePreview candidate={open} seatName={seatName} seatSlug={seatSlug} onClose={() => setOpen(null)} />}
    </div>
  )
}

/**
 * §2.4's container, at the size a 340px column allows.
 *
 * Order, by request: the seat, who is standing, then the way to the seat
 * page. What happened in 2023 — who won, their party then, the majority, and
 * the 2023 MP's photo tile that used to sit under this card — is behind a
 * "Last election" button between the two. It was the first thing the panel
 * said, above the candidates, on a page whose reader is asking who they can
 * vote for NOW.
 */
function SeatCard({ name, slug, info, tier, mp, candidates, only2023 = false }: {
  only2023?: boolean
  name: string
  slug: string
  info: ElectorateInfo
  tier: MarginTier
  mp: React.ComponentProps<typeof MpPhotoTile>['mp']
  candidates?: Candidate2026[]
}) {
  const [showLast, setShowLast] = React.useState(false)
  // On the 2023 results page the 2023 facts ARE the card, so they're open
  // and there's nothing to toggle.
  const last = only2023 || showLast
  return (
    <div style={{
      border: `1px solid ${BORDER}`, borderRadius: 16, padding: 'clamp(14px, 2.5vw, 20px)',
      boxShadow: '0 1px 2px rgba(0,0,0,.03), 0 20px 40px -34px rgba(0,0,0,.4)',
      display: 'flex', flexDirection: 'column', flexShrink: 0, background: '#fff',
    }}>
      {/* The area's name as a big green pill, by request, so a tap lands on
          an unmistakable answer to "which area is this?". Brand jade, the
          logo's green. */}
      <h3 style={{
        alignSelf: 'flex-start', maxWidth: '100%', boxSizing: 'border-box',
        fontSize: 'clamp(20px, 5.4vw, 24px)', fontWeight: 800, letterSpacing: '-.015em', lineHeight: 1.15,
        color: '#fff', background: JADE, borderRadius: 999, padding: '10px 20px', margin: '0 0 14px', fontFamily: MANROPE,
      }}>{name}</h3>
      {/* The margin badge ("Ultra-marginal") and "General electorate" line
          came off the 2026 card, by request: the title below says what the
          card is for. The 2023 map keeps them, since that map is shaded by
          the margin and the badge is its key. */}
      {only2023 && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14, marginTop: -4 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: tier.fg, background: tier.light, border: `1px solid ${tier.color}`, borderRadius: 999, padding: '3px 10px', fontFamily: MANROPE }}>{tier.label}</span>
        <span style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE }}>{info.type === 'maori' ? 'Māori electorate' : 'General electorate'}{info.region ? ` · ${info.region}` : ''}</span>
      </div>}

      {!only2023 && <Candidates candidates={candidates} seatName={name} seatSlug={slug} />}

      {/* §3.1: the button is the 44px hit area. */}
      {!only2023 && <button
        type="button"
        onClick={() => setShowLast((v) => !v)}
        aria-expanded={showLast}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
          marginTop: 12, padding: '10px 2px', background: 'none', border: 'none', borderTop: `1px solid ${BORDER}`,
          cursor: 'pointer', fontFamily: MANROPE, fontSize: 13, fontWeight: 800, color: INK,
        }}
      >
        Last election
        <ChevronDown style={{ width: 16, height: 16, color: SECONDARY, transform: showLast ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }} strokeWidth={2.5} />
      </button>}
      {last && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 4 }}>
          {/* Two labels because there are two facts. The pages used four names
              for one field ("Electorate MP", "2023 winner", "Your electorate MP",
              "Electorate MP · 2023 result") and got the distinction wrong twice:
              `info.party` is who WON in 2023, and two MPs have changed party
              since. Here the label says 2023, so the value is right. */}
          <MetaRow label="Won in 2023" value={info.mpName ?? 'Not on record'} />
          <MetaRow label="Party then" value={info.party ? PARTY_NAMES[info.party].short : 'Not on record'} color={info.party ? PARTY_COLORS[info.party].bg : undefined} />
          <MetaRow label="2023 majority" value={info.majority != null ? info.majority.toLocaleString('en-NZ') : 'Not on record'} />
          <MpPhotoTile name={info.mpName ?? 'To be confirmed'} party={info.party ?? undefined} mp={mp} caption="2023 MP" />
          {/* §4: the numbers above age, so the panel says where they came from. */}
          <p style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE, margin: 0 }}>Electoral Commission 2023 official results</p>
        </div>
      )}

      {/* The seat pages are about the 2026 race, so the 2023 copy of the
          map doesn't send people there. */}
      {!only2023 && (
        <Link href={`/battlegrounds/${slug}`} style={{ marginTop: 12, textDecoration: 'none' }}>
          {/* The Election Centre's "Enrol now" pill, by request (was a
              solid near-black block): jade outline, jade text, leading
              icon, arrow. A touch larger, since it spans the card. */}
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', boxSizing: 'border-box',
            color: JADE, background: 'transparent', border: `1.5px solid ${JADE}`, borderRadius: 999,
            padding: '10px 16px', fontSize: 13.5, fontWeight: 800, fontFamily: MANROPE, whiteSpace: 'nowrap',
          }}>
            <MapPin style={{ width: 14, height: 14, flexShrink: 0 }} />
            Open this seat <ArrowRight style={{ width: 15, height: 15, flexShrink: 0 }} strokeWidth={3} />
          </span>
        </Link>
      )}
    </div>
  )
}

/** One prompt, used by the empty state and the unmatched-boundary state.
 *  It reserved 300px before, which is a third of a phone screen spent telling
 *  the reader to do the thing they can already see. A prompt is a prompt. */
function Prompt({ message, empty = false }: { message?: string; empty?: boolean }) {
  return (
    <div className={empty ? 'bg-map-prompt bg-map-prompt-empty' : 'bg-map-prompt'} style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: `1px solid ${BORDER}`, borderRadius: 16, background: SURFACE, padding: 20, color: TERTIARY, fontFamily: MANROPE }}>
      <ShieldCheck style={{ width: 26, height: 26, color: JADE, marginBottom: 10 }} />
      <div style={{ fontSize: 14, fontWeight: 700, color: SECONDARY }}>{message ? 'No record for this boundary' : 'Tap a seat'}</div>
      {/* What the colours mean is said once, in the (i) beside the page title.
          It was on this screen three times: here, in the second copy of this
          same prompt, and in the hero standfirst (§1.3). */}
      <div style={{ fontSize: 12.5, marginTop: 4, maxWidth: 240, lineHeight: 1.5 }}>{message ?? 'Every seat opens its own page.'}</div>
    </div>
  )
}

/* Scoped to this component (§3.2). The heights match /map's exactly, because
   it is the same map: 460px on a phone, where a taller one pushed the answer
   below the fold, and clamp(520px, 70vh, 700px) above 880px, where the panel
   sits beside it and height costs nothing. It used to be 600px here and
   clamp(600px, 82vh, 840px) there, overridden to 440px and 585px on phones
   (§1.4). */
const GRID_CSS = `
/* A little shorter, by request (was clamp(520px, 70vh, 700px), 460 on a phone). */
.bg-map-box { height: clamp(480px, 64vh, 640px); }
.bg-map-panel { height: clamp(480px, 64vh, 640px); overflow-y: auto; }
@media (max-width: 880px) {
  .bg-map-grid { grid-template-columns: 1fr !important; }
  .bg-map-box { height: 400px; }
  .bg-map-panel { height: auto; overflow-y: visible; }
  .bg-map-prompt { min-height: 150px; }
  .bg-map-prompt-empty { display: none !important; }
}
`
