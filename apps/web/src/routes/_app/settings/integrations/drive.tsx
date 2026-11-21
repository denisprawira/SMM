import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/layout/route-states'
import { Topbar } from '@/components/layout/topbar'

export const Route = createFileRoute('/_app/settings/integrations/drive')({
  component: () => (
    <>
      <Topbar breadcrumb={[{ label: 'Settings', to: '/settings' }, { label: 'Integrations', to: '/settings/integrations' }, { label: 'Google Drive' }]} />
      <PagePlaceholder title="Google Drive" />
    </>
  ),
})
