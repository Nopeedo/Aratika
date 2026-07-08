'use client'

/**
 * ExplainToggle — the "Explain the terms" switch for the navbar (desktop + mobile).
 * Turns the site-wide plain-language term definitions on or off (see useExplainMode).
 */

import { BookOpen } from 'lucide-react'
import { useExplainMode } from '@/hooks/use-explain-mode'
import { cn } from '@/lib/utils/cn'

export function ExplainToggle({ className }: { className?: string }) {
  const { enabled, ready, toggle } = useExplainMode()
  const on = ready && enabled

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Explain the terms — plain-language definitions for key political words"
      title="Explain the terms — plain-language definitions for key political words"
      onClick={toggle}
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
        on ? 'text-brand-jade' : 'text-muted hover:text-foreground hover:bg-surface',
        className,
      )}
    >
      <BookOpen className="size-4 shrink-0" />
      <span>Explain terms</span>
      <span className={cn('relative inline-block w-8 h-[18px] rounded-full transition-colors shrink-0', on ? 'bg-brand-jade' : 'bg-border')} aria-hidden="true">
        <span className={cn('absolute top-[2px] left-[2px] size-[14px] rounded-full bg-white transition-transform', on && 'translate-x-[14px]')} />
      </span>
    </button>
  )
}
