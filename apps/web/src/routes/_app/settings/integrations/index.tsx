import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/layout/route-states'
import { Topbar } from '@/components/layout/topbar'

export const Route = createFileRoute('/_app/settings/integrations/')({
  component: () => (
    <>
      <Topbar breadcrumb={[{ label: 'Settings', to: '/settings' }, { label: 'Integrations' }]} />
      <PagePlaceholder title="Social integrations" />
    </>
  ),
})
