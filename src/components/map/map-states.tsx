'use client'

/**
 * The pieces both electorate maps had their own copy of.
 *
 * `MapLoading` existed twice, identical but for a 30px spinner here and a 28px
 * one there, and `MetaRow` (a label/value row with a party dot and a bottom
 * hairline) existed twice byte for byte. Neither difference was a decision;
 * they are exactly the drift §1.4 is about, and the only reason nobody saw it
 * is that the two live on different pages.
 *
 * Kept as a small shared file rather than folded into either map, for §5.15's
 * reason: a shared piece whose implementation lives in one of its callers is
 * correct on that caller's page by accident.
 */

import { Loader2, MapPinOff } from 'lucide-react'
import { BORDER, INK, JADE, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

/** The spinner over the map's own water-blue, so the box does not flash white. */
export function MapLoading() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: TERTIARY, zIndex: 1100, background: '#eaf2f7' }}>
      <Loader2 className="live-dot" style={{ width: 30, height: 30, color: JADE }} />
      <span style={{ fontSize: 13, fontWeight: 600, fontFamily: MANROPE }}>Loading map…</span>
    </div>
  )
}

/** A boundary file that would not load, or a roll with no file. §1.5: the gap
 *  is named rather than left as an empty blue box. */
export function MapUnavailable({ message }: { message: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center', color: TERTIARY, padding: 24, textAlign: 'center' }}>
      <MapPinOff style={{ width: 26, height: 26 }} />
      <span style={{ fontSize: 13, fontFamily: MANROPE }}>{message}</span>
    </div>
  )
}

/** §2.4's meta row: label left, value right, party dot on the value. */
export function MetaRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, borderBottom: `1px solid ${BORDER}`, paddingBottom: 8 }}>
      <span style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, flexShrink: 0 }}>{label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: INK, fontFamily: MANROPE, minWidth: 0, textAlign: 'right' }}>
        {color && <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />}{value}
      </span>
    </div>
  )
}
