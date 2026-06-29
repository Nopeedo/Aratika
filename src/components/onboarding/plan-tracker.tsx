'use client'

/**
 * PlanTracker — invisible. Mounted once in the root layout. Whenever the user
 * lands on a page that's one of their recommended steps, it quietly ticks that
 * step off, so their plan stays current without them lifting a finger.
 */

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { usePreferences } from '@/hooks/use-preferences'
import { usePlanProgress } from '@/hooks/use-plan-progress'
import { buildPlan } from '@/lib/onboarding/recommendations'

export function PlanTracker() {
  const pathname = usePathname()
  const { prefs, loaded } = usePreferences()
  const { markDone } = usePlanProgress()

  useEffect(() => {
    if (!loaded || !prefs.completed || !pathname) return
    for (const r of buildPlan(prefs)) {
      if (pathname === r.href || pathname.startsWith(r.href + '/')) markDone(r.href)
    }
  }, [pathname, loaded, prefs, markDone])

  return null
}
