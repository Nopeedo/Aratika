'use client'

/**
 * Build-a-Government — pick parties from the real 2023 result and try to reach
 * the 62-seat majority (54th Parliament has 123 seats due to an overhang).
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, PartyPopper } from 'lucide-react'
import { PARTY_COLORS } from '@/constants/parties'

interface Bloc { key: string; name: string; seats: number; color: string }

// Official 2023 general election result (54th Parliament, 123 seats).
const RESULT_2023: Bloc[] = [
  { key: 'national', name: 'National',      seats: 49, color: PARTY_COLORS.national.bg },
  { key: 'labour',   name: 'Labour',        seats: 34, color: PARTY_COLORS.labour.bg },
  { key: 'green',    name: 'Green',         seats: 15, color: PARTY_COLORS.green.bg },
  { key: 'act',      name: 'ACT',           seats: 11, color: PARTY_COLORS.act.bg },
  { key: 'nzfirst',  name: 'NZ First',      seats: 8,  color: PARTY_COLORS.nzfirst.bg },
  { key: 'tpm',      name: 'Te Pāti Māori', seats: 6,  color: PARTY_COLORS.tpm.bg },
]
const HOUSE = 123
const MAJORITY = 62

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function BuildGovernment() {
  const [picked, setPicked] = useState<Set<string>>(new Set())

  const total = useMemo(
    () => RESULT_2023.filter((b) => picked.has(b.key)).reduce((s, b) => s + b.seats, 0),
    [picked],
  )
  const hasMajority = total >= MAJORITY
  const toggle = (key: string) =>
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const pct = (total / HOUSE) * 100
  const majorityPct = (MAJORITY / HOUSE) * 100

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden', background: '#fff' }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Build a Government</div>
        <div style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE }}>
          Using the real 2023 result, pick parties to reach the {MAJORITY}-seat majority.
        </div>
      </div>

      <div style={{ padding: 18 }}>
        {/* progress bar */}
        <div style={{ position: 'relative', height: 34, borderRadius: 10, background: '#f1efea', overflow: 'hidden', border: `1px solid ${BORDER}` }}>
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            style={{ height: '100%', background: hasMajority ? JADE : '#c9b03a', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
          />
          {/* majority line */}
          <div style={{ position: 'absolute', top: -3, bottom: -3, left: `${majorityPct}%`, width: 2, background: INK }} />
          <div style={{ position: 'absolute', top: 8, left: `calc(${majorityPct}% + 5px)`, fontSize: 10.5, fontWeight: 800, color: INK, fontFamily: MANROPE }}>
            {MAJORITY} = majority
          </div>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 10, display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 800, color: total > 6 ? '#fff' : INK, fontFamily: MANROPE }}>
            {total} seats
          </div>
        </div>

        {/* outcome */}
        <div style={{ minHeight: 26, marginTop: 10, marginBottom: 14 }}>
          {hasMajority ? (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE }}>
              <PartyPopper style={{ width: 15, height: 15 }} /> Majority reached — this bloc can form a government!
            </motion.div>
          ) : (
            <div style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE }}>
              {total === 0 ? 'Select parties to begin…' : `${MAJORITY - total} more seat${MAJORITY - total === 1 ? '' : 's'} needed for a majority.`}
            </div>
          )}
        </div>

        {/* party toggles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          {RESULT_2023.map((b) => {
            const on = picked.has(b.key)
            return (
              <button
                key={b.key}
                onClick={() => toggle(b.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', cursor: 'pointer',
                  borderRadius: 12, fontFamily: MANROPE, textAlign: 'left',
                  border: `1.5px solid ${on ? b.color : BORDER}`,
                  background: on ? `${b.color}14` : '#fff',
                  transition: 'all .15s',
                }}
              >
                <span style={{ position: 'relative', width: 18, height: 18, borderRadius: 6, background: on ? b.color : '#fff', border: `1.5px solid ${on ? b.color : TERTIARY}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {on && <Check style={{ width: 12, height: 12, color: '#fff' }} />}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</span>
                  <span style={{ display: 'block', fontSize: 11, color: SECONDARY }}>{b.seats} seats</span>
                </span>
              </button>
            )
          })}
        </div>

        <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, margin: '12px 0 0' }}>
          The actual government formed in 2023 was National + ACT + New Zealand First (68 seats).
        </p>
      </div>
    </div>
  )
}
