'use client'

/**
 * useUser — current Supabase auth user + premium status.
 * Premium is read from the subscriptions table (status active/trialing); if that
 * table isn't there yet it falls back to a user_metadata.tier flag, so manual
 * testing still works before Stripe is fully wired.
 */

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

const ACTIVE_STATUSES = ['active', 'trialing']

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [subStatus, setSubStatus] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  // Look up subscription status whenever the user changes.
  useEffect(() => {
    if (!user) { setSubStatus(null); return }
    const supabase = createClient()
    supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(
        ({ data }) => setSubStatus((data?.status as string) ?? null),
        () => setSubStatus(null), // table missing / offline — ignore
      )
  }, [user])

  const metadataTier = user?.user_metadata?.tier as string | undefined
  const isPremium = ACTIVE_STATUSES.includes(subStatus || '') || metadataTier === 'premium'

  return { user, loading, isPremium, subStatus }
}
