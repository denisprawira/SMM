import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isSameYear,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'

/**
 * All calendar times are wall-clock times in the workspace time zone, stored as
 * `YYYY-MM-DDTHH:mm` (no offset) and parsed as local dates — never shifted.
 */
export const WEEK_OPTS = { weekStartsOn: 1 } as const

export const toDateKey = (d: Date) => format(d, 'yyyy-MM-dd')
export const toDateTime = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm")
export const parseKey = (s: string) => parseISO(s)
export const dateOf = (at: string) => at.slice(0, 10)
export const minutesOf = (at: string) => Number(at.slice(11, 13)) * 60 + Number(at.slice(14, 16))
export const withMinutes = (dateKey: string, minutes: number) =>
  `${dateKey}T${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

export function isDateKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value))
}

/** "4:30 PM" */
export const formatTime = (at: string) => format(parseISO(at), 'h:mm a')
/** "4:30 PM" from minutes since midnight. */
export const formatMinutes = (minutes: number) => formatTime(withMinutes('2000-01-01', minutes))
/** "Fri, Nov 21 · 12:30 PM" */
export const formatWhen = (at: string) => format(parseISO(at), 'EEE, MMM d · h:mm a')
/** "Fri, Nov 21, 2025" */
export const formatLongDate = (dateKey: string) => format(parseISO(dateKey), 'EEE, MMM d, yyyy')
/** Hour gutter label: "9 AM", "12 PM". */
export const formatHour = (hour: number) => format(new Date(2000, 0, 1, hour), 'h a')

export const monthKeyOf = (dateKey: string) => dateKey.slice(0, 7)

/** Monday-first weeks covering the month (5 or 6 rows). */
export function monthGrid(dateKey: string): Date[][] {
  const d = parseISO(dateKey)
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(d), WEEK_OPTS), end: endOfWeek(endOfMonth(d), WEEK_OPTS) })
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  return weeks
}

/** First and last date keys of the month grid that contains `dateKey`. */
export function monthGridRange(monthKey: string) {
  const d = parseISO(`${monthKey}-01`)
  return { from: toDateKey(startOfWeek(startOfMonth(d), WEEK_OPTS)), to: toDateKey(endOfWeek(endOfMonth(d), WEEK_OPTS)) }
}

export function weekDays(dateKey: string): Date[] {
  const start = startOfWeek(parseISO(dateKey), WEEK_OPTS)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

/** "November 2025" */
export const monthTitle = (dateKey: string) => format(parseISO(dateKey), 'MMMM yyyy')

/** "Nov 17 – 23, 2025", "Nov 24 – Dec 7, 2025", "Dec 29, 2025 – Jan 4, 2026" */
export function weekTitle(dateKey: string) {
  const [start, , , , , , end] = weekDays(dateKey)
  if (!isSameYear(start, end)) return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`
  if (!isSameMonth(start, end)) return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
  return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`
}

/** "Friday, November 21" (+ year when it isn't the current year). */
export function dayTitle(dateKey: string, todayKey: string) {
  const d = parseISO(dateKey)
  return format(d, isSameYear(d, parseISO(todayKey)) ? 'EEEE, MMMM d' : 'EEEE, MMMM d, yyyy')
}

export function shiftDate(dateKey: string, view: 'month' | 'week' | 'day', dir: 1 | -1) {
  const d = parseISO(dateKey)
  const next = view === 'month' ? addMonths(d, dir) : view === 'week' ? addWeeks(d, dir) : addDays(d, dir)
  return toDateKey(next)
}
