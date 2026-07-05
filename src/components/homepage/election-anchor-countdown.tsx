'use client'

/**
 * AnchorCountdownTile — the countdown stat tile inside ElectionAnchor. Client-only
 * so the day-count fills in after mount (same pattern as ElectionCountdown /
 * CountdownBig — avoids a server/client hydration mismatch from new Date()).
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ELECTION_DATE } from './election-countdown'

const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function AnchorCountdownTile() {
  const [days, setDays] = useState<number | null>(null)
  useEffect(() => {
    setDays(Math.max(0, Math.ceil((ELECTION_DATE.getTime() - Date.now()) / 86_400_000)))
  }, [])

  return (
    <Link href="/elections/2026" style={{ display: 'block', textDecoration: 'none', background: 'rgba(54,224,138,.08)', border: '1px solid rgba(54,224,138,.22)', borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.55)', fontFamily: MANROPE, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>
        Sat 7 Nov 2026
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#36e08a', fontFamily: MANROPE, lineHeight: 1.1 }}>
        {days === null ? '—' : days} <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.6)' }}>days to go</span>
      </div>
    </Link>
  )
}
