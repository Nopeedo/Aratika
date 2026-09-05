'use client'

/**
 * ThisTerm — what is settled about the 54th Parliament, on the homepage.
 *
 * Sits between the party tiles and the issues: the tiles say who is standing,
 * the issues say what they claim, and this says where things actually stand
 * before any of it changes. Reads the shared party selection, so tapping a tile
 * lights that party's seats without needing a second control.
 *
 * ── The framing, deliberately ──
 *
 * The map shows ELECTORATE SEATS WON IN 2023. It is not "regions a party
 * governs", and on an MMP site that distinction is not pedantry:
 *
 *   - Parties do not govern regions. An electorate returns one MP; a government
 *     is formed from the whole House.
 *   - Around half of Parliament is list MPs, who represent no electorate.
 *     Colouring a map by electorate wins makes the Greens look tiny, a handful
 *     of electorates against their full seat count, and leaves a party with no
 *     electorate wins invisible despite holding seats.
 *
 * So the seat counts lead and the map supports them, never the other way round,
 * and the caveat under the map changes with the selection instead of sitting
 * there as boilerplate nobody reads.
 *
 * ── Why the two layers are a toggle, not a merge ──
 *
 * The first build drew both GeoJSON layers into one FeatureCollection. The
 * seven Māori electorates span the whole country, so they painted straight over
 * the sixty-five general ones and the map became a single red New Zealand. The
 * layers are alternative ways of dividing the same ground, not tiles of it. The
 * toggle follows the selection: tap Te Pāti Māori and the map moves to the
 * layer where their six seats actually are.
 */

import * as React from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { FeatureCollection } from 'geojson'
import { ArrowRight, Info, MapPin } from 'lucide-react'
import { usePartyCycle } from '@/components/homepage/party-cycle'
import { ELECTORATES, getElectorate, normalizeElectorateKey, type ElectorateInfo } from '@/constants/electorates-data'
import { MP_PROFILES } from '@/constants/mps-data'
import { PARTY_COLORS, PARTY_NAMES, CURRENT_SEATS, TOTAL_SEATS, PARTY_STATUS, PARLIAMENTARY_PARTIES } from '@/constants/parties'
import { Avatar } from '@/components/ui/avatar'
import { toSlug } from '@/lib/utils/format'
import type { PartySlug } from '@/types'
import { BORDER, INK, MANROPE, SECONDARY, SURFACE, TERTIARY } from '@/constants/theme'

type Layer = 'general' | 'maori'

// Same boundaries the /map and battlegrounds pages use — the official Stats NZ
// 2020 electorates, already in /public.
const PATHS: Record<Layer, string> = {
  general: '/data/general-electorates-2020.geojson',
  maori: '/data/maori-electorates-2020.geojson',
}

// ssr:false because the map library touches window on import.
const ElectorateMap = dynamic(() => import('@/components/map/electorate-map'), {
  ssr: false,
  loading: () => <MapSkeleton />,
})

const MUTED = '#e6e2da'

function MapSkeleton() {
  return (
    <div style={{ height: '100%', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: SURFACE, fontSize: 13, color: TERTIARY, fontFamily: MANROPE }}>
      Loading the map…
    </div>
  )
}

/**
 * A party colour dark enough to set text in on the paper ground.
 *
 * Party colours are chosen to identify a party on a map, not to be read as
 * type. ACT's yellow is the case that forces this: at 30px on cream it is
 * barely there. Anything already dark passes through untouched, so National's
 * blue and Labour's red are unchanged.
 */
