/**
 * BillsForTopic — "What's been legislated this term" band for /policies/[topic].
 * Connects the legislative record (bills-54) to the party comparison already on
 * the page: shows what's actually become law / is in progress in this topic.
 */

import Link from 'next/link'
import { ScrollText, ArrowRight, BadgeCheck, Clock } from 'lucide-react'
import { billsForTopic } from '@/lib/bills/by-topic'
import { BILLS_54_META } from '@/constants/bills-54'
import type { PolicyTopic } from '@/types'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function BillsForTopic({ topic, label }: { topic: PolicyTopic; label: string }) {
  const { passed, active, total } = billsForTopic(topic)
  if (total === 0) return null

  // Lead with passed (the record), then a couple of active bills. Cap to keep it tight.
  const show = [...passed.slice(0, 5), ...active.slice(0, 3)].slice(0, 6)

  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18, padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
        <ScrollText style={{ width: 17, height: 17, color: JADE }} />
        <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>What’s been legislated this term</h2>
      </div>
      <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 14px' }}>
        On {label.toLowerCase()}, this Parliament has{' '}
        <b style={{ color: INK }}>{passed.length} {passed.length === 1 ? 'bill' : 'bills'} passed into law</b>
        {active.length > 0 && <> and <b style={{ color: INK }}>{active.length} more in progress</b></>}. The record beside the promises.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {show.map((b) => {
          const isLaw = b.status === 'Royal Assent'
          return (
            <div key={b.slug + b.number} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10 }}>
              {isLaw
                ? <BadgeCheck style={{ width: 15, height: 15, color: '#166638', flexShrink: 0 }} />
                : <Clock style={{ width: 15, height: 15, color: '#b45309', flexShrink: 0 }} />}
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: INK, fontFamily: MANROPE, lineHeight: 1.4 }}>{b.title}</span>
              <span style={{ fontSize: 10.5, fontWeight: 800, whiteSpace: 'nowrap', color: isLaw ? '#065f46' : '#92400e', background: isLaw ? '#d1fae5' : '#fff7e6', borderRadius: 999, padding: '3px 9px', fontFamily: MANROPE }}>
                {isLaw ? 'Now law' : b.status}
              </span>
            </div>
          )
        })}
      </div>

      <Link href="/bills" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
        See all {label.toLowerCase()} bills on the tracker <ArrowRight style={{ width: 14, height: 14 }} />
      </Link>
      <p style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE, margin: '10px 0 0' }}>
        Source: {BILLS_54_META.sourceLabel}, as at {BILLS_54_META.asOf}.
      </p>
    </div>
  )
}
