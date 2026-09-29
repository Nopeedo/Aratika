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
import { ArrowRight, ShieldCheck } from 'lucide-react'
import type { FeatureCollection } from 'geojson'
import { normalizeElectorateKey, getElectorate, ELECTORATES, type ElectorateInfo } from '@/constants/electorates-data'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import type { Candidate2026 } from '@/constants/candidates-2026'
import { MP_PROFILES } from '@/constants/mps-data'
import { toSlug } from '@/lib/utils/format'
import { MpPhotoTile } from '@/components/map/mp-photo-tile'
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
 * A warm sequential scale (tan to espresso), not a hue per tier: this is a
 * quantity, and light-to-dark reads as "more" without a key. Brown is also the
 * one family on this site that isn't a party colour (§1.6) — any blue would
 * read as National, green as the Greens.
 *
 * "None announced yet" is a fact about OUR records, not about the seat —
 * nominations are still open — so it wears the same neutral grey the margin
 * view uses for "Result pending", and the legend names it plainly (§1.5).
 */
const COUNT_TIERS: { key: string; label: string; min: number; color: string }[] = [
  { key: 'many', label: '7 or more standing', min: 7, color: '#6e4220' },
  { key: 'mid',  label: '5–6 standing',       min: 5, color: '#b07a45' },
  { key: 'few',  label: '1–4 standing',       min: 1, color: '#d9b98f' },
]
const NONE_YET = { key: 'none', label: 'None announced yet', color: '#d8d5cf' }

function countTier(n: number) {
  return COUNT_TIERS.find((t) => n >= t.min) ?? NONE_YET
}

