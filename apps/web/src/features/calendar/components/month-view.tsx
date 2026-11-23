import { format, isWeekend } from 'date-fns'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CalendarChip } from '@/components/calendar-chip'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CALENDAR_TODAY, isMovable, isPast, toEntries, useReschedulePost, type CalendarEntry, type CalendarPost, type CalendarTarget } from '../api'
import { dateOf, formatTime, monthGrid, toDateKey } from '../date-utils'
import { dropZoneAt, usePointerDrag, type DropTarget } from '../use-pointer-drag'
import { CalendarEmpty, DragOverlay } from './parts'
import { PostDetails } from './post-details'

/** A month chip = one target (platform + account). */
type Chip = { key: string; post: CalendarPost; target: CalendarTarget; entry: CalendarEntry }

const MAX_CHIPS = 3
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type MonthViewProps = {
  date: string
  posts: CalendarPost[]
  filtered: boolean
  onClearFilters: () => void
  onOpenDay: (dateKey: string) => void
}

/** Figma "07 Publishing Calendar · Month": Mon-first grid, 190px cells, 3 chips + "+N more", drag a chip to another day. */
export function MonthView({ date, posts, filtered, onClearFilters, onOpenDay }: MonthViewProps) {
  const weeks = useMemo(() => monthGrid(date), [date])
  const [openKey, setOpenKey] = useState<string | null>(null)
  const reschedule = useReschedulePost()

  const chipsByDate = useMemo(() => {
    const map = new Map<string, Chip[]>()
    for (const entry of toEntries(posts)) {
      for (const target of entry.targets) {
        const key = dateOf(target.at)
        map.set(key, [...(map.get(key) ?? []), { key: target.id, post: entry.post, target, entry }])
      }
    }
    return map
  }, [posts])

  const drag = usePointerDrag<Chip>({
    resolveDrop: (s) => {
      const zone = dropZoneAt(s.x, s.y)
      if (!zone?.dataset.dropDate) return null
      const at = `${zone.dataset.dropDate}${s.payload.target.at.slice(10)}`
      return { date: zone.dataset.dropDate, at, valid: !isPast(at), reason: 'Can’t move into the past' }
    },
    onDrop: (chip, drop: DropTarget) => {
      if (!drop.valid) {
        toast.error('Can’t schedule in the past', { description: 'Drop the post on today or a later day.' })
        return
      }
      if (drop.at === chip.target.at) return
      reschedule.mutate({ postId: chip.post.id, changes: [{ targetId: chip.target.id, at: drop.at }] })
    },
  })

  const first = toDateKey(weeks[0][0])
  const last = toDateKey(weeks[weeks.length - 1][6])
  const empty = ![...chipsByDate.keys()].some((k) => k >= first && k <= last)
  const monthPrefix = date.slice(0, 7)

  return (
    <div className="relative">
      <div className="grid grid-cols-7 border-b bg-canvas">
        {WEEKDAYS.map((d) => (
          <div key={d} className="h-8 px-2.5 py-2 text-caption font-medium text-tertiary">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flatMap((week, wi) =>
          week.map((day, di) => {
            const key = toDateKey(day)
            const chips = chipsByDate.get(key) ?? []
            const outside = !key.startsWith(monthPrefix)
            const today = key === CALENDAR_TODAY
            const isDrop = drag.drop?.valid && drag.drop.date === key
            const more = chips.length > MAX_CHIPS ? chips.length - MAX_CHIPS : 0
            return (
              <div
                key={key}
                data-drop-date={key}
                className={cn(
                  'flex h-[190px] min-w-0 flex-col items-start gap-1 overflow-hidden px-1.5 pt-1.5 pb-2',
                  di < 6 && 'border-r',
                  wi < weeks.length - 1 && 'border-b',
                  (outside || isWeekend(day)) && 'bg-canvas',
                  isDrop && 'bg-primary-subtle',
                )}
              >
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onOpenDay(key)}
                    aria-label={`Open ${format(day, 'EEEE, MMMM d')}`}
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full text-caption font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20',
                      today ? 'bg-primary text-primary-foreground' : outside ? 'text-tertiary hover:bg-subtle' : 'text-foreground hover:bg-subtle',
                    )}
                  >
                    {day.getDate()}
                  </button>
                  {today && <span className="text-caption font-medium text-primary-text">Today</span>}
                </div>
                {chips.slice(0, MAX_CHIPS).map((chip) => {
                  const open = openKey === chip.key
                  const movable = isMovable(chip.target)
                  const dragging = drag.session?.payload.key === chip.key
                  return (
                    <Popover key={chip.key} open={open} onOpenChange={(o) => setOpenKey(o ? chip.key : null)}>
                      <PopoverAnchor asChild>
                        <div className={cn('w-full shrink-0', dragging && 'opacity-40')} onPointerDown={movable ? (e) => drag.onPointerDown(e, chip) : undefined}>
                          <CalendarChip
                            status={chip.target.status}
                            time={formatTime(chip.target.at)}
                            title={chip.post.title}
                            platform={chip.target.platform}
                            tone={chip.post.tone}
                            className={cn('w-full', open && 'border-[1.5px] border-primary', movable && 'cursor-grab')}
                            onClick={() => {
                              if (drag.isClickSuppressed()) return
                              setOpenKey(open ? null : chip.key)
                            }}
                          />
                        </div>
                      </PopoverAnchor>
                      <PopoverContent side="right" align="start" sideOffset={10} collisionPadding={16} className="w-80 overflow-hidden rounded-xl p-0 shadow-lg">
                        <PostDetails entry={chip.entry} onDone={() => setOpenKey(null)} />
                      </PopoverContent>
                    </Popover>
                  )
                })}
                {more > 0 && (
                  <button type="button" onClick={() => onOpenDay(key)} className="rounded-sm px-1.5 text-caption font-medium text-muted-foreground hover:text-foreground">
                    +{more} more
                  </button>
                )}
                {isDrop && <div aria-hidden className="h-[38px] w-full shrink-0 rounded-md border border-dashed border-primary bg-primary-subtle" />}
              </div>
            )
          }),
        )}
      </div>
      {empty && <CalendarEmpty scope="month" filtered={filtered} onClearFilters={onClearFilters} />}
      <DragOverlay session={drag.session} drop={drag.drop}>
        {drag.session && (
          <CalendarChip
            status={drag.session.payload.target.status}
            time={formatTime(drag.session.payload.target.at)}
            title={drag.session.payload.post.title}
            platform={drag.session.payload.target.platform}
            tone={drag.session.payload.post.tone}
            className="w-full border-primary shadow-lg"
          />
        )}
      </DragOverlay>
    </div>
  )
}
