'use client'

/**
 * PolicyFaceoff — the Election Centre "decide" tool. Instead of linking people
 * away to the compare grid, it lets an undecided voter *react*: pick an issue,
 * read two parties' stances side by side, and tap the one that speaks to them.
 * Each tap builds a personal "leaning" bar and rolls to the next issue — no
 * sign-up, nothing leaves the page.
 *
 * Runs entirely on APPROVED, sourced positions passed from the server. It only
 * ever offers issues/parties that actually have a published stance, so nothing
 * here is fabricated. If too little is compiled yet, it degrades to a clean
 * prompt plus the compass.
 */

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, RefreshCw, Hand, RotateCcw } from 'lucide-react'
import type { PartyPosition } from '@/lib/positions/live'
import { PARTY_COLORS, PARTY_NAMES, PARTY_ORDER } from '@/constants/parties'
import { POLICY_TOPICS, POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import type { PartySlug, PolicyTopic } from '@/types'

const INK = '#0c0e12', SECONDARY = '#6b7078', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

type Side = 'a' | 'b'

function plain(p: PartyPosition): string {
  return (p.summaryBasic || p.stance || p.summary || '').trim()
}
const partyName = (slug: string) => PARTY_NAMES[slug as PartySlug]?.short ?? slug
const partyColor = (slug: string) => PARTY_COLORS[slug as PartySlug]?.bg ?? '#6b7280'

export function PolicyFaceoff({ positions }: { positions: PartyPosition[] }) {
  // topic -> party -> the best (usable) position for it
  const byTopic = React.useMemo(() => {
    const m = new Map<string, Map<string, PartyPosition>>()
    for (const p of positions) {
      if (p.noPosition || !plain(p)) continue
      if (!m.has(p.topic)) m.set(p.topic, new Map())
      const parties = m.get(p.topic)!
      // prefer the current (2026) period when a party has more than one
      const cur = parties.get(p.party)
      if (!cur || (p.period === '2026' && cur.period !== '2026')) parties.set(p.party, p)
    }
    return m
  }, [positions])

  // topics with at least two parties to pit against each other, in display order
  const topics = React.useMemo(
    () =>
      POLICY_TOPIC_ORDER.filter((t) => (byTopic.get(t)?.size ?? 0) >= 2) as PolicyTopic[],
    [byTopic],
  )

  const partiesFor = React.useCallback(
    (topic: string): string[] => {
      const set = byTopic.get(topic)
      if (!set) return []
      return PARTY_ORDER.filter((p) => set.has(p)).concat(
        [...set.keys()].filter((p) => !PARTY_ORDER.includes(p as PartySlug)),
      )
    },
    [byTopic],
  )

  const [topic, setTopic] = React.useState<string>(topics[0] ?? '')
  const [a, setA] = React.useState<string>('')
  const [b, setB] = React.useState<string>('')
  const [tally, setTally] = React.useState<Record<string, number>>({})
  const [flash, setFlash] = React.useState<Side | null>(null)

  // seed / repair the two contenders whenever the topic changes
  React.useEffect(() => {
    const list = partiesFor(topic)
    if (list.length < 2) return
    setA((prev) => (list.includes(prev) ? prev : list[0]))
    setB((prev) => (list.includes(prev) && prev !== (list.includes(a) ? a : list[0]) ? prev : list[1]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic])

  if (topics.length === 0) {
    // Not enough compiled yet — keep the promise, point at the compass.
    return (
      <FaceoffShell>
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '22px 24px' }}>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Head-to-head is warming up</div>
          <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: '6px 0 14px', maxWidth: 520 }}>
            Party stances are summarised neutrally from official policy and editor-checked before they appear here. In the
            meantime, the 60-second compass will point you toward your fit.
          </p>
          <Link href="/start" style={pickBtn(true)}>
            <Sparkles style={{ width: 16, height: 16 }} /> Take the compass <ArrowRight style={{ width: 15, height: 15 }} />
          </Link>
        </div>
      </FaceoffShell>
    )
  }

  const list = partiesFor(topic)
  const posA = a ? byTopic.get(topic)?.get(a) : undefined
  const posB = b ? byTopic.get(topic)?.get(b) : undefined
  const totalPicks = Object.values(tally).reduce((s, n) => s + n, 0)
  const ranked = Object.keys(tally)
    .filter((p) => tally[p] > 0)
    .sort((x, y) => tally[y] - tally[x])
  const leader = ranked[0]

  function choose(side: Side, party: string) {
    if (side === 'a') {
      setA(party)
      if (party === b) setB(list.find((p) => p !== party) ?? b)
    } else {
      setB(party)
      if (party === a) setA(list.find((p) => p !== party) ?? a)
    }
  }

  function pick(side: Side) {
    const party = side === 'a' ? a : b
    if (!party) return
    setTally((t) => ({ ...t, [party]: (t[party] ?? 0) + 1 }))
    setFlash(side)
    window.setTimeout(() => setFlash(null), 200)
    // roll to the next issue that has data, keeping the momentum going
    const idx = topics.indexOf(topic)
    const next = topics[(idx + 1) % topics.length]
    if (topics.length > 1) setTopic(next)
    else newMatchup()
  }

  function newMatchup() {
    if (list.length <= 2) return
    const rot = (from: string) => {
      const i = list.indexOf(from)
      return list[(i + 1) % list.length]
    }
    let na = rot(a)
    let nb = rot(b)
    if (na === nb) nb = rot(nb)
    setA(na)
    setB(nb)
  }

  function reset() {
    setTally({})
  }

  return (
    <FaceoffShell>
      {/* Issue chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {topics.map((t) => {
          const on = t === topic
          return (
            <button
              key={t}
              onClick={() => setTopic(t)}
              style={{
                padding: '8px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: MANROPE, fontSize: 13, fontWeight: 700,
                border: `1px solid ${on ? INK : BORDER}`, background: on ? INK : '#fff', color: on ? '#fff' : SECONDARY,
              }}
            >
              {POLICY_TOPICS[t].label}
            </button>
          )
        })}
      </div>

      {/* The two contenders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12, alignItems: 'stretch' }}>
        <ContenderCard side="a" party={a} pos={posA} list={list} onSelect={choose} onPick={pick} flash={flash === 'a'} />
        <ContenderCard side="b" party={b} pos={posB} list={list} onSelect={choose} onPick={pick} flash={flash === 'b'} />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, margin: '14px 0 4px', flexWrap: 'wrap' }}>
        {list.length > 2 && (
          <button onClick={newMatchup} style={ghostBtn}>
            <RefreshCw style={{ width: 14, height: 14 }} /> New match-up
          </button>
        )}
        {totalPicks > 0 && (
          <button onClick={reset} style={ghostBtn}>
            <RotateCcw style={{ width: 14, height: 14 }} /> Start over
          </button>
        )}
      </div>

      {/* Leaning */}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Your leaning so far</span>
          <span style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE }}>{totalPicks} {totalPicks === 1 ? 'pick' : 'picks'}</span>
        </div>
        {totalPicks === 0 ? (
          <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>
            Tap the stance that speaks to you in either card. Your leaning builds up here — no sign-up, nothing leaves the page.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', height: 34, borderRadius: 8, overflow: 'hidden', background: '#f1f3f5' }}>
              {ranked.map((p) => {
                const pct = Math.round((tally[p] / totalPicks) * 100)
                return (
                  <div
                    key={p}
                    title={`${partyName(p)} ${pct}%`}
                    style={{
                      flexGrow: tally[p], flexBasis: 0, minWidth: 0, background: partyColor(p), color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MANROPE, fontSize: 12, fontWeight: 700,
                      transition: 'flex-grow .35s ease', whiteSpace: 'nowrap', overflow: 'hidden',
                    }}
                  >
                    {pct >= 16 ? `${partyName(p).split(' ')[0]} ${pct}%` : ''}
                  </div>
                )
              })}
            </div>
            {leader && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                <span style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE }}>
                  You’re leaning <b style={{ color: INK }}>{partyName(leader)}</b> so far.
                </span>
                <Link href="/compare" style={pickBtn(false)}>
                  See the full comparison <ArrowRight style={{ width: 14, height: 14 }} />
                </Link>
                <Link href="/start" style={{ ...cta, fontSize: 13 }}>
                  Or take the compass <ArrowRight style={{ width: 13, height: 13 }} />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </FaceoffShell>
  )
}

