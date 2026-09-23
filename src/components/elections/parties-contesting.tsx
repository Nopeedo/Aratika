'use client'

/**
 * PartiesContesting — every registered party contesting the party vote, one to a
 * row, all on a shared bar axis with the 5% threshold drawn once under the list.
 *
 * This was a grid of tiles, each filling like a glass to that party's share.
 * The trouble was that each tile filled its OWN box from its own floor, so
 * 30.5% and 29.7% looked alike, 2.0% and 0.4% both read as "nearly empty", and
 * the printed number was doing all the work the picture was meant to do. Six
 * parties in a four-column grid also left two orphaned on a second row, and a
 * 29.7% fill left seven-tenths of its card blank — seventeen parties over three
 * screens. Rows share a baseline, so the comparison IS the layout, and the
 * threshold is one line instead of seventeen.
 *
 * The whole row is the link to that party's page. That was the tiles' main job
 * and it had to survive the change.
 *
 * ONE LIST, §2.2 PILLS OVER IT. It used to be two headed groups plus a third
 * sub-block of leftovers: "In Parliament", "Also registered to contest", and
 * "Pollsters don't report these 6 separately" with six pc-chips under it. That
 * is the filter-the-reader-operates-by-scrolling that §2.14 deleted from
 * /parties, and the pc-chip was a fourth card shape on a page that already had
 * three. One row of pills carries the same three groups and the same counts
 * over one list, and the labels are /parties' labels exactly — "No seats yet",
 * not "Also registered to contest", because a reader moving between the two
 * pages should not have to learn the Commission's vocabulary twice (§1.7, §4).
 *
 * Every registered party appears, grouped by whether they hold seats now — see
 * /party-inclusion.
 *
 * ORDER. The parliamentary parties stay in seat order and stay first — a fact
 * about the House that exists. The rest are ordered by the most recent
 * published figure for each party.
 * This section used to be alphabetical on the reasoning that any ordering by
 * support is a ranking, which left TOP on 6.1% below ALCP and Alliance — an
 * ordering that is neutral in construction but misleading to read, since the
 * reader takes position on a page as meaning something.
 *
 * The six parties pollsters do not break out separately have no reading to
 * order by, so they keep the alphabetical order among themselves and sit last,
 * with a note under the list saying that means unmeasured rather than zero.
 * Ordering them by their occasional footnote figures would rank them on numbers
 * the fill bars deliberately refuse to draw. The wording on /party-inclusion was
 * changed with this — it promised alphabetical order, and a promise the site
 * does not keep is worse than either ordering.
 *
 * The honesty problem this has to solve: only seven of the parties are polled
 * individually. The rest are bundled into pollsters' "Others" and only
 * occasionally itemised in a footnote. Drawing those footnote numbers as bars
 * would be doubly misleading — 0.3% renders as a sliver visually identical to
 * zero, the exact impression the fairness rule exists to avoid, and it implies
 * the figure was measured to the same standard as a headline party-vote number
 * when it is an irregular sub-sample inside the margin of error. So those rows
 * carry no bar and state the last published reading with its pollster and date
 * inside the track, or say plainly that there isn't one.
 */

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { PARTY_COLORS, PARTY_NAMES, CURRENT_SEATS, PARLIAMENTARY_PARTIES, NON_PARLIAMENTARY_CONTESTING } from '@/constants/parties'
import { MINOR_PARTY_READINGS } from '@/constants/polls-history'
import type { PartySlug } from '@/types'
import { MANROPE, INK, SECONDARY, TERTIARY, BORDER } from '@/constants/theme'

/**
 * The bar scale. FULL_AT is the width a bar reaches at 100%, THRESHOLD is where
 * the 5% mark sits inside every track — identical on every row, which is what
 * lets the marks join into one line down the list.
 */
const FULL_AT = 35
const THRESHOLD = 5

