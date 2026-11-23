import { Link } from '@tanstack/react-router'
import { format, isWeekend } from 'date-fns'
import { Plus } from 'lucide-react'
import { useMemo, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { toast } from 'sonner'
import { PlatformLogo } from '@/components/platform-logo'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useCalendarActions } from '../actions-context'
import { CALENDAR_NOW, CALENDAR_TODAY, isMovable, isPast, toEntries, useReschedulePost, type CalendarEntry, type CalendarPost } from '../api'
import { dateOf, formatHour, formatMinutes, formatTime, minutesOf, toDateKey, weekDays, withMinutes } from '../date-utils'
import { hourWindow, layoutLanes, STATUS_TONE, WEEK_HOUR_PX as HOUR } from '../styles'
import { dropZoneAt, usePointerDrag } from '../use-pointer-drag'
import { CalendarEmpty, DragOverlay } from './parts'
import { PostDetails } from './post-details'

const BLOCK_H = 78
const SLOT_H = 50
const OFFSET = 3

type WeekViewProps = {
  date: string
  posts: CalendarPost[]
  filtered: boolean
  onClearFilters: () => void
  onOpenDay: (dateKey: string) => void
}

/** Week block (Figma "Event/…"): status-tinted, time (+ "· Failed"), title, target logos. */
function WeekBlock({ entry, className, style }: { entry: CalendarEntry; className?: string; style?: CSSProperties }) {
  const tone = STATUS_TONE[entry.status]
  return (
    <div className={cn('flex flex-col items-start gap-0.5 overflow-hidden rounded-md border-l-3 py-1.5 pr-1.5 pl-2 text-left', tone.block, className)} style={style}>
      <span className={cn('text-caption font-medium whitespace-nowrap', tone.text)}>
        {formatTime(entry.at)}
        {entry.status === 'failed' && ' · Failed'}
      </span>
      <span className="line-clamp-2 text-caption font-medium text-foreground">{entry.post.title}</span>
      <span className="flex items-center gap-[3px]">
        {entry.targets.map((t) => (
          <PlatformLogo key={t.id} platform={t.platform} size={14} />
        ))}
      </span>
    </div>
  )
}

