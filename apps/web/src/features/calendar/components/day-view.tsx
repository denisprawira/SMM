import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { format, parseISO, startOfMonth } from 'date-fns'
import { Calendar, Ellipsis, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Thumbnail } from '@/components/thumbnail'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Platform } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useCalendarActions } from '../actions-context'
import { CALENDAR_NOW, CALENDAR_TODAY, calendarQueryOptions, filterPosts, isMovable, toEntries, type CalendarEntry, type CalendarPost } from '../api'
import { dateOf, formatHour, formatTime, minutesOf } from '../date-utils'
import { DAY_HOUR_PX as HOUR, hourWindow, layoutLanes, STATUS_TONE } from '../styles'
import { MiniCalendar } from './mini-calendar'
import { CalendarEmpty, TargetRow } from './parts'
import { EditScheduleCard } from './schedule-form'

const OFFSET = 4
/** Block height: 8px padding around max(40px thumb, 22px target rows with 4px gaps). */
const blockHeight = (targets: number) => 16 + Math.max(40, targets * 22 + (targets - 1) * 4)

type DayViewProps = {
  date: string
  posts: CalendarPost[]
  platform?: Platform
  filtered: boolean
  selectedPostId?: string
  onSelectPost: (postId: string) => void
  onDateChange: (dateKey: string) => void
  onClearFilters: () => void
  toolbar: ReactNode
}

/** The next post that can still be edited, else the first one (Figma selects "Autumn lookbook reel"). */
function defaultEntry(entries: CalendarEntry[]) {
  return entries.find((e) => e.at >= CALENDAR_NOW && e.targets.every(isMovable)) ?? entries[0]
}

function DayBlock({ entry, selected, onSelect, style }: { entry: CalendarEntry; selected: boolean; onSelect: () => void; style: CSSProperties }) {
  const actions = useCalendarActions()
  const n = entry.targets.length
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${entry.post.title}, ${formatTime(entry.at)}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        'absolute flex cursor-pointer items-start gap-3 overflow-hidden rounded-lg border-l-3 py-2 pr-3 pl-2.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20',
        selected ? 'z-[1] border border-l-3 border-primary bg-background shadow-md' : STATUS_TONE[entry.status].block,
      )}
      style={style}
    >
      <Thumbnail tone={entry.post.tone} ratio={1} className="size-10 rounded-md" />
      <div className="flex min-w-0 flex-[0_1_200px] flex-col gap-0.5">
        <p className="truncate text-body-sm font-medium text-foreground">{entry.post.title}</p>
        <p className="truncate text-caption text-muted-foreground">
          {formatTime(entry.at)} · {n} {n === 1 ? 'target' : 'targets'}
        </p>
      </div>
      <div className="flex min-w-0 flex-[0_1_260px] flex-col gap-1">
        {entry.targets.map((t) => (
          <TargetRow key={t.id} target={t} size={14} />
        ))}
      </div>
      <span className="min-w-0 flex-1" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="More actions" className="rounded-lg" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem asChild>
            <Link to="/create">
              <Pencil />
              Edit post
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!entry.post.targets.some(isMovable)} onSelect={() => actions.reschedule(entry)}>
            <Calendar />
            Reschedule
          </DropdownMenuItem>
          {entry.status === 'failed' && (
            <DropdownMenuItem onSelect={() => actions.retry(entry.post)}>
              <RotateCcw />
              Retry failed targets
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => actions.remove(entry.post)}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/** Mini calendar whose month can be browsed independently; dots come from that month's posts. */
function DayMiniCalendar({ date, platformPosts, onDateChange, platform }: { date: string; platformPosts: CalendarPost[]; onDateChange: (d: string) => void; platform?: Platform }) {
  const [month, setMonth] = useState(() => startOfMonth(parseISO(date)))
  const monthKey = format(month, 'yyyy-MM')
  const sameMonth = monthKey === date.slice(0, 7)
  const browsed = useQuery({ ...calendarQueryOptions(monthKey), enabled: !sameMonth, placeholderData: keepPreviousData })
  const source = sameMonth ? platformPosts : filterPosts(browsed.data ?? [], { platform })
  const postDays = useMemo(() => [...new Set(source.flatMap((p) => p.targets.map((t) => dateOf(t.at))))].map((k) => parseISO(k)), [source])
  return <MiniCalendar selected={date} month={month} onMonthChange={setMonth} onSelect={onDateChange} postDays={postDays} />
}

/** Figma "09 Publishing Calendar · Day": 72px hours with one row per post (every target's status), mini calendar + "Edit schedule". */
export function DayView({ date, posts, platform, filtered, selectedPostId, onSelectPost, onDateChange, onClearFilters, toolbar }: DayViewProps) {
  const entries = useMemo(() => toEntries(posts).filter((e) => dateOf(e.at) === date), [posts, date])
  const { start, end } = hourWindow(entries.map((e) => minutesOf(e.at)), 8, 21)
  const height = (end - start) * HOUR
  const topOf = (minutes: number) => ((minutes - start * 60) / 60) * HOUR
  const lanes = layoutLanes(entries, (e) => topOf(minutesOf(e.at)), (e) => blockHeight(e.targets.length) + OFFSET)
  const selected = entries.find((e) => e.post.id === selectedPostId) ?? defaultEntry(entries)
  const nowTop = topOf(minutesOf(CALENDAR_NOW))

  return (
    <div className="flex flex-col items-start gap-4 xl:flex-row">
      <section aria-label="Day calendar" className="flex w-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-xs">
        {toolbar}
        <div className="relative" style={{ height }}>
          {Array.from({ length: end - start }, (_, i) => (
            <div key={i} aria-hidden className="absolute right-0 left-16 h-px bg-border" style={{ top: i * HOUR }} />
          ))}
          {Array.from({ length: end - start - 1 }, (_, i) => start + i + 1).map((h) => (
            <span key={h} className="absolute right-[calc(100%-56px)] text-caption whitespace-nowrap text-tertiary" style={{ top: topOf(h * 60) - 8 }}>
              {formatHour(h)}
            </span>
          ))}
          {entries.map((entry) => {
            const { lane, lanes: n } = lanes.get(entry)!
            return (
              <DayBlock
                key={entry.key}
                entry={entry}
                selected={selected?.key === entry.key}
                onSelect={() => onSelectPost(entry.post.id)}
                style={{
                  top: topOf(minutesOf(entry.at)) + OFFSET,
                  minHeight: blockHeight(entry.targets.length),
                  left: `calc(72px + (100% - 80px) * ${lane / n})`,
                  width: `calc((100% - 80px) / ${n} - ${n > 1 ? 4 : 0}px)`,
                }}
              />
            )
          })}
          {date === CALENDAR_TODAY && nowTop > 0 && nowTop < height && (
            <div aria-hidden className="pointer-events-none absolute right-0 left-16 z-[2]" style={{ top: nowTop }}>
              <div className="h-0.5 bg-danger" />
              <div className="absolute -top-[3px] -left-1 size-2 rounded-full bg-danger" />
            </div>
          )}
          {entries.length === 0 && <CalendarEmpty scope="day" filtered={filtered} onClearFilters={onClearFilters} />}
        </div>
      </section>
      <div className="grid w-full shrink-0 gap-4 md:grid-cols-2 xl:flex xl:w-[340px] xl:flex-col">
        <DayMiniCalendar key={date.slice(0, 7)} date={date} platformPosts={posts} platform={platform} onDateChange={onDateChange} />
        {selected && <EditScheduleCard key={`${selected.key}:${selected.post.timezone}`} entry={selected} />}
      </div>
    </div>
  )
}
