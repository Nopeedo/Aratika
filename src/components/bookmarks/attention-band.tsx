'use client'

/**
 * AttentionBand — the few notifications worth reading before anything else.
 *
 * Everything on the dashboard is about things you follow, so ordering by "what
 * you follow" tells you nothing. This orders by what you might have to act on: a
 * submission window open, a bill that moved, a new candidate in your seat, an
 * electoral deadline. Everything else — news, video, a party publishing a
 * position — stays as a count on its tile, where it can wait.
 *
 * RENDERS NOTHING WHEN THERE IS NOTHING. That is the whole design constraint.
 * An earlier inbox on this page was removed for growing the dashboard, and a
 * band that always shows something is that inbox with a new name. Measured on
 * the live queue: 270 of 277 unread notifications are news or video, and of the
 * seven that are not, only one is in the set this band accepts. Empty is the
 * normal state.
 *
 * Reading marks read, item by item. There is no bulk dismiss: with a handful of
 * items at most, "clear all" only exists to make a number go away, and these are
 * the ones where that would cost someone a deadline.
 */

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowRight, Check, ExternalLink } from 'lucide-react'
import { BORDER, INK, MANROPE, SECONDARY, TERTIARY } from '@/constants/theme'

export interface AttentionItem {
  id: string
  category: string
  title: string
  body: string | null
  url: string | null
  created_at: string
  /** The tracked thing this is about, for the "on X" label. */
  entityLabel?: string
}

const WHAT: Record<string, string> = {
  bill_submission: 'Submissions open',
  bill_status: 'Legislation moved',
  candidate: 'New candidate',
  election: 'Election date',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function when(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export function AttentionBand({ items }: { items: AttentionItem[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const live = items.filter((i) => !dismissed.has(i.id))

  async function markRead(id: string) {
    setDismissed((d) => new Set(d).add(id))
    try {
      await fetch('/api/notifications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      })
    } catch { /* offline — the optimistic clear stands until a reload */ }
  }

  if (live.length === 0) return null

  return (
    <div style={{
      background: '#fff7e6', border: '1px solid #f0d9a8', borderRadius: 16,
      padding: '14px 16px', marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <AlertCircle style={{ width: 16, height: 16, color: '#92400e', flexShrink: 0 }} />
        <h2 style={{ fontSize: 14.5, fontWeight: 800, color: '#7c4a12', fontFamily: MANROPE, margin: 0 }}>
          {live.length === 1 ? 'One thing needs you' : `${live.length} things need you`}
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {live.map((i) => {
          const external = !!i.url && /^https?:\/\//.test(i.url)
          const inner = (
            <>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 2 }}>
                <span style={{
                  fontSize: 9.5, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase',
                  color: '#fff', background: '#b45309', borderRadius: 999, padding: '2px 7px', fontFamily: MANROPE,
                }}>{WHAT[i.category] ?? i.category}</span>
                {i.entityLabel && (
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#8a5a1c', fontFamily: MANROPE }}>{i.entityLabel}</span>
                )}
                <span style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE }}>{when(i.created_at)}</span>
                {external && <ExternalLink style={{ width: 11, height: 11, color: TERTIARY }} />}
              </span>
              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.35 }}>{i.title}</span>
              {i.body && (
                <span style={{ display: 'block', fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, marginTop: 2, lineHeight: 1.5 }}>{i.body}</span>
              )}
            </>
          )
          const rowStyle: React.CSSProperties = {
            display: 'block', textDecoration: 'none', flex: 1, minWidth: 0,
          }

          return (
            <div key={i.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 11, padding: '10px 12px',
            }}>
              {i.url
                ? external
                  ? <a href={i.url} target="_blank" rel="noopener noreferrer" onClick={() => markRead(i.id)} style={rowStyle}>{inner}</a>
                  : <Link href={i.url} onClick={() => markRead(i.id)} style={rowStyle}>{inner}</Link>
                : <div style={rowStyle}>{inner}</div>}
              <button
                onClick={() => markRead(i.id)}
                aria-label={`Mark "${i.title}" as read`}
                title="Mark as read"
                style={{
                  flexShrink: 0, width: 28, height: 28, borderRadius: 8, cursor: 'pointer',
                  background: '#fff', border: `1px solid ${BORDER}`, color: SECONDARY,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Check style={{ width: 14, height: 14 }} />
              </button>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 10, fontSize: 11.5, color: '#8a5a1c', fontFamily: MANROPE, display: 'flex', alignItems: 'center', gap: 5 }}>
        <ArrowRight style={{ width: 12, height: 12 }} />
        News and video on what you follow stay on the tiles below.
      </div>
    </div>
  )
}
