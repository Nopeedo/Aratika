/**
 * StageTracker — a bill's journey through Parliament as a vertical timeline,
 * highlighting the current stage. Shared by the reader and the editor preview.
 * Degrades gracefully when the stage isn't known yet.
 */

import { Check, Vote } from 'lucide-react'
import { BILL_STAGE_PIPELINE } from '@/constants/bills-data'

const INK = '#17231b', SECONDARY = '#667066', BORDER = '#e4ebe2', JADE = '#1F8A4C'

// Per-stage colour scheme — each stage of a bill's journey has its own hue,
// matching the stage badges (blue → purple → amber → orange → green).
const STAGE: Record<string, { solid: string; dark: string }> = {
  'introduced':               { solid: '#2f7ed8', dark: '#1e50a8' },
  'first-reading':            { solid: '#2f7ed8', dark: '#1e50a8' },
  'select-committee':         { solid: '#7c5cd6', dark: '#4f3aa0' },
  'second-reading':           { solid: '#d99521', dark: '#8a5a08' },
  'committee-of-whole-house': { solid: '#d99521', dark: '#8a5a08' },
  'third-reading':            { solid: '#e07a3c', dark: '#9a4a17' },
  'royal-assent':             { solid: '#1F8A4C', dark: '#166638' },
}
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function StageTracker({ stage, selectCommittee }: { stage: string | null; selectCommittee?: string | null }) {
  const currentIdx = stage ? BILL_STAGE_PIPELINE.findIndex((s) => s.key === stage) : -1

  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18, padding: '22px 24px', marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: currentIdx === -1 ? 12 : 18 }}>
        <Vote style={{ width: 17, height: 17, color: JADE }} />
        <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>Progress through Parliament</h2>
      </div>

      {currentIdx === -1 && (
        <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 16px', fontStyle: 'italic' }}>Current stage being confirmed — here are the steps every bill passes through.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {BILL_STAGE_PIPELINE.map((s, i) => {
          const done = currentIdx !== -1 && i < currentIdx
          const current = i === currentIdx
          const last = i === BILL_STAGE_PIPELINE.length - 1
          const c = STAGE[s.key] ?? { solid: '#8a8f96', dark: '#5f636a' }
          const filled = done || current
          return (
            <div key={s.key} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: filled ? c.solid : '#fff',
                  border: `2px solid ${filled ? c.solid : c.solid}`,
                }}>
                  {done ? <Check style={{ width: 13, height: 13, color: '#fff' }} />
                    : current ? <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />
                    : <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.solid }} />}
                </div>
                {!last && <div style={{ width: 2, flex: 1, minHeight: 22, background: done ? c.solid : '#e4e6e9' }} />}
              </div>
              <div style={{ paddingBottom: last ? 0 : 14 }}>
                <div style={{ fontSize: 14, fontWeight: current ? 800 : done ? 700 : 600, color: c.dark, opacity: filled ? 1 : 0.55, fontFamily: MANROPE }}>
                  {s.label}
                  {current && <span style={{ fontSize: 11, fontWeight: 700, color: c.dark, marginLeft: 8 }}>● Current stage</span>}
                </div>
                {current && s.key === 'select-committee' && selectCommittee && (
                  <div style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, marginTop: 2 }}>
                    {selectCommittee} Committee — open for public submissions at this stage.
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
