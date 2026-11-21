import arrowRight from '@/assets/figma/icons/arrow-right-12.svg'
import trendingDown from '@/assets/figma/icons/trending-down.svg'
import trendingUp from '@/assets/figma/icons/trending-up.svg'
import { cn } from '@/lib/cn'
import type { Trend } from '@/lib/types'
import { Icon } from './icon'

const DELTA: Record<Trend, { icon: string; className: string }> = {
  up: { icon: trendingUp, className: 'bg-success-subtle text-success-text' },
  down: { icon: trendingDown, className: 'bg-danger-subtle text-danger-text' },
  neutral: { icon: arrowRight, className: 'bg-subtle text-secondary' },
}

/** Delta chip used inside Metric Cards (trend icon + value). */
export function DeltaChip({ trend, children, className }: { trend: Trend; children: string; className?: string }) {
  const d = DELTA[trend]
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-[3px] rounded-sm px-1 py-px text-caption font-medium whitespace-nowrap', d.className, className)}>
      <Icon src={d.icon} size={12} />
      {children}
    </span>
  )
}

type MetricCardProps = {
  label: string
  value: string
  /** Header icon (imported Figma SVG). */
  icon?: string
  trend: Trend
  delta: string
  compare?: string
  /** `warning` = highlighted "needs attention" card. */
  tone?: 'default' | 'warning'
  className?: string
}

/** Figma "Metric Card" — Trend=Up/Down/Neutral. */
export function MetricCard({ label, value, icon, trend, delta, compare, tone = 'default', className }: MetricCardProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1.5 rounded-xl border px-4 pt-4 pb-3.5 shadow-xs',
        tone === 'warning' ? 'border-warning bg-warning-subtle' : 'bg-surface',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 text-body-sm font-medium text-secondary">{label}</p>
        {icon && <Icon src={icon} size={16} />}
      </div>
      <p className="text-metric whitespace-nowrap text-primary">{value}</p>
      <div className="flex min-w-0 items-center gap-1.5">
        <DeltaChip trend={trend}>{delta}</DeltaChip>
        {compare && <p className="truncate text-caption text-tertiary">{compare}</p>}
      </div>
    </div>
  )
}
