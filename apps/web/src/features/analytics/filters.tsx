import { getRouteApi } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { PlatformLogo } from '@/components/platform-logo'
import { SegmentedControl } from '@/components/segmented-control'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useMediaQuery } from '@/hooks/use-media-query'
import { PLATFORM_LABEL, type Platform } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ACCOUNTS, accountPlatforms, DATA_END, DATA_START, MAX_RANGE_DAYS, PLATFORMS, resolveFilters, useRefreshAnalytics, type AnalyticsRange } from './api'
import { rangeLabel, relativeTime } from './format'

const route = getRouteApi('/_app/analytics')

const RANGE_OPTIONS = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'custom', label: 'Custom' },
] as const

const toDate = (iso: string) => parseISO(iso)
const toIso = (d: Date) => format(d, 'yyyy-MM-dd')
const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1

const desktopQuery = '(min-width: 768px)'
const useIsDesktop = () => useMediaQuery(desktopQuery)

/** Date range / platform / account filters — all URL state — plus the data freshness control. */
export function AnalyticsFilterBar({ refreshedAt, now }: { refreshedAt?: number; now: number }) {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { from, to } = resolveFilters(search)
  const range: AnalyticsRange = search.range ?? '30d'
  const platform = search.platform ?? 'all'
  const account = search.account ?? 'all'
  const [pickerOpen, setPickerOpen] = useState(false)

  const setRange = (value: AnalyticsRange) => {
    if (value === 'custom') return setPickerOpen(true)
    navigate({ search: (prev) => ({ ...prev, range: value === '30d' ? undefined : value, from: undefined, to: undefined }), replace: true })
  }
  const setCustom = (start: string, end: string) =>
    navigate({ search: (prev) => ({ ...prev, range: 'custom' as const, from: start, to: end }), replace: true })
  const setPlatform = (value: string) => {
    const next = value === 'all' ? undefined : (value as Platform)
    // Drop an account that doesn't publish to the newly selected platform.
    const keepAccount = !next || account === 'all' || accountPlatforms(account).includes(next)
    navigate({ search: (prev) => ({ ...prev, platform: next, account: keepAccount ? prev.account : undefined }), replace: true })
  }
  const setAccount = (value: string) => navigate({ search: (prev) => ({ ...prev, account: value === 'all' ? undefined : value }), replace: true })

  const accounts = ACCOUNTS.filter((a) => platform === 'all' || accountPlatforms(a.value).includes(platform))

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedControl aria-label="Date range" value={range} options={RANGE_OPTIONS} onValueChange={setRange} className="hidden md:inline-flex" />
      <SegmentedControl aria-label="Date range" value={range} options={RANGE_OPTIONS} onValueChange={setRange} fill className="md:hidden" />
      <DateRangePicker open={pickerOpen} onOpenChange={setPickerOpen} from={from} to={to} onApply={setCustom} />
      <div className="flex w-full gap-2 md:contents">
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger aria-label="Platform" className="min-w-0 flex-1 md:flex-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            <SelectItem value="all">All platforms</SelectItem>
            {PLATFORMS.map((p) => (
              <SelectItem key={p} value={p}>
                <PlatformLogo platform={p} size={16} />
                {PLATFORM_LABEL[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={account} onValueChange={setAccount}>
          <SelectTrigger aria-label="Account" className="min-w-0 flex-1 md:flex-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            <SelectItem value="all">All accounts</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="hidden flex-1 md:block" />
      <RefreshStatus refreshedAt={refreshedAt} now={now} />
    </div>
  )
}

function DateRangePicker({ open, onOpenChange, from, to, onApply }: { open: boolean; onOpenChange: (open: boolean) => void; from: string; to: string; onApply: (from: string, to: string) => void }) {
  const desktop = useIsDesktop()
  const [draft, setDraft] = useState<DateRange | undefined>()
  const [month, setMonth] = useState<Date>()
  // Seed the draft from the URL each time the picker opens (trigger click or the "Custom" segment).
  if (open && !draft) {
    const end = toDate(to)
    setDraft({ from: toDate(from), to: end })
    // Two months on desktop: the end month sits on the right.
    setMonth(desktop ? new Date(end.getFullYear(), end.getMonth() - 1, 1) : end)
  }
  if (!open && draft) setDraft(undefined)
  const handleOpenChange = onOpenChange

  const complete = draft?.from && draft.to
  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" aria-label="Date range" className="w-full justify-between pr-2.5 pl-3 font-normal md:w-auto">
          {rangeLabel(from, to)}
          <ChevronDown className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto overflow-hidden rounded-xl p-0">
        <Calendar
          mode="range"
          numberOfMonths={desktop ? 2 : 1}
          month={month}
          onMonthChange={setMonth}
          startMonth={toDate(DATA_START)}
          endMonth={toDate(DATA_END)}
          disabled={[{ before: toDate(DATA_START) }, { after: toDate(DATA_END) }]}
          max={MAX_RANGE_DAYS}
          selected={draft}
          onSelect={setDraft}
        />
        <div className="flex items-center gap-2 border-t bg-canvas px-3 py-2.5">
          <p className="min-w-0 flex-1 truncate text-caption text-tertiary">
            {complete ? `${rangeLabel(toIso(draft.from!), toIso(draft.to!))} · ${daysBetween(draft.from!, draft.to!)} days` : `Pick a start and end date (up to ${MAX_RANGE_DAYS} days)`}
          </p>
          <Button variant="ghost" size="sm" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!complete}
            onClick={() => {
              onApply(toIso(draft!.from!), toIso(draft!.to!))
              handleOpenChange(false)
            }}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** Figma "Data refreshed 14 min ago" — click to re-sync every platform. */
function RefreshStatus({ refreshedAt, now }: { refreshedAt?: number; now: number }) {
  const refresh = useRefreshAnalytics()
  if (refreshedAt === undefined) return <Skeleton className="h-3 w-36 rounded-sm" />
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled={refresh.isPending}
          onClick={() => refresh.mutate()}
          className={cn(
            'rounded-sm text-caption whitespace-nowrap text-tertiary outline-none hover:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-progress',
            refresh.isPending && 'animate-pulse',
          )}
        >
          {refresh.isPending ? 'Refreshing data from each platform…' : `Data refreshed ${relativeTime(refreshedAt, now)}`}
        </button>
      </TooltipTrigger>
      <TooltipContent>Refresh now</TooltipContent>
    </Tooltip>
  )
}