export function BattlegroundsMap({ candidatesBySlug, defaultView = 'margin' }: {
  candidatesBySlug?: Record<string, Candidate2026[]>
  /**
   * Which colouring the map opens on. /battlegrounds keeps 'margin' — that
   * page is about how close 2023 was. The Election Centre opens on
   * 'candidates' by request, with a toggle to switch.
   */
  defaultView?: MapView
} = {}) {
  const [view, setView] = React.useState<MapView>(defaultView)
  const [layer, setLayer] = React.useState<Roll>('general')
  const [sets, setSets] = React.useState<Record<Roll, FeatureCollection | null>>({ general: null, maori: null })
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>('loading')
  const [selected, setSelected] = React.useState<string | null>(null)

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

  // On narrow screens the panel stacks BELOW the map, so a tap can look like
  // nothing happened. Scroll the selected MP panel into view when a seat is picked.
  const panelRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!selected || typeof window === 'undefined') return
    if (window.matchMedia('(max-width: 880px)').matches) {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selected])

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: GRID_CSS }} />

      {/* The caption that stood beside this row ("The two rolls cover the same
          land, so view one at a time") is inside <RollPills>'s own (i), where
          /map gets it too. The same control was explained on one page and left
          bare on the other (§1.2, §1.4). */}
      {/* What the map is coloured by — by request, a toggle above the map.
          Same §2.2 pill treatment as every other pill row on the site
          (lit = #efece5 on INK), and the §3.1 hit-area/pill split. Its own
          row, above the roll pills: they answer different questions (what
          the colours mean vs which roll you're looking at). */}
      <div role="group" aria-label="Colour the map by" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {([['candidates', 'Who’s standing'], ['margin', '2023 margin']] as [MapView, string][]).map(([key, label]) => {
          const on = view === key
          return (
            <button key={key} type="button" onClick={() => setView(key)} aria-pressed={on}
              style={{ display: 'inline-flex', padding: '8px 0', margin: '-8px 0', background: 'none', border: 'none', cursor: 'pointer' }}>
              <span className="status-pill" style={{
                display: 'inline-flex', alignItems: 'center', borderRadius: 999,
                background: on ? '#efece5' : '#fff', border: `2px solid ${on ? INK : BORDER}`,
                color: INK, fontFamily: MANROPE, fontWeight: 800, whiteSpace: 'nowrap',
                transition: 'background-color .2s ease, border-color .2s ease',
              }}>{label}</span>
            </button>
          )
        })}
      </div>

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

          {/* Legend. left/bottom live in MAP_LEGEND_CSS so the media query can
              clear the Leaflet attribution strip; inline values would beat it. */}
          <style dangerouslySetInnerHTML={{ __html: MAP_LEGEND_CSS }} />
          {/* The key follows the colouring. The "2023 margin" key only shows in
              the margin view now — by request it isn't on the map by default. */}
          {status === 'ready' && data && view === 'candidates' && (
            <div className="map-legend" style={{ position: 'absolute', zIndex: 1000, background: 'rgba(255,255,255,.95)', border: `1px solid ${BORDER}`, borderRadius: 12, boxShadow: '0 2px 8px rgba(12,14,18,.12)' }}>
              <div className="map-legend-title" style={{ fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>2026 candidates</div>
              <div className="map-legend-items">
                {COUNT_TIERS.map((t) => (
                  <div key={t.key} className="map-legend-row" style={{ display: 'flex', alignItems: 'center', color: SECONDARY, fontFamily: MANROPE }}>
                    <span className="map-legend-dot" style={{ borderRadius: 3, background: t.color, flexShrink: 0 }} />{t.label}
                  </div>
                ))}
                <div className="map-legend-row map-legend-note" style={{ display: 'flex', alignItems: 'center', color: TERTIARY, fontFamily: MANROPE, borderTop: `1px solid ${BORDER}` }}>
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
                <div className="map-legend-row map-legend-note" style={{ display: 'flex', alignItems: 'center', color: TERTIARY, fontFamily: MANROPE, borderTop: `1px solid ${BORDER}` }}>
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
            <Prompt />
          ) : info && tier ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', minHeight: 0 }}>
              <SeatCard name={selected} slug={selectedKey ?? ''} info={info} tier={tier} candidates={selectedKey ? candidatesBySlug?.[selectedKey] : undefined} />
              <MpPhotoTile name={info.mpName ?? 'To be confirmed'} party={info.party ?? undefined} mp={mp} caption="2023 MP" fill />
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
 * Who is standing in 2026, under who won in 2023.
 *
 * The three rows above this say what HAPPENED. A reader deciding whether a seat
 * matters wants to know who is contesting it NOW, and until this block the only
 * way to find out was to open the seat page.
 *
 * `candidates` being undefined and being empty mean different things and must
 * not render the same. 361 approved candidates cover 59 of 72 electorates, so
 * for thirteen seats we hold nothing — and a heading over an empty list reads
 * as "nobody is standing", which is false and the worse of the two errors.
 */
function Challengers({ candidates }: { candidates?: Candidate2026[] }) {
  if (!candidates?.length) {
    return (
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>Standing in 2026</div>
        <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, margin: '6px 0 0', lineHeight: 1.5 }}>
          None recorded yet. Nominations close 16 October — we add candidates as they are announced.
        </p>
      </div>
    )
  }
  // Withdrawn candidates stay visible and marked, per the field's note in
  // candidates-2026.ts: quietly dropping one rewrites the record of a contest.
  return (
    <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 8 }}>
        Standing in 2026 · {candidates.length}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {candidates.map((c) => {
          const colour = c.party !== 'independent' ? PARTY_COLORS[c.party]?.bg : TERTIARY
          return (
            <div key={c.key ?? c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: colour, flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: INK, fontFamily: MANROPE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.name}
                {c.withdrawn ? <span style={{ fontWeight: 600, color: TERTIARY }}> · withdrawn</span> : null}
              </span>
              <span style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE, marginLeft: 'auto', flexShrink: 0 }}>
                {c.party === 'independent' ? 'Independent' : PARTY_NAMES[c.party]?.short ?? c.party}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** §2.4's container and row order, at the size a 340px column allows. */
function SeatCard({ name, slug, info, tier, candidates }: {
  name: string
  slug: string
  info: ElectorateInfo
  tier: MarginTier
  candidates?: Candidate2026[]
}) {
  return (
    <div style={{
      border: `1px solid ${BORDER}`, borderRadius: 16, padding: 'clamp(14px, 2.5vw, 20px)',
      boxShadow: '0 1px 2px rgba(0,0,0,.03), 0 20px 40px -34px rgba(0,0,0,.4)',
      display: 'flex', flexDirection: 'column', flexShrink: 0, background: '#fff',
    }}>
      <span style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: tier.fg, background: tier.light, border: `1px solid ${tier.color}`, borderRadius: 999, padding: '3px 10px', marginBottom: 10, fontFamily: MANROPE }}>{tier.label}</span>
      <h3 style={{ fontSize: 'clamp(17px, 2.6vw, 21px)', fontWeight: 800, color: INK, margin: '0 0 2px', fontFamily: MANROPE }}>{name}</h3>
      <div style={{ fontSize: 12.5, color: TERTIARY, marginBottom: 14, fontFamily: MANROPE }}>{info.type === 'maori' ? 'Māori electorate' : 'General electorate'}{info.region ? ` · ${info.region}` : ''}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Two labels because there are two facts. The pages used four names
            for one field ("Electorate MP", "2023 winner", "Your electorate MP",
            "Electorate MP · 2023 result") and got the distinction wrong twice:
            `info.party` is who WON in 2023, and two MPs have changed party
            since. Here the label says 2023, so the value is right. */}
        <MetaRow label="Won in 2023" value={info.mpName ?? 'Not on record'} />
        <MetaRow label="Party then" value={info.party ? PARTY_NAMES[info.party].short : 'Not on record'} color={info.party ? PARTY_COLORS[info.party].bg : undefined} />
        <MetaRow label="2023 majority" value={info.majority != null ? info.majority.toLocaleString('en-NZ') : 'Not on record'} />
      </div>
      <Challengers candidates={candidates} />
      <Link href={`/battlegrounds/${slug}`} style={{ marginTop: 12, textDecoration: 'none' }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', background: INK, borderRadius: 11, padding: '11px 16px', color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: MANROPE }}>Open this seat <ArrowRight style={{ width: 15, height: 15 }} /></span>
      </Link>
      {/* §4: the numbers above age, so the panel says where they came from. */}
      <p style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE, margin: '10px 0 0' }}>Electoral Commission 2023 official results</p>
    </div>
  )
}

/** One prompt, used by the empty state and the unmatched-boundary state.
 *  It reserved 300px before, which is a third of a phone screen spent telling
 *  the reader to do the thing they can already see. A prompt is a prompt. */
function Prompt({ message }: { message?: string }) {
  return (
    <div className="bg-map-prompt" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: `1px solid ${BORDER}`, borderRadius: 16, background: SURFACE, padding: 20, color: TERTIARY, fontFamily: MANROPE }}>
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
.bg-map-box { height: clamp(520px, 70vh, 700px); }
.bg-map-panel { height: clamp(520px, 70vh, 700px); }
@media (max-width: 880px) {
  .bg-map-grid { grid-template-columns: 1fr !important; }
  .bg-map-box { height: 460px; }
  .bg-map-panel { height: auto; }
  .bg-map-prompt { min-height: 150px; }
}
`