/** Figma "08 Publishing Calendar · Week": 56px hours, one block per post, now line, hover-to-schedule slot, drag to move. */
export function WeekView({ date, posts, filtered, onClearFilters, onOpenDay }: WeekViewProps) {
  const actions = useCalendarActions()
  const reschedule = useReschedulePost()
  const days = useMemo(() => weekDays(date), [date])
  const keys = useMemo(() => days.map(toDateKey), [days])
  const entries = useMemo(() => toEntries(posts).filter((e) => keys.includes(dateOf(e.at))), [posts, keys])
  const { start, end } = hourWindow(entries.map((e) => minutesOf(e.at)), 8, 22)
  const height = (end - start) * HOUR
  const topOf = (minutes: number) => ((minutes - start * 60) / 60) * HOUR
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [hover, setHover] = useState<{ date: string; minutes: number } | null>(null)

  /** Targets that move with a block: every target of the full post at that time. */
  const blockTargets = (e: CalendarEntry) => (actions.getPost(e.post.id) ?? e.post).targets.filter((t) => t.at === e.at)

  const drag = usePointerDrag<CalendarEntry>({
    resolveDrop: (s) => {
      const zone = dropZoneAt(s.x, s.y)
      if (!zone?.dataset.dropDate) return null
      const top = s.y - s.grabY - zone.getBoundingClientRect().top - OFFSET
      const minutes = Math.min(24 * 60 - 15, Math.max(0, start * 60 + Math.round(((top / HOUR) * 60) / 15) * 15))
      const at = withMinutes(zone.dataset.dropDate, minutes)
      return { date: zone.dataset.dropDate, at, valid: !isPast(at), reason: 'Can’t move into the past' }
    },
    onDrop: (entry, drop) => {
      if (!drop.valid) {
        toast.error('Can’t schedule in the past', { description: 'Pick a time after now.' })
        return
      }
      if (drop.at === entry.at) return
      reschedule.mutate({ postId: entry.post.id, changes: blockTargets(entry).map((t) => ({ targetId: t.id, at: drop.at })) })
    },
  })

  const byDate = new Map(keys.map((k) => [k, entries.filter((e) => dateOf(e.at) === k)]))
  const nowDay = keys.indexOf(CALENDAR_TODAY)
  const nowTop = topOf(minutesOf(CALENDAR_NOW))

  function onColumnMove(e: ReactPointerEvent<HTMLDivElement>, key: string) {
    if (drag.session || (e.target as Element).closest('[data-block],[data-slot-link]')) {
      if (!(e.target as Element).closest('[data-slot-link]')) setHover(null)
      return
    }
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top
    const minutes = start * 60 + Math.floor(((y / HOUR) * 60) / 30) * 30
    const top = topOf(minutes)
    const blocked = (byDate.get(key) ?? []).some((b) => {
      const bt = topOf(minutesOf(b.at))
      return top < bt + BLOCK_H && bt < top + SLOT_H
    })
    setHover(blocked || isPast(withMinutes(key, minutes)) || minutes >= end * 60 ? null : { date: key, minutes })
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b">
        <div className="h-[52px]" />
        {days.map((d, i) => {
          const today = keys[i] === CALENDAR_TODAY
          return (
            <button
              key={keys[i]}
              type="button"
              onClick={() => onOpenDay(keys[i])}
              aria-label={`Open ${format(d, 'EEEE, MMMM d')}`}
              className={cn('flex h-[52px] flex-col items-start gap-0.5 border-l px-2.5 py-2 text-left outline-none hover:bg-subtle focus-visible:ring-[3px] focus-visible:ring-ring/20 focus-visible:ring-inset', today && 'bg-primary-subtle text-primary-text hover:bg-primary-subtle')}
            >
              <span className={cn('text-caption font-medium', !today && 'text-tertiary')}>{format(d, 'EEE')}</span>
              <span className={cn('text-h2', !today && 'text-foreground')}>{d.getDate()}</span>
            </button>
          )
        })}
      </div>

      <div className="relative grid grid-cols-[56px_repeat(7,minmax(0,1fr))]" style={{ height }}>
        <div className="relative">
          {Array.from({ length: end - start - 1 }, (_, i) => start + i + 1).map((h) => (
            <span key={h} className="absolute right-2 text-caption text-tertiary" style={{ top: topOf(h * 60) - 8 }}>
              {formatHour(h)}
            </span>
          ))}
          {nowDay >= 0 && nowTop > 0 && nowTop < height && (
            <span className="absolute right-1 z-10 rounded-sm bg-danger px-1 py-px text-caption font-medium text-white" style={{ top: nowTop - 8 }}>
              {formatMinutes(minutesOf(CALENDAR_NOW)).replace(/ [AP]M$/, '')}
            </span>
          )}
        </div>
        {/* Hour lines */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 left-14">
          {Array.from({ length: end - start }, (_, i) => (
            <div key={i} className="absolute inset-x-0 h-px bg-border" style={{ top: i * HOUR }} />
          ))}
        </div>
        {days.map((d, i) => {
          const key = keys[i]
          const col = byDate.get(key) ?? []
          const lanes = layoutLanes(col, (e) => topOf(minutesOf(e.at)), () => BLOCK_H + OFFSET)
          const drop = drag.drop?.date === key ? drag.drop : null
          return (
            <div
              key={key}
              data-drop-date={key}
              className={cn('relative border-l', isWeekend(d) && 'bg-canvas')}
              onPointerMove={(e) => onColumnMove(e, key)}
              onPointerLeave={() => setHover((h) => (h?.date === key ? null : h))}
            >
              {col.map((entry) => {
                const { lane, lanes: n } = lanes.get(entry)!
                const open = openKey === entry.key
                const movable = blockTargets(entry).every(isMovable)
                return (
                  <Popover key={entry.key} open={open} onOpenChange={(o) => setOpenKey(o ? entry.key : null)}>
                    <PopoverAnchor asChild>
                      <button
                        type="button"
                        data-block
                        aria-label={`${entry.post.title}, ${formatTime(entry.at)}`}
                        onPointerDown={movable ? (e) => drag.onPointerDown(e, entry) : undefined}
                        onClick={() => {
                          if (drag.isClickSuppressed()) return
                          setOpenKey(open ? null : entry.key)
                        }}
                        className={cn('absolute rounded-md text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20', movable && 'cursor-grab', drag.session?.payload.key === entry.key && 'opacity-40')}
                        style={{
                          top: topOf(minutesOf(entry.at)) + OFFSET,
                          height: BLOCK_H,
                          left: `calc(4px + (100% - 8px) * ${lane / n})`,
                          width: `calc((100% - 8px) / ${n} - ${n > 1 ? 2 : 0}px)`,
                        }}
                      >
                        <WeekBlock entry={entry} className={cn('size-full', open && 'ring-[1.5px] ring-primary')} />
                      </button>
                    </PopoverAnchor>
                    <PopoverContent side="right" align="start" sideOffset={8} collisionPadding={16} className="w-80 overflow-hidden rounded-xl p-0 shadow-lg">
                      <PostDetails entry={entry} onDone={() => setOpenKey(null)} />
                    </PopoverContent>
                  </Popover>
                )
              })}
              {hover?.date === key && !drag.session && (
                <Link
                  to="/create"
                  data-slot-link
                  className="absolute inset-x-1 flex items-center justify-center gap-1.5 overflow-hidden rounded-md border border-dashed border-primary bg-primary-subtle px-2 text-caption font-medium whitespace-nowrap text-primary-text"
                  style={{ top: topOf(hover.minutes) + OFFSET, height: SLOT_H }}
                >
                  <Plus aria-hidden className="size-3.5 shrink-0" />
                  Schedule at {formatMinutes(hover.minutes)}
                </Link>
              )}
              {drop?.valid && <div aria-hidden className="absolute inset-x-1 rounded-md border border-dashed border-primary bg-primary-subtle" style={{ top: topOf(minutesOf(drop.at)) + OFFSET, height: BLOCK_H }} />}
              {i === nowDay && nowTop > 0 && nowTop < height && (
                <div aria-hidden className="pointer-events-none absolute inset-x-0 z-10" style={{ top: nowTop }}>
                  <div className="h-0.5 bg-danger" />
                  <div className="absolute -top-[3px] -left-1 size-2 rounded-full bg-danger" />
                </div>
              )}
            </div>
          )
        })}
        {entries.length === 0 && <CalendarEmpty scope="week" filtered={filtered} onClearFilters={onClearFilters} />}
      </div>
      <DragOverlay session={drag.session} drop={drag.drop}>
        {drag.session && <WeekBlock entry={drag.session.payload} className="shadow-lg" style={{ height: BLOCK_H }} />}
      </DragOverlay>
    </div>
  )
}
