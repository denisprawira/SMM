import { createFileRoute } from '@tanstack/react-router'
import { OVERVIEW_RANGES, overviewQueryOptions, type OverviewRange, type OverviewSearch } from '@/features/overview/api'
import { OverviewPage } from '@/features/overview/overview-page'

export const Route = createFileRoute('/_app/')({
  validateSearch: (search: Record<string, unknown>): OverviewSearch => ({
    range: OVERVIEW_RANGES.includes(search.range as OverviewRange) ? (search.range as OverviewRange) : undefined,
    account: typeof search.account === 'string' && search.account !== 'all' ? search.account : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(overviewQueryOptions(deps)),
  head: () => ({ meta: [{ title: 'Overview · Relay' }] }),
  component: OverviewPage,
})
