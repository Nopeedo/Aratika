'use client'

/**
 * TrackedHistory — the full record for one tracked item.
 *
 * Where the tile's panel is a preview (ten items, routine coverage older than
 * three days withheld so the count stays meaningful), this is the archive: every
 * notification, read and unread, however old, filterable by type.
 *
 * That distinction is the whole reason the three-day window is safe. Nothing is
 * deleted or hidden — it stops demanding attention and lands here instead.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Play } from 'lucide-react'
import { isUrgent } from '@/lib/notifications/rules'
import { BORDER, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY } from '@/constants/theme'

export interface HistoryItem {
  id: string
  category: string
  title: string
  body: string | null
  url: string | null
  created_at: string
  read_at: string | null
}

const CATEGORY_LABEL: Record<string, string> = {
  news: 'News', video: 'Video', bill: 'Legislation', submission: 'Legislation',
  candidate: 'Candidates', election: 'Election', position: 'Policy positions',
  'deep-dive': 'Policy positions',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function longDate(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function TrackedHistory({ items }: { items: HistoryItem[] }) {
  const [filter, setFilter] = useState<string>('all')

  const filters = useMemo(() => {
    const counts = new Map<string, number>()
    for (const i of items) {
      const key = CATEGORY_LABEL[i.category] ?? 'Other'
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [items])

  const shown = filter === 'all'
    ? items
    : items.filter((i) => (CATEGORY_LABEL[i.category] ?? 'Other') === filter)

  if (items.length === 0) {
    return (
      <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>
        Nothing recorded yet. Updates start appearing here the first time something you track is in
        the news, moves through Parliament, or reaches a date that matters.
      </p>
    )
  }

  const chip = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
    fontSize: 12.5, fontWeight: 700, fontFamily: MANROPE, padding: '6px 12px', borderRadius: 999,
    border: `1px solid ${active ? JADE : BORDER}`,
    background: active ? `${JADE}1a` : '#fff',
    color: INK,
  })

  let lastDay = ''

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18 }}>
        <button onClick={() => setFilter('all')} style={chip(filter === 'all')}>
          Everything · {items.length}
        </button>
        {filters.map(([label, n]) => (
          <button key={label} onClick={() => setFilter(label)} style={chip(filter === label)}>
            {label} · {n}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {shown.map((i) => {
          const day = longDate(i.created_at)
          const showDay = day !== lastDay
          lastDay = day
          const external = !!i.url && /^https?:\/\//.test(i.url)
          const video = i.category === 'video'
          const urgent = isUrgent(i.category)

          const inner = (
            <>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                {urgent && (
                  <span style={{
                    fontSize: 9.5, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase',
                    color: '#fff', background: '#b42318', borderRadius: 999, padding: '1px 6px', fontFamily: MANROPE,
                  }}>Urgent</span>
                )}
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>
                  {CATEGORY_LABEL[i.category] ?? i.category}
                </span>
                {/* Ink, matching the tile badge — see command-centre.tsx. */}
                {!i.read_at && <span aria-label="Unread" style={{ width: 6, height: 6, borderRadius: '50%', background: INK }} />}
                {video ? <Play style={{ width: 11, height: 11, color: TERTIARY }} />
                  : external ? <ExternalLink style={{ width: 11, height: 11, color: TERTIARY }} /> : null}
              </span>
              <span style={{ display: 'block', fontSize: 14, fontWeight: i.read_at ? 700 : 800, color: INK, fontFamily: MANROPE, lineHeight: 1.35 }}>
                {i.title}
              </span>
              {i.body && (
                <span style={{ display: 'block', fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, marginTop: 2 }}>{i.body}</span>
              )}
            </>
          )
          const style: React.CSSProperties = {
            display: 'block', textDecoration: 'none', padding: '12px 14px',
            borderRadius: 11, background: i.read_at ? 'transparent' : SURFACE,
            border: `1px solid ${i.read_at ? 'transparent' : BORDER}`,
            marginBottom: 6,
          }

          return (
            <div key={i.id}>
              {showDay && (
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, margin: '14px 0 6px' }}>
                  {day}
                </div>
              )}
              {i.url
                ? external
                  ? <a href={i.url} target="_blank" rel="noopener noreferrer" style={style}>{inner}</a>
                  : <Link href={i.url} style={style}>{inner}</Link>
                : <div style={style}>{inner}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
