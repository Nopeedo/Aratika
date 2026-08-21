'use client'

/**
 * NotificationInbox — what you were told, and where it goes.
 *
 * Until now a notification existed once, as a push. Miss it, swipe it away, or
 * be signed in on a device without push, and the update was gone: the queue row
 * survived with its headline and link, but nothing in the app could read it.
 *
 * COLLAPSED BY DEFAULT, because the volume is real. The busiest account takes a
 * median of 30 updates a day and has peaked at 52 — rendered flat, that is a
 * wall nobody reads, and the push sender already batches a day into a single
 * "N updates" message. So the inbox does the same: one line per day, opened on
 * request, and an opened day shows six before offering the rest.
 *
 * Duplicates are folded here too. The dedup key is per (user, item), which stops
 * one row notifying twice — but the same story ingested from two feeds is two
 * different content_items, so it arrives twice. 41 of the first 202 rows were
 * repeat titles. Folding them is presentation; the underlying rows are
 * untouched, and marking the fold read marks all of them.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Bell, ExternalLink, Check, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
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

/** One story, plus any duplicate rows folded into it. */
interface Entry extends InboxItem { ids: string[]; dupes: number }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const CATEGORY_LABEL: Record<string, string> = {
  news: 'News', video: 'Video', bill: 'Bill', election: 'Election',
  position: 'Policy position', candidate: 'Candidate', submission: 'Submissions',
}

/** Same headline from two outlets is one story. Punctuation and case vary
 *  between feeds, so compare on letters and digits only. */
/** How many items an opened day shows before asking. */
const PAGE = 6

const storyKey = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

function dayLabel(iso: string, todayISO: string | null): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const day = `${d.getDate()} ${MONTHS[d.getMonth()]}`
  if (!todayISO) return day
  const local = d.toLocaleDateString('en-CA')
  if (local === todayISO) return 'Today'
  if (local === new Date(Date.parse(todayISO) - 86_400_000).toLocaleDateString('en-CA')) return 'Yesterday'
  return day
}

