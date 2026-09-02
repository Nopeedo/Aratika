/**
 * PartiesContesting — every registered party contesting the party vote, one to a
 * row, all on a shared bar axis with the 5% threshold drawn once down the group.
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
 * Every registered party appears, grouped by whether they hold seats now — see
 * /party-inclusion.
 *
 * ORDER. The parliamentary group stays in seat order — a fact about the House
 * that exists. The contesting group is ordered by the most recent published
 * figure for each party.
 * This section used to be alphabetical on the reasoning that any ordering by
 * support is a ranking, which left TOP on 6.1% below ALCP and Alliance — an
 * ordering that is neutral in construction but misleading to read, since the
 * reader takes position on a page as meaning something.
 *
 * The six parties pollsters do not break out separately have no reading to
 * order by, so they keep the alphabetical order among themselves and sit last,
 * with the group's note saying that means unmeasured rather than zero. Ordering
 * them by their occasional footnote figures would rank them on numbers the
 * fill bars deliberately refuse to draw. The wording on /party-inclusion was
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

import Link from 'next/link'
import { PARTY_COLORS, PARTY_NAMES, CURRENT_SEATS, PARLIAMENTARY_PARTIES, NON_PARLIAMENTARY_CONTESTING } from '@/constants/parties'
import { MINOR_PARTY_READINGS } from '@/constants/polls-history'
import type { PartySlug } from '@/types'
import { MANROPE, INK, SECONDARY, TERTIARY, BORDER } from '@/constants/theme'

const WARM = '#5b3d2a', LINE = '#e9e4db'

/**
 * The bar scale. FULL_AT is the width a bar reaches at 100%, THRESHOLD is where
 * the 5% mark sits inside every track — identical on every row, which is what
 * lets the marks join into one line down the group.
 */
const FULL_AT = 35
const THRESHOLD = 5

/** Share of the gauge zone a party's poll number fills, 0-100. */
const fillPct = (pct: number) => Math.max(1.5, (Math.min(pct, FULL_AT) / FULL_AT) * 100)
/** Where the 5% line sits in that zone — identical on every tile. */
const THRESH_PCT = (THRESHOLD / FULL_AT) * 100

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
 * Orders the contesting group by the most recent published figure for each
 * party: the poll-of-polls share where a party is polled individually, and
 * otherwise the last itemised reading a pollster published for it.
 *
 * NOT used for the parliamentary group, which stays in seat order. Seats held
 * is a fact about the Parliament that exists; poll share is a projection about
 * the one that might. Sorting that group by polling put Labour above National
 * on a page describing the current House, which is a different claim than the
 * one the group heading makes.
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

