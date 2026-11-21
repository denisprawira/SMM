import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/layout/route-states'
import { Topbar } from '@/components/layout/topbar'

export const Route = createFileRoute('/_app/monitoring')({
  component: () => (
    <>
      <Topbar breadcrumb={[{ label: 'Post Monitoring' }]} />
      <PagePlaceholder title="Post Monitoring" />
    </>
  ),
})