export function NotificationInbox({ initial, initialUnread }: { initial: InboxItem[]; initialUnread: number }) {
  const [items, setItems] = useState(initial)
  const [unread, setUnread] = useState(initialUnread)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [showAll, setShowAll] = useState<Record<string, boolean>>({})
  const [today, setToday] = useState<string | null>(null)
  useEffect(() => { setToday(new Date().toLocaleDateString('en-CA')) }, [])

  // Fold duplicates, then group by day. Newest first throughout.
  const days = useMemo(() => {
    const seen = new Map<string, Entry>()
    for (const n of items) {
      const k = storyKey(n.title)
      const hit = seen.get(k)
      if (hit) { hit.ids.push(n.id); hit.dupes++; if (!n.read_at) hit.read_at = null; continue }
      seen.set(k, { ...n, ids: [n.id], dupes: 0 })
    }
    const groups = new Map<string, Entry[]>()
    for (const e of seen.values()) {
      const label = dayLabel(e.created_at, today)
      if (!groups.has(label)) groups.set(label, [])
      groups.get(label)!.push(e)
    }
    return [...groups.entries()]
  }, [items, today])

  const markRead = useCallback(async (ids: string[] | 'all') => {
    setBusy(true)
    setItems((xs) => xs.map((x) => (ids === 'all' || ids.includes(x.id)) && !x.read_at
      ? { ...x, read_at: new Date().toISOString() } : x))
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids === 'all' ? { all: true } : { ids }),
      })
      const d = await res.json()
      if (typeof d.unread === 'number') setUnread(d.unread)
    } catch { /* offline — optimistic state stands until a reload */ }
    setBusy(false)
  }, [])

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '36px 20px', fontFamily: MANROPE }}>
        <Bell style={{ width: 24, height: 24, color: TERTIARY, margin: '0 auto 8px' }} />
        <div style={{ fontSize: 14.5, fontWeight: 800, color: INK }}>Nothing yet</div>
        <p style={{ fontSize: 12.5, color: SECONDARY, margin: '6px auto 0', maxWidth: 360, lineHeight: 1.5 }}>
          When something you track is in the news, or a bill you follow moves, it lands here —
          whether or not the notification reached your phone.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE }}>
          {unread > 0 ? <><b style={{ color: INK }}>{unread}</b> unread</> : 'All caught up'}
        </div>
        {unread > 0 && (
          <button onClick={() => markRead('all')} disabled={busy} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, cursor: busy ? 'default' : 'pointer',
            fontSize: 12.5, fontWeight: 800, fontFamily: MANROPE, padding: '6px 12px',
            borderRadius: 999, border: `1px solid ${BORDER}`, background: '#fff', color: INK,
          }}>
            {busy ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <Check style={{ width: 13, height: 13 }} />}
            Mark all read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {days.map(([label, entries]) => {
          // NOTHING auto-expanded. At a median of 30 updates a day, opening even
          // one day makes this the tallest thing on the dashboard — which is what
          // it became. Collapsed, the whole section is a handful of lines and the
          // reader chooses what to open.
          const isOpen = open[label] ?? false
          const dayUnread = entries.filter((e) => !e.read_at).length
          return (
            <div key={label} style={{ border: `1px solid ${BORDER}`, borderRadius: 12, background: isOpen ? '#fff' : SURFACE, overflow: 'hidden' }}>
              <button
                onClick={() => setOpen((o) => ({ ...o, [label]: !isOpen }))}
                aria-expanded={isOpen}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer',
                  background: 'none', border: 'none', padding: '10px 13px', textAlign: 'left', fontFamily: MANROPE,
                }}
              >
                {isOpen ? <ChevronDown style={{ width: 15, height: 15, color: TERTIARY }} /> : <ChevronRight style={{ width: 15, height: 15, color: TERTIARY }} />}
                <span style={{ fontSize: 13, fontWeight: 800, color: INK }}>{label}</span>
                <span style={{ fontSize: 12, color: SECONDARY }}>
                  {entries.length} update{entries.length === 1 ? '' : 's'}
                </span>
                {dayUnread > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, color: '#fff', background: JADE, borderRadius: 999, padding: '2px 8px' }}>
                    {dayUnread} new
                  </span>
                )}
              </button>

              {isOpen && (
                <div style={{ padding: '0 8px 8px' }}>
                  {(showAll[label] ? entries : entries.slice(0, PAGE)).map((n) => {
                    const external = !!n.url && /^https?:\/\//.test(n.url)
                    const unreadRow = !n.read_at
                    const inner = (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                          {unreadRow && <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: JADE, flexShrink: 0 }} />}
                          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE }}>
                            {CATEGORY_LABEL[n.category] ?? n.category}
                          </span>
                          {n.dupes > 0 && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: TERTIARY, fontFamily: MANROPE }}>
                              · {n.dupes + 1} sources
                            </span>
                          )}
                          {external && <ExternalLink style={{ width: 10, height: 10, color: TERTIARY }} />}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: unreadRow ? 800 : 700, color: INK, fontFamily: MANROPE, lineHeight: 1.3 }}>
                          {n.title}
                        </div>
                      </>
                    )
                    const style: React.CSSProperties = {
                      display: 'block', textDecoration: 'none', padding: '7px 11px',
                      borderRadius: 9, background: unreadRow ? 'transparent' : 'transparent',
                      opacity: unreadRow ? 1 : 0.62,
                    }
                    return n.url
                      ? external
                        ? <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer" onClick={() => markRead(n.ids)} style={style}>{inner}</a>
                        : <Link key={n.id} href={n.url} onClick={() => markRead(n.ids)} style={style}>{inner}</Link>
                      : <div key={n.id} style={style}>{inner}</div>
                  })}
                  {entries.length > PAGE && !showAll[label] && (
                    <button onClick={() => setShowAll((v) => ({ ...v, [label]: true }))} style={{
                      display: 'block', width: '100%', textAlign: 'left', padding: '8px 11px', cursor: 'pointer',
                      background: 'none', border: 'none', fontFamily: MANROPE, fontSize: 12.5, fontWeight: 800, color: JADE,
                    }}>
                      Show {entries.length - PAGE} more
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
