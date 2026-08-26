/**
 * /dashboard/tracked/[kind]/[ref] — everything that has happened on one tracked
 * item.
 *
 * The tile's focused panel is a preview: it shows the ten most pressing and then
 * points here. This is the archive — no three-day window, no cap, read and
 * unread together, oldest coverage still reachable.
 *
 * The window exists so counts stay meaningful, not to hide anything. Routine
 * coverage that has aged out of the badge is still here in full, which is what
 * makes the window safe to apply at all.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { TrackedHistory, type HistoryItem } from '@/components/bookmarks/tracked-history'
import { BORDER, INK, MANROPE, SECONDARY, WOVEN_PAGE } from '@/constants/theme'

export const metadata: Metadata = { title: 'Tracked updates', robots: { index: false, follow: false } }

const KIND_LABEL: Record<string, string> = {
  mp: 'MP', party: 'Party', policy: 'Policy issue',
  bill: 'Bill', electorate: 'Electorate', battleground: 'Battleground',
}

export default async function TrackedItemPage(
  { params }: { params: Promise<{ kind: string; ref: string }> },
) {
  const { kind, ref } = await params
  const refId = decodeURIComponent(ref)
  if (!KIND_LABEL[kind]) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/dashboard/tracked/${kind}/${ref}`)}`)

  // The bookmark gives the display name and where the item itself lives. RLS
  // scopes both queries to this user.
  const { data: bm } = await supabase
    .from('bookmarks')
    .select('label, sublabel, href')
    .eq('kind', kind).eq('ref_id', refId)
    .maybeSingle()

  const { data: rows } = await supabase
    .from('notification_queue')
    .select('id, category, title, body, url, created_at, read_at')
    .eq('entity_kind', kind).eq('entity_ref', refId)
    .order('created_at', { ascending: false })
    .limit(300)
  const items = (rows ?? []) as HistoryItem[]

  const label = bm?.label ?? refId

  return (
    <div style={WOVEN_PAGE}>
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="ap-col" style={{ maxWidth: 820, margin: '0 auto', padding: '22px clamp(18px, 5vw, 36px) 26px' }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, textDecoration: 'none', marginBottom: 14 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> Dashboard
          </Link>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase', color: SECONDARY, fontFamily: MANROPE }}>
            {KIND_LABEL[kind]} you track
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '4px 0 6px' }}>
            {label}
          </h1>
          <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>
            Everything recorded since you started tracking {label}
            {bm?.href && <> · <Link href={bm.href} style={{ color: SECONDARY }}>go to {label}</Link></>}
          </p>
        </div>
      </div>

      <div className="ap-col" style={{ maxWidth: 820, margin: '0 auto', padding: '22px clamp(18px, 5vw, 36px) 56px' }}>
        <TrackedHistory items={items} />
      </div>
    </div>
  )
}
