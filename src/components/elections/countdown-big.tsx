'use client'

/**
 * CountdownBig — live "days to go" to the (approximate) next election date.
 * The date is not yet official, so it is clearly labelled as approximate.
 */

import { useEffect, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { NEXT_ELECTION_DATE } from '@/constants/elections-data'

const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function CountdownBig() {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  const target = new Date(`${NEXT_ELECTION_DATE}T09:00:00+13:00`).getTime()
  const days = now === null ? null : Math.max(0, Math.ceil((target - now) / 86_400_000))

  return (
    <div style={{ background: '#0c0e12', borderRadius: 18, padding: '24px 26px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <CalendarClock style={{ width: 26, height: 26, color: '#36e08a' }} />
        <div style={{ fontFamily: MANROPE }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#36e08a' }}>2026 General Election</div>
          <div style={{ fontSize: 13, color: '#9aa0aa' }}>Approximate — official date to be confirmed</div>
        </div>
      </div>
      <div style={{ marginLeft: 'auto', textAlign: 'right', fontFamily: MANROPE }}>
        <div style={{ fontSize: 38, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
          {days === null ? '—' : `~${days.toLocaleString('en-NZ')}`}
        </div>
        <div style={{ fontSize: 13, color: '#9aa0aa' }}>days to go</div>
      </div>
    </div>
  )
}
