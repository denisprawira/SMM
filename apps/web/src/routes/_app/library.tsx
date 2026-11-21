import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/layout/route-states'
import { Topbar } from '@/components/layout/topbar'

export const Route = createFileRoute('/_app/library')({
  component: () => (
    <>
      <Topbar breadcrumb={[{ label: 'Content Library' }]} />
      <PagePlaceholder title="Content Library" />
    </>
  ),
})
