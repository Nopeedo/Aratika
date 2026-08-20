'use client'

/**
 * NotificationInbox — what you were told, and where it goes.
 *
 * Until now a notification existed once, as a push. Miss it, swipe it away, or
 * be signed in on a device without push, and the update was gone: the queue row
 * survived in the database with its headline and link, but nothing in the app
 * could read it. The dashboard's red dot knew something had changed and could
 * neither say what nor take you there.
 *
 * Every row already stores a destination, so each item here is a link to the
 * thing itself — the article, the bill, the party page — not to a summary of it.
 *
 * Reading marks as read. Opening one marks that one; "Mark all read" clears the
 * rest. Nothing is marked read merely by rendering: an unread badge that empties
 * itself when the page loads is the localStorage dot's mistake, and it is what
 * makes people stop trusting the count.
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, ExternalLink, Check, Loader2 } from 'lucide-react'
import { BORDER, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY } from '@/constants/theme'

export interface InboxItem {
  id: string
  urgency: string
  category: string
  title: string
  body: string | null
  url: string | null
  created_at: string
  read_at: string | null
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Day heading. Resolved after mount — "today" straddles midnight between the
 *  server and the browser, and this codebase has shipped that hydration bug. */
function dayLabel(iso: string, todayISO: string | null): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const day = `${d.getDate()} ${MONTHS[d.getMonth()]}`
  if (!todayISO) return day
  const local = d.toLocaleDateString('en-CA')
  if (local === todayISO) return 'Today'
  const y = new Date(Date.parse(todayISO) - 86_400_000).toLocaleDateString('en-CA')
  if (local === y) return 'Yesterday'
  return day
}

const CATEGORY_LABEL: Record<string, string> = {
  news: 'News', video: 'Video', bill: 'Bill', election: 'Election',
  position: 'Policy position', candidate: 'Candidate', submission: 'Submissions',
}

export function NotificationInbox({ initial, initialUnread }: { initial: InboxItem[]; initialUnread: number }) {
  const [items, setItems] = useState(initial)
  const [unread, setUnread] = useState(initialUnread)
  const [busy, setBusy] = useState(false)
  const [today, setToday] = useState<string | null>(null)
  useEffect(() => { setToday(new Date().toLocaleDateString('en-CA')) }, [])

  const markRead = useCallback(async (ids: string[] | 'all') => {
    setBusy(true)
    // Optimistic: the inbox should feel immediate, and a failed write leaves the
    // row unread server-side, which is the safe direction to be wrong in.
    setItems((xs) => xs.map((x) => (ids === 'all' || ids.includes(x.id)) && !x.read_at
      ? { ...x, read_at: new Date().toISOString() } : x))
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids === 'all' ? { all: true } : { ids }),
      })
      const d = await res.json()
      if (typeof d.unread === 'number') setUnread(d.unread)
    } catch { /* offline — the optimistic state stands until a reload */ }
    setBusy(false)
  }, [])

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 20px', fontFamily: MANROPE }}>
        <Bell style={{ width: 26, height: 26, color: TERTIARY, margin: '0 auto 10px' }} />
        <div style={{ fontSize: 15, fontWeight: 800, color: INK }}>Nothing yet</div>
        <p style={{ fontSize: 13, color: SECONDARY, margin: '6px auto 0', maxWidth: 380, lineHeight: 1.5 }}>
          When something you track is in the news, or a bill you follow moves, it lands here —
          whether or not you saw the notification on your phone.
        </p>
      </div>
    )
  }

  let lastDay = ''

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE }}>
          {unread > 0
            ? <><b style={{ color: INK }}>{unread}</b> unread</>
            : 'All caught up'}
        </div>
        {unread > 0 && (
          <button onClick={() => markRead('all')} disabled={busy} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, cursor: busy ? 'default' : 'pointer',
            fontSize: 12.5, fontWeight: 800, fontFamily: MANROPE, padding: '7px 13px',
            borderRadius: 999, border: `1px solid ${BORDER}`, background: '#fff', color: INK,
          }}>
            {busy ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <Check style={{ width: 13, height: 13 }} />}
            Mark all read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((n) => {
          const day = dayLabel(n.created_at, today)
          const showDay = day !== lastDay
          lastDay = day
          const external = !!n.url && /^https?:\/\//.test(n.url)
          const unreadRow = !n.read_at

          const inner = (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {unreadRow && <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: JADE, flexShrink: 0 }} />}
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>
                  {CATEGORY_LABEL[n.category] ?? n.category}
                </span>
                {external && <ExternalLink style={{ width: 11, height: 11, color: TERTIARY }} />}
              </div>
              <div style={{ fontSize: 14, fontWeight: unreadRow ? 800 : 700, color: INK, fontFamily: MANROPE, lineHeight: 1.35 }}>
                {n.title}
              </div>
              {n.body && (
                <div style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, marginTop: 3, lineHeight: 1.45, whiteSpace: 'pre-line' }}>
                  {n.body}
                </div>
              )}
            </>
          )

          const style: React.CSSProperties = {
            display: 'block', textDecoration: 'none', padding: '12px 14px', borderRadius: 12,
            border: `1px solid ${unreadRow ? BORDER : 'transparent'}`,
            background: unreadRow ? '#fff' : SURFACE,
          }

          return (
            <div key={n.id}>
              {showDay && (
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, margin: '12px 0 6px' }}>
                  {day}
                </div>
              )}
              {n.url
                ? external
                  ? <a href={n.url} target="_blank" rel="noopener noreferrer" onClick={() => markRead([n.id])} style={style}>{inner}</a>
                  : <Link href={n.url} onClick={() => markRead([n.id])} style={style}>{inner}</Link>
                : <div style={style}>{inner}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
