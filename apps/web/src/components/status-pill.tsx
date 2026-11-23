import { LoaderCircle } from 'lucide-react'
import type { ConnectionStatus, PublishStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

export type StatusPillStatus = ConnectionStatus | PublishStatus | 'not-available'

type Variant = { label: string; className: string; dot?: string; spinner?: boolean }

const VARIANTS: Record<StatusPillStatus, Variant> = {
  connected: { label: 'Connected', className: 'bg-success-subtle text-success-text', dot: 'bg-success' },
  reauth: { label: 'Reauthorization required', className: 'bg-warning-subtle text-warning-text', dot: 'bg-warning' },
  disconnected: { label: 'Disconnected', className: 'bg-subtle text-muted-foreground', dot: 'bg-tertiary' },
  connecting: { label: 'Connecting', className: 'bg-info-subtle text-info-text', spinner: true },
  draft: { label: 'Draft', className: 'bg-subtle text-muted-foreground', dot: 'bg-tertiary' },
  scheduled: { label: 'Scheduled', className: 'bg-primary-subtle text-primary-text', dot: 'bg-primary' },
  processing: { label: 'Processing', className: 'bg-info-subtle text-info-text', spinner: true },
  published: { label: 'Published', className: 'bg-success-subtle text-success-text', dot: 'bg-success' },
  failed: { label: 'Failed', className: 'bg-danger-subtle text-danger-text', dot: 'bg-danger' },
  cancelled: { label: 'Cancelled', className: 'bg-subtle text-tertiary', dot: 'bg-[var(--border-strong)]' },
  'not-available': { label: 'Not available', className: 'border border-dashed border-strong bg-background !px-2 text-tertiary' },
}

/**
 * Figma "Status Pill" (7:91) — connection and publishing status.
 * Publishing status is per target platform, never per content item.
 */
export function StatusPill({ status, label, className }: { status: StatusPillStatus; label?: string; className?: string }) {
  const v = VARIANTS[status]
  return (
    <span className={cn('inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full py-0.5 pr-2 pl-[7px] text-caption font-medium whitespace-nowrap', v.className, className)}>
      {v.dot && <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', v.dot)} />}
      {v.spinner && <LoaderCircle aria-hidden className="size-3 shrink-0 animate-spin text-info" strokeWidth={2.5} />}
      {label ?? v.label}
    </span>
  )
}
