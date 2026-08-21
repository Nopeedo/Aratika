'use client'

/**
 * TileUpdates — the count in the corner of a tracked tile, and what it opens.
 *
 * The tile used to carry a red dot driven by a localStorage "last visit"
 * comparison. It could say something had changed and neither name it nor take
 * you to it, cleared itself the moment the page rendered, and did not travel
 * between devices.
 *
 * This counts real unread notifications attributed to this tracked item
 * (notification_queue.entity_kind/entity_ref, added in migration 0014) and
 * expands to list them, split by what kind of thing moved: news, video,
 * legislation, policy positions. Each row links to the thing itself.
 *
 * Opening the list does NOT mark it read — reading an item does, or "Mark these
 * read" does. A count that empties itself because you glanced at the page is the
 * red dot's mistake, and it is what teaches people to stop trusting the number.
 */

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ExternalLink, Check } from 'lucide-react'
import { BORDER, INK, JADE, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

export interface TileUpdate {
  id: string
  category: string
  title: string
  url: string | null
  created_at: string
}

/** What kind of movement this was, in the reader's language. Grouped rather than
 *  listed flat so "3 updates" resolves to "2 news, 1 bill" at a glance. */
const GROUPS: { key: string; label: string; match: (c: string) => boolean }[] = [
  { key: 'news', label: 'News', match: (c) => c === 'news' },
  { key: 'video', label: 'Video', match: (c) => c === 'video' },
  { key: 'bill', label: 'Legislation', match: (c) => c === 'bill' || c === 'submission' },
  { key: 'position', label: 'Policy positions', match: (c) => c === 'position' || c === 'deep-dive' },
  { key: 'other', label: 'Other', match: () => true },
]

function group(items: TileUpdate[]) {
  const out: { label: string; items: TileUpdate[] }[] = []
  const taken = new Set<string>()
  for (const g of GROUPS) {
    const hit = items.filter((i) => !taken.has(i.id) && g.match(i.category))
    hit.forEach((i) => taken.add(i.id))
    if (hit.length) out.push({ label: g.label, items: hit })
  }
  return out
}

export function TileUpdates({ label, updates, onRead }: {
  label: string
  updates: TileUpdate[]
  onRead: (ids: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  if (updates.length === 0) return null
  const grouped = group(updates)

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o) }}
        aria-expanded={open}
        aria-label={`${updates.length} update${updates.length === 1 ? '' : 's'} on ${label}`}
        title={grouped.map((g) => `${g.items.length} ${g.label.toLowerCase()}`).join(', ')}
        style={{
          position: 'absolute', top: 6, right: 6, zIndex: 3, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 3,
          minWidth: 22, height: 22, padding: '0 7px', borderRadius: 999,
          background: JADE, color: '#fff', border: '2px solid #fff',
          fontSize: 11.5, fontWeight: 800, fontFamily: MANROPE, lineHeight: 1,
        }}
      >
        {updates.length}
        <ChevronDown style={{ width: 10, height: 10, transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div style={{ borderTop: `1px solid ${BORDER}`, background: '#fff', padding: '8px 10px 10px' }}>
          {grouped.map((g) => (
            <div key={g.label} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, margin: '4px 0 3px' }}>
                {g.label} · {g.items.length}
              </div>
              {g.items.map((u) => {
                const external = !!u.url && /^https?:\/\//.test(u.url)
                const body = (
                  <span style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.3 }}>
                      {u.title}
                    </span>
                    {external && <ExternalLink style={{ width: 9, height: 9, color: TERTIARY, flexShrink: 0, marginTop: 3 }} />}
                  </span>
                )
                const style: React.CSSProperties = { display: 'block', textDecoration: 'none', padding: '5px 0' }
                return u.url
                  ? external
                    ? <a key={u.id} href={u.url} target="_blank" rel="noopener noreferrer" onClick={() => onRead([u.id])} style={style}>{body}</a>
                    : <Link key={u.id} href={u.url} onClick={() => onRead([u.id])} style={style}>{body}</Link>
                  : <div key={u.id} style={style}>{body}</div>
              })}
            </div>
          ))}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRead(updates.map((u) => u.id)); setOpen(false) }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', marginTop: 2,
              background: 'none', border: 'none', padding: 0,
              fontSize: 11.5, fontWeight: 800, color: SECONDARY, fontFamily: MANROPE,
            }}
          >
            <Check style={{ width: 11, height: 11 }} /> Mark these read
          </button>
        </div>
      )}
    </>
  )
}
