import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import { PARTY_COLORS } from '@/constants/parties'
import { PartySlug, MPStatus, BillStatus } from '@/types'

// ─── Generic Badge ────────────────────────────────────────────────────────────

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'subtle'
  color?: 'default' | 'green' | 'red' | 'amber' | 'blue' | 'slate' | 'purple'
}

const badgeColors = {
  default: 'bg-surface text-foreground border-border',
  green:   'bg-green-100  text-green-800  border-green-200',
  red:     'bg-red-100    text-red-800    border-red-200',
  amber:   'bg-amber-100  text-amber-800  border-amber-200',
  blue:    'bg-blue-100   text-blue-800   border-blue-200',
  slate:   'bg-slate-100  text-slate-700  border-slate-200',
  purple:  'bg-purple-100 text-purple-800 border-purple-200',
}

export function Badge({
  variant = 'subtle',
  color = 'default',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border',
        badgeColors[color],
        variant === 'outline' && 'bg-transparent',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

// ─── Party Badge ──────────────────────────────────────────────────────────────

export function PartyBadge({
  party,
  className,
  ...props
}: { party: PartySlug } & React.HTMLAttributes<HTMLSpanElement>) {
  const colors = PARTY_COLORS[party]

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full',
        className,
      )}
      style={{ backgroundColor: colors.bg, color: colors.text }}
      {...props}
    />
  )
}

// ─── MP Status Badge ──────────────────────────────────────────────────────────

const statusConfig: Record<MPStatus, { label: string; color: string }> = {
  active:   { label: 'Active MP',  color: 'bg-green-100 text-green-800 border-green-200' },
  inactive: { label: 'Inactive',   color: 'bg-slate-100 text-slate-600 border-slate-200' },
  former:   { label: 'Former MP',  color: 'bg-slate-100 text-slate-500 border-slate-200' },
}

export function StatusBadge({
  status,
  className,
}: { status: MPStatus; className?: string }) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border',
        config.color,
        className,
      )}
    >
      {status === 'active' && (
        <span className="size-1.5 rounded-full bg-green-500 live-dot" />
      )}
      {config.label}
    </span>
  )
}

// ─── Bill Status Badge ────────────────────────────────────────────────────────

const billStatusConfig: Record<BillStatus, { label: string; color: string }> = {
  'introduced':              { label: 'Introduced',               color: 'bg-blue-100  text-blue-800  border-blue-200' },
  'first-reading':           { label: 'First Reading',            color: 'bg-blue-100  text-blue-800  border-blue-200' },
  'select-committee':        { label: 'Select Committee',         color: 'bg-purple-100 text-purple-800 border-purple-200' },
  'second-reading':          { label: 'Second Reading',           color: 'bg-amber-100 text-amber-800 border-amber-200' },
  'committee-of-whole-house':{ label: 'Committee of Whole House', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  'third-reading':           { label: 'Third Reading',            color: 'bg-orange-100 text-orange-800 border-orange-200' },
  'royal-assent':            { label: 'Royal Assent ✓',           color: 'bg-green-100 text-green-800 border-green-200' },
  'defeated':                { label: 'Defeated',                 color: 'bg-red-100   text-red-800   border-red-200' },
}

export function BillStatusBadge({
  status,
  className,
}: { status: BillStatus; className?: string }) {
  const config = billStatusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border',
        config.color,
        className,
      )}
    >
      {config.label}
    </span>
  )
}
