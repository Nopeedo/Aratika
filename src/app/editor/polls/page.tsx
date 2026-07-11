/**
 * /editor/polls — where editors enter the published polls that drive the Election
 * Centre's poll-of-polls and seat projection. Gated to the editorial team. Polls
 * are entered manually (Aratika reports what pollsters publish) and go live on
 * approval — which, since an editor is entering them, is immediate.
 */

import Link from 'next/link'
import { Lock, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getEditor } from '@/lib/editor/auth'
import { PollAdmin, type EditorPoll } from '@/components/editor/poll-admin'

export const dynamic = 'force-dynamic'

const INK = '#0c0e12', SECONDARY = '#6b7078', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export default async function EditorPollsPage() {
  const { user, isEditor } = await getEditor()

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '44px 36px 36px' }}>
          <Link href="/editor" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none', marginBottom: 14 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> Editorial review
          </Link>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 8px' }}>Polls</h1>
          <p style={{ fontSize: 15, color: SECONDARY, fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
            Enter each published poll as it comes out. The Election Centre averages these into the poll-of-polls and seat
            projection — so keep every figure to what the pollster actually published, with a source link.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 36px 64px' }}>
        {!user ? (
          <Gate title="Sign in required" body="Entering polls is for the Aratika editorial team.">
            <Link href="/login" style={btn}>Log in</Link>
          </Gate>
        ) : !isEditor ? (
          <Gate title="Editors only" body="Your account isn’t on the editorial team. If you should have access, ask an admin to add you.">
            <Link href="/" style={btn}>Back to site</Link>
          </Gate>
        ) : (
          <PollAdmin initial={await loadPolls()} />
        )}
      </div>
    </div>
  )
}

async function loadPolls(): Promise<EditorPoll[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_items')
    .select('id, data')
    .eq('type', 'poll')
    .limit(100)
  const rows = (data as { id: string; data: Record<string, unknown> | null }[] | null) ?? []
  return rows
    .map((r) => {
      const d = r.data ?? {}
      return {
        id: r.id,
        pollster: String(d.pollster ?? ''),
        fieldwork: String(d.fieldwork ?? ''),
        date: String(d.date ?? ''),
        sourceUrl: String(d.sourceUrl ?? ''),
        parties: (d.parties && typeof d.parties === 'object' ? d.parties : {}) as Record<string, number>,
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
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
