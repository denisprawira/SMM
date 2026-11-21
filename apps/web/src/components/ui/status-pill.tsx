import dotAccent from '@/assets/figma/status/dot-accent.svg'
import dotDanger from '@/assets/figma/status/dot-danger.svg'
import dotMuted from '@/assets/figma/status/dot-muted.svg'
import dotNeutral from '@/assets/figma/status/dot-neutral.svg'
import dotSuccess from '@/assets/figma/status/dot-success.svg'
import dotWarning from '@/assets/figma/status/dot-warning.svg'
import spinnerInfo from '@/assets/figma/status/spinner-info.svg'
import { cn } from '@/lib/cn'
import type { ConnectionStatus, PublishStatus } from '@/lib/types'

export type StatusPillStatus = ConnectionStatus | PublishStatus | 'not-available'

type Variant = { label: string; className: string; dot?: string; spinner?: boolean }

const VARIANTS: Record<StatusPillStatus, Variant> = {
  connected: { label: 'Connected', className: 'bg-success-subtle text-success-text', dot: dotSuccess },
  reauth: { label: 'Reauthorization required', className: 'bg-warning-subtle text-warning-text', dot: dotWarning },
  disconnected: { label: 'Disconnected', className: 'bg-subtle text-secondary', dot: dotNeutral },
  connecting: { label: 'Connecting', className: 'bg-info-subtle text-info-text', spinner: true },
  draft: { label: 'Draft', className: 'bg-subtle text-secondary', dot: dotNeutral },
  scheduled: { label: 'Scheduled', className: 'bg-accent-subtle text-accent-text', dot: dotAccent },
  processing: { label: 'Processing', className: 'bg-info-subtle text-info-text', spinner: true },
  published: { label: 'Published', className: 'bg-success-subtle text-success-text', dot: dotSuccess },
  failed: { label: 'Failed', className: 'bg-danger-subtle text-danger-text', dot: dotDanger },
  cancelled: { label: 'Cancelled', className: 'bg-subtle text-tertiary', dot: dotMuted },
  'not-available': { label: 'Not available', className: 'border border-dashed border-strong bg-surface px-2 text-tertiary' },
}

/** Figma "Status Pill" — connection and publishing status (per target platform). */
export function StatusPill({ status, label, className }: { status: StatusPillStatus; label?: string; className?: string }) {
  const v = VARIANTS[status]
  return (
    <span
      className={cn(
        'inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full py-0.5 pr-2 pl-[7px] text-caption font-medium whitespace-nowrap',
        v.className,
        className,
      )}
    >
      {v.dot && <img src={v.dot} alt="" aria-hidden width={6} height={6} className="size-1.5 shrink-0" />}
      {v.spinner && <img src={spinnerInfo} alt="" aria-hidden width={12} height={12} className="size-3 shrink-0 animate-spin" />}
      {label ?? v.label}
    </span>
  )
}
