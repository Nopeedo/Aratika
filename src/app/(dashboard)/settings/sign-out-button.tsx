'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BORDER, MANROPE } from '@/constants/theme'

export function SignOutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        await createClient().auth.signOut()
        router.push('/')
        router.refresh()
      }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7, cursor: busy ? 'default' : 'pointer',
        background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10,
        padding: '9px 14px', fontSize: 13.5, fontWeight: 700, color: '#b42318', fontFamily: MANROPE,
      }}
    >
      <LogOut style={{ width: 15, height: 15 }} /> {busy ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
