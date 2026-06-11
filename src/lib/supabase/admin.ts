/**
 * Supabase admin client — uses the SERVICE ROLE key, which BYPASSES Row Level
 * Security. Only ever use this in trusted server code (e.g. the Stripe webhook).
 * Never import it into client components or expose the service role key.
 */

import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase admin env (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) is not set')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