/** Share of the gauge zone a party's poll number fills, 0-100. */
const fillPct = (pct: number) => Math.max(1.5, (Math.min(pct, FULL_AT) / FULL_AT) * 100)
/** Where the 5% line sits in that zone — identical on every tile. */
const THRESH_PCT = (THRESHOLD / FULL_AT) * 100

/** Rows shown before the rest are folded away (§3.6). Six rather than five,
 *  because six IS the parliamentary group: the cut lands exactly where the
 *  reader's own mental line is, rather than one row inside it. */
const VISIBLE = 6

/** §3.6's mask, stops copied verbatim from defining-bills.tsx. The fade has to
 *  reach up INTO the last row to be visible at all: the list carries 34px of
 *  bottom padding for the control to sit in, so a 46px fade spent almost all of
 *  itself on empty space and the rows cut off square. */
const FOLD_MASK = 'linear-gradient(to bottom, #000 0%, #000 calc(100% - 86px), rgba(0,0,0,.12) calc(100% - 26px), transparent calc(100% - 10px))'

type Group = 'all' | 'parliament' | 'no-seats' | 'not-polled'

/** Fade a party's own colour to a tint. The gauge is drawn in the party's colour
 *  at low alpha over paper, so one helper covers every party without needing a
 *  per-party contrast colour for text any more. */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/**
 * Orders the non-parliamentary parties by the most recent published figure for
 * each: the poll-of-polls share where a party is polled individually, and
 * otherwise the last itemised reading a pollster published for it.
 *
 * NOT used for the parliamentary parties, which stay in seat order. Seats held
 * is a fact about the Parliament that exists; poll share is a projection about
 * the one that might. Sorting that group by polling put Labour above National
 * on a page describing the current House, which is a different claim than the
 * one the list makes.
 *
 * Parties pollsters never break out have no figure to order by, so they keep
 * their incoming alphabetical order and sit last. A missing reading is not a
 * zero — it means "folded into Others" — and sorting them to the bottom by an
 * implied nil would state something the data does not. Ties fall back to
 * alphabetical so the order is stable rather than dependent on sort internals.
 *
 * Returns a new array: NON_PARLIAMENTARY_CONTESTING is a shared constant that
 * /party-inclusion and CONTESTING_PARTIES also read, and sorting in place would
 * quietly reorder those too.
 */
function orderByMeasure(slugs: PartySlug[], pctBySlug: Map<PartySlug, number>): PartySlug[] {
  const measure = (s: PartySlug): number | null =>
    pctBySlug.get(s) ?? MINOR_PARTY_READINGS[s]?.pct ?? null
  const measured = slugs.filter((s) => measure(s) !== null)
  const unmeasured = slugs.filter((s) => measure(s) === null)
  measured.sort((a, b) => (measure(b)! - measure(a)!) || PARTY_NAMES[a].short.localeCompare(PARTY_NAMES[b].short))
  return [...measured, ...unmeasured]
}

/** True when we have any published number for this party — a poll-of-polls
 *  share, or the last figure a pollster itemised in a footnote. False means no
 *  one has reported them separately, which is a fact about polling coverage and
 *  not about the party. */
function hasAnyFigure(slug: PartySlug, pctBySlug: Map<PartySlug, number>): boolean {
  return pctBySlug.has(slug) || MINOR_PARTY_READINGS[slug] !== undefined
}

