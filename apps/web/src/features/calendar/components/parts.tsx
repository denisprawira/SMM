import { Link } from '@tanstack/react-router'
import { Calendar, Funnel, Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { EmptyState } from '@/components/empty-state'
import { PlatformLogo } from '@/components/platform-logo'
import { StatusPill } from '@/components/status-pill'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CALENDAR_STATUSES, STATUS_LABEL, type CalendarTarget } from '../api'
import { formatWhen } from '../date-utils'
import { STATUS_TONE } from '../styles'
import type { DragSession, DropTarget } from '../use-pointer-drag'

/** Month header legend: one 8px swatch per status. */
export function StatusLegend({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3.5', className)}>
      {CALENDAR_STATUSES.map((s) => (
        <span key={s} className="flex items-center gap-1.5">
          <span aria-hidden className={cn('size-2 rounded-[2px]', STATUS_TONE[s].bar)} />
          <span className="text-caption font-medium text-muted-foreground">{STATUS_LABEL[s]}</span>
        </span>
      ))}
    </div>
  )
}

/** Platform logo + account + status pill (popover, edit schedule, mobile sheet). */
export function TargetRow({ target, size = 16, className, children }: { target: CalendarTarget; size?: 14 | 16; className?: string; children?: ReactNode }) {
  return (
    <div className={cn('flex min-w-0 items-center', size === 16 ? 'gap-2' : 'gap-1.5', className)}>
      <PlatformLogo platform={target.platform} size={size} />
      <span className={cn('truncate', size === 16 ? 'text-body-sm text-foreground' : 'text-caption text-muted-foreground')}>{target.handle}</span>
      <span className="min-w-0 flex-1" />
      {children}
      <StatusPill status={target.status} />
    </div>
  )
}

/** Floating copy of the dragged chip/block plus the inverse "Move to …" tooltip (Figma "Dragging chip" + "Reschedule tooltip"). */
export function DragOverlay<P>({ session, drop, children }: { session: DragSession<P> | null; drop: DropTarget | null; children: ReactNode }) {
  if (!session) return null
  const left = session.x - session.grabX
  const top = session.y - session.grabY
  return createPortal(
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
      <div className="absolute rotate-3" style={{ left, top, width: session.width }}>
        {children}
      </div>
      {drop && (
        <div
          className={cn('absolute flex items-center gap-1.5 rounded-md px-2 py-[5px] whitespace-nowrap', drop.valid ? 'bg-inverse' : 'bg-danger')}
          style={{ left: left - 14, top: top + session.height + 20 }}
        >
          <Calendar aria-hidden className="size-3 text-white" />
          <span className="text-caption font-medium text-white">{drop.valid ? `Move to ${formatWhen(drop.at)}` : drop.reason}</span>
        </div>
      )}
    </div>,
    document.body,
  )
}

/** Figma State pattern "Calendar — empty week" (30:916), centred over the grid. */
export function CalendarEmpty({ scope, filtered, onClearFilters, className }: { scope: 'week' | 'day' | 'month'; filtered: boolean; onClearFilters: () => void; className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4', className)}>
      {filtered ? (
        <EmptyState
          icon={Funnel}
          title="No posts match these filters"
          description="Try another platform, status or account."
          action={
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              Clear filters
            </Button>
          }
          className="pointer-events-auto w-[340px] max-w-full"
        />
      ) : (
        <EmptyState
          icon={Calendar}
          title={`Nothing scheduled this ${scope}`}
          description="Pick a Drive file and schedule it to one or more accounts."
          action={
            <Button asChild size="sm">
              <Link to="/create">
                <Plus />
                Create post
              </Link>
            </Button>
          }
          className="pointer-events-auto w-[340px] max-w-full [&>p:last-of-type]:max-w-[284px]"
        />
      )}
    </div>
  )
}
