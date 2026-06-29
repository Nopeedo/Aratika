/** DELETE /api/annotations/[id] — remove one of the user's own highlights. */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'auth' }, { status: 401 })

  // RLS limits this to the user's own row.
  const { error } = await supabase.from('bill_annotations').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'delete_failed', message: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
