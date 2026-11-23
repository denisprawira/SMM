import type { Platform, PublishStatus, ThumbnailTone } from '@/lib/types'
import { cn } from '@/lib/utils'
import { PlatformLogo } from './platform-logo'
import { Thumbnail } from './thumbnail'

export type CalendarChipStatus = Exclude<PublishStatus, 'cancelled'>

const BAR: Record<CalendarChipStatus, string> = {
  scheduled: 'bg-primary',
  published: 'bg-success',
  failed: 'bg-danger',
  processing: 'bg-info',
  draft: 'bg-[var(--border-strong)]',
}

type CalendarChipProps = {
  status: CalendarChipStatus
  time: string
  title: string
  platform: Platform
  tone?: ThumbnailTone
  className?: string
  onClick?: () => void
}

/** Figma "Calendar Chip" (11:434) — one chip per target (platform + account); the left bar is the status. */
export function CalendarChip({ status, time, title, platform, tone = 'sunset', className, onClick }: CalendarChipProps) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex w-[180px] min-w-0 items-center gap-1.5 overflow-hidden rounded-md border bg-card py-1 pr-1.5 pl-1 text-left shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20',
        onClick && 'transition-colors hover:bg-subtle',
        className,
      )}
    >
      <span className={cn('h-7 w-[3px] shrink-0 rounded-[2px]', BAR[status])} />
      <Thumbnail tone={tone} ratio={1} className="size-7 rounded-sm" />
      <span className="flex min-w-0 flex-1 flex-col text-caption font-medium">
        <span className="text-muted-foreground">{time}</span>
        <span className="truncate text-foreground">{title}</span>
      </span>
      <PlatformLogo platform={platform} size={14} />
    </Comp>
  )
}
