/** Server-side editorial-team check. An editor is a row in public.editors. */
import { createClient } from '@/lib/supabase/server'

export async function getEditor() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, isEditor: false }
  const { data } = await supabase.from('editors').select('user_id').eq('user_id', user.id).maybeSingle()
  return { user, isEditor: !!data }
}
