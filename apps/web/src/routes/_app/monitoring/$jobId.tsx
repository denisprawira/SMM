import { createFileRoute } from '@tanstack/react-router'
import { jobDetailQueryOptions } from '@/features/monitoring/api'
import { JobDrawerError, JobDrawerPending, JobDrawerRoute } from '@/features/monitoring/components/job-drawer'

/** Job details drawer (Sheet) over the monitoring list — rendered into MonitoringPage's <Outlet/>. */
export const Route = createFileRoute('/_app/monitoring/$jobId')({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(jobDetailQueryOptions(params.jobId)),
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData ? `${loaderData.post.title} · ` : ''}Post Monitoring · Relay` }] }),
  pendingComponent: JobDrawerPending,
  errorComponent: JobDrawerError,
  component: JobDrawerRoute,
})
