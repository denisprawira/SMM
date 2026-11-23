import { createFileRoute } from '@tanstack/react-router'
import {
  CALENDAR_ACCOUNTS,
  CALENDAR_PLATFORMS,
  CALENDAR_STATUSES,
  CALENDAR_TODAY,
  CALENDAR_VIEWS,
  calendarQueryOptions,
  type CalendarSearch,
  type CalendarStatus,
  type CalendarView,
} from '@/features/calendar/api'
import { CalendarPage } from '@/features/calendar/calendar-page'
import { isDateKey, monthKeyOf } from '@/features/calendar/date-utils'
import type { Platform } from '@/lib/types'

const oneOf = <T extends string>(list: readonly T[], value: unknown) => (list.includes(value as T) ? (value as T) : undefined)

export const Route = createFileRoute('/_app/calendar')({
  validateSearch: (search: Record<string, unknown>): CalendarSearch => ({
    view: oneOf<CalendarView>(CALENDAR_VIEWS, search.view),
    date: isDateKey(search.date) && search.date !== CALENDAR_TODAY ? search.date : undefined,
    platform: oneOf<Platform>(CALENDAR_PLATFORMS, search.platform),
    status: oneOf<CalendarStatus>(CALENDAR_STATUSES, search.status),
    account: oneOf(CALENDAR_ACCOUNTS.map((a) => a.id), search.account),
    post: typeof search.post === 'string' && search.post ? search.post : undefined,
  }),
  loaderDeps: ({ search }) => ({ month: monthKeyOf(search.date ?? CALENDAR_TODAY) }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(calendarQueryOptions(deps.month)),
  head: () => ({ meta: [{ title: 'Publishing Calendar · Relay' }] }),
  component: CalendarPage,
})