function ContenderCard({
  side, party, pos, list, onSelect, onPick, flash,
}: {
  side: Side; party: string; pos?: PartyPosition; list: string[]
  onSelect: (side: Side, party: string) => void; onPick: (side: Side) => void; flash: boolean
}) {
  return (
    <div
      style={{
        background: '#fff', border: `1px solid ${flash ? JADE : BORDER}`, borderRadius: 14, padding: 15,
        display: 'flex', flexDirection: 'column', gap: 11, transform: flash ? 'scale(0.99)' : 'scale(1)',
        transition: 'transform .18s ease, border-color .18s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: partyColor(party), flexShrink: 0 }} />
        <select
          value={party}
          onChange={(e) => onSelect(side, e.target.value)}
          aria-label={`Party ${side === 'a' ? 'one' : 'two'}`}
          style={{ flex: 1, minWidth: 0, height: 34, borderRadius: 9, border: `1px solid ${BORDER}`, padding: '0 8px', fontFamily: MANROPE, fontSize: 14.5, fontWeight: 800, color: INK, background: '#fff', cursor: 'pointer' }}
        >
          {list.map((p) => (
            <option key={p} value={p}>{partyName(p)}</option>
          ))}
        </select>
      </div>
      <p style={{ flex: 1, fontSize: 14, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: 0, minHeight: 72 }}>
        {pos ? plain(pos) : '—'}
      </p>
      {pos?.sourceLabel && (
        <span style={{ fontSize: 11.5, color: '#9aa0aa', fontFamily: MANROPE }}>Source: {pos.sourceLabel}</span>
      )}
      <button onClick={() => onPick(side)} style={pickBtn(false)}>
        <Hand style={{ width: 15, height: 15 }} /> This speaks to me
      </button>
    </div>
  )
}

function FaceoffShell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        <Sparkles style={{ width: 16, height: 16, color: JADE }} />
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE }}>Not sure who to vote for?</span>
      </div>
      <h2 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>Face them off — find your fit</h2>
      <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 16px', maxWidth: 560, lineHeight: 1.55 }}>
        Pick an issue, read where two parties stand, and tap the one you agree with. We’ll build your leaning as you go — summarised neutrally, with sources.
      </p>
      {children}
    </div>
  )
}

const cta: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }
const ghostBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, border: `1px solid ${BORDER}`, background: '#fff', color: SECONDARY, fontFamily: MANROPE, fontSize: 13, fontWeight: 700, cursor: 'pointer' }

function pickBtn(solid: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 'auto',
    padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: MANROPE, fontSize: 13.5, fontWeight: 800,
    textDecoration: 'none', border: `1px solid ${solid ? JADE : '#cfe9d8'}`,
    background: solid ? JADE : '#ecfdf5', color: solid ? '#fff' : JADE,
  }
}
