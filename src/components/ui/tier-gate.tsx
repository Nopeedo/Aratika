import * as React from 'react'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { PREMIUM_ENABLED } from '@/constants/features'
import { Button } from './button'

interface TierGateProps {
  children: React.ReactNode
  isLocked: boolean
  feature?: string
  className?: string
}

/**
 * Wraps content that requires a premium subscription.
 * When locked: blurs content and shows upgrade prompt overlay.
 * When unlocked: renders children normally.
 *
 * IMPORTANT: This is a UI-only gate. Actual data must be withheld
 * server-side for paid features — never rely on this component alone.
 */
export function TierGate({ children, isLocked, feature, className }: TierGateProps) {
  // Paid tier off → never lock.
  if (!PREMIUM_ENABLED || !isLocked) return <>{children}</>

  return (
    <div className={cn('relative rounded-xl overflow-hidden', className)}>
      {/* Blurred content preview */}
      <div className="tier-locked" aria-hidden="true">
        {children}
      </div>

      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm rounded-xl p-6 text-center">
        <div className="flex items-center justify-center size-10 rounded-full bg-amber-100 text-amber-600">
          <Lock className="size-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">Premium Feature</p>
          {feature && (
            <p className="text-xs text-muted mt-0.5">{feature} requires a premium subscription</p>
          )}
        </div>
        <Button variant="premium" size="sm" asChild>
          <Link href="/subscription">Upgrade — $20/month</Link>
        </Button>
        <p className="text-xs text-muted">14-day free trial · Cancel anytime</p>
      </div>
    </div>
  )
}