function readable(hex: string): string {
  const m = hex.replace('#', '')
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m
  const n = parseInt(full, 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  if (lum < 0.6) return hex
  const d = (v: number) => Math.round(v * 0.55).toString(16).padStart(2, '0')
  return `#${d(r)}${d(g)}${d(b)}`
}

/** Electorates a party holds, from the same dataset the map colours from, so
 *  the sentence and the picture can never disagree. */
function countElectorates(slug: PartySlug, type?: Layer): number {
  return Object.values(ELECTORATES).filter((e) => e.party === slug && (!type || e.type === type)).length
}

const LAYER_TOTAL: Record<Layer, number> = {
  general: Object.values(ELECTORATES).filter((e) => e.type === 'general').length,
  maori: Object.values(ELECTORATES).filter((e) => e.type === 'maori').length,
}
const ALL_ELECTORATES = LAYER_TOTAL.general + LAYER_TOTAL.maori

export function ThisTerm() {
  const { selectedSlug } = usePartyCycle()
  const sel = (selectedSlug || '') as PartySlug
  const selected = sel && PARTY_NAMES[sel] ? sel : null

  const [layers, setLayers] = React.useState<Partial<Record<Layer, FeatureCollection>>>({})
  const [layer, setLayer] = React.useState<Layer>('general')
  const [failed, setFailed] = React.useState(false)
  /**
   * The electorate the reader has tapped ON THE MAP, by name.
   *
   * The map was drawn but not answerable: every shape was a shape. Tapping one
   * now fills the slot beside it with whoever holds that seat, which is the
   * question a person actually has when they put a finger on a map — not "which
   * party is this colour" but "who is my MP".
   *
   * It takes over the same slot the party's MP list uses rather than opening
   * anything, so the section stays one screen and the reader never loses their
   * place. Tapping the same seat again clears it and the party list returns.
   */
  const [pinned, setPinned] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    Promise.all(
      (Object.keys(PATHS) as Layer[]).map((k) =>
        fetch(PATHS[k]).then((r) => (r.ok ? r.json() : null)).catch(() => null).then((j) => [k, j] as const),
      ),
    ).then((pairs) => {
      if (cancelled) return
      const next: Partial<Record<Layer, FeatureCollection>> = {}
      for (const [k, j] of pairs) if (j) next[k] = j as FeatureCollection
      if (!next.general && !next.maori) { setFailed(true); return }
      setLayers(next)
    })
    return () => { cancelled = true }
  }, [])

  // Follow the selection to the layer that holds most of that party's seats.
  // Te Pāti Māori hold six Māori electorates and no general ones; leaving the
  // map on general would grey the entire country and say nothing true.
  React.useEffect(() => {
    if (!selected) return
    setLayer(countElectorates(selected, 'maori') > countElectorates(selected, 'general') ? 'maori' : 'general')
  }, [selected])

  /**
   * Let go of a pinned seat when the map stops showing it.
   *
   * The two layers are alternative divisions of the same ground, so a general
   * electorate simply is not drawn on the Māori layer. Without this, switching
   * layers — including the automatic switch above when a party is tapped — left
   * a seat panel open describing a shape no longer on screen, and the map's own
   * highlight pointing at nothing.
   */
  React.useEffect(() => {
    setPinned((cur) => (cur && getElectorate(cur)?.type !== layer ? null : cur))
  }, [layer])

  /** The seat the reader tapped, if it resolves to one we hold data for. */
  const pinnedSeat = React.useMemo(() => {
    if (!pinned) return null
    const info = getElectorate(pinned)
    if (!info) return null
    const slug = info.mpSlug ?? (info.mpName ? toSlug(info.mpName) : null)
    const mp = slug ? MP_PROFILES[slug] : undefined
    return {
      info,
      slug,
      mp,
      // Won by info.party in 2023; mp.party is where that MP sits today.
      nowParty: mp && info.party && mp.party !== info.party ? mp.party : null,
    }
  }, [pinned])

  const governing = PARLIAMENTARY_PARTIES.filter((p) => PARTY_STATUS[p] === 'governing')
  const govtSeats = governing.reduce((n, p) => n + (CURRENT_SEATS[p] ?? 0), 0)

  // The selected party's electorates keep their colour; everything else greys
  // out, so the read is "theirs against the rest" rather than six colours at once.
  const colorOf = React.useMemo(
    () => (selected ? (name: string) => (getElectorate(name)?.party === selected ? PARTY_COLORS[selected].bg : MUTED) : undefined),
    [selected],
  )

  const held = selected ? countElectorates(selected) : 0
  const hidden = selected ? countElectorates(selected, layer === 'general' ? 'maori' : 'general') : 0
  const data = layers[layer]

  // The faces behind the shapes. Built from the SAME dataset the map colours
  // from, never from the MP roster, so the list can only ever name someone the
  // map has actually shaded — the count in the caveat and the rows in the list
  // are two readings of one row set.
  //
  // The MP's profile slug is resolved exactly the way the map panel and the
  // battlegrounds list resolve it: an explicit mpSlug when the row carries one,
  // otherwise derived from the name. A row whose MP has no profile yet still
  // renders — it just doesn't link, rather than sending the reader to a 404.
  //
  // Sorted by the layer currently on screen first, so the five shown are five
  // the reader can actually see; the general/Māori toggle re-orders the list
  // with the map instead of leaving it pointing at seats that aren't drawn.
  const electorateMPs = React.useMemo(() => {
    if (!selected) return []
    return Object.values(ELECTORATES)
      .filter((e) => e.party === selected && e.mpName)
      .map((e) => {
        const slug = e.mpSlug ?? toSlug(e.mpName!)
        const mp = MP_PROFILES[slug]
        // The seat was won by `selected` in 2023; `mp.party` is where that MP
        // sits today. When they disagree the MP has left the party since the
        // election, and the row says so rather than filing them under a party
        // they have resigned from.
        return { electorate: e.name, type: e.type, name: e.mpName!, mp, slug, nowParty: mp && mp.party !== selected ? mp.party : null }
      })
      .sort((a, b) => (a.type === layer ? 0 : 1) - (b.type === layer ? 0 : 1) || a.electorate.localeCompare(b.electorate))
  }, [selected, layer])

  // Five, then a door. Enough to show the list is real and to recognise a face,
  // short enough that the section stays one screen — the whole point of cutting
  // the seat bars that used to sit here.
  const SHOWN = 5
  const shownMPs = electorateMPs.slice(0, SHOWN)

  // The "see all" count comes from the MP roster, NOT from CURRENT_SEATS, because
  // the roster is what /mps actually renders — a link promising 6 that opens on 4
  // is a broken link even though it returns 200.
  //
  // The two can differ, and legitimately: CURRENT_SEATS and electorates-data.ts
  // record the seats as WON IN 2023, while the roster records who sits for which
  // party TODAY. Te Pāti Māori won six electorates; two of those MPs (Tākuta
  // Ferris, Mariameno Kapa-Kingi) now sit as independents, so the roster has four.
  // Both numbers are true about different questions, and the row-level "now
  // independent" note below is what makes the arithmetic legible instead of
  // looking like a bug.
  const rosterCount = React.useMemo(() => {
    const n: Partial<Record<PartySlug, number>> = {}
    for (const mp of Object.values(MP_PROFILES)) n[mp.party] = (n[mp.party] ?? 0) + 1
    return n
  }, [])
  const partyMPs = selected ? rosterCount[selected] ?? 0 : 0

  return (
    <section style={{ background: 'transparent' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '8px clamp(18px, 5vw, 36px) 56px' }}>
        {/* Two columns of comparable weight, tops aligned.
            The heading used to span the full width above the grid, which left a
            wide empty band beside the intro and made the section read as pushed
            to the left with a map floating off the right edge. The words and the
            numbers now share one column, against the map in the other. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(330px, 100%), 1fr))', gap: 'clamp(24px, 4vw, 44px)', alignItems: 'start' }}>
          <div>
            <div style={{ marginBottom: 6, fontSize: 12.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>
              This term
            </div>
            <h2 style={{ fontSize: 'clamp(24px,3.6vw,31px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: '0 0 8px' }}>
              Where things stand now
            </h2>
            {/* Two tenses on purpose. The map is 2023 — the boundaries and the
                wins that formed this Parliament — but the MP list beside it
                names the CURRENT holder of each seat, because electorates-data.ts
                tracks by-elections (Tāmaki Makaurau changed hands in 2025). The
                old line said only "as the 2023 election left it", which the list
                would have quietly contradicted. */}
            <p style={{ fontSize: 15.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 24px', lineHeight: 1.55 }}>
              The 54th Parliament: the seats won in 2023, and the MPs holding them now. Tap a party tile to see which
              electorates are theirs, or tap any seat on the map to see who holds it.
            </p>

            {/* The one seat fact the tiles DON'T already give you: who adds up
                to a majority. The per-party bar chart that used to sit here was
                a second telling of the big seat number in the party panel
                above, so it went; the coalition arithmetic is the part the
                tiles cannot show, because it is about parties together. */}
            <div style={{ fontSize: 14.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55 }}>
              <b style={{ color: INK }}>{governing.map((p) => PARTY_NAMES[p].short).join(', ')}</b> form the government
              with <b style={{ color: INK }}>{govtSeats}</b> of {TOTAL_SEATS} seats.
            </div>

            {/* Who the shapes on the map actually are.
                This slot used to hold a per-party seat bar chart and two CTAs.
                The bars were a second telling of the seat number the party
                panel already gives you, and both CTAs were dead ends for a
                signed-out reader — /parliament is gated to Phase 2
                (constants/features.ts) so proxy.ts bounced it to /coming-soon,
                and /record is the private, login-gated accountability hub. What
                replaces them is the one thing the map cannot say on its own: a
                coloured polygon has a name and a face attached to it.
                Any link added back here must be live in the current phase. */}
            <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${BORDER}` }}>
              {pinnedSeat ? (
                // A tapped seat wins the slot. The reader pointed at something
                // specific, and answering the party question instead would be
                // answering a question they did not ask.
                <SeatPanel seat={pinnedSeat} onClear={() => setPinned(null)} />
              ) : !selected ? (
                // Nothing selected yet — the tiles auto-cycle until the reader
                // taps one, so this is the resting state, and it says what the
                // tap will do rather than sitting empty.
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <MapPin style={{ width: 15, height: 15, color: TERTIARY, flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
                    Tap a party tile and the electorates they won light up on the map, with the MPs who hold them
                    listed here. Or tap a seat on the map to see who holds that one.
                  </p>
                </div>
              ) : held === 0 ? (
                // A party can hold real seats and win no electorate at all —
                // NZ First's whole caucus came in on the party vote. Saying so
                // here, in the place a reader is looking for names, is the
                // difference between "we have no data" and "this is MMP".
                //
                // Keyed off `held` (electorates won) rather than off the length
                // of the list: electorates-data.ts can carry a verified win whose
                // MP name is still pending, and "None." would then be a claim
                // about MMP that the data does not support. That case falls
                // through to the branch below instead.
                <>
                  <div style={{ ...colLabel, marginBottom: 8 }}>{PARTY_NAMES[selected].short} electorates won</div>
                  <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 14px', lineHeight: 1.55 }}>
                    <b style={{ color: INK }}>None.</b> All {partyMPs} of {PARTY_NAMES[selected].short}&rsquo;s MPs came
                    in on the party vote rather than by winning a seat, which under MMP is an ordinary way to be in
                    Parliament, not a smaller one.
                  </p>
                  <SeeAll slug={selected} count={partyMPs} />
                </>
              ) : (
                <>
                  <div style={{ ...colLabel, marginBottom: 10 }}>
                    {PARTY_NAMES[selected].short} electorates won
                    {electorateMPs.length > SHOWN && (
                      <span style={{ fontWeight: 700, color: TERTIARY, letterSpacing: 0, textTransform: 'none' }}>
                        {' '}&middot; {SHOWN} of {electorateMPs.length}
                      </span>
                    )}
                  </div>
                  {shownMPs.length === 0 && (
                    // held > 0 but no names yet — the file's own "never guess a
                    // seat holder" rule. Say that, don't render a blank list.
                    <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 14px', lineHeight: 1.55 }}>
                      The MPs holding {PARTY_NAMES[selected].short}&rsquo;s {held === 1 ? 'seat' : `${held} seats`} are
                      still being verified against the official results.
                    </p>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {shownMPs.map((row, i) => {
                      const inner = (
                        <>
                          <Avatar name={row.name} party={selected} src={row.mp?.photo} size="sm" face />
                          <span style={{ minWidth: 0, flex: 1 }}>
                            <span className="mp-row-name" style={{ display: 'block', fontSize: 14, fontWeight: 700, color: INK, fontFamily: MANROPE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {row.name}
                            </span>
                            <span style={{ display: 'block', fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {row.electorate}{row.type === 'maori' ? ' · Māori electorate' : ''}
                              {row.nowParty && (
                                <span style={{ color: TERTIARY }}>
                                  {' '}&middot; now {PARTY_NAMES[row.nowParty]?.short ?? 'independent'}
                                </span>
                              )}
                            </span>
                          </span>
                          {row.mp && <ArrowRight className="mp-row-arrow" style={{ width: 14, height: 14, color: TERTIARY, flexShrink: 0 }} />}
                        </>
                      )
                      const style: React.CSSProperties = {
                        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px', margin: '0 -8px',
                        borderRadius: 8,
                        borderTop: i === 0 ? 'none' : `1px solid ${BORDER}`, textDecoration: 'none',
                      }
                      // The whole row is the link where there is a profile to
                      // link to; where there isn't, the row still shows the MP
                      // and the seat rather than being dropped from the list.
                      return row.mp
                        ? <Link key={row.electorate} href={`/mps/${row.slug}`} className="mp-row" style={style}>{inner}</Link>
                        : <div key={row.electorate} style={style}>{inner}</div>
                    })}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <SeeAll slug={selected} count={partyMPs} />
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap', minHeight: 26 }}>
              <div style={colLabel}>Electorates won in 2023</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['general', 'maori'] as Layer[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setLayer(k)}
                    aria-pressed={layer === k}
                    style={{
                      padding: '4px 10px', borderRadius: 999, cursor: 'pointer', fontFamily: MANROPE,
                      fontSize: 12, fontWeight: 700,
                      border: `1px solid ${layer === k ? INK : BORDER}`,
                      background: layer === k ? INK : 'transparent',
                      color: layer === k ? '#fff' : SECONDARY,
                    }}
                  >
                    {k === 'general' ? 'General' : 'Māori'} {LAYER_TOTAL[k]}
                  </button>
                ))}
              </div>
            </div>

            {/* isolation, and a definite height.
                - Leaflet puts its panes at z-index 400 and its zoom control at
                  800. The map container makes no stacking context of its own, so
                  those competed in the page's root context and painted straight
                  over the fixed party-tile bar (z-index 45) on scroll. Isolating
                  the wrapper caps the whole map at this element's own level.
                - height, not minHeight: ElectorateMap's container is height:100%,
                  which resolves against nothing on an auto-height parent. The map
                  mounted, drew every polygon and basemap tile, and painted a
                  blank white box because it measured 0px tall. */}
            <div style={{ isolation: 'isolate', position: 'relative', zIndex: 0, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', background: '#fff', height: 'clamp(300px, 34vw, 420px)' }}>
              {failed ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center', fontSize: 13, color: SECONDARY, fontFamily: MANROPE }}>
                  The boundary data didn&rsquo;t load. The seat counts beside this are unaffected.
                </div>
              ) : data ? (
                // key on the layer so Leaflet rebuilds rather than merging the
                // two boundary sets. scrollZoom off: an inline embed should not
                // trap the page scroll.
                <ElectorateMap
                  key={layer}
                  data={data}
                  selectedKey={pinned ? normalizeElectorateKey(pinned) : null}
                  // Tapping the seat already open closes it, so the map is a
                  // toggle rather than a one-way trip into a state with no exit.
                  onSelect={(name) => setPinned((cur) => (cur === name ? null : name))}
                  colorOf={colorOf}
                  scrollZoom={false}
                  fitToData
                />
              ) : (
                <MapSkeleton />
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Info style={{ width: 14, height: 14, color: TERTIARY, flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
                {selected && held === 0 ? (
                  // Deliberately short: the reason a party can hold seats and no
                  // electorate is stated in full in the MP list beside this, and
                  // saying it twice on one screen reads as a hedge. This sentence
                  // is about the picture only — why nothing is shaded.
                  <>
                    Nothing is shaded because <b style={{ color: INK }}>{PARTY_NAMES[selected].short} won no
                    electorates</b> in 2023. Their {CURRENT_SEATS[selected] ?? 0} seats came from the party vote,
                    which no map can show.
                  </>
                ) : selected && held === (CURRENT_SEATS[selected] ?? 0) ? (
                  // Rare, and worth its own sentence: Te Pāti Māori's six seats
                  // are six electorate wins, so "the rest came from the party
                  // vote" would be describing a difference of zero.
                  <>
                    {PARTY_NAMES[selected].short} won <b style={{ color: INK }}>{held}</b> of {ALL_ELECTORATES} electorates
                    and holds <b style={{ color: INK }}>{CURRENT_SEATS[selected] ?? 0}</b> seats, every one of them won
                    in an electorate.
                  </>
                ) : selected ? (
                  <>
                    {PARTY_NAMES[selected].short} won <b style={{ color: INK }}>{held}</b> of {ALL_ELECTORATES} electorates
                    and holds <b style={{ color: INK }}>{CURRENT_SEATS[selected] ?? 0}</b> seats. The rest came from the
                    party vote, which no map can show.
                    {hidden > 0 && ` ${hidden === 1 ? 'One of those electorates is' : `${hidden} of those electorates are`} on the other layer.`}
                  </>
                ) : (
                  <>
                    Electorate wins only. Around half of Parliament is list MPs, who represent no electorate. The seat
                    counts beside this map are the measure of a party&rsquo;s size.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** The door out of the five. Goes to the MP directory pre-filtered to this
 *  party (/mps?party=<slug>) rather than to /parties/<slug>, which carries the
 *  party's values and policy but deliberately no caucus list. Both `mps` and
 *  `parties` are Phase 1 features, so neither is a gated route. */
function SeeAll({ slug, count }: { slug: PartySlug; count: number }) {
  return (
    <Link
      href={`/mps?party=${slug}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, color: INK, fontFamily: MANROPE, textDecoration: 'none' }}
    >
      See all {count} {PARTY_NAMES[slug].short} MPs
      <ArrowRight style={{ width: 14, height: 14 }} />
    </Link>
  )
}

