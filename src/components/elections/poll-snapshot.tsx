'use client'

/**
 * PollSnapshot — the way into the numbers behind the party-vote bars.
 *
 * It is now one outlined chip and a panel that opens under it: §2.6's
 * exception, the same move the bills block made, because the way out of a block
 * whose subject is directly above it is a small chip INSIDE the box rather than
 * a signpost of its own.
 *
 * WHAT IT USED TO BE, and why it is not: a 227px card with a 15px title, a
 * metadata line, a four-sentence note and an expander. The note explained the
 * 5% threshold, which was the THIRD statement of that rule within 400px (the
 * bars draw the mark and label it, the chamber's caveat says it again, and
 * two-votes says it in prose); it explained what "Others" means; and it said
 * "Politika reports polls, it doesn't predict the result". All of that is worth
 * saying and none of it needed a card: it is in the #parties (i) now, once, with
 * the rest of the how-to-read-this material (§1.2, §1.3).
 *
 * The per-party bars went earlier, for the same kind of reason. They were drawn
 * twice on this page: once as this card's compact list and again, immediately
 * above, as the shared-axis rows in PartiesContesting — same parties, same
 * colours, same order, same 5% marker. The rows carry more, so they stayed.
 *
 * What is behind the chip exists NOWHERE else on the site: the individual polls
 * the average is built from with their fieldwork dates and links, the preferred
 * PM readings, and the 2023 turnout and enrolment baseline. Deleting the card
 * outright would have taken all of that with it to remove one duplicated chart.
 */

import * as React from 'react'
import { ChevronDown, TrendingUp, UserRound, Users2, ArrowUpRight } from 'lucide-react'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import type { PartySlug } from '@/types'
import { BORDER, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY } from '@/constants/theme'

export interface PollOfPollsEntry { slug: PartySlug; pct: number }
export interface PollRow { pollster: string; fieldwork: string; parties: Partial<Record<PartySlug, number>>; sourceUrl: string }
export interface PreferredPMData { asOf: string; pollster: string; candidates: { name: string; party: PartySlug; pct: number }[] }

