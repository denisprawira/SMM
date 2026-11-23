import { createFileRoute } from '@tanstack/react-router'
import {
  ACCOUNTS,
  ANALYTICS_RANGES,
  analyticsQueryOptions,
  isSelectableDay,
  MAX_RANGE_DAYS,
  PLATFORMS,
  resolveFilters,
  SORT_KEYS,
  type AnalyticsRange,
  type AnalyticsSearch,
  type SortKey,
} from '@/features/analytics/api'
import { AnalyticsPage, AnalyticsPending } from '@/features/analytics/analytics-page'
import type { Platform } from '@/lib/types'

const str = (v: unknown) => (typeof v === 'string' ? v : undefined)

function validCustomRange(from?: string, to?: string) {
  if (!from || !to || !isSelectableDay(from) || !isSelectableDay(to) || from > to) return false
  return (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1 <= MAX_RANGE_DAYS
}

export const Route = createFileRoute('/_app/analytics')({
  validateSearch: (search: Record<string, unknown>): AnalyticsSearch => {
    const range = str(search.range) as AnalyticsRange | undefined
    const from = str(search.from)
    const to = str(search.to)
    const custom = range === 'custom' && validCustomRange(from, to)
    const platform = str(search.platform) as Platform | undefined
    const account = str(search.account)
    const sort = str(search.sort) as SortKey | undefined
    return {
      range: range && ANALYTICS_RANGES.includes(range) && range !== '30d' && (range !== 'custom' || custom) ? range : undefined,
      from: custom ? from : undefined,
      to: custom ? to : undefined,
      platform: platform && PLATFORMS.includes(platform) ? platform : undefined,
      account: account && ACCOUNTS.some((a) => a.value === account) ? account : undefined,
      sort: sort && SORT_KEYS.includes(sort) && sort !== 'views' ? sort : undefined,
    }
  },
  // Sorting is client-side, so only the server filters are loader deps.
  loaderDeps: ({ search }) => resolveFilters(search),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(analyticsQueryOptions(deps)),
  head: () => ({ meta: [{ title: 'Analytics · Relay' }] }),
  pendingMs: 150,
  pendingMinMs: 400,
  pendingComponent: AnalyticsPending,
  component: AnalyticsPage,
})
