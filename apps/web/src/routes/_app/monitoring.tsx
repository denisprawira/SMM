import { createFileRoute } from '@tanstack/react-router'
import { jobsQueryOptions, parseMonitoringSearch } from '@/features/monitoring/api'
import { MonitoringPage } from '@/features/monitoring/monitoring-page'

/** Post Monitoring. Status tab, filters, search, grouping and page live in the URL; `/monitoring/$jobId` opens the job drawer. */
export const Route = createFileRoute('/_app/monitoring')({
  validateSearch: parseMonitoringSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(jobsQueryOptions(deps)),
  head: () => ({ meta: [{ title: 'Post Monitoring · Relay' }] }),
  component: MonitoringPage,
})
