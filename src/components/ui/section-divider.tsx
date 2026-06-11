import * as React from 'react'
import { ShieldCheck, Users } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface SectionDividerProps {
  type: 'official' | 'sentiment'
  label?: string
  className?: string
}

/**
 * Visual separator that clearly communicates whether the following section
 * contains OFFICIAL verified data or PUBLIC SENTIMENT (user polls).
 *
 * This is a core credibility feature — it must appear wherever poll data
 * is displayed alongside official political data.
 */
export function SectionDivider({ type, label, className }: SectionDividerProps) {
  const isOfficial = type === 'official'

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium w-fit',
        isOfficial
          ? 'bg-official-bg text-official-text border border-official-border'
          : 'bg-sentiment-bg text-sentiment-text border border-sentiment-border',
        className,
      )}
    >
      {isOfficial ? (
        <ShieldCheck className="size-3.5 shrink-0" />
      ) : (
        <Users className="size-3.5 shrink-0" />
      )}
      {label ?? (isOfficial ? 'Official Data' : 'Public Sentiment')}
    </div>
  )
}
