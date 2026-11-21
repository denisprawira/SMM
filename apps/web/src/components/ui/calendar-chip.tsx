import { cn } from '@/lib/cn'
import type { Platform, PublishStatus, ThumbnailTone } from '@/lib/types'
import { PlatformLogo } from './platform-logo'
import { Thumbnail } from './thumbnail'

type CalendarChipStatus = Exclude<PublishStatus, 'cancelled'>

const BAR: Record<CalendarChipStatus, string> = {
  scheduled: 'bg-accent',
  published: 'bg-success',
  failed: 'bg-danger',
  processing: 'bg-info',
  draft: 'bg-[var(--border-color-strong)]',
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

/** Figma "Calendar Chip" — one chip per target (platform + account); left bar = status. */
export function CalendarChip({ status, time, title, platform, tone = 'sunset', className, onClick }: CalendarChipProps) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn('flex w-[180px] min-w-0 items-center gap-1.5 overflow-hidden rounded-md border bg-surface py-1 pr-1.5 pl-1 text-left shadow-xs', onClick && 'hover:bg-subtle', className)}
    >
      <span className={cn('h-7 w-[3px] shrink-0 rounded-[2px]', BAR[status])} />
      <Thumbnail tone={tone} ratio={1} className="size-7 rounded-sm" />
      <span className="flex min-w-0 flex-1 flex-col text-caption font-medium">
        <span className="text-secondary">{time}</span>
        <span className="truncate text-primary">{title}</span>
      </span>
      <PlatformLogo platform={platform} size={14} />
    </Comp>
  )
}
