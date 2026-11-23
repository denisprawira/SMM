import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MobileFilterButton, Topbar } from '@/components/layout/topbar'
import { PageContent } from '@/components/page'
import { Button } from '@/components/ui/button'
import { CALENDAR_TODAY, calendarQueryOptions, filterPosts, hasFilters, type CalendarFilters, type CalendarSearch, type CalendarView } from './api'
import { CalendarActionsProvider } from './components/calendar-actions-provider'
import { CalendarToolbar } from './components/calendar-toolbar'
import { DayView } from './components/day-view'
import { MobileAgenda } from './components/mobile-agenda'
import { FilterSheet } from './components/mobile-header'
import { MonthView } from './components/month-view'
import { StatusLegend } from './components/parts'
import { WeekView } from './components/week-view'
import { monthKeyOf, shiftDate } from './date-utils'

const route = getRouteApi('/_app/calendar')

function description(view: CalendarView, date: string) {
  if (view === 'month') return 'Every chip is one target — a platform and account. Drag to reschedule.'
  if (view === 'week') return 'Every block is one post; logos show its targets. Drag to reschedule, drag edges to adjust.'
  return `${format(parseISO(date), 'EEEE')}’s queue, with the status of every target.`
}

export function CalendarPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const date = search.date ?? CALENDAR_TODAY
  const view = search.view ?? 'month'
  const { platform, status, account } = search
  const filters: CalendarFilters = useMemo(() => ({ platform, status, account }), [platform, status, account])
  const { data: allPosts } = useSuspenseQuery(calendarQueryOptions(monthKeyOf(date)))
  const posts = useMemo(() => filterPosts(allPosts, filters), [allPosts, filters])
  // The day view's toolbar only filters by platform.
  const dayPosts = useMemo(() => filterPosts(allPosts, { platform }), [allPosts, platform])

  const go = (patch: Partial<CalendarSearch>, replace = false) =>
    navigate({
      search: (prev) => {
        const next = { ...prev, ...patch }
        return { ...next, date: next.date === CALENDAR_TODAY ? undefined : next.date }
      },
      replace,
    })
  const setDate = (next: string) => go({ date: next, post: undefined })
  const setFilters = (patch: Partial<CalendarFilters>) => go(patch, true)
  const clearFilters = () => go({ platform: undefined, status: undefined, account: undefined }, true)

  return (
    <CalendarActionsProvider posts={allPosts}>
      <Topbar
        breadcrumb={[{ label: 'Publishing Calendar' }]}
        mobileTitle="Calendar"
        mobileActions={<MobileFilterButton activeFilters={[platform, status, account].filter(Boolean).length} onClick={() => setFiltersOpen(true)} />}
      />
      <FilterSheet open={filtersOpen} onOpenChange={setFiltersOpen} filters={filters} onChange={setFilters} onClear={clearFilters} />

      <PageContent className="xl:gap-5">
        <header className="hidden items-end gap-3 md:flex">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-h1 text-foreground">Publishing Calendar</h1>
            <p className="text-body text-muted-foreground">{description(view, date)}</p>
          </div>
          <div className="min-w-0 flex-1" />
          {view === 'month' && <StatusLegend className="hidden xl:flex" />}
          <Button asChild className="xl:hidden">
            <Link to="/create">
              <Plus />
              Create post
            </Link>
          </Button>
        </header>

        <div className="hidden md:block">
          {view === 'day' ? (
            <DayView
              date={date}
              posts={dayPosts}
              platform={platform}
              filtered={Boolean(platform)}
              selectedPostId={search.post}
              onSelectPost={(post) => go({ post }, true)}
              onDateChange={setDate}
              onClearFilters={clearFilters}
              toolbar={
                <CalendarToolbar
                  view="day"
                  date={date}
                  filters={filters}
                  onShift={(dir) => setDate(shiftDate(date, 'day', dir))}
                  onToday={() => setDate(CALENDAR_TODAY)}
                  onViewChange={(v) => go({ view: v })}
                  onFiltersChange={setFilters}
                />
              }
            />
          ) : (
            <section aria-label="Calendar" className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs">
              <CalendarToolbar
                view={view}
                date={date}
                filters={filters}
                onShift={(dir) => setDate(shiftDate(date, view, dir))}
                onToday={() => setDate(CALENDAR_TODAY)}
                onViewChange={(v) => go({ view: v })}
                onFiltersChange={setFilters}
              />
              {view === 'month' ? (
                <MonthView date={date} posts={posts} filtered={hasFilters(filters)} onClearFilters={clearFilters} onOpenDay={(d) => go({ view: 'day', date: d, post: undefined })} />
              ) : (
                <WeekView date={date} posts={posts} filtered={hasFilters(filters)} onClearFilters={clearFilters} onOpenDay={(d) => go({ view: 'day', date: d, post: undefined })} />
              )}
            </section>
          )}
        </div>

        <MobileAgenda
          className="md:hidden"
          view={search.view ?? 'week'}
          date={date}
          posts={posts}
          filtered={hasFilters(filters)}
          onClearFilters={clearFilters}
          onDateChange={setDate}
          onViewChange={(v) => go({ view: v })}
        />
      </PageContent>
    </CalendarActionsProvider>
  )
}
