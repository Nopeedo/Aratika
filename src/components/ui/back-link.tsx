'use client'

/**
 * BackLink — returns the user to wherever they came from (browser back), so a
 * bill opened from /bills goes back to /bills, not to /legislation. Falls back
 * to `fallbackHref` when there's no in-app history (e.g. a direct/external hit).
 */

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export function BackLink({ fallbackHref, label = 'Back', style }: { fallbackHref: string; label?: string; style?: React.CSSProperties }) {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined' && window.history.length > 1) router.back()
        else router.push(fallbackHref)
      }}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', padding: 0, cursor: 'pointer', ...style }}
    >
      <ArrowLeft style={{ width: 14, height: 14 }} /> {label}
    </button>
  )
}
