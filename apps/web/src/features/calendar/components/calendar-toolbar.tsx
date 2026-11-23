import { ChevronLeft, ChevronRight } from 'lucide-react'
import { SegmentedControl } from '@/components/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CALENDAR_TODAY, type CalendarFilters, type CalendarView } from '../api'
import { dayTitle, monthTitle, weekTitle } from '../date-utils'
import { AccountFilter, PlatformFilter, StatusFilter, type FilterChange } from './filter-selects'

const VIEW_OPTIONS = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
] as const

const LABEL: Record<CalendarView, string> = { month: 'month', week: 'week', day: 'day' }

type CalendarToolbarProps = {
  view: CalendarView
  date: string
  filters: CalendarFilters
  onShift: (dir: 1 | -1) => void
  onToday: () => void
  onViewChange: (view: CalendarView) => void
  onFiltersChange: FilterChange
  className?: string
}

/** Figma "Calendar toolbar": ‹ › Today, title, filters, Month/Week/Day. The day view only filters by platform. */
export function CalendarToolbar({ view, date, filters, onShift, onToday, onViewChange, onFiltersChange, className }: CalendarToolbarProps) {
  const title = view === 'month' ? monthTitle(date) : view === 'week' ? weekTitle(date) : dayTitle(date, CALENDAR_TODAY)
  return (
    <div className={cn('flex flex-wrap items-center gap-2 border-b px-4 py-3', className)}>
      <Button variant="outline" size="icon" aria-label={`Previous ${LABEL[view]}`} className="shadow-none" onClick={() => onShift(-1)}>
        <ChevronLeft />
      </Button>
      <Button variant="outline" size="icon" aria-label={`Next ${LABEL[view]}`} className="shadow-none" onClick={() => onShift(1)}>
        <ChevronRight />
      </Button>
      <Button variant="outline" size="sm" onClick={onToday}>
        Today
      </Button>
      <h2 aria-live="polite" className="text-h2 whitespace-nowrap text-foreground">
        {title}
      </h2>
      {view === 'day' && date === CALENDAR_TODAY && <Badge variant="accent">Today</Badge>}
      <div className="min-w-0 flex-1" />
      <PlatformFilter value={filters.platform} onChange={(platform) => onFiltersChange({ platform })} />
      {view !== 'day' && (
        <>
          <StatusFilter value={filters.status} onChange={(status) => onFiltersChange({ status })} />
          <AccountFilter value={filters.account} onChange={(account) => onFiltersChange({ account })} />
        </>
      )}
      <SegmentedControl aria-label="Calendar view" value={view} options={VIEW_OPTIONS} onValueChange={onViewChange} />
    </div>
  )
}
