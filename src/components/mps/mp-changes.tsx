'use client'

/**
 * MpChanges — what has moved on this MP's record since you last looked.
 *
 * The "Impact this term" tiles are rebuilt from Parliament's API daily, so the
 * page only ever knew the present: a member's bill could pass into law and the
 * number would quietly tick from 0 to 1 with nothing to notice. Now
 * detect-mp-stat-changes.mjs keeps a dated changelog, and this renders the
 * entries newer than your last visit.
 *
 * Dated entries, not a last-run flag, is the whole point. "Changed today" is the
 * wrong question for a reader who was last here a fortnight ago.
 *
 * Shares the per-MP stamp with MpCoverage through useLastSeen, which reads and
 * writes it exactly once per page load. When each component managed its own
 * copy, whichever mounted first stamped the key and the other compared against a
 * timestamp set milliseconds earlier — so this banner never appeared at all.
 */

import { useLastSeen } from '@/hooks/use-last-seen'
import { TrendingUp } from 'lucide-react'
import { BORDER, INK, JADE, MANROPE, SECONDARY } from '@/constants/theme'

export interface StatChange {
  mp: string
  field: string
  label: string
  from: number
  to: number
  date: string
}

export function MpChanges({ slug, changes }: { slug: string; changes: StatChange[] }) {
  const since = useLastSeen(`mp_seen_${slug}`)

  // Nothing on a first visit: with no prior stamp we cannot say what is new to
  // this reader, and claiming everything is new would be worse than silence.
  if (since == null) return null
  const fresh = changes.filter((c) => {
    const t = Date.parse(`${c.date}T23:59:59Z`)
    return Number.isFinite(t) && t > since
  })
  if (fresh.length === 0) return null

  return (
    <div style={{
      border: `1px solid ${JADE}`, borderRadius: 12, background: '#f0fbf5',
      padding: '12px 14px', marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        <TrendingUp style={{ width: 14, height: 14, color: JADE }} />
        <span style={{ fontSize: 12.5, fontWeight: 800, color: INK, fontFamily: MANROPE }}>
          Changed since you last looked
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {fresh.map((c) => (
          <div key={`${c.field}-${c.date}`} style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.45 }}>
            <b style={{ color: INK }}>{c.label}</b>{' '}
            {c.from} → <b style={{ color: INK }}>{c.to}</b>
            <span style={{ color: BORDER }}> · </span>
            <span style={{ fontSize: 11.5 }}>{c.date}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
