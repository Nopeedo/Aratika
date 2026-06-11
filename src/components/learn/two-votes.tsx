'use client'

/**
 * TwoVotes — an illustrative ballot showing what each of your two votes does:
 * the party vote shapes Parliament; the electorate vote picks your local MP.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, MapPin, Building2 } from 'lucide-react'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const PARTIES = [
  { name: 'Green', color: '#16A34A' },
  { name: 'Labour', color: '#D62700' },
  { name: 'National', color: '#00529F' },
  { name: 'ACT', color: '#FDB913' },
]
const CANDIDATES = ['Aroha Ngata', 'James Patel', 'Sarah Wong']

function Tick({ checked, color }: { checked: boolean; color: string }) {
  return (
    <span style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked ? color : '#c9c6bf'}`, background: checked ? color : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {checked && <CheckCircle2 style={{ width: 14, height: 14, color: '#fff' }} />}
    </span>
  )
}

export function TwoVotes() {
  const [party, setParty] = useState<number | null>(null)
  const [candidate, setCandidate] = useState<number | null>(null)
  const both = party !== null && candidate !== null

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden', background: '#fff' }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Your two votes</div>
        <div style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE }}>Cast each vote to see what it actually does.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 0 }}>

        {/* Party vote */}
        <div style={{ padding: '16px 18px', borderRight: `1px solid ${BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            <Building2 style={{ width: 15, height: 15, color: JADE }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Party vote</span>
          </div>
          <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '0 0 12px' }}>Choose the party you support.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {PARTIES.map((p, i) => (
              <button key={p.name} onClick={() => setParty(i)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: MANROPE, textAlign: 'left', border: `1.5px solid ${party === i ? p.color : BORDER}`, background: party === i ? `${p.color}10` : '#fff' }}>
                <Tick checked={party === i} color={p.color} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Electorate vote */}
        <div style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            <MapPin style={{ width: 15, height: 15, color: '#2563eb' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Electorate vote</span>
          </div>
          <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '0 0 12px' }}>Choose your local candidate.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {CANDIDATES.map((c, i) => (
              <button key={c} onClick={() => setCandidate(i)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: MANROPE, textAlign: 'left', border: `1.5px solid ${candidate === i ? '#2563eb' : BORDER}`, background: candidate === i ? '#2563eb10' : '#fff' }}>
                <Tick checked={candidate === i} color="#2563eb" />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>{c}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Effects */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        <AnimatePresence mode="wait">
          <motion.div key={party ?? 'np'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            style={{ fontSize: 12.5, color: party !== null ? '#065f46' : TERTIARY, fontFamily: MANROPE, lineHeight: 1.5 }}>
            <b>Party vote →</b> {party !== null ? `decides how many of the 120 seats ${PARTIES[party].name} gets nationwide.` : 'sets each party’s share of the 120 seats.'}
          </motion.div>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.div key={candidate ?? 'nc'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            style={{ fontSize: 12.5, color: candidate !== null ? '#1e3a8a' : TERTIARY, fontFamily: MANROPE, lineHeight: 1.5 }}>
            <b>Electorate vote →</b> {candidate !== null ? `elects ${CANDIDATES[candidate]} as your one local MP.` : 'elects your single local MP.'}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {both && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}>
            <div style={{ margin: '0 18px 16px', padding: '12px 14px', borderRadius: 12, background: '#ecfdf5', border: '1px solid #a7f3d0', fontSize: 13, fontWeight: 700, color: '#065f46', fontFamily: MANROPE }}>
              Two ticks, two jobs: your party vote shapes the make-up of Parliament, while your electorate vote picks the person who represents your area.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