export function PollSnapshot({
  othersPct, pollCount, asAt, pollParties, polls, preferredPM, turnout, enrolment, participationSource, pollsSource,
}: {
  othersPct: number | null
  pollCount: number
  asAt: string
  pollParties: PartySlug[]
  polls: PollRow[]
  preferredPM: PreferredPMData
  turnout: number
  enrolment: number
  /**
   * Where the 2023 turnout and enrolment figures come from.
   *
   * The only link beside those two numbers used to be ENROLMENT_LIVE_URL,
   * labelled "Live enrolment stats", which is the CURRENT enrolment figure and
   * not the source of either 2023 one — a link that looks like a citation and
   * evidences nothing (§1.8). PARTICIPATION_SOURCE was already in polls-data.ts
   * and was read only by the unmounted poll-tracker.tsx.
   */
  participationSource: string
  pollsSource: string
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <div>
      {/* The chip. §3.1: the button is the hit area at 44px, the outlined pill
          inside it is what you look at. */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{ display: 'inline-flex', padding: '8px 0', margin: '-8px 0', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '6px 13px', borderRadius: 999,
          background: open ? '#ecfdf5' : '#fff', border: `1.5px solid ${open ? JADE : BORDER}`,
          color: open ? JADE : INK, fontFamily: MANROPE, fontSize: 12.5, fontWeight: 800,
          transition: 'background-color .2s ease, border-color .2s ease, color .2s ease',
        }}>
          <TrendingUp style={{ width: 14, height: 14 }} />
          The polls behind this
          <ChevronDown style={{ width: 14, height: 14, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} strokeWidth={3} />
        </span>
      </button>

      {open && (
        <div style={{ marginTop: 10, border: `1px solid ${BORDER}`, borderRadius: 16, background: '#fff', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Individual polls */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 2 }}>The polls behind the average</div>
            <div style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, marginBottom: 8, lineHeight: 1.5 }}>
              Poll of polls, an average of the latest poll from each company, as at {asAt}. It moves every time a new
              poll is published.
              {othersPct != null && <> Others sits at {othersPct}%.</>}
            </div>
            {/* §3.5's second-best answer. The table is 540px of eight columns
                inside a 303px card and it carried overflowX with no fade and no
                hint, so a reader saw four columns and no reason to think there
                were more. `.scroll-x` and `.scroll-x-hint` are the shared pair
                globals.css already provides for exactly this. Paging it the way
                the coverage matrix pages topics is the spec's real answer and is
                the better change when this block is next opened. */}
            <div className="scroll-x" style={{ overflowX: 'auto', border: `1px solid ${BORDER}`, borderRadius: 13 }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 540, fontFamily: MANROPE }}>
                <thead>
                  <tr>
                    <th style={thLeft}>Poll</th>
                    {pollParties.map((slug) => (
                      <th key={slug} style={thCell}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: PARTY_COLORS[slug].bg }} />{PARTY_NAMES[slug].short}</span></th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {polls.map((poll) => (
                    <tr key={poll.pollster + poll.fieldwork}>
                      <td style={tdLeft}>
                        <a href={poll.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: INK, textDecoration: 'none', fontWeight: 700 }}>{poll.pollster}</a>
                        <div style={{ fontSize: 10.5, color: TERTIARY }}>{poll.fieldwork}</div>
                      </td>
                      {pollParties.map((slug) => (
                        <td key={slug} style={tdCell}>{typeof poll.parties[slug] === 'number' ? poll.parties[slug] : '·'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="scroll-x-hint" style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE, marginTop: 6 }}>
              Swipe across for every party in each poll.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 16 }}>
            {/* Preferred PM */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <UserRound style={{ width: 15, height: 15, color: JADE }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Preferred PM</span>
                <span style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE }}>{preferredPM.pollster}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {preferredPM.candidates.map((c) => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 700, color: INK, fontFamily: MANROPE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                    <div style={{ width: 90, height: 14, background: SURFACE, borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                      <div style={{ height: '100%', width: `${(c.pct / 20) * 100}%`, background: PARTY_COLORS[c.party].bg, borderRadius: 4 }} />
                    </div>
                    <span style={{ width: 32, textAlign: 'right', fontSize: 12, fontWeight: 800, color: INK, fontFamily: MANROPE, flexShrink: 0 }}>{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Turnout */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <Users2 style={{ width: 15, height: 15, color: JADE }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Turnout &amp; enrolment</span>
                <span style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE }}>2023 baseline</span>
              </div>
              <div style={{ display: 'flex', gap: 18, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1 }}>{turnout}%</div>
                  <div style={{ fontSize: 11, color: SECONDARY, fontFamily: MANROPE, marginTop: 3 }}>Turnout of enrolled</div>
                </div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1 }}>{enrolment}%</div>
                  <div style={{ fontSize: 11, color: SECONDARY, fontFamily: MANROPE, marginTop: 3 }}>Of eligible enrolled</div>
                </div>
              </div>
              <a href={participationSource} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
                2023 turnout statistics <ArrowUpRight style={{ width: 12, height: 12 }} />
              </a>
            </div>
          </div>

          {/* The separator here was missing, so this rendered as
              "...published pollsaggregate ↗" — the same class of bug as the §4
              em-dash sweep, a word sitting directly against a tag. */}
          <p style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>
            Party-vote and preferred-PM figures compiled from {pollCount} published polls.{' '}
            <a href={pollsSource} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 700 }}>The aggregate <ArrowUpRight style={{ width: 10, height: 10, display: 'inline', verticalAlign: '-1px' }} /></a>
          </p>
        </div>
      )}
    </div>
  )
}

const thLeft: React.CSSProperties = { textAlign: 'left', padding: '7px 9px', fontSize: 11, fontWeight: 800, color: SECONDARY, borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }
const thCell: React.CSSProperties = { textAlign: 'center', padding: '7px', fontSize: 11, fontWeight: 800, color: SECONDARY, borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }
const tdLeft: React.CSSProperties = { textAlign: 'left', padding: '8px 9px', fontSize: 12, borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }
const tdCell: React.CSSProperties = { textAlign: 'center', padding: '8px', fontSize: 12, fontWeight: 700, color: INK, borderBottom: `1px solid ${BORDER}` }
