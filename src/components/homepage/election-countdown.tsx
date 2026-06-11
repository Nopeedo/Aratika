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

// ─── Placeholder election date ────────────────────────────────────────────────
// NZ elections are held on Saturdays. Based on the 3-year cycle from the
// 14 October 2023 election, the 2026 election is expected around October 2026.
// Update this constant once the official date is set.
const ELECTION_DATE = new Date('2026-10-10T09:00:00+13:00')

export function ElectionCountdown() {
  const now  = new Date()
  const diff = ELECTION_DATE.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (days <= 0) {
    return <span>● 2026 General Election — Election Day</span>
  }

  return (
    <span>
      ● 2026 General Election
      <span style={{ color: '#36e08a', fontWeight: 800 }}> — {days} days to go</span>
      <span style={{ color: '#9aa0aa', fontWeight: 500, fontSize: 11 }}>
        {' '}(date approximate — official date TBC)
      </span>
    </span>
  )
}
