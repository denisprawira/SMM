import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const TONES = {
  danger: { box: 'border-danger bg-danger-subtle', icon: 'text-danger', title: 'text-danger-text' },
  warning: { box: 'border-warning bg-warning-subtle', icon: 'text-warning', title: 'text-warning-text' },
  info: { box: 'border-info bg-info-subtle', icon: 'text-info', title: 'text-info-text' },
  success: { box: 'border-success bg-success-subtle', icon: 'text-success', title: 'text-success-text' },
} as const

type BannerProps = {
  tone: keyof typeof TONES
  icon: LucideIcon
  title: ReactNode
  description?: ReactNode
  /** Usually a `<Button variant="outline" size="sm">`. */
  action?: ReactNode
  className?: string
}

/** Figma "Banner/danger|warning|info" (States 30:818) — page-level alert. */
export function Banner({ tone, icon: Icon, title, description, action, className }: BannerProps) {
  const t = TONES[tone]
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex items-center gap-3 rounded-[10px] border px-3.5 py-3', t.box, className)}>
      <Icon aria-hidden className={cn('size-[18px] shrink-0', t.icon)} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-body-sm">
        <p className={cn('font-medium', t.title)}>{title}</p>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}
