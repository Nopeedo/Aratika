/**
 * /legislation/[slug] — the immersive reader for an approved, enriched bill/act.
 * Reads live from content_items (approved only). Until the unify step, this sits
 * alongside the static /bills pages.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getApprovedBillBySlug } from '@/lib/bills/live'
import { BillReader } from '@/components/bills/bill-reader'
import { BackLink } from '@/components/ui/back-link'
import { buildStancesByTopic } from '@/lib/positions/stances-by-topic'
import { BORDER, SECONDARY } from '@/constants/theme'

export const dynamic = 'force-dynamic'

const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const bill = await getApprovedBillBySlug(slug)
  if (!bill) return { title: 'Legislation not found' }
  return { title: bill.title, description: bill.summary?.slice(0, 155) ?? `Read ${bill.title} — Arapono's plain-language breakdown.` }
}

export default async function LegislationReaderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const bill = await getApprovedBillBySlug(slug)
  if (!bill) notFound()

  // Party positions for exactly the topics this bill touches — so "where parties
  // stand" opens in place rather than navigating the reader away.
  const stances = await buildStancesByTopic(bill.policyLinks.map((p) => p.topic))

  return (
    <div style={{ background: '#f5f8f4', minHeight: '100vh' }}>
      <div className="bg-dot-grid" style={{ background: '#f5f8f4', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '28px 36px 48px' }}>
          <BackLink fallbackHref="/legislation" label="Back" style={{ fontSize: 13, fontWeight: 600, color: SECONDARY, fontFamily: MANROPE, marginBottom: 24 }} />
          <BillReader bill={bill} stances={stances} />
        </div>
      </div>
    </div>
  )
}