/**
 * SeatPanel — one tapped electorate, and who holds it.
 *
 * The map could be coloured and read but not asked. This answers the question a
 * person actually has with a finger on a map: not "which party is this colour"
 * but "who is my MP". It takes the same slot as the party MP list, so tapping a
 * shape never opens a page or scrolls the reader away from the thing they
 * tapped.
 *
 * Every field is drawn from electorates-data.ts, whose rule is that a seat
 * holder is never guessed. So there are three honest states here, not one: a
 * verified MP with a profile, a verified MP without one yet (named, not linked,
 * rather than dropped), and a seat whose holder is still being checked (said
 * plainly instead of rendering a blank card).
 */
function SeatPanel({
  seat, onClear,
}: {
  seat: { info: ElectorateInfo; slug: string | null; mp: { photo?: string } | undefined; nowParty: PartySlug | null }
  onClear: () => void
}) {
  const { info, slug, mp, nowParty } = seat
  const wonBy = info.party
  // Darkened where the party's own colour is too light to read as 30px text on
  // paper — ACT's #F5C518 sets Epsom's majority in bright yellow otherwise.
  // Same treatment the election-hub seat numbers get.
  const accent = wonBy ? readable(PARTY_COLORS[wonBy].bg) : TERTIARY

  /** The MP block. Same content at both sizes; only the scale changes. */
  const person = (big: boolean) => (
    <>
      <Avatar name={info.mpName ?? info.name} party={wonBy ?? undefined} src={mp?.photo} size={big ? 'xl' : 'sm'} face />
      <span style={{ minWidth: 0, flex: 1 }}>
        <span
          className={`mp-row-name${big ? ' seat-name' : ''}`}
          style={{ display: 'block', fontSize: big ? undefined : 15, fontWeight: 800, color: INK, fontFamily: MANROPE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {info.mpName}
        </span>
        <span className={big ? 'seat-meta' : undefined} style={{ display: 'block', fontSize: big ? undefined : 12.5, color: SECONDARY, fontFamily: MANROPE }}>
          {wonBy ? PARTY_NAMES[wonBy].short : 'Party not yet verified'}
          {nowParty && <span style={{ color: TERTIARY }}> &middot; now {PARTY_NAMES[nowParty]?.short ?? 'independent'}</span>}
          {big && <> &middot; MP for {info.name}</>}
        </span>
      </span>
      {!big && slug && mp && <ArrowRight className="mp-row-arrow" style={{ width: 14, height: 14, color: TERTIARY, flexShrink: 0 }} />}
    </>
  )

  const compactRow: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px', margin: '0 -8px',
    borderRadius: 8, textDecoration: 'none',
  }

  const unverified = (
    <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
      We haven&rsquo;t verified who holds {info.name} against the official results yet, so we&rsquo;re not naming one.
    </p>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={colLabel}>
          {info.name}
          <span style={{ fontWeight: 700, color: TERTIARY, letterSpacing: 0, textTransform: 'none' }}>
            {' '}&middot; {info.type === 'maori' ? 'M\u0101ori electorate' : 'General electorate'}
          </span>
        </div>
        {/* A way out that isn't "tap the exact shape again", which on a phone
            is a small target and easy to miss. */}
        <button
          onClick={onClear}
          style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: TERTIARY, fontFamily: MANROPE }}
        >
          Clear
        </button>
      </div>

      {/* ── Desktop: the column is 532px wide beside a 418px map, and the
             compact panel left 121px of it empty. Portrait at full size, name
             at display size, majority as a figure. ── */}
      <div className="seat-lg">
        {info.mpName ? (
          <>
            <div className="seat-body">{person(true)}</div>
            {typeof info.majority === 'number' && (
              <div className="seat-stat">
                <span className="seat-stat-n" style={{ color: accent, fontFamily: MANROPE, fontVariantNumeric: 'tabular-nums' }}>
                  {info.majority.toLocaleString('en-NZ')}
                </span>
                <span className="seat-stat-l" style={{ color: SECONDARY, fontFamily: MANROPE }}>
                  vote majority in 2023
                </span>
              </div>
            )}
            <div className="seat-links">
              {slug && mp && (
                <Link href={`/mps/${slug}`} className="seat-link" style={{ color: INK, fontFamily: MANROPE }}>
                  {info.mpName.split(' ')[0]}&rsquo;s profile <ArrowRight style={{ width: 14, height: 14 }} />
                </Link>
              )}
              <Link href={`/battlegrounds/${normalizeElectorateKey(info.name)}`} className="seat-link" style={{ color: INK, fontFamily: MANROPE }}>
                The {info.name} race in 2026 <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>
          </>
        ) : unverified}
      </div>

      {/* ── Phone: unchanged. The restraint that reads as cramped on a desktop
             is correct where the column is the whole screen. ── */}
      <div className="seat-sm">
        {info.mpName ? (
          slug && mp
            ? <Link href={`/mps/${slug}`} className="mp-row" style={compactRow}>{person(false)}</Link>
            : <div style={compactRow}>{person(false)}</div>
        ) : unverified}

        {info.mpName && typeof info.majority === 'number' && (
          <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: '10px 0 0', lineHeight: 1.5 }}>
            Won by <b style={{ color: accent }}>{info.majority.toLocaleString('en-NZ')}</b> votes in 2023.
          </p>
        )}

        <div style={{ marginTop: 12 }}>
          <Link href={`/battlegrounds/${normalizeElectorateKey(info.name)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, color: INK, fontFamily: MANROPE, textDecoration: 'none' }}>
            The {info.name} race in 2026 <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
      </div>
    </div>
  )
}

const colLabel: React.CSSProperties = {
  fontSize: 11.5, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase',
  color: TERTIARY, fontFamily: MANROPE,
}