export function PartiesContesting({ pop, asAt }: {
  pop: { slug: PartySlug; pct: number }[]
  /** The date the averages are current to. It used to be printed twice
   *  elsewhere and nowhere here, which is where the seventeen bars actually
   *  are. §4: say the date on anything that ages. */
  asAt?: string
}) {
  const pctBySlug = new Map(pop.map((p) => [p.slug, p.pct]))
  const [group, setGroup] = useState<Group>('all')
  const [showAll, setShowAll] = useState(false)

  const ordered: PartySlug[] = [
    ...PARLIAMENTARY_PARTIES,
    ...orderByMeasure(NON_PARLIAMENTARY_CONTESTING, pctBySlug),
  ]
  const notPolled = ordered.filter((s) => !hasAnyFigure(s, pctBySlug))

  const inGroup = (slug: PartySlug): boolean => {
    if (group === 'all') return true
    if (group === 'parliament') return PARLIAMENTARY_PARTIES.includes(slug)
    if (group === 'no-seats') return !PARLIAMENTARY_PARTIES.includes(slug)
    return !hasAnyFigure(slug, pctBySlug)
  }

  const matching = ordered.filter(inGroup)
  const hidden = Math.max(0, matching.length - VISIBLE)
  const collapsed = !showAll && hidden > 0
  const shown = collapsed ? matching.slice(0, VISIBLE) : matching

  const counts: Record<Group, number> = {
    all: ordered.length,
    parliament: PARLIAMENTARY_PARTIES.length,
    'no-seats': NON_PARLIAMENTARY_CONTESTING.length,
    'not-polled': notPolled.length,
  }

  return (
    <div>
      {/*
        Two sizes, one layout: the name and value columns narrow on a phone so
        the bar keeps as much of the width as possible, and the full party name
        drops out. The arrangement itself does not change at the breakpoint —
        rows are rows at every width, which is most of why this replaced a grid
        that had to be re-reasoned at each one.
      */}
      <style>{`
        /* One row per party, on one shared axis.
           The tiles this replaces each filled their own box from their own
           floor, so 30.5% and 29.7% looked alike and 2.0% and 0.4% both read as
           "nearly empty" — the number was doing all the work the picture was
           meant to do. Rows share a baseline, so the comparison IS the layout.

           Fixed name and value columns, identical on every row, are what make
           the tracks align; the 5% mark then sits at the same offset inside
           every track, and each mark overhangs the row gap so the segments meet
           and read as one line down the list. */
        .pc-rows { --pc-name: 152px; --pc-val: 66px; display: flex; flex-direction: column; }
        .pc-row {
          display: grid; grid-template-columns: var(--pc-name) 1fr var(--pc-val);
          align-items: center; gap: 12px; padding: 6px 8px; margin: 0 -8px;
          border-radius: 9px; text-decoration: none; position: relative;
          transition: background-color .12s ease;
          scroll-margin-top: 88px;
        }
        .pc-row:hover { background: rgba(42,18,6,.04); }
        .pc-row:focus-visible { outline: 2px solid #2A1206; outline-offset: 1px; }
        /* Landed on from a seat tap in the chamber above: the row lights for a
           moment so the reader can see which of seventeen they were sent to. */
        .pc-row:target { background: rgba(42,18,6,.07); }
        /* One line on a desktop. "Outdoors & Freedom" wrapped at 116px and that
           single row stood 60px against everyone else's 43, breaking the rhythm
           the shared axis depends on. Measured rather than guessed: the longest
           current name needs 141px, so the column is 152 — a first attempt at
           138 was three pixels short and clipped it to "Outdoors &…", which is
           the same off-by-a-few mistake the old tile grid kept making. */
        .pc-nm { font-size: 14px; font-weight: 800; line-height: 1.2; display: -webkit-box;
          -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .pc-fl {
          display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
          font-size: 10.5px; font-weight: 500; line-height: 1.3; margin-top: 1px;
        }
        .pc-track { position: relative; height: 26px; border-radius: 5px; }
        .pc-fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 5px; }
        .pc-tick { position: absolute; top: -9px; bottom: -9px; width: 0; }
        .pc-val { font-size: 15px; font-weight: 800; display: block; text-align: right;
          font-variant-numeric: tabular-nums; letter-spacing: -.01em; }
        .pc-inline { position: absolute; left: 10px; right: 6px; top: 0; bottom: 0; display: flex;
          align-items: center; font-size: 11px; font-weight: 600; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis; }

        @media (max-width: 560px) {
          /* No room for 152px here, and clipping a party's name is worse than
             a taller row — so the name gets two reserved lines on a phone, the
             same two for every party, and the rhythm holds at a taller pitch. */
          .pc-rows { --pc-name: 108px; --pc-val: 54px; }
          .pc-nm { -webkit-line-clamp: 2; min-height: 2.4em; }
          .pc-row { gap: 9px; padding: 6px 6px; margin: 0 -6px; }
          .pc-val { font-size: 14px; }
          .pc-fl { display: none; }
          .pc-inline { font-size: 10px; left: 8px; }
        }
      `}</style>

      {/* §2.2 pills, in ONE neutral treatment, exactly as §2.14 has them on
          /parties: lit is #efece5 on INK, tapping the lit one clears back to
          All, and All leads the row carrying the total. Not a colour per group
          — party colour belongs to parties and it is live in the bars directly
          underneath (§1.6). */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {([
          ['all', 'All'],
          ['parliament', 'In Parliament'],
          ['no-seats', 'No seats yet'],
          ['not-polled', 'Not polled'],
        ] as [Group, string][]).map(([key, label]) => (
          <FilterPill
            key={key}
            label={label}
            count={counts[key]}
            on={group === key}
            onClick={() => { setGroup(group === key ? 'all' : key); setShowAll(false) }}
          />
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        <div
          className="pc-rows"
          style={{
            paddingBottom: collapsed ? 34 : 0,
            ...(collapsed ? { WebkitMaskImage: FOLD_MASK, maskImage: FOLD_MASK } : null),
          }}
        >
          {shown.map((slug) => (
            <Row key={slug} slug={slug} pct={pctBySlug.get(slug) ?? null} />
          ))}
        </div>

        {/* Names the number. "11 more" is a decision a reader can make, "more"
            is not. While collapsed it sits ON the fade, where the fade is
            already saying "this continues". */}
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

      {hidden > 0 && !collapsed && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
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

      {/* The threshold explained ONCE for the whole list, instead of once per
          group as it was, and instead of the "5%" label repeated on all
          seventeen tiles before that. This is the only place the mark is
          DRAWN, so the legend is load-bearing here: it names a line the reader
          can see. The #parties (i) used to restate it about 100px above, which
          is the same fact twice in one section (§1.3), and now points here
          instead. The party-vote card in "How your vote works" still states the
          rule, deliberately: that section is teaching what the party vote does,
          not how to read a chart, and a reader who never opens this section
          would otherwise never meet the threshold at all.

          The date sits with it: it is the date these seventeen bars are true
          of, and it was printed on the poll card and on the chamber and not
          here, which is where the bars are (§4). */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 11, fontWeight: 600, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.45 }}>
        <span aria-hidden style={{ width: 22, flexShrink: 0, borderTop: `1.5px dashed ${hexToRgba(INK, 0.32)}` }} />
        <span>
          5%, the party vote needed to enter Parliament without winning an electorate
          {asAt ? <> &middot; poll of polls as at {asAt}</> : null}
        </span>
      </div>

      {/* The parties no pollster reports on its own. Said ONCE, over all of
          them, rather than as six consecutive rows each reading "Not reported
          separately" — which said the same sentence six times and made that
          part of the list look like filler. They keep their row, their colour
          and their link: they are on the ballot on the same terms as everyone
          above, and the only thing they are missing is a number somebody else
          chose not to publish. The "Not polled" pill is how you see which. */}
      {notPolled.length > 0 && (
        <p style={{ fontSize: 11.5, color: SECONDARY, fontFamily: MANROPE, margin: '8px 0 0', lineHeight: 1.5 }}>
          Pollsters don&rsquo;t report {notPolled.length} of these parties separately, they&rsquo;re inside the
          &ldquo;Others&rdquo; figure, so those rows show no number rather than a zero.
        </p>
      )}
    </div>
  )
}

/** §2.2 / §3.1: the button is the 44px hit area, the span is the 28px pill.
 *  Copied from party-directory.tsx rather than re-derived, so the two rows
 *  cannot drift apart. */
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
          color: INK, fontFamily: MANROPE, fontWeight: 800,
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
 * One party, one row, on the axis the whole list shares.
 *
 * The ROW is the link, not just the name. The tiles this replaces were each a
 * Link, and a reader tapping a party to read about them is the main thing this
 * section is for — so the whole row is the target, and it takes a hover and a
 * focus ring like any other control.
 *
 * Everything the tile carried is still here: seats, the exact figure, the
 * caption separating "poll of polls" from a party that is in via electorates,
 * the last itemised reading for a party pollsters only footnote, and the plain
 * statement for one they do not report at all. What has gone is the empty space.
 *
 * The id is what a seat tap in the chamber above scrolls to (§1.4).
 */
function Row({ slug, pct }: { slug: PartySlug; pct: number | null }) {
  const colour = PARTY_COLORS[slug].bg
  const names = PARTY_NAMES[slug]
  const seats = CURRENT_SEATS[slug]
  const reading = MINOR_PARTY_READINGS[slug]
  const polled = pct !== null
  const belowThreshold = polled && pct < THRESHOLD
  const tint = (a: number) => hexToRgba(colour, a)

  return (
    <Link href={`/parties/${slug}`} id={`party-row-${slug}`} className="pc-row" aria-label={`${names.full}: open party page`}>
      {/* Name and its metadata together. Seats and the in-via-electorates note
          used to sit under the figure on the right, where "via electorates"
          wrapped to two lines and made Te Pāti Māori's row taller than every
          other one. They are facts about the party, so they belong beside it.

          The full name shows for a party with no seats: "National", "Labour"
          and "Green" identify themselves, "ALCP", "Vision NZ" and "TOP" don't.
          It used to be a per-group flag; with one list, having seats IS the
          condition, which is what the flag meant anyway. */}
      <span style={{ minWidth: 0 }}>
        <span className="pc-nm" style={{ color: INK, fontFamily: MANROPE }}>{names.short}</span>
        <span className="pc-fl" style={{ color: TERTIARY, fontFamily: MANROPE }}>
          {seats > 0
            ? `${seats} seats${belowThreshold ? ', via electorates' : ''}`
            : names.full}
        </span>
      </span>

      {/* The track is tinted in the party's colour whether or not there is a bar
          to draw. An unpolled party still has to be identifiable, and an empty
          grey row would read as a party on nothing rather than a party pollsters
          don't separate out. */}
      <span className="pc-track" style={{ background: tint(0.1) }}>
        {polled && <span className="pc-fill" style={{ width: `${fillPct(pct)}%`, background: colour }} />}
        <span aria-hidden className="pc-tick" style={{ left: `${THRESH_PCT}%`, borderLeft: `1.5px dashed ${hexToRgba(INK, 0.32)}` }} />
        {/* No bar, because an irregular footnote figure is not measured to the
            standard the bars are drawn to — see the note at the top of this
            file. The figure and who published it, without the "Last measured"
            prefix that repeated down the list. */}
        {!polled && reading && (
          <span className="pc-inline" style={{ color: SECONDARY, fontFamily: MANROPE }}>
            <b style={{ color: INK, marginRight: 4 }}>{reading.pct}%</b> {reading.pollster}, {fmtDate(reading.date)}
          </span>
        )}
      </span>

      {/* Just the figure. One line for every party, so every row is the same
          height and the bars keep a steady rhythm down the list. */}
      <span>
        {polled
          ? <span className="pc-val" style={{ color: INK, fontFamily: MANROPE }}>{pct.toFixed(1)}%</span>
          : <span className="pc-val" style={{ color: TERTIARY, fontFamily: MANROPE, fontWeight: 700 }}>&ndash;</span>}
      </span>
    </Link>
  )
}
