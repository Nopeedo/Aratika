'use client'

/**
 * MarkSeen — sets a cookie the first time someone views the landing page, so on
 * their NEXT visit the server sends them to /hub (the returning-user hub) instead
 * of the marketing landing page. Renders nothing.
 */

import { useEffect } from 'react'

export function MarkSeen() {
  useEffect(() => {
    document.cookie = `arapono_seen=1; max-age=${60 * 60 * 24 * 180}; path=/; samesite=lax`
  }, [])
  return null
}
