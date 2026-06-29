/**
 * /editor — the editorial review queue. Gated to members of the editorial team
 * (public.editors). Editors review pipeline-pulled items, refine the neutral
 * summary, and approve/reject. Only approved items appear on the public site.
 */

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getEditor } from '@/lib/editor/auth'
import { ReviewList, type PendingItem } from '@/components/editor/review-list'

export const dynamic = 'force-dynamic'

const INK = '#0c0e12', SECONDARY = '#6b7078', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export default async function EditorPage() {
  const { user, isEditor } = await getEditor()

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '44px 36px 36px' }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 8px' }}>Editorial review</h1>
          <p style={{ fontSize: 15, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
            Items the daily pipeline pulled from official sources, awaiting an editor’s check. Nothing here is on the public
            site until it’s approved — make sure each reads factually and neutrally.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 36px 64px' }}>
        {!user ? (
          <Gate title="Sign in required" body="The editorial review queue is for the Aratika editorial team.">
            <Link href="/login" style={btn}>Log in</Link>
          </Gate>
        ) : !isEditor ? (
          <Gate title="Editors only" body="Your account isn’t on the editorial team. If you should have access, ask an admin to add you.">
            <Link href="/" style={btn}>Back to site</Link>
          </Gate>
        ) : (
          <ReviewList initial={await loadPending()} />
        )}
      </div>
    </div>
  )
}

async function loadPending(): Promise<PendingItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_items')
    .select('id, type, title, data, summary, change_kind, source_url, fetched_at')
    .eq('status', 'pending')
    .order('fetched_at', { ascending: false })
    .limit(400)
  // Only show items that are READY for editorial review — i.e. legislation that's
  // been AI-drafted (has a summary + breakdown). Raw, un-enriched feed items are
  // "pending enrichment", not "pending review", so they're hidden here.
  const items = (data as (PendingItem & { data: { enriched?: boolean } })[] | null) ?? []
  return items.filter((it) => it.type !== 'legislation' || it.data?.enriched === true).slice(0, 100)
}

function Gate({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: '50px 0', maxWidth: 440, margin: '0 auto' }}>
      <div style={{ width: 50, height: 50, borderRadius: 13, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Lock style={{ width: 23, height: 23, color: JADE }} /></div>
      <div style={{ fontSize: 19, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 8 }}>{title}</div>
      <p style={{ fontSize: 14, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55, margin: '0 0 18px' }}>{body}</p>
      {children}
    </div>
  )
}

const btn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 11, background: JADE, color: '#fff', fontSize: 14, fontWeight: 800, textDecoration: 'none', fontFamily: MANROPE }