export function PartiesContesting({ pop }: { pop: { slug: PartySlug; pct: number }[] }) {
  const pctBySlug = new Map(pop.map((p) => [p.slug, p.pct]))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
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
           and read as one line down the group. */
        .pc-rows { --pc-name: 152px; --pc-val: 66px; display: flex; flex-direction: column; }
        .pc-row {
          display: grid; grid-template-columns: var(--pc-name) 1fr var(--pc-val);
          align-items: center; gap: 12px; padding: 6px 8px; margin: 0 -8px;
          border-radius: 9px; text-decoration: none; position: relative;
          transition: background-color .12s ease;
        }
        .pc-row:hover { background: rgba(42,18,6,.04); }
        .pc-row:focus-visible { outline: 2px solid #2A1206; outline-offset: 1px; }
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
        .pc-cap { font-size: 10.5px; font-weight: 700; line-height: 1.3; display: block; text-align: right; }
        .pc-chip {
          display: inline-flex; flex-direction: column; gap: 1px; text-decoration: none;
          padding: 7px 11px; border-radius: 8px; border: 1px solid ;
          border-left-width: 3px; line-height: 1.25; transition: background-color .12s ease;
        }
        .pc-chip:focus-visible { outline: 2px solid #2A1206; outline-offset: 1px; }
        .pc-chip > span:first-child { font-size: 13.5px; }
        .pc-chip-full { font-size: 10.5px; font-weight: 500; }
        @media (max-width: 560px) { .pc-chip-full { display: none; } }
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
      {[
        // The full name is shown where the short one isn't the name people
        // know. "National", "Labour" and "Green" identify themselves; "ALCP",
        // "Vision NZ" and "TOP" don't.
        { label: 'In Parliament', parties: PARLIAMENTARY_PARTIES, showFullName: false, byMeasure: false },
        { label: 'Also registered to contest', parties: NON_PARLIAMENTARY_CONTESTING, showFullName: true, byMeasure: true },
      ].map((grp) => (
        <div key={grp.label}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: WARM, fontFamily: MANROPE }}>{grp.label}</span>
            <span style={{ flex: 1, height: 1, background: LINE }} />
          </div>
          <div className="pc-rows">
            {/* Parties with a figure of any kind get a row. The ones with none
                are pulled out below, because six consecutive rows each reading
                "Not reported separately, counted in pollsters' Others" said the
                same sentence six times and made the group look like filler. The
                sentence is true and worth saying — once, as the heading over
                the parties it applies to. */}
            {(grp.byMeasure ? orderByMeasure(grp.parties, pctBySlug) : grp.parties)
              .filter((slug) => !grp.byMeasure || hasAnyFigure(slug, pctBySlug))
              .map((slug) => (
                <Row key={slug} slug={slug} pct={pctBySlug.get(slug) ?? null} showFullName={grp.showFullName} />
              ))}
          </div>
          {/* The threshold explained once per group, instead of a "5%" label
              repeated on all seventeen tiles. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 11, fontWeight: 600, color: TERTIARY, fontFamily: MANROPE }}>
            <span aria-hidden style={{ width: 22, flexShrink: 0, borderTop: `1.5px dashed ${hexToRgba(INK, 0.32)}` }} />
            <span>5% — the party vote needed to enter Parliament without winning an electorate</span>
          </div>

          {/* The parties no pollster reports on its own. Said once, over all of
              them, and they keep their colour and their link — they are on the
              ballot on the same terms as everyone above, and the only thing
              they are missing is a number somebody else chose not to publish. */}
          {grp.byMeasure && (() => {
            const unreported = grp.parties.filter((slug) => !hasAnyFigure(slug, pctBySlug))
            if (unreported.length === 0) return null
            return (
              <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${LINE}` }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, marginBottom: 10, lineHeight: 1.5 }}>
                  Pollsters don&rsquo;t report these {unreported.length} separately — they&rsquo;re inside the &ldquo;Others&rdquo; figure
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {unreported.map((slug) => (
                    <Link
                      key={slug}
                      href={`/parties/${slug}`}
                      className="pc-chip"
                      style={{ borderLeft: `3px solid ${PARTY_COLORS[slug].bg}`, background: hexToRgba(PARTY_COLORS[slug].bg, 0.07) }}
                    >
                      <span style={{ fontWeight: 800, color: INK, fontFamily: MANROPE }}>{PARTY_NAMES[slug].short}</span>
                      <span className="pc-chip-full" style={{ color: TERTIARY, fontFamily: MANROPE }}>{PARTY_NAMES[slug].full}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      ))}
    </div>
  )
}

/**
 * One party, one row, on the axis its whole group shares.
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
 */
function Row({ slug, pct, showFullName }: { slug: PartySlug; pct: number | null; showFullName: boolean }) {
  const colour = PARTY_COLORS[slug].bg
  const names = PARTY_NAMES[slug]
  const seats = CURRENT_SEATS[slug]
  const reading = MINOR_PARTY_READINGS[slug]
  const polled = pct !== null
  const belowThreshold = polled && pct < THRESHOLD
  const tint = (a: number) => hexToRgba(colour, a)

  return (
    <Link href={`/parties/${slug}`} className="pc-row" aria-label={`${names.full} — open party page`}>
      {/* Name and its metadata together. Seats and the in-via-electorates note
          used to sit under the figure on the right, where "via electorates"
          wrapped to two lines and made Te Pāti Māori's row taller than every
          other one. They are facts about the party, so they belong beside it. */}
      <span style={{ minWidth: 0 }}>
        <span className="pc-nm" style={{ color: INK, fontFamily: MANROPE }}>{names.short}</span>
        <span className="pc-fl" style={{ color: TERTIARY, fontFamily: MANROPE }}>
          {seats > 0
            ? `${seats} seats${belowThreshold ? ', via electorates' : ''}`
            : showFullName ? names.full : ''}
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
            prefix that repeated down the group. Parties with no figure at all
            are not rows; they are listed once under the group. */}
        {!polled && reading && (
          <span className="pc-inline" style={{ color: SECONDARY, fontFamily: MANROPE }}>
            <b style={{ color: INK, marginRight: 4 }}>{reading.pct}%</b> {reading.pollster}, {fmtDate(reading.date)}
          </span>
        )}
      </span>

      {/* Just the figure. One line for every party, so every row is the same
          height and the bars keep a steady rhythm down the group. */}
      <span>
        {polled
          ? <span className="pc-val" style={{ color: INK, fontFamily: MANROPE }}>{pct.toFixed(1)}%</span>
          : <span className="pc-val" style={{ color: TERTIARY, fontFamily: MANROPE, fontWeight: 700 }}>&mdash;</span>}
      </span>
    </Link>
  )
}
