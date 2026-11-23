import { Link } from '@tanstack/react-router'
import { endOfMonth, endOfWeek, format, parseISO, startOfMonth } from 'date-fns'
import { Calendar, Funnel, Plus } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { EmptyState } from '@/components/empty-state'
import { PlatformLogo } from '@/components/platform-logo'
import { SegmentedControl } from '@/components/segmented-control'
import { StatusPill } from '@/components/status-pill'
import { Thumbnail } from '@/components/thumbnail'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { CALENDAR_TODAY, entriesByDate, toEntries, type CalendarEntry, type CalendarPost, type CalendarView } from '../api'
import { dateOf, formatTime, monthTitle, shiftDate, toDateKey, WEEK_OPTS, weekDays } from '../date-utils'
import { STATUS_TONE } from '../styles'
import { MiniCalendar } from './mini-calendar'
import { PostDetails } from './post-details'

const VIEW_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
] as const

type MobileAgendaProps = {
  view: CalendarView
  date: string
  posts: CalendarPost[]
  filtered: boolean
  onClearFilters: () => void
  onDateChange: (dateKey: string) => void
  onViewChange: (view: CalendarView) => void
  className?: string
}

/** Mon–Sun day cards; swipe left/right for the next/previous week. Dots: green = past posts, accent = upcoming. */
function WeekStrip({ date, days, onSelect }: { date: string; days: Set<string>; onSelect: (d: string) => void }) {
  const swipe = useRef<number | null>(null)
  return (
    <div
      role="group"
      aria-label="Week"
      className="flex touch-pan-y items-center gap-1"
      onPointerDown={(e) => (swipe.current = e.clientX)}
      onPointerUp={(e) => {
        const dx = swipe.current === null ? 0 : e.clientX - swipe.current
        swipe.current = null
        if (Math.abs(dx) > 48) onSelect(shiftDate(date, 'week', dx < 0 ? 1 : -1))
      }}
    >
      {weekDays(date).map((d) => {
        const key = toDateKey(d)
        const selected = key === date
        const dot = days.has(key) ? (selected ? 'bg-white' : key < CALENDAR_TODAY ? 'bg-success' : 'bg-primary') : 'bg-transparent'
        return (
          <button
            key={key}
            type="button"
            aria-pressed={selected}
            aria-label={format(d, 'EEEE, MMMM d')}
            onClick={() => onSelect(key)}
            className={cn('flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[10px] py-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20', selected ? 'bg-primary' : 'border bg-card')}
          >
            <span className={cn('text-caption font-medium', selected ? 'text-primary-foreground' : 'text-tertiary')}>{format(d, 'EEEEE')}</span>
            <span className={cn('text-body font-medium', selected ? 'text-primary-foreground' : key === CALENDAR_TODAY ? 'text-primary-text' : 'text-foreground')}>{d.getDate()}</span>
            <span aria-hidden className={cn('size-1 rounded-full', dot)} />
          </button>
        )
      })}
    </div>
  )
}

function AgendaMonth({ date, postDays, onSelect }: { date: string; postDays: Set<string>; onSelect: (d: string) => void }) {
  const [month, setMonth] = useState(() => startOfMonth(parseISO(date)))
  const days = useMemo(() => [...postDays].map((k) => parseISO(k)), [postDays])
  return <MiniCalendar selected={date} month={month} onMonthChange={setMonth} onSelect={onSelect} postDays={days} className="shadow-none" />
}

function AgendaRow({ entry, onOpen }: { entry: CalendarEntry; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-2.5 rounded-[10px] border bg-card px-3 py-2.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20">
      <span aria-hidden className={cn('h-10 w-[3px] shrink-0 rounded-[2px]', STATUS_TONE[entry.status].bar)} />
      <Thumbnail tone={entry.post.tone} ratio={1} className="size-10 rounded-md" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-body-sm font-medium text-foreground">{entry.post.title}</span>
        <span className="flex items-center gap-1">
          <span className="text-caption text-muted-foreground">{formatTime(entry.at)}</span>
          {entry.targets.map((t) => (
            <PlatformLogo key={t.id} platform={t.platform} size={14} />
          ))}
        </span>
      </span>
      <StatusPill status={entry.status} />
    </button>
  )
}

/** Figma "M03 Publishing Calendar · Agenda — Mobile": the selected day onward, grouped by day. */
export function MobileAgenda({ view, date, posts, filtered, onClearFilters, onDateChange, onViewChange, className }: MobileAgendaProps) {
  const [open, setOpen] = useState<CalendarEntry | null>(null)
  const entries = useMemo(() => toEntries(posts), [posts])
  const byDate = useMemo(() => entriesByDate(entries), [entries])
  const postDays = useMemo(() => new Set(entries.map((e) => dateOf(e.at))), [entries])

  const last = view === 'day' ? date : toDateKey(view === 'week' ? endOfWeek(parseISO(date), WEEK_OPTS) : endOfMonth(parseISO(date)))
  const groups = [...byDate.entries()].filter(([d]) => d >= date && d <= last).sort(([a], [b]) => a.localeCompare(b))
  const scope = view === 'day' ? 'day' : view === 'week' ? 'week' : 'month'

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center gap-2">
        <h2 className="text-h3 text-foreground">{monthTitle(date)}</h2>
        <div className="min-w-0 flex-1" />
        <SegmentedControl aria-label="Calendar view" value={view} options={VIEW_OPTIONS} onValueChange={onViewChange} />
      </div>

      {view === 'month' ? (
        <AgendaMonth key={date.slice(0, 7)} date={date} postDays={postDays} onSelect={onDateChange} />
      ) : (
        <WeekStrip date={date} days={postDays} onSelect={onDateChange} />
      )}

      {groups.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={Funnel}
            title="No posts match these filters"
            description="Try another platform, status or account."
            action={
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                Clear filters
              </Button>
            }
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
          />
        )
      ) : (
        groups.map(([d, list]) => (
          <section key={d} aria-label={format(parseISO(d), 'EEEE, MMMM d')} className="flex flex-col gap-2">
            <h3 className="text-overline text-tertiary uppercase">
              {d === CALENDAR_TODAY ? 'Today · ' : ''}
              {format(parseISO(d), 'EEE, MMM d')}
            </h3>
            {list.map((entry) => (
              <AgendaRow key={entry.key} entry={entry} onOpen={() => setOpen(entry)} />
            ))}
          </section>
        ))
      )}

      <Sheet open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent side="bottom" showCloseButton={false} className="gap-0 overflow-hidden rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
          <SheetTitle className="sr-only">{open?.post.title ?? 'Post'}</SheetTitle>
          <div aria-hidden className="mx-auto mt-2 h-1 w-9 rounded-full bg-muted" />
          {open && <PostDetails entry={open} onDone={() => setOpen(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}
