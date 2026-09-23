'use client'

/**
 * TwoVotes — an illustrative ballot showing what each of your two votes does:
 * the party vote shapes Parliament; the electorate vote picks your local MP.
 *
 * PARTY COLOURS. This file used to hard-code its own: Green #16A34A, Labour
 * #D62700, National #00529F, ACT #FDB913. The site's are #1F8A4C, #D5202B,
 * #0A5BA8, #F5C518. Four parties in four wrong shades, two taps from /parties
 * where they wear the right ones. They come from PARTY_COLORS now, with the
 * names from PARTY_NAMES: §1.6, party colour belongs to parties, and a party
 * that changes hue between pages is the site saying its colours are decoration.
 *
 * THE BALLOT SHAPE STAYS. Rows with a tick box, not §2.2 pills, because this is
 * a facsimile of the paper and the facsimile is the teaching. A deliberate
 * divergence, in the way §2.12's ballot bills are rows rather than tiles.
 *
 * What went: the "Two ticks, two jobs" banner under the two effect lines, which
 * restated the two effect lines 20px above it (§1.3). The lines stay, because
 * they answer as each vote is cast rather than once both are.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, MapPin, Building2 } from 'lucide-react'
import { PARTY_COLORS, PARTY_NAMES } from '@/constants/parties'
import type { PartySlug } from '@/types'
import { TOTAL_SEATS } from '@/lib/mmp'
import { InfoHeading, InfoText } from '@/components/ui/info-button'
import { WidgetHeader } from './module-widget-header'
import { BORDER, INK, JADE, MANROPE, TERTIARY } from '@/constants/theme'

/** Four real parties on an illustrative ballot paper. The order is the one the
 *  ballot uses, alphabetical by registered name, not a ranking. */
const PARTIES: PartySlug[] = ['act', 'green', 'labour', 'national']
const ELECTORATE_BLUE = '#2563eb'
const CANDIDATES = ['Aroha Ngata', 'James Patel', 'Sarah Wong']

function Tick({ checked, color }: { checked: boolean; color: string }) {
  return (
    <span style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked ? color : '#c9c6bf'}`, background: checked ? color : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {checked && <CheckCircle2 style={{ width: 14, height: 14, color: '#fff' }} />}
    </span>
  )
}

export function TwoVotes({ accent }: { accent: string }) {
  const [party, setParty] = useState<number | null>(null)
  const [candidate, setCandidate] = useState<number | null>(null)

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 20, background: '#fff' }}>
      <style dangerouslySetInnerHTML={{ __html: TV_CSS }} />

      <WidgetHeader title="Your two votes" accent={accent} infoLabel="How the two votes work">
        <InfoHeading accent={accent}>What this is</InfoHeading>
        <InfoText>
          A ballot paper like the one you fill in at a polling place. Tick one on each side
          and the lines underneath say what each tick just did.
        </InfoText>
        <InfoHeading accent={accent}>Real parties, made-up candidates</InfoHeading>
        <InfoText>
          The parties and their colours are the real ones. The three candidates are
          invented, because who is standing depends on the electorate you live in.
        </InfoText>
      </WidgetHeader>

      <div className="tv-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>

        {/* Party vote */}
        <div className="tv-left" style={{ padding: '16px 18px', borderRight: `1px solid ${BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            <Building2 style={{ width: 15, height: 15, color: JADE }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Party vote</span>
          </div>
          <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '0 0 12px' }}>Choose the party you support.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {PARTIES.map((slug, i) => {
              const colour = PARTY_COLORS[slug].bg
              return (
                <button key={slug} onClick={() => setParty(i)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: MANROPE, textAlign: 'left', border: `1.5px solid ${party === i ? colour : BORDER}`, background: party === i ? PARTY_COLORS[slug].light : '#fff' }}>
                  <Tick checked={party === i} color={colour} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: colour }} />
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>{PARTY_NAMES[slug].short}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Electorate vote */}
        <div style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            <MapPin style={{ width: 15, height: 15, color: ELECTORATE_BLUE }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Electorate vote</span>
          </div>
          <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '0 0 12px' }}>Choose your local candidate.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {CANDIDATES.map((c, i) => (
              <button key={c} onClick={() => setCandidate(i)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: MANROPE, textAlign: 'left', border: `1.5px solid ${candidate === i ? ELECTORATE_BLUE : BORDER}`, background: candidate === i ? '#eef2ff' : '#fff' }}>
                <Tick checked={candidate === i} color={ELECTORATE_BLUE} />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>{c}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Effects */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 12 }}>
        <AnimatePresence mode="wait">
          <motion.div key={party ?? 'np'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            style={{ fontSize: 12.5, color: party !== null ? '#065f46' : TERTIARY, fontFamily: MANROPE, lineHeight: 1.5 }}>
            <b>Party vote →</b> {party !== null ? `decides how many of the ${TOTAL_SEATS} seats ${PARTY_NAMES[PARTIES[party]].short} gets nationwide.` : `sets each party’s share of the ${TOTAL_SEATS} seats.`}
          </motion.div>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.div key={candidate ?? 'nc'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            style={{ fontSize: 12.5, color: candidate !== null ? '#1e3a8a' : TERTIARY, fontFamily: MANROPE, lineHeight: 1.5 }}>
            <b>Electorate vote →</b> {candidate !== null ? `elects ${CANDIDATES[candidate]} as your one local MP.` : 'elects your single local MP.'}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

/* §3.2, shipped with the component. The two panes were an auto-fit grid, which
   collapses to one column somewhere around a 578px viewport — and the ballot's
   left pane carried `border-right` unconditionally, so below that width it drew
   a hairline down the right edge of a full-width block. An explicit breakpoint
   decides both, so the border can never belong to a column that is not there. */
const TV_CSS = `
@media (max-width: 600px) {
  .tv-grid { grid-template-columns: 1fr !important; }
  .tv-left { border-right: none !important; border-bottom: 1px solid ${BORDER} !important; }
}
`
