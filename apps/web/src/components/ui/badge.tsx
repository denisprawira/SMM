import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone = 'neutral' | 'accent' | 'outline' | 'danger'

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-muted text-secondary',
  accent: 'bg-accent-subtle text-accent-text',
  outline: 'border bg-surface text-secondary',
  danger: 'bg-danger text-inverse',
}

/** Figma "Badge" — small counts and labels. */
export function Badge({ tone = 'neutral', className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex h-5 shrink-0 items-center rounded-md px-1.5 py-px text-caption font-medium whitespace-nowrap', TONE[tone], className)}>
      {children}
    </span>
  )
}

/** Keyboard shortcut hint (e.g. ⌘K). */
export function Kbd({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <kbd className={cn('inline-flex h-5 shrink-0 items-center rounded-sm border bg-subtle px-[5px] font-sans text-caption font-medium text-tertiary', className)}>
      {children}
    </kbd>
  )
}
