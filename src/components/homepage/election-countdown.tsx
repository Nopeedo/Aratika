'use client'

/**
 * ElectionCountdown — client component
 *
 * Calculates and displays days remaining to the 2026 NZ General Election.
 * Must be a client component so the date calculation runs in the browser
 * and stays accurate without needing a full page rebuild each day.
 *
 * The election date is a placeholder — update ELECTION_DATE once the
 * official date is announced by the Governor-General.
 */

import { useState, useEffect } from 'react'

// ─── Election date ────────────────────────────────────────────────────────────
// Confirmed: the 2026 General Election is on Saturday 7 November 2026 (announced by
// the Prime Minister on 21 January 2026).
export const ELECTION_DATE = new Date('2026-11-07T09:00:00+13:00')

export function ElectionCountdown() {
  // Compute the day-count ONLY on the client after mount. Calling new Date()
  // during render would make the server-rendered HTML and the first client
  // render disagree → a React hydration-mismatch warning. We render a stable
  // string on the server + first paint, then fill in the live count.
  const [days, setDays] = useState<number | null>(null)
  useEffect(() => {
    setDays(Math.ceil((ELECTION_DATE.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  }, [])

  if (days === null) return <span>● 2026 General Election</span>
  if (days <= 0) return <span>● 2026 General Election — Election Day</span>

  return (
    <span>
      ● 2026 General Election
      <span style={{ color: '#36e08a', fontWeight: 800 }}> — {days} days to go</span>
      <span style={{ color: '#9aa0aa', fontWeight: 500, fontSize: 11 }}>
        {' '}(Saturday 7 November)
      </span>
    </span>
  )
}
