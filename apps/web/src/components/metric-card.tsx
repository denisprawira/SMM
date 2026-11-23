import { ArrowRight, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import type { Trend } from '@/lib/types'
import { cn } from '@/lib/utils'

const DELTA: Record<Trend, { Icon: LucideIcon; className: string }> = {
  up: { Icon: TrendingUp, className: 'bg-success-subtle text-success-text' },
  down: { Icon: TrendingDown, className: 'bg-danger-subtle text-danger-text' },
  neutral: { Icon: ArrowRight, className: 'bg-subtle text-muted-foreground' },
}

/** Delta chip used inside Metric Cards (trend icon + value). */
export function DeltaChip({ trend, children, className }: { trend: Trend; children: string; className?: string }) {
  const { Icon, className: tone } = DELTA[trend]
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-[3px] rounded-sm px-1 py-px text-caption font-medium whitespace-nowrap', tone, className)}>
      <Icon aria-hidden className="size-3" />
      {children}
    </span>
  )
}

type MetricCardProps = {
  label: string
  value: string
  icon?: LucideIcon
  trend: Trend
  delta: string
  compare?: string
  /** `warning` = highlighted "Needs attention" card. */
  tone?: 'default' | 'warning'
  className?: string
}

/** Figma "Metric Card" (11:347) — Trend=Up/Down/Neutral. */
export function MetricCard({ label, value, icon: Icon, trend, delta, compare, tone = 'default', className }: MetricCardProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1.5 rounded-xl border px-4 pt-4 pb-3.5 shadow-xs',
        tone === 'warning' ? 'border-warning bg-warning-subtle' : 'bg-card',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 text-body-sm font-medium text-muted-foreground">{label}</p>
        {Icon && <Icon aria-hidden className={cn('size-4', tone === 'warning' ? 'text-warning' : 'text-tertiary')} />}
      </div>
      <p className="text-metric whitespace-nowrap text-foreground">{value}</p>
      <div className="flex min-w-0 items-center gap-1.5">
        <DeltaChip trend={trend}>{delta}</DeltaChip>
        {compare && <p className="truncate text-caption text-tertiary">{compare}</p>}
      </div>
    </div>
  )
}
