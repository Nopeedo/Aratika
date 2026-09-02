'use client'

/**
 * PollSnapshot — the condensed poll-of-polls for the Election Centre. Shows just
 * the party-vote averages with the 5% line by default; the full breakdown (every
 * poll behind the average, preferred PM, turnout) is tucked behind an expander so
 * it stops dominating the page. Every number stays sourced and labelled.
 */

import * as React from 'react'
import Link from 'next/link'
import { TrendingUp, ChevronDown, UserRound, Users2, ArrowUpRight } from 'lucide-react'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import type { PartySlug } from '@/types'
import { BORDER, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY } from '@/constants/theme'

export interface PollOfPollsEntry { slug: PartySlug; pct: number }
export interface PollRow { pollster: string; fieldwork: string; parties: Partial<Record<PartySlug, number>>; sourceUrl: string }
export interface PreferredPMData { asOf: string; pollster: string; candidates: { name: string; party: PartySlug; pct: number }[] }

export function PollSnapshot({
  othersPct, pollCount, asAt, pollParties, polls, preferredPM, turnout, enrolment, enrolmentUrl, pollsSource,
}: {
  othersPct: number | null
  pollCount: number
  asAt: string
  pollParties: PartySlug[]
  polls: PollRow[]
  preferredPM: PreferredPMData
  turnout: number
  enrolment: number
  enrolmentUrl: string
  pollsSource: string
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, background: '#fff', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '15px 18px 4px' }}>
        <TrendingUp style={{ width: 16, height: 16, color: JADE }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Where these numbers come from</div>
          <div style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE }}>
            Poll of polls · average party vote across {pollCount} polls · as at {asAt}
            {othersPct != null && <> · Others {othersPct}%</>}
          </div>
        </div>
      </div>

      {/*
        The per-party bars are gone from here.
        They were drawn twice on this page: once as this card's compact list and
        again, immediately above, as the shared-axis rows in PartiesContesting —
        same parties, same colours, same order, same 5% marker. The rows carry
        more (seats, sources, all seventeen contesting parties, a link into each
        party page), so they are the ones that stay.

        What this card keeps is everything that existed nowhere else: how many
        polls the average is drawn from and when, the Others figure, the note
        about what Others means and what a poll is not, and the detail behind
        the expander — the individual polls, preferred PM, turnout and
        enrolment. Deleting the card outright would have taken all of that with
        it to remove one duplicated chart.
      */}
      <div style={{ padding: '4px 18px 16px' }}>
        <div style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.6 }}>
          A party needs <b>5%</b> of the party vote, or one electorate, to enter Parliament. <b>Others</b> is the smaller
          registered parties pollsters group together and don’t report individually. <Link href="/party-inclusion" style={{ color: JADE, fontWeight: 700, textDecoration: 'none' }}>See every contesting party</Link>. Arapono reports polls. It doesn’t predict the result.
        </div>
      </div>

      {/* Expander */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', border: 'none', borderTop: `1px solid ${BORDER}`, background: SURFACE, cursor: 'pointer', fontFamily: MANROPE, fontSize: 12.5, fontWeight: 800, color: JADE }}
      >
        {open ? 'Hide the detail' : 'The polls behind this, preferred PM & turnout'}
        <ChevronDown style={{ width: 15, height: 15, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>

      {open && (
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 20, borderTop: `1px solid ${BORDER}` }}>
          {/* Individual polls */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 8 }}>The polls behind the average</div>
            <div style={{ overflowX: 'auto' }}>
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
                <span style={{ fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Turnout & enrolment</span>
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
              <a href={enrolmentUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
                Live enrolment stats <ArrowUpRight style={{ width: 12, height: 12 }} />
              </a>
            </div>
          </div>

          <p style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>
            Party-vote and preferred-PM figures compiled from published polls — <a href={pollsSource} target="_blank" rel="noopener noreferrer" style={{ color: JADE, fontWeight: 700 }}>aggregate ↗</a>.
            Poll-of-polls is a simple average of the latest poll from each company.
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
