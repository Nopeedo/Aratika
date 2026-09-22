'use client'

/**
 * PendingTrackSync — renders nothing; makes "it'll be tracked when you're in"
 * true on every signed-in page, not only pages that happen to have a Track
 * button.
 *
 * The sync used to live only inside useBookmarks, which is mounted by Track
 * buttons and the try-it tray. A reader whose confirmation link dropped the
 * return path landed on /dashboard, a server-rendered page with neither, and
 * the thing they tapped stayed in localStorage while their command centre
 * rendered empty. This sits in the site layout, runs the same shared sync,
 * and refreshes the server-rendered tree once something has been posted so a
 * dashboard list rendered before the POST shows the item without a reload.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { syncPendingTracks } from '@/hooks/use-bookmarks'

export function PendingTrackSync() {
  const { user, loading } = useUser()
  const router = useRouter()
  useEffect(() => {
    if (loading || !user) return
    let live = true
    syncPendingTracks(user.id).then((posted) => { if (live && posted) router.refresh() }).catch(() => {})
    return () => { live = false }
  }, [user, loading, router])
  return null
}
