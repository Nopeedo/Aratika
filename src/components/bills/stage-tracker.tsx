/**
 * StageTracker — a bill's journey through Parliament as a horizontal track,
 * matching the journey bar on the featured bill in the /bills carousel so the
 * two read as the same object. Shared by the reader, the bill-detail page, and
 * the editor preview. Jade theme: completed = green, current = amber, upcoming
 * = grey. Degrades gracefully when the stage isn't known yet.
 */

import { Check, Vote } from 'lucide-react'
import { BILL_STAGE_PIPELINE } from '@/constants/bills-data'
import { BORDER, INK, JADE, MANROPE, SECONDARY } from '@/constants/theme'

const AMBER = '#c07a12', AMBER_DK = '#92400e', LINE = '#e4e6e9'

/** Seven stages across a phone screen leaves ~50px a column, so the two long
 *  names get a short form. Only the label changes — never the stage itself. */
const SHORT: Record<string, string> = {
  'committee-of-whole-house': 'Whole House',
  'select-committee': 'Select committee',
}

/* Horizontal track on desktop; a vertical list under 760px, where seven columns
   leave ~40px each and the labels overlapped into an unreadable run. The rail
   is dropped in the vertical form — with the beads stacked left it would need to
   be redrawn as a spine, and the bead states already carry the progress. */
const TRACK_CSS = `
.stage-track { position: relative; display: flex; justify-content: space-between; gap: 2px; }
.stage-rail { position: absolute; left: 11px; right: 11px; top: 11px; height: 2px; }
.stage-fill { right: auto; }
.stage-step { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; min-width: 0; text-align: center; }
.stage-label { font-size: 10.5px; }
@media (max-width: 760px) {
  .stage-track { flex-direction: column; gap: 12px; }
  .stage-rail { display: none; }
  .stage-step { flex-direction: row; align-items: center; gap: 11px; flex: none; text-align: left; }
  .stage-label { font-size: 13px; }
}
`

export function StageTracker({ stage, selectCommittee }: { stage: string | null; selectCommittee?: string | null }) {
  const currentIdx = stage ? BILL_STAGE_PIPELINE.findIndex((s) => s.key === stage) : -1
  const n = BILL_STAGE_PIPELINE.length
  // Fill the track up to the centre of the current bead (0 when nothing is known).
  const fill = currentIdx <= 0 ? 0 : currentIdx / (n - 1)

  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18, padding: '22px 24px', marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: currentIdx === -1 ? 12 : 20 }}>
        <Vote style={{ width: 17, height: 17, color: JADE }} />
        <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>Progress through Parliament</h2>
      </div>

      {currentIdx === -1 && (
        <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 18px', fontStyle: 'italic' }}>Current stage being confirmed. Here are the steps every bill passes through.</p>
      )}

      {/* Seven stages across a phone is about 40px a column — too narrow for
          "Introduced" or "Select committee", so the labels ran into each other.
          Under 760px the track turns into a vertical list instead. The layout
          properties live in TRACK_CSS rather than inline for that reason. */}
      <style dangerouslySetInnerHTML={{ __html: TRACK_CSS }} />
      <div className="stage-track">
        {/* Track: the grey rail, then the completed overlay. Inset by half a bead
            so the line starts and ends at the bead centres, not the edges. */}
        <span aria-hidden className="stage-rail" style={{ background: LINE }} />
        {fill > 0 && <span aria-hidden className="stage-rail stage-fill" style={{ background: JADE, width: `calc((100% - 22px) * ${fill})` }} />}

        {BILL_STAGE_PIPELINE.map((s, i) => {
          const done = currentIdx !== -1 && i < currentIdx
          const current = i === currentIdx
          return (
            <div key={s.key} className="stage-step">
              <span style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? JADE : current ? AMBER : '#fff',
                border: `2px solid ${done ? JADE : current ? AMBER : '#cbd0d6'}`,
              }}>
                {done ? <Check style={{ width: 13, height: 13, color: '#fff' }} />
                  : current ? <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />
                  : <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#cbd0d6' }} />}
              </span>
              <span className="stage-label" style={{ fontWeight: current ? 800 : 600, color: done ? JADE : current ? AMBER_DK : '#8b9299', fontFamily: MANROPE, lineHeight: 1.3, hyphens: 'auto' }}>
                {SHORT[s.key] ?? s.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* The current stage in words, under the track — a bead alone doesn't tell
          you that this is the moment you can actually have a say. */}
      {currentIdx !== -1 && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: AMBER_DK, fontFamily: MANROPE }}>
            <span style={{ marginRight: 6 }}>●</span>Current stage: {BILL_STAGE_PIPELINE[currentIdx].label}
          </div>
          {/* Names the committee only. Whether submissions are actually open
              depends on the closing date, which HaveYourSay owns — claiming it
              here produced a page that said "open" directly above "closed". */}
          {BILL_STAGE_PIPELINE[currentIdx].key === 'select-committee' && selectCommittee && (
            <div style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, marginTop: 3 }}>
              With the {selectCommittee} Committee.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
