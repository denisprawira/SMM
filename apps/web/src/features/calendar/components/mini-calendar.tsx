import { addMonths, format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, type ComponentProps } from 'react'
import type { DayButton } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { toDateKey } from '../date-utils'

/** 28×24 day number + 4px dot (Figma mini calendar cell, 42×34). */
function MiniDayButton({ day, modifiers, className: _className, ...props }: ComponentProps<typeof DayButton>) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])
  return (
    <button ref={ref} {...props} className="group/mini flex h-[34px] w-full flex-col items-center justify-center gap-0.5 outline-none">
      <span
        className={cn(
          'flex h-6 w-7 items-center justify-center rounded-md text-caption font-medium transition-colors group-focus-visible/mini:ring-[3px] group-focus-visible/mini:ring-ring/20',
          modifiers.selected ? 'bg-primary text-primary-foreground' : cn('group-hover/mini:bg-subtle', modifiers.outside ? 'text-tertiary' : 'text-foreground'),
        )}
      >
        {day.date.getDate()}
      </span>
      <span aria-hidden className={cn('size-1 rounded-full', modifiers.hasPosts ? 'bg-primary' : 'bg-transparent')} />
    </button>
  )
}

type MiniCalendarProps = {
  selected: string
  /** First day of the displayed month. */
  month: Date
  onMonthChange: (month: Date) => void
  onSelect: (dateKey: string) => void
  /** Days that get the accent dot. */
  postDays: Date[]
  className?: string
}

/** Figma "Mini calendar" (21:3229) on shadcn Calendar: month header with ‹ ›, M–S, dots on days with posts. */
export function MiniCalendar({ selected, month, onMonthChange, onSelect, postDays, className }: MiniCalendarProps) {
  return (
    <div className={cn('flex flex-col gap-2.5 rounded-xl border bg-card p-4 shadow-xs', className)}>
      <div className="flex items-center gap-1">
        <p className="text-body font-medium text-foreground">{format(month, 'MMMM yyyy')}</p>
        <span className="min-w-0 flex-1" />
        <Button variant="ghost" size="icon-sm" aria-label="Previous month" onClick={() => onMonthChange(addMonths(month, -1))}>
          <ChevronLeft />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Next month" onClick={() => onMonthChange(addMonths(month, 1))}>
          <ChevronRight />
        </Button>
      </div>
      <Calendar
        mode="single"
        required
        hideNavigation
        weekStartsOn={1}
        month={month}
        onMonthChange={onMonthChange}
        selected={parseISO(selected)}
        onSelect={(d) => d && onSelect(toDateKey(d))}
        modifiers={{ hasPosts: postDays }}
        formatters={{ formatWeekdayName: (d) => format(d, 'EEEEE') }}
        className="w-full bg-transparent p-0"
        classNames={{
          root: 'w-full',
          months: 'w-full',
          month: 'flex w-full flex-col gap-0.5',
          month_caption: 'hidden',
          month_grid: 'w-full border-collapse',
          weekdays: 'flex',
          weekday: 'flex h-6 flex-1 items-center justify-center text-caption font-medium text-tertiary select-none',
          week: 'mt-0.5 flex w-full',
          day: 'flex-1 p-0 text-center select-none',
          today: '',
          outside: '',
        }}
        components={{ DayButton: MiniDayButton }}
      />
    </div>
  )
}
