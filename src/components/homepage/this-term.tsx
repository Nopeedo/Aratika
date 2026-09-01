'use client'

/**
 * ThisTerm — what is settled about the 54th Parliament, on the homepage.
 *
 * Sits between the party tiles and the issues: the tiles say who is standing,
 * the issues say what they claim, and this says where things actually stand
 * before any of it changes. Reads the shared party selection, so tapping a tile
 * above lights that party's seats without needing a second control.
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
import { ArrowRight, Info } from 'lucide-react'
import { usePartyCycle } from '@/components/homepage/party-cycle'
import { ELECTORATES, getElectorate } from '@/constants/electorates-data'
import { PARTY_COLORS, PARTY_NAMES, CURRENT_SEATS, TOTAL_SEATS, PARTY_STATUS, PARLIAMENTARY_PARTIES } from '@/constants/parties'
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

  return (
    <section style={{ background: 'transparent' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '8px clamp(18px, 5vw, 36px) 56px' }}>
        <div style={{ marginBottom: 6, fontSize: 12.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>
          This term
        </div>
        <h2 style={{ fontSize: 'clamp(24px,3.6vw,31px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: '0 0 6px' }}>
          Where things stand now
        </h2>
        <p style={{ fontSize: 15.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 22px', maxWidth: 620, lineHeight: 1.55 }}>
          The 54th Parliament, as the 2023 election left it. Tap a party above to see the electorates they won.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 22, alignItems: 'start' }}>
          {/* Seats first. This is the number that decides who governs, and the
              one the map cannot show honestly on its own. */}
          <div>
            <div style={{ ...colLabel, marginBottom: 10 }}>Seats in the House</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {PARLIAMENTARY_PARTIES.map((p) => {
                const on = !selected || selected === p
                return (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: on ? 1 : 0.4, transition: 'opacity .2s ease' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: PARTY_COLORS[p].bg, flexShrink: 0, boxShadow: '0 0 0 1.5px rgba(255,255,255,.9)' }} />
                    <span style={{ flex: 1, fontSize: 14, fontWeight: selected === p ? 800 : 700, color: INK, fontFamily: MANROPE }}>{PARTY_NAMES[p].short}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{CURRENT_SEATS[p] ?? 0}</span>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BORDER}`, fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55 }}>
              <b style={{ color: INK }}>{governing.map((p) => PARTY_NAMES[p].short).join(', ')}</b> form the government
              with <b style={{ color: INK }}>{govtSeats}</b> of {TOTAL_SEATS} seats.
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
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

            {/* A definite height, not minHeight. ElectorateMap's own container is
                height:100%, which resolves against nothing on an auto-height
                parent: the map mounted, drew all its polygons and basemap tiles,
                and painted a blank white box because it measured 0px tall. */}
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', background: '#fff', height: 'clamp(300px, 40vw, 380px)' }}>
              {failed ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center', fontSize: 13, color: SECONDARY, fontFamily: MANROPE }}>
                  The boundary data didn&rsquo;t load. The seat counts beside this are unaffected.
                </div>
              ) : data ? (
                // key on the layer so Leaflet rebuilds rather than merging the
                // two boundary sets. scrollZoom off: an inline embed should not
                // trap the page scroll.
                <ElectorateMap key={layer} data={data} selectedKey={null} onSelect={() => {}} colorOf={colorOf} scrollZoom={false} fitToData />
              ) : (
                <MapSkeleton />
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <Info style={{ width: 14, height: 14, color: TERTIARY, flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
                {selected && held === 0 ? (
                  <>
                    <b style={{ color: INK }}>{PARTY_NAMES[selected].short} holds no electorate seats.</b> All{' '}
                    {CURRENT_SEATS[selected] ?? 0} of their MPs come from the party vote, so this map shows none of
                    their support. That is how MMP works, not a gap in the data.
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

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 20 }}>
          <Link href="/parliament" style={cta}>The full make-up of Parliament <ArrowRight style={{ width: 14, height: 14 }} /></Link>
          <Link href="/record" style={{ ...cta, color: SECONDARY }}>What this Parliament has passed <ArrowRight style={{ width: 14, height: 14 }} /></Link>
        </div>
      </div>
    </section>
  )
}

const colLabel: React.CSSProperties = {
  fontSize: 11.5, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase',
  color: TERTIARY, fontFamily: MANROPE,
}

const cta: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE, textDecoration: 'none',
}
